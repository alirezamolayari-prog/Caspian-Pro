import {
  BellRing,
  ChevronLeft,
  Download,
  Info,
  MapPin,
  Monitor,
  Moon,
  Smartphone,
  Sun,
} from 'lucide-react';
import { PageHeader } from '../../components/layout/Header';
import { Card, SectionTitle } from '../../components/ui/Card';
import { Segmented } from '../../components/ui/Choice';
import { STORE } from '../../data/catalog';
import { useNotifications } from '../../store/notifications';
import { useUi, type ThemePref } from '../../store/ui';

function Row({
  icon: Icon,
  title,
  body,
  onClick,
}: {
  icon: typeof Info;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-start cursor-pointer active:bg-surface-2"
    >
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold-ink">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-bold text-ink">{title}</span>
        <span className="text-xs text-ink-2">{body}</span>
      </span>
      <ChevronLeft className="size-5 text-ink-2" aria-hidden />
    </button>
  );
}

export function ProfilePage() {
  const themePref = useUi((s) => s.themePref);
  const setThemePref = useUi((s) => s.setThemePref);
  const openPermissions = useUi((s) => s.setPermissionsOpen);
  const addNotice = useNotifications((s) => s.add);

  return (
    <>
      <PageHeader title="پروفایل غرفه" subtitle="تنظیمات و دسترسی‌ها" />
      <div className="flex flex-col gap-6 px-4 pt-4">
        <Card className="flex items-center gap-4">
          <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F3DC8B] via-gold to-[#9C7A1C] text-2xl font-black text-on-gold">
            ر
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-ink">{STORE.name}</h2>
            <p className="text-sm text-ink-2">
              پلاک {STORE.unit} – {STORE.floor} – {STORE.category}
            </p>
            <p className="text-xs text-ink-2">مدیر غرفه: {STORE.manager}</p>
          </div>
        </Card>

        <section aria-labelledby="theme-title">
          <SectionTitle>
            <span id="theme-title">ظاهر برنامه</span>
          </SectionTitle>
          <Segmented<ThemePref>
            label="انتخاب پوسته"
            value={themePref}
            onChange={setThemePref}
            options={[
              { value: 'light', label: 'روشن', icon: Sun },
              { value: 'dark', label: 'تیره', icon: Moon },
              { value: 'system', label: 'سیستم', icon: Monitor },
            ]}
          />
        </section>

        <section aria-labelledby="perm-title">
          <SectionTitle>
            <span id="perm-title">دسترسی‌ها و نصب</span>
          </SectionTitle>
          <Card className="divide-y divide-line p-0">
            <Row
              icon={MapPin}
              title="بازیابی دسترسی مکان و اعلان"
              body="راهنمای قدم‌به‌قدم iOS و اندروید"
              onClick={() => openPermissions(true)}
            />
            <Row
              icon={BellRing}
              title="شبیه‌سازی پوش بی‌صدا"
              body="نمایش پنجره‌ای که با پوش بی‌صدا باز می‌شود"
              onClick={() => {
                addNotice({
                  kind: 'security',
                  title: 'دسترسی مکان غیرفعال است',
                  body: 'برای ورود خودکار به بارانداز، دسترسی مکان را «همیشه» فعال کنید.',
                });
                openPermissions(true);
              }}
            />
            <Row
              icon={Download}
              title="نصب روی صفحه اصلی"
              body="iPhone: اشتراک‌گذاری ← افزودن به صفحه اصلی"
              onClick={() => openPermissions(true)}
            />
          </Card>
        </section>

        <section aria-labelledby="about-title">
          <SectionTitle>
            <span id="about-title">درباره</span>
          </SectionTitle>
          <Card className="flex items-center gap-3">
            <Smartphone className="size-5 text-gold-ink" aria-hidden />
            <div className="text-sm">
              <p className="font-bold text-ink">کاسپین پرو – نسخه ۱٫۰٫۰</p>
              <p className="text-ink-2">سامانه هوشمند خدمات غرفه‌داران کاسپین</p>
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}
