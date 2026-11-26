export interface RecordedNote {
  midi: number;
  /** Seconds from the start of the recording. */
  start: number;
  /** Seconds. */
  duration: number;
  velocity: number;
}

const PPQ = 480;

function varLen(value: number): number[] {
  let v = Math.max(0, Math.round(value));
  const bytes = [v & 0x7f];
  v >>= 7;
  while (v > 0) {
    bytes.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  return bytes;
}

const u32 = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
const u16 = (n: number) => [(n >>> 8) & 0xff, n & 0xff];

/** Standard MIDI File, format 0, one track, piano on channel 1. */
export function encodeMidi(notes: readonly RecordedNote[], bpm = 120): Uint8Array<ArrayBuffer> {
  const ticksPerSec = (PPQ * bpm) / 60;
  const events: { tick: number; bytes: number[] }[] = [];
  for (const n of notes) {
    const on = Math.round(n.start * ticksPerSec);
    const off = Math.max(on + 1, Math.round((n.start + n.duration) * ticksPerSec));
    const vel = Math.max(1, Math.min(127, Math.round(n.velocity * 127)));
    events.push({ tick: on, bytes: [0x90, n.midi & 0x7f, vel] });
    events.push({ tick: off, bytes: [0x80, n.midi & 0x7f, 0] });
  }
  // Note-offs before note-ons at the same tick so repeated notes retrigger.
  events.sort((a, b) => a.tick - b.tick || a.bytes[0]! - b.bytes[0]!);
  const usPerQuarter = Math.round(60_000_000 / bpm);
  const track: number[] = [
    0x00, 0xff, 0x51, 0x03, (usPerQuarter >> 16) & 0xff, (usPerQuarter >> 8) & 0xff, usPerQuarter & 0xff,
    0x00, 0xc0, 0x00, // program change: acoustic grand piano
  ];
  let last = 0;
  for (const e of events) {
    track.push(...varLen(e.tick - last), ...e.bytes);
    last = e.tick;
  }
  track.push(0x00, 0xff, 0x2f, 0x00);
  const header = [0x4d, 0x54, 0x68, 0x64, ...u32(6), ...u16(0), ...u16(1), ...u16(PPQ)];
  const chunk = [0x4d, 0x54, 0x72, 0x6b, ...u32(track.length), ...track];
  return new Uint8Array([...header, ...chunk]);
}

/** Reads note on/off pairs back from a file made by encodeMidi (round-trip tests, import). */
export function decodeMidi(data: Uint8Array): { bpm: number; notes: RecordedNote[] } {
  const ppq = (data[12]! << 8) | data[13]!;
  let i = 22; // after MThd (14) + MTrk header (8)
  let tick = 0;
  let usPerQuarter = 500_000;
  const open = new Map<number, { tick: number; vel: number }>();
  const raw: { midi: number; on: number; off: number; vel: number }[] = [];
  while (i < data.length) {
    let delta = 0;
    let b: number;
    do {
      b = data[i++]!;
      delta = (delta << 7) | (b & 0x7f);
    } while (b & 0x80);
    tick += delta;
    const status = data[i++]!;
    if (status === 0xff) {
      const type = data[i++]!;
      const len = data[i++]!;
      if (type === 0x51) usPerQuarter = (data[i]! << 16) | (data[i + 1]! << 8) | data[i + 2]!;
      i += len;
      if (type === 0x2f) break;
    } else if ((status & 0xf0) === 0xc0) {
      i += 1;
    } else {
      const note = data[i++]!;
      const vel = data[i++]!;
      if ((status & 0xf0) === 0x90 && vel > 0) open.set(note, { tick, vel });
      else {
        const o = open.get(note);
        if (o) raw.push({ midi: note, on: o.tick, off: tick, vel: o.vel });
        open.delete(note);
      }
    }
  }
  const bpm = Math.round(60_000_000 / usPerQuarter);
  const secPerTick = usPerQuarter / 1_000_000 / ppq;
  return {
    bpm,
    notes: raw.map((r) => ({ midi: r.midi, start: r.on * secPerTick, duration: (r.off - r.on) * secPerTick, velocity: r.vel / 127 })).sort((a, b) => a.start - b.start),
  };
}
