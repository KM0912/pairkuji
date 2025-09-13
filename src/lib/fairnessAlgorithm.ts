import type { PlayerStats, FairnessScore } from '@/types/stats';
import type { CourtMatch, Round } from '@/types/round';
import type { PracticePlayer } from '@/types/practice';

// 分散を計算する関数
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    values.length;
  return variance;
}

// 配列をシャッフルする関数
function shuffle<T>(arr: T[]): T[] {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j]!, array[i]!];
  }
  return array;
}

// 過去のラウンドから統計を計算
export function calculatePlayerStats(
  playerIds: number[],
  rounds: Round[]
): Map<number, PlayerStats> {
  const stats = new Map<number, PlayerStats>();

  // 初期化
  playerIds.forEach((id) => {
    stats.set(id, {
      playerId: id,
      playedCount: 0,
      restCount: 0,
      consecRest: 0,
      recentPartners: [],
      recentOpponents: [],
    });
  });

  const currentConsecRest = new Map<number, number>();
  playerIds.forEach((id) => currentConsecRest.set(id, 0));

  // ラウンドを順番に処理
  rounds.forEach((round) => {
    const playingPlayers = new Set<number>();
    const restingPlayers = new Set(round.rests);

    // コートの処理
    round.courts.forEach((court) => {
      [...court.pairA, ...court.pairB].forEach((id) => {
        playingPlayers.add(id);
        const stat = stats.get(id);
        if (stat) {
          stat.playedCount++;
          // 連続休憩リセット
          currentConsecRest.set(id, 0);
        }
      });

      // パートナー関係を記録
      const [a1, a2] = court.pairA;
      const [b1, b2] = court.pairB;

      if (a1 !== undefined && a2 !== undefined) {
        const stat1 = stats.get(a1);
        const stat2 = stats.get(a2);
        if (stat1) {
          stat1.recentPartners.push(a2);
          if (stat1.recentPartners.length > 5) stat1.recentPartners.shift();
        }
        if (stat2) {
          stat2.recentPartners.push(a1);
          if (stat2.recentPartners.length > 5) stat2.recentPartners.shift();
        }
      }

      if (b1 !== undefined && b2 !== undefined) {
        const stat1 = stats.get(b1);
        const stat2 = stats.get(b2);
        if (stat1) {
          stat1.recentPartners.push(b2);
          if (stat1.recentPartners.length > 5) stat1.recentPartners.shift();
        }
        if (stat2) {
          stat2.recentPartners.push(b1);
          if (stat2.recentPartners.length > 5) stat2.recentPartners.shift();
        }
      }

      // 対戦相手関係を記録
      [...court.pairA, ...court.pairB].forEach((playerId) => {
        const opponents =
          playerId === a1 || playerId === a2
            ? [...court.pairB]
            : [...court.pairA];

        const stat = stats.get(playerId);
        if (stat) {
          opponents.forEach((opponentId) => {
            if (opponentId !== undefined && opponentId !== playerId) {
              stat.recentOpponents.push(opponentId);
              if (stat.recentOpponents.length > 5) stat.recentOpponents.shift();
            }
          });
        }
      });
    });

    // 休憩者の処理
    playerIds.forEach((id) => {
      if (!playingPlayers.has(id)) {
        const stat = stats.get(id);
        if (stat) {
          stat.restCount++;
          const currentRest = currentConsecRest.get(id) || 0;
          currentConsecRest.set(id, currentRest + 1);
          stat.consecRest = Math.max(stat.consecRest, currentRest + 1);
        }
      }
    });
  });

  return stats;
}

// 組み合わせの公平性スコアを計算
export function calculateFairnessScore(
  courts: CourtMatch[],
  playerStats: Map<number, PlayerStats>
): FairnessScore {
  const playerIds = Array.from(playerStats.keys());
  const activePlayers = courts.flatMap((court) => [
    ...court.pairA,
    ...court.pairB,
  ]);
  const restingPlayers = playerIds.filter((id) => !activePlayers.includes(id));

  // 1. 試合バランス（出場予定者の試合回数分散）
  const playingStats = activePlayers.map(
    (id) => playerStats.get(id)?.playedCount || 0
  );
  const playedVariance = calculateVariance(playingStats);

  // 2. 休憩バランス（休憩予定者の休憩回数分散）
  const restingStats = restingPlayers.map(
    (id) => playerStats.get(id)?.restCount || 0
  );
  const restVariance = calculateVariance(restingStats);

  // 3. 連続休憩ペナルティ
  let consecutiveRestPenalty = 0;
  restingPlayers.forEach((id) => {
    const stat = playerStats.get(id);
    if (stat && stat.consecRest >= 1) {
      consecutiveRestPenalty += Math.max(0, stat.consecRest);
    }
  });

  // 4. ペア重複カウント
  let duplicatePairCount = 0;
  courts.forEach((court) => {
    const pairs = [
      [court.pairA[0], court.pairA[1]],
      [court.pairB[0], court.pairB[1]],
    ];

    pairs.forEach(([p1, p2]) => {
      if (p1 !== undefined && p2 !== undefined) {
        const stat1 = playerStats.get(p1);
        const stat2 = playerStats.get(p2);

        if (stat1?.recentPartners.includes(p2)) duplicatePairCount++;
        if (stat2?.recentPartners.includes(p1)) duplicatePairCount++;
      }
    });
  });

  // 5. 対戦重複カウント
  let duplicateMatchCount = 0;
  courts.forEach((court) => {
    const teamA = court.pairA.filter((id) => id !== undefined);
    const teamB = court.pairB.filter((id) => id !== undefined);

    teamA.forEach((playerId) => {
      const stat = playerStats.get(playerId);
      if (stat) {
        teamB.forEach((opponentId) => {
          if (stat.recentOpponents.includes(opponentId)) {
            duplicateMatchCount++;
          }
        });
      }
    });
  });

  // スコア関数: 試合数バランスを最重要視
  // score = 10 * Var(playedCount) + 2 * Var(restCount) + 4 * Σ max(0, consecRest[p] - 1) + 2 * Σ duplicatePair + 1 * Σ duplicateMatch
  const totalScore =
    10 * playedVariance + // 試合数分散を最重要視（4→10に増加）
    2 * restVariance + // 休憩分散の重要度を下げる（4→2に減少）
    4 * consecutiveRestPenalty + // 連続休憩ペナルティを適度に（6→4に減少）
    2 * duplicatePairCount +
    1 * duplicateMatchCount;

  return {
    playedVariance,
    restVariance,
    consecutiveRestPenalty,
    duplicatePairCount,
    duplicateMatchCount,
    totalScore,
  };
}

// メイン関数：公平な組み合わせを生成
export function generateFairRound(
  activePlayers: PracticePlayer[],
  maxCourts: number,
  rounds: Round[]
): { courts: CourtMatch[]; rests: number[] } {
  if (activePlayers.length < 4) {
    return { courts: [], rests: activePlayers.map((p) => p.memberId) };
  }

  const playerIds = activePlayers.map((p) => p.memberId);
  const playerStats = calculatePlayerStats(playerIds, rounds);

  // 使用可能なコート数を決定
  const courtsToUse = Math.min(maxCourts, Math.floor(activePlayers.length / 4));

  let bestCombination: { courts: CourtMatch[]; rests: number[] } | null = null;
  let bestScore = Infinity;

  // 試合数バランス優先でソート
  const sortedPlayers = [...activePlayers].sort((a, b) => {
    const statA = playerStats.get(a.memberId);
    const statB = playerStats.get(b.memberId);

    const playedA = statA?.playedCount || 0;
    const playedB = statB?.playedCount || 0;
    const restA = statA?.restCount || 0;
    const restB = statB?.restCount || 0;

    // 1. 試合数少ない人を優先（試合数バランスが最優先）
    if (playedA !== playedB) return playedA - playedB;

    // 2. 試合数が同じ場合は休憩多い人を優先
    if (restA !== restB) return restB - restA;

    // 3. 連続休憩を避ける
    const consecA = statA?.consecRest || 0;
    const consecB = statB?.consecRest || 0;
    return consecB - consecA;
  });

  // より柔軟な参加者選択アルゴリズム
  const totalPlayersNeeded = courtsToUse * 4;
  
  // 試合数の統計を分析
  const playedCounts = sortedPlayers.map(p => playerStats.get(p.memberId)?.playedCount || 0);
  const minPlayed = Math.min(...playedCounts);
  const maxPlayed = Math.max(...playedCounts);
  
  // 試合数差が大きい場合は厳格に、小さい場合は柔軟に選択
  const strictSelection = (maxPlayed - minPlayed) >= 2;
  
  let selectedForPlay: PracticePlayer[] = [];
  let restPlayers: number[] = [];
  
  if (strictSelection) {
    // 厳格モード: 試合数最少の人を必ず参加
    for (let i = 0; i < totalPlayersNeeded && i < sortedPlayers.length; i++) {
      const player = sortedPlayers[i];
      if (player) {
        selectedForPlay.push(player);
      }
    }
    restPlayers = playerIds.filter(id => 
      !selectedForPlay.some(p => p.memberId === id)
    );
  } else {
    // 柔軟モード: 試合数バランスを保ちつつ多様性確保
    const candidates = sortedPlayers.filter(p => {
      const played = playerStats.get(p.memberId)?.playedCount || 0;
      return played <= minPlayed + 1; // 最少+1まで許容
    });
    
    if (candidates.length >= totalPlayersNeeded) {
      // 候補者をシャッフルして多様性確保
      const shuffledCandidates = shuffle(candidates);
      selectedForPlay = shuffledCandidates.slice(0, totalPlayersNeeded);
    } else {
      // 候補者不足の場合は全候補者 + 追加選択
      selectedForPlay = [...candidates];
      const remaining = totalPlayersNeeded - candidates.length;
      const others = sortedPlayers.filter(p => !candidates.includes(p));
      selectedForPlay.push(...others.slice(0, remaining));
    }
    
    restPlayers = playerIds.filter(id => 
      !selectedForPlay.some(p => p.memberId === id)
    );
  }

  // 選択された試合参加者内で最適な組み合わせを200回試行
  for (let attempt = 0; attempt < 200; attempt++) {
    try {
      const shuffledPlayers = attempt === 0 ? selectedForPlay : shuffle(selectedForPlay);

      const courts: CourtMatch[] = [];
      let playerIndex = 0;

      // コートを順番に埋める
      for (let courtNo = 1; courtNo <= courtsToUse; courtNo++) {
        if (playerIndex + 3 >= shuffledPlayers.length) break;

        const court: CourtMatch = {
          courtNo,
          pairA: [
            shuffledPlayers[playerIndex]!.memberId,
            shuffledPlayers[playerIndex + 1]!.memberId,
          ],
          pairB: [
            shuffledPlayers[playerIndex + 2]!.memberId,
            shuffledPlayers[playerIndex + 3]!.memberId,
          ],
        };

        courts.push(court);
        playerIndex += 4;
      }

      // 休憩者は事前に決定済み
      const usedPlayers = courts.flatMap((court) => [
        ...court.pairA,
        ...court.pairB,
      ]);
      const rests = restPlayers;

      // スコアを計算
      const score = calculateFairnessScore(courts, playerStats);

      if (score.totalScore < bestScore) {
        bestScore = score.totalScore;
        bestCombination = { courts, rests };
      }
    } catch (error) {
      console.warn('Error in fairness algorithm attempt:', error);
      continue;
    }
  }

  // 最適解が見つからなかった場合のフォールバック（試合数優先）
  if (!bestCombination) {
    const courts: CourtMatch[] = [];
    let playerIndex = 0;

    // 試合数最少順に配置
    for (let courtNo = 1; courtNo <= courtsToUse; courtNo++) {
      if (playerIndex + 3 >= selectedForPlay.length) break;

      const p1 = selectedForPlay[playerIndex];
      const p2 = selectedForPlay[playerIndex + 1];
      const p3 = selectedForPlay[playerIndex + 2];
      const p4 = selectedForPlay[playerIndex + 3];

      if (p1 && p2 && p3 && p4) {
        const court: CourtMatch = {
          courtNo,
          pairA: [p1.memberId, p2.memberId],
          pairB: [p3.memberId, p4.memberId],
        };

        courts.push(court);
        playerIndex += 4;
      }
    }

    bestCombination = { courts, rests: restPlayers };
  }

  return bestCombination;
}
