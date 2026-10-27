import { describe, expect, test } from 'vitest';
import type { Member } from '@/types/member';
import { getDisplayName } from './utils';

function member(id: number, name: string, isDeleted = false): Member {
  return {
    id,
    name,
    isActive: !isDeleted,
    isDeleted,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('getDisplayName', () => {
  test('実名の末尾の番号は、削除済みでも残す', () => {
    const map = new Map<number, Member>([
      [2, member(2, '山田#2')],
      [12, member(12, '佐藤#2', true)],
    ]);
    expect(getDisplayName(map, 2)).toBe('山田#2');
    expect(getDisplayName(map, 12)).toBe('(削除)佐藤#2 ID 12');
  });

  test('ファイルに無い選手の補完名だけ、この端末のIDに置き換える', () => {
    const map = new Map<number, Member>([[12, member(12, '削除済みの選手 #10', true)]]);
    expect(getDisplayName(map, 12)).toBe('削除済みの選手 ID 12');
  });
});
