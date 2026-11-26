import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, emptyStats, type GameProgress, type ProfileStats, type WorkoutDay } from '../db/schema';
import { workoutDateKey } from '../workout/workout';
import { ensureWorkout } from './store';

export function useStats(profileId: number): ProfileStats {
  return useLiveQuery(() => db.stats.get(profileId), [profileId]) ?? emptyStats(profileId);
}

export function useAllProgress(profileId: number): GameProgress[] {
  return useLiveQuery(() => db.gameProgress.where('profileId').equals(profileId).toArray(), [profileId]) ?? [];
}

export function useProgressMap(profileId: number): Map<string, GameProgress> {
  const list = useAllProgress(profileId);
  return new Map(list.map((p) => [p.gameId, p]));
}

/** Today's workout (created on first use), kept live. */
export function useWorkout(profileId: number, resetHour: number): WorkoutDay | undefined {
  const [date, setDate] = useState(() => workoutDateKey(new Date(), resetHour));
  useEffect(() => {
    void ensureWorkout(profileId);
    // Re-check the day key every minute so the workout rolls over at the reset hour.
    const timer = window.setInterval(() => {
      const key = workoutDateKey(new Date(), resetHour);
      setDate((d) => {
        if (d !== key) void ensureWorkout(profileId);
        return key;
      });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [profileId, resetHour]);
  return useLiveQuery(() => db.workouts.get([profileId, date]), [profileId, date]);
}

export function useRecentWorkouts(profileId: number): WorkoutDay[] {
  return useLiveQuery(() => db.workouts.where('profileId').equals(profileId).toArray(), [profileId]) ?? [];
}
