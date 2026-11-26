import type { Rng } from '../theory';

/** Levels 1…DESIGNED_LEVELS are generated from the tables; beyond that rounds mix earlier levels. */
export const DESIGNED_LEVELS = 150;
export const STAGES_PER_LEVEL = 8;
export const LIVES_PER_LEVEL = 3;
export const HINTS_PER_LEVEL = 2;
/** After passing this level the player may step back up to the same number of levels. */
export const CHANGE_LEVEL_FROM = 10;

/** Level used to build a round: past the designed levels, a random earlier level. */
export function effectiveLevel(level: number, rng: Rng): number {
  if (level <= DESIGNED_LEVELS) return Math.max(1, level);
  return rng.int(Math.floor(DESIGNED_LEVELS / 2), DESIGNED_LEVELS);
}

/** Size of the unlocked part of an ordered pool: `start` items, one more every `every` levels. */
export function poolSize(level: number, total: number, start: number, every: number): number {
  return Math.min(total, start + Math.floor((level - 1) / every));
}

/**
 * Picks the answer from the unlocked pool, favouring the newest items (they need practice)
 * and returns up to `maxOptions` distinct choices that include it.
 */
export function pickFromPool<T>(
  pool: readonly T[],
  unlocked: number,
  rng: Rng,
  maxOptions = 6,
): { answer: T; options: T[] } {
  const open = pool.slice(0, Math.max(1, unlocked));
  const fresh = open.slice(-2);
  const answer = rng.next() < 0.35 ? rng.pick(fresh) : rng.pick(open);
  const others = rng.sample(open.filter((x) => x !== answer), Math.min(maxOptions, open.length) - 1);
  // Keep the pool order so buttons stay in a stable, learnable layout.
  const chosen = new Set([answer, ...others]);
  return { answer, options: open.filter((x) => chosen.has(x)) };
}

/** Points for a correct answer: grows strongly with level, plus a streak bonus. */
export function pointsFor(level: number, streak: number): number {
  return Math.round(100 + level * level * 0.8 + level * 15 + Math.min(streak, 10) * 10);
}
