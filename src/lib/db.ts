import Dexie, { Table } from 'dexie';
import type { Member } from '@/types/member';
import type { PracticeSettings, PracticePlayer } from '@/types/practice';
import type { Round } from '@/types/round';

export class PairkujiDB extends Dexie {
  members!: Table<Member, number>;
  practiceSettings!: Table<PracticeSettings, number>;
  practicePlayers!: Table<PracticePlayer, number>;
  rounds!: Table<Round, number>;

  constructor() {
    super('pairkuji');
    this.version(1).stores({
      members: '++id, name, isActive, createdAt, updatedAt',
    });
    this.version(2).stores({
      members: '++id, name, isActive, createdAt, updatedAt',
      practiceSettings: 'id, updatedAt',
      practicePlayers: '++id, memberId, playerNumber, status, createdAt',
      rounds: 'roundNo',
    });
    this.version(3).stores({
      members: '++id, name, isActive, createdAt, updatedAt',
      practiceSettings: 'id, updatedAt',
      practicePlayers: '++id, memberId, playerNumber, status, createdAt',
      rounds: 'roundNo',
    }).upgrade(async (tx) => {
      // Clear existing practice data to ensure playerNumber is properly set
      await tx.table('practiceSettings').clear();
      await tx.table('practicePlayers').clear();
      await tx.table('rounds').clear();
    });
  }
}

export const db = new PairkujiDB();
