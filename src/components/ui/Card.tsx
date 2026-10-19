import type { LucideIcon } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

/** White (or gray in dark) card with a thin border instead of a shadow. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx('theme-fade rounded-[20px] border border-line bg-card p-4', className)}
      {...rest}
    />
  );
}

export function SectionTitle({
  children,
  action,
  id,
}: {
  children: ReactNode;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-2 flex min-h-10 items-center justify-between gap-2 px-1">
      <h2 id={id} className="text-base font-semibold text-ink">
        {children}
      </h2>
      {action}
    </div>
  );
}

/** One bordered card holding zebra rows (Owner's CardSliverList). */
export function ZebraList({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <ul
      aria-label={label}
      className={cx(
        'theme-fade overflow-hidden rounded-[20px] border border-line bg-card [&>li:nth-child(even)]:bg-row [&>li+li]:border-t [&>li+li]:border-line',
        className,
      )}
    >
      {children}
    </ul>
  );
}

/** Icon in a soft slate tile, used for every section. */
export function IconTile({
  icon: Icon,
  size = 'md',
}: {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
}) {
  const box = { sm: 'size-10 rounded-xl', md: 'size-12 rounded-2xl', lg: 'size-14 rounded-2xl' }[
    size
  ];
  const icon = { sm: 'size-5', md: 'size-6', lg: 'size-7' }[size];
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center bg-primary-soft text-on-primary-soft',
        box,
      )}
    >
      <Icon className={icon} strokeWidth={1.75} aria-hidden />
    </span>
  );
}
