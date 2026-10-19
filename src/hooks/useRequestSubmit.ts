import { useState } from 'react';
import { submitRequest } from '../api/mock';
import type { ModuleId } from '../data/catalog';
import { displayId } from '../lib/ids';
import { useUi } from '../store/ui';
import type { Ticket } from '../store/tickets';

/** Submits a request, shows the toast, and keeps the created ticket for the success panel. */
export function useRequestSubmit(module: ModuleId) {
  const toast = useUi((s) => s.toast);
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const submit = async (title: string, details: string[]) => {
    setSubmitting(true);
    try {
      const t = await submitRequest({ module, title, details });
      setTicket(t);
      toast({
        tone: 'success',
        title: 'درخواست با موفقیت ثبت شد',
        body: `کد پیگیری: ${displayId(t.id)}`,
      });
      return t;
    } catch {
      toast({
        tone: 'error',
        title: 'ثبت درخواست انجام نشد',
        body: 'اتصال را بررسی کنید و دوباره تلاش کنید.',
      });
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return { submit, submitting, ticket, reset: () => setTicket(null) };
}

/** Focus the first invalid field after a failed submit. */
export function focusFirstInvalid(form: HTMLFormElement | null) {
  requestAnimationFrame(() => {
    form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  });
}
