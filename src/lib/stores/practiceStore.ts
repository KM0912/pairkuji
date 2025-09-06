import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { 
  PracticeSettings, 
  UpdatePracticeSettingsData,
  Member, 
  PracticePlayer,
  CreatePracticePlayerData,
  UpdatePracticePlayerData 
} from '../../types';
import { db } from '../db';

interface PracticeStore {
  // State
  settings: PracticeSettings | null;
  members: Member[];
  practicePlayers: PracticePlayer[];
  isLoading: boolean;
  error: string | null;
  
  // Settings Management
  loadSettings: () => Promise<void>;
  updateSettings: (data: UpdatePracticeSettingsData) => Promise<void>;
  initializeNewPractice: (courts: number) => Promise<void>;
  
  // Member Management (delegated to memberStore)
  loadAllMembers: () => Promise<void>;
  
  // Practice Player Management
  addPlayerToPractice: (memberId: number) => Promise<void>;
  removePlayerFromPractice: (memberId: number) => Promise<void>;
  updatePracticePlayerStatus: (memberId: number, status: PracticePlayer['status']) => Promise<void>;
  loadPracticePlayers: () => Promise<void>;
  getPracticePlayers: () => PracticePlayer[];
  getMembersByPractice: () => { member: Member; practicePlayer: PracticePlayer }[];
  getActivePlayerCount: () => number;
  
  // Reset
  resetPractice: () => Promise<void>;
  
  // Internal methods
  _setError: (error: string | null) => void;
  _setLoading: (loading: boolean) => void;
}

export const usePracticeStore = create<PracticeStore>()(
  immer((set, get) => ({
    // Initial state
    settings: null,
    members: [],
    practicePlayers: [],
    isLoading: false,
    error: null,

    // Settings Management
    loadSettings: async () => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        const settings = await db.practiceSettings.get('settings');
        
        set((state) => {
          state.settings = settings || null;
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '設定の読み込みに失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    updateSettings: async (data: UpdatePracticeSettingsData) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        const updatedAt = new Date().toISOString();
        const updateData = { ...data, updatedAt };

        const existing = await db.practiceSettings.get('settings');
        if (existing) {
          await db.practiceSettings.update('settings', updateData);
        } else {
          // Initialize with defaults
          const newSettings: PracticeSettings = {
            courts: data.courts || 3,
            currentRound: data.currentRound || 0,
            startedAt: data.startedAt || null,
            updatedAt,
          };
          await db.practiceSettings.put(newSettings, 'settings');
        }

        set((state) => {
          if (state.settings) {
            Object.keys(updateData).forEach(key => {
              if (key in state.settings!) {
                (state.settings as any)[key] = (updateData as any)[key];
              }
            });
          } else {
            state.settings = {
              courts: data.courts || 3,
              currentRound: data.currentRound || 0,
              startedAt: data.startedAt || null,
              updatedAt,
            };
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '設定の更新に失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    initializeNewPractice: async (courts: number) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        // Clear all practice-related data
        await state.resetPractice();
        
        // Initialize new practice
        const now = new Date().toISOString();
        const newSettings: PracticeSettings = {
          courts,
          currentRound: 0,
          startedAt: now,
          updatedAt: now,
        };

        await db.practiceSettings.put(newSettings, 'settings');

        set((state) => {
          state.settings = newSettings;
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '新しい練習の開始に失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    // Member Management
    loadAllMembers: async () => {
      const state = get();
      state._setError(null);

      try {
        const members = await db.members
          .orderBy('name')
          .toArray();

        set((state) => {
          state.members = members;
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '選手一覧の読み込みに失敗しました';
        state._setError(errorMessage);
        throw error;
      }
    },

    // Practice Player Management
    addPlayerToPractice: async (memberId: number) => {
      const state = get();
      state._setError(null);

      try {
        // Check if already exists
        const existing = await db.practicePlayers
          .where('memberId')
          .equals(memberId)
          .first();

        if (existing) {
          throw new Error('この選手は既に練習に追加されています');
        }

        const now = new Date().toISOString();
        const newPracticePlayer: Omit<PracticePlayer, 'id'> = {
          memberId,
          status: 'active',
          createdAt: now,
        };

        const id = await db.practicePlayers.add(newPracticePlayer as any);

        const createdPracticePlayer: PracticePlayer = {
          id,
          ...newPracticePlayer,
        };

        set((state) => {
          state.practicePlayers.push(createdPracticePlayer);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '練習への参加者追加に失敗しました';
        state._setError(errorMessage);
        throw error;
      }
    },

    removePlayerFromPractice: async (memberId: number) => {
      const state = get();
      state._setError(null);

      try {
        await db.practicePlayers
          .where('memberId')
          .equals(memberId)
          .delete();

        set((state) => {
          state.practicePlayers = state.practicePlayers.filter(
            pp => pp.memberId !== memberId
          );
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '練習からの参加者削除に失敗しました';
        state._setError(errorMessage);
        throw error;
      }
    },

    updatePracticePlayerStatus: async (memberId: number, status: PracticePlayer['status']) => {
      const state = get();
      state._setError(null);

      try {
        await db.practicePlayers
          .where('memberId')
          .equals(memberId)
          .modify({ status });

        set((state) => {
          const practicePlayer = state.practicePlayers.find(
            pp => pp.memberId === memberId
          );
          if (practicePlayer) {
            practicePlayer.status = status;
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '参加者ステータスの更新に失敗しました';
        state._setError(errorMessage);
        throw error;
      }
    },

    loadPracticePlayers: async () => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        const practicePlayers = await db.practicePlayers.toArray();

        set((state) => {
          state.practicePlayers = practicePlayers;
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '練習参加者の読み込みに失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    // Utility methods
    getPracticePlayers: () => {
      const state = get();
      return state.practicePlayers;
    },

    getMembersByPractice: () => {
      const state = get();
      
      return state.practicePlayers.map(practicePlayer => {
        const member = state.members.find(m => m.id === practicePlayer.memberId);
        if (!member) {
          throw new Error(`Member with id ${practicePlayer.memberId} not found`);
        }
        return { member, practicePlayer };
      });
    },

    getActivePlayerCount: () => {
      const state = get();
      return state.practicePlayers.filter(pp => pp.status === 'active').length;
    },

    resetPractice: async () => {
      try {
        // Clear all practice data in transaction
        await db.transaction('rw', [
          db.practiceSettings, 
          db.practicePlayers, 
          db.rounds, 
          db.playerStats
        ], async () => {
          await db.practiceSettings.clear();
          await db.practicePlayers.clear();
          await db.rounds.clear();
          await db.playerStats.clear();
        });

        set((state) => {
          state.settings = null;
          state.practicePlayers = [];
          state.error = null;
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '練習データのリセットに失敗しました';
        get()._setError(errorMessage);
        throw error;
      }
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