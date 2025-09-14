export interface PracticeSettings {
  id: number; // 固定: 1
  courts: number;
  currentRound: number; // 0 = 未開始
  startedAt: string | null;
  updatedAt: string;
}

export type NewPracticeSettings = Pick<PracticeSettings, 'courts'>;

export type PlayerStatus = 'active' | 'rest';

export interface PracticePlayer {
  memberId: number; // Primary key
  playerNumber: number; // 選択順に振られる番号（1から開始）
  status: PlayerStatus;
  createdAt: string;
  // 途中参加時に公平性を担保するための初期試合数補正
  playedOffset?: number; // デフォルト 0（DBには任意フィールドとして保存）
}
