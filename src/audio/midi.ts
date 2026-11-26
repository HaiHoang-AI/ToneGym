import { useEffect, useState, useSyncExternalStore } from 'react';

type NoteListener = (midi: number, velocity: number, on: boolean) => void;

interface MidiState {
  supported: boolean;
  connected: boolean;
  devices: string[];
  error: string | null;
}

/**
 * Web MIDI input shared by the whole app: one connection, many listeners
 * (on-screen keyboards, exercises, the piano recorder).
 */
class MidiHub {
  private state: MidiState = {
    supported: typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator,
    connected: false,
    devices: [],
    error: null,
  };
  private listeners = new Set<NoteListener>();
  private watchers = new Set<() => void>();

  get snapshot(): MidiState {
    return this.state;
  }

  subscribe = (fn: () => void) => {
    this.watchers.add(fn);
    return () => this.watchers.delete(fn);
  };

  private set(patch: Partial<MidiState>) {
    this.state = { ...this.state, ...patch };
    this.watchers.forEach((w) => w());
  }

  onNote(fn: NoteListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Feeds a note as if it came from a device (used by tests). */
  emit(midi: number, velocity: number, on: boolean) {
    this.listeners.forEach((l) => l(midi, velocity, on));
  }

  async connect(): Promise<void> {
    if (!this.state.supported) return;
    try {
      const access = await navigator.requestMIDIAccess();
      const attach = () => {
        const names: string[] = [];
        access.inputs.forEach((input) => {
          names.push(input.name ?? 'MIDI');
          input.onmidimessage = (e) => {
            const data = e.data;
            if (!data || data.length < 3) return;
            const [status, note, vel] = [data[0]!, data[1]!, data[2]!];
            const cmd = status & 0xf0;
            if (cmd === 0x90 && vel > 0) this.emit(note, vel / 127, true);
            else if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) this.emit(note, 0, false);
          };
        });
        this.set({ connected: true, devices: names, error: null });
      };
      attach();
      access.onstatechange = attach;
    } catch (err) {
      this.set({ error: String(err) });
    }
  }
}

export const midi = new MidiHub();

declare global {
  interface Window {
    __earlabMidi?: MidiHub;
  }
}
if (typeof window !== 'undefined') window.__earlabMidi = midi;

export function useMidiState(): MidiState {
  return useSyncExternalStore(midi.subscribe, () => midi.snapshot);
}

/** Calls `fn` for each MIDI note-on while mounted. */
export function useMidiNotes(fn: (note: number, velocity: number) => void, enabled = true) {
  const [cb] = useState(() => ({ current: fn }));
  cb.current = fn;
  useEffect(() => {
    if (!enabled) return;
    return midi.onNote((n, v, on) => {
      if (on) cb.current(n, v);
    });
  }, [enabled, cb]);
}
