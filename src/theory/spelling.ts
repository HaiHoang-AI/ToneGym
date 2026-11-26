import { Note, Scale } from 'tonal';
import type { ChordDef } from './chords';
import { getInterval, type IntervalId } from './intervals';

/** "F#4" → "f#/4" (VexFlow key). */
export function toVexKey(name: string): string {
  const n = Note.get(name);
  if (n.empty || n.oct === undefined) throw new Error(`Not a note with octave: ${name}`);
  return `${n.letter.toLowerCase()}${n.acc}/${n.oct}`;
}

/** Accidental of a spelled note ('', '#', 'b', '##', 'bb'). */
export function accidentalOf(name: string): string {
  return Note.get(name).acc;
}

/** Pitch-class name without octave: "F#4" → "F#". */
export function pcOf(name: string): string {
  return Note.get(name).pc;
}

/** Second note of an interval, spelled correctly from the first ("E4" + M3 → "G#4"). */
export function spellInterval(rootName: string, id: IntervalId, direction: 'up' | 'down' = 'up'): string {
  const iv = getInterval(id).tonal;
  return Note.transpose(rootName, direction === 'up' ? iv : `-${iv}`);
}

/** Tonal interval names for a chord's semitone offsets, chosen by chord context. */
function chordIntervalNames(def: ChordDef): string[] {
  const f = def.formula;
  const has = (s: number) => f.includes(s);
  const dimLike = has(3) && has(6);
  const augLike = has(4) && has(8) && !has(7);
  return f.map((s) => {
    switch (s) {
      case 0: return '1P';
      case 2: return '2M';
      case 3: return '3m';
      case 4: return '3M';
      case 5: return '4P';
      case 6: return dimLike || !has(7) ? '5d' : '4A';
      case 7: return '5P';
      case 8: return augLike ? '5A' : '6m';
      case 9: return has(6) && has(3) && !has(10) && !has(11) ? '7d' : '6M';
      case 10: return '7m';
      case 11: return '7M';
      case 13: return '9m';
      case 14: return '9M';
      case 15: return '9A';
      case 17: return '11P';
      case 18: return '11A';
      case 20: return '13m';
      case 21: return '13M';
      default: return `${s}`;
    }
  });
}

/** Chord tones spelled from a root ("D4", major → D4 F#4 A4), root position, ascending. */
export function spellChord(rootName: string, def: ChordDef): string[] {
  return chordIntervalNames(def).map((iv) => Note.transpose(rootName, iv));
}

/** Rotates a spelled chord into an inversion, raising the moved tones an octave. */
export function invertSpelled(names: readonly string[], inversion: number): string[] {
  const out = [...names];
  for (let i = 0; i < inversion; i++) {
    const low = out.shift()!;
    out.push(Note.transpose(low, '8P'));
  }
  // Re-sort by pitch in case extended tones were already above the octave.
  return out.sort((a, b) => (Note.midi(a) ?? 0) - (Note.midi(b) ?? 0));
}

const TONAL_SCALE: Record<string, string> = {
  major: 'major', naturalMinor: 'minor', harmonicMinor: 'harmonic minor', melodicMinor: 'melodic minor',
  dorian: 'dorian', phrygian: 'phrygian', lydian: 'lydian', mixolydian: 'mixolydian', locrian: 'locrian',
  majorPentatonic: 'major pentatonic', minorPentatonic: 'minor pentatonic', blues: 'blues',
  wholeTone: 'whole tone', chromatic: 'chromatic', bebopMajor: 'bebop major', bebopDorian: 'bebop minor', bebopDominant: 'bebop',
};

/** Ascending scale with the octave on top, spelled ("D4" major → D4 E4 F#4 … D5). */
export function spellScale(rootName: string, scaleId: string, semitones: readonly number[]): string[] {
  const root = Note.get(rootName);
  const rootMidi = nameMidi(rootName);
  const pcs = Scale.get(`${root.pc} ${TONAL_SCALE[scaleId] ?? scaleId}`).notes;
  const names = semitones.map((s, i) => {
    const midi = rootMidi + s;
    const pc = pcs.length === semitones.length ? pcs[i]! : Note.pitchClass(Note.fromMidi(midi));
    // Octave so that the spelled name lands on the right MIDI number (handles Cb, B#…).
    const chroma = Note.get(`${pc}4`).midi! - 60;
    const octave = Math.floor((midi - chroma) / 12) - 1;
    return `${pc}${octave}`;
  });
  return [...names, Note.transpose(rootName, '8P')];
}

export function nameMidi(name: string): number {
  const m = Note.midi(name);
  if (m === null || m === undefined) throw new Error(`Not a note: ${name}`);
  return m;
}
