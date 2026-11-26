import { useCallback, useEffect, useRef, useState } from 'react';
import { audio } from '../audio/engine';
import { useL } from '../app/useL';
import { clicks, overlay, rhythmSound } from '../games/sound';
import type { Sound } from '../games/types';
import { gradeTaps, onsets, totalBeats, type RhythmPattern, type TapGrade } from '../theory';
import { RhythmNotation } from './RhythmNotation';

type Phase = 'idle' | 'listening' | 'countin' | 'recording' | 'graded';

export interface RhythmInputProps {
  pattern: RhythmPattern;
  bpm: number;
  playFirst: boolean;
  showNotation: boolean;
  toleranceMs: number;
  latencyMs: number;
  theme?: string;
  /** Called once with the result. */
  onDone: (grade: TapGrade) => void;
  disabled?: boolean;
}

const shift = (s: Sound, by: number): Sound => ({ steps: s.steps.map((st) => ({ ...st, at: st.at + by })) });

/**
 * Plays a count-in (and, for echo games, the rhythm first), then records taps on Space or the
 * tap pad and grades them against the expected onsets.
 */
export function RhythmInput({ pattern, bpm, playFirst, showNotation, toleranceMs, latencyMs, theme, onDone, disabled }: RhythmInputProps) {
  const l = useL();
  const [phase, setPhase] = useState<Phase>('idle');
  const [grade, setGrade] = useState<TapGrade | null>(null);
  const [beat, setBeat] = useState(0);
  const taps = useRef<number[]>([]);
  const recordStart = useRef(0);
  const timer = useRef<number | null>(null);
  const beatMs = 60_000 / bpm;
  const length = totalBeats(pattern);
  const expected = onsets(pattern).map((b) => b * beatMs);

  useEffect(() => {
    setPhase('idle');
    setGrade(null);
    taps.current = [];
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [pattern]);

  const start = useCallback(async () => {
    if (disabled || (phase !== 'idle' && phase !== 'graded')) return;
    await audio.start();
    audio.stop();
    taps.current = [];
    setGrade(null);
    const bar = pattern.beatsPerBar;
    const beatSec = 60 / bpm;
    // Timeline (in beats): [listen: count-in + rhythm] → count-in → record.
    const listenBeats = playFirst ? bar + length : 0;
    const parts: Sound[] = [];
    if (playFirst) {
      parts.push(clicks(bar, bpm, bar));
      parts.push(shift(overlay(clicks(length, bpm, bar), rhythmSound(pattern, bpm)), bar * beatSec));
    }
    parts.push(shift(clicks(bar + length, bpm, bar), listenBeats * beatSec));
    const scheduled = audio.schedule(overlay(...parts).steps);
    recordStart.current = scheduled.startPerfMs + (listenBeats + bar) * beatMs;
    // Lets the e2e tests tap in time.
    (window as unknown as { __earlabRhythm?: unknown }).__earlabRhythm = { recordStart: recordStart.current, expectedMs: expected, latencyMs };
    setPhase(playFirst ? 'listening' : 'countin');
    const tick = () => {
      const now = performance.now();
      const sinceCountIn = now - (scheduled.startPerfMs + listenBeats * beatMs);
      if (sinceCountIn < 0) setPhase('listening');
      else if (now < recordStart.current) {
        setPhase('countin');
        setBeat(Math.floor(sinceCountIn / beatMs) + 1);
      } else if (now < recordStart.current + (length + 0.75) * beatMs) setPhase('recording');
      else {
        const g = gradeTaps(expected, taps.current.map((t) => t - recordStart.current - latencyMs), toleranceMs);
        setGrade(g);
        setPhase('graded');
        onDone(g);
        return;
      }
      timer.current = window.setTimeout(tick, 30);
    };
    tick();
  }, [disabled, phase, pattern, bpm, playFirst, length, beatMs, expected, latencyMs, toleranceMs, onDone]);

  const tap = useCallback((at: number) => {
    if (phase === 'countin' || phase === 'recording') taps.current.push(at);
  }, [phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' || e.repeat) return;
      e.preventDefault();
      if (phase === 'idle') void start();
      else tap(e.timeStamp);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, start, tap]);

  const reveal = showNotation || phase === 'graded';
  const span = (length + 0.75) * beatMs;
  const status = {
    idle: l('Bấm "Bắt đầu" hoặc phím Space', 'Press Start or Space'),
    listening: l('Nghe tiết tấu…', 'Listen…'),
    countin: l(`Đếm vào… ${beat}`, `Count-in… ${beat}`),
    recording: l('Gõ ngay! (Space hoặc chạm vào ô)', 'Tap now! (Space or the pad)'),
    graded: grade?.passed ? l('Chuẩn nhịp!', 'Right in time!') : l('Lệch nhịp rồi', 'Off the beat'),
  }[phase];

  return (
    <div className="flex flex-col gap-4">
      {reveal && (
        <div className="rounded-xl border border-line bg-surface-2 px-2 py-1">
          <RhythmNotation pattern={pattern} theme={theme} />
        </div>
      )}
      {grade && (
        <div className="relative h-10 rounded-xl bg-surface-2" aria-label={l('Kết quả từng nốt', 'Per-note result')}>
          {grade.expected.map((e, i) => (
            <span
              key={`e${i}`}
              title={e.hit ? `${e.errorMs! > 0 ? '+' : ''}${e.errorMs} ms` : l('trượt', 'missed')}
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{ left: `${4 + (e.at / span) * 92}%`, background: e.hit ? '#34d399' : 'transparent', borderColor: e.hit ? '#34d399' : '#f87171' }}
            />
          ))}
          {grade.extra.map((t, i) => (
            <span key={`x${i}`} className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bad" style={{ left: `${4 + (Math.max(0, Math.min(span, t)) / span) * 92}%` }} />
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary" disabled={disabled || (phase !== 'idle' && phase !== 'graded')} onClick={() => void start()}>
          {phase === 'graded' ? l('Thử lại', 'Again') : l('Bắt đầu', 'Start')} <span className="kbd">Space</span>
        </button>
        <span className="text-sm font-semibold" aria-live="polite">{status}</span>
        {grade && (
          <span className="text-sm text-muted">
            {l(`${grade.expected.filter((e) => e.hit).length}/${grade.expected.length} nốt đúng nhịp`, `${grade.expected.filter((e) => e.hit).length}/${grade.expected.length} on time`)}
            {grade.extra.length > 0 && l(` · ${grade.extra.length} lần gõ thừa`, ` · ${grade.extra.length} extra taps`)}
          </span>
        )}
      </div>
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          tap(e.timeStamp);
        }}
        className={`h-28 rounded-2xl border-2 text-lg font-bold transition select-none touch-none ${phase === 'recording' ? 'border-accent bg-accent/15 text-ink' : 'border-line bg-surface text-muted'}`}
      >
        {l('Chạm để gõ', 'Tap here')}
      </button>
    </div>
  );
}
