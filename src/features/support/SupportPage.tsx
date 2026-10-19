import { ChevronDown, Clock, MessageSquareText, Phone, ScrollText } from 'lucide-react';
import { useRef, useState } from 'react';
import { PageHeader } from '../../components/layout/Header';
import { SuccessPanel } from '../../components/layout/Success';
import { Button } from '../../components/ui/Button';
import { Card, SectionTitle } from '../../components/ui/Card';
import { Field, TextArea } from '../../components/ui/Field';
import { cx } from '../../components/ui/cx';
import { MALL_RULES, SUPPORT_CONTACTS } from '../../data/catalog';
import { focusFirstInvalid, useRequestSubmit } from '../../hooks/useRequestSubmit';
import { toFa } from '../../lib/persian';
import { minLength } from '../../lib/validators';

export function SupportPage() {
  const [openRule, setOpenRule] = useState<number | null>(0);
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { submit, submitting, ticket, reset } = useRequestSubmit('support');
  const error = touched && !minLength(message, 10) ? 'پیام خود را حداقل در ۱۰ حرف بنویسید.' : '';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!minLength(message, 10)) {
      focusFirstInvalid(formRef.current);
      return;
    }
    const ok = await submit('پیام به پشتیبانی', [message.trim()]);
    if (ok) {
      setMessage('');
      setTouched(false);
    }
  };

  return (
    <>
      <PageHeader back title="پشتیبانی و قوانین پاساژ" subtitle="مقررات، تماس و ارسال پیام" />
      <div className="animate-view flex flex-col gap-6 px-4 pt-4">
        <section aria-labelledby="contacts-title">
          <SectionTitle>
            <span id="contacts-title">تماس سریع</span>
          </SectionTitle>
          <Card className="divide-y divide-line p-0">
            {SUPPORT_CONTACTS.map((c) => (
              <a
                key={c.phone}
                href={`tel:${c.phone}`}
                className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-surface-2"
              >
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold-ink">
                  <Phone className="size-5" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-bold text-ink">{c.title}</span>
                  <span className="flex items-center gap-1 text-xs text-ink-2">
                    <Clock className="size-3.5" aria-hidden /> {c.hours}
                  </span>
                </span>
                <span className="tabular text-sm font-bold text-gold-ink" dir="ltr">
                  {toFa(c.phone)}
                </span>
              </a>
            ))}
          </Card>
        </section>

        <section aria-labelledby="rules-title">
          <SectionTitle>
            <span id="rules-title" className="flex items-center gap-2">
              <ScrollText className="size-5 text-gold-ink" aria-hidden /> قوانین و مقررات پاساژ
            </span>
          </SectionTitle>
          <Card className="divide-y divide-line p-0">
            {MALL_RULES.map((r, i) => {
              const open = openRule === i;
              return (
                <div key={r.title}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={`rule-${i}`}
                      onClick={() => setOpenRule(open ? null : i)}
                      className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-start font-bold text-ink cursor-pointer"
                    >
                      {r.title}
                      <ChevronDown
                        className={cx(
                          'size-5 shrink-0 text-ink-2 transition-transform duration-200',
                          open && 'rotate-180',
                        )}
                        aria-hidden
                      />
                    </button>
                  </h3>
                  {open && (
                    <p
                      id={`rule-${i}`}
                      className="animate-fade px-4 pb-4 text-sm leading-7 text-ink-2"
                    >
                      {r.body}
                    </p>
                  )}
                </div>
              );
            })}
          </Card>
        </section>

        <section aria-labelledby="msg-title">
          <SectionTitle>
            <span id="msg-title" className="flex items-center gap-2">
              <MessageSquareText className="size-5 text-gold-ink" aria-hidden /> پیام به پشتیبانی
            </span>
          </SectionTitle>
          {ticket ? (
            <SuccessPanel
              ticket={ticket}
              message="پشتیبانی کاسپین در ساعات کاری پاسخ می‌دهد."
              onNew={reset}
            />
          ) : (
            <Card>
              <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
                <Field label="متن پیام" required error={error}>
                  {({ id, describedBy, invalid }) => (
                    <TextArea
                      id={id}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      aria-required
                      value={message}
                      maxLength={800}
                      onChange={(e) => setMessage(e.target.value)}
                      onBlur={() => setTouched(true)}
                    />
                  )}
                </Field>
                <Button type="submit" block icon={MessageSquareText} loading={submitting}>
                  ارسال پیام
                </Button>
              </form>
            </Card>
          )}
        </section>
      </div>
    </>
  );
}
