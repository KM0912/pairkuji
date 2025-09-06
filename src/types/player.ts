export interface Player {
  id: number;
  sessionId: string;
  name: string;
  tags?: string[];
  status: 'active' | 'rest' | 'absent';
}

export type PlayerStatus = Player['status'];
export type CreatePlayerData = Omit<Player, 'id'>;
export type UpdatePlayerData = Partial<Omit<Player, 'id' | 'sessionId'>>;
