export interface PlayerStats {
  playerId: number;
  playedCount: number;
  restCount: number;
  consecRest: number; // 連続休憩数
  recentPartners: number[]; // 最新が末尾、最大5件
  recentOpponents: number[]; // 最新が末尾、最大5件
}

export interface FairnessScore {
  playedVariance: number;
  restVariance: number;
  consecutiveRestPenalty: number;
  duplicatePairCount: number;
  duplicateMatchCount: number;
  totalScore: number;
}