import { describe, expect, it } from 'vitest';
import {
  CHORDS, INTERVALS, PROGRESSIONS, SCALES,
  buildChord, buildScale, createRng, displayNoteName, getChord, getScale, intervalNotes, invert,
  midiToFreq, midiToName, nameToMidi, openVoicing, parseProgression, parseRoman, pitchClass,
  realizeProgression, scalesContaining, transposeName,
} from './index';

describe('notes', () => {
  it('maps names and MIDI numbers both ways', () => {
    expect(nameToMidi('C4')).toBe(60);
    expect(nameToMidi('A4')).toBe(69);
    expect(nameToMidi('Eb3')).toBe(51);
    expect(midiToName(61)).toBe('C#4');
    expect(midiToName(61, 'flat')).toBe('Db4');
    expect(midiToName(21)).toBe('A0');
  });

  it('computes equal-tempered frequencies', () => {
    expect(midiToFreq(69)).toBeCloseTo(440);
    expect(midiToFreq(60)).toBeCloseTo(261.63, 1);
  });

  it('spells transpositions and solfege', () => {
    expect(transposeName('Eb4', '3M')).toBe('G4');
    expect(transposeName('F#4', '3m')).toBe('A4');
    expect(displayNoteName('F#4', 'solfege')).toBe('Fa#4');
    expect(displayNoteName('B3', 'letters')).toBe('B3');
  });
});

describe('intervals', () => {
  it('lists 24 intervals with unique ascending sizes', () => {
    expect(INTERVALS).toHaveLength(24);
    INTERVALS.forEach((iv, i) => expect(iv.semitones).toBe(i));
  });

  it('builds ascending, descending and harmonic intervals', () => {
    expect(intervalNotes(60, 'M3', 'ascending')).toEqual({ notes: [60, 64], harmonic: false });
    expect(intervalNotes(60, 'P5', 'descending')).toEqual({ notes: [60, 53], harmonic: false });
    expect(intervalNotes(60, 'M9', 'harmonic')).toEqual({ notes: [60, 74], harmonic: true });
  });
});

describe('chords', () => {
  it('has unique ids and 3–6 note formulas starting at the root', () => {
    expect(new Set(CHORDS.map((c) => c.id)).size).toBe(CHORDS.length);
    for (const c of CHORDS) {
      expect(c.formula[0]).toBe(0);
      expect(c.formula.length).toBeGreaterThanOrEqual(3);
      expect(c.formula.length).toBeLessThanOrEqual(6);
      expect([...c.formula].sort((a, b) => a - b)).toEqual([...c.formula]);
    }
  });

  it('builds root position and inversions with the right bass', () => {
    const cMaj = getChord('maj');
    expect(buildChord(60, cMaj)).toEqual([60, 64, 67]);
    expect(buildChord(60, cMaj, { inversion: 1 })).toEqual([64, 67, 72]);
    expect(buildChord(60, cMaj, { inversion: 2 })).toEqual([67, 72, 76]);
  });

  it('keeps the requested bass lowest for every inversion of every chord', () => {
    for (const c of CHORDS) {
      const root = buildChord(48, c);
      for (let inv = 0; inv < c.formula.length; inv++) {
        const notes = invert(root, inv);
        const expectedBassPc = pitchClass(48 + (c.formula[inv] as number));
        expect(pitchClass(notes[0] as number)).toBe(expectedBassPc);
        expect(Math.min(...notes)).toBe(notes[0]);
        expect(notes).toHaveLength(c.formula.length);
      }
    }
  });

  it('spreads open voicings without changing the bass', () => {
    expect(openVoicing([60, 64, 67])).toEqual([60, 67, 76]);
  });
});

describe('scales', () => {
  it('lists 17 scales', () => {
    expect(SCALES).toHaveLength(17);
    expect(new Set(SCALES.map((s) => s.id)).size).toBe(17);
  });

  it('builds ascending and descending scales with the octave', () => {
    expect(buildScale(60, getScale('major'))).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
    expect(buildScale(60, getScale('minorPentatonic'), 'descending')).toEqual([72, 70, 67, 65, 63, 60]);
  });

  it('finds scales that contain given notes', () => {
    // C, E, F# from root C: Lydian has them, major does not.
    const ids = scalesContaining([0, 4, 6], 0).map((s) => s.id);
    expect(ids).toContain('lydian');
    expect(ids).not.toContain('major');
  });
});

describe('roman numerals', () => {
  it('parses quality, offset and inversion', () => {
    expect(parseRoman('V')).toMatchObject({ offset: 7, inversion: 0, chord: { id: 'maj' } });
    expect(parseRoman('vi')).toMatchObject({ offset: 9, chord: { id: 'min' } });
    expect(parseRoman('vii°')).toMatchObject({ offset: 11, chord: { id: 'dim' } });
    expect(parseRoman('bVII')).toMatchObject({ offset: 10, chord: { id: 'maj' } });
    expect(parseRoman('V7')).toMatchObject({ chord: { id: 'dom7' }, inversion: 0 });
    expect(parseRoman('Imaj7')).toMatchObject({ chord: { id: 'maj7' } });
    expect(parseRoman('ii7')).toMatchObject({ chord: { id: 'min7' } });
    expect(parseRoman('iiø7')).toMatchObject({ chord: { id: 'm7b5' } });
    expect(parseRoman('V6')).toMatchObject({ chord: { id: 'maj' }, inversion: 1 });
    expect(parseRoman('IV6/4')).toMatchObject({ chord: { id: 'maj' }, inversion: 2 });
    expect(parseRoman('V65')).toMatchObject({ chord: { id: 'dom7' }, inversion: 1 });
    expect(parseRoman('V42')).toMatchObject({ chord: { id: 'dom7' }, inversion: 3 });
  });

  it('rejects nonsense', () => {
    expect(() => parseRoman('X')).toThrow();
  });

  it('parses every catalog progression', () => {
    for (const p of PROGRESSIONS) expect(parseProgression(p.numerals).length).toBeGreaterThanOrEqual(3);
  });

  it('realizes progressions with the bass below smooth upper voices', () => {
    const realized = realizeProgression(parseProgression('I-V6-vi-IV'), 60);
    expect(realized.map((c) => pitchClass(c.bass))).toEqual([0, 11, 9, 5]);
    expect(realized[0]?.upper).toEqual([60, 64, 67]);
    for (const c of realized) {
      expect(c.bass).toBeLessThan(Math.min(...c.upper));
      expect(c.notes[0]).toBe(c.bass);
    }
    // Voice leading: no upper voice jumps more than a 4th between neighbours.
    for (let i = 1; i < realized.length; i++) {
      const prev = realized[i - 1]!.upper;
      realized[i]!.upper.forEach((n, v) => expect(Math.abs(n - prev[v]!)).toBeLessThanOrEqual(5));
    }
  });
});

describe('rng', () => {
  it('is reproducible for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 10 }, () => a.int(0, 100));
    const seqB = Array.from({ length: 10 }, () => b.int(0, 100));
    expect(seqA).toEqual(seqB);
  });

  it('samples distinct items', () => {
    const rng = createRng(1);
    const picked = rng.sample([1, 2, 3, 4, 5], 3);
    expect(new Set(picked).size).toBe(3);
  });
});
