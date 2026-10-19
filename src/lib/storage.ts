import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/** localStorage that never throws (private mode, blocked storage, WebViews). */
const safe = {
  getItem: (k: string): string | null => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k: string, v: string): void => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* storage unavailable: keep state in memory only */
    }
  },
  removeItem: (k: string): void => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
} satisfies StateStorage;

export const safeStorage = createJSONStorage(() => safe);
export const rawStorage = safe;
