import type { Bilingual } from './names';

export type IntervalId =
  | 'P1' | 'm2' | 'M2' | 'm3' | 'M3' | 'P4' | 'TT' | 'P5' | 'm6' | 'M6' | 'm7' | 'M7' | 'P8'
  | 'm9' | 'M9' | 'm10' | 'M10' | 'P11' | 'A11' | 'P12' | 'm13' | 'M13' | 'm14' | 'M14';

export interface IntervalDef {
  id: IntervalId;
  semitones: number;
  /** Interval name in tonal's notation, used for spelled transposition. */
  tonal: string;
  compound: boolean;
  name: Bilingual;
}

const iv = (id: IntervalId, semitones: number, tonal: string, vi: string, en: string): IntervalDef => ({
  id, semitones, tonal, compound: semitones > 12, name: { vi, en },
});

/** 24 intervals from unison to major 14th (two octaves minus a semitone). */
export const INTERVALS: readonly IntervalDef[] = [
  iv('P1', 0, '1P', 'Quãng 1 đúng (đồng âm)', 'Unison'),
  iv('m2', 1, '2m', 'Quãng 2 thứ', 'Minor 2nd'),
  iv('M2', 2, '2M', 'Quãng 2 trưởng', 'Major 2nd'),
  iv('m3', 3, '3m', 'Quãng 3 thứ', 'Minor 3rd'),
  iv('M3', 4, '3M', 'Quãng 3 trưởng', 'Major 3rd'),
  iv('P4', 5, '4P', 'Quãng 4 đúng', 'Perfect 4th'),
  iv('TT', 6, '4A', 'Quãng 4 tăng (tritone)', 'Tritone'),
  iv('P5', 7, '5P', 'Quãng 5 đúng', 'Perfect 5th'),
  iv('m6', 8, '6m', 'Quãng 6 thứ', 'Minor 6th'),
  iv('M6', 9, '6M', 'Quãng 6 trưởng', 'Major 6th'),
  iv('m7', 10, '7m', 'Quãng 7 thứ', 'Minor 7th'),
  iv('M7', 11, '7M', 'Quãng 7 trưởng', 'Major 7th'),
  iv('P8', 12, '8P', 'Quãng 8 đúng', 'Octave'),
  iv('m9', 13, '9m', 'Quãng 9 thứ', 'Minor 9th'),
  iv('M9', 14, '9M', 'Quãng 9 trưởng', 'Major 9th'),
  iv('m10', 15, '10m', 'Quãng 10 thứ', 'Minor 10th'),
  iv('M10', 16, '10M', 'Quãng 10 trưởng', 'Major 10th'),
  iv('P11', 17, '11P', 'Quãng 11 đúng', 'Perfect 11th'),
  iv('A11', 18, '11A', 'Quãng 11 tăng', 'Augmented 11th'),
  iv('P12', 19, '12P', 'Quãng 12 đúng', 'Perfect 12th'),
  iv('m13', 20, '13m', 'Quãng 13 thứ', 'Minor 13th'),
  iv('M13', 21, '13M', 'Quãng 13 trưởng', 'Major 13th'),
  iv('m14', 22, '14m', 'Quãng 14 thứ', 'Minor 14th'),
  iv('M14', 23, '14M', 'Quãng 14 trưởng', 'Major 14th'),
];

const BY_ID = new Map(INTERVALS.map((i) => [i.id, i]));

export function getInterval(id: IntervalId): IntervalDef {
  const def = BY_ID.get(id);
  if (!def) throw new Error(`Unknown interval ${id}`);
  return def;
}

export function intervalBySemitones(semitones: number): IntervalDef | undefined {
  return INTERVALS.find((i) => i.semitones === semitones);
}

export type IntervalDirection = 'ascending' | 'descending' | 'harmonic';

export interface IntervalSound {
  /** Notes in playing order. */
  notes: [number, number];
  harmonic: boolean;
}

/**
 * Notes for an interval starting from `startMidi`.
 * Ascending/harmonic go up from the start note; descending goes down from it.
 */
export function intervalNotes(startMidi: number, id: IntervalId, direction: IntervalDirection): IntervalSound {
  const { semitones } = getInterval(id);
  if (direction === 'descending') return { notes: [startMidi, startMidi - semitones], harmonic: false };
  return { notes: [startMidi, startMidi + semitones], harmonic: direction === 'harmonic' };
}
