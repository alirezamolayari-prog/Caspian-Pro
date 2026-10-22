import { BadgeCheck, IdCard, ShieldAlert, Siren } from 'lucide-react';
import { useRef, useState } from 'react';
import { dispatchSecurity } from '../../api';
import { PageHeader } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card, SectionTitle } from '../../components/ui/Card';
import { Segmented } from '../../components/ui/Choice';
import { Field, Select, TextInput } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { STAFF_ROLES, SUPPORT_CONTACTS } from '../../data/catalog';
import { focusFirstInvalid } from '../../hooks/useRequestSubmit';
import { displayId } from '../../lib/ids';
import { toFa } from '../../lib/persian';
import { isPersonName, isTimeRange, parseTime } from '../../lib/validators';
import { localDateKey, useSecurity } from '../../store/security';
import { useStoreInfo } from '../../store/session';
import { useUi } from '../../store/ui';
import { PassCard } from './PassCard';

const EMERGENCIES = ['سرقت یا درگیری', 'حادثه و آسیب', 'دود یا آتش', 'سایر'] as const;
type Emergency = (typeof EMERGENCIES)[number];
type Day = 'today' | 'tomorrow';

function SosSection() {
  const toast = useUi((s) => s.toast);
  const store = useStoreInfo();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [kind, setKind] = useState<Emergency>('سرقت یا درگیری');
  const [sending, setSending] = useState(false);
  const [dispatched, setDispatched] = useState<{ eta: number; id: string } | null>(null);

  const confirm = async () => {
    setSending(true);
    let result: Awaited<ReturnType<typeof dispatchSecurity>>;
    try {
      result = await dispatchSecurity();
    } catch {
      setSending(false);
      setStep(0);
      toast({
        tone: 'error',
        title: 'پیام اضطراری ارسال نشد',
        body: `فوراً با حراست تماس بگیرید: ${toFa(SUPPORT_CONTACTS[1].phone)}`,
      });
      return;
    }
    const { etaMinutes, ticket } = result;
    setSending(false);
    setStep(0);
    setDispatched({ eta: etaMinutes, id: ticket.id });
    toast({
      tone: 'success',
      title: 'حراست اعزام شد',
      body: `زمان تقریبی رسیدن ${toFa(etaMinutes)} دقیقه`,
    });
  };

  return (
    <Card className="flex flex-col items-center gap-4 py-6 text-center">
      {dispatched ? (
        <div role="status" className="flex flex-col items-center gap-3">
          <span className="inline-flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
            <BadgeCheck className="size-9" strokeWidth={1.75} aria-hidden />
          </span>
          <p className="text-lg font-bold text-ink">تیم حراست در مسیر غرفه شماست</p>
          <p className="text-[15px] text-ink-2">
            زمان تقریبی رسیدن: {toFa(dispatched.eta)} دقیقه – کد {displayId(dispatched.id)}
          </p>
          <p className="text-[13px] text-ink-2">
            تلفن حراست:{' '}
            <a
              href={`tel:${SUPPORT_CONTACTS[1].phone}`}
              className="font-semibold text-ink tabular"
              dir="ltr"
            >
              {toFa(SUPPORT_CONTACTS[1].phone)}
            </a>
          </p>
          <Button variant="outlined" onClick={() => setDispatched(null)}>
            مشکل برطرف شد
          </Button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="animate-sos inline-flex size-32 flex-col items-center justify-center gap-1 rounded-full bg-sos text-on-sos transition-transform duration-150 active:scale-95 cursor-pointer"
          >
            <Siren className="size-10" strokeWidth={1.75} aria-hidden />
            <span className="text-base font-bold">اضطراری</span>
            <span className="sr-only">فراخوان اضطراری حراست به غرفه</span>
          </button>
          <div>
            <p className="font-semibold text-ink">فراخوان اضطراری حراست به غرفه</p>
            <p className="text-[13px] text-ink-2">
              پس از دو مرحله تایید، نیروی حراست اعزام می‌شود.
            </p>
          </div>
        </>
      )}

      <Modal
        open={step === 1}
        onClose={() => setStep(0)}
        title="مرحله ۱ از ۲ – نوع وضعیت"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outlined" onClick={() => setStep(0)}>
              انصراف
            </Button>
            <Button variant="danger" onClick={() => setStep(2)}>
              ادامه
            </Button>
          </div>
        }
      >
        <p className="mb-3 text-[15px] text-ink-2">
          نوع وضعیت را انتخاب کنید تا نیروی مناسب اعزام شود.
        </p>
        <Segmented<Emergency>
          label="نوع وضعیت اضطراری"
          columns={2}
          value={kind}
          onChange={setKind}
          options={EMERGENCIES.map((e) => ({ value: e, label: e }))}
        />
      </Modal>

      <Modal
        open={step === 2}
        onClose={() => setStep(0)}
        title="مرحله ۲ از ۲ – تایید نهایی"
        dismissible={!sending}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outlined" disabled={sending} onClick={() => setStep(1)}>
              بازگشت
            </Button>
            <Button variant="danger" icon={ShieldAlert} loading={sending} onClick={confirm}>
              اعزام فوری حراست
            </Button>
          </div>
        }
      >
        <p className="text-[15px] leading-7 text-ink">
          با تایید، نیروی حراست برای «{kind}» فوراً به{' '}
          <strong>
            پلاک {toFa(store.unit)} – {store.floor}
          </strong>{' '}
          اعزام می‌شود.
        </p>
      </Modal>
    </Card>
  );
}

/** Pass starts at the current hour and lasts up to 8 hours, ending by 23:59. */
function defaultWindow(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = now.getHours();
  return { from: `${pad(h)}:00`, to: h + 8 > 23 ? '23:59' : `${pad(h + 8)}:00` };
}

function PassGenerator() {
  const { passes, addPass, removePass } = useSecurity();
  const toast = useUi((s) => s.toast);
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>(STAFF_ROLES[0]);
  const [day, setDay] = useState<Day>('today');
  const [from, setFrom] = useState(() => defaultWindow().from);
  const [to, setTo] = useState(() => defaultWindow().to);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const v = {
    name: !isPersonName(name) ? 'نام و نام خانوادگی را با حروف وارد کنید (حداقل ۳ حرف).' : '',
    from: parseTime(from) === null ? 'ساعت ورود را وارد کنید.' : '',
    to:
      parseTime(to) === null
        ? 'ساعت خروج را وارد کنید.'
        : !isTimeRange(from, to)
          ? 'ساعت خروج باید بعد از ساعت ورود باشد.'
          : '',
  };
  const err = (k: keyof typeof v) => (touched[k] ? v[k] : '');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, from: true, to: true });
    if (Object.values(v).some(Boolean)) {
      focusFirstInvalid(formRef.current);
      return;
    }
    const date = new Date();
    if (day === 'tomorrow') date.setDate(date.getDate() + 1);
    addPass({ name: name.trim(), role, date: localDateKey(date), from, to });
    toast({
      tone: 'success',
      title: 'کارت تردد صادر شد',
      body: `${name.trim()} – ${toFa(from)} تا ${toFa(to)}`,
    });
    setName('');
    setTouched({});
  };

  return (
    <section aria-labelledby="pass-title" className="flex flex-col gap-3">
      <SectionTitle id="pass-title">کارت تردد موقت پرسنل</SectionTitle>
      <Card>
        <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <Field label="نام و نام خانوادگی" required error={err('name')}>
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                autoComplete="name"
                aria-describedby={describedBy}
                invalid={invalid}
                aria-required
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              />
            )}
          </Field>
          <Field label="سمت">
            {({ id }) => (
              <Select id={id} value={role} onChange={(e) => setRole(e.target.value)}>
                {STAFF_ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </Select>
            )}
          </Field>
          <Segmented<Day>
            label="روز اعتبار"
            value={day}
            onChange={setDay}
            options={[
              { value: 'today', label: 'امروز' },
              { value: 'tomorrow', label: 'فردا' },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="ساعت ورود" required error={err('from')}>
              {({ id, describedBy, invalid }) => (
                <TextInput
                  id={id}
                  type="time"
                  dir="ltr"
                  className="tabular"
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, from: true }))}
                />
              )}
            </Field>
            <Field label="ساعت خروج" required error={err('to')}>
              {({ id, describedBy, invalid }) => (
                <TextInput
                  id={id}
                  type="time"
                  dir="ltr"
                  className="tabular"
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, to: true }))}
                />
              )}
            </Field>
          </div>
          <Button type="submit" block icon={IdCard}>
            صدور کارت
          </Button>
        </form>
      </Card>
      {passes.length > 0 && (
        <ul className="flex flex-col gap-3" aria-label="کارت‌های صادرشده">
          {passes.map((p) => (
            <li key={p.id}>
              <PassCard pass={p} onRemove={() => removePass(p.id)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function SecurityPage() {
  return (
    <>
      <PageHeader back title="حراست و انتظامات" subtitle="فراخوان اضطراری و کارت تردد" />
      <div className="animate-view flex flex-col gap-6 px-4 pt-2">
        <SosSection />
        <PassGenerator />
      </div>
    </>
  );
}
