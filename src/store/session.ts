import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isServerMode } from '../api/config';
import { STORE } from '../data/catalog';
import { safeStorage } from '../lib/storage';

export interface StoreInfo {
  id?: string;
  name: string;
  unit: string;
  floor: string;
  manager: string;
  category: string;
}

interface SessionState {
  token: string | null;
  phone: string | null;
  store: StoreInfo | null;
  setSession: (s: { token: string; phone: string; store: StoreInfo }) => void;
  setStore: (store: StoreInfo) => void;
  clear: () => void;
}

/** Login session (server mode). Kept on the device until logout or the server rejects it. */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      phone: null,
      store: null,
      setSession: (s) => set(s),
      setStore: (store) => set({ store }),
      clear: () => set({ token: null, phone: null, store: null }),
    }),
    { name: 'caspian-session', storage: safeStorage, version: 1 },
  ),
);

const DEMO: StoreInfo = { ...STORE };

/** The tenant's store: from login in server mode, the sample store in demo mode. */
export function getStoreInfo(): StoreInfo {
  return (isServerMode() && useSession.getState().store) || DEMO;
}

export function useStoreInfo(): StoreInfo {
  const store = useSession((s) => s.store);
  return (isServerMode() && store) || DEMO;
}
