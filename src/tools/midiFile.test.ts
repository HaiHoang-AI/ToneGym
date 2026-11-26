import { describe, expect, it } from 'vitest';
import { decodeMidi, encodeMidi } from './midiFile';

describe('MIDI file', () => {
  it('writes a valid header and track', () => {
    const bytes = encodeMidi([{ midi: 60, start: 0, duration: 0.5, velocity: 0.8 }], 120);
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('MThd');
    expect(String.fromCharCode(...bytes.slice(14, 18))).toBe('MTrk');
    const trackLen = (bytes[18]! << 24) | (bytes[19]! << 16) | (bytes[20]! << 8) | bytes[21]!;
    expect(bytes.length).toBe(22 + trackLen);
    expect([...bytes.slice(-4)]).toEqual([0x00, 0xff, 0x2f, 0x00]);
  });

  it('round-trips notes and tempo', () => {
    const notes = [
      { midi: 60, start: 0, duration: 0.5, velocity: 0.8 },
      { midi: 64, start: 0.5, duration: 0.25, velocity: 0.6 },
      { midi: 67, start: 0.5, duration: 1, velocity: 1 },
      { midi: 60, start: 1.5, duration: 2.5, velocity: 0.5 },
    ];
    const back = decodeMidi(encodeMidi(notes, 90));
    expect(back.bpm).toBe(90);
    expect(back.notes).toHaveLength(4);
    back.notes.forEach((n, i) => {
      const want = [...notes].sort((a, b) => a.start - b.start || a.midi - b.midi)[i]!;
      expect(n.midi).toBe(want.midi);
      expect(n.start).toBeCloseTo(want.start, 2);
      expect(n.duration).toBeCloseTo(want.duration, 2);
    });
  });
});
