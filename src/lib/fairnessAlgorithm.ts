import {
  createSchedulerState,
  generateNextRound,
  validateRound,
  type Round as SchedulerRound,
} from 'doubles-scheduler';
import type { PlayerStats } from '@/types/stats';
import type { CourtMatch, Round } from '@/types/round';
import type { PracticePlayer } from '@/types/practice';

const MAX_RECENT_RECORDS = 5;

type Pair = [number, number];

function pushRecent(list: number[], value: number): void {
  list.push(value);
  if (list.length > MAX_RECENT_RECORDS) {
    list.shift();
  }
}

function orderPairByPlayerNumber(
  pair: Pair,
  playerNumberByMemberId: Map<number, number>
): Pair {
  const [memberIdA, memberIdB] = pair;
  const playerNumberA =
    playerNumberByMemberId.get(memberIdA) ?? Number.POSITIVE_INFINITY;
  const playerNumberB =
    playerNumberByMemberId.get(memberIdB) ?? Number.POSITIVE_INFINITY;

  if (playerNumberA !== playerNumberB) {
    return playerNumberA < playerNumberB
      ? [memberIdA, memberIdB]
      : [memberIdB, memberIdA];
  }

  return memberIdA < memberIdB
    ? [memberIdA, memberIdB]
    : [memberIdB, memberIdA];
}

function toSchedulerRound(round: Round): SchedulerRound<number> {
  return {
    id: `round-${round.roundNo}`,
    matches: round.courts.map((court) => ({
      id: `match-${round.roundNo}-${court.courtNo}`,
      court: court.courtNo,
      teamA: [...court.pairA],
      teamB: [...court.pairB],
      ...(court.result
        ? {
            result: {
              winner: court.result === 'pairA' ? 'teamA' : 'teamB',
            },
          }
        : {}),
    })),
    // Pairkuji passes only active players to this adapter. Its "rests" are
    // therefore automatic capacity-based sit-outs, not explicit user rests.
    restingPlayers: [],
    sittingOutPlayers: [...round.rests],
  };
}

function normalizeCourtCount(maxCourts: number): number {
  if (!Number.isFinite(maxCourts)) {
    return 0;
  }
  return Math.max(0, Math.floor(maxCourts));
}

function normalizePlayedOffset(
  playedOffset: number | undefined
): number | undefined {
  if (playedOffset === undefined) {
    return undefined;
  }
  return Number.isFinite(playedOffset)
    ? Math.max(0, Math.floor(playedOffset))
    : 0;
}

function assertUniquePlayerIds(players: PracticePlayer[]): void {
  const memberIds = players.map((player) => player.memberId);
  if (new Set(memberIds).size !== memberIds.length) {
    throw new Error('参加者IDが重複しているため組み合わせを生成できません');
  }
}

/**
 * Pairkuji の履歴形式から、途中参加時の補正を含むプレイヤー統計を計算する。
 *
 * 組み合わせ生成は doubles-scheduler に委譲しているが、この関数は
 * 既存の途中参加処理と画面側の互換性を保つために公開を継続する。
 */
export function calculatePlayerStats(
  playerIds: number[],
  rounds: Round[],
  playedOffsets?: Map<number, number>
): Map<number, PlayerStats> {
  const stats = new Map<number, PlayerStats>();
  const currentRestStreak = new Map<number, number>();

  playerIds.forEach((id) => {
    stats.set(id, {
      playerId: id,
      playedCount: playedOffsets?.get(id) ?? 0,
      restCount: 0,
      consecRest: 0,
      recentPartners: [],
      recentOpponents: [],
    });
    currentRestStreak.set(id, 0);
  });

  rounds.forEach((round) => {
    const playing = new Set<number>();

    round.courts.forEach((court) => {
      const participants = [...court.pairA, ...court.pairB];

      participants.forEach((playerId) => {
        const stat = stats.get(playerId);
        if (!stat) return;
        stat.playedCount += 1;
        currentRestStreak.set(playerId, 0);
        playing.add(playerId);
      });

      const [a1, a2] = court.pairA;
      const [b1, b2] = court.pairB;
      const statA1 = stats.get(a1);
      const statA2 = stats.get(a2);
      const statB1 = stats.get(b1);
      const statB2 = stats.get(b2);

      if (statA1) pushRecent(statA1.recentPartners, a2);
      if (statA2) pushRecent(statA2.recentPartners, a1);
      if (statB1) pushRecent(statB1.recentPartners, b2);
      if (statB2) pushRecent(statB2.recentPartners, b1);

      court.pairA.forEach((playerId) => {
        const stat = stats.get(playerId);
        if (!stat) return;
        court.pairB.forEach((opponentId) => {
          pushRecent(stat.recentOpponents, opponentId);
        });
      });

      court.pairB.forEach((playerId) => {
        const stat = stats.get(playerId);
        if (!stat) return;
        court.pairA.forEach((opponentId) => {
          pushRecent(stat.recentOpponents, opponentId);
        });
      });
    });

    playerIds.forEach((id) => {
      if (playing.has(id)) return;
      const stat = stats.get(id);
      if (!stat) return;

      stat.restCount += 1;
      const restStreak = (currentRestStreak.get(id) ?? 0) + 1;
      currentRestStreak.set(id, restStreak);
      stat.consecRest = Math.max(stat.consecRest, restStreak);
    });
  });

  return stats;
}

/**
 * doubles-scheduler で次ラウンドを生成し、Pairkuji の永続化形式へ変換する。
 */
export function generateFairRound(
  activePlayers: PracticePlayer[],
  maxCourts: number,
  rounds: Round[]
): { courts: CourtMatch[]; rests: number[] } {
  assertUniquePlayerIds(activePlayers);

  const courtCount = Math.min(
    normalizeCourtCount(maxCourts),
    Math.floor(activePlayers.length / 4)
  );
  if (activePlayers.length < 4 || courtCount === 0) {
    return {
      courts: [],
      rests: activePlayers
        .map((player) => player.memberId)
        .sort((a, b) => a - b),
    };
  }

  const schedulerState = createSchedulerState<number>({
    players: activePlayers.map((player) => ({
      id: player.memberId,
      stats:
        player.playedOffset === undefined
          ? undefined
          : { games: normalizePlayedOffset(player.playedOffset) },
      metadata: { playerNumber: player.playerNumber },
    })),
    courtCount,
    rounds: rounds.map(toSchedulerRound),
  });

  const proposal = generateNextRound(schedulerState);
  const validation = validateRound(schedulerState, proposal.round);

  if (!validation.valid) {
    throw new Error(
      `組み合わせ生成結果が不正です: ${validation.errors
        .map((error) => error.type)
        .join(', ')}`
    );
  }

  const playerNumberByMemberId = new Map(
    activePlayers.map((player) => [player.memberId, player.playerNumber])
  );

  const courts: CourtMatch[] = proposal.round.matches.map((match) => ({
    courtNo: match.court,
    pairA: orderPairByPlayerNumber([...match.teamA], playerNumberByMemberId),
    pairB: orderPairByPlayerNumber([...match.teamB], playerNumberByMemberId),
  }));

  const rests = [
    ...proposal.round.restingPlayers,
    ...proposal.round.sittingOutPlayers,
  ].sort((a, b) => a - b);

  return { courts, rests };
}
