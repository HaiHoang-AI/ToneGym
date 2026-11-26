import { describe, expect, it } from 'vitest';
import { centsFromTarget, classifyVoice, fitToRange, matches, midiToFreqAt, nearestNote, StabilityTracker } from './pitchMath';

describe('pitch math', () => {
  it('finds the nearest note and cents', () => {
    expect(nearestNote(440)).toEqual({ midi: 69, cents: 0 });
    expect(nearestNote(midiToFreqAt(60.2))).toEqual({ midi: 60, cents: 20 });
    expect(nearestNote(432, 432)).toEqual({ midi: 69, cents: 0 });
  });

  it('compares with or without octave freedom', () => {
    expect(centsFromTarget(48.1, 60, false)).toBeCloseTo(-1190);
    expect(centsFromTarget(48.1, 60, true)).toBeCloseTo(10);
    expect(matches(60.3, 60, 40, false)).toBe(true);
    expect(matches(60.6, 60, 40, false)).toBe(false);
    expect(matches(72.1, 60, 40, true)).toBe(true);
  });

  it('reports a pitch only after it is held steadily', () => {
    const t = new StabilityTracker(400, 30);
    expect(t.push(60.0, 0)).toBeNull();
    expect(t.push(60.1, 200)).toBeNull();
    expect(t.push(60.05, 420)).toBeCloseTo(60.05, 1);
    // A wobbly voice never settles.
    const w = new StabilityTracker(400, 30);
    for (let i = 0; i < 20; i++) expect(w.push(60 + (i % 2 ? 0.6 : 0), i * 50)).toBeNull();
    // Silence resets.
    const s = new StabilityTracker(400, 30);
    s.push(60, 0);
    s.push(null, 200);
    expect(s.push(60, 300)).toBeNull();
  });

  it('classifies voice types', () => {
    expect(classifyVoice(41, 64)).toBe('bass');
    expect(classifyVoice(48, 72)).toBe('tenor');
    expect(classifyVoice(60, 84)).toBe('soprano');
  });

  it('moves melodies into the singing range by octaves', () => {
    expect(fitToRange([72, 74, 76], 48, 67)).toEqual([60, 62, 64]);
    expect(fitToRange([48, 50], 60, 79)).toEqual([60, 62]);
    expect(fitToRange([60, 64], 55, 70)).toEqual([60, 64]);
  });
});
