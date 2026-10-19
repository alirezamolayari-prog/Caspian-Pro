import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Bottom sheet: focus moves in on open and back on close, Escape and the
 * scrim close it, Tab stays inside.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  dismissible?: boolean;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = panel.current;
    const focusables = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    (focusables()[0] ?? node)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) {
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'Tab') {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0]!;
        const last = items[items.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose, dismissible]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div
        className="animate-fade absolute inset-0 bg-scrim"
        onClick={dismissible ? onClose : undefined}
        aria-hidden
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="animate-sheet safe-bottom relative flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-[28px] bg-card text-ink"
      >
        <div className="mx-auto mt-3 h-1 w-8 rounded-full bg-outline/60" aria-hidden />
        <div className="flex items-center justify-between gap-2 px-6 pb-2 pt-3">
          <h2 id={titleId} className="text-xl font-bold">
            {title}
          </h2>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="-me-2 inline-flex size-12 items-center justify-center rounded-full text-ink-2 hover:bg-field cursor-pointer"
            >
              <X className="size-5" aria-hidden />
            </button>
          )}
        </div>
        <div className="overflow-y-auto px-6 pb-4">{children}</div>
        {footer && <div className="px-6 pb-5 pt-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
