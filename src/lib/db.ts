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
      practicePlayers: '++id, memberId, status, createdAt',
      rounds: 'roundNo',
    });
  }
}

export const db = new PairkujiDB();
