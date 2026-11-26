import type { Rng } from '../theory';
import { REGISTERS, type LearnQuestion, type LessonDef, type QuestionStage, type Register, type TrapSpec } from './types';

/** The twelve pitch items of the Pitch path, by pitch class. */
export const PITCH_ITEMS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export function itemPc(id: string): number {
  const pc = (PITCH_ITEMS as readonly string[]).indexOf(id);
  if (pc < 0) throw new Error(`Unknown pitch item ${id}`);
  return pc;
}

/** Pretty label: "F♯", "B♭". */
export function itemLabel(id: string): string {
  return id.replace('#', '♯').replace(/^([A-G])b$/, '$1♭');
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

function question(lesson: LessonDef, stage: QuestionStage, itemId: string, notes: number[]): LearnQuestion {
  const answerId = lesson.mode === 'yesno' ? (itemId === lesson.yesItem ? 'yes' : 'no') : itemId;
  return { stage, itemId, answerId, notes };
}

function plain(lesson: LessonDef, stage: QuestionStage, items: string[], rng: Rng, register = lesson.register): LearnQuestion[] {
  return items.map((id) => question(lesson, stage, id, [noteFor(id, register, rng)]));
}

/** Yes/no drill: half the questions are the yes item, the others are decoys getting closer. */
function yesNo(lesson: LessonDef, stage: QuestionStage, count: number, rng: Rng): LearnQuestion[] {
  const yes = lesson.yesItem!;
  const decoys = lesson.decoys ?? [];
  const yesCount = Math.ceil(count / 2);
  const noCount = count - yesCount;
  const pattern = rng.shuffle([...Array(yesCount).fill(true), ...Array(noCount).fill(false)] as boolean[]);
  let k = 0;
  return pattern.map((isYes) => {
    const id = isYes || decoys.length === 0 ? yes : decoys[Math.min(decoys.length - 1, Math.floor((k++ * decoys.length) / Math.max(1, noCount)))]!;
    return question(lesson, stage, id, [noteFor(id, lesson.register, rng)]);
  });
}

function trap(lesson: LessonDef, spec: TrapSpec, n: number, rng: Rng): LearnQuestion {
  const register = spec.register ?? lesson.register;
  if (spec.kind === 'pair') {
    const id = n % 2 === 0 ? rng.pick([spec.a, spec.b]) : rng.pick([spec.b, spec.a]);
    return question(lesson, 'trap', id, [noteFor(id, register, rng)]);
  }
  const items = lesson.pool;
  const run = Array.from({ length: rng.int(2, 3) }, () => noteFor(rng.pick(items), register, rng));
  const last = rng.pick(items);
  return question(lesson, 'trap', last, [...run, noteFor(last, register, rng)]);
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
export function generateLesson(lesson: LessonDef, rng: Rng): LessonQuestions {
  const empty: LessonQuestions = { tries: [], guided: [], main: [], traps: [] };
  if (lesson.kind === 'intro') return { ...empty, tries: plain(lesson, 'try', balanced(lesson.pool, lesson.questionCount, rng), rng) };
  if (lesson.kind !== 'lesson') return { ...empty, main: plain(lesson, 'main', balanced(lesson.pool, lesson.questionCount, rng), rng) };
  const isYesNo = lesson.mode === 'yesno';
  const guidedItems = balanced([...lesson.newItems, ...lesson.pool], GUIDED_COUNT, rng);
  const guided = isYesNo ? yesNo(lesson, 'guided', GUIDED_COUNT, rng) : plain(lesson, 'guided', guidedItems, rng);
  const main = isYesNo ? yesNo(lesson, 'main', lesson.questionCount, rng) : plain(lesson, 'main', balanced(lesson.pool, lesson.questionCount, rng), rng);
  const traps = lesson.traps.length === 0 ? [] : Array.from({ length: TRAP_COUNT }, (_, i) => trap(lesson, lesson.traps[i % lesson.traps.length]!, Math.floor(i / lesson.traps.length), rng));
  return { tries: [], guided, main, traps };
}
