import { getScale } from './scales';
import type { Rng } from './rng';

export interface MelodySpec {
  /** Number of notes. */
  length: number;
  /** Scale used for the notes (id from SCALES). */
  scale: string;
  /** Scale degrees allowed (0-based indexes into the scale, may exceed one octave). */
  degrees: number[];
  /** Largest jump between neighbouring notes, in scale steps. */
  maxLeap: number;
}

/** Scale degree index → MIDI note, extending across octaves. */
export function degreeToMidi(tonic: number, scaleId: string, degree: number): number {
  const f = getScale(scaleId).formula;
  const octave = Math.floor(degree / f.length);
  const idx = ((degree % f.length) + f.length) % f.length;
  return tonic + 12 * octave + f[idx]!;
}

/**
 * A singable melody: starts on a stable degree (1, 3 or 5 of the allowed set), moves mostly
 * by step, leaps at most `maxLeap` scale steps, and stays within the allowed degrees.
 */
export function generateMelody(rng: Rng, tonic: number, spec: MelodySpec): number[] {
  const allowed = [...new Set(spec.degrees)].sort((a, b) => a - b);
  const starts = allowed.filter((d) => [0, 2, 4].includes(((d % 7) + 7) % 7));
  let current = rng.pick(starts.length ? starts : allowed);
  const out = [current];
  while (out.length < spec.length) {
    const candidates = allowed.filter((d) => d !== current && Math.abs(d - current) <= spec.maxLeap);
    const pool = candidates.length ? candidates : allowed.filter((d) => d !== current);
    // Prefer steps: weight 3 for neighbours, 1 for leaps.
    const weighted = pool.flatMap((d) => (Math.abs(d - current) <= 1 ? [d, d, d] : [d]));
    current = rng.pick(weighted);
    out.push(current);
  }
  return out.map((d) => degreeToMidi(tonic, spec.scale, d));
}

/** All notes of a scale between two degrees (inclusive), for building answer keyboards. */
export function scaleNotes(tonic: number, scaleId: string, fromDegree: number, toDegree: number): number[] {
  const out: number[] = [];
  for (let d = fromDegree; d <= toDegree; d++) out.push(degreeToMidi(tonic, scaleId, d));
  return out;
}
