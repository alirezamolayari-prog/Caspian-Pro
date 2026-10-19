import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModuleId } from '../data/catalog';
import { makeTicketId } from '../lib/ids';
import { safeStorage } from '../lib/storage';

export type TicketStatus = 'submitted' | 'in_review' | 'approved' | 'rejected' | 'done';

export interface Ticket {
  id: string;
  module: ModuleId;
  title: string;
  details: string[];
  status: TicketStatus;
  createdAt: number;
  updatedAt: number;
}

export const STATUS_LABEL: Record<TicketStatus, string> = {
  submitted: 'ثبت شد',
  in_review: 'در حال بررسی',
  approved: 'تایید شد',
  rejected: 'رد شد',
  done: 'انجام شد',
};

export const isOpen = (s: TicketStatus) => s === 'submitted' || s === 'in_review';

interface TicketsState {
  items: Ticket[];
  add: (t: Pick<Ticket, 'module' | 'title' | 'details'>) => Ticket;
  setStatus: (id: string, status: TicketStatus) => void;
}

const now = Date.now();

export const seedTickets = (): Ticket[] => [
  {
    id: 'CSP-482913',
    module: 'services',
    title: 'خروج کالا',
    details: ['۳ دست مبل راحتی', 'درب صفرخانی'],
    status: 'approved',
    createdAt: now - 40 * 60_000,
    updatedAt: now - 12 * 60_000,
  },
  {
    id: 'CSP-551027',
    module: 'maintenance',
    title: 'روشنایی و لامپ – همکف',
    details: ['بال شرقی', 'دو چراغ راهرو خاموش است'],
    status: 'in_review',
    createdAt: now - 5 * 3600_000,
    updatedAt: now - 4 * 3600_000,
  },
];

export const useTickets = create<TicketsState>()(
  persist(
    (set) => ({
      items: seedTickets(),
      add: (t) => {
        const ticket: Ticket = {
          ...t,
          id: makeTicketId(),
          status: 'submitted',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({ items: [ticket, ...s.items] }));
        return ticket;
      },
      setStatus: (id, status) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, status, updatedAt: Date.now() } : i)),
        })),
    }),
    { name: 'caspian-tickets', storage: safeStorage, version: 1 },
  ),
);
