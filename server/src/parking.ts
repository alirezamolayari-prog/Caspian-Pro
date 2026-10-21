/**
 * Parking subscription, read-only (renewals happen at the parking office; no payment).
 * `mock` returns sample data. `http` asks the mall's parking software:
 *   GET {PARKING_URL}/subscriptions/{storeId}   (Authorization: Bearer {PARKING_TOKEN})
 * returning the `ParkingSubscription` JSON below (dates as epoch ms or ISO strings),
 * or 404 when the store has no subscription. Another vendor format? Write an adapter
 * that maps it to this shape.
 */
import type { Config } from './config.ts';

export interface Plate {
  two: string;
  letter: string;
  three: string;
  region: string;
}

export interface ParkingSubscription {
  plan: string;
  startsAt: number;
  endsAt: number;
  vehiclesAllowed: number;
  floor: string;
  plates: Plate[];
  recentVisits: { id: string; plate: Plate; enteredAt: number; exitedAt: number | null }[];
  updatedAt: number;
}

export interface ParkingAdapter {
  /** `null` when the store has no parking subscription. */
  getSubscription(storeId: string): Promise<ParkingSubscription | null>;
}

const DAY = 86_400_000;
const startOfDay = (t: number) => t - (t % DAY);

export const mockParking: ParkingAdapter = {
  async getSubscription() {
    const now = Date.now();
    const plates: Plate[] = [
      { two: '12', letter: 'ب', three: '345', region: '67' },
      { two: '48', letter: 'ج', three: '219', region: '10' },
    ];
    return {
      plan: 'اشتراک ماهانه غرفه‌دار',
      startsAt: startOfDay(now) - 18 * DAY,
      endsAt: startOfDay(now) + 12 * DAY,
      vehiclesAllowed: 2,
      floor: 'پارکینگ ۱',
      plates,
      recentVisits: [
        { id: 'v1', plate: plates[0]!, enteredAt: now - 3 * 3600_000, exitedAt: null },
        {
          id: 'v2',
          plate: plates[1]!,
          enteredAt: now - 26 * 3600_000,
          exitedAt: now - 17 * 3600_000,
        },
      ],
      updatedAt: now,
    };
  },
};

const time = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : t;
  }
  return null;
};
const str = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
const plate = (p: unknown): Plate => {
  const o = (p ?? {}) as Record<string, unknown>;
  return { two: str(o.two), letter: str(o.letter), three: str(o.three), region: str(o.region) };
};

/** Validates and normalises a subscription coming from outside. Throws on bad data. */
export function parseSubscription(raw: unknown): ParkingSubscription {
  const o = (raw ?? {}) as Record<string, unknown>;
  const startsAt = time(o.startsAt);
  const endsAt = time(o.endsAt);
  if (startsAt === null || endsAt === null) throw new Error('parking: startsAt/endsAt missing');
  const visits = Array.isArray(o.recentVisits) ? o.recentVisits : [];
  return {
    plan: str(o.plan) || 'اشتراک پارکینگ',
    startsAt,
    endsAt,
    vehiclesAllowed: Number(o.vehiclesAllowed ?? 1) || 1,
    floor: str(o.floor),
    plates: Array.isArray(o.plates) ? o.plates.map(plate) : [],
    recentVisits: visits.slice(0, 10).map((v, i) => {
      const r = (v ?? {}) as Record<string, unknown>;
      return {
        id: str(r.id) || String(i),
        plate: plate(r.plate),
        enteredAt: time(r.enteredAt) ?? 0,
        exitedAt: time(r.exitedAt),
      };
    }),
    updatedAt: time(o.updatedAt) ?? Date.now(),
  };
}

export function httpParking(url: string, token: string): ParkingAdapter {
  return {
    async getSubscription(storeId) {
      const res = await fetch(
        `${url.replace(/\/$/, '')}/subscriptions/${encodeURIComponent(storeId)}`,
        {
          headers: token ? { authorization: `Bearer ${token}` } : {},
          signal: AbortSignal.timeout(8_000),
        },
      );
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`parking: ${res.status}`);
      return parseSubscription(await res.json());
    },
  };
}

export function createParking(config: Config): ParkingAdapter {
  if (config.parking.provider === 'http') {
    if (!config.parking.url) throw new Error('PARKING_URL is required for PARKING_PROVIDER=http');
    return httpParking(config.parking.url, config.parking.token);
  }
  return mockParking;
}

export const DAY_MS = DAY;
