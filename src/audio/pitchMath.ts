/** Fractional MIDI number of a frequency (A4 = 69 at `a4` Hz). */
export function freqToMidiFloat(freq: number, a4 = 440): number {
  return 69 + 12 * Math.log2(freq / a4);
}

export function midiToFreqAt(midi: number, a4 = 440): number {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

/** Nearest equal-tempered note and how far off it is, in cents (−50…+50). */
export function nearestNote(freq: number, a4 = 440): { midi: number; cents: number } {
  const m = freqToMidiFloat(freq, a4);
  const midi = Math.round(m);
  return { midi, cents: Math.round((m - midi) * 100) };
}

/**
 * Cents between a sung pitch and a target note. With `octaveFree`, the closest octave of the
 * target counts (so a low voice can sing a high melody an octave down).
 */
export function centsFromTarget(sungMidi: number, target: number, octaveFree: boolean): number {
  let diff = (sungMidi - target) * 100;
  if (octaveFree) diff = ((((diff + 600) % 1200) + 1200) % 1200) - 600;
  return diff;
}

export function matches(sungMidi: number, target: number, toleranceCents: number, octaveFree: boolean): boolean {
  return Math.abs(centsFromTarget(sungMidi, target, octaveFree)) <= toleranceCents;
}

/**
 * Detects a held note: reports the average pitch once readings have stayed within `spreadCents`
 * of each other for `holdMs`.
 */
export class StabilityTracker {
  private readings: { t: number; m: number }[] = [];

  constructor(private holdMs = 450, private spreadCents = 35) {}

  reset() {
    this.readings = [];
  }

  /** Feed a reading (fractional MIDI or null for silence). Returns the held pitch, if any. */
  push(midi: number | null, t: number): number | null {
    if (midi === null) {
      this.readings = [];
      return null;
    }
    this.readings.push({ t, m: midi });
    // Drop readings that disagree with the newest one.
    while (this.readings.length && Math.abs(this.readings[0]!.m - midi) * 100 > this.spreadCents) this.readings.shift();
    while (this.readings.length > 1 && t - this.readings[1]!.t >= this.holdMs) this.readings.shift();
    const first = this.readings[0]!;
    if (t - first.t >= this.holdMs) {
      const avg = this.readings.reduce((s, r) => s + r.m, 0) / this.readings.length;
      this.readings = [];
      return avg;
    }
    return null;
  }
}

export type VoiceType = 'bass' | 'baritone' | 'tenor' | 'alto' | 'mezzo' | 'soprano';

/** Typical comfortable ranges (MIDI). */
export const VOICE_RANGES: Record<VoiceType, [number, number]> = {
  bass: [40, 64], // E2–E4
  baritone: [45, 69], // A2–A4
  tenor: [48, 72], // C3–C5
  alto: [53, 77], // F3–F5
  mezzo: [57, 81], // A3–A5
  soprano: [60, 84], // C4–C6
};

/** The voice type whose typical range overlaps the measured range the most. */
export function classifyVoice(low: number, high: number): VoiceType {
  let best: VoiceType = 'baritone';
  let bestScore = -Infinity;
  for (const [type, [lo, hi]] of Object.entries(VOICE_RANGES) as [VoiceType, [number, number]][]) {
    const overlap = Math.min(high, hi) - Math.max(low, lo);
    const centreGap = Math.abs((low + high) / 2 - (lo + hi) / 2);
    const score = overlap - centreGap * 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = type;
    }
  }
  return best;
}

/** Shifts a melody by octaves so it sits inside the singer's range as well as possible. */
export function fitToRange(notes: readonly number[], low: number, high: number): number[] {
  let shift = 0;
  const lo = Math.min(...notes);
  const hi = Math.max(...notes);
  while (lo + shift < low && hi + shift + 12 <= high + 2) shift += 12;
  while (hi + shift > high && lo + shift - 12 >= low - 2) shift -= 12;
  return notes.map((n) => n + shift);
}
