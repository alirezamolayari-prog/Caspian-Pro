import { ArrowRight, Bell, Moon, Search, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import { STORE } from '../../data/catalog';
import { greeting, toFa } from '../../lib/persian';
import { goBack, navigate } from '../../lib/router';
import { selectUnread, useNotifications } from '../../store/notifications';
import { useUi } from '../../store/ui';
import { IconButton } from '../ui/Button';

export function ThemeToggle() {
  const theme = useUi((s) => s.theme);
  const toggle = useUi((s) => s.toggleTheme);
  const dark = theme === 'dark';
  return (
    <IconButton
      tone="header"
      icon={dark ? Sun : Moon}
      label={dark ? 'حالت روشن' : 'حالت تیره'}
      aria-pressed={dark}
      onClick={toggle}
      className={dark ? 'text-gold' : undefined}
    />
  );
}

export function NotificationBell() {
  const unread = useNotifications(selectUnread);
  return (
    <IconButton
      tone="header"
      icon={Bell}
      label={unread > 0 ? `اعلان‌ها، ${toFa(unread)} خوانده‌نشده` : 'اعلان‌ها'}
      onClick={() => navigate('notifications')}
    >
      {unread > 0 && (
        <span
          aria-hidden
          className="animate-gold-pulse absolute -top-1 -start-1 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-extrabold text-on-gold ring-2 ring-header"
        >
          {toFa(unread > 9 ? '9+' : unread)}
        </span>
      )}
    </IconButton>
  );
}

function Shell({ children, tall }: { children: ReactNode; tall?: boolean }) {
  return (
    <header
      className={`safe-top relative overflow-hidden rounded-b-[2rem] bg-header text-on-header ${tall ? 'pb-16' : 'pb-6'}`}
    >
      {/* Decorative gold glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -start-16 size-64 rounded-full bg-gold/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -end-10 size-56 rounded-full bg-[#334155]/40 blur-3xl"
      />
      <div className="relative px-4 pt-4">{children}</div>
    </header>
  );
}

export function HomeHeader({ query, onQuery }: { query: string; onQuery: (q: string) => void }) {
  return (
    <Shell tall>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('profile')}
          aria-label="پروفایل غرفه"
          className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F3DC8B] via-gold to-[#9C7A1C] text-lg font-black text-on-gold shadow-lg active:scale-95 cursor-pointer"
        >
          ر
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-on-header-2">
            {greeting()}، {STORE.manager}
          </p>
          <h1 className="truncate text-lg font-extrabold">
            {STORE.name} – پلاک {STORE.unit}
          </h1>
        </div>
        <ThemeToggle />
        <NotificationBell />
      </div>
      <form role="search" className="relative mt-4" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="global-search" className="sr-only">
          جستجوی خدمات
        </label>
        <Search
          className="pointer-events-none absolute z-10 start-4 top-1/2 size-5 -translate-y-1/2 text-on-header-2"
          aria-hidden
        />
        <input
          id="global-search"
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="جستجوی خدمات، مثلاً «بارگیری»"
          className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/10 ps-12 pe-4 text-base text-on-header placeholder:text-on-header-2 outline-none backdrop-blur focus:border-gold focus:ring-4 focus:ring-gold/25"
        />
      </form>
    </Shell>
  );
}

export function PageHeader({
  title,
  subtitle,
  back = false,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
}) {
  return (
    <Shell>
      <div className="flex items-center gap-2">
        {back && <IconButton tone="header" icon={ArrowRight} label="بازگشت" onClick={goBack} />}
        <div className="min-w-0 flex-1 px-1">
          <h1 className="truncate text-xl font-extrabold">{title}</h1>
          {subtitle && <p className="truncate text-xs text-on-header-2">{subtitle}</p>}
        </div>
        <ThemeToggle />
        <NotificationBell />
      </div>
    </Shell>
  );
}
