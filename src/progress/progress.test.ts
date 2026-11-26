import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EarLabDB, type GameProgress } from '../db/schema';
import { ensureActiveProfile } from '../db/profiles';
import { createRng } from '../theory';
import { playableGames } from '../games/registry';
import { nextStreak, pickWorkoutGames, previousDateKey, workoutDateKey } from '../workout/workout';
import { earIndex, gamePoints, rankFor, nextRank } from './scoring';
import {
  completeWorkoutGame, ensureWorkout, getProgress, getStats, minSelectableLevel, recordLevelResult, setCurrentLevel,
} from './store';

describe('workout dates', () => {
  it('turns the day over at 4 AM local time', () => {
    expect(workoutDateKey(new Date(2026, 10, 26, 3, 59))).toBe('2026-11-25');
    expect(workoutDateKey(new Date(2026, 10, 26, 4, 0))).toBe('2026-11-26');
    expect(workoutDateKey(new Date(2026, 10, 26, 23, 30))).toBe('2026-11-26');
    expect(workoutDateKey(new Date(2026, 10, 27, 1, 0))).toBe('2026-11-26');
  });

  it('computes the previous day across month ends', () => {
    expect(previousDateKey('2026-12-01')).toBe('2026-11-30');
    expect(previousDateKey('2027-01-01')).toBe('2026-12-31');
  });

  it('extends or resets the streak', () => {
    expect(nextStreak(null, '2026-11-26', 0)).toBe(1);
    expect(nextStreak('2026-11-25', '2026-11-26', 4)).toBe(5);
    expect(nextStreak('2026-11-23', '2026-11-26', 4)).toBe(1);
    expect(nextStreak('2026-11-26', '2026-11-26', 4)).toBe(4);
  });
});

describe('workout picking', () => {
  it('honours pinned games and fills the rest from different skills', () => {
    const games = playableGames();
    const picked = pickWorkoutGames(games, new Map(), ['scale-id'], createRng(1));
    expect(picked).toHaveLength(5);
    expect(picked[0]).toBe('scale-id');
    expect(new Set(picked).size).toBe(5);
    const skills = picked.map((id) => games.find((g) => g.id === id)!.skill);
    // Four skills exist in phase 2, so the first four picks cover all of them.
    expect(new Set(skills).size).toBe(4);
  });
});

describe('scoring', () => {
  const p = (levelsPassed: number, correct = 8, answered = 8): GameProgress => ({
    profileId: 1, gameId: 'x', level: levelsPassed + 1, maxLevel: levelsPassed + 1, levelsPassed, plays: 1, correct, answered, bestScore: 0, updatedAt: 0,
  });

  it('gives no points before passing a level and more with more levels', () => {
    expect(gamePoints(p(0))).toBe(0);
    expect(gamePoints(p(4))).toBeLessThan(gamePoints(p(16)));
    expect(earIndex([p(4), p(16)])).toBe(gamePoints(p(4)) + gamePoints(p(16)));
  });

  it('maps values to ranks', () => {
    expect(rankFor(0).id).toBe('iron');
    expect(rankFor(250).id).toBe('bronze');
    expect(rankFor(742).id).toBe('silver');
    expect(rankFor(5000).id).toBe('diamond');
    expect(nextRank(742)?.id).toBe('gold');
    expect(nextRank(5000)).toBeNull();
  });
});

describe('progress store', () => {
  let db: EarLabDB;
  let n = 0;
  let profileId: number;

  beforeEach(async () => {
    db = new EarLabDB(`progress-${n++}`);
    await db.open();
    profileId = (await ensureActiveProfile('Tôi', db)).id!;
  });
  afterEach(async () => db.delete());

  const result = (level: number, passed: boolean) => ({
    profileId, gameId: 'chord-id', level, passed, score: 900, correct: passed ? 8 : 2, answered: passed ? 8 : 5, context: 'free' as const,
  });

  it('unlocks the next level only from the frontier', async () => {
    await recordLevelResult(result(1, true), new Date(), db);
    let prog = await getProgress(profileId, 'chord-id', db);
    expect(prog).toMatchObject({ level: 2, maxLevel: 2, levelsPassed: 1, plays: 1 });
    await recordLevelResult(result(2, false), new Date(), db);
    prog = await getProgress(profileId, 'chord-id', db);
    expect(prog).toMatchObject({ level: 2, maxLevel: 2, levelsPassed: 1, plays: 2 });
    expect((await getStats(profileId, db)).earIndexHistory.length).toBe(1);
  });

  it('only lets the player step back 10 levels after level 10', async () => {
    for (let lv = 1; lv <= 14; lv++) await recordLevelResult(result(lv, true), new Date(), db);
    const prog = await getProgress(profileId, 'chord-id', db);
    expect(prog.maxLevel).toBe(15);
    expect(minSelectableLevel(prog)).toBe(5);
    await setCurrentLevel(profileId, 'chord-id', 1, db);
    expect((await getProgress(profileId, 'chord-id', db)).level).toBe(5);
    // Replaying an old level does not unlock anything new.
    await recordLevelResult(result(5, true), new Date(), db);
    expect((await getProgress(profileId, 'chord-id', db)).maxLevel).toBe(15);
  });

  it('pays coins and grows the streak once every workout game is done', async () => {
    const day1 = new Date(2026, 10, 25, 10);
    const w = await ensureWorkout(profileId, day1, db);
    expect(w.games).toHaveLength(5);
    expect((await ensureWorkout(profileId, day1, db)).games).toEqual(w.games);
    for (const [i, g] of w.games.entries()) {
      const r = await completeWorkoutGame(profileId, g, day1, db);
      expect(r.finishedNow).toBe(i === w.games.length - 1);
    }
    let stats = await getStats(profileId, db);
    expect(stats).toMatchObject({ coins: 30, streak: 1, workoutsDone: 1 });
    expect(stats.awards).toContain('rank-iron');

    const day2 = new Date(2026, 10, 26, 9);
    const w2 = await ensureWorkout(profileId, day2, db);
    for (const g of w2.games) await completeWorkoutGame(profileId, g, day2, db);
    stats = await getStats(profileId, db);
    expect(stats).toMatchObject({ coins: 60, streak: 2, workoutsDone: 2 });
  });
});
