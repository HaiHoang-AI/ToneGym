import {
  buildScale, getScale, localName, parseProgression, realizeProgression, type Rng,
} from '../../theory';
import { effectiveLevel, pickFromPool, poolSize } from '../levels';
import { chordSequence, harmonic, melodic } from '../sound';
import type { GameContext, Question } from '../types';

export const SCALE_ORDER: readonly string[] = [
  'major', 'naturalMinor', 'harmonicMinor', 'majorPentatonic', 'minorPentatonic', 'dorian', 'mixolydian',
  'blues', 'melodicMinor', 'lydian', 'phrygian', 'locrian', 'wholeTone', 'bebopDominant', 'chromatic',
  'bebopMajor', 'bebopDorian',
];

/** Hear a scale, name it before the timer runs out. */
export function scaleQuestion(rawLevel: number, rng: Rng, ctx: GameContext): Question {
  const level = effectiveLevel(rawLevel, rng);
  const { answer, options } = pickFromPool(SCALE_ORDER, poolSize(level, SCALE_ORDER.length, 3, 6), rng, 6);
  const root = rng.int(55, 62);
  const direction = level > 50 && rng.next() < 0.4 ? 'descending' : 'ascending';
  const gap = level < 40 ? 0.34 : 0.26;
  const scaleSound = (id: string) => melodic(buildScale(root, getScale(id), direction), gap);
  return {
    prompt: { vi: 'Một chuỗi nốt vang lên', en: 'An ordered set of notes' },
    title: { vi: 'Đây là âm giai gì?', en: 'Which scale is it?' },
    sound: scaleSound(answer),
    reference: melodic([root], 1),
    hint: { label: { vi: 'Nghe chậm lại', en: 'Hear it slower' }, sound: melodic(buildScale(root, getScale(answer), direction), 0.55) },
    options: options.map((id) => ({ id, label: localName(getScale(id).name, ctx.lang), sound: scaleSound(id) })),
    correctId: answer,
    timeLimitMs: Math.max(9000, 22000 - level * 70),
  };
}

interface ProgressionBand {
  from: number;
  key: 'major' | 'minor' | 'mixed';
  pool: string[];
  length: [number, number];
  options: number;
}

const BANDS: readonly ProgressionBand[] = [
  { from: 1, key: 'major', pool: ['I', 'IV', 'V'], length: [3, 3], options: 3 },
  { from: 11, key: 'major', pool: ['I', 'IV', 'V', 'vi'], length: [4, 4], options: 3 },
  { from: 26, key: 'major', pool: ['I', 'ii', 'iii', 'IV', 'V', 'vi'], length: [4, 4], options: 4 },
  { from: 46, key: 'major', pool: ['I', 'ii', 'IV', 'V', 'vi', 'V6', 'I6', 'IV6/4', 'V7'], length: [4, 5], options: 4 },
  { from: 71, key: 'minor', pool: ['i', 'iv', 'v', 'V', 'bVI', 'bVII', 'bIII'], length: [4, 5], options: 4 },
  { from: 100, key: 'mixed', pool: ['I', 'ii7', 'iii', 'IV', 'V7', 'vi', 'bVII', 'iv', 'Imaj7', 'V6'], length: [5, 6], options: 4 },
];

function randomProgression(band: ProgressionBand, rng: Rng): string[] {
  const length = rng.int(band.length[0], band.length[1]);
  const tonic = band.key === 'minor' ? 'i' : 'I';
  const out = [tonic];
  while (out.length < length) {
    const prev = out[out.length - 1];
    const choice = rng.pick(band.pool.filter((c) => c !== prev));
    out.push(choice);
  }
  return out;
}

/** Hear a progression, pick its Roman numerals. The hint plays the bass line. */
export function progressionQuestion(rawLevel: number, rng: Rng): Question {
  const level = effectiveLevel(rawLevel, rng);
  const band = [...BANDS].reverse().find((b) => level >= b.from) ?? BANDS[0]!;
  const correct = randomProgression(band, rng);
  const variants = new Map<string, string[]>([[correct.join('-'), correct]]);
  for (let tries = 0; variants.size < band.options && tries < 300; tries++) {
    const v = [...correct];
    const changes = rng.int(1, Math.min(2, v.length - 1));
    for (let c = 0; c < changes; c++) {
      const pos = rng.int(1, v.length - 1);
      v[pos] = rng.pick(band.pool.filter((x) => x !== v[pos] && x !== v[pos - 1]));
    }
    variants.set(v.join('-'), v);
  }
  const tonicMidi = 57 + rng.int(0, 7);
  const realize = (numerals: string[]) => realizeProgression(parseProgression(numerals.join('-')), tonicMidi);
  const answerChords = realize(correct);
  const gap = level < 40 ? 1.2 : 0.95;
  const ids = rng.shuffle([...variants.keys()]);
  return {
    prompt: { vi: 'Một vòng hợp âm vang lên', en: 'A chord progression plays' },
    title: { vi: 'Đây là vòng nào?', en: 'Which progression is it?' },
    sound: chordSequence(answerChords.map((c) => c.notes), gap),
    reference: harmonic(answerChords[0]!.notes, 1.5),
    hint: {
      label: { vi: 'Phao: nghe nốt bass', en: 'Life-ring: hear the bass' },
      sound: melodic(answerChords.map((c) => c.bass), gap),
    },
    options: ids.map((id) => ({
      id,
      label: id.split('-').join(' – '),
      sound: chordSequence(realize(variants.get(id)!).map((c) => c.notes), gap),
    })),
    correctId: correct.join('-'),
  };
}
