import { db as defaultDb, type EarLabDB } from './schema';

export const BACKUP_FORMAT = 'earlab-backup';
export const BACKUP_VERSION = 1;

export interface Backup {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  tables: Record<string, unknown[]>;
}

/** Everything in the local database, as one JSON-serialisable object. */
export async function exportAll(db: EarLabDB = defaultDb): Promise<Backup> {
  const tables: Record<string, unknown[]> = {};
  for (const table of db.tables) tables[table.name] = await table.toArray();
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), tables };
}

/** Checks a parsed file before anything is replaced. Throws a readable error. */
export function validateBackup(data: unknown): Backup {
  const b = data as Partial<Backup> | null;
  if (!b || b.format !== BACKUP_FORMAT || typeof b.tables !== 'object' || !b.tables) throw new Error('Not an EarLab backup file');
  if (!Array.isArray(b.tables.profiles) || b.tables.profiles.length === 0) throw new Error('The backup has no profiles');
  return b as Backup;
}

/** Replaces all local data with the backup (tables the backup does not have are emptied). */
export async function importAll(data: unknown, db: EarLabDB = defaultDb): Promise<void> {
  const backup = validateBackup(data);
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
      const rows = backup.tables[table.name];
      if (Array.isArray(rows) && rows.length) await table.bulkPut(rows);
    }
  });
}
