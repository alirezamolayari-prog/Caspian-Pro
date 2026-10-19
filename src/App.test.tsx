import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { LATENCY } from './api/mock';
import App from './App';
import { useLoading } from './store/loading';
import { seedNotices, useNotifications } from './store/notifications';
import { useSecurity } from './store/security';
import { seedTickets, useTickets } from './store/tickets';
import { useUi } from './store/ui';

beforeAll(() => {
  LATENCY.submit = 5;
  LATENCY.extension = 5;
  LATENCY.dispatch = 5;
});

beforeEach(() => {
  useTickets.setState({ items: seedTickets() });
  useNotifications.setState({ items: seedNotices() });
  useSecurity.setState({ passes: [] });
  useUi.setState({ toasts: [], permissionsOpen: false });
  useUi.getState().setThemePref('light');
  const now = Date.now();
  useLoading.setState({
    session: {
      gate: 'safarkhani',
      driverMobile: '09121234567',
      startedAt: now - 60_000,
      endsAt: now + 20 * 60_000,
      warned: false,
    },
    pendingExtension: false,
    approvedExtensions: 0,
    rejections: 0,
    locked: false,
  });
});

async function goTo(hash: string) {
  await act(async () => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

describe('shell', () => {
  it('renders the home dashboard in RTL with all 7 services', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /مبلمان رویال – پلاک ۲۴/ })).toBeInTheDocument();
    const grid = screen.getByRole('region', { name: 'دسترسی سریع' }) ?? document.body;
    expect(within(grid).getAllByRole('link')).toHaveLength(7);
    expect(screen.getByRole('timer')).toBeInTheDocument();
    expect(screen.queryByText(/فاکتور/)).not.toBeInTheDocument();
  });

  it('toggles and persists the theme', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('light');
    await user.click(screen.getByRole('button', { name: 'حالت تیره' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('caspian-theme')).toBe('dark');
    await user.click(screen.getByRole('button', { name: 'حالت روشن' }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('filters services from the search bar', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'آسانسور');
    const results = screen.getByRole('region', { name: 'نتایج جستجو' });
    const titles = within(results)
      .getAllByRole('link')
      .map((a) => a.textContent);
    expect(titles.some((t) => t?.includes('گزارش خرابی مشاعات'))).toBe(true);
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'zzzz');
    expect(screen.getByText('خدمتی پیدا نشد')).toBeInTheDocument();
  });

  it('opens notifications from the bell and marks all read', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /اعلان‌ها، ۲ خوانده‌نشده/ }));
    expect(await screen.findByRole('heading', { name: 'مرکز اعلان‌ها' })).toBeInTheDocument();
    expect(screen.getByText('مجوز خروج کالا تایید شد')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /علامت‌گذاری همه/ }));
    expect(screen.getByRole('button', { name: 'اعلان‌ها' })).toBeInTheDocument();
  });
});

describe('loading timer', () => {
  it('approves the first extension, rejects the next ones and locks after two', async () => {
    const user = userEvent.setup();
    render(<App />);
    const extend = () => screen.getByRole('button', { name: /درخواست تمدید/ });
    await user.click(extend());
    await waitFor(() => expect(useLoading.getState().approvedExtensions).toBe(1));
    await user.click(extend());
    await waitFor(() => expect(useLoading.getState().rejections).toBe(1));
    expect((await screen.findAllByText(/اخطار ۱ از ۲/)).length).toBeGreaterThan(0);
    await user.click(extend());
    await waitFor(() => expect(useLoading.getState().locked).toBe(true));
    expect(extend()).toBeDisabled();
  });

  it('checks out after confirmation', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'تسویه و خروج' }));
    const dialog = screen.getByRole('dialog', { name: 'تسویه و خروج از بارانداز' });
    await user.click(within(dialog).getByRole('button', { name: 'تایید خروج' }));
    expect(useLoading.getState().session).toBeNull();
    expect(screen.getByText('نوبت بارگیری فعالی ندارید')).toBeInTheDocument();
  });
});

describe('modules', () => {
  it('general services: requires a chip, then submits with a tracking id', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo('#/m/services');
    await user.click(screen.getByRole('button', { name: 'ثبت درخواست' }));
    expect(screen.getByRole('alert')).toHaveTextContent('حداقل یک خدمت');
    await user.click(screen.getByRole('button', { name: 'ورود کالا' }));
    await user.click(screen.getByRole('tab', { name: /دکوراسیون/ }));
    await user.click(screen.getByRole('button', { name: 'نظافت ویژه' }));
    expect(screen.getByText('۲ خدمت انتخاب شده')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'ثبت درخواست' }));
    expect(await screen.findByText('درخواست شما ثبت شد')).toBeInTheDocument();
    expect(useTickets.getState().items[0]).toMatchObject({
      module: 'services',
      title: 'ورود کالا و ۱ مورد دیگر',
    });
  });

  it('logistics: validates the driver mobile, shows capacity, and starts a timer', async () => {
    useLoading.setState({ session: null });
    const user = userEvent.setup();
    render(<App />);
    await goTo('#/m/logistics');
    expect(screen.getByRole('radio', { name: /درب اسدنژاد/ })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /ثبت نوبت/ }));
    expect(screen.getByText('یک درب بارگیری انتخاب کنید.')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /پارکینگ اختصاصی/ }));
    await user.click(screen.getByRole('radio', { name: '۴۵ دقیقه' }));
    await user.type(screen.getByLabelText(/شماره موبایل راننده/), '0912');
    await user.click(screen.getByRole('button', { name: /ثبت نوبت/ }));
    expect(screen.getByText(/به شکل ۰۹۱۲۳۴۵۶۷۸۹/)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/شماره موبایل راننده/), '1234567');
    await user.click(screen.getByRole('button', { name: /ثبت نوبت/ }));
    await waitFor(() => expect(useLoading.getState().session?.gate).toBe('parking'));
    const s = useLoading.getState().session!;
    expect(s.endsAt - s.startedAt).toBe(45 * 60_000);
  });

  it('logistics: demo switch previews the locked state', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo('#/m/logistics');
    await user.click(screen.getByRole('switch', { name: /پیش‌نمایش حالت قفل/ }));
    expect(screen.getByRole('heading', { name: 'دسترسی بارگیری قفل شد' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /فعال‌سازی مجدد/ }));
    expect(useLoading.getState().locked).toBe(false);
  });

  it('booth booking: needs zone, date and details', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo('#/m/booth');
    await user.click(screen.getByRole('button', { name: 'ثبت درخواست رزرو' }));
    expect(screen.getByText('یک فضا انتخاب کنید.')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /آتریوم مرکزی/ }));
    const dates = within(screen.getByRole('radiogroup', { name: /تاریخ شروع/ })).getAllByRole(
      'radio',
    );
    expect(dates).toHaveLength(14);
    await user.click(dates[2]!);
    await user.click(screen.getByRole('button', { name: 'افزایش روز' }));
    expect(screen.getByText('۴ روز')).toBeInTheDocument();
    await user.type(screen.getByLabelText(/محصولات و کلکسیون/), 'کلکسیون سرویس خواب نوزاد');
    await user.click(screen.getByRole('button', { name: 'ثبت درخواست رزرو' }));
    expect(await screen.findByText('درخواست شما ثبت شد')).toBeInTheDocument();
  });

  it('advertising: digital channel requires a valid link', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo('#/m/advertising');
    await user.click(screen.getByRole('button', { name: /تبلیغات اینترنتی و دیجیتال/ }));
    await user.type(screen.getByLabelText(/عنوان کمپین/), 'جشنواره پاییزه');
    await user.type(screen.getByLabelText(/^توضیحات/), 'تخفیف ویژه سرویس‌های خواب');
    await user.click(screen.getByRole('button', { name: 'ثبت درخواست تبلیغات' }));
    expect(screen.getByText(/لینک سایت یا اینستاگرام لازم است/)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/لینک مقصد/), 'not a link');
    expect(screen.getByText(/آیدی اینستاگرام/)).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/لینک مقصد/));
    await user.type(screen.getByLabelText(/لینک مقصد/), '@royal.furniture');
    await user.click(screen.getByRole('button', { name: 'ثبت درخواست تبلیغات' }));
    expect(await screen.findByText('درخواست شما ثبت شد')).toBeInTheDocument();
  });

  it('security: issues a QR pass and needs two confirmations for SOS', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo('#/m/security');
    await user.type(screen.getByLabelText(/نام و نام خانوادگی/), 'علی محمدی');
    await user.clear(screen.getByLabelText(/ساعت خروج/));
    await user.type(screen.getByLabelText(/ساعت خروج/), '08:00');
    await user.click(screen.getByRole('button', { name: 'صدور کارت QR' }));
    expect(screen.getByText('ساعت خروج باید بعد از ساعت ورود باشد.')).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/ساعت خروج/));
    await user.type(screen.getByLabelText(/ساعت خروج/), '23:59');
    await user.click(screen.getByRole('button', { name: 'صدور کارت QR' }));
    expect(await screen.findByRole('article', { name: 'کارت تردد علی محمدی' })).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: /کد QR کارت تردد علی محمدی/ })).toHaveAttribute(
      'src',
      expect.stringMatching(/^data:image\/svg\+xml/),
    );

    await user.click(screen.getByRole('button', { name: /فراخوان اضطراری حراست به غرفه/ }));
    await user.click(
      within(screen.getByRole('dialog', { name: /مرحله ۱ از ۲/ })).getByRole('radio', {
        name: 'دود یا آتش',
      }),
    );
    await user.click(screen.getByRole('button', { name: 'ادامه' }));
    expect(useTickets.getState().items.some((t) => t.title === 'فراخوان اضطراری حراست')).toBe(
      false,
    );
    await user.click(screen.getByRole('button', { name: 'اعزام فوری حراست' }));
    expect(await screen.findByText('تیم حراست در مسیر غرفه شماست')).toBeInTheDocument();
    expect(useTickets.getState().items.some((t) => t.title === 'فراخوان اضطراری حراست')).toBe(true);
  });

  it('maintenance: validates and previews uploaded photos', async () => {
    const user = userEvent.setup();
    URL.createObjectURL = () => 'blob:preview';
    URL.revokeObjectURL = () => undefined;
    render(<App />);
    await goTo('#/m/maintenance');
    await user.click(screen.getByRole('button', { name: 'ثبت گزارش خرابی' }));
    expect(screen.getByText('نوع خرابی را انتخاب کنید.')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'پله‌برقی' }));
    await user.selectOptions(screen.getByLabelText(/بخش پاساژ/), 'بال غربی');
    await user.selectOptions(screen.getByLabelText(/^طبقه/), 'همکف');
    await user.type(screen.getByLabelText(/شرح خرابی/), 'پله‌برقی شماره ۳ متوقف شده است');
    const file = new File(['x'], 'escalator.jpg', { type: 'image/jpeg' });
    await user.upload(document.getElementById('photo-input') as HTMLInputElement, file);
    expect(screen.getByRole('img', { name: 'پیش‌نمایش escalator.jpg' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'ثبت گزارش خرابی' }));
    expect(await screen.findByText('درخواست شما ثبت شد')).toBeInTheDocument();
    expect(useTickets.getState().items[0]!.details).toContain('۱ عکس پیوست');
  });

  it('support: rules accordion and contact links', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo('#/m/support');
    const rule = screen.getByRole('button', { name: 'بارگیری و تخلیه' });
    expect(rule).toHaveAttribute('aria-expanded', 'false');
    await user.click(rule);
    expect(rule).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getAllByRole('link').some((a) => a.getAttribute('href')?.startsWith('tel:')),
    ).toBe(true);
  });

  it('permissions helper opens from the profile with iOS two-step guidance', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo('#/profile');
    await user.click(screen.getByRole('button', { name: /بازیابی دسترسی مکان و اعلان/ }));
    const dialog = screen.getByRole('dialog', { name: 'فعال‌سازی دسترسی‌ها' });
    await user.click(within(dialog).getByRole('radio', { name: /آیفون/ }));
    expect(within(dialog).getByText(/دسترسی «همیشه» دو مرحله دارد/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'رفتن به تنظیمات گوشی' }));
    expect(within(dialog).getByRole('button', { name: 'بررسی مجدد دسترسی' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
