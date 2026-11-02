import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { db } from '@/lib/db';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import { collectBackup, validateBackup } from '@/lib/backup';

beforeEach(async () => {
  await db.delete();
  await db.open();
  usePracticeStore.setState({
    settings: null,
    players: [],
    rounds: [],
    sessions: [],
    isLoading: false,
    isInitialLoad: false,
    error: null,
  });
  await usePracticeStore.getState().startPractice(1, [1, 2, 3, 4, 5]);
});

afterEach(() => vi.restoreAllMocks());

describe('練習会ごとのレベル設定', () => {
  test('複数人のレベルだけを変更し、組み合わせ・出場状態・番号を保つ', async () => {
    await usePracticeStore.getState().generateNextRound();
    await usePracticeStore.getState().setPlayerAvailability(2, 'rest');
    const before = usePracticeStore.getState();
    const saved = await before.setPlayerLevels([1, 2], 'C');

    expect(saved).toBe(true);
    const after = usePracticeStore.getState();
    expect(after.rounds).toEqual(before.rounds);
    expect(after.players).toEqual(before.players.map((player) =>
      [1, 2].includes(player.memberId) ? { ...player, level: 'C' } : player
    ));
    expect((await db.practicePlayers.get(2))?.status).toBe('rest');
    expect((await db.practicePlayers.get(2))?.level).toBe('C');

    await after.load();
    expect(usePracticeStore.getState().players.find((player) => player.memberId === 1)?.level).toBe('C');
  });

  test('未設定に戻しても他の人のレベルは変わらない', async () => {
    await usePracticeStore.getState().setPlayerLevels([1, 2], 'A');
    await usePracticeStore.getState().setPlayerLevels([1], null);
    expect(await db.practicePlayers.get(1)).not.toHaveProperty('level');
    expect((await db.practicePlayers.get(2))?.level).toBe('A');
    expect(usePracticeStore.getState().players.find((player) => player.memberId === 1)).not.toHaveProperty('level');
  });

  test('手動で入れ替えてもレベルは選手に付いたまま維持する', async () => {
    await usePracticeStore.getState().setPlayerLevels([1], 'C');
    await usePracticeStore.getState().setPlayerLevels([2], 'A');
    await usePracticeStore.getState().generateNextRound();
    const before = usePracticeStore.getState();
    await before.substitutePlayer(1, 2);
    const after = usePracticeStore.getState();
    expect(after.players).toEqual(before.players);
    expect(after.rounds[0]?.courts).toEqual(before.rounds[0]?.courts.map((court) => ({
      ...court,
      pairA: court.pairA.map((id) => id === 1 ? 2 : id === 2 ? 1 : id),
      pairB: court.pairB.map((id) => id === 1 ? 2 : id === 2 ? 1 : id),
    })));
    expect((await db.practicePlayers.get(1))?.level).toBe('C');
    expect((await db.practicePlayers.get(2))?.level).toBe('A');
  });

  test('終了した練習のレベルを履歴に残し、次回と途中参加者は未設定にする', async () => {
    await usePracticeStore.getState().setPlayerLevels([1], 'A');
    await usePracticeStore.getState().generateNextRound();
    await usePracticeStore.getState().resetPractice();
    const session = (await db.practiceSessions.toArray())[0];
    expect(session?.participants?.find((player) => player.memberId === 1)?.level).toBe('A');

    await usePracticeStore.getState().startPractice(1, [1, 2, 3, 4]);
    await usePracticeStore.getState().addParticipant(5);
    expect(usePracticeStore.getState().players.every((player) => player.level === undefined)).toBe(true);
  });

  test('バックアップを書き出して読み直しても進行中と履歴のレベルを保つ', async () => {
    await usePracticeStore.getState().setPlayerLevels([1], 'A');
    await usePracticeStore.getState().generateNextRound();
    await usePracticeStore.getState().resetPractice();
    await usePracticeStore.getState().startPractice(1, [1, 2, 3, 4]);
    await usePracticeStore.getState().setPlayerLevels([2], 'C');
    const result = validateBackup(JSON.parse(JSON.stringify(await collectBackup())));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.practicePlayers.find((player) => player.memberId === 2)?.level).toBe('C');
    expect(result.data.practiceSessions[0]?.participants?.find((player) => player.memberId === 1)?.level).toBe('A');
  });

  test('保存失敗時には一括変更を取り消し、選手のデータを保つ', async () => {
    vi.spyOn(db.practiceSettings, 'update').mockRejectedValueOnce(new Error('保存失敗'));
    expect(await usePracticeStore.getState().setPlayerLevels([1, 2], 'B')).toBe(false);
    expect(usePracticeStore.getState().players.every((player) => !player.level)).toBe(true);
    expect((await db.practicePlayers.toArray()).every((player) => !player.level)).toBe(true);
    expect(usePracticeStore.getState().error).toBe('保存失敗');
  });
});
