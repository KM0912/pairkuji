import Dexie, { Table } from 'dexie';
import type { Member } from '@/types/member';
import type { PracticeSettings, PracticePlayer } from '@/types/practice';
import type { Round } from '@/types/round';

export class PairkujiDB extends Dexie {
  members!: Table<Member, number>;
  practiceSettings!: Table<PracticeSettings, number>;
  practicePlayers!: Table<PracticePlayer, number>; // memberId as primary key
  rounds!: Table<Round, number>;

  constructor() {
    super('pairkuji');

    // Version 1: Complete schema with all tables
    this.version(1).stores({
      members: '++id, name, isActive, createdAt, updatedAt',
      practiceSettings: 'id, updatedAt',
      practicePlayers: 'memberId, playerNumber, status, createdAt', // memberId as primary key
      rounds: 'roundNo',
    });
  }
}

export const db = new PairkujiDB();
