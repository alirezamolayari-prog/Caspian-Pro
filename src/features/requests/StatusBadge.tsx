import { CheckCircle2, CircleDot, CloudOff, Hourglass, XCircle } from 'lucide-react';
import { Badge, type Tone } from '../../components/ui/Badge';
import { STATUS_LABEL, type TicketStatus } from '../../store/tickets';

const MAP: Record<TicketStatus, { tone: Tone; icon: typeof CheckCircle2 }> = {
  queued: { tone: 'neutral', icon: CloudOff },
  submitted: { tone: 'info', icon: CircleDot },
  in_review: { tone: 'warning', icon: Hourglass },
  approved: { tone: 'success', icon: CheckCircle2 },
  done: { tone: 'success', icon: CheckCircle2 },
  rejected: { tone: 'danger', icon: XCircle },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const m = MAP[status];
  return (
    <Badge tone={m.tone} icon={m.icon}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
