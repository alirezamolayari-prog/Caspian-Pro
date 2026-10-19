import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModuleId } from '../data/catalog';
import { makeKey } from '../lib/ids';
import { safeStorage } from '../lib/storage';

export type NoticeKind = 'permit' | 'loading' | 'management' | 'ticket' | 'security';

export interface Notice {
  id: string;
  kind: NoticeKind;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  link?: ModuleId | 'requests';
}

interface NotificationsState {
  items: Notice[];
  add: (n: Omit<Notice, 'id' | 'createdAt' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const now = Date.now();

export const seedNotices = (): Notice[] => [
  {
    id: 'seed-1',
    kind: 'permit',
    title: 'مجوز خروج کالا تایید شد',
    body: 'خروج ۳ دست مبل راحتی از درب صفرخانی برای امروز تایید شد.',
    createdAt: now - 12 * 60_000,
    read: false,
    link: 'requests',
  },
  {
    id: 'seed-2',
    kind: 'management',
    title: 'اطلاعیه مدیریت کاسپین',
    body: 'جشنواره فروش پاییزه از ۱ آبان آغاز می‌شود. برای رزرو فضای ویژه اقدام کنید.',
    createdAt: now - 3 * 3600_000,
    read: false,
    link: 'booth',
  },
  {
    id: 'seed-3',
    kind: 'management',
    title: 'سرویس دوره‌ای آسانسورها',
    body: 'آسانسور شماره ۲ بال شرقی پنجشنبه ساعت ۸ تا ۱۰ در حال سرویس است.',
    createdAt: now - 26 * 3600_000,
    read: true,
  },
];

export const useNotifications = create<NotificationsState>()(
  persist(
    (set) => ({
      items: seedNotices(),
      add: (n) =>
        set((s) => ({
          items: [{ ...n, id: makeKey(), createdAt: Date.now(), read: false }, ...s.items].slice(
            0,
            50,
          ),
        })),
      markRead: (id) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, read: true } : i)) })),
      markAllRead: () => set((s) => ({ items: s.items.map((i) => ({ ...i, read: true })) })),
    }),
    { name: 'caspian-notifications', storage: safeStorage, version: 1 },
  ),
);

export const selectUnread = (s: NotificationsState) => s.items.filter((i) => !i.read).length;
