export interface CourtMatch {
  courtNo: number;
  pairA: [number, number]; // memberIds
  pairB: [number, number]; // memberIds
}

export interface Round {
  roundNo: number;
  courts: CourtMatch[];
  rests: number[]; // memberIds
}

