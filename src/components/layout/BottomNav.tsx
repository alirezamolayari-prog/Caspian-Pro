import { Bell, ClipboardList, Home, UserRound } from 'lucide-react';
import { toFa } from '../../lib/persian';
import { hrefFor, navigate, type Tab } from '../../lib/router';
import { selectUnread, useNotifications } from '../../store/notifications';
import { isOpen, useTickets } from '../../store/tickets';
import { cx } from '../ui/cx';

const TABS: Array<{ id: Tab; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'خانه', icon: Home },
  { id: 'requests', label: 'درخواست‌ها', icon: ClipboardList },
  { id: 'notifications', label: 'اعلان‌ها', icon: Bell },
  { id: 'profile', label: 'پروفایل', icon: UserRound },
];

export function BottomNav({ active }: { active: Tab }) {
  const unread = useNotifications(selectUnread);
  const open = useTickets((s) => s.items.filter((t) => isOpen(t.status)).length);
  return (
    <nav
      aria-label="منوی اصلی"
      className="safe-bottom fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md border-t border-line bg-nav backdrop-blur-xl"
    >
      <ul className="grid grid-cols-4 px-2 pt-1.5 pb-1.5">
        {TABS.map(({ id, label, icon: Icon }) => {
          const current = active === id;
          const count = id === 'notifications' ? unread : id === 'requests' ? open : 0;
          return (
            <li key={id}>
              <a
                href={hrefFor(id)}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(id);
                }}
                aria-current={current ? 'page' : undefined}
                className={cx(
                  'relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-bold transition-[transform,color] duration-150 active:scale-95',
                  current ? 'text-gold-ink' : 'text-ink-2 hover:text-ink',
                )}
              >
                <span
                  className={cx(
                    'relative inline-flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-200',
                    current && 'bg-gold-soft',
                  )}
                >
                  <Icon className="size-5" aria-hidden strokeWidth={current ? 2.4 : 2} />
                  {count > 0 && (
                    <span className="absolute -top-0.5 end-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-extrabold text-on-gold">
                      {toFa(count > 9 ? '9+' : count)}
                      <span className="sr-only"> مورد</span>
                    </span>
                  )}
                </span>
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
