import Dexie, { Table } from 'dexie';
import type { Member } from '@/types/member';
import type { PracticeSettings, PracticePlayer } from '@/types/practice';
import type { Round } from '@/types/round';
import type { PairStats } from '@/types/pairs';
import type { PracticeSession } from '@/types/practiceSession';

const SAMPLE_MEMBER_NAMES = ['Aくん', 'Bさん', 'Cくん', 'Dさん'];

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
    this.version(4)
      .stores({
        members: '++id, name, isActive, createdAt, updatedAt',
        practiceSettings: 'id, updatedAt',
        practicePlayers: 'memberId, playerNumber, status, createdAt',
        rounds: 'roundNo',
        pairStats: '++id, sessionId, lastUpdated',
        practiceSessions: '++id, startedAt, endedAt, *clubTags',
      })
      .upgrade((tx) => {
        return tx
          .table('practiceSessions')
          .toCollection()
          .modify((session) => {
            if (session.clubTag) {
              session.clubTags = [session.clubTag];
            }
            delete session.clubTag;
          });
      });

    // Version 5: Add isDeleted soft-delete flag to members
    this.version(5)
      .stores({
        members: '++id, name, isActive, isDeleted, createdAt, updatedAt',
        practiceSettings: 'id, updatedAt',
        practicePlayers: 'memberId, playerNumber, status, createdAt',
        rounds: 'roundNo',
        pairStats: '++id, sessionId, lastUpdated',
        practiceSessions: '++id, startedAt, endedAt, *clubTags',
      })
      .upgrade((tx) => {
        return tx
          .table('members')
          .toCollection()
          .modify((member) => {
            if (member.isDeleted === undefined) {
              member.isDeleted = false;
            }
          });
      });

    // Version 6: 初期サンプル選手に印を付ける（スキーマは変更しない）
    this.version(6)
      .stores({
        members: '++id, name, isActive, isDeleted, createdAt, updatedAt',
        practiceSettings: 'id, updatedAt',
        practicePlayers: 'memberId, playerNumber, status, createdAt',
        rounds: 'roundNo',
        pairStats: '++id, sessionId, lastUpdated',
        practiceSessions: '++id, startedAt, endedAt, *clubTags',
      })
      .upgrade(async (tx) => {
        const members: Array<{
          id: number;
          name: string;
          isDeleted?: boolean;
          createdAt?: string;
        }> = await tx.table('members').toArray();
        const seeds = members.filter(
          (member) =>
            SAMPLE_MEMBER_NAMES.includes(member.name) && member.isDeleted !== true
        );
        const byCreatedAt = new Map<string, typeof seeds>();
        for (const member of seeds) {
          const key = String(member.createdAt ?? '');
          const group = byCreatedAt.get(key) ?? [];
          group.push(member);
          byCreatedAt.set(key, group);
        }
        for (const group of Array.from(byCreatedAt.values())) {
          const names = new Set(group.map((member) => member.name));
          const isInitialSample =
            SAMPLE_MEMBER_NAMES.every((name) => names.has(name)) &&
            group.length === SAMPLE_MEMBER_NAMES.length;
          if (!isInitialSample) continue;
          for (const member of group) {
            await tx.table('members').update(member.id, { isSample: true });
          }
        }
      });

    this.on('populate', async () => {
      const now = new Date().toISOString();
      const seedMembers: Omit<Member, 'id'>[] = [
        {
          name: 'Aくん',
          isActive: true,
          isDeleted: false,
          isSample: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Bさん',
          isActive: true,
          isDeleted: false,
          isSample: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Cくん',
          isActive: true,
          isDeleted: false,
          isSample: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Dさん',
          isActive: true,
          isDeleted: false,
          isSample: true,
          createdAt: now,
          updatedAt: now,
        },
      ];
      await this.members.bulkAdd(seedMembers as Member[]);
    });
  }
}

declare global {
  // eslint-disable-next-line no-var
  var _pairkujiDb: PairkujiDB | undefined;
}

// 開発時（HMR）に Dexie インスタンスが複数作られないようにする
export const db = globalThis._pairkujiDb ?? new PairkujiDB();
if (process.env.NODE_ENV !== 'production') {
  globalThis._pairkujiDb = db;
}
