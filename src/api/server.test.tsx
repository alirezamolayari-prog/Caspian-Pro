import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { PROMPT_KEY } from '../features/onboarding/notifications';
import { useNotifications } from '../store/notifications';
import { useSession } from '../store/session';
import { useTickets, type Ticket } from '../store/tickets';
import { useUi } from '../store/ui';
import { submitRequest, syncAll } from '.';
import { setApiBase } from './config';
import { flushOutbox, useOutbox } from './outbox';

const STORE = {
  id: 'u30',
  name: 'خواب ناز',
  unit: '30',
  floor: 'طبقه اول',
  manager: 'خانم احمدی',
  category: 'سرویس خواب',
};

const serverTicket = (over: Partial<Ticket> = {}): Ticket => ({
  id: 'CSP-700001',
  module: 'support',
  title: 'پیام به پشتیبانی',
  details: ['سلام'],
  status: 'submitted',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...over,
});

type Handler = (url: string, init: RequestInit) => Response | Promise<Response>;
let handler: Handler;
const calls: { url: string; body: unknown; auth: string | null }[] = [];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

beforeEach(() => {
  setApiBase('');
  calls.length = 0;
  handler = (url) => {
    if (url.endsWith('/api/tickets')) return json({ items: [] });
    if (url.endsWith('/api/notifications')) return json({ items: [] });
    if (url.endsWith('/api/me')) return json({ phone: '09121112233', store: STORE });
    if (url.endsWith('/api/config')) return json({ version: '1.2.0', pushKey: null });
    return json({ error: 'not_found', message: 'x' }, 404);
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const headers = (init.headers ?? {}) as Record<string, string>;
      calls.push({
        url,
        body: init.body ? JSON.parse(String(init.body)) : undefined,
        auth: headers.authorization ?? null,
      });
      return handler(url, init);
    }),
  );
  useTickets.setState({ items: [] });
  useNotifications.setState({ items: [] });
  useOutbox.setState({ items: [] });
  useSession.getState().clear();
  useUi.setState({ toasts: [] });
  localStorage.setItem(PROMPT_KEY, 'browser,standalone');
});

afterEach(() => {
  setApiBase(null);
  vi.unstubAllGlobals();
});

describe('login (server mode)', () => {
  it('asks for the phone, then the SMS code, then shows the store from the server', async () => {
    const user = userEvent.setup();
    handler = (url, init) => {
      if (url.endsWith('/api/auth/otp')) return json({ ok: true, resendIn: 60 });
      if (url.endsWith('/api/auth/verify')) {
        const { code } = JSON.parse(String(init.body)) as { code: string };
        return code === '12345'
          ? json({ token: 'tok-1', phone: '09121112233', store: STORE })
          : json({ error: 'wrong', message: 'کد واردشده درست نیست.' }, 401);
      }
      if (url.endsWith('/api/tickets') || url.endsWith('/api/notifications'))
        return json({ items: [] });
      if (url.endsWith('/api/me')) return json({ phone: '09121112233', store: STORE });
      return json({ version: '1.2.0', pushKey: null });
    };
    render(<App />);

    expect(screen.getByRole('heading', { name: 'کاسپین پرو' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/شماره موبایل/), '۰۹۱۲۱۱۱۲۲۳۳');
    await user.click(screen.getByRole('button', { name: 'دریافت کد ورود' }));
    expect(calls.find((c) => c.url.endsWith('/auth/otp'))?.body).toEqual({ phone: '09121112233' });

    const code = await screen.findByLabelText('کد ورود');
    await user.type(code, '11111');
    expect(await screen.findByText('کد واردشده درست نیست.')).toBeInTheDocument();

    await user.clear(code);
    await user.type(code, '۱۲۳۴۵');
    expect(await screen.findByRole('heading', { level: 1, name: 'خواب ناز' })).toBeInTheDocument();
    expect(useSession.getState().token).toBe('tok-1');
    await waitFor(() =>
      expect(calls.some((c) => c.url.endsWith('/api/tickets') && c.auth === 'Bearer tok-1')).toBe(
        true,
      ),
    );
  });

  it('a rejected session (401) returns to the login screen', async () => {
    useSession.getState().setSession({ token: 'old', phone: '09121112233', store: STORE });
    handler = () => json({ error: 'unauthorized', message: 'نشست تمام شده' }, 401);
    render(<App />);
    expect(await screen.findByRole('button', { name: 'دریافت کد ورود' })).toBeInTheDocument();
    expect(useSession.getState().token).toBeNull();
  });
});

describe('requests (server mode)', () => {
  beforeEach(() => {
    useSession.getState().setSession({ token: 'tok', phone: '09121112233', store: STORE });
  });

  it('sends the request and shows the server tracking id', async () => {
    handler = (url) =>
      url.endsWith('/api/tickets') ? json({ ticket: serverTicket() }, 201) : json({ items: [] });
    const r = await submitRequest({ module: 'support', title: 'پیام', details: ['سلام'] });
    expect(r.queued).toBe(false);
    expect(r.ticket.id).toBe('CSP-700001');
    expect(useTickets.getState().items[0]!.id).toBe('CSP-700001');
    const sent = calls.find((c) => c.url.endsWith('/api/tickets'))!.body as { clientId: string };
    expect(sent.clientId).toBeTruthy();
  });

  it('queues the request offline and sends it once the connection is back', async () => {
    handler = () => {
      throw new TypeError('Failed to fetch');
    };
    const r = await submitRequest({ module: 'support', title: 'پیام', details: ['سلام'] });
    expect(r.queued).toBe(true);
    expect(useTickets.getState().items[0]!.status).toBe('queued');
    expect(useOutbox.getState().items).toHaveLength(1);
    const clientId = useOutbox.getState().items[0]!.clientId;

    // Still offline: nothing changes.
    expect(await flushOutbox()).toBe(0);
    expect(useOutbox.getState().items).toHaveLength(1);

    handler = (url) =>
      url.endsWith('/api/tickets') ? json({ ticket: serverTicket() }, 201) : json({ items: [] });
    expect(await flushOutbox()).toBe(1);
    expect(useOutbox.getState().items).toHaveLength(0);
    const items = useTickets.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]!.id).toBe('CSP-700001');
    const retry = calls.filter((c) => c.url.endsWith('/api/tickets')).at(-1)!.body as {
      clientId: string;
    };
    expect(retry.clientId).toBe(clientId);
  });

  it('a request the server refuses is marked and the user is told', async () => {
    handler = () => {
      throw new TypeError('offline');
    };
    await submitRequest({ module: 'support', title: 'پیام', details: [] });
    handler = () => json({ error: 'bad_input', message: 'اطلاعات درخواست کامل نیست.' }, 400);
    await flushOutbox();
    expect(useOutbox.getState().items).toHaveLength(0);
    expect(useTickets.getState().items[0]!.status).toBe('rejected');
    expect(useNotifications.getState().items[0]!.body).toBe('اطلاعات درخواست کامل نیست.');
  });

  it('sync keeps queued requests and takes the rest from the server', async () => {
    handler = () => {
      throw new TypeError('offline');
    };
    await submitRequest({ module: 'support', title: 'در صف', details: [] });
    handler = (url) => {
      if (url.endsWith('/api/tickets') && calls.at(-1)?.body) throw new TypeError('offline');
      if (url.endsWith('/api/tickets'))
        return json({ items: [serverTicket({ id: 'CSP-100200', status: 'approved' })] });
      return json({ items: [] });
    };
    await act(() => syncAll());
    const ids = useTickets.getState().items.map((t) => t.status);
    expect(ids).toEqual(expect.arrayContaining(['queued', 'approved']));
  });
});
