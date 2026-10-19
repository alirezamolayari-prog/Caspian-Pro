import { CalendarDays, Minus, Plus } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { PageHeader } from '../../components/layout/Header';
import { SuccessPanel } from '../../components/layout/Success';
import { Badge } from '../../components/ui/Badge';
import { Button, IconButton } from '../../components/ui/Button';
import { Card, SectionTitle } from '../../components/ui/Card';
import { RadioCard } from '../../components/ui/Choice';
import { Field, TextArea } from '../../components/ui/Field';
import { cx } from '../../components/ui/cx';
import { BOOTH_ZONES } from '../../data/catalog';
import { focusFirstInvalid, useRequestSubmit } from '../../hooks/useRequestSubmit';
import { formatJalali, formatJalaliShort, formatWeekday, toFa } from '../../lib/persian';
import { minLength } from '../../lib/validators';

const MAX_DAYS = 14;

function upcomingDays(count: number): Date[] {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => new Date(base.getTime() + (i + 1) * 86_400_000));
}

export function BoothPage() {
  const days = useMemo(() => upcomingDays(14), []);
  const [zone, setZone] = useState<string | null>(null);
  const [start, setStart] = useState<number | null>(null);
  const [duration, setDuration] = useState(3);
  const [details, setDetails] = useState('');
  const [tried, setTried] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { submit, submitting, ticket, reset } = useRequestSubmit('booth');

  const errors = {
    zone: tried && !zone ? 'یک فضا انتخاب کنید.' : '',
    start: tried && start === null ? 'تاریخ شروع را انتخاب کنید.' : '',
    details:
      tried && !minLength(details, 10) ? 'محصولات یا کلکسیون را حداقل در ۱۰ حرف توضیح دهید.' : '',
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!zone || start === null || !minLength(details, 10)) {
      if (!zone || start === null) {
        formRef.current
          ?.querySelector<HTMLElement>(
            `[data-group="${!zone ? 'zone' : 'date'}"] [role="radio"]:not([disabled])`,
          )
          ?.focus();
      } else focusFirstInvalid(formRef.current);
      return;
    }
    const z = BOOTH_ZONES.find((x) => x.id === zone)!;
    const ok = await submit(`رزرو ${z.title}`, [
      `از ${formatJalali(start)}`,
      `${toFa(duration)} روز`,
      details.trim(),
    ]);
    if (ok) {
      setZone(null);
      setStart(null);
      setDuration(3);
      setDetails('');
      setTried(false);
    }
  };

  return (
    <>
      <PageHeader back title="رزرو فضای فروش" subtitle="لابی و فضاهای ویژه برای کلکسیون جدید" />
      <div className="animate-view flex flex-col gap-4 px-4 pt-2">
        {ticket ? (
          <SuccessPanel
            ticket={ticket}
            message="درخواست رزرو برای واحد بازرگانی کاسپین ارسال شد."
            onNew={reset}
          />
        ) : (
          <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            <section aria-labelledby="zone-title">
              <SectionTitle id="zone-title">انتخاب فضا</SectionTitle>
              <div
                role="radiogroup"
                aria-labelledby="zone-title"
                data-group="zone"
                className="flex flex-col gap-2"
              >
                {BOOTH_ZONES.map((z) => (
                  <RadioCard
                    key={z.id}
                    checked={zone === z.id}
                    disabled={!z.free}
                    onSelect={() => setZone(z.id)}
                    aside={
                      <Badge tone={z.free ? 'success' : 'neutral'}>
                        {z.free ? 'آزاد' : 'رزرو شده'}
                      </Badge>
                    }
                  >
                    <span className="font-semibold text-ink">{z.title}</span>
                    <span className="text-[13px] text-ink-2">{z.area}</span>
                  </RadioCard>
                ))}
              </div>
              {errors.zone && (
                <p role="alert" className="mt-2 px-2 text-[13px] font-semibold text-danger">
                  {errors.zone}
                </p>
              )}
            </section>

            <section aria-labelledby="date-title">
              <SectionTitle id="date-title">تاریخ شروع</SectionTitle>
              <div
                role="radiogroup"
                aria-labelledby="date-title"
                data-group="date"
                className="grid grid-cols-4 gap-2 min-[400px]:grid-cols-7"
              >
                {days.map((d) => {
                  const t = d.getTime();
                  const checked = start === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      aria-label={formatJalali(d)}
                      onClick={() => setStart(t)}
                      className={cx(
                        'flex min-h-16 flex-col items-center justify-center rounded-[14px] border text-[13px] transition-colors cursor-pointer',
                        checked
                          ? 'border-primary bg-primary text-on-primary'
                          : 'border-line bg-card text-ink hover:bg-row',
                      )}
                    >
                      <span className={checked ? undefined : 'text-ink-2'}>{formatWeekday(d)}</span>
                      <span className="font-bold">{formatJalaliShort(d)}</span>
                    </button>
                  );
                })}
              </div>
              {errors.start && (
                <p role="alert" className="mt-2 px-2 text-[13px] font-semibold text-danger">
                  {errors.start}
                </p>
              )}
            </section>

            <section aria-labelledby="dur-title" className="flex flex-col gap-2">
              <p id="dur-title" className="px-2 text-[15px] font-semibold text-ink">
                مدت (روز)
              </p>
              <Card className="flex items-center justify-between gap-3 p-2">
                <IconButton
                  icon={Plus}
                  label="افزایش روز"
                  disabled={duration >= MAX_DAYS}
                  onClick={() => setDuration((d) => Math.min(MAX_DAYS, d + 1))}
                  className="bg-field disabled:opacity-40"
                />
                <output aria-live="polite" className="tabular text-xl font-bold text-ink">
                  {toFa(duration)} روز
                </output>
                <IconButton
                  icon={Minus}
                  label="کاهش روز"
                  disabled={duration <= 1}
                  onClick={() => setDuration((d) => Math.max(1, d - 1))}
                  className="bg-field disabled:opacity-40"
                />
              </Card>
              {start !== null && (
                <p className="px-2 text-[13px] text-ink-2">
                  از {formatJalali(start)} تا {formatJalali(start + (duration - 1) * 86_400_000)}
                </p>
              )}
            </section>

            <Field
              label="محصولات و کلکسیون"
              required
              error={errors.details}
              helper="مثلاً «سرویس خواب نوزاد – ۶ مدل»"
            >
              {({ id, describedBy, invalid }) => (
                <TextArea
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  aria-required
                  value={details}
                  maxLength={500}
                  onChange={(e) => setDetails(e.target.value)}
                />
              )}
            </Field>

            <Button type="submit" block icon={CalendarDays} loading={submitting}>
              ثبت درخواست رزرو
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
