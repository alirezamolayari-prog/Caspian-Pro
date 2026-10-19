import { Check, type LucideIcon } from 'lucide-react';
import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from './cx';

/** Filter-style chip for multi-select (aria-pressed), radius 10 with a check. */
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
        'inline-flex min-h-12 items-center gap-1.5 rounded-[10px] border px-4 text-[15px] font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50',
        selected
          ? 'border-primary bg-primary-soft text-on-primary-soft'
          : 'border-outline bg-card text-ink hover:bg-row',
      )}
    >
      {selected && <Check className="size-4" strokeWidth={2.5} aria-hidden />}
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

/** Single choice as a radiogroup (segmented button) with arrow keys. */
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  columns,
}: {
  label: string;
  options: SegmentOption<T>[];
  value: T | null;
  onChange: (v: T) => void;
  columns?: number;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const onKey = (e: KeyboardEvent, idx: number) => {
    const next = e.key === 'ArrowLeft' || e.key === 'ArrowDown';
    const prev = e.key === 'ArrowRight' || e.key === 'ArrowUp';
    if (!next && !prev) return;
    e.preventDefault();
    const pos = enabled.indexOf(idx);
    const to = enabled[(pos + (next ? 1 : -1) + enabled.length) % enabled.length]!;
    onChange(options[to]!.value);
    refs.current[to]?.focus();
  };
  const activeIdx = options.findIndex((o) => o.value === value);
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-2"
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
              'inline-flex min-h-12 items-center justify-center gap-1.5 rounded-[10px] border px-2 text-[15px] font-medium transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40',
              checked
                ? 'border-primary bg-primary-soft text-on-primary-soft'
                : 'border-outline bg-card text-ink hover:bg-row',
            )}
          >
            {checked ? (
              <Check className="size-4" strokeWidth={2.5} aria-hidden />
            ) : (
              Icon && <Icon className="size-4" aria-hidden />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Single-select list row with a radio dot (used for gates, zones, categories). */
export function RadioCard({
  checked,
  onSelect,
  disabled,
  children,
  aside,
}: {
  checked: boolean;
  onSelect: () => void;
  disabled?: boolean;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      disabled={disabled}
      onClick={onSelect}
      className={cx(
        'theme-fade flex min-h-16 w-full items-center gap-3 rounded-[20px] border bg-card p-4 text-start transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-55',
        checked ? 'border-primary ring-1 ring-primary' : 'border-line hover:bg-row',
      )}
    >
      <span
        aria-hidden
        className={cx(
          'inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2',
          checked ? 'border-primary' : 'border-outline',
        )}
      >
        {checked && <span className="size-2.5 rounded-full bg-primary" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">{children}</span>
      {aside}
    </button>
  );
}
