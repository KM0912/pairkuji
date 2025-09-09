export interface PairRecord {
  player1: number; // smaller memberId
  player2: number; // larger memberId
  count: number;
}

export interface PairStats {
  sessionId?: string;
  pairs: PairRecord[];
  lastUpdated: string;
}