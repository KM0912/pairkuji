import type { Member } from '@/types/member';
import type { PracticePlayer } from '@/types/practice';
import type { PracticeSession } from '@/types/practiceSession';
import { getDisplayName } from '@/lib/utils';

/**
 * 履歴セッションの出場番号。
 * `participants` がある場合は当日の番号を使い、無い古い記録だけ名前順で振り直す。
 */
export function playersForSession(
  session: PracticeSession,
  memberMap: Map<number, Member>
): PracticePlayer[] {
  if (session.participants && session.participants.length > 0) {
    return [...session.participants]
      .sort((a, b) => a.playerNumber - b.playerNumber)
      .map((participant) => ({
        memberId: participant.memberId,
        playerNumber: participant.playerNumber,
        status: 'active' as const,
        createdAt: session.startedAt,
      }));
  }

  const sortedIds = [...session.playerIds].sort((a, b) =>
    getDisplayName(memberMap, a).localeCompare(
      getDisplayName(memberMap, b),
      'ja'
    )
  );

  return sortedIds.map((memberId, index) => ({
    memberId,
    playerNumber: index + 1,
    status: 'active' as const,
    createdAt: session.startedAt,
  }));
}

export function sessionHasSavedNumbers(session: PracticeSession): boolean {
  return (session.participants?.length ?? 0) > 0;
}
