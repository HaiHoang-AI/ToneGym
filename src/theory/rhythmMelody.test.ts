import { describe, expect, it } from 'vitest';
import { createRng, degreeToMidi, generateMelody, generateRhythm, gradeTaps, onsets, pitchClass, totalBeats, vexDuration } from './index';

describe('rhythm', () => {
  it('fills every bar exactly at every difficulty and time signature', () => {
    const rng = createRng(5);
    for (const d of ['easy', 'medium', 'hard'] as const) {
      for (const beats of [3, 4, 5]) {
        for (let i = 0; i < 50; i++) {
          const p = generateRhythm(rng, d, beats, 2);
          expect(totalBeats(p)).toBeCloseTo(beats * 2);
          // Every duration can be written in notation.
          for (const e of p.events) expect(() => vexDuration(e.dur)).not.toThrow();
        }
      }
    }
  });

  it('lists onsets, skipping rests', () => {
    const p = { beatsPerBar: 4, bars: 1, events: [{ dur: 1, rest: false }, { dur: 1, rest: true }, { dur: 0.5, rest: false }, { dur: 0.5, rest: false }, { dur: 1, rest: false }] };
    expect(onsets(p)).toEqual([0, 2, 2.5, 3]);
  });

  it('grades taps with a tolerance and rejects extra taps', () => {
    const expected = [0, 500, 1000, 1500];
    expect(gradeTaps(expected, [10, 490, 1030, 1480], 80).passed).toBe(true);
    const late = gradeTaps(expected, [10, 490, 1200, 1480], 80);
    expect(late.passed).toBe(false);
    expect(late.expected[2]!.hit).toBe(false);
    const extra = gradeTaps(expected, [0, 250, 500, 1000, 1500], 80);
    expect(extra.passed).toBe(false);
    expect(extra.extra).toEqual([250]);
    expect(gradeTaps(expected, [0, 500, 1000, 1500], 80).expected[1]!.errorMs).toBe(0);
  });
});

describe('melody', () => {
  it('maps scale degrees across octaves', () => {
    expect(degreeToMidi(60, 'major', 0)).toBe(60);
    expect(degreeToMidi(60, 'major', 2)).toBe(64);
    expect(degreeToMidi(60, 'major', 7)).toBe(72);
    expect(degreeToMidi(60, 'major', -1)).toBe(59);
  });

  it('stays inside the allowed degrees and leap size', () => {
    const rng = createRng(9);
    for (let i = 0; i < 100; i++) {
      const m = generateMelody(rng, 60, { length: 6, scale: 'major', degrees: [0, 1, 2, 3, 4, 5, 6, 7], maxLeap: 3 });
      expect(m).toHaveLength(6);
      for (const n of m) {
        expect(n).toBeGreaterThanOrEqual(60);
        expect(n).toBeLessThanOrEqual(72);
        expect([0, 2, 4, 5, 7, 9, 11]).toContain(pitchClass(n));
      }
      // Three scale steps span at most a tritone (6 semitones) in the major scale.
      for (let k = 1; k < m.length; k++) expect(Math.abs(m[k]! - m[k - 1]!)).toBeLessThanOrEqual(6);
    }
  });
});
