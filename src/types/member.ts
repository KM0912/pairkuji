export interface Member {
  id: number;
  name: string;
  tags?: string[];
  isActive: boolean; // 退部等で無効化
  createdAt: string;
  updatedAt: string;
}

export interface SessionPlayer {
  id: number;
  sessionId: string;
  memberId: number;
  status: 'active' | 'rest' | 'absent';
  createdAt: string;
}

export type CreateMemberData = Omit<Member, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateMemberData = Partial<Omit<Member, 'id' | 'createdAt'>>;
export type CreateSessionPlayerData = Omit<SessionPlayer, 'id' | 'createdAt'>;
export type UpdateSessionPlayerData = Partial<Omit<SessionPlayer, 'id' | 'sessionId' | 'memberId' | 'createdAt'>>;