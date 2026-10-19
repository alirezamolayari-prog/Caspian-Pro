import { BellRing, Car, ClipboardCheck, Megaphone, Share } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { IconTile } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { useUi } from '../../store/ui';
import { markPrompted, pushSupport, shouldPrompt } from './notifications';

const BENEFITS = [
  { icon: ClipboardCheck, text: 'نتیجه درخواست‌ها و تایید مجوزها' },
  { icon: Car, text: 'یادآوری پایان اشتراک پارکینگ' },
  { icon: Megaphone, text: 'اطلاعیه‌های مدیریت کاسپین' },
];

/** Notification permission sheet shown on first open, like native apps do. */
export function NotificationPrompt() {
  const open = useUi((s) => s.notifyPromptOpen);
  const setOpen = useUi((s) => s.setNotifyPromptOpen);
  const toast = useUi((s) => s.toast);

  useEffect(() => {
    if (!shouldPrompt()) return;
    const id = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(id);
  }, [setOpen]);

  const close = () => {
    markPrompted();
    setOpen(false);
  };

  const allow = async () => {
    markPrompted();
    setOpen(false);
    try {
      const result = await Notification.requestPermission();
      toast(
        result === 'granted'
          ? { tone: 'success', title: 'اعلان‌ها فعال شد' }
          : {
              tone: 'info',
              title: 'اعلان‌ها فعال نشد',
              body: 'از پروفایل می‌توانید دوباره فعال کنید.',
            },
      );
    } catch {
      toast({ tone: 'error', title: 'این مرورگر اعلان را پشتیبانی نمی‌کند' });
    }
  };

  const support = open ? pushSupport() : 'supported';

  return (
    <Modal
      open={open}
      onClose={close}
      title="اجازه ارسال اعلان"
      footer={
        support === 'supported' ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outlined" onClick={close}>
              بعداً
            </Button>
            <Button icon={BellRing} onClick={allow}>
              اجازه می‌دهم
            </Button>
          </div>
        ) : (
          <Button block onClick={close}>
            متوجه شدم
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-[15px] leading-7 text-ink-2">
          کاسپین پرو می‌خواهد برای موارد زیر به شما اعلان بفرستد:
        </p>
        <ul className="flex flex-col gap-3">
          {BENEFITS.map(({ icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <IconTile icon={icon} size="sm" />
              <span className="text-[15px] text-ink">{text}</span>
            </li>
          ))}
        </ul>
        {support === 'needs-install' && (
          <p className="flex items-start gap-2 rounded-2xl bg-row p-3 text-[13px] leading-6 text-ink">
            <Share className="mt-0.5 size-4 shrink-0" aria-hidden />
            در آیفون، اعلان فقط برای برنامه نصب‌شده کار می‌کند: در Safari دکمه اشتراک‌گذاری را بزنید
            و «افزودن به صفحه اصلی» را انتخاب کنید، سپس برنامه را از صفحه اصلی باز کنید.
          </p>
        )}
        {support === 'unsupported' && (
          <p className="rounded-2xl bg-row p-3 text-[13px] leading-6 text-ink">
            این مرورگر اعلان را پشتیبانی نمی‌کند. برنامه را با Chrome یا Safari باز کنید.
          </p>
        )}
      </div>
    </Modal>
  );
}
