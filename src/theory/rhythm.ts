import type { Rng } from './rng';

/** One rhythmic event; durations are in beats (quarter note = 1). */
export interface RhythmEvent {
  dur: number;
  rest: boolean;
}

export interface RhythmPattern {
  beatsPerBar: number;
  bars: number;
  events: RhythmEvent[];
}

export type RhythmDifficulty = 'easy' | 'medium' | 'hard';

type Cell = RhythmEvent[];
const n = (dur: number): RhythmEvent => ({ dur, rest: false });
const r = (dur: number): RhythmEvent => ({ dur, rest: true });

/** Building blocks per difficulty, each filling one or two beats. */
const CELLS: Record<RhythmDifficulty, { one: Cell[]; two: Cell[] }> = {
  easy: {
    one: [[n(1)], [n(0.5), n(0.5)]],
    two: [[n(2)]],
  },
  medium: {
    one: [[n(1)], [n(0.5), n(0.5)], [r(1)], [r(0.5), n(0.5)], [n(0.5), r(0.5)]],
    two: [[n(2)], [n(0.5), n(1), n(0.5)], [n(1.5), n(0.5)]],
  },
  hard: {
    one: [
      [n(0.5), n(0.5)], [n(0.75), n(0.25)], [n(0.25), n(0.75)], [n(0.25), n(0.25), n(0.5)],
      [n(0.5), n(0.25), n(0.25)], [n(0.25), n(0.25), n(0.25), n(0.25)], [r(0.5), n(0.5)], [r(0.25), n(0.75)],
    ],
    two: [[n(1.5), n(0.5)], [n(0.5), n(1), n(0.5)], [n(0.75), n(0.75), n(0.5)]],
  },
};

/** A bar-by-bar random rhythm. Every bar starts with a note so the downbeat is always audible. */
export function generateRhythm(rng: Rng, difficulty: RhythmDifficulty, beatsPerBar = 4, bars = 2): RhythmPattern {
  const events: RhythmEvent[] = [];
  for (let b = 0; b < bars; b++) {
    let left = beatsPerBar;
    const bar: RhythmEvent[] = [];
    while (left > 0) {
      const cells = CELLS[difficulty];
      const useTwo = left >= 2 && rng.next() < 0.3;
      const cell = rng.pick(useTwo ? cells.two : cells.one);
      bar.push(...cell.map((e) => ({ ...e })));
      left -= useTwo ? 2 : 1;
    }
    if (bar[0]!.rest) bar[0] = { ...bar[0]!, rest: false };
    events.push(...bar);
  }
  return { beatsPerBar, bars, events };
}

/** Beat positions (from the start of the pattern) where notes begin. */
export function onsets(p: RhythmPattern): number[] {
  const out: number[] = [];
  let t = 0;
  for (const e of p.events) {
    if (!e.rest) out.push(t);
    t += e.dur;
  }
  return out;
}

export function totalBeats(p: RhythmPattern): number {
  return p.events.reduce((s, e) => s + e.dur, 0);
}

export interface TapGrade {
  /** Each expected onset: hit or missed, and the timing error of the hit (ms, + = late). */
  expected: { at: number; hit: boolean; errorMs: number | null }[];
  /** Taps that matched no onset. */
  extra: number[];
  passed: boolean;
  /** 0–1 share of onsets hit. */
  accuracy: number;
}

/**
 * Matches taps (ms from the pattern start) to expected onsets (ms). Each tap is used at most once,
 * nearest first. Passing needs every onset hit within `toleranceMs` and no extra taps.
 */
export function gradeTaps(expectedMs: readonly number[], tapsMs: readonly number[], toleranceMs: number): TapGrade {
  const used = new Set<number>();
  const expected = expectedMs.map((at) => {
    let best = -1;
    let bestErr = Infinity;
    tapsMs.forEach((tap, i) => {
      if (used.has(i)) return;
      const err = Math.abs(tap - at);
      if (err < bestErr) {
        bestErr = err;
        best = i;
      }
    });
    if (best >= 0 && bestErr <= toleranceMs) {
      used.add(best);
      return { at, hit: true, errorMs: Math.round(tapsMs[best]! - at) };
    }
    return { at, hit: false, errorMs: null };
  });
  const extra = tapsMs.filter((_, i) => !used.has(i));
  const hits = expected.filter((e) => e.hit).length;
  return { expected, extra: [...extra], passed: hits === expected.length && extra.length === 0, accuracy: expected.length ? hits / expected.length : 1 };
}

/** VexFlow duration code for a beat length (quarter = 1). */
export function vexDuration(dur: number): { code: string; dots: number } {
  const table: Record<string, { code: string; dots: number }> = {
    '4': { code: 'w', dots: 0 },
    '3': { code: 'h', dots: 1 },
    '2': { code: 'h', dots: 0 },
    '1.5': { code: 'q', dots: 1 },
    '1': { code: 'q', dots: 0 },
    '0.75': { code: '8', dots: 1 },
    '0.5': { code: '8', dots: 0 },
    '0.25': { code: '16', dots: 0 },
  };
  const hit = table[String(dur)];
  if (!hit) throw new Error(`No notation for duration ${dur}`);
  return hit;
}
