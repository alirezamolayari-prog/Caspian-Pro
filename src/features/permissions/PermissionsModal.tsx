import {
  Apple,
  BellRing,
  Check,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Settings,
  Share,
  Smartphone,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Segmented } from '../../components/ui/Choice';
import { Modal } from '../../components/ui/Modal';
import { cx } from '../../components/ui/cx';
import { toFa } from '../../lib/persian';
import { useUi } from '../../store/ui';

type Platform = 'ios' | 'android';
type PermState = 'granted' | 'denied' | 'prompt' | 'unsupported';

const STATE_LABEL: Record<PermState, string> = {
  granted: 'فعال',
  denied: 'مسدود',
  prompt: 'پرسیده نشده',
  unsupported: 'پشتیبانی نمی‌شود',
};

function detectPlatform(): Platform {
  return typeof navigator !== 'undefined' && /iphone|ipad|ipod|macintosh/i.test(navigator.userAgent)
    ? 'ios'
    : 'android';
}

async function queryPermission(name: 'geolocation' | 'notifications'): Promise<PermState> {
  try {
    if (name === 'notifications' && typeof Notification !== 'undefined') {
      return Notification.permission === 'default' ? 'prompt' : Notification.permission;
    }
    if (!navigator.permissions?.query) return 'unsupported';
    const res = await navigator.permissions.query({ name: name as PermissionName });
    return res.state;
  } catch {
    return 'unsupported';
  }
}

const STEPS: Record<Platform, string[]> = {
  ios: [
    'برنامه «تنظیمات» (Settings) آیفون را باز کنید.',
    'به پایین بروید و «کاسپین پرو» را انتخاب کنید (یا Safari ← مکان، اگر از مرورگر استفاده می‌کنید).',
    'گزینه «مکان» (Location) را بزنید.',
    'ابتدا «هنگام استفاده از برنامه» را انتخاب کنید.',
    'دوباره به همین صفحه برگردید و «همیشه» (Always) را انتخاب کنید و «مکان دقیق» را روشن بگذارید.',
    'در بخش «اعلان‌ها»، «اجازه اعلان‌ها» را روشن کنید.',
  ],
  android: [
    'روی آیکن «کاسپین پرو» در صفحه اصلی انگشت خود را نگه دارید و «اطلاعات برنامه» را بزنید.',
    'وارد «مجوزها» (Permissions) شوید.',
    'گزینه «مکان» را بزنید و «همیشه مجاز» را انتخاب کنید.',
    '«استفاده از مکان دقیق» را روشن کنید.',
    'به «اعلان‌ها» برگردید و «همه اعلان‌های کاسپین پرو» را روشن کنید.',
  ],
};

export function PermissionsModal() {
  const open = useUi((s) => s.permissionsOpen);
  // Mounted only while open, so every opening starts from a fresh guide.
  return open ? <PermissionsDialog /> : null;
}

function PermissionsDialog() {
  const setOpen = useUi((s) => s.setPermissionsOpen);
  const toast = useUi((s) => s.toast);
  const [platform, setPlatform] = useState<Platform>(detectPlatform);
  const [loc, setLoc] = useState<PermState>('denied');
  const [push, setPush] = useState<PermState>('denied');
  const [guideShown, setGuideShown] = useState(false);
  const [done, setDone] = useState<number[]>([]);
  const close = useCallback(() => setOpen(false), [setOpen]);

  const refresh = useCallback(async () => {
    const [l, p] = await Promise.all([
      queryPermission('geolocation'),
      queryPermission('notifications'),
    ]);
    // In the demo an unknown state is shown as blocked, which is what the silent push reports.
    setLoc(l === 'unsupported' ? 'denied' : l);
    setPush(p === 'unsupported' ? 'denied' : p);
    return { l, p };
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([queryPermission('geolocation'), queryPermission('notifications')]).then(
      ([l, p]) => {
        if (!alive) return;
        setLoc(l === 'unsupported' ? 'denied' : l);
        setPush(p === 'unsupported' ? 'denied' : p);
      },
    );
    return () => {
      alive = false;
    };
  }, []);

  const requestNow = async () => {
    // A blocked permission cannot be re-asked from the web: only the OS settings can unblock it.
    if (loc === 'prompt' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => void refresh(),
        () => void refresh(),
      );
    }
    if (push === 'prompt' && typeof Notification !== 'undefined') {
      await Notification.requestPermission().catch(() => undefined);
    }
    setGuideShown(true);
  };

  const recheck = async () => {
    const { l, p } = await refresh();
    const ok = l === 'granted' && p === 'granted';
    toast(
      ok
        ? {
            tone: 'success',
            title: 'دسترسی‌ها فعال شد',
            body: 'از این پس ورود به بارانداز خودکار ثبت می‌شود.',
          }
        : {
            tone: 'info',
            title: 'هنوز دسترسی کامل نیست',
            body: 'مراحل راهنما را تا انتها انجام دهید.',
          },
    );
  };

  const steps = STEPS[platform];

  return (
    <Modal
      open
      onClose={close}
      title="فعال‌سازی دسترسی‌ها"
      footer={
        guideShown ? (
          <Button block icon={RefreshCw} onClick={recheck}>
            بررسی مجدد دسترسی
          </Button>
        ) : (
          <Button block icon={Settings} onClick={requestNow}>
            رفتن به تنظیمات گوشی
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-7 text-ink-2">
          کاسپین پرو برای ثبت خودکار ورود خودرو به بارانداز و ارسال هشدار پایان زمان بارگیری به مکان
          و اعلان‌ها نیاز دارد. سیستم‌عامل این دسترسی‌ها را مسدود کرده است.
        </p>

        <ul className="grid grid-cols-2 gap-2">
          {[
            { icon: MapPin, title: 'مکان (همیشه)', state: loc },
            { icon: BellRing, title: 'اعلان‌ها', state: push },
          ].map(({ icon: Icon, title, state }) => (
            <li
              key={title}
              className="flex flex-col gap-2 rounded-2xl border border-line bg-surface-2 p-3"
            >
              <Icon className="size-5 text-gold-ink" aria-hidden />
              <span className="text-sm font-bold text-ink">{title}</span>
              <Badge
                tone={state === 'granted' ? 'success' : state === 'prompt' ? 'warning' : 'danger'}
                icon={state === 'granted' ? CheckCircle2 : XCircle}
              >
                {STATE_LABEL[state]}
              </Badge>
            </li>
          ))}
        </ul>

        <Segmented<Platform>
          label="سیستم‌عامل گوشی"
          value={platform}
          onChange={setPlatform}
          options={[
            { value: 'ios', label: 'آیفون (iOS)', icon: Apple },
            { value: 'android', label: 'اندروید', icon: Smartphone },
          ]}
        />

        {platform === 'ios' && (
          <div className="rounded-2xl border border-gold/40 bg-gold-soft p-3 text-sm leading-7 text-ink">
            <p className="font-extrabold">نکته مهم iOS: دسترسی «همیشه» دو مرحله دارد</p>
            <p className="text-ink-2">
              iOS اجازه «همیشه» را مستقیم نمی‌دهد: اول «هنگام استفاده از برنامه» را بزنید، سپس در
              تنظیمات به «همیشه» تغییر دهید.
            </p>
          </div>
        )}

        <ol className="flex flex-col gap-2" aria-label="مراحل فعال‌سازی">
          {steps.map((s, i) => {
            const checked = done.includes(i);
            return (
              <li key={s}>
                <label
                  className={cx(
                    'flex min-h-12 cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors',
                    checked ? 'border-success/40 bg-success-soft' : 'border-line bg-surface',
                    guideShown && !checked && done.length === i && 'ring-2 ring-gold',
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() =>
                      setDone((d) => (checked ? d.filter((x) => x !== i) : [...d, i]))
                    }
                  />
                  <span
                    aria-hidden
                    className={cx(
                      'inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold',
                      checked
                        ? 'bg-success text-white dark:text-[#052e16]'
                        : 'bg-gold-soft text-gold-ink',
                    )}
                  >
                    {checked ? <Check className="size-4" /> : toFa(i + 1)}
                  </span>
                  <span className="text-sm leading-7 text-ink">{s}</span>
                </label>
              </li>
            );
          })}
        </ol>

        {platform === 'ios' && (
          <p className="flex items-start gap-2 text-xs leading-6 text-ink-2">
            <Share className="mt-0.5 size-4 shrink-0" aria-hidden />
            اعلان‌ها در iOS فقط وقتی کار می‌کنند که برنامه از Safari با «اشتراک‌گذاری ← افزودن به
            صفحه اصلی» نصب شده باشد (iOS ۱۶٫۴ به بالا).
          </p>
        )}
      </div>
    </Modal>
  );
}
