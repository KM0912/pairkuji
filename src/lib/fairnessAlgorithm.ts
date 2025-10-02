import type { PlayerStats } from '@/types/stats';
import type { CourtMatch, Round } from '@/types/round';
import type { PracticePlayer } from '@/types/practice';

// ペア・対戦の再登場に重み付けを行う定数
const MAX_RECENT_RECORDS = 5;
const PARTNER_PENALTY_BASE = 30;
const PARTNER_PENALTY_DECAY = 6;
const PARTNER_PENALTY_MIN = 6;
const OPPONENT_PENALTY_BASE = 12;
const OPPONENT_PENALTY_DECAY = 3;
const OPPONENT_PENALTY_MIN = 2;
const PAIR_SELECTION_ATTEMPTS = 6;
const RESTRICTED_PARTNER_CANDIDATES = 3;
const COURT_MATCH_JITTER = 0.001;

// 休憩者選定評価の重み付け
const REST_CANDIDATE_BUFFER = 4;
const PLAYED_VARIANCE_WEIGHT = 320;
const PLAYED_RANGE_WEIGHT = 140;
const REST_VARIANCE_WEIGHT = 28;
const REST_RANGE_WEIGHT = 18;
const LOW_PLAYED_REST_PENALTY = 90;
const CONSECUTIVE_REST_PENALTY = 180;
const RECENT_OVERLAP_PENALTY = 36;
const OLDER_OVERLAP_PENALTY = 16;
const REPEAT_SET_PENALTY = 220;
const REST_SELECTION_JITTER = 0.0001;

type Pair = [number, number];

interface RestSelectionContext {
  playerIds: number[];
  stats: Map<number, PlayerStats>;
  basePlayedMap: Map<number, number>;
  baseRestMap: Map<number, number>;
  minPlayed: number;
  maxPlayed: number;
  minRest: number;
  currentRestStreaks: Map<number, number>;
  lastRestSet: Set<number>;
  prevRestSet: Set<number>;
  olderRestSet: Set<number>;
  consecutivePenaltyMultiplier: number;
  recentOverlapMultiplier: number;
  olderOverlapMultiplier: number;
}

function shuffle<T>(input: T[]): T[] {
  const array = [...input];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j]!, array[i]!];
  }
  return array;
}

// 休憩候補の偏りスコア計算に使用する分散値
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) /
    values.length;
  return variance;
}

function pushRecent(list: number[], value: number | undefined) {
  if (value === undefined) return;
  list.push(value);
  if (list.length > MAX_RECENT_RECORDS) list.shift();
}

function calculateRecencyPenalty(
  history: number[] | undefined,
  target: number,
  base: number,
  decay: number,
  minimum: number
): number {
  if (!history || history.length === 0) return 0;
  const index = history.lastIndexOf(target);
  if (index === -1) return 0;
  const distanceFromEnd = history.length - index; // 1 = most recent
  const penalty = base - (distanceFromEnd - 1) * decay;
  return Math.max(penalty, minimum);
}

function computePairPenalty(
  a: number,
  b: number,
  stats: Map<number, PlayerStats>
): number {
  const statA = stats.get(a);
  const statB = stats.get(b);
  const penaltyA = calculateRecencyPenalty(
    statA?.recentPartners,
    b,
    PARTNER_PENALTY_BASE,
    PARTNER_PENALTY_DECAY,
    PARTNER_PENALTY_MIN
  );
  const penaltyB = calculateRecencyPenalty(
    statB?.recentPartners,
    a,
    PARTNER_PENALTY_BASE,
    PARTNER_PENALTY_DECAY,
    PARTNER_PENALTY_MIN
  );
  return penaltyA + penaltyB;
}

function computeMatchPenalty(
  pairA: Pair,
  pairB: Pair,
  stats: Map<number, PlayerStats>
): number {
  let penalty = 0;

  pairA.forEach((playerA) => {
    const statA = stats.get(playerA);
    pairB.forEach((playerB) => {
      penalty += calculateRecencyPenalty(
        statA?.recentOpponents,
        playerB,
        OPPONENT_PENALTY_BASE,
        OPPONENT_PENALTY_DECAY,
        OPPONENT_PENALTY_MIN
      );
    });
  });

  pairB.forEach((playerB) => {
    const statB = stats.get(playerB);
    pairA.forEach((playerA) => {
      penalty += calculateRecencyPenalty(
        statB?.recentOpponents,
        playerA,
        OPPONENT_PENALTY_BASE,
        OPPONENT_PENALTY_DECAY,
        OPPONENT_PENALTY_MIN
      );
    });
  });

  return penalty;
}

function buildRestSelectionContext(
  players: PracticePlayer[],
  stats: Map<number, PlayerStats>,
  rounds: Round[],
  totalPlayersNeeded: number
): RestSelectionContext {
  const playerIds = players.map((player) => player.memberId);

  const recentRestSets = rounds
    .slice(-3)
    .map((round) => new Set<number>(round.rests));
  const lastRestSet =
    recentRestSets[recentRestSets.length - 1] ?? new Set<number>();
  const prevRestSet =
    recentRestSets[recentRestSets.length - 2] ?? new Set<number>();
  const olderRestSet =
    recentRestSets[recentRestSets.length - 3] ?? new Set<number>();

  const currentRestStreaks = new Map<number, number>();
  playerIds.forEach((id) => {
    let streak = 0;
    for (let i = rounds.length - 1; i >= 0; i--) {
      const round = rounds[i];
      if (!round?.rests?.length) break;
      if (round.rests.includes(id)) {
        streak++;
      } else {
        break;
      }
    }
    currentRestStreaks.set(id, streak);
  });

  const basePlayedMap = new Map<number, number>();
  const baseRestMap = new Map<number, number>();
  const playedCounts: number[] = [];
  const restCounts: number[] = [];

  playerIds.forEach((id) => {
    const played = stats.get(id)?.playedCount ?? 0;
    const rest = stats.get(id)?.restCount ?? 0;
    basePlayedMap.set(id, played);
    baseRestMap.set(id, rest);
    playedCounts.push(played);
    restCounts.push(rest);
  });

  const minPlayed = Math.min(...playedCounts);
  const maxPlayed = Math.max(...playedCounts);
  const minRest = Math.min(...restCounts);

  const totalCapacity = totalPlayersNeeded || 1;
  const participationRatio = players.length / totalCapacity;
  const isDoubleCapacity = players.length === totalCapacity * 2;
  const allPlayedEqual = playedCounts.every(
    (count) => count === playedCounts[0]
  );
  const allowConsecutiveRest =
    participationRatio > 1.5 && (!isDoubleCapacity || allPlayedEqual);

  const consecutivePenaltyMultiplier = allowConsecutiveRest ? 0 : 1;
  const recentOverlapMultiplier = allowConsecutiveRest ? 0 : 1;
  const olderOverlapMultiplier = allowConsecutiveRest ? 0 : 1;

  return {
    playerIds,
    stats,
    basePlayedMap,
    baseRestMap,
    minPlayed,
    maxPlayed,
    minRest,
    currentRestStreaks,
    lastRestSet,
    prevRestSet,
    olderRestSet,
    consecutivePenaltyMultiplier,
    recentOverlapMultiplier,
    olderOverlapMultiplier,
  };
}

function collectRestCandidates(
  players: PracticePlayer[],
  restSlots: number,
  context: RestSelectionContext
): number[] {
  const { stats, lastRestSet, prevRestSet, maxPlayed, minRest } = context;

  const sortedByPriority = [...players].sort((a, b) => {
    const statA = stats.get(a.memberId);
    const statB = stats.get(b.memberId);
    const playedA = statA?.playedCount ?? 0;
    const playedB = statB?.playedCount ?? 0;
    if (playedA !== playedB) return playedB - playedA;

    const restA = statA?.restCount ?? 0;
    const restB = statB?.restCount ?? 0;
    if (restA !== restB) return restA - restB;

    const inLastA = lastRestSet.has(a.memberId) ? 1 : 0;
    const inLastB = lastRestSet.has(b.memberId) ? 1 : 0;
    if (inLastA !== inLastB) return inLastA - inLastB;

    const inPrevA = prevRestSet.has(a.memberId) ? 1 : 0;
    const inPrevB = prevRestSet.has(b.memberId) ? 1 : 0;
    if (inPrevA !== inPrevB) return inPrevA - inPrevB;

    return a.memberId - b.memberId;
  });

  const basePoolSize = Math.max(
    restSlots + REST_CANDIDATE_BUFFER,
    Math.ceil(players.length / 2)
  );
  const candidateIdsSet = new Set<number>();

  sortedByPriority
    .slice(0, Math.min(players.length, basePoolSize))
    .forEach((player) => {
      candidateIdsSet.add(player.memberId);
    });

  players.forEach((player) => {
    const played = context.basePlayedMap.get(player.memberId) ?? 0;
    if (played >= maxPlayed) {
      candidateIdsSet.add(player.memberId);
    }
    const rest = context.baseRestMap.get(player.memberId) ?? 0;
    if (rest <= minRest) {
      candidateIdsSet.add(player.memberId);
    }
  });

  const candidateIds = Array.from(candidateIdsSet);
  if (candidateIds.length < restSlots) {
    candidateIds.push(
      ...players
        .map((player) => player.memberId)
        .filter((id) => !candidateIdsSet.has(id))
        .slice(0, restSlots - candidateIds.length)
    );
  }

  return Array.from(new Set(candidateIds)).sort((a, b) => a - b);
}

function scoreRestCombination(
  restCombo: number[],
  context: RestSelectionContext
): number {
  const restSet = new Set(restCombo);
  const predictedPlayed: number[] = [];
  const predictedRest: number[] = [];
  let maxPredictedPlayed = Number.NEGATIVE_INFINITY;
  let minPredictedPlayed = Number.POSITIVE_INFINITY;
  let maxPredictedRest = Number.NEGATIVE_INFINITY;
  let minPredictedRest = Number.POSITIVE_INFINITY;
  let score = 0;

  context.playerIds.forEach((id) => {
    const basePlayedCount = context.basePlayedMap.get(id) ?? 0;
    const baseRestCount = context.baseRestMap.get(id) ?? 0;
    const willRest = restSet.has(id);
    const predictedPlayedCount = willRest
      ? basePlayedCount
      : basePlayedCount + 1;
    const predictedRestCount = willRest ? baseRestCount + 1 : baseRestCount;

    predictedPlayed.push(predictedPlayedCount);
    predictedRest.push(predictedRestCount);

    maxPredictedPlayed = Math.max(maxPredictedPlayed, predictedPlayedCount);
    minPredictedPlayed = Math.min(minPredictedPlayed, predictedPlayedCount);
    maxPredictedRest = Math.max(maxPredictedRest, predictedRestCount);
    minPredictedRest = Math.min(minPredictedRest, predictedRestCount);

    if (willRest) {
      if (basePlayedCount === context.minPlayed) {
        score += LOW_PLAYED_REST_PENALTY;
      }

      const currentStreak = context.currentRestStreaks.get(id) ?? 0;
      const predictedStreak = currentStreak + 1;
      if (predictedStreak >= 2) {
        score +=
          CONSECUTIVE_REST_PENALTY *
          (predictedStreak - 1) *
          context.consecutivePenaltyMultiplier;
      }

      if (context.prevRestSet.has(id)) {
        score += RECENT_OVERLAP_PENALTY * context.recentOverlapMultiplier;
      }

      if (context.olderRestSet.has(id)) {
        score += OLDER_OVERLAP_PENALTY * context.olderOverlapMultiplier;
      }
    }
  });

  const playedVariance = calculateVariance(predictedPlayed);
  const restVariance = calculateVariance(predictedRest);
  const playedRange = maxPredictedPlayed - minPredictedPlayed;
  const restRange = maxPredictedRest - minPredictedRest;

  score += playedVariance * PLAYED_VARIANCE_WEIGHT;
  score += playedRange * PLAYED_RANGE_WEIGHT;
  score += restVariance * REST_VARIANCE_WEIGHT;
  score += restRange * REST_RANGE_WEIGHT;

  const matchesLast =
    restCombo.length === context.lastRestSet.size &&
    restCombo.every((id) => context.lastRestSet.has(id));
  if (matchesLast) {
    score += REPEAT_SET_PENALTY * 4;
  }

  const matchesPrev =
    restCombo.length === context.prevRestSet.size &&
    restCombo.every((id) => context.prevRestSet.has(id));
  if (matchesPrev) {
    score += REPEAT_SET_PENALTY;
  }

  const matchesOlder =
    restCombo.length === context.olderRestSet.size &&
    restCombo.every((id) => context.olderRestSet.has(id));
  if (matchesOlder) {
    score += REPEAT_SET_PENALTY / 2;
  }

  score += Math.random() * REST_SELECTION_JITTER;

  return score;
}

function findBestRestCombination(
  candidateIds: number[],
  restSlots: number,
  context: RestSelectionContext
): number[] | null {
  let bestRestCombo: number[] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  const combinationBuffer: number[] = [];

  const backtrack = (start: number) => {
    if (combinationBuffer.length === restSlots) {
      const currentScore = scoreRestCombination(combinationBuffer, context);
      if (currentScore < bestScore) {
        bestScore = currentScore;
        bestRestCombo = [...combinationBuffer];
      }
      return;
    }

    const remainingSlots = restSlots - combinationBuffer.length;
    for (let i = start; i <= candidateIds.length - remainingSlots; i++) {
      combinationBuffer.push(candidateIds[i]!);
      backtrack(i + 1);
      combinationBuffer.pop();
    }
  };

  backtrack(0);

  return bestRestCombo;
}

function selectRestPlayers(
  players: PracticePlayer[],
  stats: Map<number, PlayerStats>,
  totalPlayersNeeded: number,
  rounds: Round[]
): { playing: PracticePlayer[]; restIds: number[] } {
  const restSlots = Math.max(players.length - totalPlayersNeeded, 0);
  if (restSlots === 0) {
    return { playing: players, restIds: [] };
  }

  const context = buildRestSelectionContext(
    players,
    stats,
    rounds,
    totalPlayersNeeded
  );

  const candidateIds = collectRestCandidates(players, restSlots, context);
  const bestRestCombo =
    findBestRestCombination(candidateIds, restSlots, context) ??
    [...context.playerIds]
      .sort((a, b) => {
        const playedA = context.basePlayedMap.get(a) ?? 0;
        const playedB = context.basePlayedMap.get(b) ?? 0;
        if (playedA !== playedB) return playedB - playedA;
        const restA = context.baseRestMap.get(a) ?? 0;
        const restB = context.baseRestMap.get(b) ?? 0;
        if (restA !== restB) return restA - restB;
        return a - b;
      })
      .slice(0, restSlots);

  const restIdSet = new Set(bestRestCombo);
  const playing = players.filter((player) => !restIdSet.has(player.memberId));
  const restIds = Array.from(restIdSet).sort((a, b) => a - b);

  return { playing, restIds };
}

function buildPairs(
  playerIds: number[],
  stats: Map<number, PlayerStats>
): Pair[] {
  if (playerIds.length % 2 !== 0) {
    throw new Error('Number of players must be even to form pairs.');
  }

  // 試合数が少ない順にソートしつつ、後段の試行でランダマイズ
  const byNeed = [...playerIds].sort((a, b) => {
    const playedA = stats.get(a)?.playedCount ?? 0;
    const playedB = stats.get(b)?.playedCount ?? 0;
    if (playedA !== playedB) return playedA - playedB;
    return a - b;
  });

  const totalPairsNeeded = playerIds.length / 2;
  let bestPairs: Pair[] = [];
  let bestScore = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < PAIR_SELECTION_ATTEMPTS; attempt++) {
    const ordering = attempt === 0 ? [...byNeed] : shuffle(byNeed);
    const unused = new Set(ordering);
    const attemptPairs: Pair[] = [];
    let attemptScore = 0;

    while (unused.size > 0) {
      const base = ordering.find((id) => unused.has(id));
      if (base === undefined) break;

      const others = Array.from(unused).filter((id) => id !== base);
      if (others.length === 0) break;

      const candidates = others
        .map((partnerId) => {
          const cost = computePairPenalty(base, partnerId, stats);
          return {
            partnerId,
            cost,
            orderScore: cost + Math.random() * 0.01,
          };
        })
        .sort((a, b) => a.orderScore - b.orderScore);

      const pickableCount = Math.max(
        1,
        Math.min(RESTRICTED_PARTNER_CANDIDATES, candidates.length)
      );
      const candidatePool = candidates.slice(0, pickableCount);
      const chosen =
        candidatePool[Math.floor(Math.random() * candidatePool.length)];
      if (!chosen) break;

      const pair = [base, chosen.partnerId].sort((x, y) => x - y) as Pair;
      attemptPairs.push(pair);
      attemptScore += chosen.cost;
      unused.delete(base);
      unused.delete(chosen.partnerId);
    }

    if (attemptPairs.length === totalPairsNeeded && attemptScore < bestScore) {
      bestScore = attemptScore;
      bestPairs = attemptPairs.map((pair) => [...pair] as Pair);
    }
  }

  if (bestPairs.length === 0) {
    // フォールバック: ソート順そのままに隣接でペアリング
    const fallback: Pair[] = [];
    const ordered = [...playerIds];
    for (let i = 0; i < ordered.length; i += 2) {
      const pair = [ordered[i]!, ordered[i + 1]!].sort((a, b) => a - b) as Pair;
      fallback.push(pair);
    }
    return fallback;
  }

  return bestPairs;
}

function buildCourtsFromPairs(
  pairs: Pair[],
  stats: Map<number, PlayerStats>
): CourtMatch[] {
  if (pairs.length % 2 !== 0) {
    throw new Error('Pair count must be even to form courts.');
  }
  if (pairs.length === 0) return [];

  let bestScore = Number.POSITIVE_INFINITY;
  let bestArrangement: Array<{ pairA: Pair; pairB: Pair }> = [];

  // ペア同士の組み合わせをバックトラックで探索し最小コストを求める
  const search = (
    remaining: number[],
    current: Array<{ pairA: Pair; pairB: Pair }>,
    score: number
  ) => {
    if (remaining.length === 0) {
      if (score < bestScore) {
        bestScore = score;
        bestArrangement = current.map((assignment) => ({
          pairA: [...assignment.pairA] as Pair,
          pairB: [...assignment.pairB] as Pair,
        }));
      }
      return;
    }

    const [firstIndex, ...rest] = remaining;
    for (let i = 0; i < rest.length; i++) {
      const secondIndex = rest[i]!;
      const pairA = pairs[firstIndex!]!;
      const pairB = pairs[secondIndex]!;
      const matchPenalty = computeMatchPenalty(pairA, pairB, stats);
      const jitter = Math.random() * COURT_MATCH_JITTER;
      const nextScore = score + matchPenalty + jitter;
      if (nextScore >= bestScore) continue;

      const nextRemaining = rest.slice(0, i).concat(rest.slice(i + 1));
      search(nextRemaining, [...current, { pairA, pairB }], nextScore);
    }
  };

  search(
    pairs.map((_, index) => index),
    [],
    0
  );

  if (bestArrangement.length === 0) {
    // 最適化に失敗した場合は順番通りに割り当て
    const fallback: CourtMatch[] = [];
    for (let i = 0; i < pairs.length; i += 2) {
      fallback.push({
        courtNo: i / 2 + 1,
        pairA: pairs[i]!,
        pairB: pairs[i + 1]!,
      });
    }
    return fallback;
  }

  return bestArrangement.map((assignment, index) => ({
    courtNo: index + 1,
    pairA: assignment.pairA,
    pairB: assignment.pairB,
  }));
}

export function calculatePlayerStats(
  playerIds: number[],
  rounds: Round[],
  playedOffsets?: Map<number, number>
): Map<number, PlayerStats> {
  const stats = new Map<number, PlayerStats>();

  playerIds.forEach((id) => {
    const offset = playedOffsets?.get(id) ?? 0;
    stats.set(id, {
      playerId: id,
      playedCount: offset,
      restCount: 0,
      consecRest: 0,
      recentPartners: [],
      recentOpponents: [],
    });
  });

  const currentRestStreak = new Map<number, number>();
  playerIds.forEach((id) => currentRestStreak.set(id, 0));

  // ラウンドを時系列で辿り統計情報を更新
  rounds.forEach((round) => {
    const playing = new Set<number>();

    round.courts.forEach((court) => {
      const [a1, a2] = court.pairA;
      const [b1, b2] = court.pairB;
      const participants = [a1, a2, b1, b2].filter(
        (id) => id !== undefined
      ) as number[];

      participants.forEach((playerId) => {
        const stat = stats.get(playerId);
        if (!stat) return;
        stat.playedCount += 1;
        currentRestStreak.set(playerId, 0);
        playing.add(playerId);
      });

      if (a1 !== undefined && a2 !== undefined) {
        const stat1 = stats.get(a1);
        const stat2 = stats.get(a2);
        if (stat1) pushRecent(stat1.recentPartners, a2);
        if (stat2) pushRecent(stat2.recentPartners, a1);
      }

      if (b1 !== undefined && b2 !== undefined) {
        const stat1 = stats.get(b1);
        const stat2 = stats.get(b2);
        if (stat1) pushRecent(stat1.recentPartners, b2);
        if (stat2) pushRecent(stat2.recentPartners, b1);
      }

      const teamA = [a1, a2].filter((id) => id !== undefined) as number[];
      const teamB = [b1, b2].filter((id) => id !== undefined) as number[];

      teamA.forEach((playerId) => {
        const stat = stats.get(playerId);
        if (!stat) return;
        teamB.forEach((opponentId) => {
          pushRecent(stat.recentOpponents, opponentId);
        });
      });

      teamB.forEach((playerId) => {
        const stat = stats.get(playerId);
        if (!stat) return;
        teamA.forEach((opponentId) => {
          pushRecent(stat.recentOpponents, opponentId);
        });
      });
    });

    playerIds.forEach((id) => {
      if (playing.has(id)) return;
      const stat = stats.get(id);
      if (!stat) return;
      stat.restCount += 1;
      const nextRest = (currentRestStreak.get(id) ?? 0) + 1;
      currentRestStreak.set(id, nextRest);
      stat.consecRest = Math.max(stat.consecRest, nextRest);
    });
  });

  return stats;
}

export function generateFairRound(
  activePlayers: PracticePlayer[],
  maxCourts: number,
  rounds: Round[]
): { courts: CourtMatch[]; rests: number[] } {
  if (activePlayers.length < 4) {
    return {
      courts: [],
      rests: activePlayers.map((player) => player.memberId),
    };
  }

  // 特例: 4人1コートは3パターンを固定順序で繰り返す
  // パターン: [1-2|3-4] → [1-3|2-4] → [1-4|2-3]
  if (activePlayers.length === 4 && maxCourts >= 1) {
    const ids = activePlayers.map((p) => p.memberId).sort((a, b) => a - b);
    const [p1, p2, p3, p4] = ids as [number, number, number, number];
    const patternIndex = rounds.length % 3;
    const courts: CourtMatch[] = [
      {
        courtNo: 1,
        pairA:
          patternIndex === 0
            ? [p1, p2]
            : patternIndex === 1
              ? [p1, p3]
              : [p1, p4],
        pairB:
          patternIndex === 0
            ? [p3, p4]
            : patternIndex === 1
              ? [p2, p4]
              : [p2, p3],
      },
    ];
    return { courts, rests: [] };
  }

  const playerIds = activePlayers.map((player) => player.memberId);
  const offsets = new Map<number, number>();
  activePlayers.forEach((player) => {
    const offset = player.playedOffset ?? 0;
    offsets.set(player.memberId, offset > 0 ? offset - 1 : 0);
  });

  // 既存ラウンドと途中参加補正から現在の統計値を再計算
  const playerStats = calculatePlayerStats(playerIds, rounds, offsets);
  const courtsToUse = Math.min(maxCourts, Math.floor(activePlayers.length / 4));

  if (courtsToUse === 0) {
    return { courts: [], rests: playerIds.sort((a, b) => a - b) };
  }

  const totalPlayersNeeded = courtsToUse * 4;
  // 休憩→ペア→コートの順で最適化を進める
  const { playing, restIds } = selectRestPlayers(
    activePlayers,
    playerStats,
    totalPlayersNeeded,
    rounds
  );
  const playingIds = playing.map((player) => player.memberId);
  const pairs = buildPairs(playingIds, playerStats);
  const courts = buildCourtsFromPairs(pairs, playerStats);

  return { courts, rests: restIds };
}
