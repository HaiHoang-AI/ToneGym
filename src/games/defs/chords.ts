import { buildChord, getChord, localName, midiToName, type Rng } from '../../theory';
import { effectiveLevel, pickFromPool, poolSize } from '../levels';
import { harmonic, melodic } from '../sound';
import type { GameContext, Question } from '../types';

/** Teaching order for chord qualities: triads, then sevenths, then colour and extended chords. */
export const CHORD_ORDER: readonly string[] = [
  'maj', 'min', 'dim', 'aug', 'sus4', 'sus2', 'dom7', 'maj7', 'min7', 'm7b5', 'dim7', 'maj6', 'min6',
  'add9', 'madd9', 'mMaj7', 'aug7', '7sus4', 'augMaj7', 'dom9', 'maj9', 'min9', '7b9', '7s9', '6add9',
  '7b5', 'maj7b5', 'majb5', '7sus2', 'maj7sus4', 'dimMaj7', 'm6add9', 'mMaj9', '7s11', 'maj7s11',
  '9sus4', '7s5s9', 'dom11', 'min11', 'dom13', 'maj13', 'min13', '9s11', 'maj9s11', '7s9b13', '7b9b13',
];

function rootFor(level: number, rng: Rng): number {
  return level < 20 ? rng.int(53, 60) : rng.int(45, 62);
}

function voicing(level: number, rng: Rng, size: number) {
  const inversion = level > 40 && rng.next() < 0.4 ? rng.int(0, size - 1) : 0;
  const open = level > 80 && rng.next() < 0.35;
  return { inversion, open };
}

/** Hear a chord, name its quality. */
export function chordIdQuestion(rawLevel: number, rng: Rng, ctx: GameContext): Question {
  const level = effectiveLevel(rawLevel, rng);
  const { answer, options } = pickFromPool(CHORD_ORDER, poolSize(level, CHORD_ORDER.length, 3, 4), rng, 6);
  const root = rootFor(level, rng);
  const v = voicing(level, rng, getChord(answer).formula.length);
  const notes = buildChord(root, getChord(answer), v);
  return {
    prompt: { vi: 'Nhiều nốt vang cùng lúc', en: 'Several notes at once' },
    title: { vi: 'Đây là hợp âm gì?', en: 'Which chord is it?' },
    sound: harmonic(notes, 2),
    reference: melodic([root], 1),
    hint: { label: { vi: 'Nghe rải từng nốt', en: 'Hear it arpeggiated' }, sound: melodic(notes, 0.45) },
    options: options.map((id) => {
      const def = getChord(id);
      return {
        id,
        label: def.symbol === '' ? 'M' : def.symbol,
        sublabel: localName(def.name, ctx.lang),
        sound: harmonic(buildChord(root, def, v), 2),
      };
    }),
    correctId: answer,
  };
}

/** See a chord name, find which of the sounds matches it. */
export function chordByNameQuestion(rawLevel: number, rng: Rng, ctx: GameContext): Question {
  const level = effectiveLevel(rawLevel, rng);
  const count = Math.min(4, 2 + Math.floor(level / 12));
  const { answer, options } = pickFromPool(CHORD_ORDER, poolSize(level, CHORD_ORDER.length, 3, 4), rng, count);
  const root = rootFor(level, rng);
  const order = rng.shuffle(options);
  const letters = ['A', 'B', 'C', 'D'];
  const name = `${midiToName(root, ctx.accidentals, false)}${getChord(answer).symbol}`;
  return {
    prompt: { vi: 'Nghe từng phương án, chọn tiếng khớp với tên', en: 'Listen to each option and pick the one that matches' },
    title: { vi: 'Hợp âm nào là', en: 'Which one is' },
    display: name,
    sound: { steps: [] },
    options: order.map((id, i) => ({
      id,
      label: letters[i]!,
      sublabel: { vi: 'bấm để nghe', en: 'tap to hear' }[ctx.lang.startsWith('vi') ? 'vi' : 'en'],
      sound: harmonic(buildChord(root, getChord(id)), 1.8),
    })),
    correctId: answer,
    soundChoice: true,
  };
}

const INVERSION_STAGES: readonly { from: number; chords: string[]; open?: boolean }[] = [
  { from: 1, chords: ['maj', 'min'] },
  { from: 16, chords: ['maj', 'min', 'dim', 'sus4'] },
  { from: 36, chords: ['dom7', 'maj7', 'min7'] },
  { from: 60, chords: ['dom7', 'maj7', 'min7', 'm7b5', 'mMaj7'] },
  { from: 90, chords: ['maj', 'min', 'dom7', 'maj7', 'min7'], open: true },
  { from: 120, chords: ['dom9', 'min9', 'maj9'], open: true },
];

const INVERSION_NAMES = [
  { vi: 'Thế gốc', en: 'Root position' },
  { vi: 'Đảo 1', en: '1st inversion' },
  { vi: 'Đảo 2', en: '2nd inversion' },
  { vi: 'Đảo 3', en: '3rd inversion' },
  { vi: 'Đảo 4', en: '4th inversion' },
];

/** Hear a chord, tell which note is in the bass. */
export function inversionQuestion(rawLevel: number, rng: Rng, ctx: GameContext): Question {
  const level = effectiveLevel(rawLevel, rng);
  const stage = [...INVERSION_STAGES].reverse().find((s) => level >= s.from) ?? INVERSION_STAGES[0]!;
  const def = getChord(rng.pick(stage.chords));
  const size = def.formula.length;
  const inversion = rng.int(0, size - 1);
  const open = !!stage.open && rng.next() < 0.6;
  const root = rng.int(50, 58);
  const lang = ctx.lang.startsWith('vi') ? 'vi' : 'en';
  return {
    prompt: { vi: `Hợp âm ${localName(def.name, 'vi').toLowerCase()} vang lên`, en: `A ${localName(def.name, 'en').toLowerCase()} chord` },
    title: { vi: 'Hợp âm đang ở thế nào?', en: 'Which inversion is it?' },
    sound: harmonic(buildChord(root, def, { inversion, open }), 2),
    hint: {
      label: { vi: 'Nghe riêng nốt bass', en: 'Hear the bass note' },
      sound: melodic([buildChord(root, def, { inversion, open })[0]!], 1.2),
    },
    options: Array.from({ length: size }, (_, i) => ({
      id: String(i),
      label: INVERSION_NAMES[i]![lang],
      sublabel: i === 0 ? (lang === 'vi' ? 'nốt gốc ở bass' : 'root in the bass') : undefined,
      sound: harmonic(buildChord(root, def, { inversion: i, open }), 2),
    })),
    correctId: String(inversion),
  };
}
