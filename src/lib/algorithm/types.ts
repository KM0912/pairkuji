import type { Player, PlayerStats, CourtMatch } from '../../types';

export interface Assignment {
  courts: CourtMatch[];
  rests: number[];
  score: number;
}

export interface PlayerPriority {
  player: Player;
  stats: PlayerStats | null;
  priority: number;
}

export interface ScoreComponents {
  restVariance: number;
  playVariance: number;
  consecPenalty: number;
  pairDuplication: number;
  matchDuplication: number;
}

export interface GenerationConfig {
  maxAttempts: number;
  recentPartnersWindow: number;
  recentOpponentsWindow: number;
}

export const DEFAULT_CONFIG: GenerationConfig = {
  maxAttempts: 200,
  recentPartnersWindow: 3,
  recentOpponentsWindow: 3,
};