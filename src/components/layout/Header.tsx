import { ArrowRight, Bell, CircleUserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { toFa } from '../../lib/persian';
import { goBack, navigate } from '../../lib/router';
import { selectUnread, useNotifications } from '../../store/notifications';
import { IconButton } from '../ui/Button';

export function NotificationBell() {
  const unread = useNotifications(selectUnread);
  return (
    <IconButton
      icon={Bell}
      label={unread > 0 ? `اعلان‌ها، ${toFa(unread)} خوانده‌نشده` : 'اعلان‌ها'}
      onClick={() => navigate('notifications')}
    >
      {unread > 0 && (
        <span
          aria-hidden
          className="absolute top-2 end-2 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-card"
        >
          {toFa(unread > 9 ? '9+' : unread)}
        </span>
      )}
    </IconButton>
  );
}

/** Hub header (Owner style): small greeting, big title, bell + profile on the left. */
export function HubHeader({
  greeting,
  title,
  caption,
}: {
  greeting: string;
  title: string;
  caption?: string;
}) {
  return (
    <header className="safe-top flex items-start gap-1 px-4 pb-4 pt-6">
      <div className="min-w-0 flex-1 px-1">
        <p className="text-[15px] text-ink-2">{greeting}</p>
        <h1 className="text-[26px] font-bold leading-tight text-ink">{title}</h1>
        {caption && <p className="mt-0.5 text-[13px] text-ink-2">{caption}</p>}
      </div>
      <NotificationBell />
      <IconButton icon={CircleUserRound} label="پروفایل" onClick={() => navigate('profile')} />
    </header>
  );
}

/** Screen header: optional back button and a big title. */
export function PageHeader({
  title,
  subtitle,
  back = false,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: ReactNode;
}) {
  return (
    <header className="safe-top flex items-center gap-1 px-2 pb-2 pt-4">
      {back && <IconButton icon={ArrowRight} label="بازگشت" onClick={goBack} />}
      <div className={`min-w-0 flex-1 ${back ? 'px-1' : 'px-3'}`}>
        <h1 className="text-[24px] font-bold leading-tight text-ink">{title}</h1>
        {subtitle && <p className="text-[13px] text-ink-2">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
