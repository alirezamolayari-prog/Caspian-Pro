import { rawStorage } from '../../lib/storage';

export const PROMPT_KEY = 'caspian-notify-asked';

export type PushSupport = 'supported' | 'needs-install' | 'unsupported';

export function isStandalone(): boolean {
  return (
    (typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches) ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iOS only allows web push for apps added to the Home Screen. */
export function pushSupport(): PushSupport {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (ios && !isStandalone()) return 'needs-install';
  return typeof Notification === 'undefined' ? 'unsupported' : 'supported';
}

export function permissionState(): NotificationPermission | 'unsupported' {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

/**
 * Ask once per mode: the first open in the browser, and again the first time
 * the installed app opens (that is the closest a web app gets to "on install").
 */
export function shouldPrompt(): boolean {
  const state = permissionState();
  if (state === 'granted' || state === 'denied') return false;
  const asked = rawStorage.getItem(PROMPT_KEY) ?? '';
  const mode = isStandalone() ? 'standalone' : 'browser';
  return !asked.split(',').includes(mode);
}

export function markPrompted() {
  const mode = isStandalone() ? 'standalone' : 'browser';
  const asked = (rawStorage.getItem(PROMPT_KEY) ?? '').split(',').filter(Boolean);
  if (!asked.includes(mode)) asked.push(mode);
  void rawStorage.setItem(PROMPT_KEY, asked.join(','));
}
