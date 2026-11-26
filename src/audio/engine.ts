import * as Tone from 'tone';

export type InstrumentId = 'piano' | 'synth' | 'epiano' | 'organ' | 'marimba' | 'strings' | 'bell' | 'musicbox' | 'lead' | 'pad';

type Preset = () => Tone.PolySynth;

/** Synthesised voices sold in the shop (no extra downloads needed). */
const PRESETS: Record<Exclude<InstrumentId, 'piano' | 'synth'>, Preset> = {
  epiano: () => new Tone.PolySynth(Tone.FMSynth, { harmonicity: 3, modulationIndex: 6, envelope: { attack: 0.005, decay: 0.8, sustain: 0.2, release: 1 }, modulationEnvelope: { attack: 0.005, decay: 0.4, sustain: 0.1, release: 0.5 } }),
  organ: () => new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fatsine4', spread: 12, count: 3 } as never, envelope: { attack: 0.02, decay: 0.1, sustain: 0.9, release: 0.3 } }),
  marimba: () => new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.45, sustain: 0, release: 0.2 } }),
  strings: () => new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fatsawtooth', spread: 20, count: 3 } as never, envelope: { attack: 0.25, decay: 0.3, sustain: 0.8, release: 1.2 } }),
  bell: () => new Tone.PolySynth(Tone.FMSynth, { harmonicity: 5.07, modulationIndex: 12, envelope: { attack: 0.001, decay: 1.6, sustain: 0, release: 1.6 }, modulationEnvelope: { attack: 0.001, decay: 0.8, sustain: 0, release: 0.8 } }),
  musicbox: () => new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.6, sustain: 0, release: 0.6 } }),
  lead: () => new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'square8' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.3 } }),
  pad: () => new Tone.PolySynth(Tone.AMSynth, { harmonicity: 1.5, envelope: { attack: 0.4, decay: 0.5, sustain: 0.8, release: 2 } }),
};
export type EngineStatus = 'idle' | 'loading' | 'ready' | 'fallback';

/** One moment in a sequence: notes struck together, `at` seconds after the start. */
export interface SequenceStep {
  notes: readonly number[];
  at: number;
  duration: number;
  velocity?: number;
  /** 'click' plays a metronome tick instead of the instrument (notes[0] >= 90 = accented). */
  instrument?: 'click';
}

/** A scheduled sequence: when it starts (performance.now() clock) and when it ends. */
export interface Scheduled {
  startPerfMs: number;
  done: Promise<void>;
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
  private clicker: Tone.MembraneSynth | null = null;
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
    // Small look-ahead keeps taps and sounds close together for the rhythm games.
    Tone.getContext().lookAhead = 0.03;
    await this.load();
  }

  private getClicker(): Tone.MembraneSynth {
    if (!this.clicker) {
      this.clicker = new Tone.MembraneSynth({
        pitchDecay: 0.008,
        octaves: 2,
        envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.02 },
      }).connect(this.volume);
    }
    return this.clicker;
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

  private presets = new Map<string, Tone.PolySynth>();

  private preset(id: Exclude<InstrumentId, 'piano' | 'synth'>): Tone.PolySynth {
    let v = this.presets.get(id);
    if (!v) {
      v = PRESETS[id]().connect(this.volume);
      v.maxPolyphony = 64;
      v.volume.value = -6;
      this.presets.set(id, v);
    }
    return v;
  }

  private voice(): Tone.Sampler | Tone.PolySynth {
    if (this.instrument !== 'piano' && this.instrument !== 'synth') return this.preset(this.instrument);
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
    return this.schedule(steps, onStep).done;
  }

  /**
   * Like playSequence, but also reports when the first step will actually be heard, on the
   * performance.now() clock (used to line up the player's taps with the rhythm).
   */
  schedule(steps: readonly SequenceStep[], onStep?: (index: number) => void): Scheduled {
    const generation = this.generation;
    const lead = 0.08;
    const raw = Tone.getContext().rawContext as AudioContext;
    const start = raw.currentTime + lead;
    const latency = (raw.outputLatency || raw.baseLatency || 0) * 1000;
    const startPerfMs = performance.now() + lead * 1000 + latency;
    const voice = this.voice();
    let end = 0;
    steps.forEach((step, i) => {
      if (step.notes.length > 0) {
        if (step.instrument === 'click') {
          this.getClicker().triggerAttackRelease(step.notes[0]! >= 90 ? 'G5' : 'C5', 0.05, start + step.at, step.velocity ?? 0.7);
        } else {
          voice.triggerAttackRelease(step.notes.map(toNoteName), step.duration, start + step.at, step.velocity ?? 0.8);
        }
      }
      end = Math.max(end, step.at + step.duration);
      if (onStep) this.later((step.at + lead) * 1000, generation, () => onStep(i));
    });
    const done = new Promise<void>((resolve) => this.later((end + lead) * 1000, generation, resolve, resolve));
    return { startPerfMs, done };
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

  private metronomeLoop: Tone.Loop | null = null;

  /** Sample-accurate click track on the Tone transport. `onBeat(i)` fires on each beat (0 = downbeat). */
  async startMetronome(bpm: number, beatsPerBar: number, onBeat?: (beat: number) => void) {
    await this.start();
    this.stopMetronome();
    const transport = Tone.getTransport();
    transport.bpm.value = bpm;
    let beat = 0;
    this.metronomeLoop = new Tone.Loop((time) => {
      const b = beat % beatsPerBar;
      this.getClicker().triggerAttackRelease(b === 0 ? 'G5' : 'C5', 0.05, time, b === 0 ? 0.9 : 0.6);
      if (onBeat) Tone.getDraw().schedule(() => onBeat(b), time);
      beat++;
    }, '4n').start(0);
    transport.start('+0.05');
  }

  setMetronomeBpm(bpm: number) {
    Tone.getTransport().bpm.rampTo(bpm, 0.05);
  }

  stopMetronome() {
    this.metronomeLoop?.dispose();
    this.metronomeLoop = null;
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
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
    this.presets.forEach((p) => p.releaseAll());
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
