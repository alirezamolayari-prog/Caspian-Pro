import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_REJECTIONS, sessionProgress, useLoading } from './loading';
import { passStatus } from './security';

describe('loading store', () => {
  beforeEach(() => {
    useLoading.setState({
      session: null,
      pendingExtension: false,
      approvedExtensions: 0,
      rejections: 0,
      locked: false,
    });
  });

  it('starts a session with the chosen length', () => {
    useLoading.getState().start('parking', 30, '09121234567', 0);
    const s = useLoading.getState().session!;
    expect(s.endsAt - s.startedAt).toBe(30 * 60_000);
    expect(sessionProgress(s, 15 * 60_000)).toMatchObject({
      remainingSec: 900,
      ratio: 0.5,
      expired: false,
    });
    expect(sessionProgress(s, 31 * 60_000).expired).toBe(true);
  });

  it('adds 15 minutes when an extension is approved', () => {
    const now = Date.now();
    useLoading.getState().start('safarkhani', 15, '09121234567', now);
    useLoading.getState().beginExtension();
    useLoading.getState().resolveExtension(true);
    const s = useLoading.getState();
    expect(s.session!.endsAt).toBe(now + 30 * 60_000);
    expect(s.pendingExtension).toBe(false);
    expect(s.approvedExtensions).toBe(1);
  });

  it(`locks loading access after ${MAX_REJECTIONS} rejected extensions`, () => {
    useLoading.getState().start('safarkhani', 15, '09121234567');
    useLoading.getState().resolveExtension(false);
    expect(useLoading.getState()).toMatchObject({ rejections: 1, locked: false });
    useLoading.getState().resolveExtension(false);
    expect(useLoading.getState()).toMatchObject({ rejections: 2, locked: true });
    useLoading.getState().adminReactivate();
    expect(useLoading.getState()).toMatchObject({ rejections: 0, locked: false });
  });
});

describe('staff pass status', () => {
  const pass = { date: '2026-10-19', from: '09:00', to: '18:00' };
  it('is upcoming, valid, then expired', () => {
    expect(passStatus(pass, new Date(2026, 9, 19, 8, 0).getTime())).toBe('upcoming');
    expect(passStatus(pass, new Date(2026, 9, 19, 12, 0).getTime())).toBe('valid');
    expect(passStatus(pass, new Date(2026, 9, 19, 19, 0).getTime())).toBe('expired');
  });
});
