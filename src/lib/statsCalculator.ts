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
 * タグ配列でセッションを絞り込む（OR条件）
 * 空配列の場合は全セッションを返す
 */
export function filterSessionsByTag(
  sessions: PracticeSession[],
  tags: string[]
): PracticeSession[] {
  if (tags.length === 0) return sessions;
  return sessions.filter((s) =>
    s.clubTags?.some((t) => tags.includes(t))
  );
}

/**
 * セッション一覧からユニークなタグを取得する
 */
export function getUniqueTags(sessions: PracticeSession[]): string[] {
  const tags = new Set<string>();
  for (const s of sessions) {
    if (s.clubTags) {
      for (const t of s.clubTags) {
        tags.add(t);
      }
    }
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b, 'ja'));
}

/**
 * 進行中の練習の開始日が、その期間に入るか。
 * 「今月」は startedAt の月で見る。日付が無いときは今日として扱う。
 */
export function currentPracticeInPeriod(
  period: PeriodFilterType,
  startedAt: string | null | undefined,
  now = new Date()
): boolean {
  if (period !== 'thisMonth') return true;
  const started = startedAt ? new Date(startedAt) : now;
  if (Number.isNaN(started.getTime())) return false;
  return (
    started.getFullYear() === now.getFullYear() &&
    started.getMonth() === now.getMonth()
  );
}

/**
 * 進行中の練習を統計に足すか。
 * 期間は練習の開始日で判定する。クラブを選んでいるときはタグが重なるときだけ足す。
 */
export function shouldIncludeCurrentPractice(input: {
  period: PeriodFilterType;
  clubFilter: string[];
  currentClubTags: string[];
  startedAt?: string | null;
  now?: Date;
}): boolean {
  if (!currentPracticeInPeriod(input.period, input.startedAt, input.now)) return false;
  if (input.clubFilter.length === 0) return true;
  return input.currentClubTags.some((tag) => input.clubFilter.includes(tag));
}

/**
 * 過去セッションを期間で絞る。
 * 直近3回で進行中を1回分に数えるときは、過去は2回までにして4回分にしない。
 */
export function sessionsAlongsideCurrent(
  sessions: PracticeSession[],
  period: PeriodFilterType,
  currentCountsAsSession: boolean
): PracticeSession[] {
  const filtered = filterSessions(sessions, period);
  if (period !== 'last3' || !currentCountsAsSession) return filtered;
  return [...filtered]
    .sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    )
    .slice(0, 2);
}

/** 通算の順位に入れる最低試合数。これ未満は順位もトロフィーも付けない。 */
export const MIN_RANKED_MATCHES = 3;

/** 相性◎・苦手に出す最低試合数。 */
export const MIN_HIGHLIGHT_MATCHES = 3;

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

  return results.sort((a, b) => compareWinRateRank(a, b));
}

function isRankedStat(stat: {
  winRate: number | null;
  totalMatches: number;
}): boolean {
  return stat.winRate !== null && stat.totalMatches >= MIN_RANKED_MATCHES;
}

function compareWinRateRank(
  a: { winRate: number | null; totalMatches: number; playerId?: number },
  b: { winRate: number | null; totalMatches: number; playerId?: number }
): number {
  const aRanked = isRankedStat(a);
  const bRanked = isRankedStat(b);
  if (aRanked !== bRanked) return aRanked ? -1 : 1;
  if (a.winRate !== null && b.winRate !== null && a.winRate !== b.winRate) {
    return b.winRate - a.winRate;
  }
  if (a.winRate !== null && b.winRate === null) return -1;
  if (a.winRate === null && b.winRate !== null) return 1;
  if (a.totalMatches !== b.totalMatches) return b.totalMatches - a.totalMatches;
  return (a.playerId ?? 0) - (b.playerId ?? 0);
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
 * 特定の選手の直接対決成績を計算
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
    if (a.winRate !== null && b.winRate !== null && a.winRate !== b.winRate) {
      return b.winRate - a.winRate;
    }
    if (a.winRate !== null && b.winRate === null) return -1;
    if (a.winRate === null && b.winRate !== null) return 1;
    return b.totalMatches - a.totalMatches;
  });
}

/** 3試合以上の相手から相性◎と苦手を選ぶ。同じ人ならどちらも出さない。 */
export function pickMatchupHighlights(records: HeadToHeadRecord[]): {
  favorable: HeadToHeadRecord | null;
  unfavorable: HeadToHeadRecord | null;
} {
  const eligible = records.filter(
    (record) =>
      record.totalMatches >= MIN_HIGHLIGHT_MATCHES && record.winRate !== null
  );
  if (eligible.length === 0) {
    return { favorable: null, unfavorable: null };
  }
  const favorable = eligible.reduce((best, record) =>
    record.winRate! > best.winRate! ? record : best
  );
  const unfavorable = eligible.reduce((worst, record) =>
    record.winRate! < worst.winRate! ? record : worst
  );
  if (favorable.opponentId === unfavorable.opponentId) {
    return { favorable: null, unfavorable: null };
  }
  return {
    favorable: favorable.winRate! > 0 ? favorable : null,
    unfavorable: unfavorable.winRate! < 1 ? unfavorable : null,
  };
}

/** 参加したラウンドに対する出場率。来た回数の合計では比べない。 */
export interface ParticipationRecord {
  playerId: number;
  played: number;
  rested: number;
  /** コートか休憩に入ったラウンド数 */
  rounds: number;
  /** 0〜1。参加ラウンドが無い人は null */
  playRate: number | null;
}

export interface ParticipationBalance {
  records: ParticipationRecord[];
  /** 参加ラウンドがある人の出場率（0〜1） */
  rateMax: number;
  rateMin: number;
  /** 最大と最小の差。100ポイント満点 */
  rateSpreadPoints: number;
  /** 人数とコート数の余りだけで生じる差。これを超えた分だけ警告する */
  theoreticalSpreadPoints: number;
  /**
   * 練習ごとの、最後までいた人の差から理論値を引いた値の最大。
   * 各人が5ラウンド未満の練習や、途中参加・早退の人は警告に入れない。合計はしない。
   */
  warningExcessPoints: number;
  /** 5ラウンド以上の練習があり、最後までいた人を比べられたとき true */
  participationJudged: boolean;
}

function emptyParticipation(): ParticipationBalance {
  return {
    records: [],
    rateMax: 0,
    rateMin: 0,
    rateSpreadPoints: 0,
    theoreticalSpreadPoints: 0,
    warningExcessPoints: 0,
    participationJudged: false,
  };
}

const MIN_ROUNDS_FOR_WARNING = 5;

function spreadPoints(rates: number[]): number {
  if (rates.length === 0) return 0;
  return Math.round((Math.max(...rates) - Math.min(...rates)) * 100);
}

function theoreticalRateMap(rounds: Round[]): Map<number, number> {
  const played = new Map<number, number>();
  const rested = new Map<number, number>();
  for (const round of rounds) {
    const ids = new Set<number>();
    for (const court of round.courts) {
      for (const id of [...court.pairA, ...court.pairB]) ids.add(id);
    }
    for (const id of round.rests) ids.add(id);
    const list = Array.from(ids);
    if (list.length === 0) continue;
    const restCount = Math.min(round.rests.length, list.length);
    const ranked = [...list].sort(
      (a, b) =>
        rateOf(played, rested, b) - rateOf(played, rested, a) ||
        (played.get(b) ?? 0) - (played.get(a) ?? 0) ||
        a - b
    );
    const resting = new Set(ranked.slice(0, restCount));
    for (const id of list) {
      if (resting.has(id)) {
        rested.set(id, (rested.get(id) ?? 0) + 1);
        if (!played.has(id)) played.set(id, 0);
      } else {
        played.set(id, (played.get(id) ?? 0) + 1);
        if (!rested.has(id)) rested.set(id, 0);
      }
    }
  }
  const rates = new Map<number, number>();
  played.forEach((_, id) => {
    rates.set(id, rateOf(played, rested, id));
  });
  return rates;
}

function rateOf(playedMap: Map<number, number>, restedMap: Map<number, number>, id: number): number {
  const playedCount = playedMap.get(id) ?? 0;
  const restedCount = restedMap.get(id) ?? 0;
  const total = playedCount + restedCount;
  return total === 0 ? 0 : playedCount / total;
}

/** 休憩枠をできるだけ均等に配ったときの出場率の差。 */
function theoreticalSpreadPoints(rounds: Round[]): number {
  return spreadPoints(Array.from(theoreticalRateMap(rounds).values()));
}

function appearanceRows(rounds: Round[]): Map<number, { played: number; rested: number }> {
  const rows = new Map<number, { played: number; rested: number }>();
  for (const round of rounds) {
    const seen = new Set<number>();
    const add = (id: number, played: boolean) => {
      if (seen.has(id)) return;
      seen.add(id);
      const row = rows.get(id) ?? { played: 0, rested: 0 };
      if (played) row.played += 1;
      else row.rested += 1;
      rows.set(id, row);
    };
    for (const court of round.courts) {
      for (const id of [...court.pairA, ...court.pairB]) add(id, true);
    }
    for (const id of round.rests) add(id, false);
  }
  return rows;
}

/**
 * その練習で最初から最後までいた人だけの差。
 * ラウンドが少ないとき、途中参加、早退は警告にしない。
 */
function fullAttendanceIds(rounds: Round[]): number[] {
  const rows = appearanceRows(rounds);
  return Array.from(rows.entries())
    .filter(([, row]) => row.played + row.rested === rounds.length)
    .map(([id]) => id);
}

function canJudgeParticipation(rounds: Round[]): boolean {
  return (
    rounds.length >= MIN_ROUNDS_FOR_WARNING && fullAttendanceIds(rounds).length >= 2
  );
}

function participationWarningExcess(rounds: Round[]): number {
  if (!canJudgeParticipation(rounds)) return 0;
  const rows = appearanceRows(rounds);
  const fullIds = fullAttendanceIds(rounds);
  const observed = fullIds.map((id) => {
    const row = rows.get(id);
    const total = (row?.played ?? 0) + (row?.rested ?? 0);
    return total === 0 ? 0 : (row?.played ?? 0) / total;
  });
  const theoretical = theoreticalRateMap(rounds);
  const cohort = fullIds
    .map((id) => theoretical.get(id))
    .filter((rate): rate is number => rate != null);
  if (cohort.length < 2) return 0;
  return Math.max(0, spreadPoints(observed) - spreadPoints(cohort));
}

/**
 * その人が入ったラウンドだけを分母に、出場率の差を出す。
 * 途中から来た人の「来た回数」は比べない。
 */
export function calculateParticipationBalance(
  sessions: PracticeSession[],
  currentRounds: Round[]
): ParticipationBalance {
  const played = new Map<number, number>();
  const rested = new Map<number, number>();

  const addPlayed = (id: number) => {
    played.set(id, (played.get(id) ?? 0) + 1);
    if (!rested.has(id)) rested.set(id, 0);
  };
  const addRested = (id: number) => {
    rested.set(id, (rested.get(id) ?? 0) + 1);
    if (!played.has(id)) played.set(id, 0);
  };

  const consume = (rounds: Round[]) => {
    for (const round of rounds) {
      for (const court of round.courts) {
        for (const id of [...court.pairA, ...court.pairB]) addPlayed(id);
      }
      for (const id of round.rests) addRested(id);
    }
  };

  for (const session of sessions) consume(session.rounds);
  consume(currentRounds);
  const allRounds = [
    ...sessions.flatMap((session) => session.rounds),
    ...currentRounds,
  ];
  const warningChunks = sessions.map((session) => session.rounds);
  if (currentRounds.length > 0) warningChunks.push(currentRounds);
  let warningExcessPoints = 0;
  let participationJudged = false;
  for (const chunk of warningChunks) {
    if (canJudgeParticipation(chunk)) participationJudged = true;
    warningExcessPoints = Math.max(warningExcessPoints, participationWarningExcess(chunk));
  }

  const records: ParticipationRecord[] = Array.from(played.keys()).map(
    (playerId) => {
      const playedCount = played.get(playerId) ?? 0;
      const restedCount = rested.get(playerId) ?? 0;
      const rounds = playedCount + restedCount;
      return {
        playerId,
        played: playedCount,
        rested: restedCount,
        rounds,
        playRate: rounds > 0 ? playedCount / rounds : null,
      };
    }
  );

  const rated = records.filter(
    (record): record is ParticipationRecord & { playRate: number } =>
      record.playRate != null
  );
  if (rated.length === 0) return emptyParticipation();

  records.sort(
    (a, b) =>
      (a.playRate ?? 1) - (b.playRate ?? 1) || a.playerId - b.playerId
  );

  const rates = rated.map((record) => record.playRate);
  const rateMax = Math.max(...rates);
  const rateMin = Math.min(...rates);

  return {
    records,
    rateMax,
    rateMin,
    rateSpreadPoints: Math.round((rateMax - rateMin) * 100),
    theoreticalSpreadPoints: theoreticalSpreadPoints(allRounds),
    warningExcessPoints,
    participationJudged,
  };
}

/**
 * ラウンド集合から、同一コートでチームメイトになった回数（メンバーID昇順の "a-b" キー）
 */
export function countPairOccurrencesInRounds(rounds: Round[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const round of rounds) {
    for (const court of round.courts) {
      for (const pair of [court.pairA, court.pairB] as const) {
        const sorted = [pair[0], pair[1]]
          .filter((id): id is number => id !== undefined)
          .sort((a, b) => a - b);
        if (sorted.length === 2) {
          const key = `${sorted[0]}-${sorted[1]}`;
          counts.set(key, (counts.get(key) || 0) + 1);
        }
      }
    }
  }
  return counts;
}

/**
 * ラウンド集合から、ネットを挟んで対戦した回数（メンバーID昇順の "a-b" キー）
 */
export function countOpponentOccurrencesInRounds(
  rounds: Round[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const round of rounds) {
    for (const court of round.courts) {
      for (const player1 of court.pairA) {
        for (const player2 of court.pairB) {
          const key = `${Math.min(player1, player2)}-${Math.max(player1, player2)}`;
          counts.set(key, (counts.get(key) || 0) + 1);
        }
      }
    }
  }
  return counts;
}
