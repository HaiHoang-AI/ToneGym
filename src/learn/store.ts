import { useLiveQuery } from 'dexie-react-hooks';
import { db, emptyStats } from '../db/schema';
import { answersByItem, applySession, masteryNow, newMastery } from './mastery';
import { lessonsToSkip } from './stars';
import type { ItemMastery, LessonProgress, MasteryDay, PathDef, PathId } from './types';

export function emptyProgress(profileId: number, pathId: PathId, lessonId: string): LessonProgress {
  return { profileId, pathId, lessonId, stars: 0, bestPct: 0, attempts: 0, skipped: false, pinned: false, updatedAt: 0 };
}

/** Live map lessonId → progress for one path. */
export function usePathProgress(profileId: number | undefined, pathId: PathId): Map<string, LessonProgress> | undefined {
  return useLiveQuery(async () => {
    if (profileId === undefined) return new Map();
    const rows = await db.lessonProgress.where('[profileId+pathId]').equals([profileId, pathId]).toArray();
    return new Map(rows.map((r) => [r.lessonId, r]));
  }, [profileId, pathId]);
}

/** Live map itemId → mastery for one path. */
export function usePathMastery(profileId: number | undefined, pathId: PathId): Map<string, ItemMastery> | undefined {
  return useLiveQuery(async () => {
    if (profileId === undefined) return new Map();
    const rows = await db.itemMastery.where('[profileId+pathId]').equals([profileId, pathId]).toArray();
    return new Map(rows.map((r) => [r.itemId, r]));
  }, [profileId, pathId]);
}

export function useAllLearnData(profileId: number | undefined) {
  return useLiveQuery(async () => {
    if (profileId === undefined) return { progress: [] as LessonProgress[], mastery: [] as ItemMastery[] };
    const [progress, mastery] = await Promise.all([
      db.lessonProgress.where('profileId').equals(profileId).toArray(),
      db.itemMastery.where('profileId').equals(profileId).toArray(),
    ]);
    return { progress, mastery };
  }, [profileId]);
}

export interface LessonOutcome {
  stars: number;
  pct: number;
  /** Lessons newly marked as skipped by this checkpoint. */
  skipped: string[];
  /** The final exam was passed with 3★ for the first time. */
  graduated?: boolean;
}

/** Local calendar date, YYYY-MM-DD. */
export function localDate(now = Date.now()): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type AnswerRow = { itemId: string; correct: boolean };

/** Updates item mastery and today's snapshot of the path. Call inside a transaction over itemMastery + masteryDaily. */
async function applyAnswers(profileId: number, path: PathDef, answers: readonly AnswerRow[], ms: number, now: number) {
  for (const [itemId, list] of answersByItem(answers)) {
    const m = (await db.itemMastery.get([profileId, path.id, itemId])) ?? newMastery(profileId, path.id, itemId);
    await db.itemMastery.put(applySession(m, list, now));
  }
  const rows = await db.itemMastery.where('[profileId+pathId]').equals([profileId, path.id]).toArray();
  const byItem = new Map(rows.map((r) => [r.itemId, r]));
  const items: Record<string, number> = {};
  for (const r of rows) items[r.itemId] = Math.round(masteryNow(r, now) * 1000) / 1000;
  const mastery = path.items.reduce((sum, id) => sum + masteryNow(byItem.get(id), now), 0) / Math.max(1, path.items.length);
  const date = localDate(now);
  const old: MasteryDay = (await db.masteryDaily.get([profileId, date, path.id])) ?? { profileId, date, pathId: path.id, mastery: 0, items: {}, answered: 0, correct: 0, ms: 0 };
  await db.masteryDaily.put({
    ...old,
    mastery,
    items,
    answered: old.answered + answers.length,
    correct: old.correct + answers.filter((a) => a.correct).length,
    ms: old.ms + ms,
  });
}

/** Saves answers given outside lessons (practice quiz, daily session). */
export async function recordAnswers(profileId: number, path: PathDef, answers: readonly AnswerRow[], ms: number): Promise<void> {
  if (answers.length === 0 && ms === 0) return;
  await db.transaction('rw', db.itemMastery, db.masteryDaily, () => applyAnswers(profileId, path, answers, ms, Date.now()));
}

/** Saves a finished run: best stars, skip-ahead for checkpoints, graduation award, and the answers for mastery. */
export async function saveLessonRun(
  profileId: number,
  path: PathDef,
  lessonId: string,
  result: { stars: number; pct: number },
  answers: readonly AnswerRow[],
  ms = 0,
): Promise<LessonOutcome> {
  const now = Date.now();
  let skipped: string[] = [];
  let graduated = false;
  await db.transaction('rw', [db.lessonProgress, db.itemMastery, db.masteryDaily, db.stats], async () => {
    const old = (await db.lessonProgress.get([profileId, lessonId])) ?? emptyProgress(profileId, path.id, lessonId);
    await db.lessonProgress.put({
      ...old,
      stars: Math.max(old.stars, result.stars),
      bestPct: Math.max(old.bestPct, result.pct),
      attempts: old.attempts + 1,
      updatedAt: now,
    });
    const index = path.lessons.findIndex((l) => l.id === lessonId);
    const lesson = path.lessons[index];
    if (lesson && (lesson.kind === 'checkpoint' || lesson.kind === 'final') && result.stars >= 2) {
      const rows = await db.lessonProgress.where('[profileId+pathId]').equals([profileId, path.id]).toArray();
      const map = new Map(rows.map((r) => [r.lessonId, r]));
      skipped = lessonsToSkip(path.lessons, index, map);
      for (const id of skipped) {
        const p = map.get(id) ?? emptyProgress(profileId, path.id, id);
        await db.lessonProgress.put({ ...p, skipped: true, updatedAt: now });
      }
    }
    if (lesson?.kind === 'final' && result.stars === 3) {
      const stats = (await db.stats.get(profileId)) ?? emptyStats(profileId);
      const award = `grad-${path.id}`;
      if (!stats.awards.includes(award)) {
        await db.stats.put({ ...stats, awards: [...stats.awards, award] });
        graduated = true;
      }
    }
    await applyAnswers(profileId, path, answers, ms, now);
  });
  return { ...result, skipped, graduated };
}

/** Daily snapshots of every path, oldest first. */
export function useMasteryDays(profileId: number | undefined): MasteryDay[] | undefined {
  return useLiveQuery(async () => {
    if (profileId === undefined) return [];
    const rows = await db.masteryDaily.where('profileId').equals(profileId).toArray();
    return rows.sort((a, b) => a.date.localeCompare(b.date));
  }, [profileId]);
}

export async function togglePin(profileId: number, pathId: PathId, lessonId: string): Promise<void> {
  const old = (await db.lessonProgress.get([profileId, lessonId])) ?? emptyProgress(profileId, pathId, lessonId);
  await db.lessonProgress.put({ ...old, pinned: !old.pinned, updatedAt: Date.now() });
}
