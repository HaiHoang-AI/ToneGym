import type { SequenceStep } from '../audio/engine';
import type { Bilingual, NoteNaming, Rng } from '../theory';

export type Skill = 'intervals' | 'chords' | 'scales' | 'progressions' | 'melody' | 'rhythm' | 'reading' | 'singing';

export const SKILLS: readonly Skill[] = ['intervals', 'chords', 'scales', 'progressions', 'melody', 'rhythm', 'reading', 'singing'];

export const SKILL_NAMES: Record<Skill, Bilingual> = {
  intervals: { vi: 'Quãng', en: 'Intervals' },
  chords: { vi: 'Hợp âm', en: 'Chords' },
  scales: { vi: 'Âm giai', en: 'Scales' },
  progressions: { vi: 'Vòng hợp âm', en: 'Progressions' },
  melody: { vi: 'Giai điệu', en: 'Melody' },
  rhythm: { vi: 'Tiết tấu', en: 'Rhythm' },
  reading: { vi: 'Đọc nốt', en: 'Reading' },
  singing: { vi: 'Hát', en: 'Singing' },
};

export const SKILL_COLORS: Record<Skill, string> = {
  intervals: '#39d0c0',
  chords: '#f4b740',
  scales: '#a78bfa',
  progressions: '#60a5fa',
  melody: '#f472b6',
  rhythm: '#fb923c',
  reading: '#34d399',
  singing: '#f87171',
};

/** Something to play: a list of timed steps (see audio engine). */
export interface Sound {
  steps: SequenceStep[];
}

export interface ChoiceOption {
  id: string;
  label: string;
  sublabel?: string;
  /** Sound of this answer, used by compare mode and sound-choice games. */
  sound?: Sound;
}

export interface Question {
  /** Small line above the title, e.g. "Two notes going up". */
  prompt: Bilingual;
  /** Big question line. */
  title: Bilingual;
  /** Played automatically and on Space. */
  sound: Sound;
  /** Played on R (e.g. the root or the tonic). */
  reference?: Sound;
  hint?: { label: Bilingual; sound: Sound };
  options: ChoiceOption[];
  correctId: string;
  /** Answer before this runs out, or the round counts as wrong. */
  timeLimitMs?: number;
  /** sound-choice: the options are sounds labelled A, B, C… and must be listened to. */
  soundChoice?: boolean;
  /** Extra text shown large (e.g. the chord name to find). */
  display?: string;
}

export interface GameContext {
  lang: string;
  accidentals: 'sharp' | 'flat';
  naming: NoteNaming;
}

export interface GameDef {
  id: string;
  skill: Skill;
  /** Illustration variant (character look) and mark (interval direction art). */
  art: { variant: number; mark: 'up' | 'down' | 'both' | 'three' };
  name: Bilingual;
  desc: Bilingual;
  /** Build phase that ships this game. */
  phase: number;
  /** Games of later phases have no question builder yet. */
  makeQuestion?: (level: number, rng: Rng, ctx: GameContext) => Question;
}
