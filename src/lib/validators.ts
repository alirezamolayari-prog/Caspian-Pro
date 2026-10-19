import { toEn } from './persian';

/** Iranian mobile: 09xxxxxxxxx, also accepts +989… / 00989… and Persian digits. */
export function normalizeMobile(raw: string): string {
  let v = toEn(raw).replace(/[\s-]/g, '');
  if (v.startsWith('+98')) v = `0${v.slice(3)}`;
  else if (v.startsWith('0098')) v = `0${v.slice(4)}`;
  else if (v.startsWith('98') && v.length === 12) v = `0${v.slice(2)}`;
  return v;
}

export function isIranMobile(raw: string): boolean {
  return /^09\d{9}$/.test(normalizeMobile(raw));
}

/** Website (http/https or bare domain) or an Instagram handle like @royal.furniture. */
export function isLinkOrHandle(raw: string): boolean {
  const v = raw.trim();
  if (/^@[A-Za-z0-9._]{2,30}$/.test(v)) return true;
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const url = new URL(withScheme);
    return /^[^.\s]+(\.[^.\s]+)+$/.test(url.hostname);
  } catch {
    return false;
  }
}

/** "HH:mm" → minutes after midnight, or null. */
export function parseTime(v: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(toEn(v));
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function isTimeRange(from: string, to: string): boolean {
  const a = parseTime(from);
  const b = parseTime(to);
  return a !== null && b !== null && b > a;
}

/** Person's name: at least two words or 3+ letters, Persian or Latin letters only. */
export function isPersonName(raw: string): boolean {
  const v = raw.trim();
  return v.length >= 3 && /^[\p{L}\s.‌-]+$/u.test(v);
}

export const minLength = (v: string, n: number) => v.trim().length >= n;
