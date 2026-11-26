import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { audio } from '../../audio/engine';
import { useProfile } from '../../app/ProfileContext';
import { useL } from '../../app/useL';
import { Teacher, Yumika } from '../../components/art/Characters';
import { AnchorCard, playAnchor } from '../../components/learn/AnchorCard';
import { QuestionCard } from '../../components/learn/QuestionCard';
import { StarRow } from '../../components/learn/StarRow';
import { PianoKeyboard, type KeyMark } from '../../components/PianoKeyboard';
import { chordSequence, melodic } from '../../games/sound';
import { getAnchor } from '../../learn/anchors';
import { generateLesson, itemLabel, itemName, itemSymbol, lessonItems, sortItems } from '../../learn/generators';
import { getPath } from '../../learn/paths';
import { computeStars, isPassed, pathStatuses } from '../../learn/stars';
import { saveLessonRun, togglePin, usePathProgress, type LessonOutcome } from '../../learn/store';
import type { LearnQuestion, LessonDef, PathDef, QuestionStage, Slide } from '../../learn/types';
import { createRng, displayNoteName } from '../../theory';

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


function LessonRunner({ path, lesson, onRetry }: { path: PathDef; lesson: LessonDef; onRetry: () => void }) {
  const l = useL();
  const profile = useProfile();
  const progress = usePathProgress(profile.id, path.id);
  const questions = useMemo(() => generateLesson(lesson, createRng(Date.now()), path.id), [lesson, path.id]);
  const phases = useMemo(() => phasesFor(lesson, questions.traps.length > 0), [lesson, questions]);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const phase = phases[phaseIndex]!;
  const [slide, setSlide] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [anchorUses, setAnchorUses] = useState(0);
  const [outcome, setOutcome] = useState<LessonOutcome | null>(null);
  const saving = useRef(false);
  const startedAt = useRef(Date.now());

  const list: LearnQuestion[] = phase === 'try' ? questions.tries : phase === 'guided' ? questions.guided : phase === 'main' ? questions.main : phase === 'trap' ? questions.traps : [];
  const q = list[qIndex];
  const items = useMemo(() => sortItems(path.id, lessonItems(lesson)), [lesson, path.id]);
  const helped = phase === 'try' || phase === 'guided';
  const name = useCallback(
    (id: string) => (path.id === 'pitch' ? displayNoteName(itemLabel(id), profile.settings.noteNaming) : `${itemSymbol(path.id, id)} · ${l(itemName(path.id, id) ?? id)}`),
    [profile.settings.noteNaming, l, path.id],
  );

  const next = () => {
    audio.stop();
    setPhaseIndex((i) => Math.min(phases.length - 1, i + 1));
    setQIndex(0);
  };

  useEffect(() => () => audio.stop(), []);

  const advance = useCallback(() => {
    if (qIndex + 1 < list.length) setQIndex(qIndex + 1);
    else {
      setPhaseIndex((i) => Math.min(phases.length - 1, i + 1));
      setQIndex(0);
    }
  }, [qIndex, list.length, phases.length]);

  const record = useCallback(
    (correct: boolean) => {
      if (q) setAnswers((a) => [...a, { stage: phase as QuestionStage, itemId: q.itemId, correct }]);
    },
    [q, phase],
  );

  // Save once on reaching the results.
  useEffect(() => {
    if (phase !== 'results' || saving.current) return;
    saving.current = true;
    const main = answers.filter((a) => a.stage === 'main');
    const result = lesson.kind === 'intro' ? { stars: 3, pct: 100 } : computeStars(main.filter((a) => a.correct).length, main.length, anchorUses);
    void saveLessonRun(profile.id!, path, lesson.id, result, answers, Date.now() - startedAt.current).then(setOutcome);
  }, [phase, answers, anchorUses, lesson, path, profile.id]);

  // Test hook between questions.
  useEffect(() => {
    if (!q) window.__earlabLearn = { phase, index: 0 };
  }, [phase, q]);

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
        <QuestionCard
          key={`${phase}-${qIndex}`}
          pathId={path.id}
          q={q}
          options={items}
          yesItem={lesson.mode === 'yesno' ? lesson.yesItem : undefined}
          helped={helped}
          timeLimitMs={phase === 'main' ? lesson.timeLimitMs : undefined}
          label={stageLabel(phase, l)}
          counter={`${qIndex + 1} / ${list.length}`}
          color={path.color}
          hook={{ phase, index: qIndex }}
          onResult={record}
          onNext={advance}
          extra={
            phase === 'main' && lesson.kind === 'lesson' && lesson.anchors[0] ? (
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
            ) : undefined
          }
        />
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
  const play = async (notes: number[], together?: boolean, chords?: number[][]) => {
    await audio.start();
    audio.stop();
    if (chords) await audio.playSequence(chordSequence(chords, 1.05).steps);
    else if (together) audio.playNotes(notes, 1.6);
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
          {slide.examples.map((e, i) => <button key={i} type="button" className="btn btn-sm" onClick={() => void play(e.notes, e.together, e.chords)}>▶ {l(e.label)}</button>)}
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
      {outcome.graduated && <div className="rounded-xl bg-accent/15 px-4 py-2 text-sm font-bold">🎓 {l(`Tốt nghiệp lộ trình ${l(path.title)}! Giải mới trong trang Giải thưởng.`, `${l(path.title)} path graduate! New award on the Awards page.`)}</div>}
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
