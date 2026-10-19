import {
  BellOff,
  CheckCheck,
  FileCheck2,
  Megaphone,
  ShieldAlert,
  Ticket,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/Feedback';
import { cx } from '../../components/ui/cx';
import { relativeTime, toFa } from '../../lib/persian';
import { navigate } from '../../lib/router';
import { selectUnread, useNotifications, type NoticeKind } from '../../store/notifications';
import { useNow } from '../../hooks/useNow';

const KIND: Record<NoticeKind, { icon: LucideIcon; label: string; cls: string }> = {
  permit: { icon: FileCheck2, label: 'مجوز', cls: 'bg-success-soft text-success' },
  loading: { icon: Timer, label: 'بارگیری', cls: 'bg-warning-soft text-warning' },
  management: { icon: Megaphone, label: 'مدیریت کاسپین', cls: 'bg-gold-soft text-gold-ink' },
  ticket: { icon: Ticket, label: 'درخواست', cls: 'bg-info-soft text-info' },
  security: { icon: ShieldAlert, label: 'حراست', cls: 'bg-danger-soft text-danger' },
};

export function NotificationsPage() {
  const { items, markRead, markAllRead } = useNotifications();
  const unread = useNotifications(selectUnread);
  const now = useNow(30_000);
  return (
    <>
      <PageHeader
        title="مرکز اعلان‌ها"
        subtitle={unread ? `${toFa(unread)} اعلان خوانده‌نشده` : 'همه اعلان‌ها خوانده شده'}
      />
      <div className="flex flex-col gap-3 px-4 pt-4">
        {unread > 0 && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              icon={CheckCheck}
              onClick={markAllRead}
              className="text-gold-ink"
            >
              علامت‌گذاری همه به‌عنوان خوانده‌شده
            </Button>
          </div>
        )}
        {items.length === 0 ? (
          <EmptyState icon={BellOff} title="اعلانی ندارید" />
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((n) => {
              const k = KIND[n.kind];
              const Icon = k.icon;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markRead(n.id);
                      if (n.link) navigate(n.link);
                    }}
                    className={cx(
                      'theme-fade flex w-full gap-3 rounded-2xl border bg-surface p-4 text-start shadow-card transition-transform duration-150 active:scale-[0.98] cursor-pointer',
                      n.read ? 'border-line' : 'border-gold/50',
                    )}
                  >
                    <span
                      className={cx(
                        'inline-flex size-11 shrink-0 items-center justify-center rounded-xl',
                        k.cls,
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-center gap-2">
                        <span className="flex-1 font-bold text-ink">{n.title}</span>
                        {!n.read && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[11px] font-extrabold text-on-gold">
                            جدید
                          </span>
                        )}
                      </span>
                      <span className="text-sm leading-6 text-ink-2">{n.body}</span>
                      <span className="text-xs text-ink-2">
                        {k.label} – {relativeTime(n.createdAt, now)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
