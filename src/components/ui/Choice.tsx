import { Check, type LucideIcon } from 'lucide-react';
import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from './cx';

/** Toggle chip for multi-select (aria-pressed). */
export function Chip({
  selected,
  onToggle,
  children,
  disabled,
}: {
  selected: boolean;
  onToggle: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onToggle}
      className={cx(
        'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition-[transform,background-color,border-color] duration-150 active:scale-95 cursor-pointer disabled:opacity-50',
        selected
          ? 'border-gold bg-gold-soft text-gold-ink'
          : 'border-line bg-surface text-ink hover:bg-surface-2',
      )}
    >
      {selected && <Check className="size-4" aria-hidden />}
      {children}
    </button>
  );
}

export interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

/** Single choice as a radiogroup with arrow-key support. */
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  columns,
  size = 'md',
}: {
  label: string;
  options: SegmentOption<T>[];
  value: T | null;
  onChange: (v: T) => void;
  columns?: number;
  size?: 'sm' | 'md';
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const onKey = (e: KeyboardEvent, idx: number) => {
    const rtlNext = e.key === 'ArrowLeft' || e.key === 'ArrowDown';
    const rtlPrev = e.key === 'ArrowRight' || e.key === 'ArrowUp';
    if (!rtlNext && !rtlPrev) return;
    e.preventDefault();
    const pos = enabled.indexOf(idx);
    const next = enabled[(pos + (rtlNext ? 1 : -1) + enabled.length) % enabled.length]!;
    onChange(options[next]!.value);
    refs.current[next]?.focus();
  };
  const activeIdx = options.findIndex((o) => o.value === value);
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1 rounded-2xl border border-line bg-surface-2 p-1"
      style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o, i) => {
        const checked = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={String(o.value)}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={o.disabled}
            tabIndex={checked || (activeIdx < 0 && i === enabled[0]) ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={cx(
              'inline-flex items-center justify-center gap-1.5 rounded-xl px-2 font-bold transition-[transform,background-color,color] duration-150 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40',
              size === 'sm' ? 'min-h-10 text-xs' : 'min-h-11 text-sm',
              checked
                ? 'bg-surface text-ink shadow-card ring-1 ring-gold/60'
                : 'text-ink-2 hover:text-ink',
            )}
          >
            {Icon && <Icon className={cx('size-4', checked && 'text-gold-ink')} aria-hidden />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl text-start cursor-pointer"
    >
      <span className="flex flex-col">
        <span className="text-sm font-bold text-ink">{label}</span>
        {description && <span className="text-xs text-ink-2">{description}</span>}
      </span>
      <span
        aria-hidden
        className={cx(
          'flex h-7 w-12 shrink-0 items-center rounded-full border p-0.5 transition-colors duration-200',
          checked ? 'justify-end border-gold bg-gold' : 'justify-start border-line bg-surface-2',
        )}
      >
        <span className="size-5.5 rounded-full bg-white shadow" />
      </span>
    </button>
  );
}
