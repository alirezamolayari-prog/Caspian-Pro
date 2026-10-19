import { CheckCircle2, ClipboardList, Plus } from 'lucide-react';
import { displayId } from '../../lib/ids';
import { navigate } from '../../lib/router';
import type { Ticket } from '../../store/tickets';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export function SuccessPanel({
  ticket,
  message,
  onNew,
}: {
  ticket: Ticket;
  message: string;
  onNew: () => void;
}) {
  return (
    <Card className="animate-view flex flex-col items-center gap-4 py-8 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
        <CheckCircle2 className="size-9" aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-extrabold text-ink">درخواست شما ثبت شد</h2>
        <p className="text-sm text-ink-2">{message}</p>
      </div>
      <div className="w-full rounded-2xl border border-dashed border-gold/60 bg-gold-soft px-4 py-3">
        <p className="text-xs text-ink-2">کد پیگیری</p>
        <p className="tabular text-xl font-extrabold tracking-wider text-gold-ink" dir="ltr">
          {displayId(ticket.id)}
        </p>
      </div>
      <div className="grid w-full grid-cols-2 gap-2">
        <Button variant="secondary" icon={ClipboardList} onClick={() => navigate('requests')}>
          پیگیری درخواست
        </Button>
        <Button variant="primary" icon={Plus} onClick={onNew}>
          درخواست جدید
        </Button>
      </div>
    </Card>
  );
}
