import { Bell, ClipboardList, Home, UserRound } from 'lucide-react';
import { toFa } from '../../lib/persian';
import { hrefFor, navigate, type Tab } from '../../lib/router';
import { selectUnread, useNotifications } from '../../store/notifications';
import { cx } from '../ui/cx';

const TABS: Array<{ id: Tab; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'خانه', icon: Home },
  { id: 'requests', label: 'درخواست‌ها', icon: ClipboardList },
  { id: 'notifications', label: 'اعلان‌ها', icon: Bell },
  { id: 'profile', label: 'پروفایل', icon: UserRound },
];

/** Material-style navigation bar, like Caspian Owner. */
export function BottomNav({ active }: { active: Tab }) {
  const unread = useNotifications(selectUnread);
  return (
    <nav
      aria-label="منوی اصلی"
      className="theme-fade safe-bottom fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md bg-field"
    >
      <ul className="grid grid-cols-4 px-2 py-2">
        {TABS.map(({ id, label, icon: Icon }) => {
          const current = active === id;
          const count = id === 'notifications' ? unread : 0;
          return (
            <li key={id}>
              <a
                href={hrefFor(id)}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(id);
                }}
                aria-current={current ? 'page' : undefined}
                className="flex min-h-14 flex-col items-center justify-center gap-1 text-[13px] font-medium text-ink"
              >
                <span
                  className={cx(
                    'relative inline-flex h-8 w-16 items-center justify-center rounded-full transition-colors duration-200',
                    current && 'bg-primary-soft',
                  )}
                >
                  <Icon className="size-6" strokeWidth={current ? 2.2 : 1.75} aria-hidden />
                  {count > 0 && (
                    <span className="absolute -top-0.5 end-3 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-card">
                      {toFa(count > 9 ? '9+' : count)}
                      <span className="sr-only"> اعلان جدید</span>
                    </span>
                  )}
                </span>
                <span className={current ? 'font-bold' : undefined}>{label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
