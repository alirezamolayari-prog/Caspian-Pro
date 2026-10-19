import type { LucideIcon } from 'lucide-react';
import { cx } from './cx';

export type Tone = 'gold' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';

const TONES: Record<Tone, string> = {
  gold: 'bg-gold-soft text-gold-ink',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
  neutral: 'bg-surface-2 text-ink-2',
};

/** Status is always shown as text (never colour alone). */
export function Badge({
  tone = 'neutral',
  icon: Icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {children}
    </span>
  );
}
