/// <reference types="vite/client" />

/** App version from package.json, injected at build time. */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  /** Server address. Unset = demo mode with sample data. `/` = same domain. */
  readonly VITE_API_URL?: string;
}
