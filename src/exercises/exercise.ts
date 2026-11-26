import {
  buildChord, buildScale, getChord, getInterval, getScale, parseProgression, pitchClass, realizeProgression,
  ROOTS, nameToMidi, type IntervalId, type Rng,
} from '../theory';
import { chordSequence, concat, harmonic, melodic } from '../games/sound';
import type { Sound } from '../games/types';

export type Topic = 'intervals' | 'chords' | 'scales' | 'progressions' | 'pitch';
export type Mode = 'listen' | 'compare' | 'play';
export type Direction = 'ascending' | 'descending' | 'harmonic' | 'mix';
export type RootChoice = 'natural' | 'sharp' | 'flat' | 'fixed';
export type Speed = 'slow' | 'moderate' | 'fast';

export interface ExerciseSettings {
  topic: Topic;
  mode: Mode;
  intervals: IntervalId[];
  chords: string[];
  scales: string[];
  progressionKey: 'major' | 'minor';
  progressionLength: number;
  pitchDifficulty: 'easy' | 'medium' | 'hard';
  direction: Direction;
  root: RootChoice;
  speed: Speed;
}

export const MODES_BY_TOPIC: Record<Topic, Mode[]> = {
  intervals: ['listen', 'compare', 'play'],
  chords: ['listen', 'play'],
  scales: ['listen', 'play'],
  progressions: ['listen'],
  pitch: ['compare'],
};

export interface ExerciseQuestion {
  sound: Sound;
  /** Notes heard first in play mode (e.g. the starting note). */
  given?: number[];
  options: { id: string; label: string; sound?: Sound }[];
  answerId: string;
  /** Play mode: what the player must play, checked as pitch classes (in order for scales). */
  target?: { notes: number[]; ordered: boolean };
}

const GAP: Record<Speed, number> = { slow: 0.9, moderate: 0.65, fast: 0.42 };

function rootMidi(choice: RootChoice, rng: Rng, low = 55, high = 64): number {
  if (choice === 'fixed') return 60;
  const names = ROOTS[choice];
  for (let tries = 0; tries < 40; tries++) {
    const m = nameToMidi(`${rng.pick(names)}4`) - 12 + 12 * rng.int(0, 1);
    if (m >= low && m <= high) return m;
  }
  return 60;
}

const pickDir = (d: Direction, rng: Rng): Exclude<Direction, 'mix'> =>
  d === 'mix' ? rng.pick(['ascending', 'descending', 'harmonic'] as const) : d;

function intervalSound(start: number, semis: number, dir: Exclude<Direction, 'mix'>, gap: number): Sound {
  if (dir === 'harmonic') return harmonic([start, start + semis], 1.6);
  return melodic(dir === 'ascending' ? [start, start + semis] : [start, start - semis], gap);
}

const DIATONIC: Record<'major' | 'minor', string[]> = {
  major: ['I', 'ii', 'iii', 'IV', 'V', 'vi'],
  minor: ['i', 'iv', 'v', 'V', 'bVI', 'bVII', 'bIII'],
};

export function makeExercise(s: ExerciseSettings, rng: Rng): ExerciseQuestion {
  const gap = GAP[s.speed];
  switch (s.topic) {
    case 'intervals': {
      if (s.mode === 'compare') {
        // Two intervals from the selection; which one is wider?
        const pool = s.intervals.length >= 2 ? s.intervals : (['M3', 'P5'] as IntervalId[]);
        const [a, b] = rng.sample(pool.filter((v, i, arr) => arr.findIndex((x) => getInterval(x).semitones === getInterval(v).semitones) === i), 2) as [IntervalId, IntervalId];
        const start = rootMidi(s.root, rng);
        const sa = intervalSound(start, getInterval(a).semitones, 'ascending', gap);
        const sb = intervalSound(start + rng.int(-3, 3), getInterval(b).semitones, 'ascending', gap);
        const wider = getInterval(a).semitones > getInterval(b).semitones ? '1' : '2';
        return {
          sound: concat([sa, sb], 0.6),
          options: [{ id: '1', label: '#1', sound: sa }, { id: '2', label: '#2', sound: sb }],
          answerId: wider,
        };
      }
      const id = rng.pick(s.intervals.length ? s.intervals : (['M3'] as IntervalId[]));
      const dir = pickDir(s.mode === 'play' && s.direction === 'harmonic' ? 'ascending' : s.direction, rng);
      const start = rootMidi(s.root, rng);
      const semis = getInterval(id).semitones;
      const second = dir === 'descending' ? start - semis : start + semis;
      return {
        sound: intervalSound(start, semis, dir, gap),
        given: [start],
        options: s.intervals.map((x) => ({ id: x, label: x, sound: intervalSound(start, getInterval(x).semitones, dir, gap) })),
        answerId: id,
        target: { notes: [second], ordered: true },
      };
    }
    case 'chords': {
      const id = rng.pick(s.chords.length ? s.chords : ['maj']);
      const root = rootMidi(s.root, rng, 50, 60);
      const dir = pickDir(s.direction, rng);
      const voice = (cid: string) => {
        const notes = buildChord(root, getChord(cid));
        if (dir === 'harmonic') return harmonic(notes, 1.8);
        return melodic(dir === 'ascending' ? notes : [...notes].reverse(), gap * 0.7);
      };
      return {
        sound: voice(id),
        given: [root],
        options: s.chords.map((c) => ({ id: c, label: getChord(c).symbol || 'M', sound: voice(c) })),
        answerId: id,
        target: { notes: buildChord(root, getChord(id)), ordered: false },
      };
    }
    case 'scales': {
      const id = rng.pick(s.scales.length ? s.scales : ['major']);
      const root = rootMidi(s.root, rng);
      const dir = s.direction === 'mix' ? rng.pick(['ascending', 'descending'] as const) : s.direction === 'descending' ? 'descending' : 'ascending';
      const voice = (sid: string) => melodic(buildScale(root, getScale(sid), dir), gap * 0.55);
      return {
        sound: voice(id),
        given: [root],
        options: s.scales.map((x) => ({ id: x, label: x, sound: voice(x) })),
        answerId: id,
        target: { notes: buildScale(root, getScale(id), 'ascending'), ordered: true },
      };
    }
    case 'progressions': {
      const pool = DIATONIC[s.progressionKey];
      const make = () => {
        const out = [s.progressionKey === 'major' ? 'I' : 'i'];
        while (out.length < s.progressionLength) out.push(rng.pick(pool.filter((c) => c !== out[out.length - 1])));
        return out.join('-');
      };
      const answer = make();
      const ids = new Set([answer]);
      for (let t = 0; ids.size < 4 && t < 200; t++) ids.add(make());
      const tonic = rootMidi(s.root, rng, 55, 62);
      const voice = (p: string) => chordSequence(realizeProgression(parseProgression(p), tonic).map((c) => c.notes), gap * 1.6);
      return {
        sound: voice(answer),
        options: rng.shuffle([...ids]).map((p) => ({ id: p, label: p.split('-').join(' – '), sound: voice(p) })),
        answerId: answer,
      };
    }
    case 'pitch': {
      const range = { easy: [3, 12], medium: [1, 3], hard: [1, 1] }[s.pitchDifficulty] as [number, number];
      const a = rng.int(52, 72);
      const b = a + (rng.next() < 0.5 ? -1 : 1) * rng.int(range[0], range[1]);
      return {
        sound: melodic([a, b], gap),
        options: [
          { id: '1', label: '#1', sound: melodic([a], gap) },
          { id: '2', label: '#2', sound: melodic([b], gap) },
        ],
        answerId: a > b ? '1' : '2',
      };
    }
  }
}

/** Checks notes played on the piano against a play-mode target (pitch classes; octave-free). */
export function checkPlayed(played: readonly number[], target: { notes: number[]; ordered: boolean }): boolean {
  const want = target.notes.map(pitchClass);
  const got = played.map(pitchClass);
  if (target.ordered) return got.length === want.length && got.every((pc, i) => pc === want[i]);
  return new Set(got).size === new Set(want).size && want.every((pc) => got.includes(pc));
}
