/**
 * Which backend the app talks to.
 * - `VITE_API_URL` unset → demo mode: sample data on the device (the Claude preview, tests).
 * - `VITE_API_URL=/` → the real server on the same domain (`npm run build:server`).
 * - `VITE_API_URL=https://api.example.ir` → the real server on another domain.
 */
const fromEnv = import.meta.env.VITE_API_URL as string | undefined;

let base: string | null = fromEnv ? fromEnv.replace(/\/+$/, '') : null;

export const apiBase = () => base;
export const isServerMode = () => base !== null;

/** For tests. */
export function setApiBase(next: string | null) {
  base = next === null ? null : next.replace(/\/+$/, '');
}
