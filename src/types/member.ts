export interface Member {
  id: number;
  name: string;
  tags?: string[];
  isActive: boolean; // 退部等で無効化
  createdAt: string;
  updatedAt: string;
}

export interface PracticePlayer {
  id: number;
  memberId: number;
  status: 'active' | 'rest' | 'absent';
  createdAt: string;
}

export type CreateMemberData = Omit<Member, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateMemberData = Partial<Omit<Member, 'id' | 'createdAt'>>;
export type CreatePracticePlayerData = Omit<PracticePlayer, 'id' | 'createdAt'>;
export type UpdatePracticePlayerData = Partial<Omit<PracticePlayer, 'id' | 'memberId' | 'createdAt'>>;