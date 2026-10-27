import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, test } from 'vitest';
import { db } from '@/lib/db';
import {
  applyBackup,
  collectBackup,
  countRosterMembers,
  validateBackup,
  type PairkujiBackup,
} from '@/lib/backup';
import { loadSafetySnapshot } from '@/lib/safetyBackup';
import { useMemberStore } from '@/lib/stores/memberStore';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import type { Member } from '@/types/member';
import type { Round } from '@/types/round';

function member(id: number, name: string, isDeleted = false): Member {
  return {
    id,
    name,
    isActive: !isDeleted,
    isDeleted,
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
  test('上書き完了の人数はプレビューと同じく削除済みを数えない', async () => {
    const validated = validateBackup({
      app: 'pairkuji',
      version: 1,
      exportedAt: '2026-04-01T00:00:00.000Z',
      members: [
        member(1, '山田'),
        member(2, '佐藤'),
        member(3, '鈴木'),
        member(4, '高橋'),
      ],
      practiceSettings: null,
      practicePlayers: [],
      rounds: [
        {
          roundNo: 1,
          courts: [{ courtNo: 1, pairA: [1, 2], pairB: [3, 4], result: null }],
          rests: [5],
        },
      ],
      practiceSessions: [],
    });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const previewCount = countRosterMembers(validated.data.members);
    expect(previewCount).toBe(4);
    expect(validated.data.members).toHaveLength(5);

    const summary = await applyBackup(validated.data, 'replace');
    expect(summary.addedMembers).toBe(previewCount);
    const stored = await db.members.toArray();
    expect(stored).toHaveLength(5);
    expect(stored.some((item) => item.isDeleted && item.name === '削除済みの選手 #5')).toBe(
      true
    );
  });

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
    ).rejects.toThrow(/この端末に同じ名前が2人以上います/);
    expect(await db.practiceSessions.count()).toBe(1);
    expect((await db.practiceSessions.toArray())[0]?.playerIds).toEqual([5]);
  });

  test('ファイル側の同名は、この端末で改名しても直らないと案内する', async () => {
    await db.members.add({
      name: '佐藤',
      isActive: true,
      isDeleted: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    } as Member);
    await expect(
      applyBackup(
        backup({
          members: [member(1, '山田'), member(2, '山田')],
        }),
        'merge'
      )
    ).rejects.toThrow(/読み込むファイル（書き出した端末）に同じ名前が2人います/);
    expect(await db.practiceSessions.count()).toBe(0);
  });

  test('削除済みの選手の履歴は同じIDの別人に付かない', async () => {
    await db.members.put(member(10, '中村'));
    const session = {
      startedAt: '2026-03-01T00:00:00.000Z',
      endedAt: '2026-03-01T01:00:00.000Z',
      courts: 1,
      playerIds: [10, 11, 12, 13],
      rounds: [
        {
          roundNo: 1,
          courts: [
            {
              courtNo: 1,
              pairA: [10, 11] as [number, number],
              pairB: [12, 13] as [number, number],
              result: 'pairA' as const,
            },
          ],
          rests: [],
        },
      ],
    };
    const file = backup({
      members: [
        member(10, '伊藤', true),
        member(11, '佐藤'),
        member(12, '鈴木'),
        member(13, '高橋'),
      ],
      practiceSessions: [session],
    });
    await applyBackup(file, 'merge');
    expect((await db.members.get(10))?.name).toBe('中村');
    const ito = (await db.members.toArray()).find((item) => item.name === '伊藤');
    expect(ito?.isDeleted).toBe(true);
    expect(ito?.id).not.toBe(10);
    const sessions = await db.practiceSessions.toArray();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.playerIds).toContain(ito?.id);
    expect(sessions[0]?.playerIds).not.toContain(10);

    const again = await applyBackup(file, 'merge');
    expect(again.addedMembers).toBe(0);
    expect(again.addedSessions).toBe(0);
    expect(
      (await db.members.toArray()).filter((item) => item.name === '伊藤')
    ).toHaveLength(1);
  });

  test('同じファイルを2回取り込んでも件数は増えない', async () => {
    const file = backup({
      members: [member(3, '小林')],
      practiceSessions: [
        {
          startedAt: '2026-03-01T00:00:00.000Z',
          endedAt: '2026-03-01T01:00:00.000Z',
          courts: 1,
          playerIds: [3],
          rounds: [],
        },
      ],
    });
    const first = await applyBackup(file, 'merge');
    const second = await applyBackup(file, 'merge');
    expect(first.addedMembers).toBe(1);
    expect(first.addedSessions).toBe(1);
    expect(second.addedMembers).toBe(0);
    expect(second.addedSessions).toBe(0);
    expect(
      (await db.members.toArray()).filter((item) => item.name === '小林')
    ).toHaveLength(1);
    expect(await db.practiceSessions.count()).toBe(1);
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

  test('休憩にして生成したラウンドを取り消すと休憩指定が戻る', async () => {
    await usePracticeStore.getState().startPractice(1, [1, 2, 3, 4, 5]);
    await usePracticeStore.getState().setPlayerAvailability(5, 'break');
    await usePracticeStore.getState().generateNextRound();
    expect(
      usePracticeStore.getState().players.find((player) => player.memberId === 5)?.status
    ).toBe('active');

    const undone = await usePracticeStore.getState().undoLastRound();
    expect(undone).toBe(true);
    const restored = usePracticeStore.getState().players.find(
      (player) => player.memberId === 5
    );
    expect(restored?.status).toBe('rest');
    expect(restored?.restKind).toBe('break');
    expect((await db.practicePlayers.get(5))?.restKind).toBe('break');
  });

  test('生成後に早退へ変えた人は、元に戻しても早退のまま', async () => {
    await usePracticeStore.getState().startPractice(1, [1, 2, 3, 4, 5]);
    await usePracticeStore.getState().setPlayerAvailability(5, 'break');
    await usePracticeStore.getState().generateNextRound();
    await usePracticeStore.getState().setPlayerAvailability(5, 'early');

    const undone = await usePracticeStore.getState().undoLastRound();
    expect(undone).toBe(true);
    const kept = usePracticeStore.getState().players.find(
      (player) => player.memberId === 5
    );
    expect(kept?.status).toBe('rest');
    expect(kept?.restKind).toBe('early');
    expect((await db.practicePlayers.get(5))?.restKind).toBe('early');
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
