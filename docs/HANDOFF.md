# Caspian Pro – Session Handoff

> **برای علیرضا (خلاصه فارسی):** این فایل همه کارهایی است که تا امروز روی «کاسپین پرو» انجام شده. در سشن بعدی Claude، اول بگویید: «فایل `docs/HANDOFF.md` در ریپو Caspian-Pro را بخوان و از همان‌جا ادامه بده». نسخه فعلی ۱٫۱٫۰ است: ظاهر شبیه اپ Caspian Owner، حالت تیره خاکستری، صفحه خانه با گروه‌های جدا، بخش پارکینگ فقط‌نمایشی (بدون پرداخت)، و پنجره اجازه اعلان در اولین باز شدن. همه‌چیز فعلاً با داده نمونه کار می‌کند و سرور واقعی هنوز وصل نیست.

---

## 1. Snapshot

| Item           | Value                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| Product        | **Caspian Pro (کاسپین پرو)** – tenant-services app for the ~80 store owners of Caspian furniture mall                 |
| Owner          | Alireza Molayari (not a programmer; tests by using the app; report to him in short, plain Persian)                    |
| Repo           | https://github.com/alirezamolayari-prog/Caspian-Pro – branch **`main`** (Alireza approved pushing straight to `main`) |
| Version        | **1.1.0** (`package.json`)                                                                                            |
| Last commit    | `034847e` Redesign v1.1 in the Caspian Owner style                                                                    |
| Live preview   | https://claude.ai/artifact/KoNaM8pDon9H8KWJDRg9xh (private; same URL for every republish)                             |
| Data           | All mock. No backend yet.                                                                                             |
| Sister project | `alirezamolayari-prog/caspian-owner` (Flutter app for mall owners). Caspian Pro copies its look.                      |

## 2. History

### v1.0 (first build) – superseded

Built from a long prompt asking for a "luxury" navy + gold PWA. It had: curved navy header, gold accents, glass bottom nav, a **live loading-bay timer card** on Home (countdown, extend / checkout, auto-lock after 2 rejected extensions), header search, a header light/dark toggle, 7 service tiles, and a **GPS / location-permission recovery helper**. Commits `4fbb630`…`9293dc4`.

### v1.1 (current) – Alireza's redesign request

Alireza's feedback (in Persian), and what was done:

| Request                                                                   | Result                                                                                                 |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Keep the per-section icon style                                           | Kept: every section has a lucide icon in a soft slate tile (`IconTile`)                                |
| Remove the top timer / loading-gate card                                  | **Removed** (timer, extension, penalty lock, `store/loading.ts`)                                       |
| App must be simple; redo the whole UI/UX                                  | Rebuilt every screen with a plain Owner-style design                                                   |
| Split unrelated Home categories into separate sections                    | Home is a hub with 5 labelled groups (see §4)                                                          |
| Remove the GPS access section                                             | **Removed** (`features/permissions/` deleted)                                                          |
| Ask for notifications on install, like other apps                         | Bottom sheet «اجازه ارسال اعلان» on first open, and again on first open in installed (standalone) mode |
| Look like the Caspian Owner app; dark mode should be gray                 | Owner slate palette for light; neutral gray dark theme                                                 |
| Ignore the original prompt; do it properly                                | Gold, gradients, glow, Google Fonts styling all dropped                                                |
| Add Parking: see how much of the parking subscription is left, no payment | New read-only Parking page behind a `ParkingSource` interface                                          |

**Do not re-add:** the timer card, extension/penalty flow, GPS helper, gold/navy luxury theme, home search, header theme toggle, or any **invoicing (فاکتورساز)** module (permanently out of scope).

## 3. Alireza's standing preferences

- Simple screens, one primary action each. Persian only, RTL, Persian digits, Jalali dates.
- Visual language = Caspian Owner: off-white page `#EDF1F5`, white bordered cards (radius 20, no shadow), zebra-row lists inside one card, stadium buttons 48px, filled inputs radius 28, chips radius 10 with ✓.
- Dark mode = **neutral gray**, not navy.
- Status always shown as text (chip), never colour alone.
- Separator in visible text is « – » (en dash), never «·».
- Vazirmatn is **bundled** (`@fontsource-variable/vazirmatn`), because Google is often filtered in Iran.
- Parking shows information only: **no payment gateway**. Renewals happen at the parking office.
- Push to `main` after the quality gate passes. Commit messages in English.

## 4. Features (v1.1)

**Home (hub):** «سلام آقای رضایی», big title «مبلمان رویال», caption «پلاک ۲۴ – همکف», bell (unread badge) + profile icon. Groups (defined in `HOME_GROUPS`, `src/data/catalog.ts`):

| Group              | Modules                                                       |
| ------------------ | ------------------------------------------------------------- |
| درخواست‌ها و خدمات | خدمات کاسپین (`services`), گزارش خرابی مشاعات (`maintenance`) |
| تردد و خودرو       | بارگیری و تخلیه (`logistics`), پارکینگ (`parking`)            |
| امنیت              | حراست و انتظامات (`security`)                                 |
| فروش و تبلیغات     | رزرو فضای فروش (`booth`), درخواست تبلیغات (`advertising`)     |
| راهنما             | پشتیبانی و قوانین (`support`)                                 |

Cards show status chips: «N در جریان» for open tickets, parking «۱۲ روز مانده» (warning ≤ 7 days, danger when expired).

**Bottom nav (4 tabs):** خانه – درخواست‌ها – اعلان‌ها – پروفایل.

**Modules:**

- **خدمات کاسپین:** 3 category tabs (انبار و کالا / دکوراسیون / تاسیسات و برق), multi-select chips, urgency (عادی/فوری), description → ticket.
- **بارگیری و تخلیه:** gate radio cards with capacity text (اسدنژاد 1 – full, صفرخانی 1 of 3, پارکینگ اختصاصی 0 of 1), امروز/فردا, 15/30/45/60 min, driver mobile (Iranian format validated) → ticket. No timer.
- **پارکینگ:** status chip (فعال / رو به اتمام / منقضی), days left of total with progress bar, plan, start/end Jalali dates, vehicles allowed, floor, registered plates (Iranian plate drawn LTR: `12 ب 345 | ایران 67`), recent entries/exits, «آخرین به‌روزرسانی», renewal note. Loading skeleton, error + «تلاش دوباره».
- **حراست:** red SOS button with 2-step confirmation (type → final confirm) → dispatch ticket + notification; temporary staff pass form (name, role, today/tomorrow, from/to defaulting to current hour + 8h) → card with real QR (SVG via `qrcode`), status (معتبر / در انتظار شروع / منقضی), save as PNG.
- **رزرو فضای فروش:** zone radio cards, 14-day Jalali date grid, duration stepper 1–14, product details.
- **درخواست تبلیغات:** 4 channel cards (multi-select), title, duration, description, link (required for digital; URL or `@instagram`).
- **گزارش خرابی مشاعات:** category (آسانسور / پله‌برقی / روشنایی و لامپ / تهویه مطبوع), wing, floor, priority, description, up to 3 photos (image only, ≤ 5 MB) with preview.
- **پشتیبانی و قوانین:** phone list, rules accordion (includes a parking rule), message form → ticket.
- **درخواست‌ها:** filter همه / در جریان / بسته‌شده, zebra list, expand for tracking id «CSP-۴۸۲۹۱۳», dates, details. Statuses advance automatically in mock (`useBackgroundSimulation`: submitted → in review after 20 s → approved after 60 s + notification).
- **اعلان‌ها:** zebra list, unread «جدید», «خواندن همه», tap opens the linked section.
- **پروفایل:** store card, theme روشن/تیره/سیستم, notification status row (opens the prompt again; if blocked, explains how to unblock), install hint (hidden when installed), version.
- **Notification prompt:** `features/onboarding/NotificationPrompt.tsx` + `notifications.ts`. Shown 0.8 s after first open per mode (`browser`, `standalone`), remembered in localStorage key **`caspian-notify-asked`**. On iOS Safari (not installed) it explains «افزودن به صفحه اصلی» instead. «اجازه می‌دهم» calls `Notification.requestPermission()`.

## 5. Tech stack

Vite 8.3, React 19.3, TypeScript 6 (strict, `noUncheckedIndexedAccess`), Tailwind CSS 4.3 (`@tailwindcss/vite`), Zustand 5 (persist, safe localStorage wrapper), lucide-react 1.59, qrcode 1.5, vite-plugin-pwa 2.0 (Workbox `generateSW`, autoUpdate), Vitest 5 + Testing Library + jsdom, Playwright 1.64 + @axe-core/playwright, ESLint 10 + typescript-eslint, Prettier 3. Node 22.

Routing: hash routes (`src/lib/router.ts`): `#/`, `#/requests`, `#/notifications`, `#/profile`, `#/m/<moduleId>`. Works in iOS standalone and TWAs. In-app back uses `history.back()` when navigated inside the app.

## 6. Folder map

```
index.html                 RTL shell, theme boot script (reads localStorage 'caspian-theme' before paint)
vite.config.ts             React + Tailwind + PWA manifest (fa, rtl, standalone, slate colours) + Vitest config
vite.artifact.config.ts    single-file preview build (React from window globals)
playwright.config.ts       3 projects: phone-small 360×740, iphone, tablet 768×1024; PW_CHROMIUM support
public/                    favicon.svg (slate «C» + sparkle), pwa-192/512, maskable, apple-touch-icon
scripts/generate-icons.mjs renders favicon.svg → PNG icons (Playwright Chromium)
scripts/build-artifact.mjs builds dist-artifact/caspian-pro.html for the Claude preview
artifact/                  shims: react, react-dom, jsx-runtime → UMD globals; pwa-stub; empty.css (font via Google Fonts in preview)
.github/workflows/ci.yml   format, lint, typecheck, test, build, Playwright (not yet observed running on GitHub)
src/
  index.css                ALL colour tokens (light + gray dark) and Tailwind @theme mapping; animations
  main.tsx                 sets lang/dir, registers service worker, renders App
  App.tsx                  route → page, BottomNav, Toaster, NotificationPrompt, skip link, focus on route change
  data/catalog.ts          STORE, SERVICE_TILES, HOME_GROUPS, categories, gates, zones, ad channels, floors, rules, contacts
  api/mock.ts              submitRequest (ticket + notification), dispatchSecurity; LATENCY (tests set to 5 ms)
  api/parking.ts           ParkingSource interface, mockParkingSource, setParkingSource, subscriptionSummary, PARKING_LATENCY
  store/ui.ts              theme pref (light/dark/system, honours host data-theme), toasts, notifyPromptOpen
  store/tickets.ts         tickets (persisted 'caspian-tickets'), STATUS_LABEL, seed data
  store/notifications.ts   notices (persisted 'caspian-notifications'), seed data, selectUnread
  store/security.ts        staff passes (persisted 'caspian-security'), passStatus
  lib/persian.ts           toFa/toEn digits, formatClock, Jalali formatters (Intl fa-IR-u-ca-persian), relativeTime
  lib/validators.ts        Iranian mobile, link/Instagram handle, time range, person name
  lib/router.ts            hash router; lib/ids.ts ticket ids; lib/storage.ts never-throwing localStorage
  hooks/                   useRequestSubmit (submit + toast + success state), useParking (cached), useNow, useBackgroundSimulation
  components/ui/           Button/IconButton, Card/SectionTitle/ZebraList/IconTile, Badge, Field/TextInput/TextArea/Select,
                           Chip/Segmented/RadioCard, Modal (bottom sheet, focus trap), Feedback (ProgressBar, EmptyState, Alert, Toaster)
  components/layout/       Header (HubHeader, PageHeader, NotificationBell), BottomNav, Success (tracking-id panel)
  features/<module>/       one folder per screen (home, services, logistics, parking, security, booth, advertising,
                           maintenance, support, requests, notifications, profile, onboarding)
  App.test.tsx             component tests; lib/lib.test.ts unit tests; theme/contrast.test.ts token contrast
e2e/app.spec.ts            browser tests + screenshots → docs/screenshots/
docs/screenshots/          every screen, light and dark (iPhone size)
```

## 7. Design tokens (`src/index.css`)

| Token (Tailwind name)                              | Light             | Dark (gray)               |
| -------------------------------------------------- | ----------------- | ------------------------- |
| `bg` page                                          | #EDF1F5           | #161616                   |
| `card`                                             | #FFFFFF           | #212121                   |
| `row` zebra                                        | #F2F5F8           | #282828                   |
| `field` inputs / nav bar                           | #E3E8EE           | #2C2C2C                   |
| `line` border                                      | #D8DFE7           | #383838                   |
| `outline`                                          | #8A96A5           | #8C8C8C                   |
| `ink` / `ink-2`                                    | #0F172A / #475569 | #F2F2F2 / #B3B3B3         |
| `primary` / `on-primary`                           | #334155 / #FFFFFF | #D9D9D9 / #1A1A1A         |
| `primary-soft` / `on-primary-soft`                 | #DDE3EA / #1E293B | #333333 / #EDEDED         |
| `success`, `warning`, `danger`, `info` (+ `-soft`) | Owner values      | light tints on dark fills |
| `sos` / `on-sos`                                   | #C62828 / #FFF    | #D32F2F / #FFF            |

Rule: no hex colours in components (exceptions: QR stays navy-on-white; downloaded pass PNG). `src/theme/contrast.test.ts` checks every text pair and chip-on-tint ≥ 4.5:1 and outlines ≥ 3:1 in both themes.

## 8. Plugging in real systems

- **Backend:** replace the functions in `src/api/mock.ts` with HTTP calls (keep signatures). Ticket ids come from the server.
- **Parking software:** implement `ParkingSource.getSubscription(): Promise<ParkingSubscription>` against its API, then `setParkingSource(realSource)` at startup. Fields: `plan, startsAt, endsAt, vehiclesAllowed, floor, plates[{two,letter,three,region}], recentVisits[{id,plate,enteredAt,exitedAt|null}], updatedAt`. No payment.
- **Store identity:** `STORE` in `catalog.ts` is hard-coded (مبلمان رویال, پلاک ۲۴, آقای رضایی); should come from login.
- **Push:** only the permission request exists. A push server (VAPID) and subscription upload are not built.

## 9. Commands and quality gate

```bash
npm install
npm run dev                 # http://localhost:5173
npm run check               # prettier --check, eslint (0 warnings), tsc -b, vitest, vite build
npm run build && PW_CHROMIUM=/opt/pw-browsers/chromium npm run test:e2e   # cloud sandbox
npm run test:e2e            # local machine after `npx playwright install chromium`
PW_CHROMIUM=/opt/pw-browsers/chromium node scripts/generate-icons.mjs
node scripts/build-artifact.mjs   # → dist-artifact/caspian-pro.html (gitignored)
```

Last results (v1.1): **61** Vitest tests and **88** Playwright tests pass (all routes × light/dark × 3 viewports: RTL, no horizontal scroll, axe WCAG 2.1 AA clean, no console errors; 44px targets; theme persists; notification sheet once; Vazirmatn loaded; offline reload via service worker; manifest valid).

**Republishing the preview:** build the artifact, then publish `dist-artifact/caspian-pro.html` with the Artifact tool using `url: https://claude.ai/artifact/KoNaM8pDon9H8KWJDRg9xh` (read it first from a new conversation). The preview loads React 18.3.1 UMD from cdnjs and Vazirmatn from Google Fonts; everything else is inlined.

## 10. Gotchas learned

- **cdnjs is blocked in the cloud sandbox** (proxy 403). To smoke-test the preview locally, `npm pack react@18.3.1 react-dom@18.3.1` into the scratchpad and route the cdnjs URLs to those files in Playwright.
- Playwright's bundled browser isn't installed; use `executablePath`/`PW_CHROMIUM=/opt/pw-browsers/chromium`. Never run `playwright install`.
- Don't `pkill -f "vite preview"` inside a command string that itself contains "vite preview" (it kills its own shell). Use `pgrep -af ... | awk | xargs kill`.
- Tests must pre-set `localStorage['caspian-notify-asked'] = 'browser,standalone'`, or the notification sheet covers the screen. jsdom has no `Notification`; stub it with `vi.stubGlobal` when testing the sheet.
- `aria-labelledby` ids must not contain spaces (Persian group titles broke it; use index ids).
- Prettier reformats union types to one line; regex edits on source must account for that.
- The artifact frame blocks downloads, so «ذخیره کارت» works only in the real app.
- `tsconfig.node.json` needs `DOM` lib for e2e files.

## 11. Suggested next steps

1. Watch the GitHub Actions CI run on `main` and fix anything red (never observed yet).
2. Login (tenant phone + OTP) and load `STORE` from the server.
3. Real backend for tickets/notifications (replace `api/mock.ts`), offline queue for submissions.
4. Connect the parking software through `ParkingSource`; add a «یادآوری پایان اشتراک» notification at 7 days.
5. Web push server (VAPID) and subscription upload after permission is granted.
6. Package for Android as a TWA (Bubblewrap) with `assetlinks.json`; host `dist/` on HTTPS.
7. Persian user guide, and a CHANGELOG once releases start.
