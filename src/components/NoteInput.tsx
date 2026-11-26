import { useEffect, useState } from 'react';
import { audio } from '../audio/engine';
import { useL } from '../app/useL';
import { displayNoteName, midiToName, type NoteNaming } from '../theory';
import { PianoKeyboard, type KeyMark } from './PianoKeyboard';

export interface NoteInputProps {
  length: number;
  palette: number[];
  style: 'keyboard' | 'buttons';
  naming: NoteNaming;
  accidentals: 'sharp' | 'flat';
  /** After grading: the right answer, to colour the slots. */
  reveal?: number[];
  onDone: (notes: number[]) => void;
  disabled?: boolean;
}

/** Enter a melody note by note, on a piano (palette keys highlighted) or with note buttons. */
export function NoteInput({ length, palette, style, naming, accidentals, reveal, onDone, disabled }: NoteInputProps) {
  const l = useL();
  const [notes, setNotes] = useState<number[]>([]);
  const name = (m: number) => displayNoteName(midiToName(m, accidentals), naming);

  useEffect(() => setNotes([]), [palette, length]);

  const add = (m: number) => {
    if (disabled || notes.length >= length) return;
    void audio.start().then(() => audio.playNotes([m], 0.8));
    const next = [...notes, m];
    setNotes(next);
    if (next.length === length) onDone(next);
  };

  const low = Math.min(...palette);
  const high = Math.max(...palette);
  // Keyboard spans whole white keys around the palette.
  const from = low - ([1, 3, 6, 8, 10].includes(((low - 1) % 12 + 12) % 12) ? 2 : 1);
  const to = high + ([1, 3, 6, 8, 10].includes((high + 1) % 12) ? 2 : 1);
  const marks: Record<number, KeyMark> = {};
  for (const p of palette) marks[p] = 'hint';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" aria-label={l('Các nốt đã nhập', 'Notes entered')}>
        {Array.from({ length }, (_, i) => {
          const n = notes[i];
          const right = reveal?.[i];
          const state = reveal && n !== undefined ? (n === right ? 'ok' : 'bad') : n !== undefined ? 'filled' : 'empty';
          return (
            <span
              key={i}
              className={`grid h-12 min-w-14 place-items-center rounded-xl border-2 px-2 text-sm font-bold ${
                state === 'ok' ? 'border-good bg-good/10' : state === 'bad' ? 'border-bad bg-bad/10' : state === 'filled' ? 'border-accent bg-accent/10' : 'border-dashed border-line'
              }`}
            >
              {n !== undefined ? name(n) : i + 1}
              {state === 'bad' && right !== undefined && <span className="block text-[11px] font-semibold text-good-ink">{name(right)}</span>}
            </span>
          );
        })}
        <button type="button" className="btn btn-sm" disabled={disabled || notes.length === 0} onClick={() => setNotes((n) => n.slice(0, -1))}>
          ⌫ {l('Xóa nốt', 'Undo')}
        </button>
      </div>
      {style === 'keyboard' ? (
        <PianoKeyboard from={from} to={to} marks={marks} onNote={add} sound={false} labels="all" naming={naming} accidentals={accidentals} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {palette.map((m) => (
            <button key={m} type="button" disabled={disabled} onClick={() => add(m)} className="h-display min-h-12 min-w-16 rounded-xl border border-line bg-surface-2 px-3 text-lg font-bold hover:border-accent">
              {name(m)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
