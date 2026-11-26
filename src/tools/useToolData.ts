import { useLiveQuery } from 'dexie-react-hooks';
import { useProfile } from '../app/ProfileContext';
import { db } from '../db/schema';

/** A per-profile value stored in IndexedDB, kept live. */
export function useToolData<T>(key: string, fallback: T): [T, (value: T) => Promise<void>] {
  const profile = useProfile();
  const entry = useLiveQuery(() => db.toolData.get([profile.id!, key]), [profile.id, key]);
  const value = (entry?.value as T | undefined) ?? fallback;
  const save = async (v: T) => {
    await db.toolData.put({ profileId: profile.id!, key, value: v, updatedAt: Date.now() });
  };
  return [value, save];
}
