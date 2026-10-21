/**
 * HTTP client for the Caspian Pro server. Every call carries the session token;
 * a 401 ends the session (the app shows the login screen again).
 */
import type { ModuleId } from '../data/catalog';
import { useSession, type StoreInfo } from '../store/session';
import type { Notice } from '../store/notifications';
import type { Ticket } from '../store/tickets';
import { apiBase } from './config';
import type { ParkingSubscription } from './parking';

/** The server answered with an error (bad input, not allowed, …). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly data: Record<string, unknown>;
  constructor(status: number, code: string, message: string, data: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

/** The server could not be reached (offline, timeout, DNS). Safe to retry later. */
export class NetworkError extends Error {
  constructor() {
    super('اتصال به سرور برقرار نشد.');
  }
}

export const TIMEOUT_MS = 15_000;

export async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean; timeout?: number } = {},
): Promise<T> {
  const base = apiBase() ?? '';
  const token = useSession.getState().token;
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  if (opts.auth !== false && token) headers.authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${base}/api${path}`, {
      method: opts.method ?? (opts.body === undefined ? 'GET' : 'POST'),
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: AbortSignal.timeout(opts.timeout ?? TIMEOUT_MS),
    });
  } catch {
    throw new NetworkError();
  }

  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    if (!res.ok)
      throw res.status >= 500
        ? new NetworkError()
        : new ApiError(res.status, 'bad_response', 'پاسخ سرور نامعتبر است.');
  }
  if (!res.ok) {
    // Proxies and restarts answer 502/503/504: treat as "try again later".
    if (res.status >= 502 && res.status <= 504 && !data.error) throw new NetworkError();
    if (res.status === 401 && opts.auth !== false) useSession.getState().clear();
    throw new ApiError(
      res.status,
      String(data.error ?? 'error'),
      String(data.message ?? 'خطایی رخ داد. دوباره تلاش کنید.'),
      data,
    );
  }
  return data as T;
}

// ---------- auth ----------

export const requestOtp = (phone: string) =>
  api<{ ok: true; resendIn: number }>('/auth/otp', { body: { phone }, auth: false });

export const verifyOtp = (phone: string, code: string) =>
  api<{ token: string; phone: string; store: StoreInfo }>('/auth/verify', {
    body: { phone, code },
    auth: false,
  });

export const fetchMe = () => api<{ phone: string; store: StoreInfo }>('/me');

export const logoutRemote = (endpoint?: string) =>
  api<{ ok: true }>('/auth/logout', { body: { endpoint } });

// ---------- tickets ----------

export const fetchTickets = () => api<{ items: Ticket[] }>('/tickets');

export const createTicket = (input: {
  module: ModuleId;
  title: string;
  details: string[];
  clientId: string;
  photos?: string[];
}) => api<{ ticket: Ticket }>('/tickets', { body: input, timeout: 60_000 });

export const dispatchSecurityRemote = (clientId: string) =>
  api<{ etaMinutes: number; ticket: Ticket }>('/security/dispatch', { body: { clientId } });

// ---------- notifications ----------

export const fetchNotices = () => api<{ items: Notice[] }>('/notifications');

export const markNoticesRead = (ids: string[] | 'all') =>
  api<{ ok: true }>('/notifications/read', { body: ids === 'all' ? { all: true } : { ids } });

// ---------- parking ----------

export const fetchParking = () => api<ParkingSubscription>('/parking');

// ---------- push ----------

export const fetchConfig = () =>
  api<{ version: string; pushKey: string | null }>('/config', { auth: false });

export const savePushSubscription = (sub: PushSubscriptionJSON) =>
  api<{ ok: true }>('/push/subscribe', { body: sub });
