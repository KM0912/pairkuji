import Dexie from 'dexie';
import type { Session, Player, Round, PlayerStats, Member, SessionPlayer } from '../types';

class PairkujiDB extends Dexie {
  sessions!: Dexie.Table<Session, string>;
  members!: Dexie.Table<Member, number>;
  sessionPlayers!: Dexie.Table<SessionPlayer, number>;
  players!: Dexie.Table<Player, number>; // Legacy table
  rounds!: Dexie.Table<Round, [string, number]>;
  playerStats!: Dexie.Table<PlayerStats, [string, number]>;

  constructor() {
    super('PairkujiDB');
    
    // Version 1: Original schema
    this.version(1).stores({
      sessions: 'id, title, createdAt, updatedAt, currentRound',
      players: '++id, sessionId, name, status',
      rounds: '[sessionId+roundNo], sessionId, roundNo',
      playerStats: '[sessionId+playerId], sessionId, playerId, playedCount, restCount, consecRest'
    });

    // Version 2: Add members and sessionPlayers tables
    this.version(2).stores({
      sessions: 'id, title, createdAt, updatedAt, currentRound',
      members: '++id, name, isActive, createdAt, updatedAt',
      sessionPlayers: '++id, sessionId, memberId, status, createdAt',
      players: '++id, sessionId, name, status', // Keep for backward compatibility
      rounds: '[sessionId+roundNo], sessionId, roundNo',
      playerStats: '[sessionId+playerId], sessionId, playerId, playedCount, restCount, consecRest'
    });
  }
}

export const db = new PairkujiDB();