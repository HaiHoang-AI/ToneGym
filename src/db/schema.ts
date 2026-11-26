import Dexie, { type Table } from 'dexie';
import type { InstrumentId } from '../audio/engine';
import type { Lang, NoteNaming } from '../theory';

export interface ProfileSettings {
  language: Lang;
  /** 0 … 1 */
  volume: number;
  instrument: InstrumentId;
  noteNaming: NoteNaming;
  accidentals: 'sharp' | 'flat';
  /** Comfortable singing range as MIDI numbers, used by the singing games. */
  vocalRange: { low: number; high: number };
  /** Added to rhythm taps to compensate for device latency (ms). */
  tapLatencyMs: number;
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

export const DEFAULT_SETTINGS: ProfileSettings = {
  language: 'vi',
  volume: 0.8,
  instrument: 'piano',
  noteNaming: 'letters',
  accidentals: 'sharp',
  vocalRange: { low: 48, high: 67 }, // C3–G4
  tapLatencyMs: 0,
};

export class EarLabDB extends Dexie {
  profiles!: Table<Profile, number>;
  meta!: Table<MetaEntry, string>;

  constructor(name = 'earlab') {
    super(name);
    this.version(1).stores({
      profiles: '++id, name, createdAt',
      meta: 'key',
    });
  }
}

export const db = new EarLabDB();
