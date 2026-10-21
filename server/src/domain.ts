/** Shared vocabulary. Keep in sync with the app (`src/data/catalog.ts`, `src/store/tickets.ts`). */
import { createHash, randomBytes, randomInt } from 'node:crypto';

export const MODULES = [
  'services',
  'logistics',
  'parking',
  'security',
  'booth',
  'advertising',
  'maintenance',
  'support',
] as const;
export type ModuleId = (typeof MODULES)[number];

export const STATUSES = ['submitted', 'in_review', 'approved', 'rejected', 'done'] as const;
export type TicketStatus = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<TicketStatus, string> = {
  submitted: 'ثبت شد',
  in_review: 'در حال بررسی',
  approved: 'تایید شد',
  rejected: 'رد شد',
  done: 'انجام شد',
};

export const NOTICE_KINDS = ['permit', 'loading', 'management', 'ticket', 'security'] as const;
export type NoticeKind = (typeof NOTICE_KINDS)[number];

export const LINKS = [...MODULES, 'requests'] as const;
export type NoticeLink = (typeof LINKS)[number];

export interface Store {
  id: string;
  name: string;
  unit: string;
  floor: string;
  manager: string;
  category: string;
}

export interface Ticket {
  id: string;
  module: ModuleId;
  title: string;
  details: string[];
  status: TicketStatus;
  createdAt: number;
  updatedAt: number;
  photos: number;
}

export interface Notice {
  id: string;
  kind: NoticeKind;
  title: string;
  body: string;
  link?: NoticeLink;
  createdAt: number;
  read: boolean;
}

const FA = '۰۱۲۳۴۵۶۷۸۹';
const AR = '٠١٢٣٤٥٦٧٨٩';
export const toEn = (s: string) =>
  s.replace(/[۰-۹٠-٩]/g, (d) => String(FA.indexOf(d) >= 0 ? FA.indexOf(d) : AR.indexOf(d)));
export const toFa = (v: string | number) => String(v).replace(/\d/g, (d) => FA[Number(d)]!);

/** Normalises an Iranian mobile number to `09xxxxxxxxx`, or returns null. */
export function normalizePhone(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  let p = toEn(input).replace(/[\s\-()]/g, '');
  if (p.startsWith('+98')) p = '0' + p.slice(3);
  else if (p.startsWith('0098')) p = '0' + p.slice(4);
  else if (p.startsWith('98') && p.length === 12) p = '0' + p.slice(2);
  else if (p.startsWith('9') && p.length === 10) p = '0' + p;
  return /^09\d{9}$/.test(p) ? p : null;
}

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');
export const newKey = () => randomBytes(9).toString('base64url');
export const newOtp = () => String(randomInt(0, 100_000)).padStart(5, '0');
export const newTicketId = () => `CSP-${randomInt(100_000, 1_000_000)}`;

export const isModule = (v: unknown): v is ModuleId =>
  typeof v === 'string' && (MODULES as readonly string[]).includes(v);
export const isStatus = (v: unknown): v is TicketStatus =>
  typeof v === 'string' && (STATUSES as readonly string[]).includes(v);
export const isKind = (v: unknown): v is NoticeKind =>
  typeof v === 'string' && (NOTICE_KINDS as readonly string[]).includes(v);
export const isLink = (v: unknown): v is NoticeLink =>
  typeof v === 'string' && (LINKS as readonly string[]).includes(v);

/** Trims and bounds a free-text value; returns null when empty or not a string. */
export function text(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}
