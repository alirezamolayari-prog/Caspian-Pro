/**
 * What the screens call. In demo mode it uses `mock.ts`; in server mode the
 * HTTP client, with the offline queue for requests.
 */
import type { ModuleId } from '../data/catalog';
import { makeKey } from '../lib/ids';
import { compressImage } from '../lib/image';
import { useNotifications } from '../store/notifications';
import { useTickets, type Ticket } from '../store/tickets';
import { isServerMode } from './config';
import {
  ApiError,
  createTicket,
  dispatchSecurityRemote,
  fetchNotices,
  fetchTickets,
  markNoticesRead,
  NetworkError,
} from './http';
import * as mock from './mock';
import { enqueue, flushOutbox } from './outbox';

export { ApiError, NetworkError };

export interface SubmitResult {
  ticket: Ticket;
  /** Saved on the device because there was no connection; it will be sent later. */
  queued: boolean;
}

export async function submitRequest(input: {
  module: ModuleId;
  title: string;
  details: string[];
  photos?: File[];
}): Promise<SubmitResult> {
  if (!isServerMode()) {
    const ticket = await mock.submitRequest(input);
    return { ticket, queued: false };
  }
  const photos = await Promise.all((input.photos ?? []).map(compressImage));
  const item = {
    clientId: makeKey(),
    module: input.module,
    title: input.title,
    details: input.details,
    photos,
    createdAt: Date.now(),
  };
  try {
    const { ticket } = await createTicket(item);
    useTickets.getState().upsert(ticket);
    void syncNotices();
    return { ticket, queued: false };
  } catch (e) {
    if (e instanceof NetworkError) return { ticket: enqueue(item), queued: true };
    throw e;
  }
}

/** Emergency call. Never queued: if it fails, the screen tells the user to phone security. */
export async function dispatchSecurity(): Promise<{ etaMinutes: number; ticket: Ticket }> {
  if (!isServerMode()) return mock.dispatchSecurity();
  const r = await dispatchSecurityRemote(makeKey());
  useTickets.getState().upsert(r.ticket);
  void syncNotices();
  return r;
}

export function markNoticeRead(id: string) {
  useNotifications.getState().markRead(id);
  if (isServerMode()) markNoticesRead([id]).catch(() => undefined);
}

export function markAllNoticesRead() {
  useNotifications.getState().markAllRead();
  if (isServerMode()) markNoticesRead('all').catch(() => undefined);
}

export async function syncNotices() {
  if (!isServerMode()) return;
  try {
    const { items } = await fetchNotices();
    useNotifications.getState().replaceAll(items);
  } catch {
    /* offline: keep what we have */
  }
}

/** Sends the offline queue, then refreshes tickets and notifications from the server. */
export async function syncAll() {
  if (!isServerMode()) return;
  await flushOutbox().catch(() => 0);
  try {
    const [t, n] = await Promise.all([fetchTickets(), fetchNotices()]);
    useTickets.getState().replaceFromServer(t.items);
    useNotifications.getState().replaceAll(n.items);
  } catch {
    /* offline or logged out: keep local data */
  }
}
