import { useSyncExternalStore } from 'react';
import { SERVICE_TILES, type ModuleId } from '../data/catalog';

/** Hash routes work in iOS standalone mode, TWAs and from the home screen. */
export type Tab = 'home' | 'requests' | 'notifications' | 'profile';

export interface Route {
  tab: Tab;
  module?: ModuleId;
}

const MODULES = new Set<string>(SERVICE_TILES.map((t) => t.id));

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'm' && parts[1] && MODULES.has(parts[1])) {
    return { tab: 'home', module: parts[1] as ModuleId };
  }
  if (parts[0] === 'requests' || parts[0] === 'notifications' || parts[0] === 'profile') {
    return { tab: parts[0] };
  }
  return { tab: 'home' };
}

export const hrefFor = (target: Tab | ModuleId): string => {
  if (target === 'home') return '#/';
  if (target === 'requests' || target === 'notifications' || target === 'profile') {
    return `#/${target}`;
  }
  return `#/m/${target}`;
};

let depth = 0;

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

const getHash = () => window.location.hash;

export function useRoute() {
  const hash = useSyncExternalStore(subscribe, getHash, () => '');
  return parseHash(hash);
}

export function navigate(target: Tab | ModuleId) {
  const href = hrefFor(target);
  if (window.location.hash === href || (href === '#/' && !window.location.hash)) return;
  depth += 1;
  window.location.hash = href;
}

/** In-app back: use browser history when we came from inside the app (keeps Android back in sync). */
export function goBack() {
  if (depth > 0) {
    depth -= 1;
    window.history.back();
  } else {
    window.location.hash = '#/';
  }
}
