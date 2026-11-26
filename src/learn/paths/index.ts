import type { Bilingual } from '../../theory';
import type { PathDef, PathId } from '../types';
import { CHORDS_PATH } from './chords';
import { INTERVALS_PATH } from './intervals';
import { PITCH_PATH } from './pitch';
import { PROGRESSIONS_PATH } from './progressions';
import { SCALES_PATH } from './scales';

/** The five learning paths. */
export const PATHS: readonly PathDef[] = [PITCH_PATH, INTERVALS_PATH, CHORDS_PATH, SCALES_PATH, PROGRESSIONS_PATH];

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
  { id: 'scales', title: SCALES_PATH.title, tagline: SCALES_PATH.tagline, color: SCALES_PATH.color, size: SCALES_PATH.lessons.length },
  { id: 'progressions', title: PROGRESSIONS_PATH.title, tagline: PROGRESSIONS_PATH.tagline, color: PROGRESSIONS_PATH.color, size: PROGRESSIONS_PATH.lessons.length },
];

export function getPath(id: string): PathDef | undefined {
  return PATHS.find((p) => p.id === id);
}
