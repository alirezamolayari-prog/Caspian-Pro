import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, beforeEach, describe, it } from 'node:test';
import { createApp } from '../src/app.ts';
import { Auth, OTP_MAX_TRIES } from '../src/auth.ts';
import { loadConfig } from '../src/config.ts';
import { openDb, type Db } from '../src/db.ts';
import { normalizePhone } from '../src/domain.ts';
import { runParkingReminders } from '../src/jobs.ts';
import {
  parseSubscription,
  type ParkingAdapter,
  type ParkingSubscription,
} from '../src/parking.ts';
import { createPusher } from '../src/push.ts';
import { Services } from '../src/services.ts';
import type { SmsProvider } from '../src/sms.ts';

const DAY = 86_400_000;
const uploads = mkdtempSync(join(tmpdir(), 'caspian-'));
after(() => rmSync(uploads, { recursive: true, force: true }));

function setup(parkingSub: ParkingSubscription | null = null) {
  const db: Db = openDb(':memory:');
  const config = loadConfig({
    adminToken: 'admin-secret',
    securityPhones: ['09120000000'],
    staticDir: null,
  });
  const pushed: { endpoint: string; body: unknown }[] = [];
  const pusher = createPusher(config, db, async (sub, body) => {
    pushed.push({ endpoint: sub.endpoint, body: JSON.parse(body) });
  });
  const services = new Services(db, pusher, uploads);
  const codes = new Map<string, string>();
  const texts: { phone: string; message: string }[] = [];
  const sms: SmsProvider = {
    async sendOtp(phone, code) {
      codes.set(phone, code);
    },
    async send(phone, message) {
      texts.push({ phone, message });
    },
  };
  const auth = new Auth(db, services, sms);
  const parking: ParkingAdapter = { getSubscription: async () => parkingSub };
  const app = createApp({ config, services, auth, parking, sms });
  services.upsertStore(
    {
      id: 'u24',
      name: 'مبلمان رویال',
      unit: '24',
      floor: 'همکف',
      manager: 'آقای رضایی',
      category: 'مبلمان',
    },
    ['09121112233'],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test responses are read loosely
  type Json = Record<string, any>;
  const call = async (method: string, path: string, body?: unknown, token?: string) => {
    const res = await app.request(path, {
      method,
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: (await res.json()) as Json };
  };

  const login = async (phone = '09121112233') => {
    await call('POST', '/api/auth/otp', { phone });
    const r = await call('POST', '/api/auth/verify', { phone, code: codes.get(phone) });
    return r.body.token as string;
  };

  return { db, app, services, call, login, codes, texts, pushed, auth };
}

describe('phone numbers', () => {
  it('normalises Iranian mobiles', () => {
    assert.equal(normalizePhone('۰۹۱۲ ۱۱۱ ۲۲۳۳'), '09121112233');
    assert.equal(normalizePhone('+989121112233'), '09121112233');
    assert.equal(normalizePhone('9121112233'), '09121112233');
    assert.equal(normalizePhone('0212223344'), null);
    assert.equal(normalizePhone(42), null);
  });
});

describe('login', () => {
  let t: ReturnType<typeof setup>;
  beforeEach(() => {
    t = setup();
  });

  it('logs in a registered phone and returns the store', async () => {
    const otp = await t.call('POST', '/api/auth/otp', { phone: '+98 912 111 2233' });
    assert.equal(otp.status, 200);
    const code = t.codes.get('09121112233')!;
    const faCode = code.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]!);
    const v = await t.call('POST', '/api/auth/verify', { phone: '09121112233', code: faCode });
    assert.equal(v.status, 200);
    assert.equal(v.body.store.name, 'مبلمان رویال');
    const me = await t.call('GET', '/api/me', undefined, v.body.token);
    assert.equal(me.body.store.unit, '24');
  });

  it('rejects unknown phones and early resends', async () => {
    assert.equal((await t.call('POST', '/api/auth/otp', { phone: '09350000000' })).status, 404);
    await t.call('POST', '/api/auth/otp', { phone: '09121112233' });
    const again = await t.call('POST', '/api/auth/otp', { phone: '09121112233' });
    assert.equal(again.status, 429);
    assert.ok(again.body.retryIn > 0);
  });

  it('locks the code after too many wrong tries', async () => {
    await t.call('POST', '/api/auth/otp', { phone: '09121112233' });
    const code = t.codes.get('09121112233')!;
    for (let i = 0; i < OTP_MAX_TRIES; i++) {
      await t.call('POST', '/api/auth/verify', {
        phone: '09121112233',
        code: '00000' === code ? '11111' : '00000',
      });
    }
    const r = await t.call('POST', '/api/auth/verify', { phone: '09121112233', code });
    assert.equal(r.status, 401);
    assert.equal(r.body.error, 'locked');
  });

  it('expires codes', () => {
    const now = Date.now();
    return t.auth.requestOtp('09121112233', now).then(() => {
      const r = t.auth.verifyOtp('09121112233', t.codes.get('09121112233')!, now + 3 * 60_000);
      assert.deepEqual(r, { ok: false, reason: 'expired' });
    });
  });

  it('requires a session for tenant routes and ends it on logout', async () => {
    assert.equal((await t.call('GET', '/api/tickets')).status, 401);
    const token = await t.login();
    assert.equal((await t.call('POST', '/api/auth/logout', {}, token)).status, 200);
    assert.equal((await t.call('GET', '/api/tickets', undefined, token)).status, 401);
  });

  it('drops sessions when the phone is removed from the store', async () => {
    const token = await t.login();
    t.services.upsertStore(
      {
        id: 'u24',
        name: 'مبلمان رویال',
        unit: '24',
        floor: 'همکف',
        manager: 'آقای رضایی',
        category: '',
      },
      [],
    );
    assert.equal((await t.call('GET', '/api/me', undefined, token)).status, 401);
  });
});

describe('tickets and notifications', () => {
  let t: ReturnType<typeof setup>;
  let token: string;
  beforeEach(async () => {
    t = setup();
    token = await t.login();
  });

  it('creates a ticket once per clientId (safe retries)', async () => {
    const input = {
      module: 'services',
      title: 'خروج کالا',
      details: ['۳ دست مبل'],
      clientId: 'c-1',
    };
    const a = await t.call('POST', '/api/tickets', input, token);
    const b = await t.call('POST', '/api/tickets', input, token);
    assert.equal(a.status, 201);
    assert.equal(b.status, 200);
    assert.equal(a.body.ticket.id, b.body.ticket.id);
    assert.match(a.body.ticket.id, /^CSP-\d{6}$/);
    const list = await t.call('GET', '/api/tickets', undefined, token);
    assert.equal(list.body.items.length, 1);
    const notes = await t.call('GET', '/api/notifications', undefined, token);
    assert.equal(notes.body.items.length, 1);
  });

  it('validates input', async () => {
    assert.equal(
      (await t.call('POST', '/api/tickets', { module: 'nope', title: 'x' }, token)).status,
      400,
    );
    assert.equal(
      (await t.call('POST', '/api/tickets', { module: 'support', title: '  ' }, token)).status,
      400,
    );
    assert.equal(
      (
        await t.call(
          'POST',
          '/api/tickets',
          { module: 'maintenance', title: 'x', photos: ['data:text/html;base64,AA=='] },
          token,
        )
      ).status,
      400,
    );
  });

  it('stores photos and shows them to management', async () => {
    const png = 'data:image/png;base64,' + Buffer.from('fakepng').toString('base64');
    const r = await t.call(
      'POST',
      '/api/tickets',
      { module: 'maintenance', title: 'آسانسور', details: [], photos: [png] },
      token,
    );
    assert.equal(r.body.ticket.photos, 1);
    const list = await t.call(
      'GET',
      `/api/admin/tickets/${r.body.ticket.id}/photos`,
      undefined,
      'admin-secret',
    );
    assert.equal(list.body.items.length, 1);
    const img = await t.app.request(
      `/api/admin/tickets/${r.body.ticket.id}/photos/${list.body.items[0].id}`,
      {
        headers: { authorization: 'Bearer admin-secret' },
      },
    );
    assert.equal(img.headers.get('content-type'), 'image/png');
    assert.equal(Buffer.from(await img.arrayBuffer()).toString(), 'fakepng');
  });

  it('management status change notifies and pushes to the store devices', async () => {
    await t.call(
      'POST',
      '/api/push/subscribe',
      { endpoint: 'https://push.example/abc', keys: { p256dh: 'k', auth: 'a' } },
      token,
    );
    const { body } = await t.call(
      'POST',
      '/api/tickets',
      { module: 'support', title: 'پیام', details: [] },
      token,
    );
    assert.equal(
      (
        await t.call(
          'PATCH',
          `/api/admin/tickets/${body.ticket.id}`,
          { status: 'approved' },
          'wrong',
        )
      ).status,
      403,
    );
    const r = await t.call(
      'PATCH',
      `/api/admin/tickets/${body.ticket.id}`,
      { status: 'approved' },
      'admin-secret',
    );
    assert.equal(r.body.ticket.status, 'approved');
    assert.equal(t.pushed.length, 1);
    assert.equal((t.pushed[0]!.body as { url: string }).url, '#/requests');
    const notes = await t.call('GET', '/api/notifications', undefined, token);
    assert.match(notes.body.items[0].title, /تایید شد/);
    await t.call('POST', '/api/notifications/read', { all: true }, token);
    const after = await t.call('GET', '/api/notifications', undefined, token);
    assert.ok(after.body.items.every((n: { read: boolean }) => n.read));
  });

  it('emergency dispatch texts security once', async () => {
    const a = await t.call('POST', '/api/security/dispatch', { clientId: 'sos-1' }, token);
    await t.call('POST', '/api/security/dispatch', { clientId: 'sos-1' }, token);
    assert.equal(a.body.ticket.status, 'in_review');
    assert.equal(t.texts.length, 1);
    assert.match(t.texts[0]!.message, /پلاک 24/);
  });

  it('announcements reach every store', async () => {
    const r = await t.call(
      'POST',
      '/api/admin/announce',
      { title: 'جشنواره', body: 'از ۱ آبان' },
      'admin-secret',
    );
    assert.equal(r.body.stores, 1);
    const notes = await t.call('GET', '/api/notifications', undefined, token);
    assert.equal(notes.body.items[0].kind, 'management');
  });

  it('admin can add stores with phones', async () => {
    const r = await t.call(
      'PUT',
      '/api/admin/stores/u30',
      {
        name: 'خواب ناز',
        unit: '۳۰',
        floor: 'اول',
        manager: 'خانم احمدی',
        phones: ['09351234567'],
      },
      'admin-secret',
    );
    assert.equal(r.status, 200);
    const stores = await t.call('GET', '/api/admin/stores', undefined, 'admin-secret');
    const s = stores.body.items.find((x: { id: string }) => x.id === 'u30');
    assert.equal(s.unit, '30');
    assert.deepEqual(s.phones, ['09351234567']);
  });
});

describe('parking', () => {
  const sub = (endsInDays: number): ParkingSubscription => {
    const now = Date.now();
    return {
      plan: 'ماهانه',
      startsAt: now - 20 * DAY,
      endsAt: now + endsInDays * DAY,
      vehiclesAllowed: 1,
      floor: 'پارکینگ ۱',
      plates: [],
      recentVisits: [],
      updatedAt: now,
    };
  };

  it('serves the subscription and 404 when there is none', async () => {
    const t = setup(sub(10));
    const token = await t.login();
    assert.equal((await t.call('GET', '/api/parking', undefined, token)).body.plan, 'ماهانه');
    const none = setup(null);
    assert.equal(
      (await none.call('GET', '/api/parking', undefined, await none.login())).status,
      404,
    );
  });

  it('sends the reminder once inside the reminder window', async () => {
    const t = setup();
    const fixed = sub(5);
    const stable: ParkingAdapter = { getSubscription: async () => fixed };
    assert.equal(await runParkingReminders(t.db, t.services, stable, 7), 1);
    assert.equal(await runParkingReminders(t.db, t.services, stable, 7), 0);
    const far = setup();
    assert.equal(
      await runParkingReminders(far.db, far.services, { getSubscription: async () => sub(20) }, 7),
      0,
    );
  });

  it('parses vendor data with ISO dates', () => {
    const s = parseSubscription({
      startsAt: '2026-10-01T00:00:00Z',
      endsAt: '2026-11-01T00:00:00Z',
      plates: [{ two: 12, letter: 'ب', three: 345, region: 67 }],
    });
    assert.equal(s.plates[0]!.two, '12');
    assert.equal(s.endsAt, Date.parse('2026-11-01T00:00:00Z'));
    assert.throws(() => parseSubscription({}));
  });
});

describe('android', () => {
  it('assetlinks is empty until fingerprints are configured', async () => {
    const t = setup();
    const r = await t.app.request('/.well-known/assetlinks.json');
    assert.deepEqual(await r.json(), []);
  });
});

describe('web push delivery', () => {
  it('builds an encrypted, VAPID-signed request with the configured keys', async () => {
    const webpush = (await import('web-push')).default;
    const { createECDH, randomBytes } = await import('node:crypto');
    const keys = webpush.generateVAPIDKeys();
    const ecdh = createECDH('prime256v1');
    ecdh.generateKeys();
    const sub = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      keys: {
        p256dh: ecdh.getPublicKey().toString('base64url'),
        auth: randomBytes(16).toString('base64url'),
      },
    };
    const details = webpush.generateRequestDetails(
      sub,
      JSON.stringify({ title: 'سلام', body: 'تست', url: '#/requests' }),
      {
        TTL: 3600,
        vapidDetails: {
          subject: 'mailto:test@caspian.ir',
          publicKey: keys.publicKey,
          privateKey: keys.privateKey,
        },
      },
    );
    assert.equal(details.headers['Content-Encoding'], 'aes128gcm');
    assert.match(String(details.headers.Authorization), /^vapid t=.+, k=/);
    assert.ok((details.body as Buffer).length > 100);

    const db = openDb(':memory:');
    const config = loadConfig({
      staticDir: null,
      vapid: {
        publicKey: keys.publicKey,
        privateKey: keys.privateKey,
        subject: 'mailto:t@c.ir',
        proxy: '',
      },
    });
    const pusher = createPusher(config, db);
    assert.equal(pusher.enabled, true);
    assert.equal(pusher.publicKey, keys.publicKey);
  });

  it('forgets subscriptions the push service says are gone', async () => {
    const db = openDb(':memory:');
    const config = loadConfig({ staticDir: null });
    const pusher = createPusher(config, db, async () => {
      throw Object.assign(new Error('gone'), { statusCode: 410 });
    });
    const services = new Services(db, pusher, null);
    services.upsertStore(
      { id: 'u1', name: 'غرفه', unit: '1', floor: 'همکف', manager: 'آقای الف', category: '' },
      [],
    );
    services.savePushSub('u1', '09120000001', { endpoint: 'https://x/1', p256dh: 'k', auth: 'a' });
    await pusher.toStore('u1', { title: 't', body: 'b', url: '#/' });
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM push_subs').get()!.n, 0);
  });
});
