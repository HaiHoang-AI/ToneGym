import { PATHS } from './paths';
import { pathStatuses } from './stars';
import type { LessonProgress, PathDef, PathId } from './types';

function progressMap(path: PathDef, rows: readonly LessonProgress[]): Map<string, LessonProgress> {
  return new Map(rows.filter((r) => r.pathId === path.id).map((r) => [r.lessonId, r]));
}

/** Items the player has reached in a path: passed or skipped lessons and the current one. */
export function unlockedItems(path: PathDef, rows: readonly LessonProgress[]): string[] {
  const map = progressMap(path, rows);
  const statuses = pathStatuses(path.lessons, map);
  const set = new Set<string>();
  path.lessons.forEach((lesson, i) => {
    const st = statuses[i]!;
    const reached = st === 'done' || st === 'skipped' || (lesson.kind !== 'checkpoint' && lesson.kind !== 'final' && (st === 'current' || st === 'retry'));
    if (reached) for (const id of [...lesson.pool, ...lesson.newItems]) set.add(id);
  });
  if (set.size === 0) for (const id of path.lessons[0]!.pool) set.add(id);
  return path.items.filter((id) => set.has(id));
}

/** New material for the daily session: what the next lesson of every started path teaches (Pitch if nothing is started). */
export function freshItems(rows: readonly LessonProgress[]): { pathId: PathId; itemId: string }[] {
  const started = PATHS.filter((p) => rows.some((r) => r.pathId === p.id));
  const out: { pathId: PathId; itemId: string }[] = [];
  for (const path of started.length ? started : [PATHS[0]!]) {
    const statuses = pathStatuses(path.lessons, progressMap(path, rows));
    const i = statuses.findIndex((s) => s === 'current' || s === 'retry');
    const lesson = path.lessons[i];
    if (!lesson) continue;
    const items = lesson.newItems.length ? lesson.newItems : lesson.pool;
    for (const itemId of items) out.push({ pathId: path.id, itemId });
  }
  return out;
}
