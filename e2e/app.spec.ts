import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const ROUTES = [
  ['home', '/#/'],
  ['services', '/#/m/services'],
  ['logistics', '/#/m/logistics'],
  ['security', '/#/m/security'],
  ['booth', '/#/m/booth'],
  ['advertising', '/#/m/advertising'],
  ['maintenance', '/#/m/maintenance'],
  ['support', '/#/m/support'],
  ['requests', '/#/requests'],
  ['notifications', '/#/notifications'],
  ['profile', '/#/profile'],
] as const;

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((t) => localStorage.setItem('caspian-theme', t), theme);
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} theme`, () => {
    test.beforeEach(async ({ page }) => setTheme(page, theme));

    for (const [name, path] of ROUTES) {
      test(`${name}: RTL, no horizontal scroll, no axe violations, no console errors`, async ({
        page,
      }, info) => {
        const errors = trackErrors(page);
        await page.goto(path);
        await expect(page.locator('main h1, main h2').first()).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(350); // let entrance animations settle

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(0);

        const axe = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        const summary = axe.violations.map(
          (v) =>
            `${v.id}: ${v.nodes
              .map((n) => n.target.join(' '))
              .slice(0, 3)
              .join(' | ')}`,
        );
        expect(summary).toEqual([]);

        if (info.project.name === 'iphone') {
          await page.screenshot({ path: `docs/screenshots/${name}-${theme}.png` });
        }
        expect(errors).toEqual([]);
      });
    }
  });
}

test('every touch target in the bottom nav and header is at least 44px', async ({ page }) => {
  await page.goto('/#/');
  const boxes = await page.locator('header button, nav a').evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return { label: e.getAttribute('aria-label') ?? e.textContent, w: r.width, h: r.height };
    }),
  );
  for (const b of boxes) {
    expect(Math.min(b.w, b.h), String(b.label)).toBeGreaterThanOrEqual(44);
  }
});

test('theme toggle switches instantly and survives reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/#/');
  await page.getByRole('button', { name: 'حالت تیره' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
    .toBe('rgb(9, 13, 22)');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('Vazirmatn is bundled and used', async ({ page }) => {
  await page.goto('/#/');
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() =>
    [...document.fonts].some((f) => f.family.includes('Vazirmatn') && f.status === 'loaded'),
  );
  expect(loaded).toBe(true);
});

test('service worker installs and the app reloads offline', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'iphone', 'one project is enough');
  await page.goto('/#/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /مبلمان رویال/ })).toBeVisible();
  await context.setOffline(false);
});

test('manifest is valid for install', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest');
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m).toMatchObject({
    dir: 'rtl',
    lang: 'fa',
    display: 'standalone',
    short_name: 'کاسپین پرو',
  });
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
});
