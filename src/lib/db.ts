import Dexie, { Table } from 'dexie';
import type { Member } from '@/types/member';
import type { PracticeSettings, PracticePlayer } from '@/types/practice';
import type { Round } from '@/types/round';
import type { PairStats } from '@/types/pairs';
import type { PracticeSession } from '@/types/practiceSession';

export class PairkujiDB extends Dexie {
  members!: Table<Member, number>;
  practiceSettings!: Table<PracticeSettings, number>;
  practicePlayers!: Table<PracticePlayer, number>; // memberId as primary key
  rounds!: Table<Round, number>;
  pairStats!: Table<PairStats, number>;
  practiceSessions!: Table<PracticeSession, number>;

  constructor() {
    super('pairkuji');

    // Version 1: Complete schema with all tables
    this.version(1).stores({
      members: '++id, name, isActive, createdAt, updatedAt',
      practiceSettings: 'id, updatedAt',
      practicePlayers: 'memberId, playerNumber, status, createdAt', // memberId as primary key
      rounds: 'roundNo',
      pairStats: '++id, sessionId, lastUpdated',
    });

    // Version 2: Add practiceSessions table for archiving
    this.version(2).stores({
      members: '++id, name, isActive, createdAt, updatedAt',
      practiceSettings: 'id, updatedAt',
      practicePlayers: 'memberId, playerNumber, status, createdAt',
      rounds: 'roundNo',
      pairStats: '++id, sessionId, lastUpdated',
      practiceSessions: '++id, startedAt, endedAt',
    });

    // Version 3: Add clubTag to practiceSessions
    this.version(3).stores({
      members: '++id, name, isActive, createdAt, updatedAt',
      practiceSettings: 'id, updatedAt',
      practicePlayers: 'memberId, playerNumber, status, createdAt',
      rounds: 'roundNo',
      pairStats: '++id, sessionId, lastUpdated',
      practiceSessions: '++id, startedAt, endedAt, clubTag',
    });

    // Version 4: clubTag → clubTags (multiple tags as array)
    this.version(4).stores({
      members: '++id, name, isActive, createdAt, updatedAt',
      practiceSettings: 'id, updatedAt',
      practicePlayers: 'memberId, playerNumber, status, createdAt',
      rounds: 'roundNo',
      pairStats: '++id, sessionId, lastUpdated',
      practiceSessions: '++id, startedAt, endedAt, *clubTags',
    }).upgrade((tx) => {
      return tx.table('practiceSessions').toCollection().modify((session) => {
        if (session.clubTag) {
          session.clubTags = [session.clubTag];
        }
        delete session.clubTag;
      });
    });

    this.on('populate', async () => {
      const now = new Date().toISOString();
      const seedMembers: Omit<Member, 'id'>[] = [
        {
          name: 'Aくん',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Bさん',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Cくん',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Dさん',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ];
      await this.members.bulkAdd(seedMembers as Member[]);
    });
  }
}

export const db = new PairkujiDB();
