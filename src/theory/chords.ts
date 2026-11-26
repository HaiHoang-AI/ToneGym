import type { Bilingual } from './names';

export type ChordFamily = 'triad' | 'seventh' | 'sixth' | 'added' | 'extended';

export interface ChordDef {
  id: string;
  /** Suffix written after the root, e.g. "m7" in "Cm7". */
  symbol: string;
  /** Semitones above the root, ascending. */
  formula: readonly number[];
  family: ChordFamily;
  name: Bilingual;
}

const ch = (
  id: string,
  symbol: string,
  formula: number[],
  family: ChordFamily,
  vi: string,
  en: string,
): ChordDef => ({ id, symbol, formula, family, name: { vi, en } });

/** Chord qualities from 3 to 6 notes. */
export const CHORDS: readonly ChordDef[] = [
  // 3 notes
  ch('maj', '', [0, 4, 7], 'triad', 'Trưởng', 'Major'),
  ch('min', 'm', [0, 3, 7], 'triad', 'Thứ', 'Minor'),
  ch('dim', '°', [0, 3, 6], 'triad', 'Giảm', 'Diminished'),
  ch('aug', '+', [0, 4, 8], 'triad', 'Tăng', 'Augmented'),
  ch('sus2', 'sus2', [0, 2, 7], 'triad', 'Sus2', 'Suspended 2nd'),
  ch('sus4', 'sus4', [0, 5, 7], 'triad', 'Sus4', 'Suspended 4th'),
  ch('majb5', '(♭5)', [0, 4, 6], 'triad', 'Trưởng ♭5', 'Major flat 5'),
  // 4 notes
  ch('maj7', 'maj7', [0, 4, 7, 11], 'seventh', 'Bảy trưởng', 'Major 7th'),
  ch('dom7', '7', [0, 4, 7, 10], 'seventh', 'Bảy át', 'Dominant 7th'),
  ch('min7', 'm7', [0, 3, 7, 10], 'seventh', 'Bảy thứ', 'Minor 7th'),
  ch('mMaj7', 'm(maj7)', [0, 3, 7, 11], 'seventh', 'Thứ bảy trưởng', 'Minor-major 7th'),
  ch('m7b5', 'm7♭5', [0, 3, 6, 10], 'seventh', 'Bảy nửa giảm', 'Half-diminished 7th'),
  ch('dim7', '°7', [0, 3, 6, 9], 'seventh', 'Bảy giảm', 'Diminished 7th'),
  ch('aug7', '+7', [0, 4, 8, 10], 'seventh', 'Bảy tăng', 'Augmented 7th'),
  ch('augMaj7', '+maj7', [0, 4, 8, 11], 'seventh', 'Tăng bảy trưởng', 'Augmented major 7th'),
  ch('7sus4', '7sus4', [0, 5, 7, 10], 'seventh', 'Bảy sus4', 'Dominant 7th sus4'),
  ch('7sus2', '7sus2', [0, 2, 7, 10], 'seventh', 'Bảy sus2', 'Dominant 7th sus2'),
  ch('maj7sus4', 'maj7sus4', [0, 5, 7, 11], 'seventh', 'Bảy trưởng sus4', 'Major 7th sus4'),
  ch('7b5', '7♭5', [0, 4, 6, 10], 'seventh', 'Bảy át ♭5', 'Dominant 7th flat 5'),
  ch('maj7b5', 'maj7♭5', [0, 4, 6, 11], 'seventh', 'Bảy trưởng ♭5', 'Major 7th flat 5'),
  ch('dimMaj7', '°(maj7)', [0, 3, 6, 11], 'seventh', 'Giảm bảy trưởng', 'Diminished major 7th'),
  ch('maj6', '6', [0, 4, 7, 9], 'sixth', 'Sáu trưởng', 'Major 6th'),
  ch('min6', 'm6', [0, 3, 7, 9], 'sixth', 'Sáu thứ', 'Minor 6th'),
  ch('add9', 'add9', [0, 4, 7, 14], 'added', 'Trưởng add9', 'Added 9th'),
  ch('madd9', 'm(add9)', [0, 3, 7, 14], 'added', 'Thứ add9', 'Minor added 9th'),
  // 5 notes
  ch('dom9', '9', [0, 4, 7, 10, 14], 'extended', 'Chín át', 'Dominant 9th'),
  ch('maj9', 'maj9', [0, 4, 7, 11, 14], 'extended', 'Chín trưởng', 'Major 9th'),
  ch('min9', 'm9', [0, 3, 7, 10, 14], 'extended', 'Chín thứ', 'Minor 9th'),
  ch('mMaj9', 'm(maj9)', [0, 3, 7, 11, 14], 'extended', 'Thứ chín trưởng', 'Minor-major 9th'),
  ch('7b9', '7♭9', [0, 4, 7, 10, 13], 'extended', 'Bảy át ♭9', 'Dominant 7th flat 9'),
  ch('7s9', '7♯9', [0, 4, 7, 10, 15], 'extended', 'Bảy át ♯9', 'Dominant 7th sharp 9'),
  ch('6add9', '6/9', [0, 4, 7, 9, 14], 'extended', 'Sáu-chín', 'Six-nine'),
  ch('m6add9', 'm6/9', [0, 3, 7, 9, 14], 'extended', 'Thứ sáu-chín', 'Minor six-nine'),
  ch('7s11', '7♯11', [0, 4, 7, 10, 18], 'extended', 'Bảy át ♯11', 'Dominant 7th sharp 11'),
  ch('maj7s11', 'maj7♯11', [0, 4, 7, 11, 18], 'extended', 'Bảy trưởng ♯11', 'Major 7th sharp 11'),
  ch('9sus4', '9sus4', [0, 5, 7, 10, 14], 'extended', 'Chín sus4', 'Dominant 9th sus4'),
  ch('7s5s9', '7♯5♯9', [0, 4, 8, 10, 15], 'extended', 'Bảy át ♯5♯9', 'Dominant 7th sharp 5 sharp 9'),
  // 6 notes
  ch('dom11', '11', [0, 4, 7, 10, 14, 17], 'extended', 'Mười một át', 'Dominant 11th'),
  ch('min11', 'm11', [0, 3, 7, 10, 14, 17], 'extended', 'Mười một thứ', 'Minor 11th'),
  ch('dom13', '13', [0, 4, 7, 10, 14, 21], 'extended', 'Mười ba át', 'Dominant 13th'),
  ch('maj13', 'maj13', [0, 4, 7, 11, 14, 21], 'extended', 'Mười ba trưởng', 'Major 13th'),
  ch('min13', 'm13', [0, 3, 7, 10, 14, 21], 'extended', 'Mười ba thứ', 'Minor 13th'),
  ch('9s11', '9♯11', [0, 4, 7, 10, 14, 18], 'extended', 'Chín át ♯11', 'Dominant 9th sharp 11'),
  ch('maj9s11', 'maj9♯11', [0, 4, 7, 11, 14, 18], 'extended', 'Chín trưởng ♯11', 'Major 9th sharp 11'),
  ch('7s9b13', '7(♯9,♭13)', [0, 4, 7, 10, 15, 20], 'extended', 'Bảy át (♯9,♭13)', 'Dominant 7th (♯9,♭13)'),
  ch('7b9b13', '7(♭9,♭13)', [0, 4, 7, 10, 13, 20], 'extended', 'Bảy át (♭9,♭13)', 'Dominant 7th (♭9,♭13)'),
];

const BY_ID = new Map(CHORDS.map((c) => [c.id, c]));

export function getChord(id: string): ChordDef {
  const def = BY_ID.get(id);
  if (!def) throw new Error(`Unknown chord ${id}`);
  return def;
}

export function chordsBySize(size: number): ChordDef[] {
  return CHORDS.filter((c) => c.formula.length === size);
}

/** Root-position, close-as-written notes of a chord. */
export function chordNotes(rootMidi: number, def: ChordDef): number[] {
  return def.formula.map((s) => rootMidi + s);
}

/**
 * Puts chord tone number `inversion` (0 = root, 1 = 3rd, 2 = 5th, …) in the bass
 * and raises every other tone by octaves until it sits above that bass.
 */
export function invert(notes: readonly number[], inversion: number): number[] {
  const sorted = [...notes].sort((a, b) => a - b);
  if (inversion <= 0 || inversion >= sorted.length) return sorted;
  const bass = sorted[inversion] as number;
  const upper = sorted
    .filter((_, i) => i !== inversion)
    .map((n) => {
      let m = n;
      while (m <= bass) m += 12;
      return m;
    });
  return [bass, ...upper].sort((a, b) => a - b);
}

/** Open position: the voice just above the bass jumps up an octave (C–E–G becomes C–G–E'). */
export function openVoicing(notes: readonly number[]): number[] {
  const sorted = [...notes].sort((a, b) => a - b);
  if (sorted.length < 3) return sorted;
  const [bass, second, ...rest] = sorted as [number, number, ...number[]];
  return [bass, ...rest, second + 12].sort((a, b) => a - b);
}

export function buildChord(
  rootMidi: number,
  def: ChordDef,
  options: { inversion?: number; open?: boolean } = {},
): number[] {
  const inverted = invert(chordNotes(rootMidi, def), options.inversion ?? 0);
  return options.open ? openVoicing(inverted) : inverted;
}

/** How many inversions the chord has (one per chord tone, including root position). */
export function inversionCount(def: ChordDef): number {
  return def.formula.length;
}
