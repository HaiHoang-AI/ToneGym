import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { audio } from '../../audio/engine';
import { useProfile } from '../../app/ProfileContext';
import { useL } from '../../app/useL';
import { Teacher, Yumika } from '../../components/art/Characters';
import { AnchorCard, playAnchor } from '../../components/learn/AnchorCard';
import { StarRow } from '../../components/learn/StarRow';
import { PianoKeyboard, type KeyMark } from '../../components/PianoKeyboard';
import { melodic } from '../../games/sound';
import { getAnchor } from '../../learn/anchors';
import { compareSound, generateLesson, intervalSymbol, itemLabel, itemPc, lessonItems, PITCH_ITEMS, questionSound, sortItems } from '../../learn/generators';
import { getPath } from '../../learn/paths';
import { computeStars, isPassed, pathStatuses } from '../../learn/stars';
import { saveLessonRun, togglePin, usePathProgress, type LessonOutcome } from '../../learn/store';
import type { LearnQuestion, LessonDef, PathDef, QuestionStage, Slide } from '../../learn/types';
import { createRng, displayNoteName, getInterval, midiToName, type IntervalId } from '../../theory';

declare global {
  interface Window {
    __earlabLearn?: { phase: string; answerId?: string; key?: string; index: number };
  }
}

export function LessonRoute() {
  const { pathId = '', lessonId = '' } = useParams();
  const l = useL();
  const [run, setRun] = useState(0);
  const path = getPath(pathId);
  const lesson = path?.lessons.find((x) => x.id === lessonId);
  if (!path || !lesson) return <p className="text-muted">{l('Không tìm thấy bài học.', 'Lesson not found.')}</p>;
  return <LessonRunner key={`${lessonId}-${run}`} path={path} lesson={lesson} onRetry={() => setRun((r) => r + 1)} />;
}

type Phase = 'slides' | 'anchor' | 'start' | QuestionStage | 'results';

function phasesFor(lesson: LessonDef, hasTraps: boolean): Phase[] {
  if (lesson.kind === 'intro') return ['slides', 'try', 'results'];
  if (lesson.kind === 'lesson') return ['slides', ...(lesson.anchors.length ? (['anchor'] as Phase[]) : []), 'guided', 'main', ...(hasTraps ? (['trap'] as Phase[]) : []), 'results'];
  return ['start', 'main', 'results'];
}

interface Answer {
  stage: QuestionStage;
  itemId: string;
  correct: boolean;
}

const CORRECT_DELAY = 450;

function LessonRunner({ path, lesson, onRetry }: { path: PathDef; lesson: LessonDef; onRetry: () => void }) {
  const l = useL();
  const profile = useProfile();
  const s = profile.settings;
  const progress = usePathProgress(profile.id, path.id);
  const questions = useMemo(() => generateLesson(lesson, createRng(Date.now()), path.id), [lesson, path.id]);
  const phases = useMemo(() => phasesFor(lesson, questions.traps.length > 0), [lesson, questions]);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const phase = phases[phaseIndex]!;
  const [slide, setSlide] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ chosen: string | null; ok: boolean } | null>(null);
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [anchorUses, setAnchorUses] = useState(0);
  const [outcome, setOutcome] = useState<LessonOutcome | null>(null);
  const saving = useRef(false);

  const list: LearnQuestion[] = phase === 'try' ? questions.tries : phase === 'guided' ? questions.guided : phase === 'main' ? questions.main : phase === 'trap' ? questions.traps : [];
  const q = list[qIndex];
  const isYesNo = lesson.mode === 'yesno';
  const isPitch = path.id === 'pitch';
  const items = useMemo(() => sortItems(path.id, lessonItems(lesson)), [lesson, path.id]);
  const enabledKeys = useMemo(() => (isPitch ? items.map((id) => 60 + itemPc(id)) : []), [items, isPitch]);
  const helped = phase === 'try' || phase === 'guided';
  const graded = phase === 'main' || phase === 'trap';
  const name = useCallback(
    (id: string) => (isPitch ? displayNoteName(itemLabel(id), s.noteNaming) : `${intervalSymbol(id)} · ${l(getInterval(id as IntervalId).name)}`),
    [s.noteNaming, isPitch, l],
  );

  const next = () => {
    audio.stop();
    setPhaseIndex((i) => Math.min(phases.length - 1, i + 1));
    setQIndex(0);
    setFeedback(null);
  };

  const playQuestion = useCallback(async (x: LearnQuestion | undefined) => {
    if (!x) return;
    await audio.start();
    audio.stop();
    await audio.playSequence(questionSound(x).steps);
  }, []);

  // Play every new question once.
  useEffect(() => {
    if (q) void playQuestion(q);
  }, [q, playQuestion]);

  useEffect(() => () => audio.stop(), []);

  const advance = useCallback(() => {
    setFeedback(null);
    setWrongFlash(null);
    if (qIndex + 1 < list.length) setQIndex(qIndex + 1);
    else {
      setPhaseIndex((i) => Math.min(phases.length - 1, i + 1));
      setQIndex(0);
    }
  }, [qIndex, list.length, phases.length]);

  const compare = useCallback(
    async (x: LearnQuestion, chosen: string | null) => {
      if (s.learnCompare === false) return;
      const sound = compareSound(path.id, x, chosen, lesson.yesItem);
      if (!sound) return;
      await audio.start();
      audio.stop();
      await audio.playSequence(sound.steps);
    },
    [s.learnCompare, path.id, lesson.yesItem],
  );

  const answer = useCallback(
    (id: string) => {
      if (!q || feedback) return;
      const ok = id === q.answerId;
      if (helped) {
        if (!ok) {
          setWrongFlash(id);
          window.setTimeout(() => setWrongFlash(null), 400);
          return;
        }
        setFeedback({ chosen: id, ok: true });
        window.setTimeout(advance, CORRECT_DELAY);
        return;
      }
      setAnswers((a) => [...a, { stage: phase as QuestionStage, itemId: q.itemId, correct: ok }]);
      setFeedback({ chosen: id, ok });
      if (ok) window.setTimeout(advance, CORRECT_DELAY);
      else void compare(q, id);
    },
    [q, feedback, helped, phase, advance, compare],
  );

  // Time limit of checkpoints and the final exam.
  useEffect(() => {
    if (!q || feedback || !graded || !lesson.timeLimitMs) return;
    const t = window.setTimeout(() => {
      setAnswers((a) => [...a, { stage: phase as QuestionStage, itemId: q.itemId, correct: false }]);
      setFeedback({ chosen: null, ok: false });
    }, lesson.timeLimitMs);
    return () => window.clearTimeout(t);
  }, [q, feedback, graded, lesson.timeLimitMs, phase]);

  // Save once on reaching the results.
  useEffect(() => {
    if (phase !== 'results' || saving.current) return;
    saving.current = true;
    const main = answers.filter((a) => a.stage === 'main');
    const result = lesson.kind === 'intro' ? { stars: 3, pct: 100 } : computeStars(main.filter((a) => a.correct).length, main.length, anchorUses);
    void saveLessonRun(profile.id!, path, lesson.id, result, answers).then(setOutcome);
  }, [phase, answers, anchorUses, lesson, path, profile.id]);

  // Test hook.
  useEffect(() => {
    window.__earlabLearn = {
      phase,
      index: qIndex,
      answerId: q?.answerId,
      key: q && !isYesNo && isPitch && s.learnPitchInput !== 'buttons' ? midiToName(60 + itemPc(q.answerId), s.accidentals) : undefined,
    };
  }, [phase, qIndex, q, isYesNo, isPitch, s.accidentals, s.learnPitchInput]);

  const questionText = () => {
    if (!q) return '';
    if (isYesNo) return l(`Có phải ${name(lesson.yesItem!)} không?`, `Is it ${name(lesson.yesItem!)}?`);
    if (isPitch) return q.notes.length > 1 ? l('Nốt cuối cùng là nốt gì?', 'What is the last note?') : l('Nốt vừa nghe là nốt gì?', 'Which note was that?');
    const how = q.harmonic ? l('vang cùng lúc', 'together') : q.notes[1]! < q.notes[0]! ? l('đi xuống', 'going down') : l('đi lên', 'going up');
    return l(`Quãng gì? (${how})`, `Which interval? (${how})`);
  };

  // Number keys answer with the buttons.
  useEffect(() => {
    if (isPitch && !isYesNo && s.learnPitchInput !== 'buttons') return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      const choices = isYesNo ? ['yes', 'no'] : items;
      if (n >= 1 && n <= choices.length) answer(choices[n - 1]!);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPitch, isYesNo, s.learnPitchInput, items, answer]);

  const index = path.lessons.indexOf(lesson);
  const nextLesson = path.lessons[index + 1];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5" data-phase={phase}>
      <div className="flex items-center justify-between gap-3">
        <Link to={`/learn/${path.id}`} className="text-sm font-semibold text-link">← {l(path.title)}</Link>
        <PhaseDots phases={phases} current={phaseIndex} color={path.color} />
      </div>
      <h1 className="h-display text-2xl font-bold">{l(lesson.title)}</h1>

      {phase === 'slides' && (
        <SlideView
          slide={lesson.slides[slide]!}
          index={slide}
          total={lesson.slides.length}
          color={path.color}
          onBack={() => setSlide((i) => Math.max(0, i - 1))}
          onNext={() => (slide + 1 < lesson.slides.length ? setSlide(slide + 1) : next())}
        />
      )}

      {phase === 'anchor' && (
        <section className="flex flex-col gap-4">
          {lesson.anchors.map((id) => <AnchorCard key={id} anchor={getAnchor(id)} color={path.color} />)}
          <button type="button" className="btn btn-primary self-end" onClick={next}>{l('Tiếp: nghe mẫu', 'Next: guided listening')} →</button>
        </section>
      )}

      {phase === 'start' && (
        <section className="card flex flex-col items-start gap-3">
          <Teacher mood="wave" size={80} />
          <p className="text-lg">{l(lesson.desc)}</p>
          <p className="text-sm text-muted">{l('Không có gợi ý và không nghe mốc. Đạt 2★ trở lên: mọi bài chưa học phía trước được tính là đã bỏ qua.', 'No hints and no anchors. With 2★ or more, every unfinished lesson before it counts as skipped.')}</p>
          <button type="button" className="btn btn-primary" onClick={next}>{l('Bắt đầu thi', 'Start the test')}</button>
        </section>
      )}

      {q && (
        <section className="card flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide" style={{ color: path.color }}>{stageLabel(phase, l)}</div>
              <div className="text-lg font-semibold">
                {questionText()}
              </div>
            </div>
            <div className="text-sm font-semibold text-muted">{qIndex + 1} / {list.length}</div>
          </div>
          {lesson.timeLimitMs && graded && !feedback && (
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div key={`${phase}-${qIndex}`} className="h-full origin-left" style={{ background: path.color, animation: `learn-timer ${lesson.timeLimitMs}ms linear forwards` }} />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-sm" onClick={() => void playQuestion(q)}>↻ {l('Nghe lại', 'Replay')}</button>
            {phase === 'main' && lesson.kind === 'lesson' && lesson.anchors[0] && (
              <button
                type="button"
                className="btn btn-sm"
                disabled={anchorUses >= 3}
                onClick={() => {
                  setAnchorUses((n) => n + 1);
                  void playAnchor(getAnchor(lesson.anchors[0]!));
                }}
              >
                ♪ {l(`Nghe mốc (còn ${3 - anchorUses}, trừ 1 câu đúng)`, `Anchor (${3 - anchorUses} left, costs 1 point)`)}
              </button>
            )}
          </div>

          {isYesNo ? (
            <div className="grid grid-cols-2 gap-3">
              {(['yes', 'no'] as const).map((id) => {
                const showHint = helped && id === q.answerId;
                const state = feedback ? (id === q.answerId ? 'border-good bg-good/15' : feedback.chosen === id ? 'border-bad bg-bad/15' : 'border-line') : wrongFlash === id ? 'border-bad bg-bad/15' : showHint ? 'border-accent bg-accent/15' : 'border-line';
                return (
                  <button key={id} type="button" data-answer={id} className={`min-h-16 rounded-2xl border-2 bg-surface-2 text-lg font-bold ${state}`} onClick={() => answer(id)}>
                    {id === 'yes' ? l(`Có — là ${name(lesson.yesItem!)}`, `Yes — it is ${name(lesson.yesItem!)}`) : l('Không', 'No')}
                  </button>
                );
              })}
            </div>
          ) : !isPitch || s.learnPitchInput === 'buttons' ? (
            <div className="flex flex-wrap gap-2">
              {items.map((id, i) => {
                const state = feedback ? (id === q.answerId ? 'border-good bg-good/15' : feedback.chosen === id ? 'border-bad bg-bad/15' : 'border-line') : wrongFlash === id ? 'border-bad bg-bad/15' : helped && id === q.answerId ? 'border-accent bg-accent/15' : 'border-line';
                return (
                  <button key={id} type="button" data-answer={id} className={`min-h-12 min-w-14 rounded-xl border-2 bg-surface-2 px-3 py-1 font-bold ${state}`} onClick={() => answer(id)}>
                    {isPitch ? name(id) : (
                      <span className="flex flex-col items-center leading-tight">
                        <span className="text-lg">{intervalSymbol(id)}</span>
                        <span className="text-[11px] font-medium text-muted">{i + 1 <= 9 ? `${i + 1} · ` : ''}{l(getInterval(id as IntervalId).name)}</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <PianoKeyboard
              from={60}
              to={71}
              sound={false}
              enabled={enabledKeys}
              labels={s.learnKeyNames ? 'all' : 'c'}
              naming={s.noteNaming}
              accidentals={s.accidentals}
              marks={keyMarks(q, feedback, wrongFlash, helped)}
              onNote={(m) => {
                const id = PITCH_ITEMS[((m % 12) + 12) % 12]!;
                if (items.includes(id)) answer(id);
              }}
            />
          )}

          {feedback && !feedback.ok && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-bad/10 px-4 py-3">
              <span className="font-semibold text-bad-ink">
                {feedback.chosen === null ? l('Hết giờ! ', 'Time is up! ') : ''}
                {isYesNo
                  ? l(`Đó là ${name(q.itemId)}.`, `That was ${name(q.itemId)}.`)
                  : l(`Đáp án: ${name(q.answerId)}${feedback.chosen ? ` — bạn chọn ${name(feedback.chosen)}` : ''}`, `Answer: ${name(q.answerId)}${feedback.chosen ? ` — you picked ${name(feedback.chosen)}` : ''}`)}
              </span>
              <button type="button" className="btn btn-primary btn-sm" onClick={advance}>{l('Tiếp', 'Next')} →</button>
            </div>
          )}
          {feedback && !isPitch && (
            <PianoKeyboard from={48} to={84} sound={false} labels="c" naming={s.noteNaming} accidentals={s.accidentals} marks={Object.fromEntries([...q.notes, ...(q.tail ?? [])].map((n) => [n, 'correct' as KeyMark]))} />
          )}
          {feedback?.ok && graded && <div className="font-semibold text-good-ink">✓ {l('Đúng!', 'Right!')}</div>}
          {helped && <p className="text-sm text-muted">{l('Đáp án đang sáng — nghe rồi bấm theo để làm quen.', 'The answer is lit — listen and press it to get used to the sound.')}</p>}
        </section>
      )}

      {phase === 'results' && (
        <Results
          path={path}
          lesson={lesson}
          answers={answers}
          outcome={outcome}
          pinned={!!progress?.get(lesson.id)?.pinned}
          nextOpen={!!nextLesson && !!progress && !!outcome && nextOpenAfter(path, index, progress)}
          nextId={nextLesson?.id}
          name={name}
          onRetry={onRetry}
          onPin={() => void togglePin(profile.id!, path.id, lesson.id)}
        />
      )}
    </div>
  );
}

function nextOpenAfter(path: PathDef, index: number, progress: Parameters<typeof pathStatuses>[1]): boolean {
  const statuses = pathStatuses(path.lessons, progress);
  return statuses[index + 1] !== 'locked' && isPassed(progress.get(path.lessons[index]!.id));
}

function keyMarks(q: LearnQuestion, feedback: { chosen: string | null; ok: boolean } | null, wrongFlash: string | null, helped: boolean): Record<number, KeyMark> {
  const key = (id: string) => 60 + itemPc(id);
  const marks: Record<number, KeyMark> = {};
  if (helped && !feedback) marks[key(q.answerId)] = 'hint';
  if (wrongFlash) marks[key(wrongFlash)] = 'wrong';
  if (feedback) {
    if (feedback.chosen && !feedback.ok) marks[key(feedback.chosen)] = 'wrong';
    marks[key(q.answerId)] = 'correct';
  }
  return marks;
}

function stageLabel(phase: Phase, l: ReturnType<typeof useL>): string {
  switch (phase) {
    case 'try': return l('Làm thử (không chấm)', 'Try it (not graded)');
    case 'guided': return l('Nghe mẫu có dẫn', 'Guided listening');
    case 'main': return l('Luyện chính — tính sao', 'Main drill — graded');
    case 'trap': return l('Câu bẫy', 'Trap questions');
    default: return '';
  }
}

function PhaseDots({ phases, current, color }: { phases: Phase[]; current: number; color: string }) {
  return (
    <div className="flex gap-1.5" aria-hidden="true">
      {phases.map((p, i) => (
        <span key={p} className="h-2 w-6 rounded-full" style={{ background: i <= current ? color : 'var(--color-line)' }} />
      ))}
    </div>
  );
}

function SlideView({ slide, index, total, color, onBack, onNext }: { slide: Slide; index: number; total: number; color: string; onBack: () => void; onNext: () => void }) {
  const l = useL();
  const { settings } = useProfile();
  const keys = slide.keys ?? [];
  const from = keys.length ? Math.floor(Math.min(...keys) / 12) * 12 : 60;
  const to = keys.length ? Math.max(from + 11, Math.ceil((Math.max(...keys) + 1) / 12) * 12 - 1) : 71;
  const marks: Record<number, KeyMark> = Object.fromEntries(keys.map((k) => [k, 'hint' as KeyMark]));
  const play = async (notes: number[], together?: boolean) => {
    await audio.start();
    audio.stop();
    if (together) audio.playNotes(notes, 1.6);
    else await audio.playSequence(melodic(notes, 0.55).steps);
  };
  return (
    <section className="card flex flex-col gap-4" data-slide={index}>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full" style={{ width: `${((index + 1) / total) * 100}%`, background: color }} /></div>
      <div className="flex items-start gap-3">
        <Teacher mood="wave" size={64} />
        <div>
          <h2 className="h-display text-xl font-bold">{l(slide.title)}</h2>
          <p className="mt-1 leading-relaxed text-ink-2">{l(slide.body)}</p>
        </div>
      </div>
      {keys.length > 0 && <PianoKeyboard from={from} to={to} marks={marks} labels="all" naming={settings.noteNaming} accidentals={settings.accidentals} />}
      {slide.examples && slide.examples.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {slide.examples.map((e, i) => <button key={i} type="button" className="btn btn-sm" onClick={() => void play(e.notes, e.together)}>▶ {l(e.label)}</button>)}
        </div>
      )}
      <div className="flex justify-between gap-2">
        <button type="button" className="btn" onClick={onBack} disabled={index === 0}>← {l('Trước', 'Back')}</button>
        <button type="button" className="btn btn-primary" onClick={onNext}>{l('Tiếp', 'Next')} →</button>
      </div>
    </section>
  );
}

function Results(props: {
  path: PathDef;
  lesson: LessonDef;
  answers: Answer[];
  outcome: LessonOutcome | null;
  pinned: boolean;
  nextOpen: boolean;
  nextId?: string;
  name: (id: string) => string;
  onRetry: () => void;
  onPin: () => void;
}) {
  const { path, lesson, answers, outcome, pinned, nextOpen, nextId, name, onRetry, onPin } = props;
  const l = useL();
  const { settings } = useProfile();
  if (!outcome) return <section className="card text-muted">{l('Đang lưu…', 'Saving…')}</section>;
  const main = answers.filter((a) => a.stage === 'main');
  const traps = answers.filter((a) => a.stage === 'trap');
  const misses = new Map<string, number>();
  for (const a of answers) if (!a.correct) misses.set(a.itemId, (misses.get(a.itemId) ?? 0) + 1);
  const worst = [...misses.entries()].sort((a, b) => b[1] - a[1])[0];
  const passed = outcome.stars >= 2;
  return (
    <section className="card flex flex-col items-center gap-4 text-center" data-testid="lesson-results">
      <Yumika mood={passed ? 'cheer' : 'oops'} size={110} outfit={settings.mascotOutfit ?? 'casual'} />
      <StarRow stars={outcome.stars} size={40} />
      <div className="h-display text-4xl font-bold" style={{ color: path.color }}>{outcome.pct}%</div>
      <p className="text-lg font-semibold">
        {lesson.kind === 'intro'
          ? l('Xong phần làm quen!', 'Intro complete!')
          : outcome.stars === 3
            ? l('Xuất sắc!', 'Excellent!')
            : passed
              ? l('Qua bài! Bài sau đã mở.', 'Passed! The next lesson is open.')
              : l('Chưa đạt 75 % — thử lại nhé.', 'Below 75 % — try again.')}
      </p>
      {lesson.kind !== 'intro' && (
        <div className="text-sm text-muted">
          {l(`Luyện chính: ${main.filter((a) => a.correct).length}/${main.length} đúng`, `Main drill: ${main.filter((a) => a.correct).length}/${main.length} right`)}
          {traps.length > 0 && l(` · Câu bẫy: ${traps.filter((a) => a.correct).length}/${traps.length}`, ` · Traps: ${traps.filter((a) => a.correct).length}/${traps.length}`)}
        </div>
      )}
      {worst && <div className="text-sm">{l(`Hay nhầm nhất: ${name(worst[0])} (${worst[1]} lần)`, `Most missed: ${name(worst[0])} (${worst[1]}×)`)}</div>}
      {outcome.skipped.length > 0 && <div className="rounded-xl bg-good/10 px-4 py-2 text-sm font-semibold text-good-ink">{l(`Đã bỏ qua ${outcome.skipped.length} bài phía trước.`, `${outcome.skipped.length} earlier lessons skipped.`)}</div>}
      <div className="flex flex-wrap justify-center gap-2">
        {lesson.kind === 'lesson' && <button type="button" className={`btn ${pinned ? 'btn-primary' : ''}`} onClick={onPin} aria-pressed={pinned}>📌 {pinned ? l('Đã ghim', 'Pinned') : l('Ghim để ôn', 'Pin for review')}</button>}
        <button type="button" className="btn" onClick={onRetry}>↻ {l('Làm lại', 'Try again')}</button>
        <Link to={`/learn/${path.id}`} className="btn">{l('Về lộ trình', 'Back to the path')}</Link>
        {nextOpen && nextId && <Link to={`/learn/${path.id}/${nextId}`} className="btn btn-primary">{l('Bài tiếp', 'Next lesson')} →</Link>}
      </div>
    </section>
  );
}
