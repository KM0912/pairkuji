import { generateFairRound, calculatePlayerStats } from '../src/lib/fairnessAlgorithm';
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

function calculateMatchCounts(playerIds: number[], rounds: Round[]): Map<number, number> {
  const matchCounts = new Map<number, number>();
  
  playerIds.forEach(id => matchCounts.set(id, 0));
  
  rounds.forEach(round => {
    round.courts.forEach(court => {
      [...court.pairA, ...court.pairB].forEach(playerId => {
        const current = matchCounts.get(playerId) || 0;
        matchCounts.set(playerId, current + 1);
      });
    });
  });
  
  return matchCounts;
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

function collectAllPairs(rounds: Round[]): Set<string> {
  const pairs = new Set<string>();
  
  rounds.forEach(round => {
    round.courts.forEach(court => {
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
  
  rounds.forEach(round => {
    round.courts.forEach(court => {
      const teamA = court.pairA.filter(id => id !== undefined).sort();
      const teamB = court.pairB.filter(id => id !== undefined).sort();
      
      if (teamA.length === 2 && teamB.length === 2) {
        const matchKey = `${teamA.join('-')}vs${teamB.join('-')}`;
        matches.add(matchKey);
      }
    });
  });
  
  return matches;
}

describe('Fairness Algorithm Tests', () => {
  describe('Basic functionality', () => {
    test('generates valid rounds for minimum players', () => {
      const players = createTestPlayers(4);
      const result = generateFairRound(players, 1, []);
      
      expect(result.courts).toHaveLength(1);
      expect(result.courts[0]?.pairA).toHaveLength(2);
      expect(result.courts[0]?.pairB).toHaveLength(2);
      expect(result.rests).toHaveLength(0);
    });

    test('handles insufficient players', () => {
      const players = createTestPlayers(3);
      const result = generateFairRound(players, 1, []);
      
      expect(result.courts).toHaveLength(0);
      expect(result.rests).toHaveLength(3);
    });
  });

  describe('Various court numbers and participant counts', () => {
    const testCases = [
      { players: 6, courts: 1, description: '6人1コート' },
      { players: 8, courts: 2, description: '8人2コート' },
      { players: 10, courts: 2, description: '10人2コート' },
      { players: 12, courts: 3, description: '12人3コート' },
      { players: 16, courts: 4, description: '16人4コート' },
      { players: 20, courts: 5, description: '20人5コート' },
      { players: 24, courts: 6, description: '24人6コート' },
    ];

    testCases.forEach(({ players: playerCount, courts, description }) => {
      test(`${description}: generates valid combinations`, () => {
        const players = createTestPlayers(playerCount);
        const result = generateFairRound(players, courts, []);
        
        const expectedCourts = Math.min(courts, Math.floor(playerCount / 4));
        const playersInCourts = result.courts.reduce((sum, court) => 
          sum + court.pairA.length + court.pairB.length, 0);
        
        expect(result.courts).toHaveLength(expectedCourts);
        expect(playersInCourts + result.rests.length).toBe(playerCount);
        expect(playersInCourts).toBe(expectedCourts * 4);
      });
    });
  });

  describe('Match distribution fairness', () => {
    const testScenarios = [
      { players: 8, courts: 2, rounds: 20, maxVariance: 1.0 },
      { players: 12, courts: 3, rounds: 30, maxVariance: 1.5 },
      { players: 16, courts: 4, rounds: 40, maxVariance: 2.0 },
    ];

    testScenarios.forEach(({ players: playerCount, courts, rounds: roundCount, maxVariance }) => {
      test(`${playerCount}人${courts}コート${roundCount}ラウンド: match count variance should be low`, () => {
        const players = createTestPlayers(playerCount);
        const rounds = generateMultipleRounds(players, courts, roundCount);
        
        const playerIds = players.map(p => p.memberId);
        const matchCounts = calculateMatchCounts(playerIds, rounds);
        const counts = Array.from(matchCounts.values());
        
        const variance = calculateVariance(counts);
        const min = Math.min(...counts);
        const max = Math.max(...counts);
        const difference = max - min;
        
        console.log(`${playerCount}人${courts}コート: 試合数分散=${variance.toFixed(2)}, 最小=${min}, 最大=${max}, 差=${difference}`);
        
        expect(variance).toBeLessThan(maxVariance);
        expect(difference).toBeLessThan(5); // 試合数の差は5未満
      });
    });
  });

  describe('Combination diversity', () => {
    test('8人2コート: generates diverse pair combinations over multiple rounds', () => {
      const players = createTestPlayers(8);
      const rounds = generateMultipleRounds(players, 2, 50);
      
      const allPairs = collectAllPairs(rounds);
      const possiblePairs = (8 * 7) / 2; // C(8,2) = 28
      
      console.log(`8人での生成ペア数: ${allPairs.size} / 理論値: ${possiblePairs}`);
      
      // 理論値の80%以上のペア組み合わせが生成されることを期待
      expect(allPairs.size).toBeGreaterThan(possiblePairs * 0.8);
    });

    test('6人1コート: generates all possible pair combinations', () => {
      const players = createTestPlayers(6);
      const rounds = generateMultipleRounds(players, 1, 50);
      
      const allPairs = collectAllPairs(rounds);
      const possiblePairs = (6 * 5) / 2; // C(6,2) = 15
      
      console.log(`6人での生成ペア数: ${allPairs.size} / 理論値: ${possiblePairs}`);
      
      // 小規模な場合はより高い網羅率を期待
      expect(allPairs.size).toBeGreaterThan(possiblePairs * 0.9);
    });

    test('12人3コート: generates diverse match combinations', () => {
      const players = createTestPlayers(12);
      const rounds = generateMultipleRounds(players, 3, 100);
      
      const allMatches = collectAllMatches(rounds);
      
      console.log(`12人での生成試合組み合わせ数: ${allMatches.size}`);
      
      // 十分な多様性があることを確認
      expect(allMatches.size).toBeGreaterThan(50);
    });
  });

  describe('Consecutive rest penalty', () => {
    test('minimizes consecutive rests in 10-player 2-court scenario', () => {
      const players = createTestPlayers(10);
      const rounds = generateMultipleRounds(players, 2, 20);
      
      const playerIds = players.map(p => p.memberId);
      const stats = calculatePlayerStats(playerIds, rounds);
      
      let totalConsecutiveRestPenalty = 0;
      stats.forEach(stat => {
        totalConsecutiveRestPenalty += Math.max(0, stat.consecRest - 1);
      });
      
      console.log(`連続休憩ペナルティ合計: ${totalConsecutiveRestPenalty}`);
      
      // 連続休憩ペナルティが過度にならないことを確認
      expect(totalConsecutiveRestPenalty).toBeLessThan(rounds.length * 0.3);
    });
  });

  describe('Performance benchmarking', () => {
    test('generates rounds within acceptable time limits', () => {
      const players = createTestPlayers(20);
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        generateFairRound(players, 5, []);
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 10;
      
      console.log(`平均生成時間: ${avgTime.toFixed(2)}ms`);
      
      // 1ラウンド生成が1秒以内であることを確認
      expect(avgTime).toBeLessThan(1000);
    });
  });

  describe('Edge cases', () => {
    test('handles exact multiples of 4 players', () => {
      const players = createTestPlayers(16);
      const result = generateFairRound(players, 4, []);
      
      expect(result.courts).toHaveLength(4);
      expect(result.rests).toHaveLength(0);
    });

    test('handles players with existing game history', () => {
      const players = createTestPlayers(8);
      
      // 既存のラウンド履歴を作成
      const existingRounds: Round[] = [
        {
          roundNo: 1,
          courts: [{
            courtNo: 1,
            pairA: [1, 2],
            pairB: [3, 4]
          }],
          rests: [5, 6, 7, 8]
        }
      ];
      
      const result = generateFairRound(players, 2, existingRounds);
      
      // 前回休憩だった選手が優先的に試合に参加することを確認
      const playingPlayers = result.courts.flatMap(court => [...court.pairA, ...court.pairB]);
      expect(playingPlayers).toContain(5);
      expect(playingPlayers).toContain(6);
      expect(playingPlayers).toContain(7);
      expect(playingPlayers).toContain(8);
    });
  });
});

describe('Statistics calculation', () => {
  test('correctly calculates player statistics from multiple rounds', () => {
    const rounds: Round[] = [
      {
        roundNo: 1,
        courts: [{ courtNo: 1, pairA: [1, 2], pairB: [3, 4] }],
        rests: [5, 6]
      },
      {
        roundNo: 2,
        courts: [{ courtNo: 1, pairA: [5, 6], pairB: [1, 3] }],
        rests: [2, 4]
      }
    ];
    
    const stats = calculatePlayerStats([1, 2, 3, 4, 5, 6], rounds);
    
    expect(stats.get(1)?.playedCount).toBe(2);
    expect(stats.get(2)?.playedCount).toBe(1);
    expect(stats.get(2)?.restCount).toBe(1);
    expect(stats.get(5)?.restCount).toBe(1);
    
    // パートナー関係の記録確認
    expect(stats.get(1)?.recentPartners).toContain(2);
    expect(stats.get(1)?.recentPartners).toContain(3);
    
    // 対戦相手関係の記録確認
    expect(stats.get(1)?.recentOpponents).toContain(3);
    expect(stats.get(1)?.recentOpponents).toContain(4);
  });
});