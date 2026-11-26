import { useEffect, useRef, useState } from 'react';
import { PitchDetector } from 'pitchy';
import { freqToMidiFloat } from './pitchMath';

export interface PitchReading {
  /** Hz, or null when nothing clear is heard. */
  freq: number | null;
  /** Fractional MIDI number, or null. */
  midi: number | null;
  clarity: number;
  /** Input loudness 0…1. */
  level: number;
}

export type MicState = 'off' | 'starting' | 'on' | 'denied' | 'unsupported';

declare global {
  interface Window {
    /** e2e tests can set a fake sung pitch (MIDI) instead of using the microphone. */
    __earlabFakePitch?: number | null;
  }
}

const SILENT: PitchReading = { freq: null, midi: null, clarity: 0, level: 0 };

/**
 * Listens to the microphone while `active` and calls `onReading` ~30 times per second.
 * Returns the mic state and the latest reading for display.
 */
export function useMicPitch(active: boolean, onReading?: (r: PitchReading, t: number) => void, a4 = 440) {
  const [state, setState] = useState<MicState>('off');
  const [reading, setReading] = useState<PitchReading>(SILENT);
  const cb = useRef(onReading);
  cb.current = onReading;

  useEffect(() => {
    if (!active) {
      setState('off');
      setReading(SILENT);
      return;
    }
    let stopped = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;

    const loopFake = () => {
      if (stopped) return;
      const fake = window.__earlabFakePitch;
      const r: PitchReading = typeof fake === 'number'
        ? { freq: 440 * Math.pow(2, (fake - 69) / 12), midi: fake, clarity: 1, level: 0.5 }
        : SILENT;
      setReading(r);
      cb.current?.(r, performance.now());
      raf = window.setTimeout(loopFake, 33) as unknown as number;
    };

    if (window.__earlabFakePitch !== undefined) {
      setState('on');
      loopFake();
      return () => {
        stopped = true;
        window.clearTimeout(raf);
      };
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unsupported');
      return;
    }
    setState('starting');
    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
        if (stopped) return;
        ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        const buffer = new Float32Array(analyser.fftSize);
        const detector = PitchDetector.forFloat32Array(analyser.fftSize);
        detector.minVolumeDecibels = -45;
        setState('on');
        const tick = () => {
          if (stopped || !ctx) return;
          analyser.getFloatTimeDomainData(buffer);
          let sum = 0;
          for (const v of buffer) sum += v * v;
          const level = Math.min(1, Math.sqrt(sum / buffer.length) * 4);
          const [freq, clarity] = detector.findPitch(buffer, ctx.sampleRate);
          const ok = clarity > 0.9 && freq > 60 && freq < 1500;
          const r: PitchReading = ok ? { freq, midi: freqToMidiFloat(freq, a4), clarity, level } : { freq: null, midi: null, clarity, level };
          setReading(r);
          cb.current?.(r, performance.now());
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setState('denied');
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close();
    };
  }, [active, a4]);

  return { state, reading };
}
