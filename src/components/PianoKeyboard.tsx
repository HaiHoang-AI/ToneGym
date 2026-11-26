import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { audio } from '../audio/engine';
import { midi } from '../audio/midi';
import { displayNoteName, isBlackKey, midiToName, pitchClass, type NoteNaming } from '../theory';

export type KeyMark = 'active' | 'correct' | 'wrong' | 'hint' | 'selected';

export interface PianoKeyboardProps {
  /** Lowest and highest MIDI notes shown (inclusive). Start and end on white keys. */
  from: number;
  to: number;
  marks?: Readonly<Record<number, KeyMark>>;
  /** Fired when a single key is struck (click, sweep, computer keyboard). */
  onNote?: (midi: number) => void;
  /** Fired when a Ctrl/Cmd chord selection is released. */
  onChord?: (notes: number[]) => void;
  /** Whether the keyboard itself makes sound. */
  sound?: boolean;
  labels?: 'c' | 'all' | 'none';
  naming?: NoteNaming;
  accidentals?: 'sharp' | 'flat';
}

const MARK_CLASSES: Record<KeyMark, { white: string; black: string }> = {
  active: { white: 'bg-teal/80', black: 'bg-teal' },
  correct: { white: 'bg-good/80', black: 'bg-good' },
  wrong: { white: 'bg-bad/80', black: 'bg-bad' },
  hint: { white: 'bg-accent/70', black: 'bg-accent' },
  selected: { white: 'bg-accent/80', black: 'bg-accent' },
};

/**
 * On-screen piano. Mouse modes: click = one note; Ctrl/Cmd+click = build a chord, released
 * with the Ctrl key (Esc cancels); Alt + move = sweep across keys.
 */
export function PianoKeyboard({
  from,
  to,
  marks = {},
  onNote,
  onChord,
  sound = true,
  labels = 'c',
  naming = 'letters',
  accidentals = 'sharp',
}: PianoKeyboardProps) {
  const [pressed, setPressed] = useState<Record<number, true>>({});
  const [selection, setSelection] = useState<number[]>([]);
  const selectionRef = useRef<number[]>([]);
  const pointerDown = useRef(false);
  const lastSwept = useRef<number | null>(null);

  const flash = useCallback((midi: number) => {
    setPressed((p) => ({ ...p, [midi]: true }));
    window.setTimeout(() => {
      setPressed((p) => {
        const next = { ...p };
        delete next[midi];
        return next;
      });
    }, 220);
  }, []);

  const strike = useCallback(
    async (midi: number) => {
      flash(midi);
      onNote?.(midi);
      if (sound) {
        await audio.start();
        audio.playNotes([midi], 1.2);
      }
    },
    [flash, onNote, sound],
  );

  const updateSelection = (next: number[]) => {
    selectionRef.current = next;
    setSelection(next);
  };

  // MIDI keyboard: every note strikes; notes pressed together (within 120 ms) also form a chord.
  const midiChord = useRef<{ notes: number[]; timer: number | null }>({ notes: [], timer: null });
  useEffect(
    () =>
      midi.onNote((note, velocity, on) => {
        if (!on) return;
        flash(note);
        onNote?.(note);
        if (sound) void audio.start().then(() => audio.playNotes([note], 1.2, 0, Math.max(0.3, velocity)));
        const c = midiChord.current;
        c.notes.push(note);
        if (c.timer) window.clearTimeout(c.timer);
        c.timer = window.setTimeout(() => {
          if (c.notes.length > 1) onChord?.([...c.notes].sort((a, b) => a - b));
          c.notes = [];
          c.timer = null;
        }, 120);
      }),
    [flash, onNote, onChord, sound],
  );

  useEffect(() => {
    const onKeyUp = async (e: KeyboardEvent) => {
      if ((e.key === 'Control' || e.key === 'Meta') && selectionRef.current.length > 0) {
        const notes = [...selectionRef.current].sort((a, b) => a - b);
        updateSelection([]);
        onChord?.(notes);
        if (sound) {
          await audio.start();
          audio.playNotes(notes, 1.6);
        }
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') updateSelection([]);
    };
    const onPointerUp = () => {
      pointerDown.current = false;
      lastSwept.current = null;
    };
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [onChord, sound]);

  const handleDown = (midi: number, e: PointerEvent) => {
    e.preventDefault();
    pointerDown.current = true;
    if (e.ctrlKey || e.metaKey) {
      const current = selectionRef.current;
      updateSelection(current.includes(midi) ? current.filter((n) => n !== midi) : [...current, midi]);
      if (sound) void audio.start().then(() => audio.playNotes([midi], 0.5));
      return;
    }
    lastSwept.current = midi;
    void strike(midi);
  };

  const handleEnter = (midi: number, e: PointerEvent) => {
    const sweeping = e.altKey || (pointerDown.current && e.buttons === 1 && !e.ctrlKey && !e.metaKey);
    if (!sweeping || lastSwept.current === midi) return;
    lastSwept.current = midi;
    void strike(midi);
  };

  const notes: number[] = [];
  for (let m = from; m <= to; m++) notes.push(m);
  const whites = notes.filter((m) => !isBlackKey(m));
  const whiteWidth = 100 / whites.length;

  const label = (midi: number) => {
    if (labels === 'none') return null;
    if (labels === 'c' && pitchClass(midi) !== 0) return null;
    return displayNoteName(midiToName(midi, accidentals), naming);
  };

  const markFor = (midi: number): KeyMark | undefined =>
    marks[midi] ?? (selection.includes(midi) ? 'selected' : pressed[midi] ? 'active' : undefined);

  return (
    <div className="relative h-40 w-full touch-none select-none sm:h-48" role="group" aria-label="Piano">
      <div className="flex h-full">
        {whites.map((midi) => {
          const mark = markFor(midi);
          return (
            <button
              key={midi}
              type="button"
              aria-label={midiToName(midi, accidentals)}
              onPointerDown={(e) => handleDown(midi, e)}
              onPointerEnter={(e) => handleEnter(midi, e)}
              className={`relative flex flex-1 items-end justify-center rounded-b-md border border-line pb-2 text-[10px] font-medium text-slate-500 transition-colors ${
                mark ? MARK_CLASSES[mark].white : 'bg-[#f3f1ea] hover:bg-white'
              }`}
            >
              {label(midi)}
            </button>
          );
        })}
      </div>
      {notes.filter(isBlackKey).map((midi) => {
        const whiteIndex = whites.filter((w) => w < midi).length;
        const mark = markFor(midi);
        return (
          <button
            key={midi}
            type="button"
            aria-label={midiToName(midi, accidentals)}
            onPointerDown={(e) => handleDown(midi, e)}
            onPointerEnter={(e) => handleEnter(midi, e)}
            style={{ left: `${whiteIndex * whiteWidth - whiteWidth * 0.3}%`, width: `${whiteWidth * 0.6}%` }}
            className={`absolute top-0 z-10 h-[62%] rounded-b-md border border-black/60 transition-colors ${
              mark ? MARK_CLASSES[mark].black : 'bg-[#1b1d22] hover:bg-[#2b2f37]'
            }`}
          >
            {labels === 'all' && (
              <span className="absolute bottom-1 left-0 right-0 text-center text-[9px] text-slate-300">{label(midi)}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

const KEY_OFFSETS: Record<string, number> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12,
};

/** Maps the computer keyboard (A W S E D … K) to notes from `base`; Z/X shift by an octave. */
export function useComputerKeyboard(onNote: (midi: number) => void, initialBase = 60) {
  const [base, setBase] = useState(initialBase);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      const key = e.key.toLowerCase();
      if (key === 'z') return setBase((b) => Math.max(24, b - 12));
      if (key === 'x') return setBase((b) => Math.min(96, b + 12));
      const offset = KEY_OFFSETS[key];
      if (offset !== undefined) onNote(base + offset);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [base, onNote]);
  return base;
}
