/**
 * Parking subscription, read-only. The mall's parking software will provide
 * this later: implement `ParkingSource` against its API and swap `parkingSource`.
 * There is deliberately no payment here; renewals happen at the parking office.
 */

export interface Plate {
  /** Iranian plate parts, e.g. 12 ب 345 – ایران 67 */
  two: string;
  letter: string;
  three: string;
  region: string;
}

export interface ParkingVisit {
  id: string;
  plate: Plate;
  enteredAt: number;
  exitedAt: number | null;
}

export interface ParkingSubscription {
  plan: string;
  startsAt: number;
  endsAt: number;
  vehiclesAllowed: number;
  floor: string;
  plates: Plate[];
  recentVisits: ParkingVisit[];
  updatedAt: number;
}

export interface ParkingSource {
  getSubscription(): Promise<ParkingSubscription>;
}

const DAY = 86_400_000;

export const mockParkingSource: ParkingSource = {
  async getSubscription() {
    await new Promise((r) => setTimeout(r, PARKING_LATENCY.ms));
    const now = Date.now();
    const plates: Plate[] = [
      { two: '12', letter: 'ب', three: '345', region: '67' },
      { two: '48', letter: 'ج', three: '219', region: '10' },
    ];
    return {
      plan: 'اشتراک ماهانه غرفه‌دار',
      startsAt: now - 18 * DAY,
      endsAt: now + 12 * DAY,
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
        {
          id: 'v3',
          plate: plates[0]!,
          enteredAt: now - 50 * 3600_000,
          exitedAt: now - 40 * 3600_000,
        },
      ],
      updatedAt: now - 4 * 60_000,
    };
  },
};

export const PARKING_LATENCY = { ms: 500 };

export let parkingSource: ParkingSource = mockParkingSource;

/** For tests (and later the real client). */
export function setParkingSource(source: ParkingSource) {
  parkingSource = source;
}

export type SubscriptionStatus = 'active' | 'ending' | 'expired';

export const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: 'فعال',
  ending: 'رو به اتمام',
  expired: 'منقضی',
};

export const ENDING_DAYS = 7;

export function subscriptionSummary(
  s: Pick<ParkingSubscription, 'startsAt' | 'endsAt'>,
  now = Date.now(),
) {
  const totalDays = Math.max(1, Math.round((s.endsAt - s.startsAt) / DAY));
  const daysLeft = Math.max(0, Math.ceil((s.endsAt - now) / DAY));
  const status: SubscriptionStatus =
    now >= s.endsAt ? 'expired' : daysLeft <= ENDING_DAYS ? 'ending' : 'active';
  return { totalDays, daysLeft, usedRatio: 1 - daysLeft / totalDays, status };
}
