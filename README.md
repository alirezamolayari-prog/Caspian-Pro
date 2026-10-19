# کاسپین پرو (Caspian Pro)

**سامانه هوشمند خدمات غرفه‌داران کاسپین** – اپلیکیشن وب پیش‌رونده (PWA) برای حدود ۸۰ غرفه‌دار پاساژ کاسپین. فارسی، راست‌به‌چپ، با پوسته روشن و تیره.

> نسخه فعلی با داده‌های نمونه (mock) کار می‌کند. اتصال به سرور واقعی فقط با جایگزینی `src/api/mock.ts` انجام می‌شود.

## امکانات

| بخش             | کار                                                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| خانه            | سلام و نام غرفه، جستجوی خدمات، تایمر زنده بارگیری (تمدید / تسویه و خروج)، ۷ خدمت، آخرین درخواست‌ها                                       |
| اعلان‌ها        | تایید مجوز خروج کالا، هشدار پایان زمان بارگیری، اطلاعیه‌های مدیریت                                                                       |
| خدمات کاسپین    | انبار و کالا، دکوراسیون، تاسیسات و برق؛ انتخاب چندگانه و کد پیگیری                                                                       |
| بارگیری و تخلیه | درب اسدنژاد (۱)، صفرخانی (۳)، پارکینگ اختصاصی (۱) با ظرفیت زنده؛ ۱۵ تا ۶۰ دقیقه؛ موبایل راننده؛ قفل خودکار پس از ۲ رد تمدید (+ کلید دمو) |
| رزرو فضای فروش  | انتخاب فضا، تاریخ شمسی، مدت، شرح کلکسیون                                                                                                 |
| تبلیغات         | ۴ کانال (دیجیتال، راهروها، پارکینگ، آسانسورها)، عنوان، مدت، توضیحات، لینک                                                                |
| حراست           | کارت تردد موقت با QR (قابل دانلود)، دکمه اضطراری SOS با تایید دومرحله‌ای                                                                 |
| خرابی مشاعات    | آسانسور، پله‌برقی، روشنایی، تهویه؛ بخش و طبقه؛ عکس                                                                                       |
| پشتیبانی        | تماس سریع، قوانین پاساژ، پیام به پشتیبانی                                                                                                |
| دسترسی‌ها       | راهنمای بازیابی دسترسی مکان و اعلان در iOS و اندروید (شامل مرحله دوم «همیشه» در iOS)                                                     |

ماژول فاکتورساز عمداً در محصول نیست.

## اجرا

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # خروجی در dist/ (همراه با service worker)
npm run preview
```

## بررسی کیفیت

```bash
npm run check        # فرمت، lint، typecheck، تست‌ها، build
npm run test:e2e     # Playwright: سه اندازه صفحه، هر دو پوسته، axe، آفلاین
```

اگر Chromium از قبل نصب است: `PW_CHROMIUM=/path/to/chrome npm run test:e2e`.
تصاویر صفحه‌ها پس از تست e2e در `docs/screenshots/` ذخیره می‌شوند.

## انتشار

- **وب / iPhone:** محتوای `dist/` را روی هر هاست HTTPS قرار دهید. در Safari: اشتراک‌گذاری ← «افزودن به صفحه اصلی». اعلان‌ها در iOS از نسخه ۱۶٫۴ و فقط برای برنامه نصب‌شده کار می‌کنند.
- **اندروید:** همین آدرس را با یک Trusted Web Activity (مثلاً با Bubblewrap) بسته‌بندی کنید؛ `manifest.webmanifest` و آیکن maskable آماده است. فایل `assetlinks.json` باید روی دامنه قرار بگیرد.
- فونت وزیرمتن داخل برنامه بسته‌بندی شده و به اینترنت یا Google Fonts نیاز ندارد.

## پیش‌نمایش Claude

`node scripts/build-artifact.mjs` همین برنامه را در یک فایل HTML (`dist-artifact/caspian-pro.html`) می‌سازد: React از cdnjs و فونت از Google Fonts، بقیه داخل فایل. در پیش‌نمایش، service worker و دانلود کارت تردد غیرفعال است.

---

## English summary

Mobile-first PWA for Caspian Mall tenants. **Stack:** Vite 8, React 19, TypeScript (strict), Tailwind CSS 4, Zustand (persisted), lucide-react, `qrcode`, vite-plugin-pwa (Workbox). Tests: Vitest + Testing Library (unit, store, component, WCAG contrast of design tokens) and Playwright + axe-core (RTL, no horizontal scroll, touch targets, offline reload, manifest).

```
src/
  api/mock.ts          mock backend (swap for HTTP client)
  data/catalog.ts      store info, services, gates, zones, channels, rules
  store/               zustand stores: ui/theme, tickets, notifications, loading, security
  lib/                 Persian digits & Jalali dates, validators, hash router, safe storage
  components/          ui kit (Button, Field, Segmented, Modal, Toaster…) + layout (Header, BottomNav)
  features/<module>/   one folder per screen
  index.css            design tokens (light + dark) – the only place colours are defined
```

Routing is hash-based (`#/m/logistics`, `#/requests`…) so deep links work in iOS standalone mode and TWAs.
