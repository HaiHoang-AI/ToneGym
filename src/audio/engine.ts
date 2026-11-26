import * as Tone from 'tone';

export type InstrumentId = 'piano' | 'synth';
export type EngineStatus = 'idle' | 'loading' | 'ready' | 'fallback';

/** One moment in a sequence: notes struck together, `at` seconds after the start. */
export interface SequenceStep {
  notes: readonly number[];
  at: number;
  duration: number;
  velocity?: number;
}

interface Manifest {
  files: { note: string; file: string }[];
}

const SAMPLE_BASE = `${import.meta.env.BASE_URL}samples/piano/`;

const toNoteName = (midi: number) => Tone.Frequency(midi, 'midi').toNote();

type Listener = (status: EngineStatus) => void;

/**
 * Single audio output for the whole app. Uses the sampled piano when `npm run setup`
 * has downloaded it, otherwise a soft built-in synth, so the app always makes sound.
 */
class AudioEngine {
  private volume = new Tone.Volume(-6).toDestination();
  private piano: Tone.Sampler | null = null;
  private synth: Tone.PolySynth | null = null;
  private instrument: InstrumentId = 'piano';
  private statusValue: EngineStatus = 'idle';
  private listeners = new Set<Listener>();
  private loading: Promise<void> | null = null;
  /** Bumped by stop(); pending sequence callbacks from older generations are dropped. */
  private generation = 0;
  /** Pending callbacks, each with what to run if stop() cancels it. */
  private timers = new Map<ReturnType<typeof setTimeout>, (() => void) | undefined>();

  get status(): EngineStatus {
    return this.statusValue;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setStatus(status: EngineStatus) {
    this.statusValue = status;
    this.listeners.forEach((l) => l(status));
  }

  /** Must be called from a user gesture (click/keypress) the first time: browsers block autoplay. */
  async start(): Promise<void> {
    if (Tone.getContext().state !== 'running') await Tone.start();
    await this.load();
  }

  private load(): Promise<void> {
    if (!this.loading) this.loading = this.loadPiano();
    return this.loading;
  }

  private async loadPiano(): Promise<void> {
    this.setStatus('loading');
    try {
      const res = await fetch(`${SAMPLE_BASE}manifest.json`);
      // The dev server answers unknown paths with index.html, so parse defensively.
      const manifest = (await res.json()) as Manifest;
      if (!Array.isArray(manifest.files) || manifest.files.length === 0) throw new Error('empty manifest');
      const urls: Record<string, string> = {};
      for (const f of manifest.files) urls[f.note] = f.file;
      await new Promise<void>((resolve, reject) => {
        this.piano = new Tone.Sampler({
          urls,
          baseUrl: SAMPLE_BASE,
          release: 1.2,
          onload: () => resolve(),
          onerror: (err) => reject(err),
        }).connect(this.volume);
      });
      this.setStatus('ready');
    } catch (err) {
      console.warn('Piano samples unavailable, using the built-in synth. Run `npm run setup`.', err);
      this.piano?.dispose();
      this.piano = null;
      this.setStatus('fallback');
    }
  }

  private getSynth(): Tone.PolySynth {
    if (!this.synth) {
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle8' },
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.35, release: 0.8 },
      }).connect(this.volume);
      this.synth.maxPolyphony = 64;
    }
    return this.synth;
  }

  private voice(): Tone.Sampler | Tone.PolySynth {
    if (this.instrument === 'piano' && this.piano && this.statusValue === 'ready') return this.piano;
    return this.getSynth();
  }

  setInstrument(id: InstrumentId) {
    this.instrument = id;
  }

  /** 0 (mute) … 1 (full). */
  setVolume(level: number) {
    const clamped = Math.min(1, Math.max(0, level));
    this.volume.mute = clamped === 0;
    if (clamped > 0) this.volume.volume.value = Tone.gainToDb(clamped) - 6;
  }

  /** Strike notes together right away (or `delay` seconds from now). */
  playNotes(notes: readonly number[], duration = 1.2, delay = 0, velocity = 0.8) {
    if (notes.length === 0) return;
    this.voice().triggerAttackRelease(notes.map(toNoteName), duration, Tone.now() + delay, velocity);
  }

  /**
   * Schedules steps against the audio clock. `onStep(i)` fires roughly when step i sounds
   * (useful for highlighting keys). Resolves when the last note has finished.
   */
  playSequence(steps: readonly SequenceStep[], onStep?: (index: number) => void): Promise<void> {
    const generation = this.generation;
    const start = Tone.now() + 0.05;
    const voice = this.voice();
    let end = 0;
    steps.forEach((step, i) => {
      if (step.notes.length > 0) {
        voice.triggerAttackRelease(step.notes.map(toNoteName), step.duration, start + step.at, step.velocity ?? 0.8);
      }
      end = Math.max(end, step.at + step.duration);
      if (onStep) this.later((step.at + 0.05) * 1000, generation, () => onStep(i));
    });
    return new Promise((resolve) => this.later((end + 0.05) * 1000, generation, resolve, resolve));
  }

  /** Notes one after another, `gap` seconds apart. */
  playMelodic(notes: readonly number[], gap = 0.6, onStep?: (index: number) => void): Promise<void> {
    return this.playSequence(
      notes.map((n, i) => ({ notes: [n], at: i * gap, duration: gap * 1.4 })),
      onStep,
    );
  }

  /** Chords one after another, `gap` seconds apart. */
  playChords(chords: readonly (readonly number[])[], gap = 1.1, onStep?: (index: number) => void): Promise<void> {
    return this.playSequence(
      chords.map((notes, i) => ({ notes, at: i * gap, duration: gap * 1.1 })),
      onStep,
    );
  }

  /** Silences everything and cancels pending sequence callbacks. */
  stop() {
    this.generation++;
    const pending = [...this.timers];
    this.timers.clear();
    for (const [timer, onCancel] of pending) {
      clearTimeout(timer);
      onCancel?.();
    }
    this.piano?.releaseAll();
    this.synth?.releaseAll();
  }

  private later(ms: number, generation: number, fn: () => void, onCancel?: () => void) {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      if (generation === this.generation) fn();
      else onCancel?.();
    }, ms);
    this.timers.set(timer, onCancel);
  }
}

export const audio = new AudioEngine();
