import { Loader2, type LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

type Variant = 'filled' | 'tonal' | 'outlined' | 'text' | 'danger';

const VARIANTS: Record<Variant, string> = {
  filled: 'bg-primary text-on-primary hover:opacity-90',
  tonal: 'bg-primary-soft text-on-primary-soft hover:opacity-90',
  outlined: 'border border-outline bg-transparent text-ink hover:bg-row',
  text: 'bg-transparent text-ink hover:bg-row',
  danger: 'bg-sos text-on-sos hover:opacity-90',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: LucideIcon;
  loading?: boolean;
  block?: boolean;
  children: ReactNode;
}

/** Stadium button, 48px tall (Owner style). */
export function Button({
  variant = 'filled',
  icon: Icon,
  loading,
  block,
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
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold transition-[opacity,background-color,transform] duration-150 active:scale-[0.98] cursor-pointer select-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
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
}

/** Icon-only control: 48px hit area and an accessible name. */
export function IconButton({ icon: Icon, label, className, children, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'relative inline-flex size-12 shrink-0 items-center justify-center rounded-full text-ink transition-colors duration-150 hover:bg-field cursor-pointer',
        className,
      )}
      {...rest}
    >
      <Icon className="size-6" strokeWidth={1.75} aria-hidden />
      {children}
    </button>
  );
}
