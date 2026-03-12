import { generateFairRound, calculatePlayerStats } from './fairnessAlgorithm';
import type { PracticePlayer } from '@/types/practice';
import type { Round } from '@/types/round';

// テストユーティリティ関数
function createTestPlayers(count: number): PracticePlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    memberId: i + 1,
    playerNumber: i + 1,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
  }));
}

function generateMultipleRounds(
  players: PracticePlayer[],
  maxCourts: number,
  roundCount: number
): Round[] {
  const rounds: Round[] = [];

  for (let i = 0; i < roundCount; i++) {
    const result = generateFairRound(players, maxCourts, rounds);
    const round: Round = {
      roundNo: i + 1,
      courts: result.courts,
      rests: result.rests,
    };
    rounds.push(round);
  }

  return rounds;
}

function calculateMatchCounts(
  playerIds: number[],
  rounds: Round[]
): Map<number, number> {
  const matchCounts = new Map<number, number>();

  playerIds.forEach((id) => matchCounts.set(id, 0));

  rounds.forEach((round) => {
    round.courts.forEach((court) => {
      [...court.pairA, ...court.pairB].forEach((playerId) => {
        const current = matchCounts.get(playerId) || 0;
        matchCounts.set(playerId, current + 1);
      });
    });
  });

  return matchCounts;
}

/**
 * 分散を計算する
 * @param values
 * @returns
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  return (
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    values.length
  );
}

function collectAllPairs(rounds: Round[]): Set<string> {
  const pairs = new Set<string>();

  rounds.forEach((round) => {
    round.courts.forEach((court) => {
      const [a1, a2] = court.pairA;
      const [b1, b2] = court.pairB;

      if (a1 !== undefined && a2 !== undefined) {
        const pairKey = [a1, a2].sort().join('-');
        pairs.add(pairKey);
      }

      if (b1 !== undefined && b2 !== undefined) {
        const pairKey = [b1, b2].sort().join('-');
        pairs.add(pairKey);
      }
    });
  });

  return pairs;
}

function collectAllMatches(rounds: Round[]): Set<string> {
  const matches = new Set<string>();

  rounds.forEach((round) => {
    round.courts.forEach((court) => {
      const teamA = court.pairA.filter((id) => id !== undefined).sort();
      const teamB = court.pairB.filter((id) => id !== undefined).sort();

      if (teamA.length === 2 && teamB.length === 2) {
        const matchKey = `${teamA.join('-')}vs${teamB.join('-')}`;
        matches.add(matchKey);
      }
    });
  });

  return matches;
}

/**
 * 理論的な試合数差を計算する関数
 *
 * @param playerCount 参加者数
 * @param courtCount コート数
 * @param roundCount ラウンド数
 * @returns 理論的な最大試合数差
 */
function calculateTheoreticalMatchDifference(
  playerCount: number,
  courtCount: number,
  roundCount: number
): number {
  // 1ラウンドで試合をする人数
  const playersPerRound = Math.min(playerCount, courtCount * 4);

  // 総試合機会数
  const totalMatchOpportunities = roundCount * playersPerRound;

  // 理論的な平均試合数
  const averageMatches = totalMatchOpportunities / playerCount;

  // 整数部分と余り
  const baseMatches = Math.floor(averageMatches);
  const remainder = totalMatchOpportunities % playerCount;

  // 理論的最大差 = 切り上げ試合数 - 切り下げ試合数
  const theoreticalMaxDiff = remainder > 0 ? 1 : 0;

  return theoreticalMaxDiff;
}

/**
 * 動的許容範囲を決定する関数
 *
 * @param playerCount 参加者数
 * @param courtCount コート数
 * @param roundCount ラウンド数
 * @returns 許容する最大試合数差
 */
function calculateAllowableMatchDifference(
  playerCount: number,
  courtCount: number,
  roundCount: number
): number {
  const theoretical = calculateTheoreticalMatchDifference(
    playerCount,
    courtCount,
    roundCount
  );

  // 基本の許容値は理論値
  let allowable = theoretical;

  // 参加者数が多い場合やコート数が少ない場合は追加の余裕を持たせる
  const participationRatio = playerCount / (courtCount * 4);

  if (participationRatio >= 2.0) {
    // 参加者がコート定員の2倍以上の場合、理論値に+1の余裕
    allowable = theoretical + 1;
  } else if (participationRatio > 1.5) {
    // 1.5倍超の場合、最低1は許容
    allowable = Math.max(theoretical, 1);
  }

  return allowable;
}

/**
 * 各ラウンド後の試合差をチェックする関数
 *
 * @param playerIds 選手ID配列
 * @param rounds ラウンド配列
 * @param playerCount 参加者数
 * @param courtCount コート数
 * @returns 各ラウンド後の試合差情報
 */
function checkMatchDifferencePerRound(
  playerIds: number[],
  rounds: Round[],
  playerCount: number,
  courtCount: number
): {
  roundNo: number;
  matchCounts: number[];
  difference: number;
  allowableDiff: number;
  isWithinRange: boolean;
}[] {
  const results: {
    roundNo: number;
    matchCounts: number[];
    difference: number;
    allowableDiff: number;
    isWithinRange: boolean;
  }[] = [];

  // 各ラウンド後の累積状況をチェック
  for (let i = 0; i < rounds.length; i++) {
    const roundsSoFar = rounds.slice(0, i + 1);
    const matchCounts = calculateMatchCounts(playerIds, roundsSoFar);
    const counts = Array.from(matchCounts.values());

    const min = Math.min(...counts);
    const max = Math.max(...counts);
    const difference = max - min;

    // その時点でのラウンド数に基づいて許容差を計算
    const currentRoundCount = i + 1;
    const allowableDiff = calculateAllowableMatchDifference(
      playerCount,
      courtCount,
      currentRoundCount
    );

    const isWithinRange = difference <= allowableDiff;

    results.push({
      roundNo: currentRoundCount,
      matchCounts: counts,
      difference,
      allowableDiff,
      isWithinRange,
    });
  }

  return results;
}

describe('試合数偏り確認テスト', () => {
  const testScenarios = [
    { players: 6, courts: 1, rounds: 15, description: '6人1コート' },
    { players: 8, courts: 1, rounds: 20, description: '8人1コート' },
    { players: 10, courts: 1, rounds: 20, description: '10人1コート' },
    { players: 10, courts: 2, rounds: 20, description: '10人2コート' },
    { players: 12, courts: 2, rounds: 25, description: '12人2コート' },
    { players: 16, courts: 3, rounds: 30, description: '16人3コート' },
    { players: 20, courts: 4, rounds: 35, description: '20人4コート' },
  ];

  testScenarios.forEach(
    ({ players: playerCount, courts, rounds: roundCount, description }) => {
      test(`${description}: 試合数の偏りが許容範囲内`, () => {
        const players = createTestPlayers(playerCount);
        const rounds = generateMultipleRounds(players, courts, roundCount);

        const playerIds = players.map((p) => p.memberId);
        const matchCounts = calculateMatchCounts(playerIds, rounds);
        const counts = Array.from(matchCounts.values());

        const min = Math.min(...counts);
        const max = Math.max(...counts);
        const difference = max - min;

        const allowableDiff = calculateAllowableMatchDifference(
          playerCount,
          courts,
          roundCount
        );

        console.log(
          `${description}: 試合数範囲=${min}-${max} (差=${difference}), 許容=${allowableDiff}`
        );

        expect(difference).toBeLessThanOrEqual(allowableDiff);
      });
    }
  );

  test('理論計算関数の動作確認', () => {
    // 6人1コート20ラウンド: 総試合機会80, 平均13.33, 理論差1
    expect(calculateTheoreticalMatchDifference(6, 1, 20)).toBe(1);

    // 8人2コート20ラウンド: 総試合機会160, 平均20, 理論差0
    expect(calculateTheoreticalMatchDifference(8, 2, 20)).toBe(0);

    // 10人1コート20ラウンド: 総試合機会80, 平均8, 理論差0
    expect(calculateTheoreticalMatchDifference(10, 1, 20)).toBe(0);

    // 12人1コート20ラウンド: 総試合機会80, 平均6.67, 理論差1
    expect(calculateTheoreticalMatchDifference(12, 1, 20)).toBe(1);
  });

  test('動的許容範囲の決定確認', () => {
    // 6人1コート: 参加比率1.5, 理論差1, 許容差1
    expect(calculateAllowableMatchDifference(6, 1, 20)).toBe(1);

    // 10人1コート: 参加比率2.5, 理論差0, 許容差1 (0+1)
    expect(calculateAllowableMatchDifference(10, 1, 20)).toBe(1);

    // 8人2コート: 参加比率1.0, 理論差0, 許容差0
    expect(calculateAllowableMatchDifference(8, 2, 20)).toBe(0);

    // 12人1コート: 参加比率3.0, 理論差1, 許容差2 (1+1)
    expect(calculateAllowableMatchDifference(12, 1, 20)).toBe(2);
  });
});

describe('各ラウンド後の試合差確認テスト', () => {
  const continuousTestScenarios = [
    { players: 6, courts: 1, rounds: 10, description: '6人1コート' },
    { players: 8, courts: 1, rounds: 15, description: '8人1コート' },
    { players: 10, courts: 1, rounds: 12, description: '10人1コート' },
    { players: 10, courts: 2, rounds: 20, description: '10人2コート' },
    { players: 12, courts: 2, rounds: 25, description: '12人2コート' },
    { players: 16, courts: 3, rounds: 30, description: '16人3コート' },
  ];

  continuousTestScenarios.forEach(
    ({ players: playerCount, courts, rounds: totalRounds, description }) => {
      test(`${description}: 各ラウンド後で試合差が許容範囲内`, () => {
        const players = createTestPlayers(playerCount);
        const rounds = generateMultipleRounds(players, courts, totalRounds);
        const playerIds = players.map((p) => p.memberId);

        const perRoundResults = checkMatchDifferencePerRound(
          playerIds,
          rounds,
          playerCount,
          courts
        );

        const failedRounds: {
          roundNo: number;
          difference: number;
          allowableDiff: number;
        }[] = [];

        perRoundResults.forEach((result) => {
          if (!result.isWithinRange) {
            failedRounds.push({
              roundNo: result.roundNo,
              difference: result.difference,
              allowableDiff: result.allowableDiff,
            });
          }
        });

        // 詳細ログ出力（最初の5ラウンドと失敗ラウンド）
        console.log(`\n${description} の詳細:`);
        perRoundResults.slice(0, 5).forEach((result) => {
          console.log(
            `  R${result.roundNo}: 試合差=${result.difference}, 許容=${result.allowableDiff}, ` +
              `範囲内=${result.isWithinRange ? '✓' : '✗'}`
          );
        });

        if (failedRounds.length > 0) {
          console.log(
            `  失敗ラウンド: ${failedRounds.map((f) => `R${f.roundNo}(${f.difference}>${f.allowableDiff})`).join(', ')}`
          );
        }

        expect(failedRounds).toHaveLength(0);
      });
    }
  );

  test('短期間での試合差変動確認: 8人1コート初期5ラウンド', () => {
    const players = createTestPlayers(8);
    const rounds = generateMultipleRounds(players, 1, 5);
    const playerIds = players.map((p) => p.memberId);

    const perRoundResults = checkMatchDifferencePerRound(
      playerIds,
      rounds,
      8,
      1
    );

    console.log('\n8人1コート 初期5ラウンドの詳細:');
    perRoundResults.forEach((result) => {
      const matchCountsStr = result.matchCounts.join('-');
      console.log(
        `  R${result.roundNo}: 試合数[${matchCountsStr}], 差=${result.difference}, ` +
          `許容=${result.allowableDiff}, 範囲内=${result.isWithinRange ? '✓' : '✗'}`
      );
    });

    // 初期ラウンドでも許容範囲内であることを確認
    perRoundResults.forEach((result) => {
      expect(result.isWithinRange).toBe(true);
    });
  });

  test('実践的シナリオ: 途中でラウンドを終了した場合の公平性', () => {
    const testCases = [
      {
        players: 10,
        courts: 1,
        stopAfter: 3,
        description: '10人1コート3ラウンドで終了',
      },
      {
        players: 12,
        courts: 2,
        stopAfter: 7,
        description: '12人2コート7ラウンドで終了',
      },
      {
        players: 8,
        courts: 1,
        stopAfter: 10,
        description: '8人1コート10ラウンドで終了',
      },
    ];

    testCases.forEach(
      ({ players: playerCount, courts, stopAfter, description }) => {
        const players = createTestPlayers(playerCount);
        const rounds = generateMultipleRounds(players, courts, stopAfter);
        const playerIds = players.map((p) => p.memberId);

        const perRoundResults = checkMatchDifferencePerRound(
          playerIds,
          rounds,
          playerCount,
          courts
        );

        const finalResult = perRoundResults[stopAfter - 1];
        if (!finalResult) {
          throw new Error(`No result found for round ${stopAfter}`);
        }

        const finalAllowableDiff = calculateAllowableMatchDifference(
          playerCount,
          courts,
          stopAfter
        );

        console.log(`\n${description}:`);
        console.log(`  最終試合差: ${finalResult.difference}`);
        console.log(`  許容範囲: ${finalAllowableDiff}`);
        console.log(`  範囲内: ${finalResult.isWithinRange ? '✓' : '✗'}`);

        expect(finalResult.isWithinRange).toBe(true);
      }
    );
  });
});

describe('4人ローテーションの周期性', () => {
  test('4人1コートでは3パターンが同じ順序で繰り返される', () => {
    const players = createTestPlayers(4);
    const totalRounds = 15;
    const rounds = generateMultipleRounds(players, 1, totalRounds);

    // 正規化した試合キー生成: 各ペアを昇順、2ペアを辞書順で並べて 'a-b|c-d'
    const toMatchKey = (round: Round): string => {
      const court = round.courts[0]!;
      const p1 = [...court.pairA].sort((a, b) => a - b).join('-');
      const p2 = [...court.pairB].sort((a, b) => a - b).join('-');
      return [p1, p2].sort().join('|');
    };

    const matchKeys = rounds.map(toMatchKey);

    const allowed = new Set<string>(['1-2|3-4', '1-3|2-4', '1-4|2-3']);

    // まず、生成される全試合が3パターンのいずれかであること
    matchKeys.forEach((k, i) => {
      if (!allowed.has(k)) {
        throw new Error(`許可外の組み合わせが生成されました: R${i + 1} = ${k}`);
      }
    });

    // 3連続で全て異なるパターンになる最初の位置を探す
    let startIndex = -1;
    for (let i = 0; i <= matchKeys.length - 3; i++) {
      const window = new Set([
        matchKeys[i]!,
        matchKeys[i + 1]!,
        matchKeys[i + 2]!,
      ]);
      if (window.size === 3) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) {
      throw new Error('3パターンが連続で一巡する箇所を見つけられませんでした');
    }

    const cycle = [
      matchKeys[startIndex]!,
      matchKeys[startIndex + 1]!,
      matchKeys[startIndex + 2]!,
    ];

    // 見つけた順序で以降が周期3で繰り返されることを確認
    for (let j = startIndex; j < matchKeys.length; j++) {
      const expected = cycle[(j - startIndex) % 3];
      expect(matchKeys[j]).toBe(expected);
    }
  });
});

describe('途中から4人になった場合', () => {
  test('8人から4人に減少した場合、3パターン周期が維持される', () => {
    const players = createTestPlayers(8);
    const rounds: Round[] = [];

    // 最初の5ラウンドは8人で実施
    for (let i = 0; i < 5; i++) {
      const result = generateFairRound(players, 2, rounds);
      rounds.push({
        roundNo: i + 1,
        courts: result.courts,
        rests: result.rests,
      });
    }

    // 6ラウンド目から4人に減少（ID 1-4のみ）
    const reducedPlayers = players.slice(0, 4);
    const startRound = 6;
    const additionalRounds = 12; // 4人×3で12ラウンド分確認

    for (let i = 0; i < additionalRounds; i++) {
      const result = generateFairRound(reducedPlayers, 1, rounds);
      rounds.push({
        roundNo: startRound + i,
        courts: result.courts,
        rests: result.rests,
      });
    }

    // 4人期間（R6-R17）の試合キーを抽出
    const toMatchKey = (round: Round): string => {
      const court = round.courts[0]!;
      const p1 = [...court.pairA].sort((a, b) => a - b).join('-');
      const p2 = [...court.pairB].sort((a, b) => a - b).join('-');
      return [p1, p2].sort().join('|');
    };

    const fourPlayerRounds = rounds.slice(5); // R6以降
    const matchKeys = fourPlayerRounds.map(toMatchKey);

    const allowed = new Set<string>(['1-2|3-4', '1-3|2-4', '1-4|2-3']);

    // 4人期間の全試合が3パターンのいずれかであること
    matchKeys.forEach((k, i) => {
      expect(allowed.has(k)).toBe(true);
    });

    // 3連続で全パターンが出現する箇所を探す
    let startIndex = -1;
    for (let i = 0; i <= matchKeys.length - 3; i++) {
      const window = new Set([
        matchKeys[i]!,
        matchKeys[i + 1]!,
        matchKeys[i + 2]!,
      ]);
      if (window.size === 3) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) {
      throw new Error('3パターンが連続で一巡する箇所を見つけられませんでした');
    }

    const cycle = [
      matchKeys[startIndex]!,
      matchKeys[startIndex + 1]!,
      matchKeys[startIndex + 2]!,
    ];

    // 見つけた順序で以降が周期3で繰り返されることを確認
    for (let j = startIndex; j < matchKeys.length; j++) {
      const expected = cycle[(j - startIndex) % 3];
      expect(matchKeys[j]).toBe(expected);
    }

    console.log('\n途中から4人: 8人→4人のパターン確認');
    console.log(`  4人期間ラウンド数: ${matchKeys.length}`);
    console.log(`  検出された周期: ${cycle.join(' → ')}`);
    console.log(`  周期開始位置: R${startIndex + 6}`);
  });

  test('10人から4人に減少した場合、試合数が均等に維持される', () => {
    const players = createTestPlayers(10);
    const rounds: Round[] = [];

    // 最初の8ラウンドは10人で実施
    for (let i = 0; i < 8; i++) {
      const result = generateFairRound(players, 2, rounds);
      rounds.push({
        roundNo: i + 1,
        courts: result.courts,
        rests: result.rests,
      });
    }

    // 9ラウンド目から4人に減少（ID 1-4のみ）
    const reducedPlayers = players.slice(0, 4);
    const startRound = 9;
    const additionalRounds = 15;

    for (let i = 0; i < additionalRounds; i++) {
      const result = generateFairRound(reducedPlayers, 1, rounds);
      rounds.push({
        roundNo: startRound + i,
        courts: result.courts,
        rests: result.rests,
      });
    }

    // 4人期間（R9-R23）の試合数を確認
    const fourPlayerRounds = rounds.slice(8);
    const matchCounts = calculateMatchCounts([1, 2, 3, 4], fourPlayerRounds);
    const counts = Array.from(matchCounts.values());

    const min = Math.min(...counts);
    const max = Math.max(...counts);
    const difference = max - min;

    console.log('\n途中から4人: 10人→4人の試合数確認');
    console.log(`  4人期間試合数: ${counts.join(', ')}`);
    console.log(`  試合数差: ${difference}`);

    // 4人の場合は全員が毎回出場するため、試合数は完全に均等
    expect(difference).toBe(0);
  });

  test('12人から4人に減少した場合、前半の統計が引き継がれる', () => {
    const players = createTestPlayers(12);
    const rounds: Round[] = [];

    // 最初の10ラウンドは12人で実施
    for (let i = 0; i < 10; i++) {
      const result = generateFairRound(players, 3, rounds);
      rounds.push({
        roundNo: i + 1,
        courts: result.courts,
        rests: result.rests,
      });
    }

    // 11ラウンド目から4人に減少（ID 1-4のみ）
    const reducedPlayers = players.slice(0, 4);

    // 減少直前の統計を確認
    const statsBefore = calculatePlayerStats(
      reducedPlayers.map((p) => p.memberId),
      rounds
    );

    const playedCountsBefore = Array.from(statsBefore.values()).map(
      (s) => s.playedCount
    );

    // 4人期間を追加
    const startRound = 11;
    const additionalRounds = 10;

    for (let i = 0; i < additionalRounds; i++) {
      const result = generateFairRound(reducedPlayers, 1, rounds);
      rounds.push({
        roundNo: startRound + i,
        courts: result.courts,
        rests: result.rests,
      });
    }

    // 全期間の統計を確認
    const statsAfter = calculatePlayerStats(
      reducedPlayers.map((p) => p.memberId),
      rounds
    );

    const playedCountsAfter = Array.from(statsAfter.values()).map(
      (s) => s.playedCount
    );

    console.log('\n途中から4人: 12人→4人の統計引き継ぎ確認');
    console.log(`  減少前試合数: ${playedCountsBefore.join(', ')}`);
    console.log(`  全期間試合数: ${playedCountsAfter.join(', ')}`);

    // 全期間で見ても試合数差が許容範囲内であること
    const minAfter = Math.min(...playedCountsAfter);
    const maxAfter = Math.max(...playedCountsAfter);
    const differenceAfter = maxAfter - minAfter;

    // 20ラウンドで4人1コートなので、理論差は0
    const allowableDiff = calculateAllowableMatchDifference(4, 1, rounds.length);

    console.log(`  最終試合数差: ${differenceAfter}`);
    console.log(`  許容差: ${allowableDiff}`);

    expect(differenceAfter).toBeLessThanOrEqual(allowableDiff);
  });
});

// --- 途中参加テスト ---

describe('途中参加テスト', () => {
  test('8人→9人: 1人途中参加後も試合数が公平', () => {
    const initialPlayers = createTestPlayers(8);
    const rounds: Round[] = [];

    // 最初の5ラウンドは8人で実施
    for (let i = 0; i < 5; i++) {
      const result = generateFairRound(initialPlayers, 2, rounds);
      rounds.push({ roundNo: i + 1, courts: result.courts, rests: result.rests });
    }

    // 9人目を途中参加（playedOffsetで既存メンバーの平均に合わせる）
    const allPlayers: PracticePlayer[] = [
      ...initialPlayers,
      {
        memberId: 9,
        playerNumber: 9,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        playedOffset: Math.round(5 * (8 / 9)),
      },
    ];

    // 追加15ラウンド
    for (let i = 0; i < 15; i++) {
      const result = generateFairRound(allPlayers, 2, rounds);
      rounds.push({ roundNo: 6 + i, courts: result.courts, rests: result.rests });
    }

    // 途中参加後のラウンドで全員の試合数が公平か
    const postJoinRounds = rounds.slice(5);
    const allIds = allPlayers.map((p) => p.memberId);
    const matchCounts = calculateMatchCounts(allIds, postJoinRounds);
    const counts = Array.from(matchCounts.values());
    const diff = Math.max(...counts) - Math.min(...counts);

    console.log(`\n8人→9人途中参加: 参加後試合数=${counts.join(',')}, 差=${diff}`);
    expect(diff).toBeLessThanOrEqual(2);
  });

  test('8人→12人: 4人途中参加（仕様書シナリオ）後も公平', () => {
    const initialPlayers = createTestPlayers(8);
    const rounds: Round[] = [];

    for (let i = 0; i < 5; i++) {
      const result = generateFairRound(initialPlayers, 2, rounds);
      rounds.push({ roundNo: i + 1, courts: result.courts, rests: result.rests });
    }

    // 4人途中参加
    const newPlayers: PracticePlayer[] = Array.from({ length: 4 }, (_, i) => ({
      memberId: 9 + i,
      playerNumber: 9 + i,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      playedOffset: Math.round(5 * (8 / 12)),
    }));
    const allPlayers = [...initialPlayers, ...newPlayers];

    for (let i = 0; i < 20; i++) {
      const result = generateFairRound(allPlayers, 3, rounds);
      rounds.push({ roundNo: 6 + i, courts: result.courts, rests: result.rests });
    }

    const postJoinRounds = rounds.slice(5);
    const allIds = allPlayers.map((p) => p.memberId);
    const matchCounts = calculateMatchCounts(allIds, postJoinRounds);
    const counts = Array.from(matchCounts.values());
    const diff = Math.max(...counts) - Math.min(...counts);

    console.log(`\n8人→12人途中参加: 参加後試合数=${counts.join(',')}, 差=${diff}`);
    expect(diff).toBeLessThanOrEqual(2);
  });

  test('途中参加者が試合を独占しない（DEFICIT_CAP検証）', () => {
    const initialPlayers = createTestPlayers(4);
    const rounds: Round[] = [];

    // 4人で5ラウンド（全員出場）
    for (let i = 0; i < 5; i++) {
      const result = generateFairRound(initialPlayers, 1, rounds);
      rounds.push({ roundNo: i + 1, courts: result.courts, rests: result.rests });
    }

    // 4人追加（計8人1コート）
    const newPlayers: PracticePlayer[] = Array.from({ length: 4 }, (_, i) => ({
      memberId: 5 + i,
      playerNumber: 5 + i,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      playedOffset: Math.round(5 * (4 / 8)),
    }));
    const allPlayers = [...initialPlayers, ...newPlayers];

    // 直後の3ラウンドで途中参加者が3連続出場しないことを確認
    for (let i = 0; i < 3; i++) {
      const result = generateFairRound(allPlayers, 1, rounds);
      rounds.push({ roundNo: 6 + i, courts: result.courts, rests: result.rests });
    }

    // 途中参加者(ID 5-8)の参加後3ラウンドの出場数
    const postJoinRounds = rounds.slice(5);
    const newIds = [5, 6, 7, 8];
    const newMatchCounts = calculateMatchCounts(newIds, postJoinRounds);
    const newCounts = Array.from(newMatchCounts.values());

    console.log(`\nDEFICIT_CAP検証: 途中参加者3ラウンドの出場数=${newCounts.join(',')}`);
    // 3ラウンドで全員3回出場（独占）していないことを確認
    newCounts.forEach((count) => {
      expect(count).toBeLessThan(3);
    });
  });

  test('段階的途中参加: 6→8→10人', () => {
    const players6 = createTestPlayers(6);
    const rounds: Round[] = [];

    // フェーズ1: 6人5ラウンド
    for (let i = 0; i < 5; i++) {
      const result = generateFairRound(players6, 1, rounds);
      rounds.push({ roundNo: i + 1, courts: result.courts, rests: result.rests });
    }

    // フェーズ2: 8人に増加、5ラウンド
    const players8: PracticePlayer[] = [
      ...players6,
      ...Array.from({ length: 2 }, (_, i) => ({
        memberId: 7 + i,
        playerNumber: 7 + i,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        playedOffset: Math.round(5 * (6 / 8)),
      })),
    ];
    for (let i = 0; i < 5; i++) {
      const result = generateFairRound(players8, 2, rounds);
      rounds.push({ roundNo: 6 + i, courts: result.courts, rests: result.rests });
    }

    // フェーズ3: 10人に増加、10ラウンド
    const players10: PracticePlayer[] = [
      ...players8,
      ...Array.from({ length: 2 }, (_, i) => ({
        memberId: 9 + i,
        playerNumber: 9 + i,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        playedOffset: Math.round(10 * (8 / 10)),
      })),
    ];
    for (let i = 0; i < 10; i++) {
      const result = generateFairRound(players10, 2, rounds);
      rounds.push({ roundNo: 11 + i, courts: result.courts, rests: result.rests });
    }

    // 最終フェーズでの公平性確認
    const finalRounds = rounds.slice(10);
    const allIds = players10.map((p) => p.memberId);
    const matchCounts = calculateMatchCounts(allIds, finalRounds);
    const counts = Array.from(matchCounts.values());
    const diff = Math.max(...counts) - Math.min(...counts);

    console.log(`\n段階的参加6→8→10: 最終フェーズ試合数=${counts.join(',')}, 差=${diff}`);
    expect(diff).toBeLessThanOrEqual(2);
  });
});

// --- 途中離脱テスト ---

describe('途中離脱テスト', () => {
  test('12→8人: 中間的な離脱後の公平性', () => {
    const players12 = createTestPlayers(12);
    const rounds: Round[] = [];

    for (let i = 0; i < 10; i++) {
      const result = generateFairRound(players12, 3, rounds);
      rounds.push({ roundNo: i + 1, courts: result.courts, rests: result.rests });
    }

    // 4人が離脱（ID 1-8のみ残る）
    const remainingPlayers = players12.slice(0, 8);
    for (let i = 0; i < 15; i++) {
      const result = generateFairRound(remainingPlayers, 2, rounds);
      rounds.push({ roundNo: 11 + i, courts: result.courts, rests: result.rests });
    }

    // 離脱後のラウンドで残った8人の試合数が公平
    const postLeaveRounds = rounds.slice(10);
    const remainingIds = remainingPlayers.map((p) => p.memberId);
    const matchCounts = calculateMatchCounts(remainingIds, postLeaveRounds);
    const counts = Array.from(matchCounts.values());
    const diff = Math.max(...counts) - Math.min(...counts);

    console.log(`\n12→8人離脱: 離脱後試合数=${counts.join(',')}, 差=${diff}`);
    expect(diff).toBeLessThanOrEqual(1);
  });

  test('10→6人: 離脱後の公平性', () => {
    const players10 = createTestPlayers(10);
    const rounds: Round[] = [];

    for (let i = 0; i < 8; i++) {
      const result = generateFairRound(players10, 2, rounds);
      rounds.push({ roundNo: i + 1, courts: result.courts, rests: result.rests });
    }

    const remainingPlayers = players10.slice(0, 6);
    for (let i = 0; i < 12; i++) {
      const result = generateFairRound(remainingPlayers, 1, rounds);
      rounds.push({ roundNo: 9 + i, courts: result.courts, rests: result.rests });
    }

    const postLeaveRounds = rounds.slice(8);
    const remainingIds = remainingPlayers.map((p) => p.memberId);
    const matchCounts = calculateMatchCounts(remainingIds, postLeaveRounds);
    const counts = Array.from(matchCounts.values());
    const diff = Math.max(...counts) - Math.min(...counts);

    console.log(`\n10→6人離脱: 離脱後試合数=${counts.join(',')}, 差=${diff}`);
    // 6人1コート(参加比率1.5)では離脱直後の調整で差2まで許容
    expect(diff).toBeLessThanOrEqual(2);
  });

  test('途中参加と途中離脱の組み合わせ', () => {
    const players8 = createTestPlayers(8);
    const rounds: Round[] = [];

    // フェーズ1: 8人5ラウンド
    for (let i = 0; i < 5; i++) {
      const result = generateFairRound(players8, 2, rounds);
      rounds.push({ roundNo: i + 1, courts: result.courts, rests: result.rests });
    }

    // フェーズ2: 2人離脱 + 3人参加 → 9人
    const remainAfterLeave = players8.slice(0, 6); // 1-6が残る
    const newPlayers: PracticePlayer[] = Array.from({ length: 3 }, (_, i) => ({
      memberId: 9 + i,
      playerNumber: 9 + i,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      playedOffset: Math.round(5 * (6 / 9)),
    }));
    const phase2Players = [...remainAfterLeave, ...newPlayers];

    for (let i = 0; i < 15; i++) {
      const result = generateFairRound(phase2Players, 2, rounds);
      rounds.push({ roundNo: 6 + i, courts: result.courts, rests: result.rests });
    }

    const postChangeRounds = rounds.slice(5);
    const activeIds = phase2Players.map((p) => p.memberId);
    const matchCounts = calculateMatchCounts(activeIds, postChangeRounds);
    const counts = Array.from(matchCounts.values());
    const diff = Math.max(...counts) - Math.min(...counts);

    console.log(`\n参加+離脱の組み合わせ: 試合数=${counts.join(',')}, 差=${diff}`);
    // 途中参加者のplayedOffset補正と離脱の組み合わせでは差3まで許容
    expect(diff).toBeLessThanOrEqual(3);
  });
});

// --- ペア・対戦多様性テスト ---

describe('ペア・対戦多様性テスト', () => {
  test('ペアの多様性: 全ペアが満遍なく出現する', () => {
    const players = createTestPlayers(8);
    const rounds = generateMultipleRounds(players, 2, 20);

    const pairCounts = new Map<string, number>();
    rounds.forEach((round) => {
      round.courts.forEach((court) => {
        const [a1, a2] = court.pairA;
        const [b1, b2] = court.pairB;
        if (a1 !== undefined && a2 !== undefined) {
          const key = [a1, a2].sort().join('-');
          pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
        }
        if (b1 !== undefined && b2 !== undefined) {
          const key = [b1, b2].sort().join('-');
          pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
        }
      });
    });

    const counts = Array.from(pairCounts.values());
    const uniquePairs = pairCounts.size;
    // 8人から2人選ぶ組み合わせ = C(8,2) = 28通り
    const totalPossiblePairs = 28;
    const pairVariance = calculateVariance(counts);

    console.log(`\nペア多様性(8人2コート20R): 出現ペア数=${uniquePairs}/${totalPossiblePairs}, 分散=${pairVariance.toFixed(2)}`);
    console.log(`  出現回数: ${counts.sort((a, b) => a - b).join(',')}`);

    // 少なくとも全ペアの半分以上が出現すること
    expect(uniquePairs).toBeGreaterThanOrEqual(totalPossiblePairs / 2);
  });

  test('対戦の多様性: 同じ対戦カードが過集中しない', () => {
    const players = createTestPlayers(8);
    const rounds = generateMultipleRounds(players, 1, 20);

    const opponentCounts = new Map<string, number>();
    rounds.forEach((round) => {
      round.courts.forEach((court) => {
        const teamA = court.pairA.filter((id) => id !== undefined).sort();
        const teamB = court.pairB.filter((id) => id !== undefined).sort();
        for (const a of teamA) {
          for (const b of teamB) {
            const key = [Math.min(a, b), Math.max(a, b)].join('-');
            opponentCounts.set(key, (opponentCounts.get(key) ?? 0) + 1);
          }
        }
      });
    });

    const counts = Array.from(opponentCounts.values());
    const maxOpponent = Math.max(...counts);
    const minOpponent = Math.min(...counts);
    const opponentDiff = maxOpponent - minOpponent;

    console.log(`\n対戦多様性(8人1コート20R): 対戦回数範囲=${minOpponent}-${maxOpponent}, 差=${opponentDiff}`);

    // 対戦回数の最大差が過剰でないこと
    expect(opponentDiff).toBeLessThanOrEqual(6);
  });

  test('ペア多様性: 12人2コート25ラウンド', () => {
    const players = createTestPlayers(12);
    const rounds = generateMultipleRounds(players, 2, 25);

    const pairCounts = new Map<string, number>();
    rounds.forEach((round) => {
      round.courts.forEach((court) => {
        const [a1, a2] = court.pairA;
        const [b1, b2] = court.pairB;
        if (a1 !== undefined && a2 !== undefined) {
          const key = [a1, a2].sort().join('-');
          pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
        }
        if (b1 !== undefined && b2 !== undefined) {
          const key = [b1, b2].sort().join('-');
          pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
        }
      });
    });

    const counts = Array.from(pairCounts.values());
    const uniquePairs = pairCounts.size;
    // C(12,2) = 66
    const totalPossiblePairs = 66;

    console.log(`\nペア多様性(12人2コート25R): 出現ペア数=${uniquePairs}/${totalPossiblePairs}`);
    console.log(`  出現回数: ${counts.sort((a, b) => a - b).join(',')}`);

    expect(uniquePairs).toBeGreaterThanOrEqual(totalPossiblePairs / 2);
  });
});

// --- 休憩グループ多様性テスト ---

describe('休憩グループ多様性テスト', () => {
  test('同じ休憩メンバーが連続しない', () => {
    const players = createTestPlayers(10);
    const rounds = generateMultipleRounds(players, 2, 20);

    let consecutiveSameRestCount = 0;
    for (let i = 1; i < rounds.length; i++) {
      const prevRest = new Set(rounds[i - 1]!.rests);
      const currRest = new Set(rounds[i]!.rests);

      if (prevRest.size === currRest.size && prevRest.size > 0) {
        const allSame = Array.from(currRest).every((id) => prevRest.has(id));
        if (allSame) {
          consecutiveSameRestCount++;
        }
      }
    }

    console.log(`\n休憩グループ連続: 完全一致の連続回数=${consecutiveSameRestCount}/19`);
    // 完全に同じ休憩グループが3回以上連続しないこと
    expect(consecutiveSameRestCount).toBeLessThanOrEqual(2);
  });

  test('休憩回数が均等', () => {
    const players = createTestPlayers(10);
    const rounds = generateMultipleRounds(players, 2, 20);

    const restCounts = new Map<number, number>();
    players.forEach((p) => restCounts.set(p.memberId, 0));

    rounds.forEach((round) => {
      round.rests.forEach((id) => {
        restCounts.set(id, (restCounts.get(id) ?? 0) + 1);
      });
    });

    const counts = Array.from(restCounts.values());
    const diff = Math.max(...counts) - Math.min(...counts);

    console.log(`\n休憩回数の均等性(10人2コート20R): 休憩回数=${counts.join(',')}, 差=${diff}`);
    expect(diff).toBeLessThanOrEqual(2);
  });
});

// --- 連続出場・連続休憩の制約テスト ---

describe('連続出場・連続休憩の制約テスト', () => {
  test('連続出場の上限が守られる', () => {
    const players = createTestPlayers(10);
    const rounds = generateMultipleRounds(players, 1, 30);

    // 各プレイヤーの最大連続出場数を計算
    const maxConsecutivePlays = new Map<number, number>();
    players.forEach((p) => {
      let maxStreak = 0;
      let currentStreak = 0;
      rounds.forEach((round) => {
        const isPlaying = round.courts.some(
          (court) =>
            court.pairA.includes(p.memberId) || court.pairB.includes(p.memberId)
        );
        if (isPlaying) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      });
      maxConsecutivePlays.set(p.memberId, maxStreak);
    });

    const maxStreaks = Array.from(maxConsecutivePlays.values());
    const overallMax = Math.max(...maxStreaks);

    console.log(`\n連続出場制約(10人1コート30R): 最大連続出場=${overallMax}`);
    console.log(`  各プレイヤー: ${maxStreaks.join(',')}`);

    // MAX_CONSECUTIVE_PLAY(3) + 1程度の余裕を持って確認
    expect(overallMax).toBeLessThanOrEqual(5);
  });

  test('連続休憩の上限が守られる', () => {
    const players = createTestPlayers(12);
    const rounds = generateMultipleRounds(players, 2, 30);

    const maxConsecutiveRests = new Map<number, number>();
    players.forEach((p) => {
      let maxStreak = 0;
      let currentStreak = 0;
      rounds.forEach((round) => {
        const isResting = round.rests.includes(p.memberId);
        if (isResting) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      });
      maxConsecutiveRests.set(p.memberId, maxStreak);
    });

    const maxStreaks = Array.from(maxConsecutiveRests.values());
    const overallMax = Math.max(...maxStreaks);

    console.log(`\n連続休憩制約(12人2コート30R): 最大連続休憩=${overallMax}`);
    console.log(`  各プレイヤー: ${maxStreaks.join(',')}`);

    // MAX_CONSECUTIVE_REST(2) + 1程度の余裕を持って確認
    expect(overallMax).toBeLessThanOrEqual(3);
  });
});

// --- エッジケーステスト ---

describe('エッジケーステスト', () => {
  test('5人1コート: 休憩1人で公平に回る', () => {
    const players = createTestPlayers(5);
    const rounds = generateMultipleRounds(players, 1, 15);

    const playerIds = players.map((p) => p.memberId);
    const matchCounts = calculateMatchCounts(playerIds, rounds);
    const counts = Array.from(matchCounts.values());
    const diff = Math.max(...counts) - Math.min(...counts);

    // 休憩回数も確認
    const restCounts = new Map<number, number>();
    players.forEach((p) => restCounts.set(p.memberId, 0));
    rounds.forEach((round) => {
      round.rests.forEach((id) => {
        restCounts.set(id, (restCounts.get(id) ?? 0) + 1);
      });
    });
    const rCounts = Array.from(restCounts.values());
    const restDiff = Math.max(...rCounts) - Math.min(...rCounts);

    console.log(`\n5人1コート15R: 試合数=${counts.join(',')}, 差=${diff}`);
    console.log(`  休憩回数=${rCounts.join(',')}, 差=${restDiff}`);

    expect(diff).toBeLessThanOrEqual(1);
    expect(restDiff).toBeLessThanOrEqual(1);
  });

  test('4人未満: エラーにならずに空のコートを返す', () => {
    const players1 = createTestPlayers(1);
    const players2 = createTestPlayers(2);
    const players3 = createTestPlayers(3);

    const result1 = generateFairRound(players1, 1, []);
    const result2 = generateFairRound(players2, 1, []);
    const result3 = generateFairRound(players3, 1, []);

    expect(result1.courts).toHaveLength(0);
    expect(result1.rests).toEqual([1]);
    expect(result2.courts).toHaveLength(0);
    expect(result2.rests).toEqual([1, 2]);
    expect(result3.courts).toHaveLength(0);
    expect(result3.rests).toEqual([1, 2, 3]);
  });

  test('コート数 > プレイヤー数/4: コート数が自動削減される', () => {
    const players = createTestPlayers(6);
    // 6人で5コート指定 → 実際は1コートしか使えない
    const result = generateFairRound(players, 5, []);

    expect(result.courts.length).toBe(1);
    expect(result.rests.length).toBe(2);

    // 4人が出場していること
    const playingIds = new Set<number>();
    result.courts.forEach((court) => {
      [...court.pairA, ...court.pairB].forEach((id) => playingIds.add(id));
    });
    expect(playingIds.size).toBe(4);
  });

  test('ちょうど4×コート人数: 全員出場・休憩なし', () => {
    // 8人2コート
    const players8 = createTestPlayers(8);
    const result8 = generateFairRound(players8, 2, []);
    expect(result8.courts.length).toBe(2);
    expect(result8.rests.length).toBe(0);

    // 12人3コート
    const players12 = createTestPlayers(12);
    const result12 = generateFairRound(players12, 3, []);
    expect(result12.courts.length).toBe(3);
    expect(result12.rests.length).toBe(0);

    // 16人4コート
    const players16 = createTestPlayers(16);
    const result16 = generateFairRound(players16, 4, []);
    expect(result16.courts.length).toBe(4);
    expect(result16.rests.length).toBe(0);
  });

  test('大人数: 24人6コート', () => {
    const players = createTestPlayers(24);
    const rounds = generateMultipleRounds(players, 6, 20);

    const playerIds = players.map((p) => p.memberId);
    const matchCounts = calculateMatchCounts(playerIds, rounds);
    const counts = Array.from(matchCounts.values());
    const diff = Math.max(...counts) - Math.min(...counts);

    console.log(`\n24人6コート20R: 試合数範囲=${Math.min(...counts)}-${Math.max(...counts)}, 差=${diff}`);
    expect(diff).toBeLessThanOrEqual(1);
  });
});
