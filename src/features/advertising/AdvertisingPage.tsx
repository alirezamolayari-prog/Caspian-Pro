import { Check, Megaphone } from 'lucide-react';
import { useRef, useState } from 'react';
import { PageHeader } from '../../components/layout/Header';
import { SuccessPanel } from '../../components/layout/Success';
import { Button } from '../../components/ui/Button';
import { IconTile, SectionTitle } from '../../components/ui/Card';
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
      <PageHeader back title="درخواست تبلیغات" subtitle="تبلیغات دیجیتال و محیطی کاسپین" />
      <div className="animate-view flex flex-col gap-4 px-4 pt-2">
        {ticket ? (
          <SuccessPanel
            ticket={ticket}
            message="واحد تبلیغات کاسپین تا ۲ روز کاری با شما تماس می‌گیرد."
            onNew={reset}
          />
        ) : (
          <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            <section aria-labelledby="channels-title">
              <SectionTitle id="channels-title">کانال تبلیغ</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                {AD_CHANNELS.map((c) => {
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
                        'theme-fade relative flex min-h-36 flex-col gap-2 rounded-[20px] border bg-card p-4 text-start transition-colors cursor-pointer',
                        on ? 'border-primary ring-1 ring-primary' : 'border-line hover:bg-row',
                      )}
                    >
                      <IconTile icon={c.icon} />
                      <span className="text-[15px] font-semibold leading-6 text-ink">
                        {c.title}
                      </span>
                      <span className="text-[13px] leading-5 text-ink-2">{c.description}</span>
                      {on && (
                        <span className="absolute end-3 top-3 inline-flex size-6 items-center justify-center rounded-full bg-primary text-on-primary">
                          <Check className="size-4" strokeWidth={2.5} aria-hidden />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {err('channels') && (
                <p role="alert" className="mt-2 px-2 text-[13px] font-semibold text-danger">
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
                  placeholder="مثلاً جشنواره پاییزه"
                />
              )}
            </Field>

            <div className="flex flex-col gap-2">
              <p className="px-2 text-[15px] font-semibold text-ink">مدت نمایش</p>
              <Segmented<Duration>
                label="مدت نمایش"
                value={duration}
                onChange={setDuration}
                columns={2}
                options={AD_DURATIONS.map((d) => ({ value: d, label: d }))}
              />
            </div>

            <Field
              label="توضیحات"
              required
              error={err('description')}
              helper="پیام اصلی، تخفیف‌ها و مخاطب"
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
              label="لینک (سایت یا اینستاگرام)"
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
                />
              )}
            </Field>

            <Button type="submit" block icon={Megaphone} loading={submitting}>
              ثبت درخواست تبلیغات
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
