/**
 * Management from the command line (on the server):
 *   npm run admin -- vapid                                   create push keys
 *   npm run admin -- store <id> <unit> <floor> <name> <manager> <phone,phone> [category]
 *   npm run admin -- stores                                  list stores
 *   npm run admin -- import stores.csv                       id,unit,floor,name,manager,phones(;),category
 *   npm run admin -- status <ticketId> <status> [note]       submitted|in_review|approved|rejected|done
 *   npm run admin -- announce "<title>" "<body>"
 *   npm run admin -- parking-reminders                       run the reminder job now
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import webpush from 'web-push';
import { loadConfig } from './config.ts';
import { openDb } from './db.ts';
import { isStatus, normalizePhone, toEn } from './domain.ts';
import { runParkingReminders } from './jobs.ts';
import { createParking } from './parking.ts';
import { createPusher } from './push.ts';
import { Services } from './services.ts';

const [cmd, ...args] = process.argv.slice(2);
const config = loadConfig();

if (cmd === 'vapid') {
  const k = webpush.generateVAPIDKeys();
  console.log(`VAPID_PUBLIC_KEY=${k.publicKey}\nVAPID_PRIVATE_KEY=${k.privateKey}`);
  process.exit(0);
}

const db = openDb(config.dataDir);
const services = new Services(db, createPusher(config, db), join(config.dataDir, 'uploads'));

function addStore(
  id: string,
  unit: string,
  floor: string,
  name: string,
  manager: string,
  phoneList: string,
  category = '',
) {
  const phones = phoneList
    .split(/[,;]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(normalizePhone);
  if (phones.some((p) => !p)) throw new Error(`bad phone in "${phoneList}"`);
  services.upsertStore(
    { id, unit: toEn(unit), floor, name, manager, category },
    phones as string[],
  );
}

switch (cmd) {
  case 'store': {
    const [id, unit, floor, name, manager, phones, category] = args;
    if (!id || !unit || !floor || !name || !manager || !phones)
      throw new Error('usage: store <id> <unit> <floor> <name> <manager> <phones> [category]');
    addStore(id, unit, floor, name, manager, phones, category);
    console.log(`saved ${id}`);
    break;
  }
  case 'import': {
    const lines = readFileSync(args[0] ?? 'stores.csv', 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.trim());
    let n = 0;
    for (const line of lines) {
      const [id, unit, floor, name, manager, phones, category] = line
        .split(',')
        .map((s) => s.trim());
      if (!id || id === 'id') continue;
      addStore(id, unit ?? '', floor ?? '', name ?? '', manager ?? '', phones ?? '', category);
      n++;
    }
    console.log(`imported ${n} stores`);
    break;
  }
  case 'stores':
    for (const s of services.listStores())
      console.log(
        `${s.id}\t${s.unit}\t${s.name}\t${s.manager}\t${s.phones.join(',')}${s.active ? '' : '\t(inactive)'}`,
      );
    break;
  case 'status': {
    const [id, status, note] = args;
    if (!id || !isStatus(status))
      throw new Error(
        'usage: status <ticketId> <submitted|in_review|approved|rejected|done> [note]',
      );
    const t = await services.setTicketStatus(id, status, note);
    console.log(t ? `${t.id} → ${t.status}` : 'not found');
    break;
  }
  case 'announce': {
    const [title, body] = args;
    if (!title || !body) throw new Error('usage: announce "<title>" "<body>"');
    console.log(`sent to ${await services.announce({ title, body })} stores`);
    break;
  }
  case 'parking-reminders':
    console.log(
      `sent ${await runParkingReminders(db, services, createParking(config), config.parkingReminderDays)}`,
    );
    break;
  default:
    console.log(readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0]);
}
