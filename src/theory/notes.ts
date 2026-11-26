import { Note } from 'tonal';

export type Accidental = 'natural' | 'sharp' | 'flat';
export type NoteNaming = 'letters' | 'solfege';

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
const LETTER_TO_SOLFEGE: Record<string, string> = {
  C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si',
};

/** Root spellings offered in settings: 7 naturals, 7 sharps, 7 flats (21 in total). */
export const ROOTS: Record<Accidental, readonly string[]> = {
  natural: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  sharp: ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#'],
  flat: ['Cb', 'Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb'],
};

export const MIDI_A4 = 69;
export const MIDI_C4 = 60;

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - MIDI_A4) / 12);
}

/** Fractional MIDI number for a frequency (used by pitch detection). */
export function freqToMidi(freq: number): number {
  return MIDI_A4 + 12 * Math.log2(freq / 440);
}

export function pitchClass(midi: number): number {
  return ((Math.round(midi) % 12) + 12) % 12;
}

export function octaveOf(midi: number): number {
  return Math.floor(Math.round(midi) / 12) - 1;
}

/** "C#4" / "Db4" style name from a MIDI number. */
export function midiToName(midi: number, prefer: 'sharp' | 'flat' = 'sharp', withOctave = true): string {
  const names = prefer === 'flat' ? FLAT_NAMES : SHARP_NAMES;
  const pc = names[pitchClass(midi)] as string;
  return withOctave ? `${pc}${octaveOf(midi)}` : pc;
}

/** MIDI number from a name such as "C4", "Eb3" or "F#5". Throws on garbage input. */
export function nameToMidi(name: string): number {
  const midi = Note.midi(name);
  if (midi === null || midi === undefined) throw new Error(`Not a note name: ${name}`);
  return midi;
}

/** MIDI number of a pitch-class name (no octave) placed in the given octave. */
export function pcNameToMidi(pcName: string, octave: number): number {
  return nameToMidi(`${pcName}${octave}`);
}

/** Spelled transposition: transpose("Eb4", "3M") === "G4". */
export function transposeName(name: string, tonalInterval: string): string {
  return Note.transpose(name, tonalInterval);
}

/** Converts "C#4" to "Do#4" when solfege naming is selected. */
export function displayNoteName(name: string, naming: NoteNaming): string {
  if (naming === 'letters') return name;
  const letter = name.charAt(0).toUpperCase();
  return (LETTER_TO_SOLFEGE[letter] ?? letter) + name.slice(1);
}

export function isBlackKey(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(pitchClass(midi));
}
