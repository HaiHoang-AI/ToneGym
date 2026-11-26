import type { RhythmPattern } from '../theory';
import type { Sound } from './types';

/** Notes one after another. */
export function melodic(notes: readonly number[], gap = 0.65, startAt = 0): Sound {
  return { steps: notes.map((n, i) => ({ notes: [n], at: startAt + i * gap, duration: gap * 1.3 })) };
}

/** Notes together. */
export function harmonic(notes: readonly number[], duration = 1.6, at = 0): Sound {
  return { steps: [{ notes: [...notes], at, duration }] };
}

/** Chords one after another. */
export function chordSequence(chords: readonly (readonly number[])[], gap = 1.1): Sound {
  return { steps: chords.map((c, i) => ({ notes: [...c], at: i * gap, duration: gap * 1.15 })) };
}

/** Plays sounds back to back with a pause between them. */
export function concat(sounds: readonly Sound[], pause = 0.5): Sound {
  const steps: Sound['steps'] = [];
  let offset = 0;
  for (const s of sounds) {
    let end = 0;
    for (const st of s.steps) {
      steps.push({ ...st, at: st.at + offset });
      end = Math.max(end, st.at + st.duration);
    }
    offset += end + pause;
  }
  return { steps };
}

/** Metronome clicks: `beats` ticks at `bpm`, accenting the first beat of each bar. */
export function clicks(beats: number, bpm: number, beatsPerBar: number, startAt = 0): Sound {
  const beat = 60 / bpm;
  return {
    steps: Array.from({ length: beats }, (_, i) => ({
      notes: [i % beatsPerBar === 0 ? 96 : 84],
      at: startAt + i * beat,
      duration: 0.05,
      instrument: 'click' as const,
    })),
  };
}

/** A rhythm played on one pitch. */
export function rhythmSound(p: RhythmPattern, bpm: number, startAt = 0, pitch = 76): Sound {
  const beat = 60 / bpm;
  const steps: Sound['steps'] = [];
  let t = 0;
  for (const e of p.events) {
    if (!e.rest) steps.push({ notes: [pitch], at: startAt + t * beat, duration: Math.max(0.12, e.dur * beat * 0.85) });
    t += e.dur;
  }
  return { steps };
}

/** Merges sounds that share one timeline. */
export function overlay(...sounds: Sound[]): Sound {
  return { steps: sounds.flatMap((s) => s.steps).sort((a, b) => a.at - b.at) };
}

export function soundLength(s: Sound): number {
  return s.steps.reduce((m, st) => Math.max(m, st.at + st.duration), 0);
}
