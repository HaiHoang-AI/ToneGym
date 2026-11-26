import { fitToRange } from '../../audio/pitchMath';
import {
  generateMelody, getInterval, localName, midiToName, nameMidi, spellInterval, type IntervalId, type Rng,
} from '../../theory';
import { INTERVAL_ORDER } from './intervals';
import { effectiveLevel, poolSize } from '../levels';
import { melodic } from '../sound';
import type { GameContext, Question } from '../types';

const DEFAULT_RANGE = { low: 48, high: 67 };

const tolerance = (level: number) => Math.max(25, 55 - Math.floor(level / 4));

function melodySpec(level: number) {
  if (level <= 10) return { length: 2, degrees: [0, 1, 2, 3, 4], maxLeap: 2 };
  if (level <= 25) return { length: 3, degrees: [0, 1, 2, 3, 4], maxLeap: 2 };
  if (level <= 50) return { length: 4, degrees: [0, 1, 2, 3, 4, 5, 6, 7], maxLeap: 3 };
  if (level <= 90) return { length: 6, degrees: [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7], maxLeap: 4 };
  return { length: 8, degrees: [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9], maxLeap: 5 };
}

function singableMelody(level: number, rng: Rng, ctx: GameContext) {
  const range = ctx.vocalRange ?? DEFAULT_RANGE;
  const spec = melodySpec(level);
  const scale = level > 60 && rng.next() < 0.4 ? 'naturalMinor' : 'major';
  const tonic = rng.int(range.low + 2, Math.max(range.low + 3, range.high - 9));
  const raw = generateMelody(rng, tonic, { length: spec.length, scale, degrees: spec.degrees, maxLeap: spec.maxLeap });
  const notes = fitToRange(raw, range.low, range.high);
  return { notes, tonic: notes[0]! - (raw[0]! - tonic) };
}

/** Hear a melody, sing it back. */
export function singBackQuestion(rawLevel: number, rng: Rng, ctx: GameContext): Question {
  const level = effectiveLevel(rawLevel, rng);
  const { notes, tonic } = singableMelody(level, rng, ctx);
  return {
    prompt: { vi: `Giai điệu ${notes.length} nốt`, en: `A ${notes.length}-note melody` },
    title: { vi: 'Nghe rồi hát lại', en: 'Listen, then sing it back' },
    sound: melodic(notes, 0.7),
    reference: melodic([tonic], 1),
    hint: { label: { vi: 'Nghe chậm lại', en: 'Hear it slower' }, sound: melodic(notes, 1.1) },
    options: [],
    correctId: 'ok',
    input: { kind: 'sing', targets: notes, toleranceCents: tolerance(level), octaveFree: true, showNames: false },
  };
}

/** Read a short melody on the staff and sing it, starting from a given note. */
export function sightSingQuestion(rawLevel: number, rng: Rng, ctx: GameContext): Question {
  const level = effectiveLevel(rawLevel, rng);
  const { notes } = singableMelody(level + 6, rng, ctx);
  const range = ctx.vocalRange ?? DEFAULT_RANGE;
  const clef = (range.low + range.high) / 2 < 57 ? 'bass' : 'treble';
  // Written an octave up for low voices on the treble clef is avoided by picking the bass clef.
  const names = notes.map((n) => midiToName(n, ctx.accidentals));
  return {
    prompt: { vi: 'Nốt đầu được phát trước', en: 'The first note is played for you' },
    title: { vi: 'Đọc và hát đúng cao độ', en: 'Read it and sing in tune' },
    sound: melodic([notes[0]!], 1.2),
    reference: melodic([notes[0]!], 1.2),
    hint: { label: { vi: 'Phao: nghe cả giai điệu', en: 'Life-ring: hear the melody' }, sound: melodic(notes, 0.8) },
    staff: { clef, stacks: names.map((n) => [n]) },
    options: [],
    correctId: 'ok',
    input: { kind: 'sing', targets: notes, toleranceCents: tolerance(level), octaveFree: true, showNames: false },
  };
}

/** A note plays and an interval is named; sing the second note. */
export function singIntervalQuestion(rawLevel: number, rng: Rng, ctx: GameContext): Question {
  const level = effectiveLevel(rawLevel, rng);
  const range = ctx.vocalRange ?? DEFAULT_RANGE;
  const order = (['P1', ...INTERVAL_ORDER.filter((i) => i !== 'P1' && getInterval(i).semitones <= 12)] as IntervalId[]);
  const unlocked = poolSize(level, order.length, 1, 6);
  const id = rng.pick(order.slice(Math.max(0, unlocked - 4), unlocked));
  const semis = getInterval(id).semitones;
  const descending = level > 60 && rng.next() < 0.4 && semis > 0;
  const lo = range.low + (descending ? semis : 0);
  const hi = range.high - (descending ? 0 : semis);
  const start = rng.int(Math.min(lo, hi), Math.max(lo, hi));
  const target = descending ? start - semis : start + semis;
  const startName = midiToName(start, ctx.accidentals);
  const targetName = spellInterval(startName, id, descending ? 'down' : 'up');
  const lang = ctx.lang.startsWith('vi') ? 'vi' : 'en';
  return {
    prompt: { vi: `Nốt đầu: ${startName}`, en: `First note: ${startName}` },
    title: { vi: `Hát quãng ${descending ? 'xuống' : 'lên'}`, en: `Sing the interval ${descending ? 'down' : 'up'}` },
    display: `${id} · ${localName(getInterval(id).name, lang)}`,
    sound: melodic([start], 1.2),
    reference: melodic([start], 1.2),
    hint: { label: { vi: 'Phao: nghe quãng mẫu', en: 'Life-ring: hear the interval' }, sound: melodic([start, nameMidi(targetName)], 0.8) },
    options: [],
    correctId: 'ok',
    input: { kind: 'sing', targets: [target], toleranceCents: tolerance(level), octaveFree: false, showNames: false },
  };
}
