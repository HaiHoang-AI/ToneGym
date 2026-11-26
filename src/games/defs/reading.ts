import {
  getChord, getInterval, invertSpelled, localName, nameMidi, pcOf, spellChord, spellInterval, type IntervalId, type Rng,
} from '../../theory';
import { effectiveLevel } from '../levels';
import { harmonic, melodic } from '../sound';
import type { ChoiceOption, Question } from '../types';

export type ReadClef = 'treble' | 'bass' | 'alto';
export type ReadContent = 'notes' | 'intervals' | 'chords' | 'inversions';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/** Range of written notes per clef: inside the staff, then with ledger lines. */
const RANGES: Record<ReadClef, { staff: [string, string]; ledger: [string, string] }> = {
  treble: { staff: ['E4', 'F5'], ledger: ['A3', 'C6'] },
  bass: { staff: ['G2', 'A3'], ledger: ['C2', 'E4'] },
  alto: { staff: ['F3', 'G4'], ledger: ['B2', 'D5'] },
};

/** Natural notes (letter + octave) between two names, inclusive. */
function naturalsBetween(low: string, high: string): string[] {
  const out: string[] = [];
  const lo = nameMidi(low);
  const hi = nameMidi(high);
  for (let oct = 1; oct <= 7; oct++) {
    for (const l of LETTERS) {
      const name = `${l}${oct}`;
      const m = nameMidi(name);
      if (m >= lo && m <= hi) out.push(name);
    }
  }
  return out;
}

export interface ReadOptions {
  clef: ReadClef;
  content: ReadContent;
  ledger: boolean;
  accidentals: boolean;
}

const sampleOthers = (rng: Rng, pool: string[], answer: string, count: number) =>
  [answer, ...rng.sample(pool.filter((p) => p !== answer), count - 1)];

/** One sight-reading round: notation to read and answer buttons. Also used by the playground. */
export function readingRound(o: ReadOptions, rng: Rng, lang: string): Question {
  const range = o.ledger ? RANGES[o.clef].ledger : RANGES[o.clef].staff;
  const naturals = naturalsBetween(range[0], range[1]);
  const pick = () => {
    const base = rng.pick(naturals);
    if (!o.accidentals || rng.next() < 0.5) return base;
    return base.replace(/^([A-G])/, `$1${rng.pick(['#', 'b'])}`);
  };
  const staff = (stacks: string[][]) => ({ clef: o.clef, stacks });
  const vi = lang.startsWith('vi');

  if (o.content === 'notes') {
    const note = pick();
    const answer = pcOf(note);
    const pool = o.accidentals
      ? LETTERS.flatMap((l) => [l, `${l}#`, `${l}b`])
      : LETTERS;
    const ids = rng.shuffle(sampleOthers(rng, pool, answer, o.accidentals ? 6 : 7));
    return {
      prompt: { vi: 'Đọc nốt trên khuông', en: 'Read the note' },
      title: { vi: 'Đây là nốt gì?', en: 'Which note is this?' },
      sound: { steps: [] },
      staff: staff([[note]]),
      options: ids.map((id) => ({ id, label: id, sound: melodic([nameMidi(`${id}4`)], 0.8) })),
      correctId: answer,
    };
  }

  if (o.content === 'intervals') {
    const ivs: IntervalId[] = ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];
    let root = '';
    let top = '';
    let id: IntervalId = 'M3';
    for (let tries = 0; tries < 50; tries++) {
      root = o.accidentals ? pick() : rng.pick(naturals);
      id = rng.pick(ivs);
      top = spellInterval(root, id);
      if (nameMidi(top) <= nameMidi(range[1]) + 2 && !/##|bb/.test(top)) break;
    }
    const stacked = rng.next() < 0.5;
    const options: ChoiceOption[] = rng.shuffle(sampleOthers(rng, ivs, id, 6)).map((x) => ({
      id: x,
      label: x,
      sublabel: localName(getInterval(x as IntervalId).name, lang),
      sound: melodic([nameMidi(root), nameMidi(root) + getInterval(x as IntervalId).semitones], 0.6),
    }));
    return {
      prompt: { vi: stacked ? 'Hai nốt chồng lên nhau' : 'Hai nốt liền nhau', en: stacked ? 'Two stacked notes' : 'Two notes in a row' },
      title: { vi: 'Đây là quãng gì?', en: 'Which interval is this?' },
      sound: { steps: [] },
      staff: staff(stacked ? [[root, top]] : [[root], [top]]),
      options,
      correctId: id,
    };
  }

  // Chords and inversions: triads (and sevenths for inversions) on a natural or altered root.
  const qualities = o.content === 'chords' ? ['maj', 'min', 'dim', 'aug'] : ['maj', 'min', 'dom7', 'maj7', 'min7'];
  let names: string[] = [];
  let quality = 'maj';
  let rootName = '';
  let inversion = 0;
  for (let tries = 0; tries < 50; tries++) {
    rootName = o.accidentals ? pick() : rng.pick(naturals);
    quality = rng.pick(qualities);
    names = spellChord(rootName, getChord(quality));
    inversion = o.content === 'inversions' ? rng.int(0, names.length - 1) : 0;
    names = invertSpelled(names, inversion);
    const top = nameMidi(names[names.length - 1]!);
    if (top <= nameMidi(range[1]) + 3 && !names.some((n) => /##|bb/.test(n))) break;
  }
  const midis = names.map(nameMidi);
  if (o.content === 'chords') {
    const label = (q: string) => `${pcOf(rootName)}${getChord(q).symbol}`;
    const ids = rng.shuffle(sampleOthers(rng, ['maj', 'min', 'dim', 'aug'], quality, 4));
    return {
      prompt: { vi: 'Ba nốt chồng lên nhau', en: 'Three stacked notes' },
      title: { vi: 'Đây là hợp âm gì?', en: 'Which chord is this?' },
      sound: { steps: [] },
      staff: staff([names]),
      options: ids.map((q) => ({ id: q, label: label(q) || pcOf(rootName), sublabel: localName(getChord(q).name, lang), sound: harmonic(spellChord(rootName, getChord(q)).map(nameMidi), 1.5) })),
      correctId: quality,
    };
  }
  const invNames = [vi ? 'Thế gốc' : 'Root position', vi ? 'Đảo 1' : '1st inversion', vi ? 'Đảo 2' : '2nd inversion', vi ? 'Đảo 3' : '3rd inversion'];
  return {
    prompt: { vi: `Hợp âm ${pcOf(rootName)}${getChord(quality).symbol}`, en: `${pcOf(rootName)}${getChord(quality).symbol} chord` },
    title: { vi: 'Hợp âm đang ở thế nào?', en: 'Which inversion is written?' },
    sound: { steps: [] },
    staff: staff([names]),
    options: Array.from({ length: names.length }, (_, i) => ({ id: String(i), label: invNames[i]!, sound: harmonic(midis, 1.5) })),
    correctId: String(inversion),
  };
}

/** Level plan: notes → ledger lines and accidentals → intervals → chords → inversions → everything. */
function planFor(level: number, rng: Rng): Omit<ReadOptions, 'clef'> {
  if (level <= 15) return { content: 'notes', ledger: false, accidentals: false };
  if (level <= 30) return { content: 'notes', ledger: true, accidentals: level > 22 };
  if (level <= 55) return { content: 'intervals', ledger: level > 42, accidentals: level > 48 };
  if (level <= 80) return { content: 'chords', ledger: level > 68, accidentals: level > 72 };
  if (level <= 110) return { content: 'inversions', ledger: level > 95, accidentals: level > 100 };
  return { content: rng.pick(['notes', 'intervals', 'chords', 'inversions'] as const), ledger: true, accidentals: true };
}

export function readingQuestion(clef: ReadClef) {
  return (rawLevel: number, rng: Rng, ctx: { lang: string }): Question => {
    const level = effectiveLevel(rawLevel, rng);
    const q = readingRound({ clef, ...planFor(level, rng) }, rng, ctx.lang);
    return { ...q, timeLimitMs: Math.max(3500, 10000 - level * 45) };
  };
}
