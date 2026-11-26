import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { audio } from '../../audio/engine';
import { useProfile } from '../../app/ProfileContext';
import { useL } from '../../app/useL';
import { Teacher, Yumika } from '../../components/art/Characters';
import { QuestionCard } from '../../components/learn/QuestionCard';
import { freshItems, unlockedItems } from '../../learn/daily';
import { pickDaily, type DailyItem } from '../../learn/mastery';
import { singleQuestion, sortItems } from '../../learn/generators';
import { getPath } from '../../learn/paths';
import { localDate, recordAnswers, useAllLearnData } from '../../learn/store';
import type { ItemMastery, LearnQuestion, LessonProgress, PathId } from '../../learn/types';
import { createRng, type Rng } from '../../theory';
import { useToolData } from '../../tools/useToolData';

export const DAILY_DONE_KEY = 'daily-session-done';

interface DailyQuestion {
  item: DailyItem;
  q: LearnQuestion;
  options: string[];
  /** First time a new item comes up: the answer is shown. */
  helped: boolean;
}

/** Builds today's questions from mastery data. */
export function buildDaily(progress: LessonProgress[], mastery: ItemMastery[], rng: Rng, now = Date.now()): DailyQuestion[] {
  const fresh = freshItems(progress);
  const picked = pickDaily(mastery, fresh, now);
  const seenNew = new Set<string>();
  return picked.map((item) => {
    const path = getPath(item.pathId)!;
    const known = unlockedItems(path, progress);
    const pathFresh = fresh.filter((f) => f.pathId === item.pathId).map((f) => f.itemId);
    let options = [...new Set([...known, ...pathFresh, item.itemId])];
    if (options.length > 8) options = [item.itemId, ...rng.sample(options.filter((o) => o !== item.itemId), 7)];
    const key = `${item.pathId}:${item.itemId}`;
    const helped = item.kind === 'new' && !seenNew.has(key);
    seenNew.add(key);
    return { item, q: { ...singleQuestion(item.pathId, item.itemId, 'random', rng), stage: helped ? 'guided' : 'main' }, options: sortItems(item.pathId, options), helped };
  });
}

/** Summary for the hub card. */
export function dailySummary(progress: LessonProgress[], mastery: ItemMastery[], now = Date.now()) {
  const picked = pickDaily(mastery, freshItems(progress), now);
  return {
    reviews: picked.filter((p) => p.kind === 'review').length,
    fresh: new Set(picked.filter((p) => p.kind === 'new').map((p) => `${p.pathId}:${p.itemId}`)).size,
  };
}

export function DailySession() {
  const l = useL();
  const profile = useProfile();
  const data = useAllLearnData(profile.id);
  const [doneDates, setDoneDates] = useToolData<string[]>(DAILY_DONE_KEY, []);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [list, setList] = useState<DailyQuestion[]>([]);
  const answers = useRef<{ pathId: PathId; itemId: string; correct: boolean }[]>([]);
  const startedAt = useRef(0);
  const [saved, setSaved] = useState(false);
  const rng = useMemo(() => createRng(Date.now()), []);
  const finished = started && index >= list.length;

  const start = () => {
    if (!data) return;
    setList(buildDaily(data.progress, data.mastery, rng));
    answers.current = [];
    startedAt.current = Date.now();
    setIndex(0);
    setStarted(true);
  };

  useEffect(() => {
    if (!finished || saved) return;
    setSaved(true);
    void (async () => {
      const ms = Date.now() - startedAt.current;
      const byPath = new Map<PathId, { itemId: string; correct: boolean }[]>();
      for (const a of answers.current) byPath.set(a.pathId, [...(byPath.get(a.pathId) ?? []), a]);
      const share = ms / Math.max(1, byPath.size);
      for (const [pathId, rows] of byPath) await recordAnswers(profile.id!, getPath(pathId)!, rows, share);
      const today = localDate();
      if (!doneDates.includes(today)) await setDoneDates([...doneDates.slice(-60), today]);
    })();
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => audio.stop(), []);
  useEffect(() => {
    if (!started) window.__earlabLearn = { phase: 'daily-start', index: 0 };
    else if (finished) window.__earlabLearn = { phase: 'results', index: 0 };
  }, [started, finished]);

  const summary = data ? dailySummary(data.progress, data.mastery) : null;
  const cur = list[index];
  const right = answers.current.filter((a) => a.correct).length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5" data-phase={!started ? 'daily-start' : finished ? 'results' : 'daily'}>
      <Link to="/learn" className="text-sm font-semibold text-link">← {l('Lộ trình học', 'Learning paths')}</Link>
      <h1 className="h-display text-2xl font-bold">{l('Buổi luyện hôm nay', "Today's session")}</h1>

      {!started && (
        <section className="card flex flex-wrap items-center gap-4">
          <Teacher mood="wave" size={80} />
          <div className="min-w-0 flex-1">
            <p>{l('Khoảng 3 phút, 25 câu: ôn những mục sắp quên trước, rồi làm quen mục mới của bài kế tiếp.', 'About 3 minutes, 25 questions: first the items you are about to forget, then the new items of your next lesson.')}</p>
            {summary && <p className="mt-1 text-sm text-muted">{l(`${summary.reviews} câu ôn · +${summary.fresh} mục mới`, `${summary.reviews} reviews · +${summary.fresh} new`)}</p>}
          </div>
          <button type="button" className="btn btn-primary" disabled={!data} onClick={start}>{l('Bắt đầu', 'Start')}</button>
        </section>
      )}

      {started && cur && (
        <>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full bg-accent transition-[width]" style={{ width: `${(index / list.length) * 100}%` }} />
          </div>
          <QuestionCard
            key={index}
            pathId={cur.item.pathId}
            q={cur.q}
            options={cur.options}
            helped={cur.helped}
            label={`${l(getPath(cur.item.pathId)!.title)} · ${cur.item.kind === 'review' ? l('ôn tập', 'review') : l('mục mới', 'new')}`}
            counter={`${index + 1} / ${list.length}`}
            color={getPath(cur.item.pathId)!.color}
            hook={{ phase: cur.helped ? 'guided' : 'main', index }}
            onResult={(correct) => answers.current.push({ pathId: cur.item.pathId, itemId: cur.item.itemId, correct })}
            onNext={() => setIndex((i) => i + 1)}
          />
        </>
      )}

      {finished && (
        <section className="card flex flex-col items-center gap-3 text-center" data-testid="daily-results">
          <Yumika mood="cheer" size={100} outfit={profile.settings.mascotOutfit ?? 'casual'} />
          <p className="h-display text-3xl font-bold">{l('Xong buổi hôm nay!', 'Done for today!')}</p>
          <p className="text-muted">{l(`${right}/${answers.current.length} câu chấm điểm đúng`, `${right}/${answers.current.length} graded answers right`)}</p>
          <Link to="/learn" className="btn btn-primary">{l('Về trang Học', 'Back to Learn')}</Link>
        </section>
      )}
    </div>
  );
}
