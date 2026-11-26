import type { Bilingual } from '../../theory';
import type { PathDef, PathId } from '../types';
import { CHORDS_PATH } from './chords';
import { INTERVALS_PATH } from './intervals';
import { PITCH_PATH } from './pitch';

/** Paths with lessons. The others are listed on the hub as coming soon. */
export const PATHS: readonly PathDef[] = [PITCH_PATH, INTERVALS_PATH, CHORDS_PATH];

export interface PathCard {
  id: PathId;
  title: Bilingual;
  tagline: Bilingual;
  color: string;
  size: number;
}

/** Every path card on the hub, in order (sizes of the paths not built yet are the planned ones). */
export const PATH_CARDS: readonly PathCard[] = [
  { id: 'pitch', title: PITCH_PATH.title, tagline: PITCH_PATH.tagline, color: PITCH_PATH.color, size: PITCH_PATH.lessons.length },
  { id: 'intervals', title: INTERVALS_PATH.title, tagline: INTERVALS_PATH.tagline, color: INTERVALS_PATH.color, size: INTERVALS_PATH.lessons.length },
  { id: 'chords', title: CHORDS_PATH.title, tagline: CHORDS_PATH.tagline, color: CHORDS_PATH.color, size: CHORDS_PATH.lessons.length },
  { id: 'scales', title: { vi: 'Âm giai', en: 'Scales' }, tagline: { vi: 'Màu của âm giai và điệu thức', en: 'Colours of scales and modes' }, color: '#f4b740', size: 30 },
  { id: 'progressions', title: { vi: 'Vòng hợp âm', en: 'Progressions' }, tagline: { vi: 'Nghe ra vòng hòa âm', en: 'Hear chord progressions' }, color: '#39d0c0', size: 30 },
];

export function getPath(id: string): PathDef | undefined {
  return PATHS.find((p) => p.id === id);
}
