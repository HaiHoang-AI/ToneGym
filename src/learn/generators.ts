import type { Sound } from '../games/types';
import { chordSequence, concat, harmonic, melodic } from '../games/sound';
import { buildScale, chordNotes, getChord, getInterval, getScale, parseProgression, PROGRESSIONS, realizeProgression, type Bilingual, type IntervalId, type Rng } from '../theory';
import { REGISTERS, type Direction, type LearnQuestion, type LessonDef, type PathId, type QuestionStage, type Register, type TrapSpec } from './types';

/** The twelve pitch items of the Pitch path, by pitch class. */
export const PITCH_ITEMS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

/** The twelve interval items of the Intervals path, smallest first ('TT' = augmented fourth). */
export const INTERVAL_ITEMS: readonly IntervalId[] = ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];

/** Chord qualities of the Chords path ('sus4' only appears as a trap). */
export const CHORD_ITEMS = ['maj', 'min', 'dim', 'aug', 'sus4', 'maj7', 'dom7', 'min7', 'm7b5', 'dim7'] as const;

const CHORD_SYMBOLS: Record<string, string> = { maj: 'M', min: 'm', dim: '°', aug: '+', sus4: 'sus4', maj7: 'maj7', dom7: '7', min7: 'm7', m7b5: 'ø7', dim7: '°7' };

/** Scales of the Scales path, in the order they are taught. */
export const SCALE_ITEMS = [
  'major', 'naturalMinor', 'majorPentatonic', 'minorPentatonic', 'blues', 'harmonicMinor', 'melodicMinor',
  'dorian', 'mixolydian', 'lydian', 'phrygian', 'locrian', 'wholeTone', 'chromatic',
] as const;

/** "I-V-vi-IV" → "I–V–vi–IV", "bVII" → "♭VII". */
export function progressionLabel(id: string): string {
  return id.split('-').map((x) => x.replace(/^b/, '♭').replace('64', '⁶₄').replace(/6$/, '⁶')).join('–');
}

/** Big label of an answer button. */
export function itemSymbol(pathId: PathId, id: string): string {
  if (pathId === 'intervals') return intervalSymbol(id);
  if (pathId === 'chords') return CHORD_SYMBOLS[id] ?? id;
  if (pathId === 'progressions') return progressionLabel(id);
  if (pathId === 'scales') return getScale(id).name.en.replace(/ \(.*\)$/, '');
  return itemLabel(id);
}

/** Full name of an item, if it has one (intervals, chords). */
export function itemName(pathId: PathId, id: string): Bilingual | undefined {
  if (pathId === 'intervals') return getInterval(id as IntervalId).name;
  if (pathId === 'chords') return getChord(id).name;
  if (pathId === 'scales') return getScale(id).name;
  if (pathId === 'progressions') return PROGRESSIONS.find((p) => p.numerals === id)?.name;
  return undefined;
}

export function itemPc(id: string): number {
  const pc = (PITCH_ITEMS as readonly string[]).indexOf(id);
  if (pc < 0) throw new Error(`Unknown pitch item ${id}`);
  return pc;
}

export function semitonesOf(id: string): number {
  return getInterval(id as IntervalId).semitones;
}

/** Pretty label: "F♯", "B♭". */
export function itemLabel(id: string): string {
  return id.replace('#', '♯').replace(/^([A-G])b$/, '$1♭');
}

/** Short interval symbol: "P5", "m3", "A4". */
export function intervalSymbol(id: string): string {
  return id === 'TT' ? 'A4' : id;
}

/** All MIDI notes of a pitch class inside a register. */
export function notesInRegister(pc: number, register: Register): number[] {
  const { from, to } = REGISTERS[register];
  const out: number[] = [];
  for (let m = from; m <= to; m++) if (((m % 12) + 12) % 12 === pc) out.push(m);
  return out;
}

export function noteFor(itemId: string, register: Register, rng: Rng): number {
  return rng.pick(notesInRegister(itemPc(itemId), register));
}

/** `count` items in shuffled rounds, so every item comes up equally often and never three times in a row. */
export function balanced(pool: readonly string[], count: number, rng: Rng): string[] {
  if (pool.length === 0) return [];
  const out: string[] = [];
  while (out.length < count) {
    for (const x of rng.shuffle(pool)) {
      if (out.length >= count) break;
      out.push(x);
    }
  }
  return out;
}

/** Every answer the lesson can need (pool, trap items, the yes item). */
export function lessonItems(lesson: LessonDef): string[] {
  const set = new Set<string>(lesson.pool);
  if (lesson.yesItem) set.add(lesson.yesItem);
  for (const d of lesson.decoys ?? []) set.add(d);
  for (const t of lesson.traps) if (t.kind === 'pair') { set.add(t.a); set.add(t.b); }
  return [...set];
}

/** Answer buttons in a stable order (pitch class / interval size). */
export function sortItems(pathId: PathId, items: readonly string[]): string[] {
  if (pathId === 'progressions') return [...items];
  const order: readonly string[] = pathId === 'intervals' ? INTERVAL_ITEMS : pathId === 'chords' ? CHORD_ITEMS : pathId === 'scales' ? SCALE_ITEMS : PITCH_ITEMS;
  return [...items].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

type PlayedDirection = 'up' | 'down' | 'harmonic';

function pickDirection(d: Direction | undefined, rng: Rng): PlayedDirection {
  if (!d || d === 'up') return 'up';
  if (d === 'down' || d === 'harmonic') return d;
  return rng.pick(d === 'both' ? (['up', 'down'] as const) : (['up', 'down', 'harmonic'] as const));
}

/** Where an interval wants to go next (played after it in "resolution" lessons). */
export function resolutionOf(id: string, low: number): number[] | undefined {
  if (id === 'TT') return [low - 1, low + 7]; // F–B → E–C (outwards to a sixth)
  if (id === 'm7') return [low + 5, low + 9]; // G–F → C–E
  if (id === 'P4') return [low, low + 4]; // sus → major third
  if (id === 'm2') return [low + 1, low + 1]; // B–C → C
  return undefined;
}

interface Ctx {
  register: Register;
  direction?: Direction;
}

/** Notes of one question for an item. */
function build(pathId: PathId, lesson: LessonDef, stage: QuestionStage, itemId: string, rng: Rng, ctx: Ctx): LearnQuestion {
  const answerId = lesson.mode === 'yesno' ? (itemId === lesson.yesItem ? 'yes' : 'no') : itemId;
  if (pathId === 'scales') {
    const { from, to } = REGISTERS[ctx.register];
    const root = lesson.root ?? rng.int(from, to);
    const dir = pickDirection(ctx.direction ?? lesson.direction, rng);
    return { stage, itemId, answerId, notes: buildScale(root, getScale(itemId), dir === 'down' ? 'descending' : 'ascending'), gap: 0.3, root };
  }
  if (pathId === 'progressions') {
    const { from, to } = REGISTERS[ctx.register];
    const root = lesson.root ?? rng.int(from, to);
    const chords = progressionChords(itemId, root);
    return { stage, itemId, answerId, notes: chords.flat(), chords, root };
  }
  if (pathId === 'chords') {
    const { from, to } = REGISTERS[ctx.register];
    const root = lesson.root ?? rng.int(from, to);
    return { stage, itemId, answerId, notes: chordNotes(root, getChord(itemId)), harmonic: true };
  }
  if (pathId === 'intervals') {
    const s = semitonesOf(itemId);
    const { from, to } = REGISTERS[ctx.register];
    const low = lesson.root ?? rng.int(from, to);
    const dir = pickDirection(ctx.direction ?? lesson.direction, rng);
    const tail = lesson.resolve ? resolutionOf(itemId, low) : undefined;
    const notes = dir === 'down' ? [low + s, low] : [low, low + s];
    return { stage, itemId, answerId, notes, harmonic: dir === 'harmonic' || undefined, tail };
  }
  return { stage, itemId, answerId, notes: [noteFor(itemId, ctx.register, rng)] };
}

function plain(pathId: PathId, lesson: LessonDef, stage: QuestionStage, items: string[], rng: Rng): LearnQuestion[] {
  return items.map((id) => build(pathId, lesson, stage, id, rng, { register: lesson.register }));
}

/** Yes/no drill: half the questions are the yes item, the others are decoys getting closer. */
function yesNo(pathId: PathId, lesson: LessonDef, stage: QuestionStage, count: number, rng: Rng): LearnQuestion[] {
  const yes = lesson.yesItem!;
  const decoys = lesson.decoys ?? [];
  const yesCount = Math.ceil(count / 2);
  const noCount = count - yesCount;
  const pattern = rng.shuffle([...Array(yesCount).fill(true), ...Array(noCount).fill(false)] as boolean[]);
  let k = 0;
  return pattern.map((isYes) => {
    const id = isYes || decoys.length === 0 ? yes : decoys[Math.min(decoys.length - 1, Math.floor((k++ * decoys.length) / Math.max(1, noCount)))]!;
    return build(pathId, lesson, stage, id, rng, { register: lesson.register });
  });
}

function trap(pathId: PathId, lesson: LessonDef, spec: TrapSpec, n: number, rng: Rng): LearnQuestion {
  const register = spec.register ?? lesson.register;
  if (spec.kind === 'pair') {
    const id = n % 2 === 0 ? rng.pick([spec.a, spec.b]) : rng.pick([spec.b, spec.a]);
    return build(pathId, lesson, 'trap', id, rng, { register, direction: spec.direction });
  }
  const items = lesson.pool;
  const run = Array.from({ length: rng.int(2, 3) }, () => noteFor(rng.pick(items), register, rng));
  const last = rng.pick(items);
  const answerId = lesson.mode === 'yesno' ? (last === lesson.yesItem ? 'yes' : 'no') : last;
  return { stage: 'trap', itemId: last, answerId, notes: [...run, noteFor(last, register, rng)] };
}

export interface LessonQuestions {
  tries: LearnQuestion[];
  guided: LearnQuestion[];
  main: LearnQuestion[];
  traps: LearnQuestion[];
}

export const GUIDED_COUNT = 6;
export const TRAP_COUNT = 6;

/** Every question of one run of a lesson. */
export function generateLesson(lesson: LessonDef, rng: Rng, pathId: PathId = 'pitch'): LessonQuestions {
  const empty: LessonQuestions = { tries: [], guided: [], main: [], traps: [] };
  if (lesson.kind === 'intro') return { ...empty, tries: plain(pathId, lesson, 'try', balanced(lesson.pool, lesson.questionCount, rng), rng) };
  if (lesson.kind !== 'lesson') return { ...empty, main: plain(pathId, lesson, 'main', balanced(lesson.pool, lesson.questionCount, rng), rng) };
  const isYesNo = lesson.mode === 'yesno';
  const guidedItems = balanced([...lesson.newItems, ...lesson.pool], GUIDED_COUNT, rng);
  const guided = isYesNo ? yesNo(pathId, lesson, 'guided', GUIDED_COUNT, rng) : plain(pathId, lesson, 'guided', guidedItems, rng);
  const main = isYesNo ? yesNo(pathId, lesson, 'main', lesson.questionCount, rng) : plain(pathId, lesson, 'main', balanced(lesson.pool, lesson.questionCount, rng), rng);
  const traps = lesson.traps.length === 0 ? [] : Array.from({ length: TRAP_COUNT }, (_, i) => trap(pathId, lesson, lesson.traps[i % lesson.traps.length]!, Math.floor(i / lesson.traps.length), rng));
  return { tries: [], guided, main, traps };
}

/** Notes of each chord of a progression in the key whose tonic is `root`. */
export function progressionChords(numerals: string, root: number): number[][] {
  return realizeProgression(parseProgression(numerals), root).map((c) => c.notes);
}

/** Seconds per chord: long progressions (12-bar blues) go faster. */
export function chordGap(count: number): number {
  return count > 8 ? 0.7 : 1.05;
}

/** The sound of a question. */
export function questionSound(q: LearnQuestion): Sound {
  if (q.chords) return chordSequence(q.chords, chordGap(q.chords.length));
  const body = q.harmonic ? harmonic(q.notes, 1.5) : melodic(q.notes, q.gap ?? 0.6);
  return q.tail ? concat([body, harmonic(q.tail, 1.3)], 0.15) : body;
}

/** After a wrong answer: the player's answer, then the right one, from the same starting note. */
export function compareSound(pathId: PathId, q: LearnQuestion, chosen: string | null, yesItem?: string): Sound | undefined {
  if (pathId === 'scales' || pathId === 'progressions') {
    const as = (id: string): Sound => {
      if (pathId === 'scales') return melodic(buildScale(q.root!, getScale(id), q.notes[0]! > q.notes.at(-1)! ? 'descending' : 'ascending'), 0.3);
      const chords = progressionChords(id, q.root!);
      return chordSequence(chords, chordGap(chords.length));
    };
    if (chosen === 'yes' || chosen === 'no') return concat([questionSound(q), as(yesItem!)], 0.7);
    return chosen ? concat([as(chosen), as(q.itemId)], 0.7) : undefined;
  }
  if (pathId === 'chords') {
    const root = Math.min(...q.notes);
    const as = (id: string) => harmonic(chordNotes(root, getChord(id)), 1.3);
    if (chosen === 'yes' || chosen === 'no') return concat([questionSound(q), as(yesItem!)], 0.5);
    return chosen ? concat([as(chosen), as(q.itemId)], 0.5) : undefined;
  }
  if (pathId === 'intervals') {
    const low = Math.min(...q.notes);
    const as = (id: string): Sound => (q.harmonic ? harmonic([low, low + semitonesOf(id)], 1.2) : melodic([low, low + semitonesOf(id)], 0.55));
    if (chosen === 'yes' || chosen === 'no') return concat([questionSound(q), as(yesItem!)], 0.5);
    return chosen ? concat([as(chosen), as(q.itemId)], 0.5) : undefined;
  }
  const played = q.notes.at(-1)!;
  const near = (id: string) => {
    let m = played - (((played % 12) + 12) % 12) + itemPc(id);
    if (m - played > 6) m -= 12;
    if (played - m > 6) m += 12;
    return m;
  };
  if (chosen === 'yes' || chosen === 'no') return concat([melodic([played]), melodic([near(yesItem!)])], 0.4);
  return chosen ? concat([melodic([near(chosen)]), melodic([played])], 0.4) : undefined;
}
