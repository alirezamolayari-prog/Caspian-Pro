import { CalendarClock } from 'lucide-react';
import { useRef, useState } from 'react';
import { PageHeader } from '../../components/layout/Header';
import { SuccessPanel } from '../../components/layout/Success';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SectionTitle } from '../../components/ui/Card';
import { RadioCard, Segmented } from '../../components/ui/Choice';
import { Field, TextInput } from '../../components/ui/Field';
import { GATES, SLOT_MINUTES, gateTitle, type GateId } from '../../data/catalog';
import { focusFirstInvalid, useRequestSubmit } from '../../hooks/useRequestSubmit';
import { toFa } from '../../lib/persian';
import { isIranMobile, normalizeMobile } from '../../lib/validators';

type Day = 'today' | 'tomorrow';

export function LogisticsPage() {
  const { submit, submitting, ticket, reset } = useRequestSubmit('logistics');
  const [gate, setGate] = useState<GateId | null>(null);
  const [day, setDay] = useState<Day>('today');
  const [minutes, setMinutes] = useState<number>(30);
  const [mobile, setMobile] = useState('');
  const [touched, setTouched] = useState({ gate: false, mobile: false });
  const formRef = useRef<HTMLFormElement>(null);

  const gateError = touched.gate && !gate ? 'یک درب بارگیری انتخاب کنید.' : '';
  const mobileError =
    touched.mobile && !isIranMobile(mobile)
      ? 'شماره موبایل راننده را به شکل ۰۹۱۲۳۴۵۶۷۸۹ وارد کنید.'
      : '';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ gate: true, mobile: true });
    if (!gate || !isIranMobile(mobile)) {
      if (!gate)
        formRef.current?.querySelector<HTMLElement>('[role="radio"]:not([disabled])')?.focus();
      else focusFirstInvalid(formRef.current);
      return;
    }
    const ok = await submit(`نوبت بارگیری – ${gateTitle(gate)}`, [
      day === 'today' ? 'امروز' : 'فردا',
      `${toFa(minutes)} دقیقه`,
      `راننده ${toFa(normalizeMobile(mobile))}`,
    ]);
    if (ok) {
      setGate(null);
      setMobile('');
      setTouched({ gate: false, mobile: false });
    }
  };

  return (
    <>
      <PageHeader back title="بارگیری و تخلیه" subtitle="رزرو نوبت درب‌های بارگیری" />
      <div className="animate-view flex flex-col gap-4 px-4 pt-2">
        {ticket ? (
          <SuccessPanel
            ticket={ticket}
            message="نوبت شما برای حراست ارسال شد. نتیجه را از اعلان‌ها ببینید."
            onNew={reset}
          />
        ) : (
          <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            <section aria-labelledby="gate-title">
              <SectionTitle id="gate-title">انتخاب درب</SectionTitle>
              <div role="radiogroup" aria-labelledby="gate-title" className="flex flex-col gap-2">
                {GATES.map((g) => {
                  const full = g.busy >= g.capacity;
                  return (
                    <RadioCard
                      key={g.id}
                      checked={gate === g.id}
                      disabled={full}
                      onSelect={() => {
                        setGate(g.id);
                        setTouched((t) => ({ ...t, gate: true }));
                      }}
                      aside={
                        <Badge tone={full ? 'danger' : 'success'}>{full ? 'تکمیل' : 'آزاد'}</Badge>
                      }
                    >
                      <span className="font-semibold text-ink">{g.title}</span>
                      <span className="tabular text-[13px] text-ink-2">
                        ظرفیت: {toFa(g.busy)} از {toFa(g.capacity)} در حال استفاده
                      </span>
                    </RadioCard>
                  );
                })}
              </div>
              {gateError && (
                <p role="alert" className="mt-2 px-2 text-[13px] font-semibold text-danger">
                  {gateError}
                </p>
              )}
            </section>

            <div className="flex flex-col gap-2">
              <p className="px-2 text-[15px] font-semibold text-ink">روز</p>
              <Segmented<Day>
                label="روز نوبت"
                value={day}
                onChange={setDay}
                options={[
                  { value: 'today', label: 'امروز' },
                  { value: 'tomorrow', label: 'فردا' },
                ]}
              />
            </div>

            <div className="flex flex-col gap-2">
              <p className="px-2 text-[15px] font-semibold text-ink">مدت نوبت</p>
              <Segmented<number>
                label="مدت نوبت بارگیری"
                value={minutes}
                onChange={setMinutes}
                columns={2}
                options={SLOT_MINUTES.map((m) => ({ value: m, label: `${toFa(m)} دقیقه` }))}
              />
            </div>

            <Field
              label="شماره موبایل راننده"
              required
              helper="باید در بانک رانندگان کاسپین ثبت شده باشد."
              error={mobileError}
            >
              {({ id, describedBy, invalid }) => (
                <TextInput
                  id={id}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  dir="ltr"
                  className="text-start tabular"
                  placeholder="09xx xxx xxxx"
                  aria-describedby={describedBy}
                  invalid={invalid}
                  aria-required
                  value={mobile}
                  maxLength={16}
                  onChange={(e) => setMobile(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, mobile: true }))}
                />
              )}
            </Field>

            <Button type="submit" block icon={CalendarClock} loading={submitting}>
              ثبت نوبت
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
