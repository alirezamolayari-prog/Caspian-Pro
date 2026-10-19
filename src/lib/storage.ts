import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/** localStorage that never throws (private mode, blocked storage, WebViews). */
const safe: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* storage unavailable: keep state in memory only */
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

export const safeStorage = createJSONStorage(() => safe);
export const rawStorage = safe;
