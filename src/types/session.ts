export interface Session {
  id: string;
  title?: string;
  courts: number;
  currentRound: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateSessionData = Omit<Session, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSessionData = Partial<Omit<Session, 'id' | 'createdAt'>>;