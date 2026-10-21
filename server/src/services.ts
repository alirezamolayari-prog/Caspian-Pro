/** Data access and business rules, independent of HTTP. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Db } from './db.ts';
import { tx } from './db.ts';
import {
  newKey,
  newTicketId,
  STATUS_LABEL,
  toFa,
  type ModuleId,
  type Notice,
  type NoticeKind,
  type NoticeLink,
  type Store,
  type Ticket,
  type TicketStatus,
} from './domain.ts';
import type { Pusher } from './push.ts';

type Row = Record<string, unknown>;

const toStore = (r: Row): Store => ({
  id: String(r.id),
  name: String(r.name),
  unit: String(r.unit),
  floor: String(r.floor),
  manager: String(r.manager),
  category: String(r.category ?? ''),
});

const toTicket = (r: Row): Ticket => ({
  id: String(r.id),
  module: r.module as ModuleId,
  title: String(r.title),
  details: JSON.parse(String(r.details)) as string[],
  status: r.status as TicketStatus,
  createdAt: Number(r.created_at),
  updatedAt: Number(r.updated_at),
  photos: Number(r.photos ?? 0),
});

const toNotice = (r: Row): Notice => ({
  id: String(r.id),
  kind: r.kind as NoticeKind,
  title: String(r.title),
  body: String(r.body),
  ...(r.link ? { link: r.link as NoticeLink } : {}),
  createdAt: Number(r.created_at),
  read: Boolean(r.read),
});

const LINK_ROUTE = (link?: NoticeLink) =>
  !link ? '#/notifications' : link === 'requests' ? '#/requests' : `#/m/${link}`;

export interface Photo {
  mime: string;
  data: Buffer;
}

export class Services {
  readonly db: Db;
  readonly pusher: Pusher;
  readonly uploadsDir: string | null;

  constructor(db: Db, pusher: Pusher, uploadsDir: string | null) {
    this.db = db;
    this.pusher = pusher;
    this.uploadsDir = uploadsDir;
  }

  // ---------- stores ----------

  getStore(id: string): Store | null {
    const r = this.db.prepare('SELECT * FROM stores WHERE id = ? AND active = 1').get(id) as
      Row | undefined;
    return r ? toStore(r) : null;
  }

  listStores(): (Store & { phones: string[]; active: boolean })[] {
    const rows = this.db
      .prepare('SELECT * FROM stores ORDER BY CAST(unit AS INTEGER), unit')
      .all() as Row[];
    const phones = this.db.prepare('SELECT phone, store_id FROM members').all() as Row[];
    return rows.map((r) => ({
      ...toStore(r),
      active: Boolean(r.active),
      phones: phones.filter((p) => p.store_id === r.id).map((p) => String(p.phone)),
    }));
  }

  upsertStore(s: Store, phones: string[]) {
    tx(this.db, () => {
      this.db
        .prepare(
          `INSERT INTO stores (id, name, unit, floor, manager, category, active) VALUES (?, ?, ?, ?, ?, ?, 1)
           ON CONFLICT(id) DO UPDATE SET name=excluded.name, unit=excluded.unit, floor=excluded.floor,
             manager=excluded.manager, category=excluded.category, active=1`,
        )
        .run(s.id, s.name, s.unit, s.floor, s.manager, s.category);
      this.db.prepare('DELETE FROM members WHERE store_id = ?').run(s.id);
      const ins = this.db.prepare(
        'INSERT INTO members (phone, store_id) VALUES (?, ?) ON CONFLICT(phone) DO UPDATE SET store_id = excluded.store_id',
      );
      for (const p of phones) ins.run(p, s.id);
    });
  }

  /** Deactivates the store and logs out its devices. */
  deactivateStore(id: string) {
    tx(this.db, () => {
      this.db.prepare('UPDATE stores SET active = 0 WHERE id = ?').run(id);
      this.db.prepare('DELETE FROM sessions WHERE store_id = ?').run(id);
      this.db.prepare('DELETE FROM push_subs WHERE store_id = ?').run(id);
    });
  }

  storeIdForPhone(phone: string): string | null {
    const r = this.db
      .prepare(
        'SELECT m.store_id FROM members m JOIN stores s ON s.id = m.store_id WHERE m.phone = ? AND s.active = 1',
      )
      .get(phone) as Row | undefined;
    return r ? String(r.store_id) : null;
  }

  // ---------- tickets ----------

  listTickets(storeId: string): Ticket[] {
    return (
      this.db
        .prepare(
          `SELECT t.*, (SELECT COUNT(*) FROM attachments a WHERE a.ticket_id = t.id) AS photos
           FROM tickets t WHERE store_id = ? ORDER BY created_at DESC LIMIT 200`,
        )
        .all(storeId) as Row[]
    ).map(toTicket);
  }

  getTicket(id: string): (Ticket & { storeId: string }) | null {
    const r = this.db
      .prepare(
        `SELECT t.*, (SELECT COUNT(*) FROM attachments a WHERE a.ticket_id = t.id) AS photos FROM tickets t WHERE id = ?`,
      )
      .get(id) as Row | undefined;
    return r ? { ...toTicket(r), storeId: String(r.store_id) } : null;
  }

  /**
   * Creates a ticket. `clientId` makes retries safe: the same id from the same
   * store returns the existing ticket (the offline queue relies on this).
   */
  async createTicket(
    storeId: string,
    input: {
      module: ModuleId;
      title: string;
      details: string[];
      clientId?: string;
      photos?: Photo[];
    },
    opts: {
      status?: TicketStatus;
      notice?: (id: string) => { kind: NoticeKind; title: string; body: string; link: NoticeLink };
    } = {},
  ): Promise<{ ticket: Ticket; created: boolean }> {
    if (input.clientId) {
      const existing = this.db
        .prepare('SELECT id FROM tickets WHERE store_id = ? AND client_id = ?')
        .get(storeId, input.clientId) as Row | undefined;
      if (existing) return { ticket: this.getTicket(String(existing.id))!, created: false };
    }
    const now = Date.now();
    let id = newTicketId();
    while (this.db.prepare('SELECT 1 FROM tickets WHERE id = ?').get(id)) id = newTicketId();

    tx(this.db, () => {
      this.db
        .prepare(
          `INSERT INTO tickets (id, store_id, client_id, module, title, details, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          id,
          storeId,
          input.clientId ?? null,
          input.module,
          input.title,
          JSON.stringify(input.details),
          opts.status ?? 'submitted',
          now,
          now,
        );
      for (const p of input.photos ?? []) this.savePhoto(id, p);
    });

    const ticket = this.getTicket(id)!;
    await this.notify(
      storeId,
      opts.notice?.(id) ?? {
        kind: 'ticket',
        title: `درخواست «${input.title}» ثبت شد`,
        body: `کد پیگیری ${toFa(id)} – نتیجه از همین بخش اطلاع داده می‌شود.`,
        link: 'requests',
      },
      { push: false },
    );
    return { ticket, created: true };
  }

  private savePhoto(ticketId: string, p: Photo) {
    if (!this.uploadsDir) return;
    const ext = p.mime === 'image/png' ? 'png' : p.mime === 'image/webp' ? 'webp' : 'jpg';
    const key = newKey();
    const dir = join(this.uploadsDir, ticketId);
    mkdirSync(dir, { recursive: true });
    const file = join(ticketId, `${key}.${ext}`);
    writeFileSync(join(this.uploadsDir, file), p.data);
    this.db
      .prepare('INSERT INTO attachments (id, ticket_id, file, mime) VALUES (?, ?, ?, ?)')
      .run(key, ticketId, file, p.mime);
  }

  attachments(ticketId: string): { id: string; file: string; mime: string }[] {
    return (
      this.db
        .prepare('SELECT id, file, mime FROM attachments WHERE ticket_id = ?')
        .all(ticketId) as Row[]
    ).map((r) => ({
      id: String(r.id),
      file: String(r.file),
      mime: String(r.mime),
    }));
  }

  /** Management changes a ticket's status; the tenant gets a notification and a push. */
  async setTicketStatus(id: string, status: TicketStatus, note?: string): Promise<Ticket | null> {
    const t = this.getTicket(id);
    if (!t) return null;
    if (t.status === status) return t;
    this.db
      .prepare('UPDATE tickets SET status = ?, updated_at = ? WHERE id = ?')
      .run(status, Date.now(), id);
    await this.notify(t.storeId, {
      kind: t.module === 'services' ? 'permit' : t.module === 'security' ? 'security' : 'ticket',
      title: `«${t.title}» ${STATUS_LABEL[status]}`,
      body: `کد پیگیری ${toFa(id)}${note ? ` – ${note}` : ''}`,
      link: 'requests',
    });
    return this.getTicket(id);
  }

  listAllTickets(filter: { status?: TicketStatus; open?: boolean } = {}) {
    const where = filter.status
      ? 'WHERE t.status = ?'
      : filter.open
        ? "WHERE t.status IN ('submitted','in_review')"
        : '';
    const args = filter.status ? [filter.status] : [];
    return (
      this.db
        .prepare(
          `SELECT t.*, s.name AS store_name, s.unit AS store_unit,
             (SELECT COUNT(*) FROM attachments a WHERE a.ticket_id = t.id) AS photos
           FROM tickets t JOIN stores s ON s.id = t.store_id ${where} ORDER BY t.created_at DESC LIMIT 500`,
        )
        .all(...args) as Row[]
    ).map((r) => ({
      ...toTicket(r),
      storeId: String(r.store_id),
      storeName: String(r.store_name),
      storeUnit: String(r.store_unit),
    }));
  }

  // ---------- notifications ----------

  listNotices(storeId: string): Notice[] {
    return (
      this.db
        .prepare('SELECT * FROM notifications WHERE store_id = ? ORDER BY created_at DESC LIMIT 50')
        .all(storeId) as Row[]
    ).map(toNotice);
  }

  markRead(storeId: string, ids: string[] | 'all') {
    if (ids === 'all') {
      this.db.prepare('UPDATE notifications SET read = 1 WHERE store_id = ?').run(storeId);
      return;
    }
    const st = this.db.prepare('UPDATE notifications SET read = 1 WHERE store_id = ? AND id = ?');
    for (const id of ids) st.run(storeId, id);
  }

  /** Saves a notification for the store and (by default) pushes it to its devices. */
  async notify(
    storeId: string,
    n: { kind: NoticeKind; title: string; body: string; link?: NoticeLink },
    opts: { push?: boolean } = {},
  ): Promise<Notice> {
    const id = newKey();
    const now = Date.now();
    this.db
      .prepare(
        'INSERT INTO notifications (id, store_id, kind, title, body, link, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run(id, storeId, n.kind, n.title, n.body, n.link ?? null, now);
    if (opts.push !== false) {
      await this.pusher.toStore(storeId, {
        title: n.title,
        body: n.body,
        url: LINK_ROUTE(n.link),
        tag: id,
      });
    }
    return { id, ...n, createdAt: now, read: false };
  }

  /** Announcement from management to every active store. */
  async announce(n: { title: string; body: string; link?: NoticeLink }): Promise<number> {
    const stores = this.db.prepare('SELECT id FROM stores WHERE active = 1').all() as Row[];
    for (const s of stores) await this.notify(String(s.id), { kind: 'management', ...n });
    return stores.length;
  }

  // ---------- push subscriptions ----------

  savePushSub(
    storeId: string,
    phone: string,
    sub: { endpoint: string; p256dh: string; auth: string },
  ) {
    this.db
      .prepare(
        `INSERT INTO push_subs (endpoint, store_id, phone, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(endpoint) DO UPDATE SET store_id=excluded.store_id, phone=excluded.phone, p256dh=excluded.p256dh, auth=excluded.auth`,
      )
      .run(sub.endpoint, storeId, phone, sub.p256dh, sub.auth, Date.now());
  }

  deletePushSub(endpoint: string) {
    this.db.prepare('DELETE FROM push_subs WHERE endpoint = ?').run(endpoint);
  }
}
