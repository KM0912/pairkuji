import { describe, test, expect } from 'vitest';
import type { Round } from '@/types/round';
import type { PracticeSession } from '@/types/practiceSession';
import {
  calculateOverallStats,
  calculateSessionWinRates,
  calculatePairWinRates,
  calculateHeadToHead,
  filterSessions,
  filterSessionsByTag,
  getUniqueTags,
} from './statsCalculator';

function makeRound(
  roundNo: number,
  courts: Array<{
    pairA: [number, number];
    pairB: [number, number];
    result: 'pairA' | 'pairB' | null;
  }>
): Round {
  return {
    roundNo,
    courts: courts.map((c, i) => ({
      courtNo: i + 1,
      pairA: c.pairA,
      pairB: c.pairB,
      result: c.result,
    })),
    rests: [],
  };
}

function makeSession(
  rounds: Round[],
  playerIds: number[],
  startedAt: string = '2026-01-01T00:00:00Z'
): PracticeSession {
  return {
    startedAt,
    endedAt: '2026-01-01T02:00:00Z',
    courts: 1,
    playerIds,
    rounds,
  };
}

describe('calculateOverallStats', () => {
  test('過去セッション + 現在のラウンドを合算した通算勝率を計算', () => {
    const pastRounds = [
      makeRound(1, [
        { pairA: [1, 2], pairB: [3, 4], result: 'pairA' },
      ]),
    ];
    const session = makeSession(pastRounds, [1, 2, 3, 4]);

    const currentRounds = [
      makeRound(1, [
        { pairA: [1, 2], pairB: [3, 4], result: 'pairB' },
      ]),
    ];

    const stats = calculateOverallStats([session], currentRounds);

    // プレイヤー1: 1勝1敗 = 50%
    const p1 = stats.find((s) => s.playerId === 1)!;
    expect(p1.wins).toBe(1);
    expect(p1.losses).toBe(1);
    expect(p1.winRate).toBe(0.5);
    expect(p1.sessionCount).toBe(2);
    expect(p1.totalMatches).toBe(2);

    // プレイヤー3: 1敗1勝 = 50%
    const p3 = stats.find((s) => s.playerId === 3)!;
    expect(p3.wins).toBe(1);
    expect(p3.losses).toBe(1);
    expect(p3.winRate).toBe(0.5);
  });

  test('データがない場合は空配列を返す', () => {
    const stats = calculateOverallStats([], []);
    expect(stats).toEqual([]);
  });

  test('未記録の試合はwinRateに影響しない', () => {
    const rounds = [
      makeRound(1, [
        { pairA: [1, 2], pairB: [3, 4], result: null },
      ]),
    ];
    const session = makeSession(rounds, [1, 2, 3, 4]);
    const stats = calculateOverallStats([session], []);

    const p1 = stats.find((s) => s.playerId === 1)!;
    expect(p1.unrecorded).toBe(1);
    expect(p1.winRate).toBeNull();
    expect(p1.totalMatches).toBe(0);
  });

  test('勝率降順でソートされる', () => {
    const rounds = [
      makeRound(1, [
        { pairA: [1, 2], pairB: [3, 4], result: 'pairA' },
      ]),
      makeRound(2, [
        { pairA: [1, 2], pairB: [3, 4], result: 'pairA' },
      ]),
    ];
    const session = makeSession(rounds, [1, 2, 3, 4]);
    const stats = calculateOverallStats([session], []);

    // プレイヤー1,2が勝率100%で先に来る
    expect(stats[0]!.winRate).toBe(1);
    expect(stats[1]!.winRate).toBe(1);
    expect(stats[2]!.winRate).toBe(0);
    expect(stats[3]!.winRate).toBe(0);
  });
});

describe('calculateSessionWinRates', () => {
  test('セッション別の勝率を計算', () => {
    const session1Rounds = [
      makeRound(1, [
        { pairA: [1, 2], pairB: [3, 4], result: 'pairA' },
      ]),
    ];
    const session2Rounds = [
      makeRound(1, [
        { pairA: [1, 2], pairB: [3, 4], result: 'pairB' },
      ]),
    ];

    const sessions = [
      makeSession(session1Rounds, [1, 2, 3, 4], '2026-01-01T00:00:00Z'),
      makeSession(session2Rounds, [1, 2, 3, 4], '2026-01-02T00:00:00Z'),
    ];

    const results = calculateSessionWinRates(sessions, []);
    expect(results).toHaveLength(2);

    // セッション1: プレイヤー1は勝率100%
    expect(results[0]!.playerRates.get(1)).toBe(1);
    // セッション2: プレイヤー1は勝率0%
    expect(results[1]!.playerRates.get(1)).toBe(0);
  });

  test('現在のセッションも含まれる', () => {
    const currentRounds = [
      makeRound(1, [
        { pairA: [1, 2], pairB: [3, 4], result: 'pairA' },
      ]),
    ];

    const results = calculateSessionWinRates([], currentRounds);
    expect(results).toHaveLength(1);
    expect(results[0]!.playerRates.get(1)).toBe(1);
  });

  test('データがない場合は空配列', () => {
    const results = calculateSessionWinRates([], []);
    expect(results).toHaveLength(0);
  });
});

describe('calculatePairWinRates', () => {
  test('ペア別の勝率を計算', () => {
    const rounds = [
      makeRound(1, [
        { pairA: [1, 2], pairB: [3, 4], result: 'pairA' },
      ]),
      makeRound(2, [
        { pairA: [1, 2], pairB: [3, 4], result: 'pairA' },
      ]),
      makeRound(3, [
        { pairA: [1, 2], pairB: [3, 4], result: 'pairB' },
      ]),
    ];
    const session = makeSession(rounds, [1, 2, 3, 4]);

    const results = calculatePairWinRates([session], [], 1);

    const pair12 = results.find(
      (r) => r.player1 === 1 && r.player2 === 2
    )!;
    expect(pair12.wins).toBe(2);
    expect(pair12.losses).toBe(1);
    expect(pair12.totalMatches).toBe(3);
    expect(pair12.winRate).toBeCloseTo(2 / 3);
  });

  test('最低試合数フィルタが適用される', () => {
    const rounds = [
      makeRound(1, [
        { pairA: [1, 2], pairB: [3, 4], result: 'pairA' },
      ]),
    ];
    const session = makeSession(rounds, [1, 2, 3, 4]);

    // minMatches=3では1試合しかないペアは除外
    const results = calculatePairWinRates([session], [], 3);
    expect(results).toHaveLength(0);

    // minMatches=1なら含まれる
    const results2 = calculatePairWinRates([session], [], 1);
    expect(results2.length).toBeGreaterThan(0);
  });

  test('未記録の試合はスキップされる', () => {
    const rounds = [
      makeRound(1, [
        { pairA: [1, 2], pairB: [3, 4], result: null },
      ]),
    ];
    const session = makeSession(rounds, [1, 2, 3, 4]);

    const results = calculatePairWinRates([session], [], 0);
    expect(results).toHaveLength(0);
  });
});

describe('calculateHeadToHead', () => {
  test('特定プレイヤーの直接対決成績を計算', () => {
    const rounds = [
      makeRound(1, [
        { pairA: [1, 2], pairB: [3, 4], result: 'pairA' },
      ]),
      makeRound(2, [
        { pairA: [1, 3], pairB: [2, 4], result: 'pairB' },
      ]),
    ];
    const session = makeSession(rounds, [1, 2, 3, 4]);

    const results = calculateHeadToHead([session], [], 1);

    // プレイヤー1 vs プレイヤー3: ラウンド1で勝ち = 1W0L
    const vs3 = results.find((r) => r.opponentId === 3)!;
    expect(vs3.wins).toBe(1);
    expect(vs3.losses).toBe(0);

    // プレイヤー1 vs プレイヤー4: ラウンド1で勝ち、ラウンド2で負け = 1W1L
    const vs4 = results.find((r) => r.opponentId === 4)!;
    expect(vs4.wins).toBe(1);
    expect(vs4.losses).toBe(1);

    // プレイヤー1 vs プレイヤー2: ラウンド2で負け（対戦相手として） = 0W1L
    const vs2 = results.find((r) => r.opponentId === 2)!;
    expect(vs2.wins).toBe(0);
    expect(vs2.losses).toBe(1);
  });

  test('該当プレイヤーが参加していない試合は無視される', () => {
    const rounds = [
      makeRound(1, [
        { pairA: [3, 4], pairB: [5, 6], result: 'pairA' },
      ]),
    ];
    const session = makeSession(rounds, [3, 4, 5, 6]);

    const results = calculateHeadToHead([session], [], 1);
    expect(results).toHaveLength(0);
  });

  test('勝率降順でソートされる', () => {
    const rounds = [
      makeRound(1, [
        { pairA: [1, 2], pairB: [3, 4], result: 'pairA' },
      ]),
      makeRound(2, [
        { pairA: [1, 5], pairB: [6, 7], result: 'pairB' },
      ]),
    ];
    const session = makeSession(rounds, [1, 2, 3, 4, 5, 6, 7]);

    const results = calculateHeadToHead([session], [], 1);

    // 勝率100%の対戦相手が先に来る
    expect(results[0]!.winRate).toBe(1);
  });
});

describe('filterSessions', () => {
  const sessions = [
    makeSession([], [1, 2], '2026-01-10T00:00:00Z'),
    makeSession([], [1, 2], '2026-02-15T00:00:00Z'),
    makeSession([], [1, 2], '2026-03-01T00:00:00Z'),
    makeSession([], [1, 2], '2026-03-05T00:00:00Z'),
    makeSession([], [1, 2], '2026-03-10T00:00:00Z'),
  ];

  test('all: 全セッションを返す', () => {
    expect(filterSessions(sessions, 'all')).toHaveLength(5);
  });

  test('current: 空配列を返す', () => {
    expect(filterSessions(sessions, 'current')).toHaveLength(0);
  });

  test('last3: 直近3セッションを返す', () => {
    const result = filterSessions(sessions, 'last3');
    expect(result).toHaveLength(3);
    // 最新の3セッションが含まれる（startedAt降順で上位3つ）
    expect(result.map((s) => s.startedAt)).toContain('2026-03-10T00:00:00Z');
    expect(result.map((s) => s.startedAt)).toContain('2026-03-05T00:00:00Z');
    expect(result.map((s) => s.startedAt)).toContain('2026-03-01T00:00:00Z');
  });

  test('last3: 3セッション未満の場合は全て返す', () => {
    const few = sessions.slice(0, 2);
    const result = filterSessions(few, 'last3');
    expect(result).toHaveLength(2);
  });

  test('thisMonth: 今月のセッションのみ返す', () => {
    // テスト時の月に依存するため、動的にテストデータを生成
    const now = new Date();
    const thisMonthSession = makeSession(
      [],
      [1, 2],
      new Date(now.getFullYear(), now.getMonth(), 5).toISOString()
    );
    const lastMonthSession = makeSession(
      [],
      [1, 2],
      new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString()
    );

    const result = filterSessions(
      [thisMonthSession, lastMonthSession],
      'thisMonth'
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(thisMonthSession);
  });
});

describe('filterSessionsByTag', () => {
  const sessions: PracticeSession[] = [
    makeSession([], [1, 2, 3, 4], '2026-01-01T00:00:00Z'),
    {
      ...makeSession([], [1, 2, 3, 4], '2026-01-02T00:00:00Z'),
      clubTags: ['クラブA'],
    },
    {
      ...makeSession([], [5, 6, 7, 8], '2026-01-03T00:00:00Z'),
      clubTags: ['クラブB'],
    },
    {
      ...makeSession([], [1, 2, 5, 6], '2026-01-04T00:00:00Z'),
      clubTags: ['クラブA', 'クラブB'],
    },
  ];

  test('空配列の場合、全セッションを返す', () => {
    const result = filterSessionsByTag(sessions, []);
    expect(result).toHaveLength(4);
  });

  test('単一タグを指定した場合、該当セッションのみ返す', () => {
    const result = filterSessionsByTag(sessions, ['クラブA']);
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.clubTags?.includes('クラブA'))).toBe(true);
  });

  test('複数タグを指定した場合、いずれかのタグを持つセッションを返す（OR条件）', () => {
    const result = filterSessionsByTag(sessions, ['クラブA', 'クラブB']);
    expect(result).toHaveLength(3);
    expect(result.every((s) =>
      s.clubTags?.some((t) => ['クラブA', 'クラブB'].includes(t))
    )).toBe(true);
  });

  test('複数タグを持つセッションはどちらのタグでもヒットする', () => {
    const result = filterSessionsByTag(sessions, ['クラブB']);
    expect(result).toHaveLength(2);
  });

  test('該当するセッションがない場合、空配列を返す', () => {
    const result = filterSessionsByTag(sessions, ['存在しないクラブ']);
    expect(result).toHaveLength(0);
  });

  test('clubTags なしのセッションはフィルタで除外される', () => {
    const result = filterSessionsByTag(sessions, ['クラブA']);
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.clubTags?.includes('クラブA'))).toBe(true);
  });

  test('空セッション配列に対しても正常動作', () => {
    expect(filterSessionsByTag([], [])).toHaveLength(0);
    expect(filterSessionsByTag([], ['クラブA'])).toHaveLength(0);
  });
});

describe('getUniqueTags', () => {
  test('セッションからユニークなタグを取得する', () => {
    const sessions: PracticeSession[] = [
      { ...makeSession([], [1, 2], '2026-01-01T00:00:00Z'), clubTags: ['クラブB'] },
      { ...makeSession([], [1, 2], '2026-01-02T00:00:00Z'), clubTags: ['クラブA', 'クラブB'] },
      { ...makeSession([], [1, 2], '2026-01-03T00:00:00Z'), clubTags: ['クラブB'] },
      makeSession([], [1, 2], '2026-01-04T00:00:00Z'),
    ];
    const tags = getUniqueTags(sessions);
    expect(tags).toEqual(['クラブA', 'クラブB']);
  });

  test('タグがないセッションのみの場合は空配列', () => {
    const sessions: PracticeSession[] = [
      makeSession([], [1, 2], '2026-01-01T00:00:00Z'),
    ];
    expect(getUniqueTags(sessions)).toEqual([]);
  });

  test('空配列に対しても正常動作', () => {
    expect(getUniqueTags([])).toEqual([]);
  });
});
