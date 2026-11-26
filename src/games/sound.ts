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

export function soundLength(s: Sound): number {
  return s.steps.reduce((m, st) => Math.max(m, st.at + st.duration), 0);
}
