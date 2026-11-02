import type { Round } from '@/types/round';
import type { PracticeLevel } from '@/types/practice';

/** 練習終了時に残す、その日の出場番号とレベル。 */
export interface SessionParticipant {
  memberId: number;
  playerNumber: number;
  level?: PracticeLevel;
}

export interface PracticeSession {
  id?: number;
  startedAt: string;
  endedAt: string;
  courts: number;
  playerIds: number[];
  /** 当日の番号。古い履歴には無く、その場合は名前順で表示する。 */
  participants?: SessionParticipant[];
  rounds: Round[];
  clubTags?: string[]; // クラブ（自由入力、複数可）
}
