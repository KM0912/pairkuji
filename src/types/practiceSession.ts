import type { Round } from '@/types/round';

export interface PracticeSession {
  id?: number;
  startedAt: string;
  endedAt: string;
  courts: number;
  playerIds: number[];
  rounds: Round[];
}
