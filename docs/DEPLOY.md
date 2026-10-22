# راه‌اندازی کاسپین پرو روی سرور واقعی

این راهنما برای کسی است که سرور را راه می‌اندازد (برنامه‌نویس یا مسئول IT). دستورها انگلیسی‌اند و باید عیناً اجرا شوند.

## ۱. چیزهایی که قبل از شروع لازم است

| مورد                  | توضیح                                                                                                                                                                                                         | چه کسی        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **سرور**              | یک سرور مجازی لینوکس (Ubuntu 24.04)، حداقل ۱ هسته و ۱ گیگ رم. سرور داخل ایران پیشنهاد می‌شود تا برای غرفه‌داران فیلتر نشود.                                                                                   | مدیریت کاسپین |
| **دامنه**             | یک دامنه یا زیردامنه، مثلاً `app.caspian-mall.ir`، که به IP سرور اشاره کند.                                                                                                                                   | مدیریت کاسپین |
| **پنل پیامک**         | حساب کاوه‌نگار با یک «قالب تأیید» (verify lookup) که `%token%` دارد.                                                                                                                                          | مدیریت کاسپین |
| **پروکسی برای اعلان** | اعلان اندروید و کروم از سرورهای گوگل (FCM) می‌گذرد که در ایران فیلتر است. سرور ایران یک پروکسی HTTP لازم دارد که به `fcm.googleapis.com` برسد. بدون آن، همه‌چیز کار می‌کند جز اعلانِ وقتی که برنامه بسته است. | IT            |
| **نرم‌افزار پارکینگ** | اگر API دارد، آدرس و رمز آن. شکل داده در بخش ۷ آمده است.                                                                                                                                                      | شرکت پارکینگ  |

## ۲. نصب

```bash
# Node.js 22 (نسخه 22.18 یا بالاتر)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx git

sudo useradd -r -m -d /opt/caspian-pro caspian
sudo -u caspian git clone https://github.com/alirezamolayari-prog/Caspian-Pro.git /opt/caspian-pro
cd /opt/caspian-pro
sudo -u caspian npm ci
sudo -u caspian npm run build:server        # app in server mode → dist/
cd server
sudo -u caspian npm ci --omit=dev
sudo -u caspian cp .env.example .env
sudo -u caspian npm run admin -- vapid      # copy the two lines into .env
sudo -u caspian nano .env                    # ADMIN_TOKEN, Kavenegar, SECURITY_PHONES, ...
```

`ADMIN_TOKEN` را یک رمز طولانی و تصادفی بگذارید؛ مثلاً خروجی `openssl rand -hex 24`.

## ۳. اجرای دائمی و HTTPS

```bash
sudo cp /opt/caspian-pro/deploy/caspian-pro.service /etc/systemd/system/
sudo systemctl enable --now caspian-pro
sudo systemctl status caspian-pro            # should say "active (running)"

sudo cp /opt/caspian-pro/deploy/nginx.conf /etc/nginx/sites-available/caspian-pro
sudo nano /etc/nginx/sites-available/caspian-pro   # replace app.example.ir with your domain
sudo ln -s /etc/nginx/sites-available/caspian-pro /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d app.caspian-mall.ir
```

حالا `https://app.caspian-mall.ir` برنامه است و `https://app.caspian-mall.ir/admin` پنل مدیریت.

## ۴. ثبت غرفه‌ها

فقط شماره‌هایی که ثبت شده‌اند می‌توانند وارد شوند. دو راه هست:

- **پنل مدیریت** (`/admin` ← غرفه‌ها): برای هر غرفه شناسه لاتین (مثلاً `u24`)، پلاک، طبقه، نام، مدیر و شماره‌ها.
- **فایل اکسل/CSV** برای همه ۸۰ غرفه یک‌جا. ستون‌ها مثل `server/stores.example.csv`. چند شماره را با `;` جدا کنید.

```bash
cd /opt/caspian-pro/server
sudo -u caspian npm run admin -- import /path/to/stores.csv
sudo -u caspian npm run admin -- stores      # list
```

## ۵. کار روزانه مدیریت (پنل `/admin`)

- **درخواست‌ها:** فهرست درخواست‌های در جریان. با تغییر وضعیت (تایید، رد، انجام شد) غرفه‌دار فوراً اعلان می‌گیرد. عکس‌های گزارش خرابی همان‌جا دیده می‌شود.
- **غرفه‌ها:** افزودن، ویرایش، غیرفعال کردن. غیرفعال کردن، همه گوشی‌های آن غرفه را از حساب خارج می‌کند.
- **اطلاعیه:** یک پیام برای همه غرفه‌ها، با اعلان روی گوشی.

دکمه اضطراری حراست به شماره‌های `SECURITY_PHONES` پیامک می‌زند: نام غرفه، پلاک، طبقه و شماره تماس.

## ۶. پشتیبان‌گیری و به‌روزرسانی

همه اطلاعات در پوشه `server/data` است: فایل `caspian.db` و عکس‌ها. روزی یک بار کپی بگیرید:

```bash
# crontab -e  (as caspian)
15 3 * * * cd /opt/caspian-pro/server && tar czf /opt/backups/caspian-$(date +\%F).tgz data
```

به‌روزرسانی نسخه:

```bash
cd /opt/caspian-pro && sudo -u caspian git pull && sudo -u caspian npm ci && sudo -u caspian npm run build:server
cd server && sudo -u caspian npm ci --omit=dev && sudo systemctl restart caspian-pro
```

## ۷. اتصال نرم‌افزار پارکینگ

در `.env` بنویسید `PARKING_PROVIDER=http` و `PARKING_URL` و `PARKING_TOKEN`. سرور برای هر غرفه این را می‌خواهد:

```
GET {PARKING_URL}/subscriptions/{storeId}
Authorization: Bearer {PARKING_TOKEN}
```

پاسخ (تاریخ‌ها به صورت ISO یا میلی‌ثانیه):

```json
{
  "plan": "اشتراک ماهانه غرفه‌دار",
  "startsAt": "2026-10-01T00:00:00+03:30",
  "endsAt": "2026-11-01T00:00:00+03:30",
  "vehiclesAllowed": 2,
  "floor": "پارکینگ ۱",
  "plates": [{ "two": "12", "letter": "ب", "three": "345", "region": "67" }],
  "recentVisits": [
    {
      "id": "v1",
      "plate": { "two": "12", "letter": "ب", "three": "345", "region": "67" },
      "enteredAt": "2026-10-22T09:10:00+03:30",
      "exitedAt": null
    }
  ],
  "updatedAt": "2026-10-22T10:00:00+03:30"
}
```

اگر غرفه اشتراک ندارد، پاسخ `404`. اگر شرکت پارکینگ شکل دیگری می‌دهد، فقط فایل `server/src/parking.ts` باید عوض شود.

هر یک ساعت، سرور برای غرفه‌هایی که ۷ روز یا کمتر به پایان اشتراکشان مانده یک اعلان «یادآوری پایان اشتراک پارکینگ» می‌فرستد. این اعلان فقط یک بار فرستاده می‌شود. وقتی اشتراک تمام شود، یک اعلان دیگر هم می‌رود. پرداخت در برنامه نیست؛ تمدید در دفتر پارکینگ انجام می‌شود.

## ۸. نسخه اندروید (فایل نصبی APK / AAB)

برنامه یک PWA است و همین الان از مرورگر نصب می‌شود. برای فایل نصبی اندروید (بازار، مایکت، یا ارسال مستقیم) از Bubblewrap استفاده کنید. این کار روی یک کامپیوتر انجام می‌شود، نه روی سرور:

```bash
npm i -g @bubblewrap/cli
cd android
# 1) in twa-manifest.json replace every CHANGE-ME.example.ir with the real domain
# 2) first time only: create the signing key (keep it safe, never commit it)
keytool -genkeypair -v -keystore caspian-pro.keystore -alias caspian-pro -keyalg RSA -keysize 2048 -validity 10000
# 3) generate the Android project from twa-manifest.json and build
bubblewrap update
bubblewrap build                      # → app-release-signed.apk and app-release-bundle.aab
bubblewrap fingerprint list           # SHA-256 کلید امضا
```

اثر انگشت SHA-256 را در `.env` سرور بگذارید (`ANDROID_SHA256=AA:BB:...`) و سرور را ری‌استارت کنید. آدرس `https://app.caspian-mall.ir/.well-known/assetlinks.json` باید آن را نشان دهد. بدون این کار، برنامه اندروید نوار آدرس مرورگر را بالای صفحه نشان می‌دهد.

**فایل `caspian-pro.keystore` و رمزش را گم نکنید.** بدون آن، نسخه بعدی برنامه روی گوشی‌ها نصب نمی‌شود. این فایل را در ریپو نگذارید.

## ۹. حالت نمایشی

بدون `VITE_API_URL` (یعنی `npm run build` معمولی و پیش‌نمایش Claude)، برنامه با داده نمونه و بدون ورود کار می‌کند. این حالت برای نمایش و آزمایش ظاهر است.
