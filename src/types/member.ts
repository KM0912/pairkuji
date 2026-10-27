export interface Member {
  id: number;
  name: string;
  isActive: boolean;
  isDeleted: boolean;
  /** 初期データの見本選手。名簿では「サンプル」と表示する。 */
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NewMember = Omit<Member, 'id' | 'createdAt' | 'updatedAt'>;

export type NewMemberInput = Omit<Member, 'id' | 'createdAt' | 'updatedAt'>;

