import type { LessonDef, LessonProgress } from './types';

export const PASS_STARS = 2;

/**
 * Stars from the graded questions. Every use of the anchor button takes one right answer away.
 * 3★ ≥ 90 %, 2★ ≥ 75 % (pass), otherwise 1★.
 */
export function computeStars(correct: number, total: number, anchorUses = 0): { stars: number; pct: number } {
  if (total <= 0) return { stars: 3, pct: 100 };
  const pct = Math.round((Math.max(0, correct - anchorUses) / total) * 100);
  const stars = pct >= 90 ? 3 : pct >= 75 ? 2 : 1;
  return { stars, pct };
}

export type NodeStatus = 'done' | 'skipped' | 'retry' | 'current' | 'open' | 'locked';

export function isPassed(p: Pick<LessonProgress, 'stars' | 'skipped'> | undefined): boolean {
  return !!p && (p.stars >= PASS_STARS || p.skipped);
}

/**
 * Status of every node of a path. Lessons unlock one by one (≥2★ on the one before);
 * checkpoints and the final exam are always open so a player can test out of a block.
 */
export function pathStatuses(lessons: readonly LessonDef[], progress: ReadonlyMap<string, LessonProgress>): NodeStatus[] {
  let currentGiven = false;
  return lessons.map((lesson, i) => {
    const p = progress.get(lesson.id);
    if (p?.skipped && p.stars < PASS_STARS) return 'skipped';
    if (isPassed(p)) return 'done';
    const prevPassed = i === 0 || isPassed(progress.get(lessons[i - 1]!.id));
    const reachable = prevPassed || lesson.kind === 'checkpoint' || lesson.kind === 'final';
    if (!reachable) return 'locked';
    if (prevPassed && !currentGiven) {
      currentGiven = true;
      return p && p.stars > 0 ? 'retry' : 'current';
    }
    if (p && p.stars > 0 && prevPassed) return 'retry';
    return 'open';
  });
}

/** Lessons before `index` that a passed checkpoint marks as skipped (all not yet passed). */
export function lessonsToSkip(lessons: readonly LessonDef[], index: number, progress: ReadonlyMap<string, LessonProgress>): string[] {
  return lessons.slice(0, index).filter((l) => !isPassed(progress.get(l.id))).map((l) => l.id);
}

export function countDone(lessons: readonly LessonDef[], progress: ReadonlyMap<string, LessonProgress>): number {
  return lessons.filter((l) => isPassed(progress.get(l.id))).length;
}
