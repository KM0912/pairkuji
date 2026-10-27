import { describe, expect, test } from 'vitest';
import { canUndoSubstitution, type SubstitutionUndoState } from './substitutionUndo';

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
