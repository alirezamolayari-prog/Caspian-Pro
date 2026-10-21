import { toFa } from './persian';

/** Mock tracking id «CSP-123456». The server will issue real ones. */
export function makeTicketId(rand: () => number = Math.random): string {
  return `CSP-${String(Math.floor(rand() * 900000) + 100000)}`;
}

/** Prefix for tickets saved offline that have no server id yet. */
export const QUEUED_PREFIX = 'Q-';

export const displayId = (id: string) =>
  id.startsWith(QUEUED_PREFIX) ? 'پس از اتصال صادر می‌شود' : toFa(id);

export function makeKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
