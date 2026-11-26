import { getChord, type ChordDef } from './chords';
import type { Bilingual } from './names';

/**
 * Roman numerals are read relative to the MAJOR scale of the key, with explicit
 * flats for borrowed degrees (pop/jazz convention): in C, "bVI" is Ab and "iii" is Em.
 */
export interface RomanChord {
  text: string;
  /** Semitones from the key root to the chord root. */
  offset: number;
  chord: ChordDef;
  /** 0 = root position, 1 = first inversion, … */
  inversion: number;
}

const DEGREE_OFFSETS: Record<string, number> = { I: 0, II: 2, III: 4, IV: 5, V: 7, VI: 9, VII: 11 };

const ROMAN_RE =
  /^([b#♭♯]?)(VII|VI|V|IV|III|II|I|vii|vi|v|iv|iii|ii|i)(°|o|ø|\+)?(maj7|7)?(6\/4|64|6\/5|65|4\/3|43|4\/2|42|6|2)?$/;

const TRIAD_FIGURES: Record<string, number> = { '': 0, '6': 1, '6/4': 2, '64': 2 };
const SEVENTH_FIGURES: Record<string, number> = { '': 0, '6/5': 1, '65': 1, '4/3': 2, '43': 2, '4/2': 3, '42': 3, '2': 3 };

export function parseRoman(text: string): RomanChord {
  const m = ROMAN_RE.exec(text.trim());
  if (!m) throw new Error(`Cannot parse Roman numeral "${text}"`);
  const [, accidental = '', degree = '', modifier = '', seventhMark = '', figure = ''] = m;
  const upper = degree === degree.toUpperCase();
  // A seventh chord is written explicitly ("V7"), implied by ø, or implied by a 7th-chord figure ("V65").
  const seventhFigure = figure !== '' && figure in SEVENTH_FIGURES && !(figure in TRIAD_FIGURES);
  const isSeventh = seventhMark !== '' || modifier === 'ø' || seventhFigure;

  let offset = DEGREE_OFFSETS[degree.toUpperCase()] ?? 0;
  if (accidental === 'b' || accidental === '♭') offset -= 1;
  if (accidental === '#' || accidental === '♯') offset += 1;
  offset = ((offset % 12) + 12) % 12;

  let chordId: string;
  if (!isSeventh) {
    if (modifier === '°' || modifier === 'o') chordId = 'dim';
    else if (modifier === '+') chordId = 'aug';
    else chordId = upper ? 'maj' : 'min';
  } else {
    const majorSeventh = seventhMark === 'maj7';
    if (modifier === 'ø') chordId = 'm7b5';
    else if (modifier === '°' || modifier === 'o') chordId = majorSeventh ? 'dimMaj7' : 'dim7';
    else if (modifier === '+') chordId = majorSeventh ? 'augMaj7' : 'aug7';
    else if (upper) chordId = majorSeventh ? 'maj7' : 'dom7';
    else chordId = majorSeventh ? 'mMaj7' : 'min7';
  }

  const figures = isSeventh ? SEVENTH_FIGURES : TRIAD_FIGURES;
  const inversion = figures[figure];
  if (inversion === undefined) throw new Error(`Figure "${figure}" does not fit "${text}"`);

  return { text: text.trim(), offset, chord: getChord(chordId), inversion };
}

/** "I–V–vi–IV", "I-V-vi-IV" or "I V vi IV". */
export function parseProgression(text: string): RomanChord[] {
  return text
    .split(/[\s\-–—,]+/)
    .filter(Boolean)
    .map(parseRoman);
}

export interface RealizedChord {
  roman: RomanChord;
  /** Bass note (the inversion's bass, in the low register). */
  bass: number;
  /** Upper voices in close position, led smoothly from the previous chord. */
  upper: number[];
  /** bass + upper, ascending. */
  notes: number[];
}

const mod12 = (n: number) => ((n % 12) + 12) % 12;

function voicingCost(prev: readonly number[], next: readonly number[]): number {
  if (prev.length === next.length) return next.reduce((sum, n, i) => sum + Math.abs(n - (prev[i] as number)), 0);
  return next.reduce((sum, n) => sum + Math.min(...prev.map((p) => Math.abs(n - p))), 0);
}

/** Close-position voicings of a pitch-class list whose lowest note lies in [low, high]. */
function candidateVoicings(pcs: readonly number[], low: number, high: number): number[][] {
  const out: number[][] = [];
  for (let r = 0; r < pcs.length; r++) {
    const rotated = [...pcs.slice(r), ...pcs.slice(0, r)];
    for (let start = low; start <= high; start++) {
      if (mod12(start) !== rotated[0]) continue;
      const notes = [start];
      for (const pc of rotated.slice(1)) {
        let n = (notes[notes.length - 1] as number) + 1;
        while (mod12(n) !== pc) n++;
        notes.push(n);
      }
      out.push(notes);
    }
  }
  return out;
}

/**
 * Turns Roman numerals into playable notes in the key whose tonic is `keyRootMidi`
 * (e.g. 60 for C). Bass sits two octaves below the tonic; upper voices hover around it.
 */
export function realizeProgression(chords: readonly RomanChord[], keyRootMidi: number): RealizedChord[] {
  const bassLow = keyRootMidi - 24;
  const upperLow = keyRootMidi - 5;
  const upperHigh = keyRootMidi + 6;
  const result: RealizedChord[] = [];
  let prevUpper: number[] | null = null;

  for (const roman of chords) {
    const rootPc = mod12(keyRootMidi + roman.offset);
    const pcs = [...new Set(roman.chord.formula.map((s) => mod12(rootPc + s)))];
    const bassPc = mod12(rootPc + (roman.chord.formula[roman.inversion] ?? 0));
    const bass = bassLow + mod12(bassPc - mod12(bassLow));

    const candidates = candidateVoicings(pcs, upperLow, upperHigh);
    let best = candidates[0] as number[];
    if (prevUpper === null) {
      // First chord: root position, lowest voice nearest the tonic.
      const rootPosition = candidates.filter((c) => mod12(c[0] as number) === rootPc);
      best = rootPosition.reduce((a, b) =>
        Math.abs((a[0] as number) - keyRootMidi) <= Math.abs((b[0] as number) - keyRootMidi) ? a : b,
      );
    } else {
      let bestCost = Infinity;
      for (const c of candidates) {
        const cost = voicingCost(prevUpper, c);
        if (cost < bestCost) {
          bestCost = cost;
          best = c;
        }
      }
    }
    prevUpper = best;
    result.push({ roman, bass, upper: best, notes: [bass, ...best] });
  }
  return result;
}

export interface ProgressionDef {
  id: string;
  numerals: string;
  mode: 'major' | 'minor';
  name: Bilingual;
}

const pr = (id: string, numerals: string, mode: ProgressionDef['mode'], vi: string, en: string): ProgressionDef => ({
  id, numerals, mode, name: { vi, en },
});

/** Common progressions used by the tools and as game material. */
export const PROGRESSIONS: readonly ProgressionDef[] = [
  pr('basicCadence', 'I-IV-V-I', 'major', 'Kết cơ bản', 'Basic cadence'),
  pr('plagal', 'I-IV-I', 'major', 'Kết plagal', 'Plagal cadence'),
  pr('popFour', 'I-V-vi-IV', 'major', 'Pop bốn hợp âm', 'Pop four-chord'),
  pr('fifties', 'I-vi-IV-V', 'major', 'Thập niên 50', 'Fifties progression'),
  pr('sensitive', 'vi-IV-I-V', 'major', 'Pop cảm xúc', 'Sensitive pop'),
  pr('circle', 'vi-ii-V-I', 'major', 'Vòng quãng năm', 'Circle progression'),
  pr('twoFiveOne', 'ii-V-I', 'major', 'Jazz ii–V–I', 'Jazz ii–V–I'),
  pr('twoFiveOne7', 'ii7-V7-Imaj7', 'major', 'Jazz ii7–V7–Imaj7', 'Jazz ii7–V7–Imaj7'),
  pr('canonLike', 'I-V-vi-iii-IV-I-IV-V', 'major', 'Kiểu Canon', 'Canon-style'),
  pr('mixolydianRock', 'I-bVII-IV-I', 'major', 'Rock Mixolydian', 'Mixolydian rock'),
  pr('minorPlagal', 'I-IV-iv-I', 'major', 'Plagal thứ', 'Minor plagal'),
  pr('cadential64', 'I-IV-I6/4-V-I', 'major', 'Kết có I6/4', 'Cadential six-four'),
  pr('descendingBass', 'I-V6-vi-V-IV-I6-ii-V', 'major', 'Bass đi xuống', 'Descending bass'),
  pr('blues12', 'I7-I7-I7-I7-IV7-IV7-I7-I7-V7-IV7-I7-V7', 'major', 'Blues 12 ô nhịp', '12-bar blues'),
  pr('minorCadence', 'i-iv-v-i', 'minor', 'Kết thứ', 'Minor cadence'),
  pr('minorHarmonic', 'i-iv-V-i', 'minor', 'Thứ với V trưởng', 'Minor with major V'),
  pr('andalusian', 'i-bVII-bVI-V', 'minor', 'Kết Andalusia', 'Andalusian cadence'),
  pr('epicMinor', 'i-bVI-bIII-bVII', 'minor', 'Thứ hùng tráng', 'Epic minor'),
  pr('aeolianRock', 'i-bVII-bVI-bVII', 'minor', 'Rock Aeolian', 'Aeolian rock'),
  pr('minorTwoFive', 'iiø7-V7-i', 'minor', 'Jazz ii–V–i thứ', 'Minor ii–V–i'),
];
