/**
 * Starts the server: API under /api, management panel at /admin, and the built
 * web app (repo `dist/`) at /. Settings: see `.env.example`.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { createApp } from './app.ts';
import { Auth } from './auth.ts';
import { loadConfig } from './config.ts';
import { openDb } from './db.ts';
import { every, runParkingReminders } from './jobs.ts';
import { createParking } from './parking.ts';
import { createPusher } from './push.ts';
import { Services } from './services.ts';
import { createSms } from './sms.ts';

const here = dirname(fileURLToPath(import.meta.url));
const config = loadConfig();
const db = openDb(config.dataDir);
const pusher = createPusher(config, db);
const services = new Services(db, pusher, join(config.dataDir, 'uploads'));
const sms = createSms(config);
const auth = new Auth(db, services, sms);
const parking = createParking(config);

const app = createApp({ config, services, auth, parking, sms });

// Management panel (one static page; it asks for ADMIN_TOKEN).
const adminHtml = readFileSync(join(here, '..', 'admin', 'index.html'), 'utf8');
app.get('/admin', (c) => c.html(adminHtml));

// The web app itself.
if (config.staticDir && existsSync(join(config.staticDir, 'index.html'))) {
  const root = relative(process.cwd(), config.staticDir) || '.';
  app.use('/*', async (c, next) => {
    await next();
    const p = c.req.path;
    if (p === '/' || p.endsWith('.html') || p === '/sw.js' || p.endsWith('.webmanifest')) {
      c.header('Cache-Control', 'no-cache');
    } else if (p.startsWith('/assets/')) {
      c.header('Cache-Control', 'public, max-age=31536000, immutable');
    }
  });
  app.use('/*', serveStatic({ root }));
  app.get('*', serveStatic({ root, path: 'index.html' }));
} else {
  console.warn(
    `[static] ${config.staticDir ?? '(disabled)'} has no index.html – only the API is served.`,
  );
}

every(60 * 60_000, () => runParkingReminders(db, services, parking, config.parkingReminderDays));

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Caspian Pro server on http://localhost:${info.port}`);
  console.log(
    `  sms: ${config.sms.provider} – push: ${pusher.enabled ? 'on' : 'off (no VAPID keys)'} – parking: ${config.parking.provider} – admin: ${config.adminToken ? 'on' : 'off (no ADMIN_TOKEN)'}`,
  );
});
