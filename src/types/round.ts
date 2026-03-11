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
}

