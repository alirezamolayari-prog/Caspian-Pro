import { AlertTriangle, CalendarClock, Lock, ShieldOff, Truck, Unlock } from 'lucide-react';
import { useRef, useState } from 'react';
import { PageHeader } from '../../components/layout/Header';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, SectionTitle } from '../../components/ui/Card';
import { Segmented, Switch } from '../../components/ui/Choice';
import { Alert } from '../../components/ui/Feedback';
import { Field, TextInput } from '../../components/ui/Field';
import { cx } from '../../components/ui/cx';
import { GATES, SLOT_MINUTES, gateTitle, type GateId } from '../../data/catalog';
import { focusFirstInvalid, useRequestSubmit } from '../../hooks/useRequestSubmit';
import { toFa } from '../../lib/persian';
import { navigate } from '../../lib/router';
import { isIranMobile, normalizeMobile } from '../../lib/validators';
import { MAX_REJECTIONS, useLoading } from '../../store/loading';
import { useUi } from '../../store/ui';

export function LogisticsPage() {
  const { session, rejections, locked, setLocked, adminReactivate, start } = useLoading();
  const toast = useUi((s) => s.toast);
  const { submit, submitting } = useRequestSubmit('logistics');
  const [gate, setGate] = useState<GateId | null>(null);
  const [minutes, setMinutes] = useState<number>(30);
  const [mobile, setMobile] = useState('');
  const [touched, setTouched] = useState({ gate: false, mobile: false });
  const formRef = useRef<HTMLFormElement>(null);

  const occupancy = (id: GateId) => {
    const g = GATES.find((x) => x.id === id)!;
    return g.busy + (session?.gate === id ? 1 : 0);
  };
  const gateError = touched.gate && !gate ? 'یک درب بارگیری انتخاب کنید.' : '';
  const mobileError =
    touched.mobile && !isIranMobile(mobile)
      ? 'شماره موبایل راننده را به شکل ۰۹۱۲۳۴۵۶۷۸۹ وارد کنید.'
      : '';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ gate: true, mobile: true });
    if (!gate || !isIranMobile(mobile)) {
      if (!gate) formRef.current?.querySelector<HTMLElement>('[role="radio"]')?.focus();
      else focusFirstInvalid(formRef.current);
      return;
    }
    const driver = normalizeMobile(mobile);
    const t = await submit(`نوبت بارگیری – ${gateTitle(gate)}`, [
      `${toFa(minutes)} دقیقه`,
      `راننده ${toFa(driver)}`,
    ]);
    if (t) {
      start(gate, minutes, driver);
      toast({
        tone: 'info',
        title: 'تایمر بارگیری شروع شد',
        body: `${gateTitle(gate)} – ${toFa(minutes)} دقیقه`,
      });
      navigate('home');
    }
  };

  return (
    <>
      <PageHeader back title="بارگیری و تخلیه" subtitle="رزرو هوشمند نوبت و مدیریت تردد" />
      <div className="animate-view flex flex-col gap-4 px-4 pt-4">
        <Alert tone={locked ? 'danger' : 'warning'} icon={AlertTriangle} title="سیستم جریمه خودکار">
          اگر <strong>۲ درخواست تمدید</strong> توسط حراست رد شود، دسترسی بارگیری غرفه به‌طور خودکار
          قفل می‌شود و فقط مدیریت کاسپین می‌تواند آن را دوباره فعال کند.
          <span className="mt-2 flex items-center gap-2">
            <Badge tone={rejections > 0 ? 'danger' : 'neutral'}>
              اخطارها: {toFa(rejections)} از {toFa(MAX_REJECTIONS)}
            </Badge>
          </span>
        </Alert>

        <Card>
          <Switch
            checked={locked}
            onChange={setLocked}
            label="پیش‌نمایش حالت قفل (دمو)"
            description="برای دیدن صفحه‌ای که پس از ۲ رد تمدید نمایش داده می‌شود"
          />
        </Card>

        {locked ? (
          <Card className="flex flex-col items-center gap-3 border-danger/40 py-8 text-center">
            <span className="inline-flex size-16 items-center justify-center rounded-full bg-danger-soft text-danger">
              <Lock className="size-8" aria-hidden />
            </span>
            <h2 className="text-lg font-extrabold text-ink">دسترسی بارگیری قفل شد</h2>
            <p className="text-sm leading-7 text-ink-2">
              به دلیل رد شدن ۲ درخواست تمدید توسط حراست، ثبت نوبت جدید برای غرفه شما غیرفعال است.
              برای فعال‌سازی مجدد با مدیریت پاساژ تماس بگیرید.
            </p>
            <Badge tone="danger" icon={ShieldOff}>
              نیاز به فعال‌سازی مدیر
            </Badge>
            <Button variant="secondary" icon={Unlock} onClick={adminReactivate}>
              فعال‌سازی مجدد توسط مدیر (دمو)
            </Button>
          </Card>
        ) : session ? (
          <Card className="flex flex-col items-center gap-3 py-6 text-center">
            <Truck className="size-8 text-gold-ink" aria-hidden />
            <p className="font-extrabold text-ink">
              یک نوبت فعال در {gateTitle(session.gate)} دارید
            </p>
            <p className="text-sm text-ink-2">برای رزرو نوبت جدید ابتدا نوبت فعلی را تسویه کنید.</p>
            <Button onClick={() => navigate('home')}>مشاهده تایمر</Button>
          </Card>
        ) : (
          <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            <section aria-labelledby="gate-title">
              <SectionTitle>
                <span id="gate-title">انتخاب درب</span>
              </SectionTitle>
              <div
                role="radiogroup"
                aria-labelledby="gate-title"
                aria-describedby={gateError ? 'gate-err' : undefined}
                className="flex flex-col gap-2"
              >
                {GATES.map((g) => {
                  const used = occupancy(g.id);
                  const full = used >= g.capacity;
                  const checked = gate === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      disabled={full}
                      onClick={() => {
                        setGate(g.id);
                        setTouched((t) => ({ ...t, gate: true }));
                      }}
                      className={cx(
                        'theme-fade flex min-h-16 items-center gap-3 rounded-2xl border bg-surface p-4 text-start shadow-card transition-transform duration-150 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60',
                        checked ? 'border-gold ring-2 ring-gold/40' : 'border-line',
                      )}
                    >
                      <span
                        aria-hidden
                        className={cx(
                          'inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                          checked ? 'border-gold' : 'border-line',
                        )}
                      >
                        {checked && <span className="size-2.5 rounded-full bg-gold" />}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span className="font-bold text-ink">{g.title}</span>
                        <span className="flex gap-1" aria-hidden>
                          {Array.from({ length: g.capacity }).map((_, i) => (
                            <span
                              key={i}
                              className={cx(
                                'h-1.5 w-8 rounded-full',
                                i < used ? 'bg-gold' : 'bg-surface-2 ring-1 ring-line',
                              )}
                            />
                          ))}
                        </span>
                      </span>
                      <span className="flex flex-col items-end gap-1">
                        <Badge tone={full ? 'danger' : 'success'}>{full ? 'تکمیل' : 'آزاد'}</Badge>
                        <span className="tabular text-xs text-ink-2">
                          ظرفیت: {toFa(used)} از {toFa(g.capacity)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {gateError && (
                <p id="gate-err" role="alert" className="mt-2 px-1 text-xs font-bold text-danger">
                  {gateError}
                </p>
              )}
            </section>

            <section aria-labelledby="slot-title" className="flex flex-col gap-2">
              <p id="slot-title" className="px-1 text-sm font-bold text-ink">
                مدت نوبت
              </p>
              <Segmented<number>
                label="مدت نوبت بارگیری"
                value={minutes}
                onChange={setMinutes}
                options={SLOT_MINUTES.map((m) => ({ value: m, label: `${toFa(m)} دقیقه` }))}
              />
            </section>

            <Field
              label="شماره موبایل راننده"
              required
              helper="باید در بانک رانندگان تاییدشده کاسپین ثبت شده باشد."
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

            <Button type="submit" size="lg" block icon={CalendarClock} loading={submitting}>
              ثبت نوبت و شروع بارگیری
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
