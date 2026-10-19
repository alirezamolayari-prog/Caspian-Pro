import { CheckCircle2 } from 'lucide-react';
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
        <CheckCircle2 className="size-9" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-ink">درخواست شما ثبت شد</h2>
        <p className="text-[15px] text-ink-2">{message}</p>
      </div>
      <div className="w-full rounded-2xl bg-row px-4 py-3">
        <p className="text-[13px] text-ink-2">کد پیگیری</p>
        <p className="tabular text-xl font-bold text-ink" dir="ltr">
          {displayId(ticket.id)}
        </p>
      </div>
      <div className="grid w-full grid-cols-2 gap-2">
        <Button variant="outlined" onClick={() => navigate('requests')}>
          پیگیری
        </Button>
        <Button onClick={onNew}>درخواست جدید</Button>
      </div>
    </Card>
  );
}
