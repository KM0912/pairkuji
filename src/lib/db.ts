import Dexie, { Table } from 'dexie';
import type { Member } from '@/types/member';

export class PairkujiDB extends Dexie {
  members!: Table<Member, number>;

  constructor() {
    super('pairkuji');
    this.version(1).stores({
      // ++id = auto-increment primary key
      members: '++id, name, isActive, createdAt, updatedAt',
    });
  }
}

export const db = new PairkujiDB();

