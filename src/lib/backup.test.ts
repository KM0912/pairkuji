import { describe, expect, test } from 'vitest';
import type { Member } from '@/types/member';
import type { PracticeSession } from '@/types/practiceSession';
import type { Round } from '@/types/round';
import {
  BACKUP_VERSION,
  buildMemberIdMap,
  planMemberMerge,
  remapSession,
  sessionIdentity,
  validateBackup,
} from './backup';

function member(id: number, name: string, isDeleted = false): Member {
  return {
    id,
    name,
    isActive: true,
    isDeleted,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

function round(): Round {
  return {
    roundNo: 1,
    courts: [
      {
        courtNo: 1,
        pairA: [1, 2],
        pairB: [3, 4],
        result: 'pairA',
      },
    ],
    rests: [5],
  };
}

function validBackup(overrides: Record<string, unknown> = {}) {
  return {
    app: 'pairkuji',
    version: BACKUP_VERSION,
    exportedAt: '2026-04-01T00:00:00Z',
    members: [member(1, '山田')],
    practiceSettings: null,
    practicePlayers: [],
    rounds: [],
    practiceSessions: [],
    ...overrides,
  };
}

describe('validateBackup', () => {
  test('正しいバックアップを受け入れる', () => {
    const result = validateBackup(validBackup());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.members[0]?.name).toBe('山田');
    }
  });

  test('別アプリや壊れた選手は拒否する', () => {
    expect(validateBackup({ app: 'other' }).ok).toBe(false);
    const broken = validateBackup(
      validBackup({
        members: [{ id: 1, name: '', isActive: true, isDeleted: false }],
      })
    );
    expect(broken.ok).toBe(false);
    if (!broken.ok) {
      expect(broken.errors.length).toBeGreaterThan(0);
    }
  });

  test('勝敗やペアが壊れている履歴を拒否する', () => {
    const result = validateBackup(
      validBackup({
        practiceSessions: [
          {
            startedAt: '2026-01-01T00:00:00Z',
            endedAt: '2026-01-01T01:00:00Z',
            courts: 1,
            playerIds: [1],
            rounds: [
              {
                roundNo: 1,
                courts: [{ courtNo: 1, pairA: [1], pairB: [2, 3] }],
                rests: [],
              },
            ],
          },
        ],
      })
    );
    expect(result.ok).toBe(false);
  });
});

describe('planMemberMerge', () => {
  test('同名の既存選手は使い、新しい名前だけ追加する', () => {
    const plan = planMemberMerge(
      [member(10, '山田'), member(11, '削除済み', true)],
      [member(1, '山田'), member(2, '佐藤'), member(3, '佐藤')]
    );

    expect(plan.matches).toEqual([{ incomingId: 1, existingId: 10 }]);
    expect(plan.creates.map((item) => item.id)).toEqual([2]);
    expect(plan.aliases).toEqual([{ incomingId: 3, createIncomingId: 2 }]);

    const idMap = buildMemberIdMap(plan, new Map([[2, 20]]));
    expect(idMap.get(1)).toBe(10);
    expect(idMap.get(2)).toBe(20);
    expect(idMap.get(3)).toBe(20);
  });
});

describe('remapSession', () => {
  test('履歴の選手IDと当日番号を付け替える', () => {
    const session: PracticeSession = {
      startedAt: '2026-01-01T00:00:00Z',
      endedAt: '2026-01-01T01:00:00Z',
      courts: 1,
      playerIds: [1, 2, 3, 4, 5],
      participants: [
        { memberId: 1, playerNumber: 4 },
        { memberId: 5, playerNumber: 1 },
      ],
      rounds: [round()],
    };
    const idMap = new Map<number, number>([
      [1, 11],
      [2, 12],
      [3, 13],
      [4, 14],
      [5, 15],
    ]);
    const remapped = remapSession(session, idMap);

    expect(remapped.playerIds).toEqual([11, 12, 13, 14, 15]);
    expect(remapped.participants?.[0]).toEqual({ memberId: 11, playerNumber: 4 });
    expect(remapped.rounds[0]?.courts[0]?.pairA).toEqual([11, 12]);
    expect(remapped.rounds[0]?.rests).toEqual([15]);
    expect(remapped.id).toBeUndefined();
    expect(sessionIdentity(remapped)).toContain('11,12,13,14,15');
  });
});
