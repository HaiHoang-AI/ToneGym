import type { Rng } from '../theory';
import type { GameDef } from '../games/types';
import type { GameProgress } from '../db/schema';

export const WORKOUT_SIZE = 5;
export const WORKOUT_COINS = 30;

const pad = (n: number) => String(n).padStart(2, '0');

/** Workout day key in local time; the day only turns over at `resetHour` (4 AM by default). */
export function workoutDateKey(now: Date, resetHour = 4): string {
  const shifted = new Date(now.getTime() - resetHour * 3600_000);
  return `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}-${pad(shifted.getDate())}`;
}

/** The day key before `key` (YYYY-MM-DD). */
export function previousDateKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d - 1, 12);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Stable per-day seed, so a refresh does not reshuffle today's workout. */
export function daySeed(key: string, profileId: number): number {
  let h = 2166136261 ^ profileId;
  for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/**
 * Picks the day's games: pinned games first, then the weakest games (fewest levels passed),
 * spreading over different skills before repeating one.
 */
export function pickWorkoutGames(
  available: readonly GameDef[],
  progress: ReadonlyMap<string, GameProgress>,
  pinned: readonly string[],
  rng: Rng,
  size = WORKOUT_SIZE,
): string[] {
  const ids = new Set(available.map((g) => g.id));
  const chosen = pinned.filter((id) => ids.has(id)).slice(0, size);
  const usedSkills = new Set(chosen.map((id) => available.find((g) => g.id === id)!.skill));
  const weight = (g: GameDef) => 1 / (1 + (progress.get(g.id)?.levelsPassed ?? 0)) + rng.next() * 0.35;
  const rest = available
    .filter((g) => !chosen.includes(g.id))
    .map((g) => ({ g, w: weight(g) }))
    .sort((a, b) => b.w - a.w);
  for (const { g } of rest) {
    if (chosen.length >= size) break;
    if (!usedSkills.has(g.skill)) {
      chosen.push(g.id);
      usedSkills.add(g.skill);
    }
  }
  for (const { g } of rest) {
    if (chosen.length >= size) break;
    if (!chosen.includes(g.id)) chosen.push(g.id);
  }
  return chosen;
}

/** New streak value when a workout is finished on `today`. */
export function nextStreak(lastWorkoutDate: string | null, today: string, streak: number): number {
  if (lastWorkoutDate === today) return streak;
  if (lastWorkoutDate && previousDateKey(today) === lastWorkoutDate) return streak + 1;
  return 1;
}
