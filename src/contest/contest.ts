import type { Bilingual } from '../theory';

export const ENTRY_FEE = 4;
/** Of each entry fee, this many coins go to the week's jackpot. */
export const TO_JACKPOT = 3;
export const SPRINT_SECONDS = 60;
/** Shares of the jackpot for places 1–20 (sums to 100%). */
export const PRIZE_SHARES = [20, 15, 11, 7, 7, 4, 4, 4, 4, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];

export interface WeekTheme {
  gameId: string;
  level: number;
  name: Bilingual;
}

export const THEMES: readonly WeekTheme[] = [
  { gameId: 'inversions', level: 20, name: { vi: 'Vua thế đảo', en: 'Inversion King' } },
  { gameId: 'chord-id', level: 25, name: { vi: 'Thần hợp âm', en: 'Chord Wizard' } },
  { gameId: 'ascending-intervals', level: 30, name: { vi: 'Đo quãng thần tốc', en: 'Interval Sprint' } },
  { gameId: 'scale-id', level: 20, name: { vi: 'Thám tử âm giai', en: 'Scale Detective' } },
  { gameId: 'progressions', level: 15, name: { vi: 'Tay lái vòng hợp âm', en: 'Progression Driver' } },
  { gameId: 'treble-reading', level: 25, name: { vi: 'Mắt đọc khóa Sol', en: 'Treble Eye' } },
  { gameId: 'harmonic-intervals', level: 25, name: { vi: 'Tai quãng hòa âm', en: 'Harmonic Ear' } },
  { gameId: 'bass-reading', level: 25, name: { vi: 'Mắt đọc khóa Fa', en: 'Bass Eye' } },
];

/** ISO week key, e.g. "2026-W48" (weeks start on Monday). */
export function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function weekNumber(key: string): number {
  const [y, w] = key.split('-W').map(Number) as [number, number];
  return y * 53 + w;
}

export function themeFor(key: string): WeekTheme {
  return THEMES[weekNumber(key) % THEMES.length]!;
}

/** Milliseconds until next Monday 00:00 local time. */
export function msUntilWeekEnd(now: Date): number {
  const next = new Date(now);
  next.setHours(0, 0, 0, 0);
  const day = next.getDay() || 7;
  next.setDate(next.getDate() + (8 - day));
  return next.getTime() - now.getTime();
}

export interface Placement {
  profileId: number;
  best: number;
}

/**
 * Splits the jackpot by place. Ties share the combined prize of their places. Shares for places
 * nobody reached go to the winner(s), so the whole jackpot is always paid out.
 */
export function distribute(jackpot: number, ranking: readonly Placement[]): Map<number, number> {
  const sorted = [...ranking].filter((r) => r.best > 0).sort((a, b) => b.best - a.best);
  const out = new Map<number, number>();
  if (sorted.length === 0 || jackpot <= 0) return out;
  let i = 0;
  while (i < sorted.length && i < PRIZE_SHARES.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1]!.best === sorted[i]!.best) j++;
    const share = PRIZE_SHARES.slice(i, Math.min(j + 1, PRIZE_SHARES.length)).reduce((a, b) => a + b, 0);
    const each = (jackpot * share) / 100 / (j - i + 1);
    for (let k = i; k <= j; k++) out.set(sorted[k]!.profileId, each);
    i = j + 1;
  }
  const paid = [...out.values()].reduce((a, b) => a + b, 0);
  const leftover = jackpot - paid;
  const winners = sorted.filter((r) => r.best === sorted[0]!.best);
  for (const w of winners) out.set(w.profileId, (out.get(w.profileId) ?? 0) + leftover / winners.length);
  // Whole coins only; rounding remainders go to first place.
  let total = 0;
  for (const [id, v] of out) {
    const rounded = Math.floor(v);
    out.set(id, rounded);
    total += rounded;
  }
  out.set(winners[0]!.profileId, (out.get(winners[0]!.profileId) ?? 0) + (jackpot - total));
  return out;
}
