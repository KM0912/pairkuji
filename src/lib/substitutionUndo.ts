import type { PlayerStatus, RestKind } from '@/types/practice';
import type { MatchResult } from '@/types/round';

export type SubstitutionPlayerSnapshot = {
  memberId: number;
  status: PlayerStatus;
  restKind?: RestKind;
};

/** 入れ替え直後の勝敗と、入れ替えた2人の出場状態。 */
export type SubstitutionUndoState = {
  fromId: number;
  toId: number;
  roundNo: number;
  results: Array<{ courtNo: number; result: MatchResult }>;
  players: SubstitutionPlayerSnapshot[];
  /** 入れ替えの前に付いていて、顔ぶれが変わったので消した勝敗。元に戻すときに戻す。 */
  clearedResults?: Array<{ courtNo: number; result: 'pairA' | 'pairB' }>;
};

export function courtsWithRecordedResult(
  courts: Array<{
    courtNo: number;
    pairA: readonly number[];
    pairB: readonly number[];
    result?: MatchResult | null;
  }>,
  fromId: number,
  toId: number
): Array<{ courtNo: number; result: 'pairA' | 'pairB' }> {
  const cleared: Array<{ courtNo: number; result: 'pairA' | 'pairB' }> = [];
  for (const court of courts) {
    if (court.result !== 'pairA' && court.result !== 'pairB') continue;
    const samePair =
      (court.pairA.includes(fromId) && court.pairA.includes(toId)) ||
      (court.pairB.includes(fromId) && court.pairB.includes(toId));
    if (samePair) continue;
    const involved = [...court.pairA, ...court.pairB].some(
      (id) => id === fromId || id === toId
    );
    if (!involved) continue;
    cleared.push({ courtNo: court.courtNo, result: court.result });
  }
  return cleared;
}

type LatestRound = {
  roundNo: number;
  courts: Array<{ courtNo: number; result?: MatchResult }>;
};

type PlayerNow = {
  memberId: number;
  status: PlayerStatus;
  restKind?: RestKind;
};

/**
 * 勝敗か出場状態が入れ替え直後から変わっていたら戻せない。
 * 次のラウンドが始まっていても戻せない。
 */
export function canUndoSubstitution(
  snapshot: SubstitutionUndoState,
  latest: LatestRound | undefined,
  players: PlayerNow[]
): boolean {
  if (!latest || latest.roundNo !== snapshot.roundNo) return false;
  if (latest.courts.length !== snapshot.results.length) return false;
  for (const saved of snapshot.results) {
    const court = latest.courts.find((item) => item.courtNo === saved.courtNo);
    if ((court?.result ?? null) !== (saved.result ?? null)) return false;
  }
  for (const saved of snapshot.players) {
    const player = players.find((item) => item.memberId === saved.memberId);
    if (!player) return false;
    if (player.status !== saved.status) return false;
    if ((player.restKind ?? null) !== (saved.restKind ?? null)) return false;
  }
  return true;
}
