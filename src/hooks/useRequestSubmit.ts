import { useState } from 'react';
import { ApiError, submitRequest } from '../api';
import type { ModuleId } from '../data/catalog';
import { displayId } from '../lib/ids';
import { useUi } from '../store/ui';
import type { Ticket } from '../store/tickets';

/** Submits a request, shows the toast, and keeps the created ticket for the success panel. */
export function useRequestSubmit(module: ModuleId) {
  const toast = useUi((s) => s.toast);
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const submit = async (title: string, details: string[], photos?: File[]) => {
    setSubmitting(true);
    try {
      const { ticket: t, queued } = await submitRequest({ module, title, details, photos });
      setTicket(t);
      toast(
        queued
          ? {
              tone: 'info',
              title: 'اینترنت وصل نیست؛ درخواست ذخیره شد',
              body: 'با وصل شدن اینترنت خودکار ارسال می‌شود.',
            }
          : {
              tone: 'success',
              title: 'درخواست با موفقیت ثبت شد',
              body: `کد پیگیری: ${displayId(t.id)}`,
            },
      );
      return t;
    } catch (e) {
      toast({
        tone: 'error',
        title: 'ثبت درخواست انجام نشد',
        body:
          e instanceof ApiError
            ? e.message
            : e instanceof Error && e.message === 'photo'
              ? 'یکی از عکس‌ها قابل خواندن نیست. عکس دیگری انتخاب کنید.'
              : 'اتصال را بررسی کنید و دوباره تلاش کنید.',
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
