import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { PlayerStats, Round, SessionSummary } from '../../types';
import { db } from '../db';

interface StatsStore {
  // State
  stats: PlayerStats[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  updateStatsForRound: (sessionId: string, round: Round) => Promise<void>;
  recalculateStats: (sessionId: string) => Promise<void>;
  getPlayerStats: (sessionId: string, playerId: number) => PlayerStats | null;
  initializePlayerStats: (sessionId: string, playerId: number) => Promise<void>;
  
  // Statistics
  getSessionSummary: (sessionId: string) => SessionSummary;
  
  // Data Loading
  loadStats: (sessionId: string) => Promise<void>;
  resetStats: (sessionId: string) => Promise<void>;
  clearStats: () => void;
  
  // Internal methods
  _setError: (error: string | null) => void;
  _setLoading: (loading: boolean) => void;
  _updatePlayingPlayerStats: (sessionId: string, round: Round) => Promise<void>;
  _updateRestingPlayerStats: (sessionId: string, restingIds: number[]) => Promise<void>;
}

export const useStatsStore = create<StatsStore>()(
  immer((set, get) => ({
    // Initial state
    stats: [],
    isLoading: false,
    error: null,

    // Actions
    updateStatsForRound: async (sessionId: string, round: Round) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        // Get all player IDs involved in this round
        const playingIds = round.courts.flatMap(court => [...court.team1, ...court.team2]);
        const restingIds = round.rests;
        const allPlayerIds = [...playingIds, ...restingIds];

        // Ensure all players have stats entries
        for (const playerId of allPlayerIds) {
          const existingStats = await db.playerStats.get([sessionId, playerId]);
          if (!existingStats) {
            await db.playerStats.add({
              sessionId,
              playerId,
              playedCount: 0,
              restCount: 0,
              consecRest: 0,
              recentPartners: [],
              recentOpponents: [],
            });
          }
        }

        // Update stats for playing players
        await state._updatePlayingPlayerStats(sessionId, round);

        // Update stats for resting players
        await state._updateRestingPlayerStats(sessionId, restingIds);

        // Reload stats to reflect changes
        await state.loadStats(sessionId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '統計の更新に失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    recalculateStats: async (sessionId: string) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        // Get all rounds for this session
        const rounds = await db.rounds
          .where('sessionId')
          .equals(sessionId)
          .sortBy('roundNo');

        // Get all players for this session
        const players = await db.players
          .where('sessionId')
          .equals(sessionId)
          .toArray();

        // Reset all stats for this session
        await db.playerStats
          .where('sessionId')
          .equals(sessionId)
          .delete();

        // Initialize stats for all players
        for (const player of players) {
          await db.playerStats.add({
            sessionId,
            playerId: player.id,
            playedCount: 0,
            restCount: 0,
            consecRest: 0,
            recentPartners: [],
            recentOpponents: [],
          });
        }

        // Apply all rounds in order
        for (const round of rounds) {
          await state._updatePlayingPlayerStats(sessionId, round);
          await state._updateRestingPlayerStats(sessionId, round.rests);
        }

        // Reload stats
        await state.loadStats(sessionId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '統計の再計算に失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    getPlayerStats: (sessionId: string, playerId: number) => {
      const state = get();
      return state.stats.find(s => s.sessionId === sessionId && s.playerId === playerId) || null;
    },

    initializePlayerStats: async (sessionId: string, playerId: number) => {
      const state = get();
      state._setError(null);

      try {
        const existingStats = await db.playerStats.get([sessionId, playerId]);
        if (!existingStats) {
          const newStats: PlayerStats = {
            sessionId,
            playerId,
            playedCount: 0,
            restCount: 0,
            consecRest: 0,
            recentPartners: [],
            recentOpponents: [],
          };

          await db.playerStats.add(newStats);

          set((state) => {
            state.stats.push(newStats);
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '統計の初期化に失敗しました';
        state._setError(errorMessage);
        throw error;
      }
    },

    // Statistics
    getSessionSummary: (sessionId: string): SessionSummary => {
      const state = get();
      const sessionStats = state.stats.filter(s => s.sessionId === sessionId);

      if (sessionStats.length === 0) {
        return {
          totalRounds: 0,
          avgPlayCount: 0,
          avgRestCount: 0,
          maxConsecRest: 0,
          totalPlayers: 0,
        };
      }

      const totalPlayCounts = sessionStats.reduce((sum, s) => sum + s.playedCount, 0);
      const totalRestCounts = sessionStats.reduce((sum, s) => sum + s.restCount, 0);
      const totalRounds = Math.max(...sessionStats.map(s => s.playedCount + s.restCount), 0);
      const maxConsecRest = Math.max(...sessionStats.map(s => s.consecRest), 0);

      return {
        totalRounds,
        avgPlayCount: totalPlayCounts / sessionStats.length,
        avgRestCount: totalRestCounts / sessionStats.length,
        maxConsecRest,
        totalPlayers: sessionStats.length,
      };
    },

    // Data Loading
    loadStats: async (sessionId: string) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        const sessionStats = await db.playerStats
          .where('sessionId')
          .equals(sessionId)
          .toArray();

        set((state) => {
          // Remove existing stats for this session
          state.stats = state.stats.filter(s => s.sessionId !== sessionId);
          // Add loaded stats
          state.stats.push(...sessionStats);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '統計の読み込みに失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    resetStats: async (sessionId: string) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        // Delete all stats for this session from database
        await db.playerStats
          .where('sessionId')
          .equals(sessionId)
          .delete();

        set((state) => {
          // Remove stats from store
          state.stats = state.stats.filter(s => s.sessionId !== sessionId);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '統計のリセットに失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    clearStats: () => {
      set((state) => {
        state.stats = [];
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

    // Helper methods
    _updatePlayingPlayerStats: async (sessionId: string, round: Round) => {
      await db.transaction('rw', db.playerStats, async () => {
        // Process each court
        for (const court of round.courts) {
          const team1 = court.team1;
          const team2 = court.team2;
          const allCourtPlayers = [...team1, ...team2];

          // Update each player's stats
          for (const playerId of allCourtPlayers) {
            const stats = await db.playerStats.get([sessionId, playerId]);
            if (!stats) continue;

            // Update basic counts
            const updatedStats = {
              playedCount: stats.playedCount + 1,
              consecRest: 0, // Reset consecutive rest when playing
            };

            // Update partner history (teammates in this court)
            const teammates = allCourtPlayers.filter(id => id !== playerId);
            const partners = team1.includes(playerId) ? 
              team1.filter(id => id !== playerId) : 
              team2.filter(id => id !== playerId);

            const updatedPartners = [...stats.recentPartners];
            partners.forEach(partnerId => {
              updatedPartners.push(partnerId);
            });

            // Update opponent history
            const opponents = team1.includes(playerId) ? team2 : team1;
            const updatedOpponents = [...stats.recentOpponents];
            opponents.forEach(opponentId => {
              updatedOpponents.push(opponentId);
            });

            // Keep only recent history (last 10 records)
            const maxHistoryLength = 10;
            if (updatedPartners.length > maxHistoryLength) {
              updatedPartners.splice(0, updatedPartners.length - maxHistoryLength);
            }
            if (updatedOpponents.length > maxHistoryLength) {
              updatedOpponents.splice(0, updatedOpponents.length - maxHistoryLength);
            }

            await db.playerStats.update([sessionId, playerId], {
              ...updatedStats,
              recentPartners: updatedPartners,
              recentOpponents: updatedOpponents,
            });
          }
        }
      });
    },

    _updateRestingPlayerStats: async (sessionId: string, restingIds: number[]) => {
      await db.transaction('rw', db.playerStats, async () => {
        for (const playerId of restingIds) {
          const stats = await db.playerStats.get([sessionId, playerId]);
          if (!stats) continue;

          await db.playerStats.update([sessionId, playerId], {
            restCount: stats.restCount + 1,
            consecRest: stats.consecRest + 1,
          });
        }
      });
    },
  }))
);