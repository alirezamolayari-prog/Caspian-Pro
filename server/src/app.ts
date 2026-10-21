/** HTTP API (Hono). All tenant routes need `Authorization: Bearer <token>`. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { timingSafeEqual } from 'node:crypto';
import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import type { Auth, Session } from './auth.ts';
import type { Config } from './config.ts';
import {
  isLink,
  isModule,
  isStatus,
  normalizePhone,
  text,
  toEn,
  toFa,
  type Store,
} from './domain.ts';
import { runParkingReminders } from './jobs.ts';
import type { ParkingAdapter } from './parking.ts';
import type { Photo, Services } from './services.ts';
import type { SmsProvider } from './sms.ts';

export const API_VERSION = '1.2.0';

export interface Deps {
  config: Config;
  services: Services;
  auth: Auth;
  parking: ParkingAdapter;
  sms: SmsProvider;
}

type Env = { Variables: { session: Session } };

const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

const fail = (
  c: Context,
  status: 400 | 401 | 403 | 404 | 409 | 413 | 429 | 502,
  error: string,
  message: string,
) => c.json({ error, message }, status);

const bearer = (c: Context) => {
  const h = c.req.header('authorization') ?? '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : undefined;
};

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

async function json(c: Context): Promise<Record<string, unknown>> {
  try {
    const b = await c.req.json();
    return b && typeof b === 'object' ? (b as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function parsePhotos(v: unknown): Photo[] | 'too_big' | 'bad' {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.length > MAX_PHOTOS) return 'bad';
  const out: Photo[] = [];
  for (const item of v) {
    const m =
      typeof item === 'string'
        ? /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(item)
        : null;
    if (!m) return 'bad';
    const data = Buffer.from(m[2]!, 'base64');
    if (data.length > MAX_PHOTO_BYTES) return 'too_big';
    out.push({ mime: m[1]!, data });
  }
  return out;
}

/** Simple fixed-window limiter per key (IP or phone). */
function limiter(max: number, windowMs: number) {
  const hits = new Map<string, { n: number; until: number }>();
  return (key: string, now = Date.now()) => {
    const h = hits.get(key);
    if (!h || now > h.until) {
      hits.set(key, { n: 1, until: now + windowMs });
      if (hits.size > 10_000) hits.clear();
      return true;
    }
    h.n++;
    return h.n <= max;
  };
}

export function createApp(deps: Deps) {
  const { config, services, auth, parking, sms } = deps;
  const app = new Hono<Env>();
  const authLimit = limiter(20, 60_000);
  const ip = (c: Context) =>
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'local';

  app.use('*', async (c, next) => {
    await next();
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Referrer-Policy', 'same-origin');
  });

  if (config.corsOrigins.length) {
    app.use(
      '/api/*',
      cors({
        origin: config.corsOrigins,
        allowHeaders: ['authorization', 'content-type'],
        maxAge: 86400,
      }),
    );
  }
  app.use(
    '/api/*',
    bodyLimit({
      maxSize: 8 * 1024 * 1024,
      onError: (c) => fail(c, 413, 'too_large', 'حجم اطلاعات ارسالی زیاد است.'),
    }),
  );

  // ---------------- public ----------------

  app.get('/api/health', (c) => c.json({ ok: true, version: API_VERSION }));

  app.get('/api/config', (c) =>
    c.json({
      version: API_VERSION,
      pushKey: services.pusher.enabled ? services.pusher.publicKey : null,
    }),
  );

  app.post('/api/auth/otp', async (c) => {
    if (!authLimit(ip(c)))
      return fail(c, 429, 'rate_limited', 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.');
    const phone = normalizePhone((await json(c)).phone);
    if (!phone) return fail(c, 400, 'bad_phone', 'شماره موبایل معتبر نیست.');
    const r = await auth.requestOtp(phone);
    if (r.ok) return c.json({ ok: true, resendIn: r.resendIn });
    if (r.reason === 'too_soon')
      return c.json(
        { error: 'too_soon', message: 'کد قبلی هنوز معتبر است.', retryIn: r.retryIn },
        429,
      );
    return fail(
      c,
      404,
      'unknown_phone',
      'این شماره در سامانه ثبت نشده است. با مدیریت پاساژ تماس بگیرید.',
    );
  });

  app.post('/api/auth/verify', async (c) => {
    if (!authLimit(ip(c)))
      return fail(c, 429, 'rate_limited', 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.');
    const body = await json(c);
    const phone = normalizePhone(body.phone);
    const code = typeof body.code === 'string' ? toEn(body.code).replace(/\D/g, '') : '';
    if (!phone || !code) return fail(c, 400, 'bad_input', 'شماره و کد را وارد کنید.');
    const r = auth.verifyOtp(phone, code);
    if (!r.ok) {
      const msg: Record<typeof r.reason, string> = {
        no_code: 'ابتدا کد ورود را دریافت کنید.',
        expired: 'کد منقضی شده است. کد جدید بگیرید.',
        wrong: 'کد واردشده درست نیست.',
        locked: 'تعداد تلاش‌ها زیاد بود. کد جدید بگیرید.',
        unknown_phone: 'این شماره در سامانه ثبت نشده است.',
      };
      return fail(c, 401, r.reason, msg[r.reason]);
    }
    return c.json({ token: r.token, phone, store: services.getStore(r.storeId) });
  });

  // ---------------- tenant (logged in) ----------------

  const tenant = new Hono<Env>();
  tenant.use('*', async (c, next) => {
    if (c.req.path.startsWith('/api/admin/')) return next();
    const s = auth.session(bearer(c));
    if (!s) return fail(c, 401, 'unauthorized', 'نشست شما به پایان رسیده است. دوباره وارد شوید.');
    c.set('session', s);
    await next();
  });

  tenant.post('/auth/logout', async (c) => {
    const token = bearer(c)!;
    const endpoint = text((await json(c)).endpoint, 2000);
    if (endpoint) services.deletePushSub(endpoint);
    auth.logout(token);
    return c.json({ ok: true });
  });

  tenant.get('/me', (c) => {
    const s = c.get('session');
    return c.json({ phone: s.phone, store: services.getStore(s.storeId) });
  });

  tenant.get('/tickets', (c) => c.json({ items: services.listTickets(c.get('session').storeId) }));

  tenant.post('/tickets', async (c) => {
    const body = await json(c);
    const title = text(body.title, 120);
    const details = Array.isArray(body.details)
      ? body.details
          .slice(0, 12)
          .map((d) => text(d, 500))
          .filter((d): d is string => d !== null)
      : [];
    if (!isModule(body.module) || !title)
      return fail(c, 400, 'bad_input', 'اطلاعات درخواست کامل نیست.');
    const photos = parsePhotos(body.photos);
    if (photos === 'too_big') return fail(c, 413, 'photo_too_big', 'حجم عکس زیاد است.');
    if (photos === 'bad') return fail(c, 400, 'bad_photo', 'فایل عکس معتبر نیست.');
    const clientId = text(body.clientId, 64) ?? undefined;
    const { ticket, created } = await services.createTicket(c.get('session').storeId, {
      module: body.module,
      title,
      details,
      clientId,
      photos,
    });
    return c.json({ ticket }, created ? 201 : 200);
  });

  tenant.post('/security/dispatch', async (c) => {
    const s = c.get('session');
    const store = services.getStore(s.storeId);
    const clientId = text((await json(c)).clientId, 64) ?? undefined;
    const { ticket, created } = await services.createTicket(
      s.storeId,
      {
        module: 'security',
        title: 'فراخوان اضطراری حراست',
        details: ['اعزام فوری نیروی حراست به غرفه'],
        clientId,
      },
      {
        status: 'in_review',
        notice: (id) => ({
          kind: 'security',
          title: 'تیم حراست در مسیر غرفه شماست',
          body: `کد ${toFa(id)} – زمان تقریبی رسیدن ۳ دقیقه.`,
          link: 'security',
        }),
      },
    );
    if (created && store) {
      const msg = `اضطراری کاسپین\n${store.name} – پلاک ${store.unit} – ${store.floor}\nتماس: ${s.phone}\nکد ${ticket.id}`;
      await Promise.all(
        config.securityPhones.map((p) =>
          sms.send(p, msg).catch((e) => console.error('[sos sms]', e)),
        ),
      );
    }
    return c.json({ etaMinutes: 3, ticket }, created ? 201 : 200);
  });

  tenant.get('/notifications', (c) =>
    c.json({ items: services.listNotices(c.get('session').storeId) }),
  );

  tenant.post('/notifications/read', async (c) => {
    const body = await json(c);
    const ids =
      body.all === true
        ? 'all'
        : Array.isArray(body.ids)
          ? body.ids.filter((i): i is string => typeof i === 'string').slice(0, 100)
          : [];
    services.markRead(c.get('session').storeId, ids);
    return c.json({ ok: true });
  });

  tenant.get('/parking', async (c) => {
    try {
      const sub = await parking.getSubscription(c.get('session').storeId);
      if (!sub)
        return fail(c, 404, 'no_subscription', 'برای این غرفه اشتراک پارکینگ ثبت نشده است.');
      return c.json(sub);
    } catch (e) {
      console.warn('[parking]', (e as Error).message);
      return fail(c, 502, 'parking_unavailable', 'سامانه پارکینگ در دسترس نیست.');
    }
  });

  tenant.post('/push/subscribe', async (c) => {
    const body = await json(c);
    const keys = (body.keys ?? {}) as Record<string, unknown>;
    const endpoint = text(body.endpoint, 2000);
    const p256dh = text(keys.p256dh, 200);
    const authKey = text(keys.auth, 100);
    if (!endpoint || !/^https:\/\//.test(endpoint) || !p256dh || !authKey)
      return fail(c, 400, 'bad_subscription', 'اشتراک اعلان معتبر نیست.');
    const s = c.get('session');
    services.savePushSub(s.storeId, s.phone, { endpoint, p256dh, auth: authKey });
    return c.json({ ok: true });
  });

  tenant.post('/push/unsubscribe', async (c) => {
    const endpoint = text((await json(c)).endpoint, 2000);
    if (endpoint) services.deletePushSub(endpoint);
    return c.json({ ok: true });
  });

  app.route('/api', tenant);

  // ---------------- management ----------------

  const admin = new Hono<Env>();
  admin.use('*', async (c, next) => {
    const t = bearer(c);
    if (!config.adminToken || !t || !safeEqual(t, config.adminToken))
      return fail(c, 403, 'forbidden', 'دسترسی مدیریت ندارید.');
    await next();
  });

  admin.get('/stores', (c) => c.json({ items: services.listStores() }));

  admin.put('/stores/:id', async (c) => {
    const id = c.req.param('id').trim();
    const b = await json(c);
    const store: Store = {
      id,
      name: text(b.name, 80) ?? '',
      unit: toEn(text(b.unit, 20) ?? ''),
      floor: text(b.floor, 40) ?? '',
      manager: text(b.manager, 80) ?? '',
      category: text(b.category, 80) ?? '',
    };
    const phones = Array.isArray(b.phones) ? b.phones.map(normalizePhone) : [];
    if (!/^[\w-]{1,40}$/.test(id) || !store.name || !store.unit || !store.manager)
      return fail(c, 400, 'bad_input', 'نام، پلاک و مدیر غرفه لازم است.');
    if (phones.some((p) => p === null))
      return fail(c, 400, 'bad_phone', 'یکی از شماره‌ها معتبر نیست.');
    services.upsertStore(store, phones as string[]);
    return c.json({ ok: true });
  });

  admin.delete('/stores/:id', (c) => {
    services.deactivateStore(c.req.param('id'));
    return c.json({ ok: true });
  });

  admin.get('/tickets', (c) => {
    const status = c.req.query('status');
    return c.json({
      items: services.listAllTickets({
        status: isStatus(status) ? status : undefined,
        open: c.req.query('open') === '1',
      }),
    });
  });

  admin.patch('/tickets/:id', async (c) => {
    const b = await json(c);
    if (!isStatus(b.status)) return fail(c, 400, 'bad_status', 'وضعیت معتبر نیست.');
    const t = await services.setTicketStatus(
      c.req.param('id'),
      b.status,
      text(b.note, 200) ?? undefined,
    );
    return t ? c.json({ ticket: t }) : fail(c, 404, 'not_found', 'درخواست پیدا نشد.');
  });

  admin.get('/tickets/:id/photos', (c) =>
    c.json({
      items: services.attachments(c.req.param('id')).map((a) => ({ id: a.id, mime: a.mime })),
    }),
  );

  admin.get('/tickets/:id/photos/:aid', (c) => {
    const a = services.attachments(c.req.param('id')).find((x) => x.id === c.req.param('aid'));
    if (!a || !services.uploadsDir) return fail(c, 404, 'not_found', 'عکس پیدا نشد.');
    const data = readFileSync(join(services.uploadsDir, a.file));
    return c.body(data, 200, { 'content-type': a.mime, 'cache-control': 'private, max-age=86400' });
  });

  admin.post('/announce', async (c) => {
    const b = await json(c);
    const title = text(b.title, 120);
    const body = text(b.body, 1000);
    if (!title || !body) return fail(c, 400, 'bad_input', 'عنوان و متن اطلاعیه لازم است.');
    const count = await services.announce({
      title,
      body,
      ...(isLink(b.link) ? { link: b.link } : {}),
    });
    return c.json({ ok: true, stores: count });
  });

  admin.post('/jobs/parking', async (c) =>
    c.json({
      sent: await runParkingReminders(services.db, services, parking, config.parkingReminderDays),
    }),
  );

  app.route('/api/admin', admin);
  app.all('/api/*', (c) => fail(c, 404, 'not_found', 'مسیر پیدا نشد.'));

  // ---------------- Android app link ----------------

  app.get('/.well-known/assetlinks.json', (c) =>
    c.json(
      config.android.sha256.length
        ? [
            {
              relation: ['delegate_permission/common.handle_all_urls'],
              target: {
                namespace: 'android_app',
                package_name: config.android.packageName,
                sha256_cert_fingerprints: config.android.sha256,
              },
            },
          ]
        : [],
    ),
  );

  return app;
}
