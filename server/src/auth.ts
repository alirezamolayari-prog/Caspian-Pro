/**
 * Login with phone + one-time code. Only phones registered for a store
 * (`members`) can log in. Codes live 2 minutes, can be resent after 60 s,
 * and allow 5 wrong tries. Sessions are random tokens stored hashed.
 */
import type { Db } from './db.ts';
import { newOtp, newToken, sha256 } from './domain.ts';
import type { Services } from './services.ts';
import type { SmsProvider } from './sms.ts';

export const OTP_TTL = 2 * 60_000;
export const OTP_RESEND = 60_000;
export const OTP_MAX_TRIES = 5;
export const SESSION_TTL = 180 * 86_400_000;

export type OtpRequest =
  | { ok: true; resendIn: number }
  | { ok: false; reason: 'unknown_phone' | 'too_soon'; retryIn?: number };

export type OtpVerify =
  | { ok: true; token: string; storeId: string }
  | { ok: false; reason: 'no_code' | 'expired' | 'wrong' | 'locked' | 'unknown_phone' };

export interface Session {
  phone: string;
  storeId: string;
  tokenHash: string;
}

export class Auth {
  readonly db: Db;
  readonly services: Services;
  readonly sms: SmsProvider;

  constructor(db: Db, services: Services, sms: SmsProvider) {
    this.db = db;
    this.services = services;
    this.sms = sms;
  }

  async requestOtp(phone: string, now = Date.now()): Promise<OtpRequest> {
    if (!this.services.storeIdForPhone(phone)) return { ok: false, reason: 'unknown_phone' };
    const prev = this.db.prepare('SELECT sent_at FROM otps WHERE phone = ?').get(phone) as
      { sent_at: number } | undefined;
    if (prev && now - prev.sent_at < OTP_RESEND) {
      return {
        ok: false,
        reason: 'too_soon',
        retryIn: Math.ceil((OTP_RESEND - (now - prev.sent_at)) / 1000),
      };
    }
    const code = newOtp();
    this.db
      .prepare(
        `INSERT INTO otps (phone, code_hash, expires_at, sent_at, attempts) VALUES (?, ?, ?, ?, 0)
         ON CONFLICT(phone) DO UPDATE SET code_hash=excluded.code_hash, expires_at=excluded.expires_at, sent_at=excluded.sent_at, attempts=0`,
      )
      .run(phone, sha256(`${phone}:${code}`), now + OTP_TTL, now);
    await this.sms.sendOtp(phone, code);
    return { ok: true, resendIn: OTP_RESEND / 1000 };
  }

  verifyOtp(phone: string, code: string, now = Date.now()): OtpVerify {
    const row = this.db.prepare('SELECT * FROM otps WHERE phone = ?').get(phone) as
      { code_hash: string; expires_at: number; attempts: number } | undefined;
    if (!row) return { ok: false, reason: 'no_code' };
    if (row.attempts >= OTP_MAX_TRIES) return { ok: false, reason: 'locked' };
    if (now > row.expires_at) return { ok: false, reason: 'expired' };
    if (sha256(`${phone}:${code}`) !== row.code_hash) {
      this.db.prepare('UPDATE otps SET attempts = attempts + 1 WHERE phone = ?').run(phone);
      return { ok: false, reason: row.attempts + 1 >= OTP_MAX_TRIES ? 'locked' : 'wrong' };
    }
    const storeId = this.services.storeIdForPhone(phone);
    if (!storeId) return { ok: false, reason: 'unknown_phone' };
    this.db.prepare('DELETE FROM otps WHERE phone = ?').run(phone);
    const token = newToken();
    this.db
      .prepare(
        'INSERT INTO sessions (token_hash, phone, store_id, created_at, last_seen) VALUES (?, ?, ?, ?, ?)',
      )
      .run(sha256(token), phone, storeId, now, now);
    return { ok: true, token, storeId };
  }

  session(token: string | undefined, now = Date.now()): Session | null {
    if (!token) return null;
    const hash = sha256(token);
    const row = this.db
      .prepare('SELECT phone, store_id, last_seen FROM sessions WHERE token_hash = ?')
      .get(hash) as { phone: string; store_id: string; last_seen: number } | undefined;
    if (!row) return null;
    if (now - row.last_seen > SESSION_TTL) {
      this.logout(token);
      return null;
    }
    // A phone moved to another store (or removed) invalidates the session.
    if (this.services.storeIdForPhone(row.phone) !== row.store_id) {
      this.logout(token);
      return null;
    }
    if (now - row.last_seen > 3600_000) {
      this.db.prepare('UPDATE sessions SET last_seen = ? WHERE token_hash = ?').run(now, hash);
    }
    return { phone: row.phone, storeId: row.store_id, tokenHash: hash };
  }

  logout(token: string) {
    this.db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
  }
}
