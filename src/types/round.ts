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
  /** このラウンドを生成したとき「休憩」から戻した選手。取り消しで戻す。 */
  breakMemberIds?: number[];
}

