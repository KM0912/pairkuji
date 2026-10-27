import type { Round } from '@/types/round';

/** 練習終了時に残す、その日の出場番号。 */
export interface SessionParticipant {
  memberId: number;
  playerNumber: number;
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
