import { CheckCircle2, Info, X, XCircle, type LucideIcon } from 'lucide-react';
import { useUi } from '../../store/ui';
import { cx } from './cx';

export function ProgressBar({
  value,
  label,
  tone = 'gold',
}: {
  value: number;
  label: string;
  tone?: 'gold' | 'danger' | 'warning';
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className="h-2.5 w-full overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10"
    >
      <div
        className={cx(
          'progress-shimmer h-full rounded-full transition-[width] duration-1000 ease-linear',
          tone === 'gold' && 'bg-gradient-to-l from-[#F3DC8B] via-gold to-[#9C7A1C]',
          tone === 'warning' && 'bg-[#F59E0B]',
          tone === 'danger' && 'bg-[#EF4444]',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-gold-soft text-gold-ink">
        <Icon className="size-7" aria-hidden />
      </span>
      <p className="font-extrabold text-ink">{title}</p>
      {body && <p className="text-sm text-ink-2">{body}</p>}
      {action}
    </div>
  );
}

export function Alert({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: 'warning' | 'danger' | 'info' | 'success';
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
}) {
  const tones = {
    warning: 'border-warning/40 bg-warning-soft text-warning',
    danger: 'border-danger/40 bg-danger-soft text-danger',
    info: 'border-info/30 bg-info-soft text-info',
    success: 'border-success/30 bg-success-soft text-success',
  } as const;
  return (
    <div
      className={cx('flex gap-3 rounded-2xl border p-4', tones[tone])}
      role={tone === 'danger' ? 'alert' : 'note'}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-extrabold">{title}</p>
        {children && <div className="text-sm leading-7 text-ink">{children}</div>}
      </div>
    </div>
  );
}

const TOAST_ICON = { success: CheckCircle2, error: XCircle, info: Info } as const;

/** Toast stack above the bottom nav; announced politely, never steals focus. */
export function Toaster() {
  const toasts = useUi((s) => s.toasts);
  const dismiss = useUi((s) => s.dismissToast);
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[110] mx-auto flex max-w-md flex-col gap-2 px-4"
    >
      {toasts.map((t) => {
        const Icon = TOAST_ICON[t.tone];
        return (
          <div
            key={t.id}
            role="status"
            className="animate-sheet pointer-events-auto flex items-start gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card"
          >
            <Icon
              className={cx(
                'mt-0.5 size-5 shrink-0',
                t.tone === 'success' && 'text-success',
                t.tone === 'error' && 'text-danger',
                t.tone === 'info' && 'text-gold-ink',
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-ink">{t.title}</p>
              {t.body && <p className="text-xs text-ink-2 [overflow-wrap:anywhere]">{t.body}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="بستن پیام"
              className="-m-2 inline-flex size-11 items-center justify-center rounded-xl text-ink-2 cursor-pointer"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
