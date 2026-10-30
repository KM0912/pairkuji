export type MatchResult = 'pairA' | 'pairB' | null;

export interface CourtMatch {
  courtNo: number;
  pairA: [number, number]; // memberIds
  pairB: [number, number]; // memberIds
  result?: MatchResult;
}

export interface Round {
  roundNo: number;
  courts: CourtMatch[];
  rests: number[]; // memberIds
  /** 旧形式の自動復帰情報。互換性のため保持し、現在の出場状態には適用しない。 */
  breakMemberIds?: number[];
}

