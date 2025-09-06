import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Session, CreateSessionData, UpdateSessionData } from '../../types';
import { db } from '../db';
import { autoSaveManager } from '../auto-save';

interface SessionStore {
  // State
  currentSession: Session | null;
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
  
  // Auto-save
  autoSave: boolean;
  autoSaveTimeoutId: NodeJS.Timeout | null;
  
  // Actions
  createSession: (data: CreateSessionData) => Promise<string>;
  updateSession: (id: string, data: UpdateSessionData) => Promise<void>;
  loadSession: (id: string) => Promise<void>;
  loadAllSessions: () => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  clearCurrentSession: () => void;
  
  // Auto-save
  setAutoSave: (enabled: boolean) => void;
  
  // Internal methods
  _setError: (error: string | null) => void;
  _setLoading: (loading: boolean) => void;
  _scheduleAutoSave: () => void;
  _performAutoSave: () => Promise<void>;
}

export const useSessionStore = create<SessionStore>()(
  immer((set, get) => ({
    // Initial state
    currentSession: null,
    sessions: [],
    isLoading: false,
    error: null,
    autoSave: true,
    autoSaveTimeoutId: null,

    // Actions
    createSession: async (data: CreateSessionData) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        const now = new Date().toISOString();
        const id = crypto.randomUUID();
        
        const newSession: Session = {
          id,
          ...data,
          createdAt: now,
          updatedAt: now,
        };

        await db.sessions.add(newSession);

        set((state) => {
          state.sessions.push(newSession);
          state.currentSession = newSession;
        });

        return id;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'セッションの作成に失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    updateSession: async (id: string, data: UpdateSessionData) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        const updatedAt = new Date().toISOString();
        const updateData = { ...data, updatedAt };

        await db.sessions.update(id, updateData);

        set((state) => {
          // Update sessions array
          const sessionIndex = state.sessions.findIndex(s => s.id === id);
          if (sessionIndex !== -1) {
            const session = state.sessions[sessionIndex];
            if (session) {
              Object.keys(updateData).forEach(key => {
                if (key in session) {
                  (session as any)[key] = (updateData as any)[key];
                }
              });
            }
          }

          // Update current session if it matches
          if (state.currentSession?.id === id) {
            Object.keys(updateData).forEach(key => {
              if (key in state.currentSession!) {
                (state.currentSession as any)[key] = (updateData as any)[key];
              }
            });
            
            // Schedule auto-save for updated session
            autoSaveManager.scheduleAutoSave(
              `session-${id}`,
              state.currentSession,
              async (session) => {
                const saveData = { ...updateData, updatedAt: new Date().toISOString() };
                await db.sessions.update(id, saveData);
              }
            );
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'セッションの更新に失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    loadSession: async (id: string) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        const session = await db.sessions.get(id);
        
        if (!session) {
          throw new Error(`セッション (ID: ${id}) が見つかりません`);
        }

        set((state) => {
          state.currentSession = session;
          
          // Add to sessions array if not already present
          if (!state.sessions.find(s => s.id === id)) {
            state.sessions.push(session);
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'セッションの読み込みに失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    loadAllSessions: async () => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        const sessions = await db.sessions.orderBy('updatedAt').reverse().toArray();

        set((state) => {
          state.sessions = sessions;
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'セッション一覧の読み込みに失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    deleteSession: async (id: string) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        // Delete related data in transaction
        await db.transaction('rw', [db.sessions, db.players, db.rounds, db.playerStats], async () => {
          await db.sessions.delete(id);
          await db.players.where('sessionId').equals(id).delete();
          await db.rounds.where('sessionId').equals(id).delete();
          await db.playerStats.where('sessionId').equals(id).delete();
        });

        set((state) => {
          state.sessions = state.sessions.filter(s => s.id !== id);
          
          if (state.currentSession?.id === id) {
            state.currentSession = null;
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'セッションの削除に失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    clearCurrentSession: () => {
      set((state) => {
        state.currentSession = null;
      });
    },

    setAutoSave: (enabled: boolean) => {
      set((state) => {
        state.autoSave = enabled;
        
        // Clear existing timeout when disabling
        if (!enabled && state.autoSaveTimeoutId) {
          clearTimeout(state.autoSaveTimeoutId);
          state.autoSaveTimeoutId = null;
        }
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

    _scheduleAutoSave: () => {
      const state = get();
      
      // Clear existing timeout
      if (state.autoSaveTimeoutId) {
        clearTimeout(state.autoSaveTimeoutId);
      }

      // Schedule new auto-save with 500ms debounce
      const timeoutId = setTimeout(() => {
        state._performAutoSave();
      }, 500);

      set((state) => {
        state.autoSaveTimeoutId = timeoutId;
      });
    },

    _performAutoSave: async () => {
      const state = get();
      
      if (!state.currentSession || !state.autoSave) {
        return;
      }

      try {
        const updatedAt = new Date().toISOString();
        await db.sessions.update(state.currentSession.id, { updatedAt });

        set((state) => {
          if (state.currentSession) {
            state.currentSession.updatedAt = updatedAt;
            
            // Update in sessions array too
            const sessionIndex = state.sessions.findIndex(s => s.id === state.currentSession?.id);
            if (sessionIndex !== -1 && state.sessions[sessionIndex]) {
              state.sessions[sessionIndex].updatedAt = updatedAt;
            }
          }
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Don't set error state for auto-save failures to avoid disrupting UX
      }
    },
  }))
);