import type { HTMLAttributes } from 'react';
import { cx } from './cx';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        'theme-fade rounded-2xl border border-line bg-surface p-4 shadow-card',
        className,
      )}
      {...rest}
    />
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2 px-1">
      <h2 className="text-base font-extrabold text-ink">{children}</h2>
      {action}
    </div>
  );
}
