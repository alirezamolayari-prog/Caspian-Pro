import {
  BellOff,
  CheckCheck,
  FileCheck2,
  Megaphone,
  ShieldAlert,
  Ticket,
  Car,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { IconTile, ZebraList } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/Feedback';
import { useNow } from '../../hooks/useNow';
import { relativeTime, toFa } from '../../lib/persian';
import { navigate } from '../../lib/router';
import { markAllNoticesRead, markNoticeRead } from '../../api';
import { selectUnread, useNotifications, type NoticeKind } from '../../store/notifications';

const KIND: Record<NoticeKind, { icon: LucideIcon; label: string }> = {
  permit: { icon: FileCheck2, label: 'مجوز' },
  loading: { icon: Car, label: 'تردد و خودرو' },
  management: { icon: Megaphone, label: 'مدیریت کاسپین' },
  ticket: { icon: Ticket, label: 'درخواست' },
  security: { icon: ShieldAlert, label: 'حراست' },
};

export function NotificationsPage() {
  const items = useNotifications((s) => s.items);
  const unread = useNotifications(selectUnread);
  const now = useNow(30_000);
  return (
    <>
      <PageHeader
        title="اعلان‌ها"
        subtitle={unread ? `${toFa(unread)} اعلان خوانده‌نشده` : 'همه اعلان‌ها خوانده شده'}
      />
      <div className="flex flex-col gap-3 px-4 pt-2">
        {unread > 0 && (
          <div className="flex justify-end">
            <Button variant="text" icon={CheckCheck} onClick={markAllNoticesRead}>
              خواندن همه
            </Button>
          </div>
        )}
        {items.length === 0 ? (
          <EmptyState icon={BellOff} title="اعلانی ندارید" />
        ) : (
          <ZebraList label="اعلان‌ها">
            {items.map((n) => {
              const k = KIND[n.kind];
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markNoticeRead(n.id);
                      if (n.link) navigate(n.link);
                    }}
                    className="flex w-full gap-3 px-4 py-3 text-start cursor-pointer"
                  >
                    <IconTile icon={k.icon} size="sm" />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-start gap-2">
                        <span className={`flex-1 text-ink ${n.read ? 'font-medium' : 'font-bold'}`}>
                          {n.title}
                        </span>
                        {!n.read && (
                          <span className="shrink-0 rounded-[8px] bg-primary px-2 py-0.5 text-[11px] font-bold text-on-primary">
                            جدید
                          </span>
                        )}
                      </span>
                      <span className="text-[13px] leading-6 text-ink-2">{n.body}</span>
                      <span className="text-[12px] text-ink-2">
                        {k.label} – {relativeTime(n.createdAt, now)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ZebraList>
        )}
      </div>
    </>
  );
}
