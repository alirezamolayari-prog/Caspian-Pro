import { useEffect } from 'react';
import { syncAll } from '../api';
import { isServerMode } from '../api/config';
import { fetchMe } from '../api/http';
import { flushOutbox } from '../api/outbox';
import { ensurePushSubscription } from '../features/onboarding/push';
import { useSession } from '../store/session';

export const SYNC_EVERY_MS = 30_000;

/**
 * Server mode: keeps tickets and notifications fresh (on start, every 30 s,
 * when the app comes back to the screen, when the internet returns, and when
 * a push arrives) and sends the offline queue.
 */
export function useServerSync() {
  const token = useSession((s) => s.token);

  useEffect(() => {
    if (!isServerMode() || !token) return;
    let alive = true;

    void syncAll();
    void ensurePushSubscription();
    fetchMe()
      .then((me) => alive && useSession.getState().setStore(me.store))
      .catch(() => undefined);

    const refresh = () => {
      if (document.visibilityState === 'visible') void syncAll();
    };
    const online = () => {
      void flushOutbox().then(() => syncAll());
    };
    const onMessage = (e: MessageEvent) => {
      if ((e.data as { type?: string } | null)?.type === 'caspian-push') void syncAll();
    };

    const id = setInterval(refresh, SYNC_EVERY_MS);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('online', online);
    navigator.serviceWorker?.addEventListener('message', onMessage);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('online', online);
      navigator.serviceWorker?.removeEventListener('message', onMessage);
    };
  }, [token]);
}
