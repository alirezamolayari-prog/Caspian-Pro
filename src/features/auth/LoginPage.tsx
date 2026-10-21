import { KeyRound, Smartphone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ApiError, requestOtp, verifyOtp } from '../../api/http';
import { useOutbox } from '../../api/outbox';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Feedback';
import { Field, TextInput } from '../../components/ui/Field';
import { toEn, toFa } from '../../lib/persian';
import { rawStorage } from '../../lib/storage';
import { isIranMobile, normalizeMobile } from '../../lib/validators';
import { useNotifications } from '../../store/notifications';
import { useSession } from '../../store/session';
import { useTickets } from '../../store/tickets';

const LAST_STORE_KEY = 'caspian-last-store';
export const CODE_LENGTH = 5;

const errorText = (e: unknown) =>
  e instanceof ApiError ? e.message : 'اتصال به سرور برقرار نشد. اینترنت را بررسی کنید.';

/** Phone → one-time code. Shown in server mode until the tenant is logged in. */
export function LoginPage() {
  const setSession = useSession((s) => s.setSession);
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [wait, setWait] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  const phoneError =
    touched && !isIranMobile(phone) ? 'شماره موبایل را درست وارد کنید؛ مثل ۰۹۱۲۱۲۳۴۵۶۷' : '';

  const sendCode = async () => {
    setTouched(true);
    if (!isIranMobile(phone)) return;
    setBusy(true);
    setError('');
    try {
      const r = await requestOtp(normalizeMobile(phone));
      setWait(r.resendIn);
      setCode('');
      setStep('code');
    } catch (e) {
      if (e instanceof ApiError && e.code === 'too_soon') {
        setWait(Number(e.data.retryIn) || 60);
        setStep('code');
      } else setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code) => {
    const digits = toEn(value).replace(/\D/g, '');
    if (digits.length !== CODE_LENGTH) {
      setError(`کد ${toFa(CODE_LENGTH)} رقمی پیامک‌شده را وارد کنید.`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const r = await verifyOtp(normalizeMobile(phone), digits);
      // Another store logged in on this device: start clean.
      if (r.store.id && rawStorage.getItem(LAST_STORE_KEY) !== r.store.id) {
        useOutbox.setState({ items: [] });
        useTickets.setState({ items: [] });
        useNotifications.setState({ items: [] });
      }
      if (r.store.id) rawStorage.setItem(LAST_STORE_KEY, r.store.id);
      setSession({ token: r.token, phone: r.phone, store: r.store });
    } catch (e) {
      setError(errorText(e));
      setBusy(false);
    }
  };

  return (
    <div className="safe-top flex min-h-dvh flex-col justify-center gap-6 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <img src="/favicon.svg" alt="" className="size-16" />
        <h1 className="text-[26px] font-bold text-ink">کاسپین پرو</h1>
        <p className="text-[15px] text-ink-2">سامانه خدمات غرفه‌داران پاساژ کاسپین</p>
      </div>

      <Card className="flex flex-col gap-5 p-5">
        {step === 'phone' ? (
          <form
            className="flex flex-col gap-5"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void sendCode();
            }}
          >
            <Field
              label="شماره موبایل"
              helper="شماره‌ای که در دفتر مدیریت پاساژ ثبت کرده‌اید."
              error={phoneError}
            >
              {({ id, describedBy, invalid }) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  dir="ltr"
                  className="text-end tabular"
                  placeholder="۰۹۱۲ ۱۲۳ ۴۵۶۷"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => phone && setTouched(true)}
                />
              )}
            </Field>
            <Button type="submit" block icon={Smartphone} loading={busy}>
              دریافت کد ورود
            </Button>
          </form>
        ) : (
          <form
            className="flex flex-col gap-5"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void verify();
            }}
          >
            <p className="text-[15px] text-ink">
              کد {toFa(CODE_LENGTH)} رقمی به شماره{' '}
              <span dir="ltr" className="font-bold tabular">
                {toFa(normalizeMobile(phone))}
              </span>{' '}
              پیامک شد.
            </p>
            <Field label="کد ورود">
              {({ id }) => (
                <TextInput
                  ref={codeRef}
                  id={id}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  dir="ltr"
                  maxLength={CODE_LENGTH}
                  className="text-center text-2xl tracking-[0.5em] tabular"
                  value={toFa(code)}
                  onChange={(e) => {
                    const v = toEn(e.target.value).replace(/\D/g, '').slice(0, CODE_LENGTH);
                    setCode(v);
                    if (v.length === CODE_LENGTH) void verify(v);
                  }}
                />
              )}
            </Field>
            <Button type="submit" block icon={KeyRound} loading={busy}>
              ورود
            </Button>
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="text"
                onClick={() => {
                  setStep('phone');
                  setError('');
                }}
              >
                تغییر شماره
              </Button>
              <Button variant="text" disabled={wait > 0 || busy} onClick={() => void sendCode()}>
                {wait > 0 ? `ارسال دوباره تا ${toFa(wait)} ثانیه` : 'ارسال دوباره کد'}
              </Button>
            </div>
          </form>
        )}
        {error && <Alert tone="danger" icon={KeyRound} title={error} />}
      </Card>

      <p className="px-4 text-center text-[13px] leading-6 text-ink-2">
        شماره شما ثبت نشده است؟ با دفتر مدیریت پاساژ کاسپین تماس بگیرید.
      </p>
    </div>
  );
}
