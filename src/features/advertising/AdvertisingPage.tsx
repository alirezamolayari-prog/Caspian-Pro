import { Check, Megaphone } from 'lucide-react';
import { useRef, useState } from 'react';
import { PageHeader } from '../../components/layout/Header';
import { SuccessPanel } from '../../components/layout/Success';
import { Button } from '../../components/ui/Button';
import { SectionTitle } from '../../components/ui/Card';
import { Segmented } from '../../components/ui/Choice';
import { Field, TextArea, TextInput } from '../../components/ui/Field';
import { cx } from '../../components/ui/cx';
import { AD_CHANNELS, AD_DURATIONS } from '../../data/catalog';
import { focusFirstInvalid, useRequestSubmit } from '../../hooks/useRequestSubmit';
import { isLinkOrHandle, minLength } from '../../lib/validators';

type Duration = (typeof AD_DURATIONS)[number];

export function AdvertisingPage() {
  const [channels, setChannels] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState<Duration>('۲ هفته');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const { submit, submitting, ticket, reset } = useRequestSubmit('advertising');

  const needsLink = channels.includes('digital');
  const validation = {
    channels: channels.length === 0 ? 'حداقل یک کانال تبلیغاتی انتخاب کنید.' : '',
    title: !minLength(title, 3) ? 'عنوان کمپین را وارد کنید (حداقل ۳ حرف).' : '',
    description: !minLength(description, 10) ? 'توضیحات کمپین حداقل ۱۰ حرف باشد.' : '',
    link:
      link.trim() && !isLinkOrHandle(link)
        ? 'آدرس سایت (مثل caspian.ir) یا آیدی اینستاگرام (مثل ‎@royal.furniture) وارد کنید.'
        : needsLink && !link.trim()
          ? 'برای تبلیغات دیجیتال، لینک سایت یا اینستاگرام لازم است.'
          : '',
  };
  const err = (k: keyof typeof validation) => (touched[k] ? validation[k] : '');
  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ channels: true, title: true, description: true, link: true });
    if (Object.values(validation).some(Boolean)) {
      if (validation.channels)
        formRef.current?.querySelector<HTMLElement>('[aria-pressed]')?.focus();
      else focusFirstInvalid(formRef.current);
      return;
    }
    const names = AD_CHANNELS.filter((c) => channels.includes(c.id)).map((c) => c.title);
    const ok = await submit(`کمپین «${title.trim()}»`, [
      names.join('، '),
      duration,
      description.trim(),
      ...(link.trim() ? [link.trim()] : []),
    ]);
    if (ok) {
      setChannels([]);
      setTitle('');
      setDescription('');
      setLink('');
      setTouched({});
    }
  };

  return (
    <>
      <PageHeader back title="درخواست تبلیغات" subtitle="کمپین دیجیتال و تبلیغات محیطی کاسپین" />
      <div className="animate-view flex flex-col gap-4 px-4 pt-4">
        {ticket ? (
          <SuccessPanel
            ticket={ticket}
            message="واحد تبلیغات کاسپین تا ۲ روز کاری با شما تماس می‌گیرد."
            onNew={reset}
          />
        ) : (
          <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            <section aria-labelledby="channels-title">
              <SectionTitle>
                <span id="channels-title">کانال‌های تبلیغاتی</span>
              </SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                {AD_CHANNELS.map((c) => {
                  const Icon = c.icon;
                  const on = channels.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setChannels((s) => (on ? s.filter((x) => x !== c.id) : [...s, c.id]));
                        touch('channels');
                      }}
                      className={cx(
                        'theme-fade relative flex min-h-36 flex-col gap-2 overflow-hidden rounded-2xl border p-4 text-start shadow-card transition-transform duration-150 active:scale-95 cursor-pointer',
                        on
                          ? 'border-gold bg-header-2 text-on-header'
                          : 'border-line bg-surface text-ink',
                      )}
                    >
                      <span
                        aria-hidden
                        className={cx(
                          'pointer-events-none absolute -end-6 -top-6 size-20 rounded-full blur-xl',
                          on ? 'bg-gold/30' : 'bg-gold/10',
                        )}
                      />
                      <span
                        className={cx(
                          'relative inline-flex size-11 items-center justify-center rounded-xl',
                          on ? 'bg-gold text-on-gold' : 'bg-gold-soft text-gold-ink',
                        )}
                      >
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="relative text-sm font-extrabold leading-6">{c.title}</span>
                      <span
                        className={cx(
                          'relative text-xs leading-5',
                          on ? 'text-on-header-2' : 'text-ink-2',
                        )}
                      >
                        {c.description}
                      </span>
                      {on && (
                        <span className="absolute end-3 top-3 inline-flex size-6 items-center justify-center rounded-full bg-gold text-on-gold">
                          <Check className="size-4" aria-hidden />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {err('channels') && (
                <p role="alert" className="mt-2 px-1 text-xs font-bold text-danger">
                  {err('channels')}
                </p>
              )}
            </section>

            <Field label="عنوان کمپین" required error={err('title')}>
              {({ id, describedBy, invalid }) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  aria-required
                  value={title}
                  maxLength={80}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => touch('title')}
                  placeholder="مثلاً جشنواره پاییزه مبلمان رویال"
                />
              )}
            </Field>

            <div className="flex flex-col gap-2">
              <p className="px-1 text-sm font-bold text-ink">مدت نمایش</p>
              <Segmented<Duration>
                label="مدت نمایش"
                value={duration}
                onChange={setDuration}
                options={AD_DURATIONS.map((d) => ({ value: d, label: d }))}
              />
            </div>

            <Field
              label="توضیحات"
              required
              error={err('description')}
              helper="پیام اصلی، تخفیف‌ها و مخاطب هدف"
            >
              {({ id, describedBy, invalid }) => (
                <TextArea
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  aria-required
                  value={description}
                  maxLength={600}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => touch('description')}
                />
              )}
            </Field>

            <Field
              label="لینک مقصد (وب‌سایت یا اینستاگرام)"
              required={needsLink}
              error={err('link')}
              helper="مثل royalfurniture.ir یا ‎@royal.furniture"
            >
              {({ id, describedBy, invalid }) => (
                <TextInput
                  id={id}
                  dir="ltr"
                  className="text-start"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={link}
                  maxLength={200}
                  onChange={(e) => setLink(e.target.value)}
                  onBlur={() => touch('link')}
                  placeholder="https://"
                />
              )}
            </Field>

            <Button type="submit" size="lg" block icon={Megaphone} loading={submitting}>
              ثبت درخواست تبلیغات
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
