import { useEffect } from 'react';
import { useNotifications } from '../store/notifications';
import { useTickets, STATUS_LABEL } from '../store/tickets';

/** Mock server push: advances ticket statuses like the server will. */
export function useBackgroundSimulation() {
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const { items, setStatus } = useTickets.getState();
      for (const t of items) {
        if (t.module === 'security') continue;
        const age = now - t.updatedAt;
        if (t.status === 'submitted' && age > 20_000) setStatus(t.id, 'in_review');
        else if (t.status === 'in_review' && age > 60_000 && now - t.createdAt < 3600_000) {
          setStatus(t.id, 'approved');
          useNotifications.getState().add({
            kind: t.module === 'services' ? 'permit' : 'ticket',
            title: `«${t.title}» ${STATUS_LABEL.approved}`,
            body: `کد پیگیری ${t.id}`,
            link: 'requests',
          });
        }
      }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, []);
}
