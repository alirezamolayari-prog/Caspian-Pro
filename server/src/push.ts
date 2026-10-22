/**
 * Web push (VAPID). Disabled when no keys are configured; generate keys with
 * `npm run admin -- vapid` and put them in the environment.
 */
import webpush from 'web-push';
import type { Config } from './config.ts';
import type { Db } from './db.ts';

export interface PushPayload {
  title: string;
  body: string;
  /** Hash route to open on tap, e.g. `#/requests`. */
  url: string;
  tag?: string;
}

export interface Pusher {
  readonly enabled: boolean;
  readonly publicKey: string;
  /** Sends to every device registered for the store. Never throws. */
  toStore(storeId: string, payload: PushPayload): Promise<number>;
}

type Sender = (
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  body: string,
) => Promise<unknown>;

export function createPusher(config: Config, db: Db, send?: Sender): Pusher {
  const { publicKey, privateKey, subject } = config.vapid;
  const enabled = Boolean(send || (publicKey && privateKey));
  if (enabled && !send) webpush.setVapidDetails(subject, publicKey, privateKey);
  const deliver: Sender =
    send ??
    ((sub, body) =>
      webpush.sendNotification(sub, body, {
        TTL: 24 * 3600,
        urgency: 'high',
        ...(config.vapid.proxy ? { proxy: config.vapid.proxy } : {}),
      }));

  return {
    enabled,
    publicKey,
    async toStore(storeId, payload) {
      if (!enabled) return 0;
      const subs = db
        .prepare('SELECT endpoint, p256dh, auth FROM push_subs WHERE store_id = ?')
        .all(storeId) as { endpoint: string; p256dh: string; auth: string }[];
      const body = JSON.stringify(payload);
      let sent = 0;
      await Promise.all(
        subs.map(async (s) => {
          try {
            await deliver({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body);
            sent++;
          } catch (e) {
            const code = (e as { statusCode?: number }).statusCode;
            // The browser dropped this subscription: forget it.
            if (code === 404 || code === 410) {
              db.prepare('DELETE FROM push_subs WHERE endpoint = ?').run(s.endpoint);
            } else {
              console.warn('[push] failed', code ?? e);
            }
          }
        }),
      );
      return sent;
    },
  };
}
