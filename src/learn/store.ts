import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { answersByItem, applySession, newMastery } from './mastery';
import { lessonsToSkip } from './stars';
import type { ItemMastery, LessonProgress, PathDef, PathId } from './types';

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
}

/** Saves a finished run: best stars, skip-ahead for checkpoints, and the answers for mastery. */
export async function saveLessonRun(
  profileId: number,
  path: PathDef,
  lessonId: string,
  result: { stars: number; pct: number },
  answers: readonly { itemId: string; correct: boolean }[],
): Promise<LessonOutcome> {
  const now = Date.now();
  let skipped: string[] = [];
  await db.transaction('rw', db.lessonProgress, db.itemMastery, async () => {
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
    for (const [itemId, list] of answersByItem(answers)) {
      const m = (await db.itemMastery.get([profileId, path.id, itemId])) ?? newMastery(profileId, path.id, itemId);
      await db.itemMastery.put(applySession(m, list, now));
    }
  });
  return { ...result, skipped };
}

export async function togglePin(profileId: number, pathId: PathId, lessonId: string): Promise<void> {
  const old = (await db.lessonProgress.get([profileId, lessonId])) ?? emptyProgress(profileId, pathId, lessonId);
  await db.lessonProgress.put({ ...old, pinned: !old.pinned, updatedAt: Date.now() });
}
