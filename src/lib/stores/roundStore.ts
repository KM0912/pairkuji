import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Round, CourtMatch, Player, PlayerStats, Member, SessionPlayer } from '../../types';
import { db } from '../db';
import { generateOptimalRoundFromSessionPlayers } from '../algorithm/sessionPlayerAdapter';

interface RoundStore {
  // State
  currentRound: Round | null;
  rounds: Round[];
  isLoading: boolean;
  error: string | null;
  
  // Round Management
  generateRound: (sessionId: string) => Promise<Round>;
  confirmRound: (sessionId: string, roundNo: number) => Promise<void>;
  rollbackRound: (sessionId: string) => Promise<void>;
  
  // Manual Adjustments
  swapPlayers: (playerId1: number, playerId2: number) => void;
  moveToRest: (playerId: number) => void;
  moveToPlay: (playerId: number, courtNo: number, position: 'team1' | 'team2', index: 0 | 1) => void;
  
  // Data Loading
  loadRounds: (sessionId: string) => Promise<void>;
  loadCurrentRound: (sessionId: string, roundNo: number) => Promise<void>;
  clearRounds: () => void;
  
  // Internal methods
  _setError: (error: string | null) => void;
  _setLoading: (loading: boolean) => void;
  _updatePlayerStats: (round: Round) => Promise<void>;
  _rollbackPlayerStats: (sessionId: string, roundNo: number) => Promise<void>;
}

export const useRoundStore = create<RoundStore>()(
  immer((set, get) => ({
    // Initial state
    currentRound: null,
    rounds: [],
    isLoading: false,
    error: null,

    // Round Management
    generateRound: async (sessionId: string) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        // Get current session data
        const session = await db.sessions.get(sessionId);
        if (!session) {
          throw new Error('セッションが見つかりません');
        }

        // Get session players with member data
        const sessionPlayers = await db.sessionPlayers
          .where('sessionId')
          .equals(sessionId)
          .and(sp => sp.status === 'active')
          .toArray();

        if (sessionPlayers.length < 4) {
          throw new Error('最低4名のアクティブなプレイヤーが必要です');
        }

        // Get member data for session players
        const memberIds = sessionPlayers.map(sp => sp.memberId);
        const members = await db.members.where('id').anyOf(memberIds).toArray();
        
        const sessionMembersData = sessionPlayers.map(sessionPlayer => {
          const member = members.find(m => m.id === sessionPlayer.memberId);
          if (!member) {
            throw new Error(`Member with id ${sessionPlayer.memberId} not found`);
          }
          return { member, sessionPlayer };
        });

        // Get player statistics (using memberId as playerId)
        const stats = await db.playerStats
          .where('sessionId')
          .equals(sessionId)
          .toArray();

        // Generate optimal round using fairness algorithm with adapter
        const assignment = generateOptimalRoundFromSessionPlayers(sessionId, sessionMembersData, stats, session.courts);
        
        const newRoundNo = (session.currentRound || 0) + 1;
        const newRound: Round = {
          sessionId,
          roundNo: newRoundNo,
          courts: assignment.courts,
          rests: assignment.rests,
        };

        set((state) => {
          state.currentRound = newRound;
        });

        return newRound;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'ラウンドの生成に失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    confirmRound: async (sessionId: string, roundNo: number) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        const roundToConfirm = state.currentRound;
        if (!roundToConfirm || roundToConfirm.roundNo !== roundNo) {
          throw new Error('確定するラウンドが見つかりません');
        }

        // Save round to database
        await db.rounds.put(roundToConfirm);

        // Update session current round
        await db.sessions.update(sessionId, { 
          currentRound: roundNo,
          updatedAt: new Date().toISOString(),
        });

        // Update player statistics
        await state._updatePlayerStats(roundToConfirm);

        set((state) => {
          // Add to rounds array if not already present
          const existingIndex = state.rounds.findIndex(r => 
            r.sessionId === sessionId && r.roundNo === roundNo
          );
          if (existingIndex === -1) {
            state.rounds.push(roundToConfirm);
          } else {
            state.rounds[existingIndex] = roundToConfirm;
          }
          
          state.currentRound = null;
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'ラウンドの確定に失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    rollbackRound: async (sessionId: string) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        // Get current session
        const session = await db.sessions.get(sessionId);
        if (!session || session.currentRound <= 0) {
          throw new Error('巻き戻しできるラウンドがありません');
        }

        const prevRoundNo = session.currentRound - 1;
        
        // Remove last round from database
        await db.rounds.where(['sessionId', 'roundNo']).equals([sessionId, session.currentRound]).delete();

        // Update session current round
        await db.sessions.update(sessionId, { 
          currentRound: prevRoundNo,
          updatedAt: new Date().toISOString(),
        });

        // Rollback player statistics
        await state._rollbackPlayerStats(sessionId, session.currentRound);

        set((state) => {
          state.rounds = state.rounds.filter(r => 
            !(r.sessionId === sessionId && r.roundNo === session.currentRound)
          );
          state.currentRound = null;
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'ラウンドの巻き戻しに失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    // Manual Adjustments
    swapPlayers: (playerId1: number, playerId2: number) => {
      set((state) => {
        if (!state.currentRound) return;
        
        const round = state.currentRound;
        let player1Pos: any = null;
        let player2Pos: any = null;
        
        // Find player positions
        for (let i = 0; i < round.courts.length; i++) {
          const court = round.courts[i];
          if (!court) continue;
          
          if (court.team1[0] === playerId1) player1Pos = { court: i, team: 'team1', index: 0 };
          else if (court.team1[1] === playerId1) player1Pos = { court: i, team: 'team1', index: 1 };
          else if (court.team2[0] === playerId1) player1Pos = { court: i, team: 'team2', index: 0 };
          else if (court.team2[1] === playerId1) player1Pos = { court: i, team: 'team2', index: 1 };
          
          if (court.team1[0] === playerId2) player2Pos = { court: i, team: 'team1', index: 0 };
          else if (court.team1[1] === playerId2) player2Pos = { court: i, team: 'team1', index: 1 };
          else if (court.team2[0] === playerId2) player2Pos = { court: i, team: 'team2', index: 0 };
          else if (court.team2[1] === playerId2) player2Pos = { court: i, team: 'team2', index: 1 };
        }
        
        // Check if players are in rest
        const player1InRest = round.rests.indexOf(playerId1);
        const player2InRest = round.rests.indexOf(playerId2);
        
        // Swap players
        if (player1Pos && player2Pos) {
          // Both playing - swap positions
          (round.courts[player1Pos.court] as any)[player1Pos.team][player1Pos.index] = playerId2;
          (round.courts[player2Pos.court] as any)[player2Pos.team][player2Pos.index] = playerId1;
        } else if (player1Pos && player2InRest !== -1) {
          // Player1 playing, Player2 resting
          (round.courts[player1Pos.court] as any)[player1Pos.team][player1Pos.index] = playerId2;
          round.rests[player2InRest] = playerId1;
        } else if (player1InRest !== -1 && player2Pos) {
          // Player1 resting, Player2 playing
          round.rests[player1InRest] = playerId2;
          (round.courts[player2Pos.court] as any)[player2Pos.team][player2Pos.index] = playerId1;
        } else if (player1InRest !== -1 && player2InRest !== -1) {
          // Both resting - swap positions in rest array
          round.rests[player1InRest] = playerId2;
          round.rests[player2InRest] = playerId1;
        }
      });
    },

    moveToRest: (playerId: number) => {
      set((state) => {
        if (!state.currentRound) return;
        
        const round = state.currentRound;
        
        // Remove from courts
        for (const court of round.courts) {
          if (court.team1[0] === playerId) court.team1[0] = -1; // placeholder
          else if (court.team1[1] === playerId) court.team1[1] = -1;
          else if (court.team2[0] === playerId) court.team2[0] = -1;
          else if (court.team2[1] === playerId) court.team2[1] = -1;
        }
        
        // Add to rest if not already there
        if (!round.rests.includes(playerId)) {
          round.rests.push(playerId);
        }
      });
    },

    moveToPlay: (playerId: number, courtNo: number, position: 'team1' | 'team2', index: 0 | 1) => {
      set((state) => {
        if (!state.currentRound) return;
        
        const round = state.currentRound;
        const courtIndex = courtNo - 1;
        
        if (courtIndex < 0 || courtIndex >= round.courts.length) return;
        
        // Remove from rest
        const restIndex = round.rests.indexOf(playerId);
        if (restIndex !== -1) {
          round.rests.splice(restIndex, 1);
        }
        
        // Add to court
        const court = round.courts[courtIndex];
        if (court) {
          (court[position] as any)[index] = playerId;
        }
      });
    },


    // Data Loading
    loadRounds: async (sessionId: string) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        const rounds = await db.rounds
          .where('sessionId')
          .equals(sessionId)
          .sortBy('roundNo');

        set((state) => {
          state.rounds = rounds;
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'ラウンドの読み込みに失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    loadCurrentRound: async (sessionId: string, roundNo: number) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        const round = await db.rounds.get([sessionId, roundNo]);
        
        set((state) => {
          state.currentRound = round || null;
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '現在のラウンドの読み込みに失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    clearRounds: () => {
      set((state) => {
        state.currentRound = null;
        state.rounds = [];
        state.error = null;
      });
    },

    // Internal methods
    _setError: (error: string | null) => {
      set((state) => {
        state.error = error;
      });
    },

    _setLoading: (loading: boolean) => {
      set((state) => {
        state.isLoading = loading;
      });
    },

    // Helper methods (would be private in real implementation)
    _updatePlayerStats: async (round: Round) => {
      const playingIds = round.courts.flatMap(c => [...c.team1, ...c.team2]);
      const restingIds = round.rests;
      
      await db.transaction('rw', db.playerStats, async () => {
        // Update playing players
        for (const playerId of playingIds) {
          const existing = await db.playerStats.get([round.sessionId, playerId]);
          if (existing) {
            await db.playerStats.update([round.sessionId, playerId], {
              playedCount: existing.playedCount + 1,
              consecRest: 0,
            });
          } else {
            await db.playerStats.add({
              sessionId: round.sessionId,
              playerId,
              playedCount: 1,
              restCount: 0,
              consecRest: 0,
              recentPartners: [],
              recentOpponents: [],
            });
          }
        }
        
        // Update resting players
        for (const playerId of restingIds) {
          const existing = await db.playerStats.get([round.sessionId, playerId]);
          if (existing) {
            await db.playerStats.update([round.sessionId, playerId], {
              restCount: existing.restCount + 1,
              consecRest: existing.consecRest + 1,
            });
          } else {
            await db.playerStats.add({
              sessionId: round.sessionId,
              playerId,
              playedCount: 0,
              restCount: 1,
              consecRest: 1,
              recentPartners: [],
              recentOpponents: [],
            });
          }
        }
      });
    },

    _rollbackPlayerStats: async (sessionId: string, roundNo: number) => {
      // This would need to implement the reverse of _updatePlayerStats
      // For now, we'll just reload all stats from scratch
      // In a production system, you'd want to track incremental changes
      console.warn('Stats rollback not fully implemented - would need to recalculate stats from scratch');
    },
  }))
);