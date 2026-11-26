import type { Bilingual } from '../theory';

/** The five ear-training paths (the old theory course is shown next to them, separately). */
export type PathId = 'pitch' | 'intervals' | 'chords' | 'scales' | 'progressions';

export type LessonKind = 'intro' | 'lesson' | 'checkpoint' | 'final';

/** Where the question notes are played. */
export type Register = 'mid' | 'low' | 'high' | 'any' | 'lowmid' | 'wide';

export const REGISTERS: Record<Register, { from: number; to: number }> = {
  mid: { from: 60, to: 71 }, // C4–B4
  low: { from: 48, to: 59 }, // C3–B3
  high: { from: 72, to: 83 }, // C5–B5
  any: { from: 48, to: 83 }, // C3–B5
  lowmid: { from: 48, to: 71 }, // C3–B4
  wide: { from: 48, to: 72 }, // C3–C5 (roots of intervals)
};

/** How an interval is played: up, down, both notes together; 'both' mixes up/down, 'all' all three. */
export type Direction = 'up' | 'down' | 'harmonic' | 'both' | 'all';

/** A sound demo inside a theory slide. */
export interface SlideExample {
  label: Bilingual;
  notes: number[];
  /** Notes together instead of one after another. */
  together?: boolean;
}

export interface Slide {
  title: Bilingual;
  body: Bilingual;
  /** Keys lit on the small keyboard of the slide. */
  keys?: number[];
  examples?: SlideExample[];
}

/** A public-domain tune used as a memory hook ("remember it like this"). Only notes are shown, never lyrics. */
export interface AnchorSong {
  id: string;
  title: Bilingual;
  /** Composer / origin and why it is free to use. */
  source: Bilingual;
  notes: number[];
  /** Length of each note in beats (default 1). */
  beats?: number[];
  /** Indices of the notes to highlight (the notes this lesson teaches). */
  highlight: number[];
  /** Beats per minute at normal speed. */
  bpm?: number;
}

/** A trap question: one of two easily confused items, or "name the last note of a short run". */
export type TrapSpec =
  | { kind: 'pair'; a: string; b: string; register?: Register; direction?: Direction }
  | { kind: 'last'; register?: Register };

export interface LessonDef {
  id: string;
  kind: LessonKind;
  title: Bilingual;
  desc: Bilingual;
  /** Items introduced by this lesson (highlighted in the guided step). */
  newItems: string[];
  slides: Slide[];
  /** Anchor song ids, the first one is the "Listen to the anchor" button in the drill. */
  anchors: string[];
  /** Items asked in the drill. */
  pool: string[];
  register: Register;
  /** 'yesno': "Is it X?" with `decoys` played for the "no" answers, nearest last. */
  mode?: 'name' | 'yesno';
  yesItem?: string;
  decoys?: string[];
  traps: TrapSpec[];
  /** Intervals: how the two notes are played (default 'up'). */
  direction?: Direction;
  /** Intervals: fixed lower note instead of a random one in the register. */
  root?: number;
  /** Intervals: after the interval, play where it wants to resolve. */
  resolve?: boolean;
  /** Graded questions (20 lessons, 30 checkpoints, 40 final, 5 untimed tries in the intro). */
  questionCount: number;
  timeLimitMs?: number;
}

export interface PathDef {
  id: PathId;
  title: Bilingual;
  tagline: Bilingual;
  color: string;
  /** Every item the path can ask, used for the mastery percentage. */
  items: string[];
  lessons: LessonDef[];
}

export type QuestionStage = 'try' | 'guided' | 'main' | 'trap';

export interface LearnQuestion {
  stage: QuestionStage;
  /** Item that was played (counts for mastery). */
  itemId: string;
  /** The right answer id ('yes' / 'no' in yes-no lessons, otherwise the item). */
  answerId: string;
  /** Notes played one after another (pitch: the answer is the last one). */
  notes: number[];
  /** Play `notes` together. */
  harmonic?: boolean;
  /** Notes played together after the question (resolution of an interval). */
  tail?: number[];
}

/** Saved result of one lesson for one profile. */
export interface LessonProgress {
  profileId: number;
  pathId: PathId;
  lessonId: string;
  /** Best stars 0–3. */
  stars: number;
  bestPct: number;
  attempts: number;
  /** Passed over by a checkpoint taken early. */
  skipped: boolean;
  pinned: boolean;
  updatedAt: number;
}

/** How well one item (note, interval…) is known. */
export interface ItemMastery {
  profileId: number;
  pathId: PathId;
  itemId: string;
  /** Exponentially weighted accuracy 0–1. */
  ewma: number;
  seen: number;
  correct: number;
  lastSeen: number;
  /** Review spacing in days (1, 2, 4, 8, 16). */
  intervalDays: number;
  due: number;
}
