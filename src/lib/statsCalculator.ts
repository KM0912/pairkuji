import type { Round } from '@/types/round';
import type { PracticeSession } from '@/types/practiceSession';

/** 期間フィルタの種類 */
export type PeriodFilterType = 'current' | 'last3' | 'thisMonth' | 'all';

export const PERIOD_FILTER_LABELS: Record<PeriodFilterType, string> = {
  current: '今回',
  last3: '過去3回',
  thisMonth: '今月',
  all: '全期間',
};

/**
 * 期間フィルタに応じてセッションを絞り込む
 * 「今回」の場合は空配列を返す（currentRoundsのみで集計するため）
 */
export function filterSessions(
  sessions: PracticeSession[],
  filter: PeriodFilterType
): PracticeSession[] {
  if (filter === 'all') return sessions;
  if (filter === 'current') return [];

  if (filter === 'last3') {
    const sorted = [...sessions].sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    return sorted.slice(0, 3);
  }

  if (filter === 'thisMonth') {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return sessions.filter((s) => {
      const d = new Date(s.startedAt);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }

  return sessions;
}

/** 個人の通算成績 */
export interface OverallPlayerStats {
  playerId: number;
  wins: number;
  losses: number;
  unrecorded: number;
  winRate: number | null;
  sessionCount: number;
  totalMatches: number;
}

/** セッション別の個人勝率 */
export interface SessionWinRate {
  sessionIndex: number;
  date: string;
  playerRates: Map<number, number | null>;
}

/** ペア別の通算勝率 */
export interface PairWinRate {
  player1: number;
  player2: number;
  wins: number;
  losses: number;
  winRate: number | null;
  totalMatches: number;
}

/** 直接対決の成績 */
export interface HeadToHeadRecord {
  opponentId: number;
  wins: number;
  losses: number;
  winRate: number | null;
  totalMatches: number;
}

/**
 * 全ラウンドから個人の勝敗を集計する内部ヘルパー
 */
function accumulateWinLoss(
  rounds: Round[],
  stats: Map<number, { wins: number; losses: number; unrecorded: number }>
) {
  for (const round of rounds) {
    for (const court of round.courts) {
      const allPlayers = [...court.pairA, ...court.pairB];

      if (court.result == null) {
        for (const id of allPlayers) {
          const s = stats.get(id) ?? { wins: 0, losses: 0, unrecorded: 0 };
          s.unrecorded++;
          stats.set(id, s);
        }
      } else if (court.result === 'pairA') {
        for (const id of court.pairA) {
          const s = stats.get(id) ?? { wins: 0, losses: 0, unrecorded: 0 };
          s.wins++;
          stats.set(id, s);
        }
        for (const id of court.pairB) {
          const s = stats.get(id) ?? { wins: 0, losses: 0, unrecorded: 0 };
          s.losses++;
          stats.set(id, s);
        }
      } else if (court.result === 'pairB') {
        for (const id of court.pairB) {
          const s = stats.get(id) ?? { wins: 0, losses: 0, unrecorded: 0 };
          s.wins++;
          stats.set(id, s);
        }
        for (const id of court.pairA) {
          const s = stats.get(id) ?? { wins: 0, losses: 0, unrecorded: 0 };
          s.losses++;
          stats.set(id, s);
        }
      }
    }
  }
}

/**
 * 全セッション + 現在のセッションから通算勝率を計算
 */
export function calculateOverallStats(
  sessions: PracticeSession[],
  currentRounds: Round[]
): OverallPlayerStats[] {
  const stats = new Map<
    number,
    { wins: number; losses: number; unrecorded: number }
  >();
  const sessionCounts = new Map<number, number>();

  // 過去セッションの集計
  for (const session of sessions) {
    accumulateWinLoss(session.rounds, stats);
    for (const playerId of session.playerIds) {
      sessionCounts.set(playerId, (sessionCounts.get(playerId) ?? 0) + 1);
    }
  }

  // 現在のセッションの集計
  accumulateWinLoss(currentRounds, stats);
  if (currentRounds.length > 0) {
    // 現在のセッション参加者を特定
    const currentPlayerIds = new Set<number>();
    for (const round of currentRounds) {
      for (const court of round.courts) {
        for (const id of [...court.pairA, ...court.pairB]) {
          currentPlayerIds.add(id);
        }
      }
      for (const id of round.rests) {
        currentPlayerIds.add(id);
      }
    }
    Array.from(currentPlayerIds).forEach((playerId) => {
      sessionCounts.set(playerId, (sessionCounts.get(playerId) ?? 0) + 1);
    });
  }

  const results: OverallPlayerStats[] = [];
  Array.from(stats.entries()).forEach(([playerId, s]) => {
    const totalMatches = s.wins + s.losses;
    results.push({
      playerId,
      wins: s.wins,
      losses: s.losses,
      unrecorded: s.unrecorded,
      winRate: totalMatches > 0 ? s.wins / totalMatches : null,
      sessionCount: sessionCounts.get(playerId) ?? 0,
      totalMatches,
    });
  });

  return results.sort((a, b) => {
    if (a.winRate !== null && b.winRate !== null) return b.winRate - a.winRate;
    if (a.winRate !== null) return -1;
    if (b.winRate !== null) return 1;
    return 0;
  });
}

/**
 * セッション別の勝率を計算（推移グラフ用）
 */
export function calculateSessionWinRates(
  sessions: PracticeSession[],
  currentRounds: Round[]
): SessionWinRate[] {
  const results: SessionWinRate[] = [];

  // 過去セッションをstartedAt順にソート
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );

  for (let i = 0; i < sorted.length; i++) {
    const session = sorted[i]!;
    const stats = new Map<
      number,
      { wins: number; losses: number; unrecorded: number }
    >();
    accumulateWinLoss(session.rounds, stats);

    const playerRates = new Map<number, number | null>();
    Array.from(stats.entries()).forEach(([playerId, s]) => {
      const total = s.wins + s.losses;
      playerRates.set(playerId, total > 0 ? s.wins / total : null);
    });

    results.push({
      sessionIndex: i + 1,
      date: session.startedAt,
      playerRates,
    });
  }

  // 現在のセッション
  if (currentRounds.length > 0) {
    const stats = new Map<
      number,
      { wins: number; losses: number; unrecorded: number }
    >();
    accumulateWinLoss(currentRounds, stats);

    const playerRates = new Map<number, number | null>();
    Array.from(stats.entries()).forEach(([playerId, s]) => {
      const total = s.wins + s.losses;
      playerRates.set(playerId, total > 0 ? s.wins / total : null);
    });

    results.push({
      sessionIndex: results.length + 1,
      date: new Date().toISOString(),
      playerRates,
    });
  }

  return results;
}

/**
 * ペア別の通算勝率を計算
 */
export function calculatePairWinRates(
  sessions: PracticeSession[],
  currentRounds: Round[],
  minMatches: number = 3
): PairWinRate[] {
  const pairStats = new Map<string, { wins: number; losses: number }>();

  function processPairRounds(rounds: Round[]) {
    for (const round of rounds) {
      for (const court of round.courts) {
        if (court.result == null) continue;

        const pairAKey = `${Math.min(court.pairA[0], court.pairA[1])}-${Math.max(court.pairA[0], court.pairA[1])}`;
        const pairBKey = `${Math.min(court.pairB[0], court.pairB[1])}-${Math.max(court.pairB[0], court.pairB[1])}`;

        const pairAStats = pairStats.get(pairAKey) ?? { wins: 0, losses: 0 };
        const pairBStats = pairStats.get(pairBKey) ?? { wins: 0, losses: 0 };

        if (court.result === 'pairA') {
          pairAStats.wins++;
          pairBStats.losses++;
        } else {
          pairBStats.wins++;
          pairAStats.losses++;
        }

        pairStats.set(pairAKey, pairAStats);
        pairStats.set(pairBKey, pairBStats);
      }
    }
  }

  for (const session of sessions) {
    processPairRounds(session.rounds);
  }
  processPairRounds(currentRounds);

  const results: PairWinRate[] = [];
  Array.from(pairStats.entries()).forEach(([key, s]) => {
    const totalMatches = s.wins + s.losses;
    if (totalMatches < minMatches) return;

    const [p1, p2] = key.split('-').map(Number) as [number, number];
    results.push({
      player1: p1,
      player2: p2,
      wins: s.wins,
      losses: s.losses,
      winRate: totalMatches > 0 ? s.wins / totalMatches : null,
      totalMatches,
    });
  });

  return results.sort((a, b) => {
    if (a.winRate !== null && b.winRate !== null) return b.winRate - a.winRate;
    if (a.winRate !== null) return -1;
    if (b.winRate !== null) return 1;
    return 0;
  });
}

/**
 * 特定プレイヤーの直接対決成績を計算
 */
export function calculateHeadToHead(
  sessions: PracticeSession[],
  currentRounds: Round[],
  playerId: number
): HeadToHeadRecord[] {
  const records = new Map<number, { wins: number; losses: number }>();

  function processH2HRounds(rounds: Round[]) {
    for (const round of rounds) {
      for (const court of round.courts) {
        if (court.result == null) continue;

        const inPairA = court.pairA.includes(playerId);
        const inPairB = court.pairB.includes(playerId);
        if (!inPairA && !inPairB) continue;

        // 対戦相手を特定
        const opponents = inPairA ? court.pairB : court.pairA;
        const playerWon =
          (inPairA && court.result === 'pairA') ||
          (inPairB && court.result === 'pairB');

        for (const opponentId of opponents) {
          const r = records.get(opponentId) ?? { wins: 0, losses: 0 };
          if (playerWon) {
            r.wins++;
          } else {
            r.losses++;
          }
          records.set(opponentId, r);
        }
      }
    }
  }

  for (const session of sessions) {
    processH2HRounds(session.rounds);
  }
  processH2HRounds(currentRounds);

  const results: HeadToHeadRecord[] = [];
  Array.from(records.entries()).forEach(([opponentId, r]) => {
    const totalMatches = r.wins + r.losses;
    results.push({
      opponentId,
      wins: r.wins,
      losses: r.losses,
      winRate: totalMatches > 0 ? r.wins / totalMatches : null,
      totalMatches,
    });
  });

  return results.sort((a, b) => {
    if (a.winRate !== null && b.winRate !== null) return b.winRate - a.winRate;
    if (a.winRate !== null) return -1;
    if (b.winRate !== null) return 1;
    return 0;
  });
}
