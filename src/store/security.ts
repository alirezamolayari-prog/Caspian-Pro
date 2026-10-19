import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { makeTicketId } from '../lib/ids';
import { parseTime } from '../lib/validators';
import { safeStorage } from '../lib/storage';

export interface StaffPass {
  id: string;
  name: string;
  role: string;
  /** Local date (yyyy-mm-dd). */
  date: string;
  from: string;
  to: string;
  createdAt: number;
}

export type PassStatus = 'valid' | 'upcoming' | 'expired';

export const PASS_STATUS_LABEL: Record<PassStatus, string> = {
  valid: 'معتبر',
  upcoming: 'در انتظار شروع',
  expired: 'منقضی',
};

export function localDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function passWindow(p: Pick<StaffPass, 'date' | 'from' | 'to'>) {
  const [y, m, d] = p.date.split('-').map(Number) as [number, number, number];
  const base = new Date(y, m - 1, d).getTime();
  return {
    start: base + (parseTime(p.from) ?? 0) * 60_000,
    end: base + (parseTime(p.to) ?? 0) * 60_000,
  };
}

export function passStatus(
  p: Pick<StaffPass, 'date' | 'from' | 'to'>,
  now = Date.now(),
): PassStatus {
  const { start, end } = passWindow(p);
  if (now < start) return 'upcoming';
  if (now > end) return 'expired';
  return 'valid';
}

interface SecurityState {
  passes: StaffPass[];
  addPass: (p: Omit<StaffPass, 'id' | 'createdAt'>) => StaffPass;
  removePass: (id: string) => void;
}

export const useSecurity = create<SecurityState>()(
  persist(
    (set) => ({
      passes: [],
      addPass: (p) => {
        const pass: StaffPass = {
          ...p,
          id: makeTicketId().replace('CSP', 'PASS'),
          createdAt: Date.now(),
        };
        set((s) => ({ passes: [pass, ...s.passes].slice(0, 20) }));
        return pass;
      },
      removePass: (id) => set((s) => ({ passes: s.passes.filter((p) => p.id !== id) })),
    }),
    { name: 'caspian-security', storage: safeStorage, version: 1 },
  ),
);
