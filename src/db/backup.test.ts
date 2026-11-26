import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { exportAll, importAll, validateBackup } from './backup';
import { createProfile, ensureActiveProfile, listProfiles } from './profiles';
import { EarLabDB } from './schema';
import { recordLevelResult, getProgress } from '../progress/store';

const dbs: EarLabDB[] = [];
const fresh = async (name: string) => {
  const db = new EarLabDB(name);
  await db.open();
  dbs.push(db);
  return db;
};
afterEach(async () => {
  for (const db of dbs.splice(0)) await db.delete();
});

describe('backup', () => {
  it('round-trips profiles and progress into another database', async () => {
    const a = await fresh('backup-a');
    const p = await ensureActiveProfile('Tôi', a);
    await createProfile('Lan', {}, a);
    await recordLevelResult({ profileId: p.id!, gameId: 'chord-id', level: 1, passed: true, score: 900, correct: 8, answered: 8, context: 'free' }, new Date(), a);
    const json = JSON.parse(JSON.stringify(await exportAll(a)));

    const b = await fresh('backup-b');
    await ensureActiveProfile('Khác', b);
    await importAll(json, b);
    expect((await listProfiles(b)).map((x) => x.name)).toEqual(['Tôi', 'Lan']);
    expect((await getProgress(p.id!, 'chord-id', b)).maxLevel).toBe(2);
  });

  it('rejects files that are not backups', () => {
    expect(() => validateBackup({ hello: 1 })).toThrow();
    expect(() => validateBackup({ format: 'earlab-backup', version: 1, tables: { profiles: [] } })).toThrow();
  });
});
