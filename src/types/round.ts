export interface CourtMatch {
  courtNo: number;
  team1: [number, number]; // playerIds
  team2: [number, number]; // playerIds
}

export interface Round {
  sessionId: string;
  roundNo: number;
  courts: CourtMatch[];
  rests: number[]; // playerIds
}

export type CreateRoundData = Omit<Round, 'sessionId'>;
export type TeamPlayers = [number, number];
export type MatchPlayers = {
  team1: TeamPlayers;
  team2: TeamPlayers;
};