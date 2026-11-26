import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EarLabDB } from './schema';
import {
  createProfile, deleteProfile, ensureActiveProfile, getActiveProfile, listProfiles,
  renameProfile, setActiveProfile, updateSettings,
} from './profiles';

let db: EarLabDB;
let n = 0;

beforeEach(async () => {
  db = new EarLabDB(`test-${n++}`);
  await db.open();
});

afterEach(async () => {
  await db.delete();
});

describe('profiles', () => {
  it('creates a default profile on first launch and makes it active', async () => {
    const profile = await ensureActiveProfile('Tôi', db);
    expect(profile.name).toBe('Tôi');
    expect(profile.settings.language).toBe('vi');
    expect((await getActiveProfile(db))?.id).toBe(profile.id);
    // Second call does not create another one.
    await ensureActiveProfile('Tôi', db);
    expect(await listProfiles(db)).toHaveLength(1);
  });

  it('switches, renames and updates settings', async () => {
    const first = await ensureActiveProfile('A', db);
    const secondId = await createProfile('B', { language: 'en' }, db);
    await setActiveProfile(secondId, db);
    expect((await getActiveProfile(db))?.name).toBe('B');
    await renameProfile(secondId, '  Bee  ', db);
    await updateSettings(secondId, { volume: 0.3 }, db);
    const b = await getActiveProfile(db);
    expect(b?.name).toBe('Bee');
    expect(b?.settings.volume).toBe(0.3);
    expect(b?.settings.language).toBe('en');
    expect((await db.profiles.get(first.id!))?.settings.volume).toBe(0.8);
  });

  it('refuses empty names and deleting the last profile', async () => {
    const p = await ensureActiveProfile('A', db);
    await expect(createProfile('   ', {}, db)).rejects.toThrow();
    await expect(deleteProfile(p.id!, db)).rejects.toThrow();
  });

  it('moves the active pointer when the active profile is deleted', async () => {
    const a = await ensureActiveProfile('A', db);
    const bId = await createProfile('B', {}, db);
    await setActiveProfile(bId, db);
    await deleteProfile(bId, db);
    expect((await getActiveProfile(db))?.id).toBe(a.id);
  });
});
