import {
  CalendarRange,
  Car,
  Info,
  LogIn,
  LogOut,
  RefreshCw,
  SquareParking,
  WifiOff,
} from 'lucide-react';
import { PageHeader } from '../../components/layout/Header';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, SectionTitle, ZebraList } from '../../components/ui/Card';
import { Alert, EmptyState, ProgressBar } from '../../components/ui/Feedback';
import {
  STATUS_LABEL,
  subscriptionSummary,
  type ParkingSubscription,
  type Plate,
} from '../../api/parking';
import { useParking } from '../../hooks/useParking';
import { formatJalali, formatTime, relativeTime, toFa } from '../../lib/persian';

/** Iranian plate drawn as text: «۱۲ ب ۳۴۵ – ایران ۶۷». */
export function PlateView({ plate }: { plate: Plate }) {
  return (
    <span
      dir="ltr"
      className="inline-flex items-stretch overflow-hidden rounded-lg border-2 border-ink text-[15px] font-bold text-ink"
      aria-label={`پلاک ${plate.two} ${plate.letter} ${plate.three} ایران ${plate.region}`}
    >
      <span className="flex items-center gap-2 px-2.5 py-0.5 tabular">
        <span>{toFa(plate.two)}</span>
        <span>{plate.letter}</span>
        <span>{toFa(plate.three)}</span>
      </span>
      <span className="flex flex-col items-center justify-center border-s-2 border-ink px-2 text-[10px] leading-tight">
        <span>ایران</span>
        <span className="text-[13px] tabular">{toFa(plate.region)}</span>
      </span>
    </span>
  );
}

function Skeleton() {
  return (
    <div
      className="flex flex-col gap-4"
      aria-busy="true"
      aria-label="در حال دریافت اطلاعات پارکینگ"
    >
      {[120, 180, 140].map((h) => (
        <div
          key={h}
          className="animate-pulse rounded-[20px] border border-line bg-card"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}

function Subscription({ data }: { data: ParkingSubscription }) {
  const s = subscriptionSummary(data);
  const tone = s.status === 'expired' ? 'danger' : s.status === 'ending' ? 'warning' : 'success';
  return (
    <div className="animate-view flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[15px] font-semibold text-ink-2">{data.plan}</p>
          <Badge tone={tone}>{STATUS_LABEL[s.status]}</Badge>
        </div>
        <div>
          <p className="text-[13px] text-ink-2">باقی‌مانده اشتراک</p>
          <p className="text-[32px] font-bold leading-tight text-ink">
            {s.status === 'expired' ? 'تمام شده' : `${toFa(s.daysLeft)} روز`}
            <span className="ms-2 text-[15px] font-medium text-ink-2">
              از {toFa(s.totalDays)} روز
            </span>
          </p>
        </div>
        <ProgressBar
          value={s.usedRatio}
          label="روزهای استفاده‌شده از اشتراک"
          tone={tone === 'success' ? 'primary' : tone}
        />
        <dl className="grid grid-cols-2 gap-3 text-[13px]">
          <div className="flex flex-col gap-0.5">
            <dt className="flex items-center gap-1 text-ink-2">
              <CalendarRange className="size-4" aria-hidden /> شروع
            </dt>
            <dd className="font-semibold text-ink">{formatJalali(data.startsAt)}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="flex items-center gap-1 text-ink-2">
              <CalendarRange className="size-4" aria-hidden /> پایان
            </dt>
            <dd className="font-semibold text-ink">{formatJalali(data.endsAt)}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="flex items-center gap-1 text-ink-2">
              <Car className="size-4" aria-hidden /> تعداد خودرو
            </dt>
            <dd className="font-semibold text-ink">{toFa(data.vehiclesAllowed)} خودرو</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="flex items-center gap-1 text-ink-2">
              <SquareParking className="size-4" aria-hidden /> محل پارک
            </dt>
            <dd className="font-semibold text-ink">{data.floor}</dd>
          </div>
        </dl>
      </Card>

      {s.status !== 'active' && (
        <Alert tone={tone === 'danger' ? 'danger' : 'warning'} icon={Info} title="تمدید اشتراک">
          برای تمدید به دفتر پارکینگ کاسپین مراجعه کنید.
        </Alert>
      )}

      <section aria-labelledby="plates-title">
        <SectionTitle id="plates-title">پلاک‌های ثبت‌شده</SectionTitle>
        <ZebraList label="پلاک‌های ثبت‌شده">
          {data.plates.map((p) => (
            <li
              key={`${p.two}${p.letter}${p.three}${p.region}`}
              className="flex min-h-16 items-center justify-between gap-3 px-4 py-3"
            >
              <PlateView plate={p} />
            </li>
          ))}
        </ZebraList>
      </section>

      <section aria-labelledby="visits-title">
        <SectionTitle id="visits-title">ورود و خروج اخیر</SectionTitle>
        <ZebraList label="ورود و خروج اخیر">
          {data.recentVisits.map((v) => (
            <li key={v.id} className="flex min-h-16 items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="flex items-center gap-1 text-[15px] text-ink">
                  <LogIn className="size-4 text-ink-2" aria-hidden />
                  ورود {formatTime(v.enteredAt)} – {relativeTime(v.enteredAt)}
                </span>
                <span className="flex items-center gap-1 text-[13px] text-ink-2">
                  <LogOut className="size-4" aria-hidden />
                  {v.exitedAt ? `خروج ${formatTime(v.exitedAt)}` : 'هنوز در پارکینگ'}
                </span>
              </div>
              <PlateView plate={v.plate} />
            </li>
          ))}
        </ZebraList>
      </section>

      <p className="px-2 text-[13px] text-ink-2">
        آخرین به‌روزرسانی: {relativeTime(data.updatedAt)} – اطلاعات از سامانه پارکینگ خوانده می‌شود
        و فقط برای مشاهده است. تمدید و پرداخت در دفتر پارکینگ انجام می‌شود.
      </p>
    </div>
  );
}

export function ParkingPage() {
  const { state, retry } = useParking();
  return (
    <>
      <PageHeader back title="پارکینگ" subtitle="وضعیت اشتراک پارکینگ غرفه" />
      <div className="flex flex-col gap-4 px-4 pt-2">
        {state.status === 'loading' && <Skeleton />}
        {state.status === 'error' && (
          <EmptyState
            icon={WifiOff}
            title="اطلاعات پارکینگ دریافت نشد"
            body="اتصال اینترنت را بررسی کنید و دوباره تلاش کنید."
            action={
              <Button variant="tonal" icon={RefreshCw} onClick={retry}>
                تلاش دوباره
              </Button>
            }
          />
        )}
        {state.status === 'ready' && <Subscription data={state.data} />}
      </div>
    </>
  );
}
