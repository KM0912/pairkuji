import Dexie from 'dexie';
import type { Session, Player, Round, PlayerStats } from '../types';

class PairkujiDB extends Dexie {
  sessions!: Dexie.Table<Session, string>;
  players!: Dexie.Table<Player, number>;
  rounds!: Dexie.Table<Round, [string, number]>;
  playerStats!: Dexie.Table<PlayerStats, [string, number]>;

  constructor() {
    super('PairkujiDB');
    
    this.version(1).stores({
      sessions: 'id, title, createdAt, updatedAt, currentRound',
      players: '++id, sessionId, name, status',
      rounds: '[sessionId+roundNo], sessionId, roundNo',
      playerStats: '[sessionId+playerId], sessionId, playerId, playedCount, restCount, consecRest'
    });
  }
}

export const db = new PairkujiDB();