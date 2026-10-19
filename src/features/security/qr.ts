import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { STORE } from '../../data/catalog';
import type { StaffPass } from '../../store/security';

/** QR colours are fixed (navy on white) so every scanner can read them in both themes. */
const QR_DARK = '#0F172A';
const QR_LIGHT = '#FFFFFF';

export function passPayload(p: StaffPass) {
  return JSON.stringify({
    v: 1,
    id: p.id,
    unit: STORE.unit,
    name: p.name,
    date: p.date,
    from: p.from,
    to: p.to,
  });
}

export function useQrDataUrl(text: string) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let alive = true;
    QRCode.toString(text, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: QR_DARK, light: QR_LIGHT },
    })
      .then((svg) => alive && setUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`))
      .catch(() => alive && setUrl(''));
    return () => {
      alive = false;
    };
  }, [text]);
  return url;
}
