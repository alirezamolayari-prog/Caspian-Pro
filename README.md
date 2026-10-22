# کاسپین پرو (Caspian Pro)

**سامانه خدمات غرفه‌داران کاسپین** – اپلیکیشن وب پیش‌رونده (PWA) ساده برای حدود ۸۰ غرفه‌دار پاساژ کاسپین. فارسی، راست‌به‌چپ، هم‌شکل با اپ Caspian Owner؛ پوسته روشن (اسلیت) و تیره (خاکستری).

> **دو حالت:** «نمایشی» (پیش‌فرض، داده نمونه روی خود گوشی، بدون ورود) و «سرور» (ورود با کد پیامکی، درخواست‌ها و اعلان‌های واقعی). سرور در پوشه `server/` است.
> راه‌اندازی روی سرور: [`docs/DEPLOY.md`](docs/DEPLOY.md) – راهنمای غرفه‌داران: [`docs/GUIDE-fa.md`](docs/GUIDE-fa.md) – تغییرات: [`CHANGELOG.md`](CHANGELOG.md)

## بخش‌ها

صفحه خانه بخش‌ها را در گروه‌های جدا نشان می‌دهد:

| گروه               | بخش                | کار                                                                                              |
| ------------------ | ------------------ | ------------------------------------------------------------------------------------------------ |
| درخواست‌ها و خدمات | خدمات کاسپین       | انبار و کالا، دکوراسیون، تاسیسات و برق؛ انتخاب چندگانه و کد پیگیری                               |
|                    | گزارش خرابی مشاعات | آسانسور، پله‌برقی، روشنایی، تهویه؛ بخش و طبقه؛ عکس                                               |
| تردد و خودرو       | بارگیری و تخلیه    | رزرو نوبت: درب (با ظرفیت)، روز، مدت، موبایل راننده                                               |
|                    | پارکینگ            | فقط مشاهده: روزهای باقی‌مانده اشتراک، تاریخ شروع و پایان، پلاک‌ها، ورود و خروج اخیر. بدون پرداخت |
| امنیت              | حراست و انتظامات   | فراخوان اضطراری با تایید دومرحله‌ای، کارت تردد موقت با QR                                        |
| فروش و تبلیغات     | رزرو فضای فروش     | انتخاب فضا، تاریخ شمسی، مدت، شرح کلکسیون                                                         |
|                    | درخواست تبلیغات    | ۴ کانال، عنوان، مدت، توضیحات، لینک                                                               |
| راهنما             | پشتیبانی و قوانین  | تماس، قوانین پاساژ، پیام به پشتیبانی                                                             |

همچنین: درخواست‌های من، اعلان‌ها، پروفایل (پوسته روشن/تیره/سیستم، وضعیت اعلان‌ها). در اولین باز شدن برنامه (و اولین باز شدن پس از نصب) پنجره «اجازه ارسال اعلان» نمایش داده می‌شود.

### سرور (`server/`)

Node 22 + Hono + SQLite داخلی Node (بدون نصب پایگاه داده جدا). کارها:

- ورود با شماره موبایل و کد پیامکی (کاوه‌نگار)، فقط برای شماره‌های ثبت‌شده هر غرفه
- درخواست‌ها با کد پیگیری واقعی، عکس گزارش خرابی، تغییر وضعیت توسط مدیریت
- اعلان‌ها و Web Push (حتی وقتی برنامه بسته است)
- پیامک اضطراری به حراست
- پارکینگ از نرم‌افزار پارکینگ، و یادآوری ۷ روز مانده به پایان اشتراک
- پنل مدیریت در `/admin`: درخواست‌ها، غرفه‌ها، اطلاعیه برای همه
- فایل `assetlinks.json` برای نسخه اندروید

برنامه در حالت سرور اگر اینترنت قطع باشد درخواست را نگه می‌دارد و بعد می‌فرستد.

## اجرا

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # حالت نمایشی → dist/
npm run build:server # حالت سرور → dist/ (برنامه با سرور همان دامنه کار می‌کند)
npm run preview

cd server && npm install && npm run dev   # سرور روی http://localhost:8787 (برنامه + /api + /admin)
npm run admin -- store u24 24 همکف "مبلمان رویال" "آقای رضایی" 09121112233   # ثبت یک غرفه
```

## بررسی کیفیت

```bash
npm run check        # فرمت، lint، typecheck، تست‌ها، build
npm run test:e2e     # Playwright: سه اندازه صفحه، هر دو پوسته، axe، آفلاین + آزمون با سرور واقعی
cd server && npm test  # تست‌های سرور
```

اگر Chromium از قبل نصب است: `PW_CHROMIUM=/path/to/chrome npm run test:e2e`.
تصاویر صفحه‌ها پس از تست e2e در `docs/screenshots/` ذخیره می‌شوند.

## انتشار

جزئیات کامل در [`docs/DEPLOY.md`](docs/DEPLOY.md): نصب سرور، HTTPS، ثبت غرفه‌ها، پشتیبان‌گیری، اتصال پارکینگ، و ساخت فایل نصبی اندروید (پوشه `android/`).

- **iPhone:** در Safari: اشتراک‌گذاری ← «افزودن به صفحه اصلی». اعلان در آیفون از نسخه ۱۶٫۴ و فقط برای برنامه نصب‌شده کار می‌کند؛ برنامه این را به کاربر می‌گوید.
- فونت وزیرمتن داخل برنامه بسته‌بندی شده و به اینترنت یا Google Fonts نیاز ندارد.

## پیش‌نمایش Claude

`node scripts/build-artifact.mjs` همین برنامه را در یک فایل HTML (`dist-artifact/caspian-pro.html`) می‌سازد: React از cdnjs و فونت از Google Fonts، بقیه داخل فایل. در پیش‌نمایش، service worker و ذخیره کارت تردد غیرفعال است.

---

## English summary

Simple mobile-first PWA for Caspian Mall tenants, plus its API server (`server/`: Node 22, Hono, built-in SQLite, OTP login, web push, management panel). The app runs in demo mode unless built with `VITE_API_URL` (`npm run build:server`). The look follows the Caspian Owner app (slate light theme, neutral gray dark theme). **Stack:** Vite 8, React 19, TypeScript (strict), Tailwind CSS 4, Zustand (persisted), lucide-react, `qrcode`, vite-plugin-pwa (Workbox). Tests: Vitest + Testing Library (unit, store, component, WCAG contrast of design tokens) and Playwright + axe-core (RTL, no horizontal scroll, touch targets, offline reload, manifest).

```
src/
  api/index.ts         what screens call; picks demo (mock.ts) or server (http.ts)
  api/http.ts          server client (session token, errors); api/outbox.ts offline queue
  api/parking.ts       ParkingSource interface + mock (read-only parking subscription)
  data/catalog.ts      store info, services, gates, zones, channels, rules
  store/               zustand stores: ui/theme, tickets, notifications, security
  lib/                 Persian digits & Jalali dates, validators, hash router, safe storage
  components/          ui kit (Button, Field, Segmented, Modal, Toaster…) + layout (Header, BottomNav)
  features/<module>/   one folder per screen
  index.css            design tokens (light + dark) – the only place colours are defined
```

Routing is hash-based (`#/m/logistics`, `#/requests`…) so deep links work in iOS standalone mode and TWAs.
