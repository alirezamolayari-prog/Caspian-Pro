import { CalendarDays, Minus, Plus, Sparkles } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { PageHeader } from '../../components/layout/Header';
import { SuccessPanel } from '../../components/layout/Success';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, SectionTitle } from '../../components/ui/Card';
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
      if (!zone || start === null)
        formRef.current
          ?.querySelector<HTMLElement>(
            !zone ? '[data-group="zone"] [role="radio"]' : '[data-group="date"] [role="radio"]',
          )
          ?.focus();
      else focusFirstInvalid(formRef.current);
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
      <PageHeader back title="رزرو فضای فروش" subtitle="لابی‌ها و فضاهای ویژه برای کلکسیون جدید" />
      <div className="animate-view flex flex-col gap-4 px-4 pt-4">
        {ticket ? (
          <SuccessPanel
            ticket={ticket}
            message="درخواست رزرو برای واحد بازرگانی کاسپین ارسال شد."
            onNew={reset}
          />
        ) : (
          <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            <Card className="flex items-start gap-3 bg-gold-soft">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-gold-ink" aria-hidden />
              <p className="text-sm leading-7 text-ink">
                فضاهای مرکزی برای نمایش کلکسیون جدید یا فروش ویژه رزرو می‌شوند. هزینه پس از تایید
                اعلام می‌شود.
              </p>
            </Card>

            <section aria-labelledby="zone-title">
              <SectionTitle>
                <span id="zone-title">انتخاب فضا</span>
              </SectionTitle>
              <div
                role="radiogroup"
                aria-labelledby="zone-title"
                data-group="zone"
                className="grid grid-cols-2 gap-2"
              >
                {BOOTH_ZONES.map((z) => {
                  const checked = zone === z.id;
                  return (
                    <button
                      key={z.id}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      disabled={!z.free}
                      onClick={() => setZone(z.id)}
                      className={cx(
                        'theme-fade flex min-h-24 flex-col items-start justify-between gap-2 rounded-2xl border bg-surface p-3 text-start shadow-card transition-transform duration-150 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-55',
                        checked ? 'border-gold ring-2 ring-gold/40' : 'border-line',
                      )}
                    >
                      <span className="text-sm font-bold text-ink">{z.title}</span>
                      <span className="flex w-full items-center justify-between gap-1">
                        <span className="text-xs text-ink-2">{z.area}</span>
                        <Badge tone={z.free ? 'success' : 'neutral'}>
                          {z.free ? 'آزاد' : 'رزرو شده'}
                        </Badge>
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.zone && (
                <p role="alert" className="mt-2 px-1 text-xs font-bold text-danger">
                  {errors.zone}
                </p>
              )}
            </section>

            <section aria-labelledby="date-title">
              <SectionTitle>
                <span id="date-title" className="flex items-center gap-2">
                  <CalendarDays className="size-5 text-gold-ink" aria-hidden />
                  تاریخ شروع
                </span>
              </SectionTitle>
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
                        'flex min-h-16 flex-col items-center justify-center rounded-2xl border text-xs transition-transform duration-150 active:scale-95 cursor-pointer',
                        checked
                          ? 'border-gold bg-gold text-on-gold'
                          : 'border-line bg-surface text-ink',
                      )}
                    >
                      <span className={checked ? 'font-bold' : 'text-ink-2'}>
                        {formatWeekday(d)}
                      </span>
                      <span className="font-extrabold">{formatJalaliShort(d)}</span>
                    </button>
                  );
                })}
              </div>
              {errors.start && (
                <p role="alert" className="mt-2 px-1 text-xs font-bold text-danger">
                  {errors.start}
                </p>
              )}
            </section>

            <section aria-labelledby="dur-title" className="flex flex-col gap-2">
              <p id="dur-title" className="px-1 text-sm font-bold text-ink">
                مدت (روز)
              </p>
              <Card className="flex items-center justify-between gap-3 p-2">
                <Button
                  variant="secondary"
                  aria-label="افزایش روز"
                  icon={Plus}
                  disabled={duration >= MAX_DAYS}
                  onClick={() => setDuration((d) => Math.min(MAX_DAYS, d + 1))}
                  className="w-12 px-0"
                >
                  <span className="sr-only">افزایش</span>
                </Button>
                <output aria-live="polite" className="tabular text-xl font-extrabold text-ink">
                  {toFa(duration)} روز
                </output>
                <Button
                  variant="secondary"
                  aria-label="کاهش روز"
                  icon={Minus}
                  disabled={duration <= 1}
                  onClick={() => setDuration((d) => Math.max(1, d - 1))}
                  className="w-12 px-0"
                >
                  <span className="sr-only">کاهش</span>
                </Button>
              </Card>
              {start !== null && (
                <p className="px-1 text-xs text-ink-2">
                  از {formatJalali(start)} تا {formatJalali(start + (duration - 1) * 86_400_000)}
                </p>
              )}
            </section>

            <Field
              label="محصولات و کلکسیون ویژه"
              required
              error={errors.details}
              helper="مثلاً «کلکسیون سرویس خواب نوزاد پاییز ۱۴۰۵ – ۶ مدل»"
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
                  placeholder="نام کلکسیون، تعداد و ابعاد اقلام نمایشی…"
                />
              )}
            </Field>

            <Button type="submit" size="lg" block icon={CalendarDays} loading={submitting}>
              ثبت درخواست رزرو
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
