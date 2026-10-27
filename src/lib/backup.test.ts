import { describe, expect, test } from 'vitest';
import type { Member } from '@/types/member';
import type { PracticeSession } from '@/types/practiceSession';
import type { Round } from '@/types/round';
import {
  BACKUP_VERSION,
  DELETED_MEMBER_NAME,
  buildMemberIdMap,
  nameMergeConflicts,
  planMemberMerge,
  planMemberMergeById,
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
    const other = validateBackup({ app: 'other' });
    expect(other.ok).toBe(false);
    if (!other.ok) expect(other.errors).toEqual(['ペアくじのバックアップファイルではありません']);
    const wrongVersion = validateBackup(validBackup({ version: 99 }));
    expect(wrongVersion.ok).toBe(false);
    if (!wrongVersion.ok) {
      expect(wrongVersion.errors).toEqual(['対応していないバックアップのバージョンです']);
    }
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

  test('参照切れの選手は削除済みとして取り込み、IDの重複は拒否する', () => {
    const missing = validateBackup(
      validBackup({
        practicePlayers: [
          {
            memberId: 99,
            playerNumber: 1,
            status: 'active',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ],
      })
    );
    expect(missing.ok).toBe(true);
    if (missing.ok) {
      const removed = missing.data.members.find((item) => item.id === 99);
      expect(removed?.name).toBe(`${DELETED_MEMBER_NAME} #99`);
      expect(removed?.isDeleted).toBe(true);
      expect(removed?.isActive).toBe(false);
    }

    const duplicated = validateBackup(
      validBackup({
        members: [member(1, '山田'), member(1, '佐藤')],
      })
    );
    expect(duplicated.ok).toBe(false);
    if (!duplicated.ok) {
      expect(duplicated.errors).toContain('同じ選手IDが重複しています');
    }
  });

  test('参加者の重複と出場番号の重複は別の文にする', () => {
    const sessionBase = {
      startedAt: '2026-01-01T00:00:00Z',
      endedAt: '2026-01-01T01:00:00Z',
      courts: 1,
      playerIds: [1, 2],
      rounds: [],
    };
    const duplicatedPeople = validateBackup(
      validBackup({
        members: [member(1, '山田'), member(2, '佐藤')],
        practiceSessions: [
          {
            ...sessionBase,
            participants: [
              { memberId: 1, playerNumber: 1 },
              { memberId: 1, playerNumber: 2 },
            ],
          },
        ],
      })
    );
    expect(duplicatedPeople.ok).toBe(false);
    if (!duplicatedPeople.ok) {
      expect(duplicatedPeople.errors).toContain('参加者が重複しています');
      expect(duplicatedPeople.errors).not.toContain('出場番号が重複しています');
    }

    const duplicatedNumbers = validateBackup(
      validBackup({
        members: [member(1, '山田'), member(2, '佐藤')],
        practiceSessions: [
          {
            ...sessionBase,
            participants: [
              { memberId: 1, playerNumber: 1 },
              { memberId: 2, playerNumber: 1 },
            ],
          },
        ],
      })
    );
    expect(duplicatedNumbers.ok).toBe(false);
    if (!duplicatedNumbers.ok) {
      expect(duplicatedNumbers.errors).toContain('出場番号が重複しています');
      expect(duplicatedNumbers.errors).not.toContain('参加者が重複しています');
    }
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

  test('削除済みの選手は同じIDの別人に付けず、同じ名前の削除済みにだけ付ける', () => {
    const differentPerson = planMemberMerge(
      [member(10, '中村')],
      [member(10, '伊藤', true)]
    );
    expect(differentPerson.matches).toEqual([]);
    expect(differentPerson.creates.map((item) => item.name)).toEqual(['伊藤']);

    const sameDeleted = planMemberMerge(
      [member(20, '伊藤', true)],
      [member(10, '伊藤', true)]
    );
    expect(sameDeleted.matches).toEqual([{ incomingId: 10, existingId: 20 }]);
    expect(sameDeleted.creates).toEqual([]);
  });

  test('同じ名前が複数あるときは名前での統合を止める材料にする', () => {
    expect(
      nameMergeConflicts(
        [member(1, '山田'), member(5, '山田')],
        [member(1, 'Aくん'), member(5, '山田')]
      )
    ).toEqual(['山田']);
    expect(
      nameMergeConflicts([member(1, '山田')], [member(2, '佐藤')])
    ).toEqual([]);
  });
});

describe('planMemberMergeById', () => {
  test('同じ名前と同じ削除状態の人を使い、IDが同じだけの別人には付けない', () => {
    const plan = planMemberMergeById(
      [member(1, '山田'), member(8, '佐藤'), member(10, '中村')],
      [member(3, '山田'), member(4, '佐藤'), member(10, '伊藤', true), member(9, '小林')]
    );
    expect(plan.matches).toEqual([
      { incomingId: 3, existingId: 1 },
      { incomingId: 4, existingId: 8 },
    ]);
    expect(plan.creates.map((item) => item.id)).toEqual([10, 9]);
    expect(plan.aliases).toEqual([]);
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
