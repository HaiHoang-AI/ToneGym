import Dexie, { type Table } from 'dexie';
import type { InstrumentId } from '../audio/engine';
import type { ItemMastery, LessonProgress } from '../learn/types';
import type { Lang, NoteNaming } from '../theory';

export type ThemeName = 'dark' | 'light';

export interface ProfileSettings {
  language: Lang;
  theme: ThemeName;
  /** 0 … 1 */
  volume: number;
  instrument: InstrumentId;
  noteNaming: NoteNaming;
  accidentals: 'sharp' | 'flat';
  /** Comfortable singing range as MIDI numbers, used by the singing games. */
  vocalRange: { low: number; high: number };
  /** Added to rhythm taps to compensate for device latency (ms). */
  tapLatencyMs: number;
  /** Games the player pinned for the daily workout (empty = automatic). */
  workoutGames: string[];
  /** Hour of the day (local time) when a new workout starts. */
  workoutResetHour: number;
  /** Outfit of the mascot Yumika. */
  mascotOutfit: 'casual' | 'maid';
  /** Every shop instrument available without buying. */
  unlockAll: boolean;
  /** Learning paths: answer the Pitch path on a piano or with note-name buttons. */
  learnPitchInput: 'piano' | 'buttons';
  /** Learning paths: show every note name on the piano keys. */
  learnKeyNames: boolean;
  /** Learning paths: after a wrong answer play your answer, then the right one. */
  learnCompare: boolean;
}

export interface Profile {
  id?: number;
  name: string;
  /** Accent colour for the avatar chip. */
  color: string;
  createdAt: number;
  settings: ProfileSettings;
}

export interface MetaEntry {
  key: string;
  value: unknown;
}

/** Progress of one profile in one game. */
export interface GameProgress {
  profileId: number;
  gameId: string;
  /** Level the player is currently on (1-based). */
  level: number;
  /** Highest level ever unlocked. */
  maxLevel: number;
  levelsPassed: number;
  plays: number;
  correct: number;
  answered: number;
  bestScore: number;
  updatedAt: number;
}

export interface Attempt {
  id?: number;
  profileId: number;
  gameId: string;
  level: number;
  passed: boolean;
  score: number;
  correct: number;
  answered: number;
  context: 'free' | 'workout' | 'contest';
  at: number;
}

export interface WorkoutDay {
  profileId: number;
  /** Workout day key, YYYY-MM-DD (the day starts at the reset hour). */
  date: string;
  games: string[];
  completed: string[];
  coinsAwarded: number;
  finishedAt?: number;
}

export interface ProfileStats {
  profileId: number;
  coins: number;
  streak: number;
  bestStreak: number;
  lastWorkoutDate: string | null;
  workoutsDone: number;
  /** One Ear Index value per day it changed. */
  earIndexHistory: { date: string; value: number }[];
  awards: string[];
  learningPoints: number;
  ownedInstruments: string[];
}

export interface ExerciseBest {
  profileId: number;
  exerciseId: string;
  bestStreak: number;
  answered: number;
  correct: number;
}

/** Per-profile saved data of the tools (saved progressions, interval songs, recordings…). */
export interface ToolDataEntry {
  profileId: number;
  key: string;
  value: unknown;
  updatedAt: number;
}

export interface ContestEntry {
  id?: number;
  week: string;
  profileId: number;
  score: number;
  at: number;
}

export const DEFAULT_SETTINGS: ProfileSettings = {
  language: 'vi',
  theme: 'dark',
  volume: 0.8,
  instrument: 'piano',
  noteNaming: 'letters',
  accidentals: 'sharp',
  vocalRange: { low: 48, high: 67 }, // C3–G4
  tapLatencyMs: 0,
  workoutGames: [],
  workoutResetHour: 4,
  mascotOutfit: 'casual',
  unlockAll: false,
  learnPitchInput: 'piano',
  learnKeyNames: false,
  learnCompare: true,
};

export function emptyStats(profileId: number): ProfileStats {
  return {
    profileId,
    coins: 0,
    streak: 0,
    bestStreak: 0,
    lastWorkoutDate: null,
    workoutsDone: 0,
    earIndexHistory: [],
    awards: [],
    learningPoints: 0,
    ownedInstruments: ['piano', 'synth'],
  };
}

export class EarLabDB extends Dexie {
  profiles!: Table<Profile, number>;
  meta!: Table<MetaEntry, string>;
  gameProgress!: Table<GameProgress, [number, string]>;
  attempts!: Table<Attempt, number>;
  workouts!: Table<WorkoutDay, [number, string]>;
  stats!: Table<ProfileStats, number>;
  exerciseBests!: Table<ExerciseBest, [number, string]>;
  toolData!: Table<ToolDataEntry, [number, string]>;
  contestEntries!: Table<ContestEntry, number>;
  lessonProgress!: Table<LessonProgress, [number, string]>;
  itemMastery!: Table<ItemMastery, [number, string, string]>;

  constructor(name = 'earlab') {
    super(name);
    this.version(1).stores({
      profiles: '++id, name, createdAt',
      meta: 'key',
    });
    this.version(2)
      .stores({
        profiles: '++id, name, createdAt',
        meta: 'key',
        gameProgress: '[profileId+gameId], profileId',
        attempts: '++id, profileId, gameId, at',
        workouts: '[profileId+date], profileId',
        stats: 'profileId',
        exerciseBests: '[profileId+exerciseId], profileId',
      })
      .upgrade(async (tx) => {
        await tx
          .table('profiles')
          .toCollection()
          .modify((p: Profile) => {
            p.settings = { ...DEFAULT_SETTINGS, ...p.settings };
          });
      });
    this.version(3).stores({
      profiles: '++id, name, createdAt',
      meta: 'key',
      gameProgress: '[profileId+gameId], profileId',
      attempts: '++id, profileId, gameId, at',
      workouts: '[profileId+date], profileId',
      stats: 'profileId',
      exerciseBests: '[profileId+exerciseId], profileId',
      toolData: '[profileId+key], profileId',
    });
    this.version(4).stores({
      profiles: '++id, name, createdAt',
      meta: 'key',
      gameProgress: '[profileId+gameId], profileId',
      attempts: '++id, profileId, gameId, at',
      workouts: '[profileId+date], profileId',
      stats: 'profileId',
      exerciseBests: '[profileId+exerciseId], profileId',
      toolData: '[profileId+key], profileId',
      contestEntries: '++id, week, profileId',
    });
    this.version(5).stores({
      profiles: '++id, name, createdAt',
      meta: 'key',
      gameProgress: '[profileId+gameId], profileId',
      attempts: '++id, profileId, gameId, at',
      workouts: '[profileId+date], profileId',
      stats: 'profileId',
      exerciseBests: '[profileId+exerciseId], profileId',
      toolData: '[profileId+key], profileId',
      contestEntries: '++id, week, profileId',
      lessonProgress: '[profileId+lessonId], profileId, [profileId+pathId]',
      itemMastery: '[profileId+pathId+itemId], profileId, [profileId+pathId]',
    });
  }
}

export const db = new EarLabDB();
