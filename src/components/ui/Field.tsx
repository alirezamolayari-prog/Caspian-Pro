import { AlertCircle } from 'lucide-react';
import {
  useId,
  type InputHTMLAttributes,
  type Ref,
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

/** Visible label + helper + error, wired with aria-describedby. */
export function Field({ label, required, helper, error, children }: FieldProps) {
  const id = useId();
  const helperId = `${id}-help`;
  const errorId = `${id}-err`;
  const describedBy =
    [helper && !error && helperId, error && errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="px-2 text-[15px] font-semibold text-ink">
        {label}
        {required && (
          <span className="ms-1 text-danger" aria-hidden>
            *
          </span>
        )}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {helper && !error && (
        <p id={helperId} className="px-2 text-[13px] text-ink-2">
          {helper}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1 px-2 text-[13px] font-semibold text-danger"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

/** Filled input, Owner style: no border until focus or error. */
const control =
  'theme-fade w-full border-2 bg-field px-5 text-base text-ink placeholder:text-ink-2 outline-none transition-[border-color] focus:border-primary';

export function TextInput({
  invalid,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; ref?: Ref<HTMLInputElement> }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cx(
        control,
        'min-h-14 rounded-[28px]',
        invalid ? 'border-danger' : 'border-transparent',
        className,
      )}
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
        'min-h-28 resize-y rounded-[24px] py-4 leading-7',
        invalid ? 'border-danger' : 'border-transparent',
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
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cx(
          control,
          'min-h-14 cursor-pointer appearance-none rounded-[28px] ps-5 pe-11',
          invalid ? 'border-danger' : 'border-transparent',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute end-4 top-1/2 size-5 -translate-y-1/2 text-ink-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
