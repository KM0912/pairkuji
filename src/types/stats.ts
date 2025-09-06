export interface PlayerStats {
  playerId: number; // memberId
  playedCount: number;
  restCount: number;
  consecRest: number;
  recentPartners: number[];
  recentOpponents: number[];
}

export interface PracticeSummary {
  totalRounds: number;
  avgPlayCount: number;
  avgRestCount: number;
  maxConsecRest: number;
  totalPlayers: number;
}

export type CreateStatsData = Omit<PlayerStats, 'playedCount' | 'restCount' | 'consecRest' | 'recentPartners' | 'recentOpponents'>;
export type UpdateStatsData = Partial<Omit<PlayerStats, 'playerId'>>;