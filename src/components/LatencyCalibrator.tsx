import { useEffect, useRef, useState } from 'react';
import { audio } from '../audio/engine';
import { useL } from '../app/useL';
import { clicks } from '../games/sound';

const BPM = 90;
const COUNT_IN = 4;
const TAPS = 8;

/**
 * Plays 4 count-in clicks then 8 more; the player taps along with the last 8. The median offset
 * between taps and clicks is the device's tap latency.
 */
export function LatencyCalibrator({ onResult }: { onResult: (ms: number) => void }) {
  const l = useL();
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle');
  const [result, setResult] = useState<number | null>(null);
  const taps = useRef<number[]>([]);
  const start = useRef(0);
  const beatMs = 60_000 / BPM;

  const run = async () => {
    await audio.start();
    taps.current = [];
    setResult(null);
    const s = audio.schedule(clicks(COUNT_IN + TAPS, BPM, 4).steps);
    start.current = s.startPerfMs;
    setState('running');
    window.setTimeout(() => {
      const expected = Array.from({ length: TAPS }, (_, i) => start.current + (COUNT_IN + i) * beatMs);
      const offsets = expected
        .map((t) => {
          const nearest = taps.current.reduce((best, tap) => (Math.abs(tap - t) < Math.abs(best - t) ? tap : best), Infinity);
          return Math.abs(nearest - t) < beatMs / 2 ? nearest - t : null;
        })
        .filter((x): x is number => x !== null)
        .sort((a, b) => a - b);
      setState('done');
      if (offsets.length >= 4) {
        const median = Math.round(offsets[Math.floor(offsets.length / 2)]!);
        setResult(median);
        onResult(median);
      }
    }, (COUNT_IN + TAPS + 1) * beatMs + 200);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' || state !== 'running') return;
      e.preventDefault();
      taps.current.push(e.timeStamp);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state]);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-sm" disabled={state === 'running'} onClick={() => void run()}>
          {l('Đo độ trễ', 'Measure latency')}
        </button>
        <button
          type="button"
          className="btn btn-sm flex-1"
          disabled={state !== 'running'}
          onPointerDown={(e) => taps.current.push(e.timeStamp)}
        >
          {l('Gõ theo nhịp (hoặc Space)', 'Tap along (or Space)')}
        </button>
      </div>
      <p className="text-xs text-muted">
        {state === 'running'
          ? l('Nghe 4 tiếng đếm, rồi gõ đúng theo 8 tiếng tiếp theo.', 'Hear 4 count-in clicks, then tap with the next 8.')
          : state === 'done'
            ? result === null
              ? l('Chưa đủ lần gõ, thử lại nhé.', 'Not enough taps, try again.')
              : l(`Độ trễ đo được: ${result} ms (đã lưu).`, `Measured latency: ${result} ms (saved).`)
            : l('Dùng khi game tiết tấu chấm bạn trễ hoặc sớm đều đặn.', 'Use this if the rhythm games say you are always early or late.')}
      </p>
    </div>
  );
}
