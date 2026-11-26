import { degreeToMidi, generateMelody, generateRhythm, scaleNotes, totalBeats, type RhythmDifficulty, type Rng } from '../../theory';
import { effectiveLevel } from '../levels';
import { melodic, overlay, clicks, rhythmSound } from '../sound';
import type { Question } from '../types';

interface MelodyBand {
  from: number;
  length: number;
  scales: string[];
  degrees: [number, number];
  /** Only the triad (degrees 0, 2, 4) in the first band. */
  triadOnly?: boolean;
  maxLeap: number;
}

const MELODY_BANDS: readonly MelodyBand[] = [
  { from: 1, length: 3, scales: ['major'], degrees: [0, 4], triadOnly: true, maxLeap: 4 },
  { from: 11, length: 4, scales: ['major'], degrees: [0, 4], maxLeap: 3 },
  { from: 26, length: 5, scales: ['major', 'naturalMinor'], degrees: [0, 7], maxLeap: 3 },
  { from: 51, length: 6, scales: ['major', 'naturalMinor'], degrees: [-2, 9], maxLeap: 4 },
  { from: 81, length: 7, scales: ['major', 'naturalMinor', 'dorian', 'mixolydian', 'harmonicMinor'], degrees: [-3, 9], maxLeap: 4 },
  { from: 121, length: 8, scales: ['major', 'naturalMinor', 'dorian', 'mixolydian', 'harmonicMinor', 'lydian'], degrees: [-3, 11], maxLeap: 5 },
];

function melodyBase(rawLevel: number, rng: Rng) {
  const level = effectiveLevel(rawLevel, rng);
  const band = [...MELODY_BANDS].reverse().find((b) => level >= b.from) ?? MELODY_BANDS[0]!;
  const scale = rng.pick(band.scales);
  const tonic = rng.int(55, 62);
  const degrees = band.triadOnly
    ? [0, 2, 4]
    : Array.from({ length: band.degrees[1] - band.degrees[0] + 1 }, (_, i) => band.degrees[0] + i);
  const target = generateMelody(rng, tonic, { length: band.length, scale, degrees, maxLeap: band.maxLeap });
  const palette = band.triadOnly
    ? [0, 2, 4].map((d) => degreeToMidi(tonic, scale, d))
    : scaleNotes(tonic, scale, band.degrees[0], band.degrees[1]);
  const gap = level < 40 ? 0.62 : 0.5;
  return { level, tonic, target, palette, gap, scale };
}

/** Hear a short melody, rebuild it on the keyboard from the highlighted notes. */
export function melodyHuntQuestion(rawLevel: number, rng: Rng): Question {
  const { tonic, target, palette, gap } = melodyBase(rawLevel, rng);
  return {
    prompt: { vi: `Giai điệu ${target.length} nốt`, en: `A ${target.length}-note melody` },
    title: { vi: 'Chơi lại giai điệu trên phím đàn', en: 'Play the melody back on the keyboard' },
    sound: melodic(target, gap),
    reference: melodic([tonic], 1),
    hint: { label: { vi: 'Nghe chậm lại', en: 'Hear it slower' }, sound: melodic(target, gap * 1.7) },
    options: [],
    correctId: 'ok',
    input: { kind: 'notes', target, palette, style: 'keyboard' },
  };
}

/** Memorise a melody, then pick each pitch in order from note buttons. */
export function melodyCopyQuestion(rawLevel: number, rng: Rng): Question {
  const { tonic, target, palette, gap } = melodyBase(rawLevel + 4, rng);
  return {
    prompt: { vi: `Nhớ ${target.length} nốt`, en: `Remember ${target.length} notes` },
    title: { vi: 'Chọn đúng từng cao độ theo thứ tự', en: 'Pick each pitch in order' },
    sound: melodic(target, gap),
    reference: melodic([tonic], 1),
    hint: { label: { vi: 'Nghe chậm lại', en: 'Hear it slower' }, sound: melodic(target, gap * 1.7) },
    options: [],
    correctId: 'ok',
    input: { kind: 'notes', target, palette, style: 'buttons' },
  };
}

function rhythmSetup(rawLevel: number, rng: Rng) {
  const level = effectiveLevel(rawLevel, rng);
  const difficulty: RhythmDifficulty = level <= 30 ? 'easy' : level <= 80 ? 'medium' : 'hard';
  let beatsPerBar = 4;
  if (level >= 20 && rng.next() < 0.3) beatsPerBar = 3;
  if (level >= 60 && rng.next() < 0.2) beatsPerBar = 5;
  const bars = level < 15 ? 1 : 2;
  const bpm = Math.min(120, 70 + Math.floor(level / 2));
  const toleranceMs = Math.max(80, 170 - level);
  return { pattern: generateRhythm(rng, difficulty, beatsPerBar, bars), bpm, toleranceMs };
}

/** Hear a rhythm, tap it back after the count-in. */
export function rhythmEchoQuestion(rawLevel: number, rng: Rng): Question {
  const { pattern, bpm, toleranceMs } = rhythmSetup(rawLevel, rng);
  return {
    prompt: { vi: `Nhịp ${pattern.beatsPerBar}/4 · ${bpm} bpm`, en: `${pattern.beatsPerBar}/4 · ${bpm} bpm` },
    title: { vi: 'Nghe rồi gõ lại tiết tấu', en: 'Listen, then tap the rhythm back' },
    sound: overlay(clicks(totalBeats(pattern), bpm, pattern.beatsPerBar), rhythmSound(pattern, bpm)),
    options: [],
    correctId: 'ok',
    input: { kind: 'rhythm', pattern, bpm, playFirst: true, showNotation: false, toleranceMs },
  };
}

/** Read a rhythm in notation, tap it in time after the count-in. */
export function rhythmReadQuestion(rawLevel: number, rng: Rng): Question {
  const { pattern, bpm, toleranceMs } = rhythmSetup(rawLevel, rng);
  return {
    prompt: { vi: `Nhịp ${pattern.beatsPerBar}/4 · ${bpm} bpm`, en: `${pattern.beatsPerBar}/4 · ${bpm} bpm` },
    title: { vi: 'Đọc và gõ đúng tiết tấu', en: 'Read and tap the rhythm' },
    sound: overlay(clicks(totalBeats(pattern), bpm, pattern.beatsPerBar), rhythmSound(pattern, bpm)),
    options: [],
    correctId: 'ok',
    input: { kind: 'rhythm', pattern, bpm, playFirst: false, showNotation: true, toleranceMs },
  };
}
