import { describe, expect, it } from 'vitest';
import { distribute, isoWeekKey, msUntilWeekEnd, PRIZE_SHARES, themeFor } from './contest';

describe('contest', () => {
  it('computes ISO week keys', () => {
    expect(isoWeekKey(new Date(2026, 10, 26))).toBe('2026-W48');
    expect(isoWeekKey(new Date(2026, 0, 1))).toBe('2026-W01');
    expect(isoWeekKey(new Date(2027, 0, 1))).toBe('2026-W53');
  });

  it('rotates themes week by week', () => {
    expect(themeFor('2026-W48')).not.toEqual(themeFor('2026-W49'));
  });

  it('ends the week at Monday midnight', () => {
    const thu = new Date(2026, 10, 26, 12);
    expect(msUntilWeekEnd(thu)).toBe(new Date(2026, 10, 30).getTime() - thu.getTime());
  });

  it('pays the whole jackpot, shares 100% and splits ties', () => {
    expect(PRIZE_SHARES.reduce((a, b) => a + b, 0)).toBe(100);
    const one = distribute(30, [{ profileId: 1, best: 12 }]);
    expect(one.get(1)).toBe(30);
    const three = distribute(100, [{ profileId: 1, best: 20 }, { profileId: 2, best: 30 }, { profileId: 3, best: 10 }]);
    expect([...three.values()].reduce((a, b) => a + b, 0)).toBe(100);
    expect(three.get(2)!).toBeGreaterThan(three.get(1)!);
    expect(three.get(1)!).toBeGreaterThan(three.get(3)!);
    const tie = distribute(70, [{ profileId: 1, best: 5 }, { profileId: 2, best: 5 }]);
    expect(tie.get(1)).toBe(tie.get(2)! + (70 % 2));
    expect(distribute(50, [{ profileId: 1, best: 0 }]).size).toBe(0);
  });
});
