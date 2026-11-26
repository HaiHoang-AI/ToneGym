import { getInterval, localName, type IntervalId, type Rng } from '../../theory';
import { effectiveLevel, pickFromPool, poolSize } from '../levels';
import { concat, harmonic, melodic } from '../sound';
import type { GameContext, Question } from '../types';

/** Teaching order: wide and stable first, then thirds, steps, colourful and compound intervals. */
export const INTERVAL_ORDER: readonly IntervalId[] = [
  'P8', 'P5', 'M3', 'm3', 'P4', 'M2', 'm2', 'M6', 'm6', 'TT', 'm7', 'M7',
  'P1', 'm9', 'M9', 'm10', 'M10', 'P11', 'P12', 'A11', 'm13', 'M13', 'm14', 'M14',
];

type Direction = 'ascending' | 'descending' | 'harmonic';

const PROMPTS: Record<Direction, { vi: string; en: string }> = {
  ascending: { vi: 'Hai nốt đi lên lần lượt', en: 'Two notes, going up' },
  descending: { vi: 'Hai nốt đi xuống lần lượt', en: 'Two notes, going down' },
  harmonic: { vi: 'Hai nốt vang cùng lúc', en: 'Two notes at the same time' },
};

/** Start note range widens with the level. */
function startNote(level: number, rng: Rng, semitones: number, direction: Direction): number {
  const spread = level < 15 ? 4 : level < 40 ? 8 : 12;
  const centre = direction === 'descending' ? 64 + Math.floor(semitones / 2) : 58 - Math.floor(semitones / 2);
  return centre + rng.int(-spread, spread);
}

function intervalSound(start: number, semitones: number, direction: Direction, gap: number) {
  if (direction === 'harmonic') return harmonic([start, start + semitones], 1.8);
  return melodic(direction === 'ascending' ? [start, start + semitones] : [start, start - semitones], gap);
}

export function intervalQuestion(direction: Direction) {
  return (rawLevel: number, rng: Rng, ctx: GameContext): Question => {
    const level = effectiveLevel(rawLevel, rng);
    const order = direction === 'harmonic' ? INTERVAL_ORDER.filter((i) => i !== 'P1') : INTERVAL_ORDER;
    const unlocked = poolSize(level, order.length, 3, 5);
    const { answer, options } = pickFromPool(order, unlocked, rng, 6);
    const gap = level < 30 ? 0.75 : level < 80 ? 0.6 : 0.45;
    const start = startNote(level, rng, getInterval(answer).semitones, direction);
    return {
      prompt: PROMPTS[direction],
      title: { vi: 'Đây là quãng gì?', en: 'Which interval is it?' },
      sound: intervalSound(start, getInterval(answer).semitones, direction, gap),
      reference: melodic([start], 1),
      hint: {
        label: { vi: 'Nghe chậm từng nốt', en: 'Hear it slowly' },
        sound: melodic(direction === 'descending'
          ? [start, start - getInterval(answer).semitones]
          : [start, start + getInterval(answer).semitones], 1.1),
      },
      options: options.map((id) => ({
        id,
        label: id === 'TT' ? 'TT' : id,
        sublabel: localName(getInterval(id).name, ctx.lang),
        sound: intervalSound(start, getInterval(id).semitones, direction, gap),
      })),
      correctId: answer,
    };
  };
}

/** Three intervals; pick the widest. The size gap between them shrinks as levels rise. */
export function compareQuestion(rawLevel: number, rng: Rng): Question {
  const level = effectiveLevel(rawLevel, rng);
  const maxSize = Math.min(23, 7 + Math.floor(level / 6));
  const minGap = Math.max(1, 5 - Math.floor(level / 12));
  let sizes: number[] = [];
  for (let tries = 0; tries < 200; tries++) {
    const cand = [rng.int(1, maxSize), rng.int(1, maxSize), rng.int(1, maxSize)];
    const sorted = [...cand].sort((a, b) => a - b);
    if (sorted[1]! - sorted[0]! >= minGap && sorted[2]! - sorted[1]! >= minGap) {
      sizes = cand;
      break;
    }
  }
  if (sizes.length === 0) sizes = [2, 2 + minGap, 2 + 2 * minGap];
  const harmonicMode = level > 60 && rng.next() < 0.5;
  const parts = sizes.map((s) => {
    const start = 55 + rng.int(-4, 4);
    return harmonicMode ? harmonic([start, start + s], 1.2) : melodic([start, start + s], 0.5);
  });
  const widest = sizes.indexOf(Math.max(...sizes));
  return {
    prompt: { vi: 'Ba quãng lần lượt', en: 'Three intervals in a row' },
    title: { vi: 'Quãng nào rộng nhất?', en: 'Which interval is the widest?' },
    sound: concat(parts, 0.6),
    options: parts.map((sound, i) => ({
      id: String(i + 1),
      label: `#${i + 1}`,
      sublabel: i === 0 ? 'thứ nhất / first' : i === 1 ? 'thứ hai / second' : 'thứ ba / third',
      sound,
    })),
    correctId: String(widest + 1),
  };
}
