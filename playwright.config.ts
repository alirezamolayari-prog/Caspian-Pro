import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// PW_CHROMIUM lets you reuse an existing Chromium instead of `npx playwright install`.
const executablePath = process.env.PW_CHROMIUM || undefined;

/** Real server for e2e/server.spec.ts: fresh database, one store, SMS codes written to a file. */
export const E2E_API_PORT = 8788;
export const E2E_ADMIN_TOKEN = 'e2e-admin-token';
export const E2E_DATA = join(tmpdir(), 'caspian-e2e');
export const E2E_SMS_LOG = join(E2E_DATA, 'sms.log');
export const E2E_PHONE = '09121112233';

const serverEnv = {
  PORT: String(E2E_API_PORT),
  DATA_DIR: E2E_DATA,
  STATIC_DIR: '../dist-server',
  ADMIN_TOKEN: E2E_ADMIN_TOKEN,
  SMS_LOG_FILE: E2E_SMS_LOG,
  SECURITY_PHONES: '09120000000',
};

const serverSpec = /server\.spec\.ts/;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: process.env.CI ? [['list'], ['github']] : [['list']],
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'fa-IR',
    timezoneId: 'Asia/Tehran',
    launchOptions: { executablePath },
  },
  webServer: [
    {
      command: 'npm run preview -- --port 4173 --strictPort',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
    },
    {
      // Builds the app in server mode, then starts the API with one registered store.
      command: [
        'npx vite build --mode server --outDir dist-server --logLevel warn',
        `node -e "require('fs').rmSync(process.argv[1],{recursive:true,force:true})" "${E2E_DATA}"`,
        `cd server && node --disable-warning=ExperimentalWarning src/cli.ts store u24 24 همکف "مبلمان رویال" "آقای رضایی" ${E2E_PHONE} "مبلمان لوکس"`,
        'node --disable-warning=ExperimentalWarning src/index.ts',
      ].join(' && '),
      url: `http://localhost:${E2E_API_PORT}/api/health`,
      env: serverEnv,
      timeout: 180_000,
      reuseExistingServer: false,
    },
  ],
  projects: [
    {
      name: 'phone-small',
      testIgnore: serverSpec,
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 360, height: 740 },
        launchOptions: { executablePath },
      },
    },
    {
      name: 'iphone',
      testIgnore: serverSpec,
      use: { ...devices['iPhone 13'], browserName: 'chromium', launchOptions: { executablePath } },
    },
    {
      name: 'tablet',
      testIgnore: serverSpec,
      use: {
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
        launchOptions: { executablePath },
      },
    },
    {
      name: 'server',
      testMatch: serverSpec,
      fullyParallel: false,
      use: {
        ...devices['Pixel 5'],
        baseURL: `http://localhost:${E2E_API_PORT}`,
        launchOptions: { executablePath },
      },
    },
  ],
});
