import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, test } from 'vitest';
import { db } from '@/lib/db';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import { shouldBlockPracticeScreen } from '@/lib/practiceScreen';

beforeEach(async () => {
  await db.delete();
  await Dexie.delete('pairkuji-safety');
  await db.open();
  usePracticeStore.setState({
    settings: null,
    players: [],
    rounds: [],
    sessions: [],
    error: null,
    isLoading: false,
    isGenerating: false,
    isResetting: false,
    isInitialLoad: true,
  });
});

describe('generateNextRound の読み込み表示', () => {
  test('生成中は isLoading を立てず、終わると isGenerating を戻す', async () => {
    await usePracticeStore.getState().startPractice(1, [1, 2, 3, 4]);
    let sawLoading = false;
    let sawGenerating = false;
    const unsubscribe = usePracticeStore.subscribe((state) => {
      if (state.isLoading) sawLoading = true;
      if (state.isGenerating) sawGenerating = true;
    });

    await usePracticeStore.getState().generateNextRound();
    unsubscribe();

    const state = usePracticeStore.getState();
    expect(sawLoading).toBe(false);
    expect(sawGenerating).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.isGenerating).toBe(false);
    expect(state.rounds).toHaveLength(1);
  });

  test('人数不足でも全画面読み込み用の isLoading は立てない', async () => {
    await usePracticeStore.getState().startPractice(1, [1, 2, 3, 4]);
    await usePracticeStore.getState().setPlayerAvailability(4, 'early');
    await usePracticeStore.getState().generateNextRound();
    const state = usePracticeStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.isGenerating).toBe(false);
    expect(state.rounds).toHaveLength(0);
    expect(state.error).toMatch(/4人必要/);
  });
});

describe('resetPractice', () => {
  test('終了を同時に2回呼んでも履歴は1件', async () => {
    await usePracticeStore.getState().startPractice(1, [1, 2, 3, 4]);
    await usePracticeStore.getState().generateNextRound();

    await Promise.all([
      usePracticeStore.getState().resetPractice(),
      usePracticeStore.getState().resetPractice(),
    ]);

    const sessions = await db.practiceSessions.toArray();
    expect(sessions).toHaveLength(1);
    expect(usePracticeStore.getState().settings).toBeNull();
    expect(usePracticeStore.getState().isResetting).toBe(false);
  });
});

describe('shouldBlockPracticeScreen', () => {
  test('初回読み込みの前だけ画面を止める', () => {
    expect(shouldBlockPracticeScreen(false, false)).toBe(true);
    expect(shouldBlockPracticeScreen(true, false)).toBe(true);
    expect(shouldBlockPracticeScreen(true, true)).toBe(false);
  });
});
