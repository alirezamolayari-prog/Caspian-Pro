// Service workers do not run inside an artifact.
export function registerSW() {
  return () => Promise.resolve();
}
