import { ChevronDown, Clock, MessageSquareText, Phone } from 'lucide-react';
import { useRef, useState } from 'react';
import { PageHeader } from '../../components/layout/Header';
import { SuccessPanel } from '../../components/layout/Success';
import { Button } from '../../components/ui/Button';
import { Card, IconTile, SectionTitle, ZebraList } from '../../components/ui/Card';
import { Field, TextArea } from '../../components/ui/Field';
import { cx } from '../../components/ui/cx';
import { MALL_RULES, SUPPORT_CONTACTS } from '../../data/catalog';
import { focusFirstInvalid, useRequestSubmit } from '../../hooks/useRequestSubmit';
import { toFa } from '../../lib/persian';
import { minLength } from '../../lib/validators';

export function SupportPage() {
  const [openRule, setOpenRule] = useState<number | null>(null);
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
      <PageHeader back title="پشتیبانی و قوانین" subtitle="تماس، مقررات پاساژ و پیام" />
      <div className="animate-view flex flex-col gap-6 px-4 pt-2">
        <section aria-labelledby="contacts-title">
          <SectionTitle id="contacts-title">تماس</SectionTitle>
          <ZebraList label="شماره‌های تماس">
            {SUPPORT_CONTACTS.map((c) => (
              <li key={c.phone}>
                <a href={`tel:${c.phone}`} className="flex min-h-16 items-center gap-3 px-4 py-3">
                  <IconTile icon={Phone} size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-semibold text-ink">{c.title}</span>
                    <span className="flex items-center gap-1 text-[13px] text-ink-2">
                      <Clock className="size-3.5" aria-hidden /> {c.hours}
                    </span>
                  </span>
                  <span className="tabular text-[15px] font-semibold text-ink" dir="ltr">
                    {toFa(c.phone)}
                  </span>
                </a>
              </li>
            ))}
          </ZebraList>
        </section>

        <section aria-labelledby="rules-title">
          <SectionTitle id="rules-title">قوانین پاساژ</SectionTitle>
          <ZebraList label="قوانین پاساژ">
            {MALL_RULES.map((r, i) => {
              const open = openRule === i;
              return (
                <li key={r.title}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={`rule-${i}`}
                      onClick={() => setOpenRule(open ? null : i)}
                      className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-start font-semibold text-ink cursor-pointer"
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
                      className="animate-fade px-4 pb-4 text-[15px] leading-7 text-ink-2"
                    >
                      {r.body}
                    </p>
                  )}
                </li>
              );
            })}
          </ZebraList>
        </section>

        <section aria-labelledby="msg-title">
          <SectionTitle id="msg-title">پیام به پشتیبانی</SectionTitle>
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
