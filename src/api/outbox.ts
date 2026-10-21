/**
 * Offline queue (server mode). A request made without internet is saved on the
 * device and shown as «در صف ارسال»; it is sent when the connection comes back.
 * Each item carries a `clientId`, so the server never creates it twice.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModuleId } from '../data/catalog';
import { QUEUED_PREFIX } from '../lib/ids';
import { safeStorage } from '../lib/storage';
import { useNotifications } from '../store/notifications';
import { useTickets, type Ticket } from '../store/tickets';
import { ApiError, createTicket, NetworkError } from './http';

export interface OutboxItem {
  clientId: string;
  module: ModuleId;
  title: string;
  details: string[];
  photos: string[];
  createdAt: number;
}

interface OutboxState {
  items: OutboxItem[];
  add: (item: OutboxItem) => void;
  remove: (clientId: string) => void;
}

export const useOutbox = create<OutboxState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) => set((s) => ({ items: [...s.items, item] })),
      remove: (clientId) => set((s) => ({ items: s.items.filter((i) => i.clientId !== clientId) })),
    }),
    { name: 'caspian-outbox', storage: safeStorage, version: 1 },
  ),
);

export const queuedTicketId = (clientId: string) => `${QUEUED_PREFIX}${clientId}`;

/** Saves the request on the device and shows it in the requests list. */
export function enqueue(item: OutboxItem): Ticket {
  useOutbox.getState().add(item);
  const ticket: Ticket = {
    id: queuedTicketId(item.clientId),
    module: item.module,
    title: item.title,
    details: item.details,
    status: 'queued',
    createdAt: item.createdAt,
    updatedAt: item.createdAt,
  };
  useTickets.getState().upsert(ticket);
  return ticket;
}

let flushing: Promise<number> | null = null;

/** Sends queued requests in order. Stops at the first network failure. Returns how many were sent. */
export function flushOutbox(): Promise<number> {
  if (flushing) return flushing;
  const run = (async () => {
    let sent = 0;
    for (const item of [...useOutbox.getState().items]) {
      try {
        const { ticket } = await createTicket({
          module: item.module,
          title: item.title,
          details: item.details,
          clientId: item.clientId,
          ...(item.photos.length ? { photos: item.photos } : {}),
        });
        useTickets.getState().upsert(ticket, queuedTicketId(item.clientId));
        useOutbox.getState().remove(item.clientId);
        sent++;
      } catch (e) {
        if (e instanceof NetworkError) break;
        if (e instanceof ApiError && e.status === 401) break;
        if (e instanceof ApiError && (e.status === 429 || e.status >= 500)) break;
        // The server refused it for good (bad data): tell the user and drop it.
        useOutbox.getState().remove(item.clientId);
        useTickets.getState().setStatus(queuedTicketId(item.clientId), 'rejected');
        useNotifications.getState().add({
          kind: 'ticket',
          title: `ارسال «${item.title}» انجام نشد`,
          body: e instanceof Error ? e.message : 'لطفاً درخواست را دوباره ثبت کنید.',
          link: item.module,
        });
      }
    }
    return sent;
  })();
  // Release the lock after this run settles (also when the queue was empty).
  flushing = run.finally(() => {
    flushing = null;
  });
  return flushing;
}
