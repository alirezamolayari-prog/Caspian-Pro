import { Loader2, type LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'navy';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gold text-on-gold shadow-[0_6px_18px_-6px_rgba(212,175,55,0.65)] hover:brightness-105',
  navy: 'bg-header text-on-header dark:bg-surface-2 hover:brightness-110',
  secondary: 'bg-surface text-ink border border-line hover:bg-surface-2',
  ghost: 'bg-transparent text-ink hover:bg-surface-2',
  danger: 'bg-danger text-white dark:text-[#1a0505] hover:brightness-110',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: LucideIcon;
  loading?: boolean;
  block?: boolean;
  size?: 'md' | 'lg';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  icon: Icon,
  loading,
  block,
  size = 'md',
  className,
  disabled,
  children,
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-[transform,filter,background-color] duration-150 active:scale-95 cursor-pointer select-none',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        size === 'lg' ? 'min-h-14 px-6 text-base' : 'min-h-12 px-4 text-sm',
        block && 'w-full',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className="size-5 animate-spin" aria-hidden />
      ) : (
        Icon && <Icon className="size-5" aria-hidden />
      )}
      <span>{children}</span>
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  tone?: 'header' | 'surface';
}

/** Icon-only control with a 48px hit area and an accessible name. */
export function IconButton({
  icon: Icon,
  label,
  tone = 'surface',
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'relative inline-flex size-12 shrink-0 items-center justify-center rounded-2xl transition-[transform,background-color] duration-150 active:scale-95 cursor-pointer',
        tone === 'header'
          ? 'bg-white/10 text-on-header hover:bg-white/15 ring-1 ring-white/10'
          : 'bg-surface-2 text-ink hover:brightness-95',
        className,
      )}
      {...rest}
    >
      <Icon className="size-5" aria-hidden />
      {children}
    </button>
  );
}
