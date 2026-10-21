/**
 * Web push registration (server mode). After the user allows notifications,
 * the browser gives a push address which is saved on the server; the server
 * then sends status changes and announcements even when the app is closed.
 */
import { isServerMode } from '../../api/config';
import { fetchConfig, logoutRemote, savePushSubscription } from '../../api/http';
import { useSession } from '../../store/session';

function keyToBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((r) => setTimeout(() => r(null), 5000)),
  ]);
}

/** Subscribes this device and tells the server. Safe to call often; returns true when registered. */
export async function ensurePushSubscription(): Promise<boolean> {
  if (!isServerMode() || !useSession.getState().token) return false;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
  try {
    const reg = await registration();
    if (!reg) return false;
    const { pushKey } = await fetchConfig();
    if (!pushKey) return false;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyToBytes(pushKey),
      });
    }
    await savePushSubscription(sub.toJSON());
    return true;
  } catch {
    return false;
  }
}

/** Logout: forget this device on the server, then clear the session. */
export async function logout() {
  let endpoint: string | undefined;
  try {
    const reg = await registration();
    const sub = await reg?.pushManager.getSubscription();
    endpoint = sub?.endpoint;
    await sub?.unsubscribe();
  } catch {
    /* ignore */
  }
  try {
    await logoutRemote(endpoint);
  } catch {
    /* offline: the token is dropped locally anyway */
  }
  useSession.getState().clear();
}
