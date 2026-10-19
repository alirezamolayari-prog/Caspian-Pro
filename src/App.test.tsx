import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { LATENCY } from './api/mock';
import { PARKING_LATENCY, mockParkingSource, setParkingSource } from './api/parking';
import App from './App';
import { PROMPT_KEY } from './features/onboarding/notifications';
import { clearParkingCache } from './hooks/useParking';
import { seedNotices, useNotifications } from './store/notifications';
import { useSecurity } from './store/security';
import { seedTickets, useTickets } from './store/tickets';
import { useUi } from './store/ui';

beforeAll(() => {
  LATENCY.submit = 5;
  LATENCY.dispatch = 5;
  PARKING_LATENCY.ms = 5;
});

beforeEach(() => {
  useTickets.setState({ items: seedTickets() });
  useNotifications.setState({ items: seedNotices() });
  useSecurity.setState({ passes: [] });
  useUi.setState({ toasts: [], notifyPromptOpen: false });
  useUi.getState().setThemePref('light');
  // The first-open notification sheet is tested on its own below.
  localStorage.setItem(PROMPT_KEY, 'browser,standalone');
  setParkingSource(mockParkingSource);
  clearParkingCache();
});

async function goTo(hash: string) {
  await act(async () => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

describe('home hub', () => {
  it('shows the store and all 8 sections in separate groups, with no timer or search', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'مبلمان رویال' })).toBeInTheDocument();
    const groups: Record<string, string[]> = {
      'درخواست‌ها و خدمات': ['خدمات کاسپین', 'گزارش خرابی مشاعات'],
      'تردد و خودرو': ['بارگیری و تخلیه', 'پارکینگ'],
      امنیت: ['حراست و انتظامات'],
      'فروش و تبلیغات': ['رزرو فضای فروش', 'درخواست تبلیغات'],
      راهنما: ['پشتیبانی و قوانین'],
    };
    for (const [group, titles] of Object.entries(groups)) {
      const region = screen.getByRole('region', { name: group });
      const links = within(region).getAllByRole('link');
      expect(links).toHaveLength(titles.length);
      titles.forEach((t, i) => expect(links[i]).toHaveTextContent(t));
    }
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByText(/فاکتور/)).not.toBeInTheDocument();
    expect(await screen.findByText('۱۲ روز مانده')).toBeInTheDocument();
  });

  it('opens notifications from the bell and marks all read', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /اعلان‌ها، ۲ خوانده‌نشده/ }));
    expect(await screen.findByRole('heading', { name: 'اعلان‌ها' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'خواندن همه' }));
    expect(screen.getByText('همه اعلان‌ها خوانده شده')).toBeInTheDocument();
  });

  it('switches theme from the profile and remembers it', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo('#/profile');
    await user.click(screen.getByRole('radio', { name: 'تیره' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('caspian-theme')).toBe('dark');
    await user.click(screen.getByRole('radio', { name: 'روشن' }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});

describe('notification permission sheet', () => {
  it('appears once on first open; «بعداً» hides it for good', async () => {
    localStorage.removeItem(PROMPT_KEY);
    vi.stubGlobal('Notification', { permission: 'default', requestPermission: vi.fn() });
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    const sheet = await screen.findByRole(
      'dialog',
      { name: 'اجازه ارسال اعلان' },
      { timeout: 2000 },
    );
    await user.click(within(sheet).getByRole('button', { name: 'بعداً' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();
    render(<App />);
    await new Promise((r) => setTimeout(r, 1000));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('«اجازه می‌دهم» asks the browser for permission', async () => {
    localStorage.removeItem(PROMPT_KEY);
    const requestPermission = vi.fn().mockResolvedValue('granted');
    vi.stubGlobal('Notification', { permission: 'default', requestPermission });
    const user = userEvent.setup();
    render(<App />);
    const sheet = await screen.findByRole(
      'dialog',
      { name: 'اجازه ارسال اعلان' },
      { timeout: 2000 },
    );
    await user.click(within(sheet).getByRole('button', { name: 'اجازه می‌دهم' }));
    expect(requestPermission).toHaveBeenCalled();
    expect(await screen.findByText('اعلان‌ها فعال شد')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});

describe('parking', () => {
  it('shows the subscription read-only, with no payment', async () => {
    render(<App />);
    await goTo('#/m/parking');
    expect(await screen.findByText('۱۲ روز')).toBeInTheDocument();
    expect(screen.getByText('اشتراک ماهانه غرفه‌دار')).toBeInTheDocument();
    expect(screen.getByText('فعال')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /روزهای استفاده‌شده/ })).toHaveAttribute(
      'aria-valuenow',
      '60',
    );
    expect(
      within(screen.getByRole('list', { name: 'پلاک‌های ثبت‌شده' })).getAllByRole('listitem'),
    ).toHaveLength(2);
    expect(screen.getAllByLabelText('پلاک 12 ب 345 ایران 67').length).toBeGreaterThan(0);
    expect(screen.getByText('هنوز در پارکینگ')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /پرداخت|خرید|تمدید/ })).not.toBeInTheDocument();
  });

  it('warns when the subscription is ending and offers retry on error', async () => {
    const now = Date.now();
    setParkingSource({
      getSubscription: async () => ({
        ...(await mockParkingSource.getSubscription()),
        startsAt: now - 27 * 86_400_000,
        endsAt: now + 3 * 86_400_000,
      }),
    });
    const { unmount } = render(<App />);
    await goTo('#/m/parking');
    expect(await screen.findByText('رو به اتمام')).toBeInTheDocument();
    expect(screen.getByText(/به دفتر پارکینگ کاسپین مراجعه کنید/)).toBeInTheDocument();
    unmount();

    clearParkingCache();
    let fail = true;
    setParkingSource({
      getSubscription: async () => {
        if (fail) throw new Error('offline');
        return mockParkingSource.getSubscription();
      },
    });
    const user = userEvent.setup();
    render(<App />);
    await goTo('#/m/parking');
    await user.click(await screen.findByRole('button', { name: 'تلاش دوباره' }));
    fail = false;
    await user.click(await screen.findByRole('button', { name: 'تلاش دوباره' }));
    expect(await screen.findByText('۱۲ روز')).toBeInTheDocument();
  });
});

describe('forms', () => {
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

  it('logistics: simple booking with gate, duration and driver mobile', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo('#/m/logistics');
    expect(screen.getByRole('radio', { name: /درب اسدنژاد/ })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'ثبت نوبت' }));
    expect(screen.getByText('یک درب بارگیری انتخاب کنید.')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /پارکینگ اختصاصی/ }));
    await user.click(screen.getByRole('radio', { name: 'فردا' }));
    await user.click(screen.getByRole('radio', { name: '۴۵ دقیقه' }));
    await user.type(screen.getByLabelText(/شماره موبایل راننده/), '0912');
    await user.click(screen.getByRole('button', { name: 'ثبت نوبت' }));
    expect(screen.getByText(/به شکل ۰۹۱۲۳۴۵۶۷۸۹/)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/شماره موبایل راننده/), '1234567');
    await user.click(screen.getByRole('button', { name: 'ثبت نوبت' }));
    expect(await screen.findByText('درخواست شما ثبت شد')).toBeInTheDocument();
    expect(useTickets.getState().items[0]).toMatchObject({
      module: 'logistics',
      title: 'نوبت بارگیری – پارکینگ اختصاصی',
      details: ['فردا', '۴۵ دقیقه', 'راننده ۰۹۱۲۱۲۳۴۵۶۷'],
    });
  });

  it('booth booking: needs zone, date and details', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo('#/m/booth');
    await user.click(screen.getByRole('button', { name: 'ثبت درخواست رزرو' }));
    expect(screen.getByText('یک فضا انتخاب کنید.')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /آتریوم مرکزی/ }));
    const dates = within(screen.getByRole('radiogroup', { name: 'تاریخ شروع' })).getAllByRole(
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
    await user.type(screen.getByLabelText(/^لینک/), '@royal.furniture');
    await user.click(screen.getByRole('button', { name: 'ثبت درخواست تبلیغات' }));
    expect(await screen.findByText('درخواست شما ثبت شد')).toBeInTheDocument();
  });

  it('security: issues a QR pass and needs two confirmations for SOS', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo('#/m/security');
    await user.type(screen.getByLabelText(/نام و نام خانوادگی/), 'علی محمدی');
    await user.clear(screen.getByLabelText(/ساعت ورود/));
    await user.type(screen.getByLabelText(/ساعت ورود/), '10:00');
    await user.clear(screen.getByLabelText(/ساعت خروج/));
    await user.type(screen.getByLabelText(/ساعت خروج/), '08:00');
    await user.click(screen.getByRole('button', { name: 'صدور کارت' }));
    expect(screen.getByText('ساعت خروج باید بعد از ساعت ورود باشد.')).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/ساعت خروج/));
    await user.type(screen.getByLabelText(/ساعت خروج/), '18:00');
    await user.click(screen.getByRole('button', { name: 'صدور کارت' }));
    expect(await screen.findByRole('article', { name: 'کارت تردد علی محمدی' })).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: /کد QR کارت تردد علی محمدی/ })).toHaveAttribute(
      'src',
      expect.stringMatching(/^data:image\/svg\+xml/),
    );

    await user.click(screen.getByRole('button', { name: /فراخوان اضطراری حراست به غرفه/ }));
    const step1 = screen.getByRole('dialog', { name: /مرحله ۱ از ۲/ });
    await user.click(within(step1).getByRole('radio', { name: 'دود یا آتش' }));
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

  it('support: rules accordion and phone numbers', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo('#/m/support');
    const rule = screen.getByRole('button', { name: 'پارکینگ' });
    expect(rule).toHaveAttribute('aria-expanded', 'false');
    await user.click(rule);
    expect(rule).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/تمدید اشتراک در دفتر پارکینگ/)).toBeInTheDocument();
  });

  it('requests tab lists tickets and expands details', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goTo('#/requests');
    await user.click(screen.getByRole('button', { name: /خروج کالا/ }));
    expect(screen.getByText('CSP-۴۸۲۹۱۳')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole('listitem').length).toBeGreaterThan(1));
  });
});
