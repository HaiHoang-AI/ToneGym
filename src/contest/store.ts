import { db as defaultDb, emptyStats, type EarLabDB } from '../db/schema';
import { distribute, ENTRY_FEE, isoWeekKey, TO_JACKPOT, type Placement } from './contest';

export interface WeekBoard {
  week: string;
  jackpot: number;
  entries: number;
  ranking: (Placement & { name: string; color: string; tries: number })[];
}

export async function weekBoard(week: string, db: EarLabDB = defaultDb): Promise<WeekBoard> {
  const entries = await db.contestEntries.where('week').equals(week).toArray();
  const profiles = await db.profiles.toArray();
  const best = new Map<number, { best: number; tries: number }>();
  for (const e of entries) {
    const cur = best.get(e.profileId) ?? { best: 0, tries: 0 };
    best.set(e.profileId, { best: Math.max(cur.best, e.score), tries: cur.tries + 1 });
  }
  const ranking = [...best.entries()]
    .map(([profileId, v]) => {
      const p = profiles.find((x) => x.id === profileId);
      return { profileId, best: v.best, tries: v.tries, name: p?.name ?? '?', color: p?.color ?? '#999' };
    })
    .sort((a, b) => b.best - a.best);
  return { week, jackpot: entries.length * TO_JACKPOT, entries: entries.length, ranking };
}

/** Pays the entry fee. Returns false when the profile cannot afford it. */
export async function payEntry(profileId: number, db: EarLabDB = defaultDb): Promise<boolean> {
  return db.transaction('rw', db.stats, async () => {
    const stats = (await db.stats.get(profileId)) ?? emptyStats(profileId);
    if (stats.coins < ENTRY_FEE) return false;
    await db.stats.put({ ...stats, coins: stats.coins - ENTRY_FEE });
    return true;
  });
}

export async function recordEntry(profileId: number, score: number, now = new Date(), db: EarLabDB = defaultDb) {
  await db.contestEntries.add({ week: isoWeekKey(now), profileId, score, at: now.getTime() });
}

/**
 * Settles every finished week once: jackpot to the local profiles by place, gold/silver/bronze
 * medals to the top three.
 */
export async function settleFinishedWeeks(now = new Date(), db: EarLabDB = defaultDb): Promise<string[]> {
  const current = isoWeekKey(now);
  const weeks = [...new Set((await db.contestEntries.toArray()).map((e) => e.week))].filter((w) => w < current);
  const settled: string[] = [];
  for (const week of weeks) {
    const key = `contest-settled:${week}`;
    if (await db.meta.get(key)) continue;
    const board = await weekBoard(week, db);
    const prizes = distribute(board.jackpot, board.ranking);
    await db.transaction('rw', db.stats, db.meta, async () => {
      for (const [i, r] of board.ranking.entries()) {
        const stats = (await db.stats.get(r.profileId)) ?? emptyStats(r.profileId);
        const awards = new Set(stats.awards);
        if (i === 0) awards.add('contest-gold');
        if (i === 1) awards.add('contest-silver');
        if (i === 2) awards.add('contest-bronze');
        await db.stats.put({ ...stats, coins: stats.coins + (prizes.get(r.profileId) ?? 0), awards: [...awards] });
      }
      await db.meta.put({ key, value: true });
    });
    settled.push(week);
  }
  return settled;
}
