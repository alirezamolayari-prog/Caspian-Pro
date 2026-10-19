import type { LucideIcon } from 'lucide-react';
import { cx } from './cx';

export type Tone = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

const TONES: Record<Tone, string> = {
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
  neutral: 'bg-primary-soft text-on-primary-soft',
};

/** Status chip. Status is always written out, never colour alone. */
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
        'inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1 text-[13px] font-semibold whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {Icon && <Icon className="size-4" aria-hidden />}
      {children}
    </span>
  );
}
