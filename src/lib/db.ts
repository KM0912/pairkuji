import Dexie from 'dexie';
import type { 
  Session, Player, Round, PlayerStats, 
  Member, PracticePlayer, PracticeSettings 
} from '../types';

class PairkujiDB extends Dexie {
  // New simplified tables
  practiceSettings!: Dexie.Table<PracticeSettings, 'settings'>;
  members!: Dexie.Table<Member, number>;
  practicePlayers!: Dexie.Table<PracticePlayer, number>;
  rounds!: Dexie.Table<Round, number>;
  playerStats!: Dexie.Table<PlayerStats, number>;
  
  // Legacy tables (for migration)
  sessions!: Dexie.Table<Session, string>;
  sessionPlayers!: Dexie.Table<any, number>;
  players!: Dexie.Table<Player, number>;

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

    // Version 3: Fix sessionPlayers composite index
    this.version(3).stores({
      sessions: 'id, title, createdAt, updatedAt, currentRound',
      members: '++id, name, isActive, createdAt, updatedAt',
      sessionPlayers: '++id, [sessionId+memberId], sessionId, memberId, status, createdAt',
      players: '++id, sessionId, name, status', // Keep for backward compatibility
      rounds: '[sessionId+roundNo], sessionId, roundNo',
      playerStats: '[sessionId+playerId], sessionId, playerId, playedCount, restCount, consecRest'
    });

    // Version 4: Simplified single practice model
    this.version(4).stores({
      practiceSettings: 'id, courts, currentRound, startedAt, updatedAt',
      members: '++id, name, isActive, createdAt, updatedAt',
      practicePlayers: '++id, memberId, status, createdAt',
      rounds: '++roundNo, courts, rests',
      playerStats: 'playerId, playedCount, restCount, consecRest',
      // Legacy tables for migration
      sessions: 'id, title, createdAt, updatedAt, currentRound',
      sessionPlayers: '++id, [sessionId+memberId], sessionId, memberId, status, createdAt',
      players: '++id, sessionId, name, status'
    });
  }
}

export const db = new PairkujiDB();