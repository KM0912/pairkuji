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
  id?: number;
  memberId: number;
  playerNumber: number; // 選択順に振られる番号（1から開始）
  status: PlayerStatus;
  createdAt: string;
}

