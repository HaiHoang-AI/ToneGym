import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { audio } from '../../audio/engine';
import { useProfile } from '../../app/ProfileContext';
import { useL } from '../../app/useL';
import { compareSound, itemLabel, itemName, itemPc, itemSymbol, PITCH_ITEMS, questionSound } from '../../learn/generators';
import type { LearnQuestion, PathId } from '../../learn/types';
import { displayNoteName, midiToName } from '../../theory';
import { PianoKeyboard, type KeyMark } from '../PianoKeyboard';

declare global {
  interface Window {
    __earlabLearn?: { phase: string; answerId?: string; key?: string; index: number };
  }
}

export const CORRECT_DELAY = 450;

export interface QuestionCardProps {
  pathId: PathId;
  q: LearnQuestion;
  /** Answer items offered (sorted). */
  options: string[];
  /** Yes/no question about this item. */
  yesItem?: string;
  /** Answer shown in advance; wrong presses only flash. */
  helped?: boolean;
  timeLimitMs?: number;
  label: string;
  counter?: string;
  color: string;
  /** Extra buttons next to "Replay". */
  extra?: ReactNode;
  /** For the e2e hook. */
  hook: { phase: string; index: number };
  /** First graded answer of the question (not called for helped questions). */
  onResult?: (correct: boolean) => void;
  /** Move on to the next question. */
  onNext: () => void;
}

/** One ear-training question: plays itself, takes the answer, shows feedback. Remount it per question. */
export function QuestionCard({ pathId, q, options, yesItem, helped = false, timeLimitMs, label, counter, color, extra, hook, onResult, onNext }: QuestionCardProps) {
  const l = useL();
  const s = useProfile().settings;
  const [feedback, setFeedback] = useState<{ chosen: string | null; ok: boolean } | null>(null);
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);
  const done = useRef(false);
  const isYesNo = !!yesItem;
  const isPitch = pathId === 'pitch';
  const usePiano = isPitch && !isYesNo && s.learnPitchInput !== 'buttons';

  const name = useCallback(
    (id: string) => (pathId === 'pitch' ? displayNoteName(itemLabel(id), s.noteNaming) : `${itemSymbol(pathId, id)} · ${l(itemName(pathId, id) ?? id)}`),
    [s.noteNaming, l, pathId],
  );

  const play = useCallback(async () => {
    await audio.start();
    audio.stop();
    await audio.playSequence(questionSound(q).steps);
  }, [q]);

  useEffect(() => {
    void play();
  }, [play]);

  const next = useCallback(() => {
    if (done.current) return;
    done.current = true;
    onNext();
  }, [onNext]);

  const answer = useCallback(
    (id: string) => {
      if (feedback) return;
      const ok = id === q.answerId;
      if (helped) {
        if (!ok) {
          setWrongFlash(id);
          window.setTimeout(() => setWrongFlash(null), 400);
          return;
        }
        setFeedback({ chosen: id, ok: true });
        window.setTimeout(next, CORRECT_DELAY);
        return;
      }
      onResult?.(ok);
      setFeedback({ chosen: id, ok });
      if (ok) window.setTimeout(next, CORRECT_DELAY);
      else if (s.learnCompare !== false) {
        const sound = compareSound(pathId, q, id, yesItem);
        if (sound) void audio.start().then(() => { audio.stop(); return audio.playSequence(sound.steps); });
      }
    },
    [feedback, q, helped, next, onResult, s.learnCompare, pathId, yesItem],
  );

  // Time limit.
  useEffect(() => {
    if (feedback || helped || !timeLimitMs) return;
    const t = window.setTimeout(() => {
      onResult?.(false);
      setFeedback({ chosen: null, ok: false });
    }, timeLimitMs);
    return () => window.clearTimeout(t);
  }, [feedback, helped, timeLimitMs, onResult]);

  // Number keys for the buttons, Enter for "Next".
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && feedback && !feedback.ok) return next();
      if (usePiano) return;
      const n = Number(e.key);
      const choices = isYesNo ? ['yes', 'no'] : options;
      if (n >= 1 && n <= choices.length) answer(choices[n - 1]!);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [usePiano, isYesNo, options, answer, feedback, next]);

  // Test hook.
  useEffect(() => {
    window.__earlabLearn = {
      ...hook,
      answerId: q.answerId,
      key: usePiano ? midiToName(60 + itemPc(q.answerId), s.accidentals) : undefined,
    };
  }, [hook.phase, hook.index, q, usePiano, s.accidentals]); // eslint-disable-line react-hooks/exhaustive-deps

  const text = (() => {
    if (isYesNo) return l(`Có phải ${name(yesItem!)} không?`, `Is it ${name(yesItem!)}?`);
    if (isPitch) return q.notes.length > 1 ? l('Nốt cuối cùng là nốt gì?', 'What is the last note?') : l('Nốt vừa nghe là nốt gì?', 'Which note was that?');
    if (pathId === 'chords') return l('Hợp âm gì?', 'Which chord?');
    if (pathId === 'progressions') return l('Vòng hợp âm nào? (bắt đầu từ chủ âm)', 'Which progression? (starts on the tonic)');
    if (pathId === 'scales') return q.notes[0]! > q.notes.at(-1)! ? l('Âm giai gì? (đi xuống)', 'Which scale? (going down)') : l('Âm giai gì? (đi lên)', 'Which scale? (going up)');
    const how = q.harmonic ? l('vang cùng lúc', 'together') : q.notes[1]! < q.notes[0]! ? l('đi xuống', 'going down') : l('đi lên', 'going up');
    return l(`Quãng gì? (${how})`, `Which interval? (${how})`);
  })();

  const stateOf = (id: string) =>
    feedback
      ? id === q.answerId ? 'border-good bg-good/15' : feedback.chosen === id ? 'border-bad bg-bad/15' : 'border-line'
      : wrongFlash === id ? 'border-bad bg-bad/15' : helped && id === q.answerId ? 'border-accent bg-accent/15' : 'border-line';

  const marks: Record<number, KeyMark> = {};
  if (usePiano) {
    const key = (id: string) => 60 + itemPc(id);
    if (helped && !feedback) marks[key(q.answerId)] = 'hint';
    if (wrongFlash) marks[key(wrongFlash)] = 'wrong';
    if (feedback) {
      if (feedback.chosen && !feedback.ok) marks[key(feedback.chosen)] = 'wrong';
      marks[key(q.answerId)] = 'correct';
    }
  }

  return (
    <section className="card flex flex-col gap-4" data-question={q.itemId}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color }}>{label}</div>
          <div className="text-lg font-semibold">{text}</div>
        </div>
        {counter && <div className="text-sm font-semibold text-muted">{counter}</div>}
      </div>
      {timeLimitMs && !helped && !feedback && (
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full origin-left" style={{ background: color, animation: `learn-timer ${timeLimitMs}ms linear forwards` }} />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm" onClick={() => void play()}>↻ {l('Nghe lại', 'Replay')}</button>
        {extra}
      </div>

      {isYesNo ? (
        <div className="grid grid-cols-2 gap-3">
          {(['yes', 'no'] as const).map((id) => (
            <button key={id} type="button" data-answer={id} className={`min-h-16 rounded-2xl border-2 bg-surface-2 text-lg font-bold ${stateOf(id)}`} onClick={() => answer(id)}>
              {id === 'yes' ? l(`Có — là ${name(yesItem!)}`, `Yes — it is ${name(yesItem!)}`) : l('Không', 'No')}
            </button>
          ))}
        </div>
      ) : usePiano ? (
        <PianoKeyboard
          from={60}
          to={71}
          sound={false}
          enabled={options.map((id) => 60 + itemPc(id))}
          labels={s.learnKeyNames ? 'all' : 'c'}
          naming={s.noteNaming}
          accidentals={s.accidentals}
          marks={marks}
          onNote={(m) => {
            const id = PITCH_ITEMS[((m % 12) + 12) % 12]!;
            if (options.includes(id)) answer(id);
          }}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((id, i) => (
            <button key={id} type="button" data-answer={id} className={`min-h-12 min-w-14 rounded-xl border-2 bg-surface-2 px-3 py-1 font-bold ${stateOf(id)}`} onClick={() => answer(id)}>
              {isPitch ? name(id) : (
                <span className="flex flex-col items-center leading-tight">
                  <span className="text-lg">{itemSymbol(pathId, id)}</span>
                  <span className="text-[11px] font-medium text-muted">{i + 1 <= 9 ? `${i + 1} · ` : ''}{l(itemName(pathId, id) ?? '')}</span>
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {feedback && !feedback.ok && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-bad/10 px-4 py-3">
          <span className="font-semibold text-bad-ink">
            {feedback.chosen === null ? l('Hết giờ! ', 'Time is up! ') : ''}
            {isYesNo
              ? l(`Đó là ${name(q.itemId)}.`, `That was ${name(q.itemId)}.`)
              : l(`Đáp án: ${name(q.answerId)}${feedback.chosen ? ` — bạn chọn ${name(feedback.chosen)}` : ''}`, `Answer: ${name(q.answerId)}${feedback.chosen ? ` — you picked ${name(feedback.chosen)}` : ''}`)}
          </span>
          <button type="button" className="btn btn-primary btn-sm" onClick={next}>{l('Tiếp', 'Next')} →</button>
        </div>
      )}
      {feedback && !isPitch && !q.chords && (
        <PianoKeyboard from={36} to={84} sound={false} labels="c" naming={s.noteNaming} accidentals={s.accidentals} marks={Object.fromEntries([...q.notes, ...(q.tail ?? [])].map((n) => [n, 'correct' as KeyMark]))} />
      )}
      {feedback?.ok && !helped && <div className="font-semibold text-good-ink">✓ {l('Đúng!', 'Right!')}</div>}
      {helped && <p className="text-sm text-muted">{l('Đáp án đang sáng — nghe rồi bấm theo để làm quen.', 'The answer is lit — listen and press it to get used to the sound.')}</p>}
    </section>
  );
}
