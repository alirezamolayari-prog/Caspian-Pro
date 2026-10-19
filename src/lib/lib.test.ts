import { describe, expect, it } from 'vitest';
import { makeTicketId } from './ids';
import { formatClock, formatJalali, relativeTime, toEn, toFa } from './persian';
import { parseHash } from './router';
import {
  isIranMobile,
  isLinkOrHandle,
  isPersonName,
  isTimeRange,
  normalizeMobile,
  parseTime,
} from './validators';

describe('persian', () => {
  it('converts digits both ways', () => {
    expect(toFa('09121234567')).toBe('۰۹۱۲۱۲۳۴۵۶۷');
    expect(toEn('۰۹۱۲٣٤')).toBe('091234');
  });
  it('formats the countdown clock', () => {
    expect(formatClock(65)).toBe('۰۱:۰۵');
    expect(formatClock(3725)).toBe('۱:۰۲:۰۵');
    expect(formatClock(-4)).toBe('۰۰:۰۰');
  });
  it('formats Jalali dates', () => {
    // 21 March 2025 = 1 Farvardin 1404
    expect(formatJalali(new Date(2025, 2, 21, 12))).toContain('فروردین');
    expect(formatJalali(new Date(2025, 2, 21, 12))).toContain('۱۴۰۴');
  });
  it('gives relative times', () => {
    const now = 1_000_000_000;
    expect(relativeTime(now - 10_000, now)).toBe('همین الان');
    expect(relativeTime(now - 5 * 60_000, now)).toBe('۵ دقیقه پیش');
    expect(relativeTime(now - 3 * 3600_000, now)).toBe('۳ ساعت پیش');
  });
});

describe('validators', () => {
  it('accepts Iranian mobiles in many spellings', () => {
    expect(isIranMobile('09121234567')).toBe(true);
    expect(isIranMobile('۰۹۱۲ ۱۲۳ ۴۵۶۷')).toBe(true);
    expect(isIranMobile('+989121234567')).toBe(true);
    expect(normalizeMobile('00989121234567')).toBe('09121234567');
    expect(isIranMobile('0912123456')).toBe(false);
    expect(isIranMobile('02112345678')).toBe(false);
  });
  it('accepts sites and Instagram handles', () => {
    expect(isLinkOrHandle('@royal.furniture')).toBe(true);
    expect(isLinkOrHandle('royalfurniture.ir')).toBe(true);
    expect(isLinkOrHandle('https://caspian.ir/x')).toBe(true);
    expect(isLinkOrHandle('not a link')).toBe(false);
    expect(isLinkOrHandle('@a')).toBe(false);
  });
  it('checks time ranges', () => {
    expect(parseTime('09:30')).toBe(570);
    expect(parseTime('25:00')).toBeNull();
    expect(isTimeRange('09:00', '18:00')).toBe(true);
    expect(isTimeRange('18:00', '09:00')).toBe(false);
  });
  it('checks names', () => {
    expect(isPersonName('علی محمدی')).toBe(true);
    expect(isPersonName('Ali Rezaei')).toBe(true);
    expect(isPersonName('ab')).toBe(false);
    expect(isPersonName('علی123')).toBe(false);
  });
});

describe('ids and routing', () => {
  it('makes CSP ticket ids', () => {
    expect(makeTicketId(() => 0)).toBe('CSP-100000');
    expect(makeTicketId()).toMatch(/^CSP-\d{6}$/);
  });
  it('parses hash routes', () => {
    expect(parseHash('')).toEqual({ tab: 'home' });
    expect(parseHash('#/requests')).toEqual({ tab: 'requests' });
    expect(parseHash('#/m/logistics')).toEqual({ tab: 'home', module: 'logistics' });
    expect(parseHash('#/m/invoices')).toEqual({ tab: 'home' });
  });
});
