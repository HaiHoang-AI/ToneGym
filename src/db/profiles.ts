import { db as defaultDb, DEFAULT_SETTINGS, type EarLabDB, type Profile, type ProfileSettings } from './schema';

const ACTIVE_KEY = 'activeProfileId';

export const PROFILE_COLORS = ['#f59e0b', '#22d3ee', '#a78bfa', '#34d399', '#f472b6', '#60a5fa', '#f87171'];

export async function listProfiles(db: EarLabDB = defaultDb): Promise<Profile[]> {
  return db.profiles.orderBy('createdAt').toArray();
}

export async function createProfile(
  name: string,
  settings: Partial<ProfileSettings> = {},
  db: EarLabDB = defaultDb,
): Promise<number> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Profile name is required');
  const count = await db.profiles.count();
  return db.profiles.add({
    name: trimmed,
    color: PROFILE_COLORS[count % PROFILE_COLORS.length] as string,
    createdAt: Date.now(),
    settings: { ...DEFAULT_SETTINGS, ...settings },
  });
}

export async function renameProfile(id: number, name: string, db: EarLabDB = defaultDb): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Profile name is required');
  await db.profiles.update(id, { name: trimmed });
}

export async function updateSettings(
  id: number,
  patch: Partial<ProfileSettings>,
  db: EarLabDB = defaultDb,
): Promise<void> {
  await db.transaction('rw', db.profiles, async () => {
    const profile = await db.profiles.get(id);
    if (!profile) throw new Error(`No profile ${id}`);
    await db.profiles.put({ ...profile, settings: { ...profile.settings, ...patch } });
  });
}

/** Deletes a profile unless it is the last one; moves the active pointer if needed. */
export async function deleteProfile(id: number, db: EarLabDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.profiles, db.meta, async () => {
    if ((await db.profiles.count()) <= 1) throw new Error('Cannot delete the last profile');
    await db.profiles.delete(id);
    const active = await db.meta.get(ACTIVE_KEY);
    if (active?.value === id) {
      const first = await db.profiles.orderBy('createdAt').first();
      await db.meta.put({ key: ACTIVE_KEY, value: first?.id });
    }
  });
}

export async function setActiveProfile(id: number, db: EarLabDB = defaultDb): Promise<void> {
  if (!(await db.profiles.get(id))) throw new Error(`No profile ${id}`);
  await db.meta.put({ key: ACTIVE_KEY, value: id });
}

/** The active profile, creating a first profile on first launch. */
export async function ensureActiveProfile(defaultName: string, db: EarLabDB = defaultDb): Promise<Profile> {
  return db.transaction('rw', db.profiles, db.meta, async () => {
    const active = await db.meta.get(ACTIVE_KEY);
    if (typeof active?.value === 'number') {
      const profile = await db.profiles.get(active.value);
      if (profile) return profile;
    }
    let profile = await db.profiles.orderBy('createdAt').first();
    if (!profile) {
      const id = await createProfile(defaultName, {}, db);
      profile = (await db.profiles.get(id)) as Profile;
    }
    await db.meta.put({ key: ACTIVE_KEY, value: profile.id });
    return profile;
  });
}

/** Read-only lookup for live queries (never writes). */
export async function getActiveProfile(db: EarLabDB = defaultDb): Promise<Profile | null> {
  const active = await db.meta.get(ACTIVE_KEY);
  if (typeof active?.value !== 'number') return null;
  return (await db.profiles.get(active.value)) ?? null;
}
