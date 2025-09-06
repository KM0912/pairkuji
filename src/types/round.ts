export interface CourtMatch {
  courtNo: number;
  pairA: number[]; // memberIds length 2
  pairB: number[]; // memberIds length 2
}

export interface Round {
  roundNo: number;
  courts: CourtMatch[];
  rests: number[]; // memberIds
}

