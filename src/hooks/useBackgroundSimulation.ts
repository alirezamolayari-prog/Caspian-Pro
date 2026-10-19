import { useEffect } from 'react';
import { useLoading, sessionProgress, WARN_SECONDS } from '../store/loading';
import { useNotifications } from '../store/notifications';
import { useTickets, STATUS_LABEL } from '../store/tickets';
import { gateTitle } from '../data/catalog';
import { useUi } from '../store/ui';

/** Mock server push: advances ticket statuses and warns before loading time runs out. */
export function useBackgroundSimulation() {
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const { session, markWarned } = useLoading.getState();
      if (session && !session.warned) {
        const { remainingSec, expired } = sessionProgress(session, now);
        if (!expired && remainingSec <= WARN_SECONDS) {
          markWarned();
          useNotifications.getState().add({
            kind: 'loading',
            title: 'هشدار: زمان بارگیری رو به اتمام است',
            body: `کمتر از ۵ دقیقه تا پایان نوبت شما در ${gateTitle(session.gate)} باقی مانده است.`,
          });
          useUi.getState().toast({ tone: 'info', title: 'کمتر از ۵ دقیقه تا پایان بارگیری' });
        }
      }
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
