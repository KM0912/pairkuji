import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, test } from 'vitest';
import { db } from '@/lib/db';
import { applyBackup, collectBackup, type PairkujiBackup } from '@/lib/backup';
import { loadSafetySnapshot } from '@/lib/safetyBackup';
import { useMemberStore } from '@/lib/stores/memberStore';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import type { Member } from '@/types/member';
import type { Round } from '@/types/round';

function member(id: number, name: string): Member {
  return {
    id,
    name,
    isActive: true,
    isDeleted: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function backup(overrides: Partial<PairkujiBackup> = {}): PairkujiBackup {
  return {
    app: 'pairkuji',
    version: 1,
    exportedAt: '2026-04-01T00:00:00.000Z',
    members: [member(1, '山田')],
    practiceSettings: null,
    practicePlayers: [],
    rounds: [],
    practiceSessions: [],
    ...overrides,
  };
}

beforeEach(async () => {
  await db.delete();
  await Dexie.delete('pairkuji-safety');
  await db.open();
  await db.members.clear();
  await db.practiceSettings.clear();
  await db.practicePlayers.clear();
  await db.rounds.clear();
  await db.practiceSessions.clear();
  useMemberStore.setState({
    members: [],
    allMembers: [],
    error: null,
    isLoading: false,
  });
  usePracticeStore.setState({
    settings: null,
    players: [],
    rounds: [],
    sessions: [],
    error: null,
    isLoading: false,
  });
});

describe('applyBackup', () => {
  test('上書きの前に今のデータを退避する', async () => {
    await db.members.add({
      name: '残したい',
      isActive: true,
      isDeleted: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    } as Member);
    await applyBackup(backup({ members: [member(8, '新しい人')] }), 'replace');
    const safety = await loadSafetySnapshot();
    expect(safety?.members.some((item) => item.name === '残したい')).toBe(true);
    const names = (await db.members.toArray()).map((item) => item.name);
    expect(names).toContain('新しい人');
    expect(names).not.toContain('残したい');
  });

  test('統合は選手追加と履歴追加が同じトランザクションで戻る', async () => {
    await expect(
      applyBackup(
        backup({
          members: [member(1, '新規')],
          practiceSessions: [
            {
              startedAt: '2026-01-01T00:00:00.000Z',
              endedAt: '2026-01-01T01:00:00.000Z',
              courts: 1,
              playerIds: [999],
              rounds: [],
            },
          ],
        }),
        'merge'
      )
    ).rejects.toThrow(/名簿にない選手ID/);
    const names = (await db.members.toArray()).map((item) => item.name);
    expect(names).not.toContain('新規');
    expect(await db.practiceSessions.count()).toBe(0);
  });

  test('統合で同名は足さず、新しい履歴だけ増やす', async () => {
    const existingId = await db.members.add({
      name: '山田',
      isActive: true,
      isDeleted: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    } as Member);
    const summary = await applyBackup(
      backup({
        members: [member(1, '山田'), member(2, '佐藤')],
        practiceSessions: [
          {
            startedAt: '2026-02-01T00:00:00.000Z',
            endedAt: '2026-02-01T01:00:00.000Z',
            courts: 1,
            playerIds: [1, 2],
            rounds: [],
          },
        ],
      }),
      'merge'
    );
    expect(summary.addedMembers).toBe(1);
    expect(summary.addedSessions).toBe(1);
    const sessions = await db.practiceSessions.toArray();
    expect(sessions[0]?.playerIds).toContain(Number(existingId));
    expect(sessions[0]?.playerIds).toHaveLength(2);
  });

  test('同じ名前が複数あるファイルは名前では統合せず履歴も増えない', async () => {
    await db.members.bulkPut([member(1, '山田'), member(5, '山田')]);
    const session = {
      startedAt: '2026-02-01T00:00:00.000Z',
      endedAt: '2026-02-01T01:00:00.000Z',
      courts: 1,
      playerIds: [5],
      rounds: [],
    };
    await db.practiceSessions.add(session);
    await expect(
      applyBackup(
        backup({
          members: [member(1, 'Aくん'), member(5, '山田')],
          practiceSessions: [session],
        }),
        'merge'
      )
    ).rejects.toThrow(/同じ名前が複数あるため/);
    expect(await db.practiceSessions.count()).toBe(1);
    expect((await db.practiceSessions.toArray())[0]?.playerIds).toEqual([5]);
  });

  test('IDで統合すると同じ履歴は増えない', async () => {
    await db.members.bulkPut([member(1, '山田'), member(5, '山田')]);
    const session = {
      startedAt: '2026-02-01T00:00:00.000Z',
      endedAt: '2026-02-01T01:00:00.000Z',
      courts: 1,
      playerIds: [5],
      rounds: [],
    };
    await db.practiceSessions.add(session);
    const summary = await applyBackup(
      backup({
        members: [member(1, 'Aくん'), member(5, '山田')],
        practiceSessions: [session],
      }),
      'merge-id'
    );
    expect(summary.addedMembers).toBe(0);
    expect(summary.addedSessions).toBe(0);
    const sessions = await db.practiceSessions.toArray();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.playerIds).toEqual([5]);
    const names = (await db.members.toArray()).map((item) => item.name);
    expect(names.filter((name) => name === '山田')).toHaveLength(2);
    expect(names).not.toContain('Aくん');
  });
});

describe('undoLastRound', () => {
  test('最後のラウンドだけ消し、1つ前の番号に戻す', async () => {
    await usePracticeStore.getState().startPractice(1, [1, 2, 3, 4]);
    const first: Round = {
      roundNo: 1,
      courts: [{ courtNo: 1, pairA: [1, 2], pairB: [3, 4], result: null }],
      rests: [],
    };
    const second: Round = {
      roundNo: 2,
      courts: [{ courtNo: 1, pairA: [1, 3], pairB: [2, 4], result: null }],
      rests: [],
    };
    await db.rounds.bulkPut([first, second]);
    const settings = usePracticeStore.getState().settings;
    if (!settings) throw new Error('練習が始まっていません');
    usePracticeStore.setState({
      rounds: [first, second],
      settings: { ...settings, currentRound: 2 },
    });
    await db.practiceSettings.put({ ...settings, currentRound: 2 });

    const undone = await usePracticeStore.getState().undoLastRound();
    expect(undone).toBe(true);
    expect(await db.rounds.count()).toBe(1);
    expect((await db.rounds.toArray())[0]?.roundNo).toBe(1);
    expect(usePracticeStore.getState().settings?.currentRound).toBe(1);
  });
});

describe('memberStore', () => {
  test('同じ名前は1人ずつでも一括でも追加しない', async () => {
    const first = await useMemberStore.getState().add('山田');
    expect(first).not.toBeNull();
    const second = await useMemberStore.getState().add('山田');
    expect(second).toBeNull();
    expect(useMemberStore.getState().error).toBe('同じ名前の選手がすでにいます');

    const many = await useMemberStore.getState().addMany(['山田', '佐藤', '佐藤']);
    expect(many.added).toBe(1);
    expect(many.skipped).toEqual(['山田', '佐藤']);
    const names = (await db.members.toArray()).map((item) => item.name).sort();
    expect(names).toEqual(['佐藤', '山田']);
  });

  test('名前を変えるとサンプル表示を外す', async () => {
    const id = await useMemberStore.getState().add('Aくん');
    if (id == null) throw new Error('追加できませんでした');
    await db.members.update(id, { isSample: true });
    await useMemberStore.getState().update(id, { isActive: false });
    expect((await db.members.get(id))?.isSample).toBe(true);
    await useMemberStore.getState().update(id, { name: '改名' });
    const renamed = await db.members.get(id);
    expect(renamed?.name).toBe('改名');
    expect(renamed?.isSample).toBe(false);
  });

  test('同じ名前への変更は保存しない', async () => {
    const yamada = await useMemberStore.getState().add('山田');
    const sample = await useMemberStore.getState().add('Aくん');
    expect(yamada).not.toBeNull();
    expect(sample).not.toBeNull();
    const saved = await useMemberStore.getState().update(sample as number, {
      name: '山田',
    });
    expect(saved).toBe(false);
    expect((await db.members.get(sample as number))?.name).toBe('Aくん');
    expect(useMemberStore.getState().error).toBe('同じ名前の選手がすでにいます');
  });
});
