import { defineConfig, devices } from '@playwright/test';

// PW_CHROMIUM lets you reuse an existing Chromium instead of `npx playwright install`.
const executablePath = process.env.PW_CHROMIUM || undefined;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'fa-IR',
    timezoneId: 'Asia/Tehran',
    launchOptions: { executablePath },
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'phone-small',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 360, height: 740 },
        launchOptions: { executablePath },
      },
    },
    {
      name: 'iphone',
      use: { ...devices['iPhone 13'], browserName: 'chromium', launchOptions: { executablePath } },
    },
    {
      name: 'tablet',
      use: {
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
        launchOptions: { executablePath },
      },
    },
  ],
});
