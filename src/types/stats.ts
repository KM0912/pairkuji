export interface PlayerStats {
  sessionId: string;
  playerId: number;
  playedCount: number;
  restCount: number;
  consecRest: number;
  recentPartners: number[];
  recentOpponents: number[];
}

export interface SessionSummary {
  totalRounds: number;
  avgPlayCount: number;
  avgRestCount: number;
  maxConsecRest: number;
  totalPlayers: number;
}

export type CreateStatsData = Omit<PlayerStats, 'playedCount' | 'restCount' | 'consecRest' | 'recentPartners' | 'recentOpponents'>;
export type UpdateStatsData = Partial<Omit<PlayerStats, 'sessionId' | 'playerId'>>;