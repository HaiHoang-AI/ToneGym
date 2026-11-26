/** Seedable pseudo-random generator so questions are reproducible in tests. */
export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  /** `count` distinct items (or all of them if there are fewer). */
  sample<T>(items: readonly T[], count: number): T[];
}

/** mulberry32: small, fast and good enough for drills. */
export function createRng(seed: number = Date.now()): Rng {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const pick = <T,>(items: readonly T[]): T => {
    if (items.length === 0) throw new Error('pick() from an empty list');
    return items[int(0, items.length - 1)] as T;
  };
  const shuffle = <T,>(items: readonly T[]): T[] => {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(0, i);
      [out[i], out[j]] = [out[j] as T, out[i] as T];
    }
    return out;
  };
  const sample = <T,>(items: readonly T[], count: number) => shuffle(items).slice(0, count);
  return { next, int, pick, shuffle, sample };
}
