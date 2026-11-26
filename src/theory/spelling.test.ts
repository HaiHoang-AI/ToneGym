import { describe, expect, it } from 'vitest';
import { CHORDS, SCALES, getChord, getScale, invertSpelled, nameMidi, pitchClass, spellChord, spellInterval, spellScale, toVexKey } from './index';

describe('spelling', () => {
  it('converts names to VexFlow keys', () => {
    expect(toVexKey('C4')).toBe('c/4');
    expect(toVexKey('F#5')).toBe('f#/5');
    expect(toVexKey('Bb3')).toBe('bb/3');
  });

  it('spells intervals by letter distance', () => {
    expect(spellInterval('E4', 'M3')).toBe('G#4');
    expect(spellInterval('F4', 'TT')).toBe('B4');
    expect(spellInterval('C4', 'm3')).toBe('Eb4');
    expect(spellInterval('G4', 'P5', 'down')).toBe('C4');
  });

  it('spells common chords', () => {
    expect(spellChord('D4', getChord('maj'))).toEqual(['D4', 'F#4', 'A4']);
    expect(spellChord('B3', getChord('dim'))).toEqual(['B3', 'D4', 'F4']);
    expect(spellChord('C4', getChord('dim7'))).toEqual(['C4', 'Eb4', 'Gb4', 'Bbb4']);
    expect(spellChord('C4', getChord('aug'))).toEqual(['C4', 'E4', 'G#4']);
    expect(spellChord('A3', getChord('m7b5'))).toEqual(['A3', 'C4', 'Eb4', 'G4']);
  });

  it('keeps every chord spelling on the right pitches', () => {
    for (const def of CHORDS) {
      const names = spellChord('C4', def);
      names.forEach((n, i) => expect(pitchClass(nameMidi(n))).toBe(pitchClass(60 + def.formula[i]!)));
    }
  });

  it('spells scales on the right pitches', () => {
    expect(spellScale('D4', 'major', getScale('major').formula)).toEqual(['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5']);
    expect(spellScale('F4', 'naturalMinor', getScale('naturalMinor').formula)).toEqual(['F4', 'G4', 'Ab4', 'Bb4', 'C5', 'Db5', 'Eb5', 'F5']);
    for (const sc of SCALES) {
      const names = spellScale('E4', sc.id, sc.formula);
      names.slice(0, -1).forEach((n, i) => expect(nameMidi(n)).toBe(64 + sc.formula[i]!));
    }
  });

  it('inverts spelled chords with the right bass', () => {
    expect(invertSpelled(['C4', 'E4', 'G4'], 1)).toEqual(['E4', 'G4', 'C5']);
    expect(invertSpelled(['C4', 'E4', 'G4', 'Bb4'], 3)).toEqual(['Bb4', 'C5', 'E5', 'G5']);
  });
});
