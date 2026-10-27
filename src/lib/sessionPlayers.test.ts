import { describe, expect, test } from 'vitest';
import type { Member } from '@/types/member';
import type { PracticeSession } from '@/types/practiceSession';
import { playersForSession, sessionHasSavedNumbers } from './sessionPlayers';

function member(id: number, name: string): Member {
  return {
    id,
    name,
    isActive: true,
    isDeleted: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

function session(
  overrides: Partial<PracticeSession> = {}
): PracticeSession {
  return {
    startedAt: '2026-01-01T00:00:00Z',
    endedAt: '2026-01-01T02:00:00Z',
    courts: 1,
    playerIds: [1, 2],
    rounds: [],
    ...overrides,
  };
}

describe('playersForSession', () => {
  const memberMap = new Map<number, Member>([
    [1, member(1, '山田')],
    [2, member(2, '佐藤')],
  ]);

  test('participants があれば当日の番号を名前順に振り直さない', () => {
    const players = playersForSession(
      session({
        playerIds: [1, 2],
        participants: [
          { memberId: 1, playerNumber: 7 },
          { memberId: 2, playerNumber: 2 },
        ],
      }),
      memberMap
    );

    expect(players.map((player) => [player.memberId, player.playerNumber])).toEqual(
      [
        [2, 2],
        [1, 7],
      ]
    );
    expect(sessionHasSavedNumbers(session({
      participants: [{ memberId: 1, playerNumber: 7 }],
    }))).toBe(true);
  });

  test('古い記録は名前順の仮番号に戻す', () => {
    const players = playersForSession(
      session({ playerIds: [1, 2] }),
      memberMap
    );

    expect(players.map((player) => [player.memberId, player.playerNumber])).toEqual(
      [
        [2, 1],
        [1, 2],
      ]
    );
    expect(sessionHasSavedNumbers(session())).toBe(false);
  });
});
