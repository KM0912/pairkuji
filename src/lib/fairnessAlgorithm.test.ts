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

// describe('公平性アルゴリズムのテスト', () => {
//   describe('基本機能', () => {
//     test('最小人数で妥当なラウンドを生成できる', () => {
//       const players = createTestPlayers(4);
//       const result = generateFairRound(players, 1, []);

//       expect(result.courts).toHaveLength(1);
//       expect(result.courts[0]?.pairA).toHaveLength(2);
//       expect(result.courts[0]?.pairB).toHaveLength(2);
//       expect(result.rests).toHaveLength(0);
//     });

//     test('人数不足の場合を処理できる', () => {
//       const players = createTestPlayers(3);
//       const result = generateFairRound(players, 1, []);

//       expect(result.courts).toHaveLength(0);
//       expect(result.rests).toHaveLength(3);
//     });
//   });

//   describe('コート数・参加人数のパターン', () => {
//     const testCases = [
//       { players: 6, courts: 1, description: '6人1コート' },
//       { players: 8, courts: 2, description: '8人2コート' },
//       { players: 10, courts: 2, description: '10人2コート' },
//       { players: 12, courts: 3, description: '12人3コート' },
//       { players: 16, courts: 4, description: '16人4コート' },
//       { players: 20, courts: 5, description: '20人5コート' },
//       { players: 24, courts: 6, description: '24人6コート' },
//     ];

//     testCases.forEach(({ players: playerCount, courts, description }) => {
//       test(`${description}: 妥当な組み合わせを生成できる`, () => {
//         const players = createTestPlayers(playerCount);
//         const result = generateFairRound(players, courts, []);

//         const expectedCourts = Math.min(courts, Math.floor(playerCount / 4));
//         const playersInCourts = result.courts.reduce(
//           (sum: number, court) => sum + court.pairA.length + court.pairB.length,
//           0
//         );

//         expect(result.courts).toHaveLength(expectedCourts);
//         expect(playersInCourts + result.rests.length).toBe(playerCount);
//         expect(playersInCourts).toBe(expectedCourts * 4);
//       });
//     });
//   });

//   describe('試合数分布の公平性', () => {
//     const testScenarios = [
//       { players: 8, courts: 2, rounds: 20, maxVariance: 1.0 },
//       { players: 12, courts: 3, rounds: 30, maxVariance: 1.5 },
//       { players: 16, courts: 4, rounds: 40, maxVariance: 2.0 },
//     ];

//     testScenarios.forEach(
//       ({ players: playerCount, courts, rounds: roundCount, maxVariance }) => {
//         test(`${playerCount}人${courts}コート${roundCount}ラウンド: 試合数分散が小さい`, () => {
//           const players = createTestPlayers(playerCount);
//           const rounds = generateMultipleRounds(players, courts, roundCount);

//           const playerIds = players.map((p) => p.memberId);
//           const matchCounts = calculateMatchCounts(playerIds, rounds);
//           const counts = Array.from(matchCounts.values());

//           const variance = calculateVariance(counts);
//           const min = Math.min(...counts);
//           const max = Math.max(...counts);
//           const difference = max - min;

//           console.log(
//             `${playerCount}人${courts}コート: 試合数分散=${variance.toFixed(2)}, 最小=${min}, 最大=${max}, 差=${difference}`
//           );

//           expect(variance).toBeLessThan(maxVariance);
//           expect(difference).toBeLessThan(5); // 試合数の差は5未満
//         });
//       }
//     );
//   });

//   describe('試合回数の公平性', () => {
//     test('試合回数の公平性を確保できる(1コート)', () => {
//       // 5人
//       const players = createTestPlayers(5);
//       const rounds = generateMultipleRounds(players, 1, 20);
//       const playerIds = players.map((p) => p.memberId);
//       const matchCounts = calculateMatchCounts(playerIds, rounds);
//       const counts = Array.from(matchCounts.values());
//       const variance = calculateVariance(counts);
//       expect(variance).toBeLessThan(1.0);

//       for (let playerCount = 4; playerCount <= 12; playerCount += 1) {
//         const players = createTestPlayers(playerCount);
//         const rounds = generateMultipleRounds(players, 1, 20);
//         const playerIds = players.map((p) => p.memberId);
//         const matchCounts = calculateMatchCounts(playerIds, rounds);
//         const counts = Array.from(matchCounts.values());
//         const variance = calculateVariance(counts);
//         expect(variance).toBeLessThan(1.0);
//       }
//     });
//   });

//   describe('組み合わせの多様性', () => {
//     test('8人2コート: 複数ラウンドでペアの多様性を確保できる', () => {
//       const players = createTestPlayers(8);
//       const rounds = generateMultipleRounds(players, 2, 50);

//       const allPairs = collectAllPairs(rounds);
//       const possiblePairs = (8 * 7) / 2; // C(8,2) = 28

//       console.log(
//         `8人での生成ペア数: ${allPairs.size} / 理論値: ${possiblePairs}`
//       );

//       // 理論値の80%以上のペア組み合わせが生成されることを期待
//       expect(allPairs.size).toBeGreaterThan(possiblePairs * 0.8);
//     });

//     test('6人1コート: すべてのペア組み合わせを生成できる', () => {
//       const players = createTestPlayers(6);
//       const rounds = generateMultipleRounds(players, 1, 50);

//       const allPairs = collectAllPairs(rounds);
//       const possiblePairs = (6 * 5) / 2; // C(6,2) = 15

//       console.log(
//         `6人での生成ペア数: ${allPairs.size} / 理論値: ${possiblePairs}`
//       );

//       // 小規模な場合はより高い網羅率を期待
//       expect(allPairs.size).toBeGreaterThan(possiblePairs * 0.9);
//     });

//     test('12人3コート: 試合組み合わせに多様性がある', () => {
//       const players = createTestPlayers(12);
//       const rounds = generateMultipleRounds(players, 3, 100);

//       const allMatches = collectAllMatches(rounds);

//       console.log(`12人での生成試合組み合わせ数: ${allMatches.size}`);

//       // 十分な多様性があることを確認
//       expect(allMatches.size).toBeGreaterThan(50);
//     });
//   });

//   describe('連続休憩ペナルティ', () => {
//     test('10人2コートのシナリオで連続休憩を最小化できる', () => {
//       const players = createTestPlayers(10);
//       const rounds = generateMultipleRounds(players, 2, 20);

//       const playerIds = players.map((p) => p.memberId);
//       const stats = calculatePlayerStats(playerIds, rounds);

//       let totalConsecutiveRestPenalty = 0;
//       stats.forEach((stat) => {
//         totalConsecutiveRestPenalty += Math.max(0, stat.consecRest - 1);
//       });

//       console.log(`連続休憩ペナルティ合計: ${totalConsecutiveRestPenalty}`);

//       // 連続休憩ペナルティが過度にならないことを確認
//       expect(totalConsecutiveRestPenalty).toBeLessThan(rounds.length * 0.3);
//     });

//     test('参加人数が収容人数の倍であれば連続休憩を許容する', () => {
//       const players = createTestPlayers(8);
//       const rounds = generateMultipleRounds(players, 1, 12);

//       let hasConsecutiveRest = false;
//       for (let i = 1; i < rounds.length; i++) {
//         const prev = new Set(rounds[i - 1]?.rests ?? []);
//         const current = rounds[i]?.rests ?? [];
//         if (current.some((id) => prev.has(id))) {
//           hasConsecutiveRest = true;
//           break;
//         }
//       }

//       const restPatterns = rounds.map((round) =>
//         [...round.rests].sort((a, b) => a - b).join('-')
//       );
//       const uniquePatterns = new Set(restPatterns);

//       expect(hasConsecutiveRest).toBe(true);
//       expect(uniquePatterns.size).toBeGreaterThan(2);
//     });
//   });

//   describe('パフォーマンス計測', () => {
//     test('許容範囲内の時間でラウンドを生成できる', () => {
//       const players = createTestPlayers(20);
//       const startTime = performance.now();

//       for (let i = 0; i < 10; i++) {
//         generateFairRound(players, 5, []);
//       }

//       const endTime = performance.now();
//       const avgTime = (endTime - startTime) / 10;

//       console.log(`平均生成時間: ${avgTime.toFixed(2)}ms`);

//       // 1ラウンド生成が1秒以内であることを確認
//       expect(avgTime).toBeLessThan(1000);
//     });
//   });

//   describe('境界ケース', () => {
//     test('4の倍数の人数を問題なく処理できる', () => {
//       const players = createTestPlayers(16);
//       const result = generateFairRound(players, 4, []);

//       expect(result.courts).toHaveLength(4);
//       expect(result.rests).toHaveLength(0);
//     });

//     test('過去の対戦履歴がある場合でも処理できる', () => {
//       const players = createTestPlayers(8);

//       // 既存のラウンド履歴を作成
//       const existingRounds: Round[] = [
//         {
//           roundNo: 1,
//           courts: [
//             {
//               courtNo: 1,
//               pairA: [1, 2],
//               pairB: [3, 4],
//             },
//           ],
//           rests: [5, 6, 7, 8],
//         },
//       ];

//       const result = generateFairRound(players, 2, existingRounds);

//       // 前回休憩だった選手が優先的に試合に参加することを確認
//       const playingPlayers = result.courts.flatMap((court) => [
//         ...court.pairA,
//         ...court.pairB,
//       ]);
//       expect(playingPlayers).toContain(5);
//       expect(playingPlayers).toContain(6);
//       expect(playingPlayers).toContain(7);
//       expect(playingPlayers).toContain(8);
//     });
//   });
// });

// describe('統計計算', () => {
//   test('複数ラウンドからの統計値を正しく計算できる', () => {
//     const rounds: Round[] = [
//       {
//         roundNo: 1,
//         courts: [{ courtNo: 1, pairA: [1, 2], pairB: [3, 4] }],
//         rests: [5, 6],
//       },
//       {
//         roundNo: 2,
//         courts: [{ courtNo: 1, pairA: [5, 6], pairB: [1, 3] }],
//         rests: [2, 4],
//       },
//     ];

//     const stats = calculatePlayerStats([1, 2, 3, 4, 5, 6], rounds);

//     expect(stats.get(1)?.playedCount).toBe(2);
//     expect(stats.get(2)?.playedCount).toBe(1);
//     expect(stats.get(2)?.restCount).toBe(1);
//     expect(stats.get(5)?.restCount).toBe(1);

//     // パートナー関係の記録確認
//     expect(stats.get(1)?.recentPartners).toContain(2);
//     expect(stats.get(1)?.recentPartners).toContain(3);

//     // 対戦相手関係の記録確認
//     expect(stats.get(1)?.recentOpponents).toContain(3);
//     expect(stats.get(1)?.recentOpponents).toContain(4);
//   });
// });
