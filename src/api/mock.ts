/**
 * Mock backend. Every call is async with a short delay so the UI shows real
 * loading states; swap this module for an HTTP client when the server exists.
 */
import type { ModuleId } from '../data/catalog';
import { useLoading } from '../store/loading';
import { useNotifications } from '../store/notifications';
import { useTickets, type Ticket } from '../store/tickets';

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const LATENCY = { submit: 700, extension: 2200, dispatch: 900 };

export async function submitRequest(input: {
  module: ModuleId;
  title: string;
  details: string[];
}): Promise<Ticket> {
  await delay(LATENCY.submit);
  const ticket = useTickets.getState().add(input);
  useNotifications.getState().add({
    kind: 'ticket',
    title: `درخواست «${input.title}» ثبت شد`,
    body: `کد پیگیری ${ticket.id} – نتیجه از همین بخش اطلاع داده می‌شود.`,
    link: 'requests',
  });
  return ticket;
}

/**
 * Security reviews the extension. Mock policy: the first extension of a
 * session is approved, later ones are rejected (so the penalty flow can be seen).
 */
export async function requestExtension(): Promise<boolean> {
  const store = useLoading.getState();
  if (!store.session || store.pendingExtension || store.locked) return false;
  store.beginExtension();
  await delay(LATENCY.extension);
  const approved = useLoading.getState().approvedExtensions === 0;
  useLoading.getState().resolveExtension(approved);
  const { rejections, locked } = useLoading.getState();
  useNotifications.getState().add(
    approved
      ? {
          kind: 'loading',
          title: 'تمدید بارگیری تایید شد',
          body: '۱۵ دقیقه به زمان بارگیری شما اضافه شد.',
        }
      : {
          kind: 'security',
          title: locked ? 'دسترسی بارگیری قفل شد' : 'درخواست تمدید توسط حراست رد شد',
          body: locked
            ? 'به دلیل ۲ درخواست تمدید ردشده، فعال‌سازی مجدد فقط توسط مدیریت انجام می‌شود.'
            : `اخطار ${rejections} از ۲ – با رد شدن دوباره، دسترسی بارگیری قفل می‌شود.`,
          link: 'logistics',
        },
  );
  return approved;
}

export async function dispatchSecurity(): Promise<{ etaMinutes: number; ticket: Ticket }> {
  await delay(LATENCY.dispatch);
  const ticket = useTickets.getState().add({
    module: 'security',
    title: 'فراخوان اضطراری حراست',
    details: ['اعزام فوری نیروی حراست به غرفه'],
  });
  useTickets.getState().setStatus(ticket.id, 'in_review');
  useNotifications.getState().add({
    kind: 'security',
    title: 'تیم حراست در مسیر غرفه شماست',
    body: `کد ${ticket.id} – زمان تقریبی رسیدن ۳ دقیقه.`,
    link: 'security',
  });
  return { etaMinutes: 3, ticket };
}
