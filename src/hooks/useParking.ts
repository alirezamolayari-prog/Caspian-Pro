import { useCallback, useEffect, useState } from 'react';
import { parkingSource, type ParkingSubscription } from '../api/parking';

type State =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: ParkingSubscription };

let cache: ParkingSubscription | null = null;

/** Loads the parking subscription once and keeps the last answer for the hub chip. */
export function useParking() {
  const [state, setState] = useState<State>(() =>
    cache ? { status: 'ready', data: cache } : { status: 'loading' },
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    parkingSource.getSubscription().then(
      (data) => {
        cache = data;
        if (alive) setState({ status: 'ready', data });
      },
      () => {
        if (alive && !cache) setState({ status: 'error' });
      },
    );
    return () => {
      alive = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((a) => a + 1);
  }, []);

  return { state, retry };
}

export function clearParkingCache() {
  cache = null;
}
