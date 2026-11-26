import type { ItemMastery, PathId } from './types';

const DAY = 86_400_000;
/** Weight of the newest answer: about the last 20 answers count. */
export const EWMA_ALPHA = 0.1;
export const MAX_INTERVAL_DAYS = 16;

export function newMastery(profileId: number, pathId: PathId, itemId: string): ItemMastery {
  return { profileId, pathId, itemId, ewma: 0, seen: 0, correct: 0, lastSeen: 0, intervalDays: 0, due: 0 };
}

/**
 * Applies the answers of one session to an item: the accuracy average moves per answer, the
 * review spacing doubles (1 → 2 → 4 → 8 → 16 days) when the session went well (≥ 80 %), else back to 1 day.
 */
export function applySession(m: ItemMastery, answers: readonly boolean[], now = Date.now()): ItemMastery {
  if (answers.length === 0) return m;
  let ewma = m.seen === 0 ? (answers[0] ? 1 : 0) : m.ewma;
  answers.forEach((ok, i) => {
    if (m.seen === 0 && i === 0) return;
    ewma = ewma + EWMA_ALPHA * ((ok ? 1 : 0) - ewma);
  });
  const right = answers.filter(Boolean).length;
  const good = right / answers.length >= 0.8;
  const intervalDays = good ? Math.min(MAX_INTERVAL_DAYS, Math.max(1, m.intervalDays * 2)) : 1;
  return { ...m, ewma, seen: m.seen + answers.length, correct: m.correct + right, lastSeen: now, intervalDays, due: now + intervalDays * DAY };
}

/** Mastery 0–1 shown to the player: the average, fading slowly after a week without practice. */
export function masteryNow(m: ItemMastery | undefined, now = Date.now()): number {
  if (!m || m.seen === 0) return 0;
  const idleDays = Math.max(0, (now - m.lastSeen) / DAY - 7);
  return m.ewma * Math.pow(0.5, idleDays / 30);
}

/** Path mastery: the mean over every item of the path (items never heard count as 0). */
export function pathMastery(items: readonly string[], byItem: ReadonlyMap<string, ItemMastery>, now = Date.now()): number {
  if (items.length === 0) return 0;
  return items.reduce((sum, id) => sum + masteryNow(byItem.get(id), now), 0) / items.length;
}

/** Groups answers by item: { C: [true, false, …] }. */
export function answersByItem(results: readonly { itemId: string; correct: boolean }[]): Map<string, boolean[]> {
  const out = new Map<string, boolean[]>();
  for (const r of results) out.set(r.itemId, [...(out.get(r.itemId) ?? []), r.correct]);
  return out;
}
