import { toFa } from './persian';

/** Mock tracking id «CSP-123456». The server will issue real ones. */
export function makeTicketId(rand: () => number = Math.random): string {
  return `CSP-${String(Math.floor(rand() * 900000) + 100000)}`;
}

export const displayId = (id: string) => toFa(id);

export function makeKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
