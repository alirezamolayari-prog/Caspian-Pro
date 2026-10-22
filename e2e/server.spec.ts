/**
 * Runs the app built in server mode against the real API server (see
 * playwright.config.ts): login by SMS code, a request approved by management,
 * the offline queue, the management panel.
 */
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { E2E_ADMIN_TOKEN, E2E_PHONE, E2E_SMS_LOG } from '../playwright.config';

test.describe.configure({ mode: 'serial' });

let session = '';

function lastCode(): string {
  const lines = readFileSync(E2E_SMS_LOG, 'utf8').trim().split('\n');
  const line = lines.reverse().find((l) => l.includes(`login code for ${E2E_PHONE}`));
  return line!.split(': ').pop()!.trim();
}

async function asLoggedIn(page: Page) {
  await page.addInitScript(
    ([s]) => {
      localStorage.setItem('caspian-session', s!);
      localStorage.setItem('caspian-notify-asked', 'browser,standalone');
    },
    [session],
  );
}

test('logs in with the SMS code and shows the store from the server', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('caspian-notify-asked', 'browser,standalone'),
  );
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'دریافت کد ورود' })).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/login-light.png' });
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations).toEqual([]);

  await page.getByLabel(/شماره موبایل/).fill('09350000000');
  await page.getByRole('button', { name: 'دریافت کد ورود' }).click();
  await expect(page.getByText('این شماره در سامانه ثبت نشده است', { exact: false })).toBeVisible();

  await page.getByLabel(/شماره موبایل/).fill(E2E_PHONE);
  await page.getByRole('button', { name: 'دریافت کد ورود' }).click();
  const codeBox = page.getByLabel('کد ورود');
  await expect(codeBox).toBeVisible();
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(600); // let the theme fade finish
  await page.screenshot({ path: 'docs/screenshots/login-code-dark.png' });
  const axeDark = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(axeDark.violations).toEqual([]);
  await expect.poll(() => lastCode()).toMatch(/^\d{5}$/);
  await codeBox.fill(lastCode());

  await expect(page.getByRole('heading', { level: 1, name: 'مبلمان رویال' })).toBeVisible();
  await expect(page.getByText('پلاک ۲۴ – همکف')).toBeVisible();
  session = (await page.evaluate(() => localStorage.getItem('caspian-session')))!;
  expect(session).toContain('token');
});

test('a request gets a server tracking id; management approves it; the tenant is notified', async ({
  page,
  request,
}) => {
  await asLoggedIn(page);
  await page.goto('/#/m/support');
  await page.getByLabel(/متن پیام/).fill('چراغ راهروی جلوی غرفه روشن نمی‌شود.');
  await page.getByRole('button', { name: 'ارسال پیام' }).click();
  await expect(page.getByText('درخواست با موفقیت ثبت شد')).toBeVisible();

  const list = await request.get('/api/admin/tickets?open=1', {
    headers: { authorization: `Bearer ${E2E_ADMIN_TOKEN}` },
  });
  const { items } = (await list.json()) as { items: { id: string; title: string }[] };
  const ticket = items.find((t) => t.title === 'پیام به پشتیبانی')!;
  expect(ticket.id).toMatch(/^CSP-\d{6}$/);

  const r = await request.patch(`/api/admin/tickets/${ticket.id}`, {
    headers: { authorization: `Bearer ${E2E_ADMIN_TOKEN}` },
    data: { status: 'approved' },
  });
  expect(r.ok()).toBe(true);

  await page.goto('/#/notifications');
  await page.reload();
  await expect(page.getByText('«پیام به پشتیبانی» تایید شد')).toBeVisible();
  await page.goto('/#/requests');
  await expect(page.getByText('تایید شد').first()).toBeVisible();
});

test('without internet the request waits in the queue and is sent when back online', async ({
  page,
  context,
}) => {
  await asLoggedIn(page);
  await page.goto('/#/m/support');
  await expect(page.getByLabel(/متن پیام/)).toBeVisible();
  await context.setOffline(true);
  await page.getByLabel(/متن پیام/).fill('پیام بدون اینترنت برای آزمایش صف.');
  await page.getByRole('button', { name: 'ارسال پیام' }).click();
  await expect(page.getByText('اینترنت وصل نیست؛ درخواست ذخیره شد')).toBeVisible();

  await page.getByRole('link', { name: 'درخواست‌ها' }).click();
  await expect(page.getByText('در صف ارسال').first()).toBeVisible();

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.getByText('در صف ارسال')).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByText('ثبت شد').first()).toBeVisible();
});

test('the emergency button texts security', async ({ page }) => {
  await asLoggedIn(page);
  await page.goto('/#/m/security');
  await page.getByRole('button', { name: /فراخوان اضطراری حراست به غرفه/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'ادامه' }).click();
  await expect(page.getByRole('dialog').getByText('پلاک ۲۴ – همکف')).toBeVisible();
  await page.getByRole('button', { name: 'اعزام فوری حراست' }).click();
  await expect(page.getByText('تیم حراست در مسیر غرفه شماست').first()).toBeVisible();
  await expect
    .poll(() => readFileSync(E2E_SMS_LOG, 'utf8'))
    .toContain('[sms] to 09120000000: اضطراری کاسپین');
});

test('management panel: token login, tickets list, add a store', async ({ page }) => {
  await page.goto('/admin');
  await page.getByLabel('رمز مدیریت').fill('wrong');
  await page.getByRole('button', { name: 'ورود' }).click();
  await expect(page.getByText('رمز مدیریت درست نیست.')).toBeVisible();
  await page.getByLabel('رمز مدیریت').fill(E2E_ADMIN_TOKEN);
  await page.getByRole('button', { name: 'ورود' }).click();
  await expect(page.getByRole('cell', { name: /مبلمان رویال/ }).first()).toBeVisible();

  await page.getByRole('button', { name: 'غرفه‌ها' }).click();
  await page.getByLabel('شناسه (لاتین، مثلاً u24)').fill('u30');
  await page.getByLabel('پلاک').fill('۳۰');
  await page.getByLabel('طبقه').fill('اول');
  await page.getByLabel('نام غرفه').fill('خواب ناز');
  await page.getByLabel('مدیر غرفه').fill('خانم احمدی');
  await page.getByLabel(/شماره‌های مجاز/).fill('09351234567');
  await page.getByRole('button', { name: 'ذخیره' }).click();
  await expect(page.getByText('ذخیره شد.')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'خواب ناز' })).toBeVisible();
});

test('logout returns to the login screen', async ({ page }) => {
  await asLoggedIn(page);
  await page.goto('/#/profile');
  await page.getByRole('button', { name: 'خروج از حساب' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'خروج', exact: true }).click();
  await expect(page.getByRole('button', { name: 'دریافت کد ورود' })).toBeVisible();
});
