import { describe, test, expect } from 'vitest';
import type { Round } from '@/types/round';
import type { PracticeSession } from '@/types/practiceSession';
import {
  calculateOverallStats,
  calculateSessionWinRates,
  calculatePairWinRates,
  calculateHeadToHead,
  calculateParticipationBalance,
  filterSessions,
  filterSessionsByTag,
  getUniqueTags,
  MIN_RANKED_MATCHES,
  pickMatchupHighlights,
  sessionsAlongsideCurrent,
  shouldIncludeCurrentPractice,
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

    // 選手1: 1勝1敗 = 50%
    const p1 = stats.find((s) => s.playerId === 1)!;
    expect(p1.wins).toBe(1);
    expect(p1.losses).toBe(1);
    expect(p1.winRate).toBe(0.5);
    expect(p1.sessionCount).toBe(2);
    expect(p1.totalMatches).toBe(2);

    // 選手3: 1敗1勝 = 50%
    const p3 = stats.find((s) => s.playerId === 3)!;
    expect(p3.wins).toBe(1);
    expect(p3.losses).toBe(1);
    expect(p3.winRate).toBe(0.5);
  });

  test('データがない場合は空配列を返す', () => {
    const stats = calculateOverallStats([], []);
    expect(stats).toEqual([]);
  });

  test('結果未入力の試合は勝率に影響しない', () => {
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

    // 選手1,2が勝率100%で先に来る
    expect(stats[0]!.winRate).toBe(1);
    expect(stats[1]!.winRate).toBe(1);
    expect(stats[2]!.winRate).toBe(0);
    expect(stats[3]!.winRate).toBe(0);
  });

  test('1勝0敗より試合数の多い9勝1敗が前に来る', () => {
    const rounds = [
      makeRound(1, [{ pairA: [1, 2], pairB: [3, 4], result: 'pairA' }]),
      ...Array.from({ length: 9 }, (_, index) =>
        makeRound(index + 2, [
          { pairA: [5, 6], pairB: [7, 8], result: 'pairA' },
        ])
      ),
      makeRound(11, [{ pairA: [5, 6], pairB: [7, 8], result: 'pairB' }]),
    ];
    const stats = calculateOverallStats([makeSession(rounds, [])], []);
    const id = (playerId: number) =>
      stats.find((stat) => stat.playerId === playerId)!;
    expect(id(5).totalMatches).toBeGreaterThanOrEqual(MIN_RANKED_MATCHES);
    expect(id(1).totalMatches).toBeLessThan(MIN_RANKED_MATCHES);
    expect(id(1).winRate).toBe(1);
    expect(stats.indexOf(id(5))).toBeLessThan(stats.indexOf(id(1)));
  });

  test('同じ勝率なら試合数が多い人が前', () => {
    const rounds = [
      makeRound(1, [{ pairA: [9, 10], pairB: [1, 2], result: 'pairA' }]),
      makeRound(2, [{ pairA: [9, 10], pairB: [1, 2], result: 'pairA' }]),
      makeRound(3, [{ pairA: [9, 10], pairB: [1, 2], result: 'pairB' }]),
      makeRound(4, [{ pairA: [11, 12], pairB: [3, 4], result: 'pairA' }]),
      makeRound(5, [{ pairA: [11, 12], pairB: [3, 4], result: 'pairA' }]),
      makeRound(6, [{ pairA: [11, 12], pairB: [3, 4], result: 'pairA' }]),
      makeRound(7, [{ pairA: [11, 12], pairB: [3, 4], result: 'pairA' }]),
      makeRound(8, [{ pairA: [11, 12], pairB: [3, 4], result: 'pairB' }]),
      makeRound(9, [{ pairA: [11, 12], pairB: [3, 4], result: 'pairB' }]),
    ];
    const stats = calculateOverallStats([makeSession(rounds, [])], []);
    const id = (playerId: number) =>
      stats.find((stat) => stat.playerId === playerId)!;
    expect(id(9).winRate).toBeCloseTo(2 / 3);
    expect(id(11).winRate).toBeCloseTo(2 / 3);
    expect(id(11).totalMatches).toBeGreaterThan(id(9).totalMatches);
    expect(stats.indexOf(id(11))).toBeLessThan(stats.indexOf(id(9)));
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

    // セッション1: 選手1は勝率100%
    expect(results[0]!.playerRates.get(1)).toBe(1);
    // セッション2: 選手1は勝率0%
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

  test('結果未入力の試合はスキップされる', () => {
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
  test('特定の選手の直接対決成績を計算', () => {
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

    // 選手1 vs 選手3: ラウンド1で勝ち = 1勝0敗
    const vs3 = results.find((r) => r.opponentId === 3)!;
    expect(vs3.wins).toBe(1);
    expect(vs3.losses).toBe(0);

    // 選手1 vs 選手4: ラウンド1で勝ち、ラウンド2で負け = 1勝1敗
    const vs4 = results.find((r) => r.opponentId === 4)!;
    expect(vs4.wins).toBe(1);
    expect(vs4.losses).toBe(1);

    // 選手1 vs 選手2: ラウンド2で負け（対戦相手として） = 0勝1敗
    const vs2 = results.find((r) => r.opponentId === 2)!;
    expect(vs2.wins).toBe(0);
    expect(vs2.losses).toBe(1);
  });

  test('該当の選手が参加していない試合は無視される', () => {
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

describe('calculateParticipationBalance', () => {
  test('出場と待機の最大差を出す', () => {
    const rounds: Round[] = [
      {
        roundNo: 1,
        courts: [
          { courtNo: 1, pairA: [1, 2], pairB: [3, 4], result: null },
        ],
        rests: [5],
      },
      {
        roundNo: 2,
        courts: [
          { courtNo: 1, pairA: [1, 5], pairB: [2, 3], result: null },
        ],
        rests: [4],
      },
    ];
    const balance = calculateParticipationBalance(
      [makeSession(rounds, [1, 2, 3, 4, 5])],
      []
    );

    const played = Object.fromEntries(
      balance.records.map((record) => [record.playerId, record.played])
    );
    expect(played[1]).toBe(2);
    expect(played[4]).toBe(1);
    expect(balance.records.find((record) => record.playerId === 5)?.rested).toBe(1);
    expect(balance.records.find((record) => record.playerId === 1)?.playRate).toBe(1);
    expect(balance.records.find((record) => record.playerId === 4)?.playRate).toBe(0.5);
    expect(balance.rateSpreadPoints).toBe(50);
  });

  test('来た回数が少なくても、入ったラウンドで出ていれば出場率は下がらない', () => {
    const many: Round[] = Array.from({ length: 10 }, (_, index) => ({
      roundNo: index + 1,
      courts: [{ courtNo: 1, pairA: [1, 2], pairB: [3, 4], result: null }],
      rests: [] as number[],
    }));
    const once: Round = {
      roundNo: 1,
      courts: [{ courtNo: 1, pairA: [5, 6], pairB: [7, 8], result: null }],
      rests: [],
    };
    const balance = calculateParticipationBalance(
      [makeSession(many, [1, 2, 3, 4]), makeSession([once], [5, 6, 7, 8])],
      []
    );
    expect(balance.rateSpreadPoints).toBe(0);
    expect(balance.records.find((record) => record.playerId === 5)?.playRate).toBe(1);
  });

  test('データが無いときは差0', () => {
    const balance = calculateParticipationBalance([], []);
    expect(balance.records).toEqual([]);
    expect(balance.rateSpreadPoints).toBe(0);
    expect(balance.theoreticalSpreadPoints).toBe(0);
  });

  test('10人2面で余りとして出る差は理論値を超えない', () => {
    const everyone = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const restPairs = [
      [1, 2],
      [3, 4],
      [5, 6],
      [7, 8],
    ];
    const rounds: Round[] = restPairs.map((rests, index) => {
      const playing = everyone.filter((id) => !rests.includes(id));
      return {
        roundNo: index + 1,
        courts: [
          {
            courtNo: 1,
            pairA: [playing[0]!, playing[1]!],
            pairB: [playing[2]!, playing[3]!],
            result: null,
          },
          {
            courtNo: 2,
            pairA: [playing[4]!, playing[5]!],
            pairB: [playing[6]!, playing[7]!],
            result: null,
          },
        ],
        rests,
      };
    });
    const balance = calculateParticipationBalance(
      [makeSession(rounds, everyone)],
      []
    );
    expect(balance.rateSpreadPoints).toBe(25);
    expect(balance.theoreticalSpreadPoints).toBe(25);
    expect(balance.rateSpreadPoints - balance.theoreticalSpreadPoints).toBeLessThan(5);
    expect(balance.warningExcessPoints).toBe(0);
    expect(balance.participationJudged).toBe(false);
  });

  test('ラウンドが少ない練習や途中参加・早退では警告しない', () => {
    const shortRounds: Round[] = [1, 2, 3].map((roundNo) => ({
      roundNo,
      courts: [{ courtNo: 1, pairA: [1, 2], pairB: [3, 4], result: null }],
      rests: [5],
    }));
    const short = calculateParticipationBalance([makeSession(shortRounds, [1, 2, 3, 4, 5])], []);
    expect(short.rateSpreadPoints).toBeGreaterThan(5);
    expect(short.warningExcessPoints).toBe(0);
    expect(short.participationJudged).toBe(false);

    const fullRounds: Round[] = Array.from({ length: 6 }, (_, index) => ({
      roundNo: index + 1,
      courts: [{ courtNo: 1, pairA: [1, 2], pairB: [3, 4], result: null }],
      rests: [] as number[],
    }));
    fullRounds.push({
      roundNo: 7,
      courts: [{ courtNo: 1, pairA: [1, 2], pairB: [5, 6], result: null }],
      rests: [3, 4],
    });
    const joined = calculateParticipationBalance(
      [makeSession(fullRounds, [1, 2, 3, 4, 5, 6])],
      []
    );
    expect(joined.warningExcessPoints).toBe(0);

    const leftEarly: Round[] = [
      {
        roundNo: 1,
        courts: [{ courtNo: 1, pairA: [1, 2], pairB: [3, 4], result: null }],
        rests: [5],
      },
      {
        roundNo: 2,
        courts: [{ courtNo: 1, pairA: [1, 2], pairB: [3, 4], result: null }],
        rests: [5],
      },
      ...Array.from({ length: 4 }, (_, index) => ({
        roundNo: index + 3,
        courts: [
          {
            courtNo: 1,
            pairA: [1, 2] as [number, number],
            pairB: [3, 4] as [number, number],
            result: null,
          },
        ],
        rests: [] as number[],
      })),
    ];
    const early = calculateParticipationBalance(
      [makeSession(leftEarly, [1, 2, 3, 4, 5])],
      []
    );
    expect(early.warningExcessPoints).toBe(0);

    const unfair: Round[] = Array.from({ length: 6 }, (_, index) => ({
      roundNo: index + 1,
      courts: [{ courtNo: 1, pairA: [2, 3], pairB: [4, 5], result: null }],
      rests: [1],
    }));
    const skewed = calculateParticipationBalance(
      [makeSession(unfair, [1, 2, 3, 4, 5])],
      []
    );
    expect(skewed.warningExcessPoints).toBeGreaterThanOrEqual(5);
    expect(skewed.participationJudged).toBe(true);
  });

  test('全期間の警告は練習ごとの差を合計しない', () => {
    const uneven = (roundNo: number): Round => ({
      roundNo,
      courts: [{ courtNo: 1, pairA: [1, 2], pairB: [3, 4], result: null }],
      rests: [5],
    });
    const first = [1, 2, 3].map(uneven);
    const second = [1, 2, 3].map(uneven);
    const balance = calculateParticipationBalance(
      [makeSession(first, [1, 2, 3, 4, 5]), makeSession(second, [1, 2, 3, 4, 5], '2026-02-01T00:00:00Z')],
      []
    );
    expect(balance.warningExcessPoints).toBe(0);
    expect(balance.participationJudged).toBe(false);
  });
});

describe('shouldIncludeCurrentPractice', () => {
  test('今日が入る期間では、クラブが合う進行中の練習を足す', () => {
    for (const period of ['current', 'all', 'last3', 'thisMonth'] as const) {
      expect(
        shouldIncludeCurrentPractice({
          period,
          clubFilter: [],
          currentClubTags: ['クラブB'],
        })
      ).toBe(true);
    }
    expect(
      shouldIncludeCurrentPractice({
        period: 'thisMonth',
        clubFilter: ['クラブA'],
        currentClubTags: ['クラブA'],
      })
    ).toBe(true);
    expect(
      shouldIncludeCurrentPractice({
        period: 'last3',
        clubFilter: ['クラブA'],
        currentClubTags: ['クラブB'],
      })
    ).toBe(false);
  });

  test('クラブが一致しない進行中の練習は足さない', () => {
    expect(
      shouldIncludeCurrentPractice({
        period: 'all',
        clubFilter: ['クラブA'],
        currentClubTags: ['クラブB'],
      })
    ).toBe(false);
    expect(
      shouldIncludeCurrentPractice({
        period: 'current',
        clubFilter: ['クラブA', 'クラブB'],
        currentClubTags: ['クラブB'],
      })
    ).toBe(true);
  });
});

describe('sessionsAlongsideCurrent', () => {
  test('直近3回に進行中を足すときは過去を2回にして4回分にしない', () => {
    const sessions = [
      makeSession([], [1], '2026-03-01T00:00:00Z'),
      makeSession([], [1], '2026-03-05T00:00:00Z'),
      makeSession([], [1], '2026-03-10T00:00:00Z'),
    ];
    const withCurrent = sessionsAlongsideCurrent(sessions, 'last3', true);
    expect(withCurrent.map((session) => session.startedAt)).toEqual([
      '2026-03-10T00:00:00Z',
      '2026-03-05T00:00:00Z',
    ]);
    expect(sessionsAlongsideCurrent(sessions, 'last3', false)).toHaveLength(3);
    expect(sessionsAlongsideCurrent(sessions, 'thisMonth', true)).toHaveLength(
      filterSessions(sessions, 'thisMonth').length
    );
  });
});

describe('pickMatchupHighlights', () => {
  test('3試合未満や、最大と最小が同じ人のときは出さない', () => {
    expect(
      pickMatchupHighlights([
        { opponentId: 2, wins: 1, losses: 0, winRate: 1, totalMatches: 1 },
      ])
    ).toEqual({ favorable: null, unfavorable: null });

    expect(
      pickMatchupHighlights([
        { opponentId: 2, wins: 2, losses: 1, winRate: 2 / 3, totalMatches: 3 },
      ])
    ).toEqual({ favorable: null, unfavorable: null });
  });

  test('3試合以上で勝率の高い相手と低い相手を分ける', () => {
    const highlights = pickMatchupHighlights([
      { opponentId: 2, wins: 3, losses: 0, winRate: 1, totalMatches: 3 },
      { opponentId: 3, wins: 0, losses: 3, winRate: 0, totalMatches: 3 },
      { opponentId: 4, wins: 1, losses: 0, winRate: 1, totalMatches: 1 },
    ]);
    expect(highlights.favorable?.opponentId).toBe(2);
    expect(highlights.unfavorable?.opponentId).toBe(3);
  });
});
