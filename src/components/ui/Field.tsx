import { AlertCircle } from 'lucide-react';
import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cx } from './cx';

interface FieldProps {
  label: string;
  required?: boolean;
  helper?: string;
  error?: string | false;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

/** Visible label + helper + error wired with aria-describedby. */
export function Field({ label, required, helper, error, children }: FieldProps) {
  const id = useId();
  const helperId = `${id}-help`;
  const errorId = `${id}-err`;
  const describedBy = [helper && helperId, error && errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="px-1 text-sm font-bold text-ink">
        {label}
        {required && (
          <span className="ms-1 text-danger" aria-hidden>
            *
          </span>
        )}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {helper && !error && (
        <p id={helperId} className="px-1 text-xs text-ink-2">
          {helper}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1 px-1 text-xs font-bold text-danger"
        >
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

const control =
  'theme-fade w-full rounded-2xl border bg-surface px-4 text-base text-ink placeholder:text-ink-2/70 outline-none transition-[border-color,box-shadow] focus:border-gold focus:ring-4 focus:ring-gold-soft';

export function TextInput({
  invalid,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cx(control, 'min-h-12', invalid ? 'border-danger' : 'border-line', className)}
      {...rest}
    />
  );
}

export function TextArea({
  invalid,
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      rows={3}
      className={cx(
        control,
        'min-h-24 resize-y py-3 leading-7',
        invalid ? 'border-danger' : 'border-line',
        className,
      )}
      {...rest}
    />
  );
}

export function Select({
  invalid,
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cx(
        control,
        'min-h-12 cursor-pointer appearance-none bg-[length:1.1rem] bg-[left_1rem_center] bg-no-repeat pe-4 ps-10',
        invalid ? 'border-danger' : 'border-line',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23B8901C' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...rest}
    >
      {children}
    </select>
  );
}
