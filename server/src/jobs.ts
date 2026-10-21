/**
 * Background jobs. Parking: one reminder when the subscription has
 * `parkingReminderDays` days or fewer left, and one when it has ended.
 */
import type { Db } from './db.ts';
import { toFa } from './domain.ts';
import { DAY_MS, type ParkingAdapter } from './parking.ts';
import type { Services } from './services.ts';

export async function runParkingReminders(
  db: Db,
  services: Services,
  parking: ParkingAdapter,
  reminderDays: number,
  now = Date.now(),
): Promise<number> {
  const stores = db.prepare('SELECT id FROM stores WHERE active = 1').all() as { id: string }[];
  const already = db.prepare('SELECT 1 FROM parking_reminders WHERE store_id = ? AND ends_at = ?');
  const mark = db.prepare(
    'INSERT OR IGNORE INTO parking_reminders (store_id, ends_at, sent_at) VALUES (?, ?, ?)',
  );
  let sent = 0;

  for (const { id } of stores) {
    let sub;
    try {
      sub = await parking.getSubscription(id);
    } catch (e) {
      console.warn(`[parking] ${id}:`, (e as Error).message);
      continue;
    }
    if (!sub) continue;
    const daysLeft = Math.ceil((sub.endsAt - now) / DAY_MS);
    // Positive key = "ending soon" reminder, negative key = "ended" reminder.
    if (now >= sub.endsAt) {
      if (already.get(id, -sub.endsAt) || now - sub.endsAt > 3 * DAY_MS) continue;
      await services.notify(id, {
        kind: 'management',
        title: 'اشتراک پارکینگ به پایان رسید',
        body: 'برای تمدید اشتراک به دفتر پارکینگ مراجعه کنید.',
        link: 'parking',
      });
      mark.run(id, -sub.endsAt, now);
      sent++;
    } else if (daysLeft <= reminderDays) {
      if (already.get(id, sub.endsAt)) continue;
      await services.notify(id, {
        kind: 'management',
        title: 'یادآوری پایان اشتراک پارکینگ',
        body: `${toFa(daysLeft)} روز تا پایان اشتراک پارکینگ مانده است. تمدید در دفتر پارکینگ انجام می‌شود.`,
        link: 'parking',
      });
      mark.run(id, sub.endsAt, now);
      sent++;
    }
  }
  return sent;
}

/** Runs `fn` now and then every `everyMs`, never overlapping. */
export function every(everyMs: number, fn: () => Promise<unknown>) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await fn();
    } catch (e) {
      console.error('[job]', e);
    } finally {
      running = false;
    }
  };
  void tick();
  const t = setInterval(tick, everyMs);
  t.unref();
  return () => clearInterval(t);
}
