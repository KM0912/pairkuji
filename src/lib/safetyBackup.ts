import Dexie, { type Table } from 'dexie';
import type { PairkujiBackup } from '@/lib/backup';

/** 上書きの直前のデータを置く別DB。本体を消しても残る。 */
const SAFETY_DB_NAME = 'pairkuji-safety';
const SNAPSHOT_ID = 1;

class SafetyBackupDB extends Dexie {
  snapshots!: Table<{ id: number; backup: PairkujiBackup }, number>;

  constructor() {
    super(SAFETY_DB_NAME);
    this.version(1).stores({
      snapshots: 'id',
    });
  }
}

const safetyDb = new SafetyBackupDB();

export async function saveSafetySnapshot(backup: PairkujiBackup): Promise<void> {
  await safetyDb.snapshots.put({ id: SNAPSHOT_ID, backup });
}

export async function loadSafetySnapshot(): Promise<PairkujiBackup | null> {
  const row = await safetyDb.snapshots.get(SNAPSHOT_ID);
  return row?.backup ?? null;
}
