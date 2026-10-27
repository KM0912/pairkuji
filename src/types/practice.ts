export interface PracticeSettings {
  id: number; // 固定: 1
  courts: number;
  currentRound: number; // 0 = 未開始
  startedAt: string | null;
  updatedAt: string;
  clubTags?: string[]; // クラブ（自由入力、複数可）
}

export type NewPracticeSettings = Pick<PracticeSettings, 'courts'>;

export type PlayerStatus = 'active' | 'rest';

/** break は次の1ラウンドだけ外し、その後は戻る。early は戻すまで外れたまま。 */
export type RestKind = 'break' | 'early';

export interface PracticePlayer {
  memberId: number; // Primary key
  playerNumber: number; // 選択順に振られる番号（1から開始）
  status: PlayerStatus;
  createdAt: string;
  restKind?: RestKind;
  // 途中参加時に公平性を担保するための初期試合数補正
  playedOffset?: number; // デフォルト 0（DBには任意フィールドとして保存）
}
