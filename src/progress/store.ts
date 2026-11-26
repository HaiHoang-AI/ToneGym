import { db as defaultDb, emptyStats, type Attempt, type EarLabDB, type GameProgress, type ProfileStats, type WorkoutDay } from '../db/schema';
import { getGame, playableGames } from '../games/registry';
import { CHANGE_LEVEL_FROM } from '../games/levels';
import { createRng } from '../theory';
import { daySeed, nextStreak, pickWorkoutGames, workoutDateKey, WORKOUT_COINS } from '../workout/workout';
import { earIndex, rankFor } from './scoring';

export function emptyProgress(profileId: number, gameId: string): GameProgress {
  return { profileId, gameId, level: 1, maxLevel: 1, levelsPassed: 0, plays: 0, correct: 0, answered: 0, bestScore: 0, updatedAt: 0 };
}

export async function getProgress(profileId: number, gameId: string, db: EarLabDB = defaultDb): Promise<GameProgress> {
  return (await db.gameProgress.get([profileId, gameId])) ?? emptyProgress(profileId, gameId);
}

export async function allProgress(profileId: number, db: EarLabDB = defaultDb): Promise<GameProgress[]> {
  return db.gameProgress.where('profileId').equals(profileId).toArray();
}

export async function getStats(profileId: number, db: EarLabDB = defaultDb): Promise<ProfileStats> {
  return (await db.stats.get(profileId)) ?? emptyStats(profileId);
}

/** Lowest level the player may go back to ("Change level", up to 10 below the highest). */
export function minSelectableLevel(p: GameProgress): number {
  return p.maxLevel > CHANGE_LEVEL_FROM ? Math.max(1, p.maxLevel - CHANGE_LEVEL_FROM) : p.maxLevel;
}

export async function setCurrentLevel(profileId: number, gameId: string, level: number, db: EarLabDB = defaultDb) {
  const p = await getProgress(profileId, gameId, db);
  const clamped = Math.min(p.maxLevel, Math.max(minSelectableLevel(p), level));
  await db.gameProgress.put({ ...p, level: clamped, updatedAt: Date.now() });
}

export interface LevelResult {
  profileId: number;
  gameId: string;
  level: number;
  passed: boolean;
  score: number;
  correct: number;
  answered: number;
  context: Attempt['context'];
}

/** Saves the end of a level: progress, attempt log, Ear Index history. Returns the new progress. */
export async function recordLevelResult(r: LevelResult, now = new Date(), db: EarLabDB = defaultDb): Promise<GameProgress> {
  return db.transaction('rw', [db.gameProgress, db.attempts, db.stats, db.profiles], async () => {
    const p = await getProgress(r.profileId, r.gameId, db);
    // Passing the highest unlocked level unlocks the next one; replaying an older level does not.
    const unlocksNext = r.passed && r.level >= p.maxLevel;
    const maxLevel = unlocksNext ? p.maxLevel + 1 : p.maxLevel;
    const updated: GameProgress = {
      ...p,
      plays: p.plays + 1,
      correct: p.correct + r.correct,
      answered: p.answered + r.answered,
      bestScore: Math.max(p.bestScore, r.score),
      levelsPassed: p.levelsPassed + (unlocksNext ? 1 : 0),
      maxLevel,
      level: r.passed ? Math.min(maxLevel, r.level + 1) : r.level,
      updatedAt: now.getTime(),
    };
    await db.gameProgress.put(updated);
    await db.attempts.add({ ...r, at: now.getTime() });

    const all = await db.gameProgress.where('profileId').equals(r.profileId).toArray();
    const value = earIndex(all);
    const profile = await db.profiles.get(r.profileId);
    const stats = await getStats(r.profileId, db);
    const day = workoutDateKey(now, profile?.settings.workoutResetHour ?? 4);
    const history = stats.earIndexHistory.filter((h) => h.date !== day);
    history.push({ date: day, value });
    await db.stats.put({ ...stats, earIndexHistory: history.slice(-400) });
    return updated;
  });
}

/** Today's workout for a profile, created on first access. */
export async function ensureWorkout(profileId: number, now = new Date(), db: EarLabDB = defaultDb): Promise<WorkoutDay> {
  const profile = await db.profiles.get(profileId);
  const date = workoutDateKey(now, profile?.settings.workoutResetHour ?? 4);
  const existing = await db.workouts.get([profileId, date]);
  if (existing) return existing;
  const progress = new Map((await allProgress(profileId, db)).map((p) => [p.gameId, p]));
  const games = pickWorkoutGames(playableGames(), progress, profile?.settings.workoutGames ?? [], createRng(daySeed(date, profileId)));
  const day: WorkoutDay = { profileId, date, games, completed: [], coinsAwarded: 0 };
  await db.workouts.put(day);
  return day;
}

/** Rebuilds today's workout after the player changed the pinned games (keeps finished ones). */
export async function rebuildWorkout(profileId: number, now = new Date(), db: EarLabDB = defaultDb): Promise<WorkoutDay> {
  const profile = await db.profiles.get(profileId);
  const date = workoutDateKey(now, profile?.settings.workoutResetHour ?? 4);
  const existing = await db.workouts.get([profileId, date]);
  if (existing?.coinsAwarded) return existing;
  await db.workouts.delete([profileId, date]);
  const fresh = await ensureWorkout(profileId, now, db);
  if (existing) {
    const completed = existing.completed.filter((g) => fresh.games.includes(g));
    await db.workouts.put({ ...fresh, completed });
    return { ...fresh, completed };
  }
  return fresh;
}

export interface WorkoutCompletion {
  finishedNow: boolean;
  coins: number;
  streak: number;
  newAwards: string[];
}

/** Marks one workout game done; finishing all of them pays coins, extends the streak and grants awards. */
export async function completeWorkoutGame(profileId: number, gameId: string, now = new Date(), db: EarLabDB = defaultDb): Promise<WorkoutCompletion> {
  return db.transaction('rw', [db.workouts, db.stats, db.profiles, db.gameProgress], async () => {
    const day = await ensureWorkout(profileId, now, db);
    if (!day.games.includes(gameId)) return { finishedNow: false, coins: 0, streak: 0, newAwards: [] };
    const completed = day.completed.includes(gameId) ? day.completed : [...day.completed, gameId];
    const allDone = day.games.every((g) => completed.includes(g));
    const stats = await getStats(profileId, db);
    if (!allDone || day.coinsAwarded) {
      await db.workouts.put({ ...day, completed });
      return { finishedNow: false, coins: 0, streak: stats.streak, newAwards: [] };
    }
    const streak = nextStreak(stats.lastWorkoutDate, day.date, stats.streak);
    const workoutsDone = stats.workoutsDone + 1;
    const value = earIndex(await allProgress(profileId, db));
    const awards = new Set(stats.awards);
    const newAwards: string[] = [];
    const grant = (id: string) => {
      if (!awards.has(id)) {
        awards.add(id);
        newAwards.push(id);
      }
    };
    // Rank medals are only granted when a daily workout is completed.
    grant(`rank-${rankFor(value).id}`);
    if (workoutsDone >= 10) grant('workouts-10');
    if (workoutsDone >= 50) grant('workouts-50');
    if (streak >= 7) grant('streak-7');
    if (streak >= 30) grant('streak-30');
    await db.workouts.put({ ...day, completed, coinsAwarded: WORKOUT_COINS, finishedAt: now.getTime() });
    await db.stats.put({
      ...stats,
      coins: stats.coins + WORKOUT_COINS,
      streak,
      bestStreak: Math.max(stats.bestStreak, streak),
      lastWorkoutDate: day.date,
      workoutsDone,
      awards: [...awards],
    });
    return { finishedNow: true, coins: WORKOUT_COINS, streak, newAwards };
  });
}

export function gameSkill(id: string) {
  return getGame(id)?.skill;
}
