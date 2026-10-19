import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GateId } from '../data/catalog';
import { safeStorage } from '../lib/storage';

export const EXTENSION_MINUTES = 15;
export const MAX_REJECTIONS = 2;
export const WARN_SECONDS = 5 * 60;

export interface LoadingSession {
  gate: GateId;
  driverMobile: string;
  startedAt: number;
  endsAt: number;
  warned: boolean;
}

interface LoadingState {
  session: LoadingSession | null;
  pendingExtension: boolean;
  approvedExtensions: number;
  rejections: number;
  locked: boolean;
  start: (gate: GateId, minutes: number, driverMobile: string, now?: number) => void;
  checkout: () => void;
  beginExtension: () => void;
  resolveExtension: (approved: boolean) => void;
  markWarned: () => void;
  setLocked: (locked: boolean) => void;
  adminReactivate: () => void;
}

const seedSession = (now = Date.now()): LoadingSession => ({
  gate: 'safarkhani',
  driverMobile: '09121234567',
  startedAt: now - 12 * 60_000,
  endsAt: now + 18 * 60_000,
  warned: false,
});

export const useLoading = create<LoadingState>()(
  persist(
    (set) => ({
      session: seedSession(),
      pendingExtension: false,
      approvedExtensions: 0,
      rejections: 0,
      locked: false,
      start: (gate, minutes, driverMobile, now = Date.now()) =>
        set({
          session: {
            gate,
            driverMobile,
            startedAt: now,
            endsAt: now + minutes * 60_000,
            warned: false,
          },
          pendingExtension: false,
          approvedExtensions: 0,
        }),
      checkout: () => set({ session: null, pendingExtension: false }),
      beginExtension: () => set({ pendingExtension: true }),
      resolveExtension: (approved) =>
        set((s) => {
          if (!s.session) return { pendingExtension: false };
          if (approved) {
            return {
              pendingExtension: false,
              approvedExtensions: s.approvedExtensions + 1,
              session: {
                ...s.session,
                endsAt: Math.max(s.session.endsAt, Date.now()) + EXTENSION_MINUTES * 60_000,
                warned: false,
              },
            };
          }
          const rejections = s.rejections + 1;
          return {
            pendingExtension: false,
            rejections,
            locked: s.locked || rejections >= MAX_REJECTIONS,
          };
        }),
      markWarned: () => set((s) => (s.session ? { session: { ...s.session, warned: true } } : {})),
      setLocked: (locked) => set({ locked }),
      adminReactivate: () => set({ locked: false, rejections: 0 }),
    }),
    {
      name: 'caspian-loading',
      storage: safeStorage,
      version: 1,
      partialize: (s) => ({
        session: s.session,
        approvedExtensions: s.approvedExtensions,
        rejections: s.rejections,
        locked: s.locked,
      }),
    },
  ),
);

export function sessionProgress(s: LoadingSession, now: number) {
  const total = s.endsAt - s.startedAt;
  const remaining = Math.max(0, s.endsAt - now);
  return {
    remainingSec: Math.ceil(remaining / 1000),
    ratio: total > 0 ? Math.min(1, Math.max(0, (now - s.startedAt) / total)) : 1,
    expired: remaining <= 0,
  };
}
