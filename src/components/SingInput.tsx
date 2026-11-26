import { useEffect, useRef, useState } from 'react';
import { audio } from '../audio/engine';
import { centsFromTarget, nearestNote, StabilityTracker } from '../audio/pitchMath';
import { useMicPitch } from '../audio/useMicPitch';
import { useL } from '../app/useL';
import { displayNoteName, midiToName, type NoteNaming } from '../theory';

export interface SingResult {
  /** Per target: the held pitch (fractional MIDI) and whether it matched. */
  notes: { target: number; sung: number | null; ok: boolean }[];
  passed: boolean;
}

export interface SingInputProps {
  targets: number[];
  toleranceCents: number;
  octaveFree: boolean;
  /** Show the target note names (sight-singing hides them: the staff shows the notes). */
  showNames: boolean;
  naming: NoteNaming;
  accidentals: 'sharp' | 'flat';
  disabled?: boolean;
  onDone: (r: SingResult) => void;
}

/** Cents meter: −50 … +50 around the target or the nearest note. */
export function CentsMeter({ cents, active }: { cents: number | null; active: boolean }) {
  const pos = cents === null ? 50 : Math.max(0, Math.min(100, 50 + cents));
  const near = cents !== null && Math.abs(cents) <= 15;
  return (
    <div className="relative h-3 w-full rounded-full bg-surface-2" aria-hidden="true">
      <div className="absolute left-1/2 top-[-4px] h-5 w-0.5 -translate-x-1/2 bg-muted" />
      {active && cents !== null && (
        <div className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left] duration-75" style={{ left: `${pos}%`, background: near ? '#34d399' : '#f4b740' }} />
      )}
    </div>
  );
}

/**
 * Sing the targets one by one into the microphone. A note counts once it is held steadily;
 * it is right when within `toleranceCents` of the target.
 */
export function SingInput({ targets, toleranceCents, octaveFree, showNames, naming, accidentals, disabled, onDone }: SingInputProps) {
  const l = useL();
  const [listening, setListening] = useState(false);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<SingResult['notes']>([]);
  const tracker = useRef(new StabilityTracker());
  const finished = useRef(false);
  const name = (m: number) => displayNoteName(midiToName(m, accidentals), naming);

  useEffect(() => {
    setIndex(0);
    setResults([]);
    finished.current = false;
    tracker.current.reset();
  }, [targets]);

  // Results live in a ref so the mic callback can update them without nested state updates.
  const resultsRef = useRef<SingResult['notes']>([]);
  useEffect(() => {
    resultsRef.current = [];
  }, [targets]);

  const { state, reading } = useMicPitch(listening && !disabled, (r, t) => {
    if (finished.current) return;
    const held = tracker.current.push(r.midi, t);
    if (held === null) return;
    const i = resultsRef.current.length;
    const target = targets[i];
    if (target === undefined) return;
    const ok = Math.abs(centsFromTarget(held, target, octaveFree)) <= toleranceCents;
    const next = [...resultsRef.current, { target, sung: held, ok }];
    resultsRef.current = next;
    setResults(next);
    setIndex(next.length);
    if (next.length === targets.length) {
      finished.current = true;
      setListening(false);
      onDone({ notes: next, passed: next.every((n) => n.ok) });
    }
  });

  const current = targets[index];
  const cents = reading.midi === null ? null : current !== undefined ? Math.round(centsFromTarget(reading.midi, current, octaveFree)) : nearestNote(reading.freq!).cents;
  const heard = reading.midi === null ? null : nearestNote(reading.freq!);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" aria-label={l('Các nốt cần hát', 'Notes to sing')}>
        {targets.map((t, i) => {
          const r = results[i];
          const cls = r ? (r.ok ? 'border-good bg-good/10' : 'border-bad bg-bad/10') : i === index && listening ? 'border-accent bg-accent/10' : 'border-dashed border-line';
          return (
            <span key={i} className={`grid h-12 min-w-14 place-items-center rounded-xl border-2 px-2 text-sm font-bold ${cls}`}>
              {showNames || r ? name(t) : i + 1}
              {r && !r.ok && r.sung !== null && <span className="block text-[11px] font-semibold text-bad-ink">{name(Math.round(r.sung))}</span>}
            </span>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted">{l('Bạn đang hát', 'You are singing')}</span>
          <span className="h-display text-2xl font-bold" aria-live="polite">{heard ? name(heard.midi) : '—'}</span>
          <span className="text-sm text-muted">{cents === null ? '' : `${cents > 0 ? '+' : ''}${cents}¢`}</span>
        </div>
        <CentsMeter cents={cents} active={listening} />
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg"><div className="h-full bg-teal" style={{ width: `${reading.level * 100}%` }} /></div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {!listening ? (
          <button type="button" className="btn btn-primary" disabled={disabled || results.length === targets.length} onClick={() => setListening(true)}>
            🎤 {l('Bật micro và hát', 'Turn on the mic and sing')}
          </button>
        ) : (
          <button type="button" className="btn" onClick={() => setListening(false)}>{l('Tạm dừng micro', 'Pause the mic')}</button>
        )}
        {current !== undefined && (
          <button type="button" className="btn" onClick={() => void audio.start().then(() => audio.playNotes([current], 1.2))}>
            ▶ {l('Nghe nốt cần hát', 'Hear the target')}
          </button>
        )}
        <span className="text-sm text-muted">
          {state === 'denied'
            ? l('Trình duyệt chặn micro. Cho phép micro cho localhost rồi thử lại.', 'The browser blocked the mic. Allow it for localhost and try again.')
            : state === 'unsupported'
              ? l('Trình duyệt này không hỗ trợ micro.', 'This browser has no microphone support.')
              : listening
                ? l(`Giữ nốt ${index + 1} thật đều khoảng nửa giây`, `Hold note ${index + 1} steadily for about half a second`)
                : ''}
        </span>
      </div>
    </div>
  );
}
