import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Player, CreatePlayerData, UpdatePlayerData, PlayerStatus } from '../../types';
import { db } from '../db';

interface PlayerStore {
  // State
  players: Player[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addPlayer: (sessionId: string, name: string, tags?: string[]) => Promise<number>;
  updatePlayer: (id: number, data: UpdatePlayerData) => Promise<void>;
  updatePlayerStatus: (id: number, status: PlayerStatus) => Promise<void>;
  removePlayer: (id: number) => Promise<void>;
  
  // Queries
  getPlayersBySession: (sessionId: string) => Player[];
  getActivePlayers: (sessionId: string) => Player[];
  searchPlayers: (sessionId: string, query: string) => Player[];
  
  // Bulk operations
  loadPlayersBySession: (sessionId: string) => Promise<void>;
  importPlayers: (sessionId: string, names: string[]) => Promise<void>;
  clearPlayers: () => void;
  
  // Internal methods
  _setError: (error: string | null) => void;
  _setLoading: (loading: boolean) => void;
}

export const usePlayerStore = create<PlayerStore>()(
  immer((set, get) => ({
    // Initial state
    players: [],
    isLoading: false,
    error: null,

    // Actions
    addPlayer: async (sessionId: string, name: string, tags?: string[]) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        const newPlayer: CreatePlayerData = {
          sessionId,
          name: name.trim(),
          tags: tags || [],
          status: 'active',
        };

        const id = await db.players.add(newPlayer as any);

        const createdPlayer: Player = {
          ...newPlayer,
          id,
        };

        set((state) => {
          state.players.push(createdPlayer);
        });

        return id;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'プレイヤーの追加に失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    updatePlayer: async (id: number, data: UpdatePlayerData) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        await db.players.update(id, data);

        set((state) => {
          const playerIndex = state.players.findIndex(p => p.id === id);
          if (playerIndex !== -1) {
            const player = state.players[playerIndex];
            if (player) {
              Object.keys(data).forEach(key => {
                if (key in player) {
                  (player as any)[key] = (data as any)[key];
                }
              });
            }
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'プレイヤーの更新に失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    updatePlayerStatus: async (id: number, status: PlayerStatus) => {
      const state = get();
      await state.updatePlayer(id, { status });
    },

    removePlayer: async (id: number) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        await db.players.delete(id);

        set((state) => {
          state.players = state.players.filter(p => p.id !== id);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'プレイヤーの削除に失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    // Queries
    getPlayersBySession: (sessionId: string) => {
      const state = get();
      return state.players.filter(player => player.sessionId === sessionId);
    },

    getActivePlayers: (sessionId: string) => {
      const state = get();
      return state.players.filter(
        player => player.sessionId === sessionId && player.status === 'active'
      );
    },

    searchPlayers: (sessionId: string, query: string) => {
      const state = get();
      const trimmedQuery = query.trim().toLowerCase();
      
      if (!trimmedQuery) {
        return state.getPlayersBySession(sessionId);
      }

      return state.players.filter(player => {
        if (player.sessionId !== sessionId) return false;
        
        // Search in name
        if (player.name.toLowerCase().includes(trimmedQuery)) {
          return true;
        }
        
        // Search in tags
        if (player.tags?.some(tag => tag.toLowerCase().includes(trimmedQuery))) {
          return true;
        }
        
        return false;
      });
    },

    // Bulk operations
    loadPlayersBySession: async (sessionId: string) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        const sessionPlayers = await db.players
          .where('sessionId')
          .equals(sessionId)
          .toArray();

        set((state) => {
          // Remove existing players for this session
          state.players = state.players.filter(p => p.sessionId !== sessionId);
          // Add loaded players
          state.players.push(...sessionPlayers);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'プレイヤーの読み込みに失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    importPlayers: async (sessionId: string, names: string[]) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        const playersToAdd: CreatePlayerData[] = names
          .map(name => name.trim())
          .filter(name => name.length > 0)
          .filter(name => {
            // Avoid duplicates within the same session
            const existingNames = state.getPlayersBySession(sessionId)
              .map(p => p.name.toLowerCase());
            return !existingNames.includes(name.toLowerCase());
          })
          .map(name => ({
            sessionId,
            name,
            tags: [],
            status: 'active' as PlayerStatus,
          }));

        if (playersToAdd.length === 0) {
          return;
        }

        // Add all players in a single transaction
        const addedIds = await db.transaction('rw', db.players, async () => {
          const ids: number[] = [];
          for (const playerData of playersToAdd) {
            const id = await db.players.add(playerData as any);
            ids.push(id);
          }
          return ids;
        });

        // Create Player objects with IDs
        const addedPlayers: Player[] = playersToAdd.map((playerData, index) => ({
          ...playerData,
          id: addedIds[index]!,
        }));

        set((state) => {
          state.players.push(...addedPlayers);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'プレイヤーの一括追加に失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    clearPlayers: () => {
      set((state) => {
        state.players = [];
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
  }))
);