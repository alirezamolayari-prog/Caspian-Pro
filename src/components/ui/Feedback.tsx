import { CheckCircle2, Info, X, XCircle, type LucideIcon } from 'lucide-react';
import { useUi } from '../../store/ui';
import { cx } from './cx';

export function ProgressBar({
  value,
  label,
  tone = 'primary',
}: {
  value: number;
  label: string;
  tone?: 'primary' | 'warning' | 'danger';
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className="h-2 w-full overflow-hidden rounded-full bg-field"
    >
      <div
        className={cx(
          'h-full rounded-full transition-[width] duration-500',
          tone === 'primary' && 'bg-primary',
          tone === 'warning' && 'bg-warning',
          tone === 'danger' && 'bg-danger',
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
    <div className="flex flex-col items-center gap-3 rounded-[20px] border border-line bg-card px-6 py-10 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-on-primary-soft">
        <Icon className="size-7" strokeWidth={1.75} aria-hidden />
      </span>
      <p className="font-semibold text-ink">{title}</p>
      {body && <p className="text-[13px] text-ink-2">{body}</p>}
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
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    info: 'bg-info-soft text-info',
    success: 'bg-success-soft text-success',
  } as const;
  return (
    <div
      className={cx('flex gap-3 rounded-[20px] p-4', tones[tone])}
      role={tone === 'danger' ? 'alert' : 'note'}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{title}</p>
        {children && <div className="text-[13px] leading-6">{children}</div>}
      </div>
    </div>
  );
}

const TOAST_ICON = { success: CheckCircle2, error: XCircle, info: Info } as const;

/** Floating snackbar above the bottom bar; announced politely, never steals focus. */
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
            className="animate-sheet pointer-events-auto flex items-center gap-3 rounded-2xl bg-primary py-2 ps-4 pe-1 text-on-primary shadow-lg"
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1 py-1">
              <p className="text-[15px] font-semibold">{t.title}</p>
              {t.body && (
                <p className="text-[13px] opacity-90 [overflow-wrap:anywhere]">{t.body}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="بستن پیام"
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-full cursor-pointer"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
