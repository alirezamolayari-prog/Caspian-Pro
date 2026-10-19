const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Latin digits → Persian digits. */
export function toFa(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]!);
}

/** Persian/Arabic digits → Latin digits (for validating what people type). */
export function toEn(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

/** Seconds → «۱۲:۰۵» (or «۱:۰۲:۰۵» past an hour). */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return toFa(h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`);
}

const jalaliDay = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const jalaliFull = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
const jalaliShort = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  day: 'numeric',
  month: 'short',
});
const jalaliWeekday = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'short' });
const timeFmt = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' });

export const formatJalali = (d: Date | number) => jalaliFull.format(d);
export const formatJalaliDay = (d: Date | number) => jalaliDay.format(d);
export const formatJalaliShort = (d: Date | number) => jalaliShort.format(d);
export const formatWeekday = (d: Date | number) => jalaliWeekday.format(d);
export const formatTime = (d: Date | number) => timeFmt.format(d);

/** «همین الان», «۵ دقیقه پیش», «۲ ساعت پیش», «۳ روز پیش». */
export function relativeTime(from: number, now: number = Date.now()): string {
  const diff = Math.max(0, Math.round((now - from) / 1000));
  if (diff < 45) return 'همین الان';
  const min = Math.round(diff / 60);
  if (min < 60) return `${toFa(min)} دقیقه پیش`;
  const h = Math.round(min / 60);
  if (h < 24) return `${toFa(h)} ساعت پیش`;
  return `${toFa(Math.round(h / 24))} روز پیش`;
}

/** Greeting by local hour. */
export function greeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'شب بخیر';
  if (h < 12) return 'صبح بخیر';
  if (h < 17) return 'روز بخیر';
  if (h < 20) return 'عصر بخیر';
  return 'شب بخیر';
}
