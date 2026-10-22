/**
 * All settings come from environment variables (see `.env.example`).
 * Nothing here is secret by default; secrets are only read from the environment.
 */
import { resolve } from 'node:path';

const env = process.env;

const list = (v: string | undefined) =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export interface Config {
  port: number;
  /** Folder for the SQLite file and uploaded photos. */
  dataDir: string;
  /** Built web app (`npm run build` in the repo root) served on the same origin. */
  staticDir: string | null;
  /** Origins allowed to call the API from another domain (only needed when the app is hosted elsewhere). */
  corsOrigins: string[];
  /** Token for the management panel `/admin` and `/api/admin/*`. Empty = admin disabled. */
  adminToken: string;
  sms: {
    provider: 'console' | 'kavenegar';
    kavenegarKey: string;
    /** Kavenegar "verify lookup" template name holding `%token%`. Empty = plain send. */
    kavenegarTemplate: string;
    sender: string;
  };
  /** Phones that receive an SMS when a tenant presses the emergency button. */
  securityPhones: string[];
  vapid: {
    publicKey: string;
    privateKey: string;
    subject: string;
    /** HTTP proxy for reaching push services (Google FCM is filtered in Iran). */
    proxy: string;
  };
  parking: {
    provider: 'mock' | 'http';
    /** Base URL of the parking software; `GET {url}/subscriptions/{storeId}` must return the subscription JSON. */
    url: string;
    token: string;
  };
  /** Days before the parking subscription ends when the reminder is sent. */
  parkingReminderDays: number;
  /** Android app signing certificate fingerprints for `/.well-known/assetlinks.json`. */
  android: { packageName: string; sha256: string[] };
}

export function loadConfig(overrides: Partial<Config> = {}): Config {
  const base: Config = {
    port: Number(env.PORT ?? 8787),
    dataDir: resolve(env.DATA_DIR ?? 'data'),
    staticDir: env.STATIC_DIR === '' ? null : resolve(env.STATIC_DIR ?? '../dist'),
    corsOrigins: list(env.CORS_ORIGINS),
    adminToken: env.ADMIN_TOKEN ?? '',
    sms: {
      provider: env.SMS_PROVIDER === 'kavenegar' ? 'kavenegar' : 'console',
      kavenegarKey: env.KAVENEGAR_API_KEY ?? '',
      kavenegarTemplate: env.KAVENEGAR_TEMPLATE ?? '',
      sender: env.SMS_SENDER ?? '',
    },
    securityPhones: list(env.SECURITY_PHONES),
    vapid: {
      publicKey: env.VAPID_PUBLIC_KEY ?? '',
      privateKey: env.VAPID_PRIVATE_KEY ?? '',
      subject: env.VAPID_SUBJECT ?? 'mailto:admin@example.com',
      proxy: env.PUSH_PROXY ?? '',
    },
    parking: {
      provider: env.PARKING_PROVIDER === 'http' ? 'http' : 'mock',
      url: env.PARKING_URL ?? '',
      token: env.PARKING_TOKEN ?? '',
    },
    parkingReminderDays: Number(env.PARKING_REMINDER_DAYS ?? 7),
    android: {
      packageName: env.ANDROID_PACKAGE ?? 'ir.caspian.pro',
      sha256: list(env.ANDROID_SHA256),
    },
  };
  return { ...base, ...overrides };
}
