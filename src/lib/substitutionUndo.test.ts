import { describe, expect, test } from 'vitest';
import {
  canUndoSubstitution,
  courtsWithRecordedResult,
  type SubstitutionUndoState,
} from './substitutionUndo';

const snapshot: SubstitutionUndoState = {
  fromId: 1,
  toId: 2,
  roundNo: 3,
  results: [{ courtNo: 1, result: null }],
  players: [
    { memberId: 1, status: 'active' },
    { memberId: 2, status: 'active' },
  ],
};

describe('courtsWithRecordedResult', () => {
  test('入れ替えに関わるコートの勝敗だけを返す', () => {
    const cleared = courtsWithRecordedResult(
      [
        { courtNo: 1, pairA: [1, 2], pairB: [3, 4], result: 'pairA' },
        { courtNo: 2, pairA: [5, 6], pairB: [7, 8], result: 'pairB' },
        { courtNo: 3, pairA: [1, 5], pairB: [2, 6], result: null },
      ],
      1,
      8
    );
    expect(cleared).toEqual([
      { courtNo: 1, result: 'pairA' },
      { courtNo: 2, result: 'pairB' },
    ]);
  });
});

describe('canUndoSubstitution', () => {
  test('勝敗も出場も変わっていなければ戻せる', () => {
    expect(
      canUndoSubstitution(
        snapshot,
        { roundNo: 3, courts: [{ courtNo: 1, result: null }] },
        [
          { memberId: 1, status: 'active' },
          { memberId: 2, status: 'active' },
        ]
      )
    ).toBe(true);
  });

  test('勝敗が変わっていたら戻せない', () => {
    expect(
      canUndoSubstitution(
        snapshot,
        { roundNo: 3, courts: [{ courtNo: 1, result: 'pairA' }] },
        [
          { memberId: 1, status: 'active' },
          { memberId: 2, status: 'active' },
        ]
      )
    ).toBe(false);
  });

  test('早退に変わっていたら戻せない', () => {
    expect(
      canUndoSubstitution(
        snapshot,
        { roundNo: 3, courts: [{ courtNo: 1, result: null }] },
        [
          { memberId: 1, status: 'active' },
          { memberId: 2, status: 'rest', restKind: 'early' },
        ]
      )
    ).toBe(false);
  });

  test('次のラウンドのあとは戻せない', () => {
    expect(
      canUndoSubstitution(
        snapshot,
        { roundNo: 4, courts: [{ courtNo: 1, result: null }] },
        [
          { memberId: 1, status: 'active' },
          { memberId: 2, status: 'active' },
        ]
      )
    ).toBe(false);
  });
});
