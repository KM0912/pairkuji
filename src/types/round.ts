export interface CourtMatch {
  courtNo: number;
  team1: [number, number]; // playerIds
  team2: [number, number]; // playerIds
}

export interface Round {
  roundNo: number;
  courts: CourtMatch[];
  rests: number[]; // memberIds
}

export type CreateRoundData = Round;
export type TeamPlayers = [number, number];
export type MatchPlayers = {
  team1: TeamPlayers;
  team2: TeamPlayers;
};