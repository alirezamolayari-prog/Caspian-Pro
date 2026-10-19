import { BellRing, ChevronLeft, Download, Info, Monitor, Moon, Sun } from 'lucide-react';
import { PageHeader } from '../../components/layout/Header';
import { Badge } from '../../components/ui/Badge';
import { Card, IconTile, SectionTitle, ZebraList } from '../../components/ui/Card';
import { Segmented } from '../../components/ui/Choice';
import { STORE } from '../../data/catalog';
import { isStandalone, permissionState } from '../onboarding/notifications';
import { useUi, type ThemePref } from '../../store/ui';

const NOTIFY_LABEL = {
  granted: { text: 'فعال', tone: 'success' },
  denied: { text: 'مسدود', tone: 'danger' },
  default: { text: 'غیرفعال', tone: 'warning' },
  unsupported: { text: 'پشتیبانی نمی‌شود', tone: 'neutral' },
} as const;

export function ProfilePage() {
  const themePref = useUi((s) => s.themePref);
  const setThemePref = useUi((s) => s.setThemePref);
  const openPrompt = useUi((s) => s.setNotifyPromptOpen);
  const toast = useUi((s) => s.toast);
  const notify = NOTIFY_LABEL[permissionState()];

  return (
    <>
      <PageHeader title="پروفایل" />
      <div className="flex flex-col gap-6 px-4 pt-2">
        <Card className="flex items-center gap-4">
          <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-2xl font-bold text-on-primary-soft">
            ر
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink">{STORE.name}</h2>
            <p className="text-[13px] text-ink-2">
              پلاک {STORE.unit} – {STORE.floor} – {STORE.category}
            </p>
            <p className="text-[13px] text-ink-2">مدیر غرفه: {STORE.manager}</p>
          </div>
        </Card>

        <section aria-labelledby="theme-title">
          <SectionTitle id="theme-title">ظاهر</SectionTitle>
          <Segmented<ThemePref>
            label="پوسته برنامه"
            value={themePref}
            onChange={setThemePref}
            options={[
              { value: 'light', label: 'روشن', icon: Sun },
              { value: 'dark', label: 'تیره', icon: Moon },
              { value: 'system', label: 'سیستم', icon: Monitor },
            ]}
          />
        </section>

        <section aria-labelledby="settings-title">
          <SectionTitle id="settings-title">تنظیمات</SectionTitle>
          <ZebraList label="تنظیمات">
            <li>
              <button
                type="button"
                onClick={() => {
                  if (notify === NOTIFY_LABEL.denied) {
                    toast({
                      tone: 'info',
                      title: 'اعلان‌ها مسدود است',
                      body: 'از تنظیمات مرورگر یا گوشی، اعلان کاسپین پرو را روشن کنید.',
                    });
                  } else openPrompt(true);
                }}
                className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-start cursor-pointer"
              >
                <IconTile icon={BellRing} size="sm" />
                <span className="flex-1 font-semibold text-ink">اعلان‌ها</span>
                <Badge tone={notify.tone}>{notify.text}</Badge>
                <ChevronLeft className="size-5 text-ink-2" aria-hidden />
              </button>
            </li>
            {!isStandalone() && (
              <li className="flex min-h-16 items-center gap-3 px-4 py-3">
                <IconTile icon={Download} size="sm" />
                <span className="flex flex-col">
                  <span className="font-semibold text-ink">نصب روی گوشی</span>
                  <span className="text-[13px] text-ink-2">
                    آیفون: اشتراک‌گذاری ← افزودن به صفحه اصلی. اندروید: منوی مرورگر ← نصب برنامه.
                  </span>
                </span>
              </li>
            )}
            <li className="flex min-h-16 items-center gap-3 px-4 py-3">
              <IconTile icon={Info} size="sm" />
              <span className="flex flex-col">
                <span className="font-semibold text-ink">کاسپین پرو – نسخه ۱٫۱٫۰</span>
                <span className="text-[13px] text-ink-2">سامانه خدمات غرفه‌داران کاسپین</span>
              </span>
            </li>
          </ZebraList>
        </section>
      </div>
    </>
  );
}
