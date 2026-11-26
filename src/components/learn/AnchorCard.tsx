import { useEffect, useState } from 'react';
import { audio, type SequenceStep } from '../../audio/engine';
import { useProfile } from '../../app/ProfileContext';
import { useL } from '../../app/useL';
import type { AnchorSong } from '../../learn/types';
import { displayNoteName, midiToName } from '../../theory';

export function anchorSteps(a: AnchorSong, slow = false): SequenceStep[] {
  const beat = 60 / ((a.bpm ?? 100) * (slow ? 0.6 : 1));
  let t = 0;
  return a.notes.map((n, i) => {
    const len = (a.beats?.[i] ?? 1) * beat;
    const step = { notes: [n], at: t, duration: len * 0.95 };
    t += len;
    return step;
  });
}

export async function playAnchor(a: AnchorSong, onStep?: (i: number) => void, slow = false) {
  await audio.start();
  audio.stop();
  await audio.playSequence(anchorSteps(a, slow), onStep);
}

/** "Remember it like this": the anchor tune drawn as note bubbles, the taught notes coloured. */
export function AnchorCard({ anchor, color }: { anchor: AnchorSong; color: string }) {
  const l = useL();
  const { settings } = useProfile();
  const [active, setActive] = useState(-1);
  useEffect(() => () => audio.stop(), []);

  const lo = Math.min(...anchor.notes);
  const hi = Math.max(...anchor.notes);
  const gap = 46;
  const width = anchor.notes.length * gap + 20;
  const y = (n: number) => (hi === lo ? 70 : 118 - ((n - lo) / (hi - lo)) * 92);
  const x = (i: number) => 30 + i * gap;
  const lit = new Set(anchor.highlight);
  const name = (n: number) => displayNoteName(midiToName(n, settings.accidentals, false), settings.noteNaming);
  const hl = anchor.highlight;

  const play = (slow: boolean) => void playAnchor(anchor, setActive, slow).then(() => setActive(-1));

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface-2 p-4" data-anchor={anchor.id}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color }}>{l('Nhớ nó như thế này', 'Remember it like this')}</div>
          <div className="h-display text-lg font-bold">{l(anchor.title)}</div>
          <div className="text-xs text-muted">{l(anchor.source)}</div>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => play(false)}>▶ {l('Nghe', 'Play')}</button>
          <button type="button" className="btn btn-sm" onClick={() => play(true)}>▶ {l('Chậm', 'Slow')}</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg width={width} height={140} viewBox={`0 0 ${width} 140`} role="img" aria-label={anchor.notes.map(name).join(' ')}>
          {hl.slice(1).map((j, k) => (
            <line key={j} x1={x(hl[k]!)} y1={y(anchor.notes[hl[k]!]!)} x2={x(j)} y2={y(anchor.notes[j]!)} stroke={color} strokeWidth={3} strokeDasharray="4 4" opacity={0.6} />
          ))}
          {anchor.notes.map((n, i) => {
            const on = lit.has(i);
            const playing = active === i;
            return (
              <g key={i} transform={`translate(${x(i)} ${y(n)})`}>
                <circle r={playing ? 19 : 16} fill={on ? color : 'var(--color-surface, #222)'} stroke={on ? color : 'var(--color-line, #666)'} strokeWidth={2} style={{ transition: 'r 120ms' }} />
                <text textAnchor="middle" dy="0.35em" fontSize={11} fontWeight={700} fill={on ? '#1b1d22' : 'var(--color-ink, #eee)'}>{name(n)}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
