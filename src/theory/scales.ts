import type { Bilingual } from './names';

export interface ScaleDef {
  id: string;
  /** Semitones above the root, ascending, without the octave. */
  formula: readonly number[];
  /** "primary" = the common set offered as a quick preset. */
  group: 'primary' | 'secondary';
  name: Bilingual;
}

const sc = (id: string, formula: number[], group: ScaleDef['group'], vi: string, en: string): ScaleDef => ({
  id, formula, group, name: { vi, en },
});

export const SCALES: readonly ScaleDef[] = [
  sc('major', [0, 2, 4, 5, 7, 9, 11], 'primary', 'Trưởng (Ionian)', 'Major (Ionian)'),
  sc('naturalMinor', [0, 2, 3, 5, 7, 8, 10], 'primary', 'Thứ tự nhiên (Aeolian)', 'Natural minor (Aeolian)'),
  sc('harmonicMinor', [0, 2, 3, 5, 7, 8, 11], 'primary', 'Thứ hòa âm', 'Harmonic minor'),
  sc('melodicMinor', [0, 2, 3, 5, 7, 9, 11], 'primary', 'Thứ giai điệu', 'Melodic minor'),
  sc('dorian', [0, 2, 3, 5, 7, 9, 10], 'primary', 'Dorian', 'Dorian'),
  sc('phrygian', [0, 1, 3, 5, 7, 8, 10], 'secondary', 'Phrygian', 'Phrygian'),
  sc('lydian', [0, 2, 4, 6, 7, 9, 11], 'secondary', 'Lydian', 'Lydian'),
  sc('mixolydian', [0, 2, 4, 5, 7, 9, 10], 'primary', 'Mixolydian', 'Mixolydian'),
  sc('locrian', [0, 1, 3, 5, 6, 8, 10], 'secondary', 'Locrian', 'Locrian'),
  sc('majorPentatonic', [0, 2, 4, 7, 9], 'primary', 'Ngũ cung trưởng', 'Major pentatonic'),
  sc('minorPentatonic', [0, 3, 5, 7, 10], 'primary', 'Ngũ cung thứ', 'Minor pentatonic'),
  sc('blues', [0, 3, 5, 6, 7, 10], 'primary', 'Blues', 'Blues'),
  sc('wholeTone', [0, 2, 4, 6, 8, 10], 'secondary', 'Toàn cung', 'Whole tone'),
  sc('chromatic', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 'secondary', 'Cung chromatic', 'Chromatic'),
  sc('bebopMajor', [0, 2, 4, 5, 7, 8, 9, 11], 'secondary', 'Bebop trưởng', 'Bebop major'),
  sc('bebopDorian', [0, 2, 3, 4, 5, 7, 9, 10], 'secondary', 'Bebop Dorian', 'Bebop Dorian'),
  sc('bebopDominant', [0, 2, 4, 5, 7, 9, 10, 11], 'secondary', 'Bebop át', 'Bebop dominant'),
];

const BY_ID = new Map(SCALES.map((s) => [s.id, s]));

export function getScale(id: string): ScaleDef {
  const def = BY_ID.get(id);
  if (!def) throw new Error(`Unknown scale ${id}`);
  return def;
}

export type ScaleDirection = 'ascending' | 'descending';

/** Scale notes including the octave on top, in playing order. */
export function buildScale(rootMidi: number, def: ScaleDef, direction: ScaleDirection = 'ascending'): number[] {
  const up = [...def.formula.map((s) => rootMidi + s), rootMidi + 12];
  return direction === 'ascending' ? up : up.reverse();
}

/** Scales whose pitch-class set contains every given pitch class (relative to `rootPc`). */
export function scalesContaining(pitchClasses: readonly number[], rootPc: number): ScaleDef[] {
  return SCALES.filter((s) => {
    const set = new Set(s.formula.map((x) => (x + rootPc) % 12));
    return pitchClasses.every((pc) => set.has(((pc % 12) + 12) % 12));
  });
}
