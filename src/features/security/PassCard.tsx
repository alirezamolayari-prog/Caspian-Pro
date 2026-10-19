import { Download, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { STORE } from '../../data/catalog';
import { useNow } from '../../hooks/useNow';
import { displayId } from '../../lib/ids';
import { formatJalali, toFa } from '../../lib/persian';
import { passPayload, useQrDataUrl } from './qr';
import { PASS_STATUS_LABEL, passStatus, type StaffPass } from '../../store/security';

async function downloadPass(p: StaffPass, qrUrl: string) {
  const W = 720;
  const H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0F172A');
  grad.addColorStop(1, '#1E293B');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 48);
  ctx.fill();
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(16, 16, W - 32, H - 32, 40);
  ctx.stroke();
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  const font = "'Vazirmatn Variable', Vazirmatn, Tahoma, sans-serif";
  ctx.fillStyle = '#D4AF37';
  ctx.font = `800 44px ${font}`;
  ctx.fillText('کاسپین پرو', W / 2, 110);
  ctx.fillStyle = '#CBD5E1';
  ctx.font = `500 28px ${font}`;
  ctx.fillText('کارت تردد موقت پرسنل', W / 2, 160);
  const img = new Image();
  img.src = qrUrl;
  await img.decode().catch(() => undefined);
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(W / 2 - 220, 210, 440, 440, 28);
  ctx.fill();
  ctx.drawImage(img, W / 2 - 200, 230, 400, 400);
  ctx.fillStyle = '#F8FAFC';
  ctx.font = `800 48px ${font}`;
  ctx.fillText(p.name, W / 2, 740);
  ctx.fillStyle = '#CBD5E1';
  ctx.font = `500 30px ${font}`;
  ctx.fillText(`${p.role} – ${STORE.name} پلاک ${STORE.unit}`, W / 2, 795);
  const [py, pm, pd] = p.date.split('-').map(Number) as [number, number, number];
  ctx.fillText(formatJalali(new Date(py, pm - 1, pd)), W / 2, 860);
  ctx.fillStyle = '#E5C158';
  ctx.font = `800 40px ${font}`;
  ctx.fillText(`${toFa(p.from)} تا ${toFa(p.to)}`, W / 2, 920);
  ctx.fillStyle = '#94A3B8';
  ctx.font = `500 26px ${font}`;
  ctx.fillText(displayId(p.id), W / 2, 1000);
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = `caspian-pass-${p.id}.png`;
  a.click();
}

export function PassCard({ pass, onRemove }: { pass: StaffPass; onRemove?: () => void }) {
  const now = useNow(30_000);
  const qr = useQrDataUrl(passPayload(pass));
  const status = passStatus(pass, now);
  const [y, m, d] = pass.date.split('-').map(Number) as [number, number, number];
  return (
    <article
      aria-label={`کارت تردد ${pass.name}`}
      className="animate-view relative overflow-hidden rounded-3xl border border-gold/50 bg-header-2 p-5 text-on-header shadow-card"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -start-16 size-48 rounded-full bg-gold/20 blur-3xl"
      />
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-gold">کاسپین پرو – کارت تردد موقت</p>
          <h3 className="mt-1 text-xl font-extrabold">{pass.name}</h3>
          <p className="text-xs text-on-header-2">
            {pass.role} – {STORE.name} پلاک {STORE.unit}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-on-gold">
          <span
            aria-hidden
            className={`size-2 rounded-full ${status === 'valid' ? 'bg-[#16A34A]' : status === 'upcoming' ? 'bg-[#D97706]' : 'bg-[#DC2626]'}`}
          />
          {PASS_STATUS_LABEL[status]}
        </span>
      </div>
      <div className="relative mx-auto mt-4 w-48 rounded-2xl bg-white p-2 shadow-lg">
        {qr ? (
          <img
            src={qr}
            alt={`کد QR کارت تردد ${pass.name}`}
            className="aspect-square w-full"
            width={176}
            height={176}
          />
        ) : (
          <div className="aspect-square w-full animate-pulse rounded-xl bg-[#E2E8F0]" aria-hidden />
        )}
      </div>
      <dl className="relative mt-4 grid grid-cols-2 gap-2 text-center text-xs">
        <div className="rounded-xl bg-white/10 p-2">
          <dt className="text-on-header-2">تاریخ</dt>
          <dd className="font-bold">{formatJalali(new Date(y, m - 1, d))}</dd>
        </div>
        <div className="rounded-xl bg-white/10 p-2">
          <dt className="text-on-header-2">ساعت اعتبار</dt>
          <dd className="tabular font-bold">
            {toFa(pass.from)} تا {toFa(pass.to)}
          </dd>
        </div>
      </dl>
      <p className="relative mt-3 text-center text-xs text-on-header-2" dir="ltr">
        {displayId(pass.id)}
      </p>
      <div className="relative mt-4 flex gap-2">
        <Button block icon={Download} disabled={!qr} onClick={() => void downloadPass(pass, qr)}>
          دانلود کارت
        </Button>
        {onRemove && (
          <Button
            variant="ghost"
            icon={Trash2}
            aria-label={`حذف کارت ${pass.name}`}
            className="w-12 shrink-0 bg-white/10 px-0 text-on-header"
            onClick={onRemove}
          >
            <span className="sr-only">حذف</span>
          </Button>
        )}
      </div>
    </article>
  );
}
