import { create } from 'zustand';
import { makeKey } from '../lib/ids';
import { rawStorage } from '../lib/storage';

export type ThemePref = 'light' | 'dark' | 'system';
export type Resolved = 'light' | 'dark';

export interface Toast {
  id: string;
  tone: 'success' | 'error' | 'info';
  title: string;
  body?: string;
}

interface UiState {
  themePref: ThemePref;
  theme: Resolved;
  toasts: Toast[];
  notifyPromptOpen: boolean;
  setThemePref: (p: ThemePref) => void;
  toggleTheme: () => void;
  syncSystemTheme: () => void;
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  setNotifyPromptOpen: (open: boolean) => void;
}

const THEME_KEY = 'caspian-theme';

const systemDark = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

// A host page (or our index.html boot script) may already have picked a theme.
const hostTheme =
  typeof document !== 'undefined' ? document.documentElement.dataset.theme : undefined;
let useHostTheme = hostTheme === 'light' || hostTheme === 'dark';

const resolve = (p: ThemePref): Resolved => {
  if (p !== 'system') return p;
  if (useHostTheme) return hostTheme as Resolved;
  return systemDark() ? 'dark' : 'light';
};

function applyTheme(theme: Resolved) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#161616' : '#EDF1F5');
}

function readPref(): ThemePref {
  const v = rawStorage.getItem(THEME_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

const initialPref = readPref();

export const useUi = create<UiState>((set, get) => ({
  themePref: initialPref,
  theme: resolve(initialPref),
  toasts: [],
  notifyPromptOpen: false,
  setThemePref: (p) => {
    if (p === 'system') useHostTheme = false;
    void rawStorage.setItem(THEME_KEY, p);
    const theme = resolve(p);
    applyTheme(theme);
    set({ themePref: p, theme });
  },
  toggleTheme: () => get().setThemePref(get().theme === 'dark' ? 'light' : 'dark'),
  syncSystemTheme: () => {
    if (get().themePref !== 'system') return;
    useHostTheme = false;
    const theme = resolve('system');
    applyTheme(theme);
    set({ theme });
  },
  toast: (t) => {
    const id = makeKey();
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }));
    setTimeout(() => get().dismissToast(id), 4500);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setNotifyPromptOpen: (open) => set({ notifyPromptOpen: open }),
}));

applyTheme(resolve(initialPref));
