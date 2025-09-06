export interface Member {
  id?: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NewMember = Omit<Member, 'id' | 'createdAt' | 'updatedAt'>;

