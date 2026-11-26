import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { audio } from '../../audio/engine';
import { useProfile } from '../../app/ProfileContext';
import { useL } from '../../app/useL';
import { Yumika } from '../../components/art/Characters';
import { QuestionCard } from '../../components/learn/QuestionCard';
import { unlockedItems } from '../../learn/daily';
import { itemLabel, itemName, itemSymbol, singleQuestion, sortItems } from '../../learn/generators';
import { getPath } from '../../learn/paths';
import { recordAnswers, useAllLearnData } from '../../learn/store';
import type { LearnQuestion, PathDef } from '../../learn/types';
import { createRng, displayNoteName } from '../../theory';
import { useToolData } from '../../tools/useToolData';

export const PRACTICE_SECONDS = 60;

export function PracticeRoute() {
  const { pathId = '' } = useParams();
  const l = useL();
  const [run, setRun] = useState(0);
  const path = getPath(pathId);
  if (!path) return <p className="text-muted">{l('Không tìm thấy lộ trình.', 'Path not found.')}</p>;
  return <PracticeQuiz key={run} path={path} onAgain={() => setRun((r) => r + 1)} />;
}

type Phase = 'start' | 'play' | 'results';

/** 60-second quiz over every item the player has reached in a path. */
function PracticeQuiz({ path, onAgain }: { path: PathDef; onAgain: () => void }) {
  const l = useL();
  const profile = useProfile();
  const s = profile.settings;
  const data = useAllLearnData(profile.id);
  const [best, setBest] = useToolData<number>(`practice-best-${path.id}`, 0);
  const [phase, setPhase] = useState<Phase>('start');
  const [index, setIndex] = useState(0);
  const [q, setQ] = useState<LearnQuestion | null>(null);
  const [left, setLeft] = useState(PRACTICE_SECONDS);
  const answers = useRef<{ itemId: string; correct: boolean }[]>([]);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const [newBest, setNewBest] = useState(false);
  const rng = useMemo(() => createRng(Date.now()), []);
  const startedAt = useRef(0);
  const key = s.learnPracticeKey ?? 'random';

  const pool = useMemo(() => (data ? sortItems(path.id, unlockedItems(path, data.progress)) : []), [data, path]);

  const nextQuestion = useCallback(() => {
    setQ(singleQuestion(path.id, rng.pick(pool), key, rng));
    setIndex((i) => i + 1);
  }, [path.id, pool, key, rng]);

  const start = () => {
    answers.current = [];
    startedAt.current = Date.now();
    setPhase('play');
    nextQuestion();
  };

  // Countdown.
  useEffect(() => {
    if (phase !== 'play') return;
    const t = window.setInterval(() => {
      const remaining = PRACTICE_SECONDS - Math.floor((Date.now() - startedAt.current) / 1000);
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        window.clearInterval(t);
        audio.stop();
        setPhase('results');
      }
    }, 250);
    return () => window.clearInterval(t);
  }, [phase]);

  // Save on results.
  useEffect(() => {
    if (phase !== 'results') return;
    const right = answers.current.filter((a) => a.correct).length;
    setScore({ right, total: answers.current.length });
    void recordAnswers(profile.id!, path, answers.current, PRACTICE_SECONDS * 1000);
    if (right > best) {
      setNewBest(true);
      void setBest(right);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => audio.stop(), []);
  useEffect(() => {
    if (phase !== 'play') window.__earlabLearn = { phase: phase === 'start' ? 'practice-start' : 'results', index: 0 };
  }, [phase]);

  const name = (id: string) => (path.id === 'pitch' ? displayNoteName(itemLabel(id), s.noteNaming) : `${itemSymbol(path.id, id)}${itemName(path.id, id) ? ` · ${l(itemName(path.id, id)!)}` : ''}`);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5" data-phase={phase === 'play' ? 'practice' : phase}>
      <Link to="/learn" className="text-sm font-semibold text-link">← {l('Lộ trình học', 'Learning paths')}</Link>
      <h1 className="h-display text-2xl font-bold">{l(`Luyện ${l(path.title)} — 60 giây`, `${l(path.title)} practice — 60 seconds`)}</h1>

      {phase === 'start' && (
        <section className="card flex flex-col gap-3">
          <p>{l('Trả lời càng nhiều câu đúng càng tốt trong 60 giây. Chỉ hỏi những mục bạn đã học tới:', 'Answer as many as you can in 60 seconds. Only items you have reached are asked:')}</p>
          <div className="flex flex-wrap gap-1.5">
            {pool.map((id) => <span key={id} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold">{name(id)}</span>)}
          </div>
          <p className="text-sm text-muted">
            {path.id === 'pitch' ? '' : key === 'c' ? l('Giọng: luôn từ Đô (đổi trong Hồ sơ).', 'Key: always from C (change it in Profiles).') : l('Giọng: ngẫu nhiên (đổi trong Hồ sơ).', 'Key: random (change it in Profiles).')}
            {' '}{l(`Kỷ lục: ${best} câu đúng.`, `Best: ${best} right.`)}
          </p>
          <button type="button" className="btn btn-primary self-start" disabled={pool.length === 0} onClick={start}>{l('Bắt đầu', 'Start')}</button>
        </section>
      )}

      {phase === 'play' && q && (
        <>
          <div className="flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full transition-[width] duration-200" style={{ width: `${(left / PRACTICE_SECONDS) * 100}%`, background: path.color }} />
            </div>
            <span className="w-14 text-right font-bold tabular-nums" data-testid="practice-left">{left}s</span>
          </div>
          <QuestionCard
            key={index}
            pathId={path.id}
            q={q}
            options={pool}
            label={l('Luyện tự do', 'Free practice')}
            counter={l(`${answers.current.filter((a) => a.correct).length} đúng`, `${answers.current.filter((a) => a.correct).length} right`)}
            color={path.color}
            hook={{ phase: 'main', index }}
            onResult={(correct) => answers.current.push({ itemId: q.itemId, correct })}
            onNext={nextQuestion}
          />
        </>
      )}

      {phase === 'results' && (
        <section className="card flex flex-col items-center gap-3 text-center" data-testid="practice-results">
          <Yumika mood={score.right > 0 ? 'cheer' : 'oops'} size={100} outfit={s.mascotOutfit ?? 'casual'} />
          <div className="h-display text-5xl font-bold" style={{ color: path.color }}>{score.right}</div>
          <p className="font-semibold">{l(`câu đúng trong 60 giây (${score.total} câu đã trả lời)`, `right in 60 seconds (${score.total} answered)`)}</p>
          {newBest && <p className="rounded-xl bg-accent/15 px-4 py-2 font-bold">🏆 {l('Kỷ lục mới!', 'New best!')}</p>}
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary" onClick={onAgain}>↻ {l('Chơi lại', 'Again')}</button>
            <Link to={`/learn/${path.id}`} className="btn">{l('Về lộ trình', 'Back to the path')}</Link>
          </div>
        </section>
      )}
    </div>
  );
}
