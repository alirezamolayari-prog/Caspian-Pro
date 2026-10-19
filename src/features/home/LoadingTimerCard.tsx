import { CalendarClock, Clock, Hourglass, Lock, LogOut, Phone, Timer, Truck } from 'lucide-react';
import { useState } from 'react';
import { requestExtension } from '../../api/mock';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/Feedback';
import { Modal } from '../../components/ui/Modal';
import { cx } from '../../components/ui/cx';
import { gateTitle } from '../../data/catalog';
import { useNow } from '../../hooks/useNow';
import { formatClock, formatTime, toFa } from '../../lib/persian';
import { navigate } from '../../lib/router';
import { MAX_REJECTIONS, WARN_SECONDS, sessionProgress, useLoading } from '../../store/loading';
import { useUi } from '../../store/ui';

export function LoadingTimerCard() {
  const now = useNow(1000);
  const { session, pendingExtension, rejections, locked, checkout } = useLoading();
  const toast = useUi((s) => s.toast);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!session) {
    return (
      <section
        aria-labelledby="timer-title"
        className="theme-fade relative rounded-3xl border border-gold/25 bg-header-2 p-5 text-on-header shadow-card"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/10 text-gold">
            {locked ? (
              <Lock className="size-6" aria-hidden />
            ) : (
              <Truck className="size-6" aria-hidden />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="timer-title" className="font-extrabold">
              {locked ? 'دسترسی بارگیری قفل است' : 'نوبت بارگیری فعالی ندارید'}
            </h2>
            <p className="text-xs text-on-header-2">
              {locked
                ? 'برای فعال‌سازی مجدد با مدیریت تماس بگیرید.'
                : 'برای بارگیری یا تخلیه نوبت بگیرید.'}
            </p>
          </div>
        </div>
        <Button className="mt-4" block icon={CalendarClock} onClick={() => navigate('logistics')}>
          {locked ? 'مشاهده وضعیت' : 'رزرو نوبت بارگیری'}
        </Button>
      </section>
    );
  }

  const { remainingSec, ratio, expired } = sessionProgress(session, now);
  const warning = !expired && remainingSec <= WARN_SECONDS;
  const minutesLeft = Math.ceil(remainingSec / 60);

  const onExtend = async () => {
    const approved = await requestExtension();
    const s = useLoading.getState();
    if (approved)
      toast({
        tone: 'success',
        title: 'تمدید تایید شد',
        body: '۱۵ دقیقه به زمان بارگیری اضافه شد.',
      });
    else
      toast({
        tone: 'error',
        title: s.locked ? 'دسترسی بارگیری قفل شد' : 'درخواست تمدید رد شد',
        body: s.locked
          ? 'فعال‌سازی مجدد فقط توسط مدیریت.'
          : `اخطار ${toFa(s.rejections)} از ${toFa(MAX_REJECTIONS)}`,
      });
  };

  return (
    <section
      aria-labelledby="timer-title"
      className={cx(
        'theme-fade relative overflow-hidden rounded-3xl border bg-header-2 p-5 text-on-header shadow-card',
        expired ? 'border-[#EF4444]/50' : warning ? 'border-[#F59E0B]/60' : 'border-gold/30',
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -end-10 -top-10 size-40 rounded-full bg-gold/15 blur-2xl"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-bold text-gold">
            <span className="relative flex size-2.5" aria-hidden>
              {!expired && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold opacity-70" />
              )}
              <span className="relative inline-flex size-2.5 rounded-full bg-gold" />
            </span>
            تایمر بارگیری فعال
          </p>
          <h2 id="timer-title" className="mt-1 text-lg font-extrabold">
            {gateTitle(session.gate)}
          </h2>
        </div>
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-on-header ring-1 ring-white/15">
          {expired ? (
            <Hourglass className="size-3.5" aria-hidden />
          ) : (
            <Timer className="size-3.5" aria-hidden />
          )}
          {expired ? 'زمان تمام شد' : warning ? 'رو به اتمام' : 'در حال بارگیری'}
        </span>
      </div>

      <div className="relative mt-4 flex items-end justify-between gap-2">
        <div
          role="timer"
          aria-label={
            expired ? 'زمان بارگیری تمام شده است' : `${toFa(minutesLeft)} دقیقه تا پایان بارگیری`
          }
          className={cx(
            'tabular text-5xl font-black leading-none tracking-tight',
            expired ? 'text-[#FCA5A5]' : warning ? 'text-[#FCD34D]' : 'text-on-header',
          )}
          dir="ltr"
        >
          {formatClock(remainingSec)}
        </div>
        <p className="pb-1 text-xs text-on-header-2">زمان باقی‌مانده</p>
      </div>

      <div className="relative mt-4">
        <ProgressBar
          value={ratio}
          label="پیشرفت زمان بارگیری"
          tone={expired ? 'danger' : warning ? 'warning' : 'gold'}
        />
      </div>

      <dl className="relative mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="flex flex-col gap-0.5">
          <dt className="flex items-center gap-1 text-on-header-2">
            <Clock className="size-3.5" aria-hidden /> شروع
          </dt>
          <dd className="tabular font-bold">{formatTime(session.startedAt)}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="flex items-center gap-1 text-on-header-2">
            <Hourglass className="size-3.5" aria-hidden /> پایان
          </dt>
          <dd className="tabular font-bold">{formatTime(session.endsAt)}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="flex items-center gap-1 text-on-header-2">
            <Phone className="size-3.5" aria-hidden /> راننده
          </dt>
          <dd className="tabular font-bold" dir="ltr">
            {toFa(session.driverMobile.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3'))}
          </dd>
        </div>
      </dl>

      {(pendingExtension || rejections > 0) && (
        <p
          role="status"
          className="relative mt-3 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold"
        >
          {pendingExtension
            ? 'درخواست تمدید برای حراست ارسال شد – در انتظار تایید…'
            : `اخطار ${toFa(rejections)} از ${toFa(MAX_REJECTIONS)}: درخواست تمدید رد شده است.`}
        </p>
      )}

      <div className="relative mt-4 grid grid-cols-2 gap-2">
        <Button
          variant="ghost"
          className="bg-white/10 text-on-header ring-1 ring-white/15 hover:bg-white/15"
          icon={Timer}
          loading={pendingExtension}
          disabled={locked || expired}
          onClick={onExtend}
        >
          {pendingExtension ? 'در انتظار حراست' : 'درخواست تمدید'}
        </Button>
        <Button icon={LogOut} onClick={() => setConfirmOpen(true)}>
          تسویه و خروج
        </Button>
      </div>
      {locked && (
        <p className="relative mt-2 text-center text-xs text-on-header-2">
          تمدید غیرفعال است – دسترسی بارگیری قفل شده.
        </p>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="تسویه و خروج از بارانداز"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              انصراف
            </Button>
            <Button
              icon={LogOut}
              onClick={() => {
                checkout();
                setConfirmOpen(false);
                toast({
                  tone: 'success',
                  title: 'خروج ثبت شد',
                  body: 'بارانداز آزاد شد. از همکاری شما سپاسگزاریم.',
                });
              }}
            >
              تایید خروج
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-7 text-ink-2">
          با تایید، نوبت بارگیری شما در {gateTitle(session.gate)} بسته می‌شود و خودروی شما باید
          بارانداز را ترک کند.
        </p>
      </Modal>
    </section>
  );
}
