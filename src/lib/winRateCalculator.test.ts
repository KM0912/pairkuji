import { calculateWinRates } from './winRateCalculator';
import type { Round } from '@/types/round';

function createRound(
  roundNo: number,
  courts: { pairA: [number, number]; pairB: [number, number]; result?: 'pairA' | 'pairB' | null }[]
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

describe('calculateWinRates', () => {
  test('勝敗が混在するケース', () => {
    const rounds: Round[] = [
      createRound(1, [
        { pairA: [1, 2], pairB: [3, 4], result: 'pairA' },
      ]),
      createRound(2, [
        { pairA: [1, 3], pairB: [2, 4], result: 'pairB' },
      ]),
    ];

    const rates = calculateWinRates(rounds);

    // R1: pairA=[1,2] wins, R2: pairB=[2,4] wins
    // Player 1: R1勝ち, R2負け(pairA) → 1勝1敗 = 50%
    expect(rates.get(1)?.wins).toBe(1);
    expect(rates.get(1)?.losses).toBe(1);
    expect(rates.get(1)?.winRate).toBe(0.5);

    // Player 2: R1勝ち(pairA), R2勝ち(pairB) → 2勝0敗 = 100%
    expect(rates.get(2)?.wins).toBe(2);
    expect(rates.get(2)?.losses).toBe(0);
    expect(rates.get(2)?.winRate).toBe(1);

    // Player 3: R1負け(pairB), R2負け(pairA) → 0勝2敗 = 0%
    expect(rates.get(3)?.wins).toBe(0);
    expect(rates.get(3)?.losses).toBe(2);
    expect(rates.get(3)?.winRate).toBe(0);

    // Player 4: R1負け(pairB), R2勝ち(pairB) → 1勝1敗 = 50%
    expect(rates.get(4)?.wins).toBe(1);
    expect(rates.get(4)?.losses).toBe(1);
    expect(rates.get(4)?.winRate).toBe(0.5);
  });

  test('未登録のみのケース（勝率null）', () => {
    const rounds: Round[] = [
      createRound(1, [
        { pairA: [1, 2], pairB: [3, 4], result: null },
      ]),
      createRound(2, [
        { pairA: [1, 2], pairB: [3, 4] }, // resultなし（undefined）
      ]),
    ];

    const rates = calculateWinRates(rounds);

    expect(rates.get(1)?.wins).toBe(0);
    expect(rates.get(1)?.losses).toBe(0);
    expect(rates.get(1)?.unrecorded).toBe(2);
    expect(rates.get(1)?.winRate).toBeNull();
  });

  test('空のラウンドのケース', () => {
    const rates = calculateWinRates([]);
    expect(rates.size).toBe(0);
  });

  test('複数ラウンドの統合計算', () => {
    const rounds: Round[] = [
      createRound(1, [
        { pairA: [1, 2], pairB: [3, 4], result: 'pairA' },
        { pairA: [5, 6], pairB: [7, 8], result: 'pairB' },
      ]),
      createRound(2, [
        { pairA: [1, 3], pairB: [2, 4], result: 'pairA' },
        { pairA: [5, 7], pairB: [6, 8], result: null },
      ]),
      createRound(3, [
        { pairA: [1, 4], pairB: [2, 3], result: 'pairB' },
        { pairA: [5, 8], pairB: [6, 7], result: 'pairA' },
      ]),
    ];

    const rates = calculateWinRates(rounds);

    // Player 1: R1勝ち, R2勝ち, R3負け → 2勝1敗 = 66.7%
    expect(rates.get(1)?.wins).toBe(2);
    expect(rates.get(1)?.losses).toBe(1);
    expect(rates.get(1)?.winRate).toBeCloseTo(2 / 3);

    // Player 5: R1負け, R2未登録, R3勝ち → 1勝1敗 = 50%
    expect(rates.get(5)?.wins).toBe(1);
    expect(rates.get(5)?.losses).toBe(1);
    expect(rates.get(5)?.unrecorded).toBe(1);
    expect(rates.get(5)?.winRate).toBe(0.5);
  });

  test('全勝・全敗のケース', () => {
    const rounds: Round[] = [
      createRound(1, [
        { pairA: [1, 2], pairB: [3, 4], result: 'pairA' },
      ]),
      createRound(2, [
        { pairA: [1, 2], pairB: [3, 4], result: 'pairA' },
      ]),
    ];

    const rates = calculateWinRates(rounds);

    // Player 1: 2勝0敗 = 100%
    expect(rates.get(1)?.winRate).toBe(1);

    // Player 3: 0勝2敗 = 0%
    expect(rates.get(3)?.winRate).toBe(0);
  });
});
