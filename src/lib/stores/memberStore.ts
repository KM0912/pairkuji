import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Member, SessionPlayer, CreateMemberData, UpdateMemberData, CreateSessionPlayerData, UpdateSessionPlayerData } from '../../types';
import { db } from '../db';

interface MemberStore {
  // State
  members: Member[];
  sessionPlayers: SessionPlayer[];
  isLoading: boolean;
  error: string | null;
  
  // Member Management
  createMember: (data: CreateMemberData) => Promise<number>;
  updateMember: (id: number, data: UpdateMemberData) => Promise<void>;
  deleteMember: (id: number) => Promise<void>;
  loadAllMembers: () => Promise<void>;
  
  // Session Player Management
  addPlayerToSession: (sessionId: string, memberId: number) => Promise<void>;
  removePlayerFromSession: (sessionId: string, memberId: number) => Promise<void>;
  updateSessionPlayerStatus: (sessionId: string, memberId: number, status: SessionPlayer['status']) => Promise<void>;
  loadSessionPlayers: (sessionId: string) => Promise<void>;
  getSessionPlayers: (sessionId: string) => SessionPlayer[];
  getMembersBySession: (sessionId: string) => { member: Member; sessionPlayer: SessionPlayer }[];
  
  // Utility
  clearMembers: () => void;
  
  // Internal methods
  _setError: (error: string | null) => void;
  _setLoading: (loading: boolean) => void;
}

export const useMemberStore = create<MemberStore>()(
  immer((set, get) => ({
    // Initial state
    members: [],
    sessionPlayers: [],
    isLoading: false,
    error: null,

    // Member Management
    createMember: async (data: CreateMemberData) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        const now = new Date().toISOString();
        const newMember: Omit<Member, 'id'> = {
          ...data,
          createdAt: now,
          updatedAt: now,
        };

        const id = await db.members.add(newMember as any);

        const createdMember: Member = {
          id,
          ...newMember,
        };

        set((state) => {
          state.members.push(createdMember);
        });

        return id;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '選手の作成に失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    updateMember: async (id: number, data: UpdateMemberData) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        const updatedAt = new Date().toISOString();
        const updateData = { ...data, updatedAt };

        await db.members.update(id, updateData);

        set((state) => {
          const memberIndex = state.members.findIndex(m => m.id === id);
          if (memberIndex !== -1) {
            const member = state.members[memberIndex];
            if (member) {
              Object.keys(updateData).forEach(key => {
                if (key in member) {
                  (member as any)[key] = (updateData as any)[key];
                }
              });
            }
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '選手の更新に失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    deleteMember: async (id: number) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        // Delete related session players in transaction
        await db.transaction('rw', [db.members, db.sessionPlayers], async () => {
          await db.members.delete(id);
          await db.sessionPlayers.where('memberId').equals(id).delete();
        });

        set((state) => {
          state.members = state.members.filter(m => m.id !== id);
          state.sessionPlayers = state.sessionPlayers.filter(sp => sp.memberId !== id);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '選手の削除に失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    loadAllMembers: async () => {
      const state = get();
      state._setLoading(true);
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
      } finally {
        state._setLoading(false);
      }
    },

    // Session Player Management
    addPlayerToSession: async (sessionId: string, memberId: number) => {
      const state = get();
      state._setError(null);

      try {
        // Check if already exists
        const existing = await db.sessionPlayers
          .where('[sessionId+memberId]')
          .equals([sessionId, memberId])
          .first();

        if (existing) {
          throw new Error('この選手は既にセッションに追加されています');
        }

        const now = new Date().toISOString();
        const newSessionPlayer: Omit<SessionPlayer, 'id'> = {
          sessionId,
          memberId,
          status: 'active',
          createdAt: now,
        };

        const id = await db.sessionPlayers.add(newSessionPlayer as any);

        const createdSessionPlayer: SessionPlayer = {
          id,
          ...newSessionPlayer,
        };

        set((state) => {
          state.sessionPlayers.push(createdSessionPlayer);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'セッションへの参加者追加に失敗しました';
        state._setError(errorMessage);
        throw error;
      }
    },

    removePlayerFromSession: async (sessionId: string, memberId: number) => {
      const state = get();
      state._setError(null);

      try {
        await db.sessionPlayers
          .where('[sessionId+memberId]')
          .equals([sessionId, memberId])
          .delete();

        set((state) => {
          state.sessionPlayers = state.sessionPlayers.filter(
            sp => !(sp.sessionId === sessionId && sp.memberId === memberId)
          );
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'セッションからの参加者削除に失敗しました';
        state._setError(errorMessage);
        throw error;
      }
    },

    updateSessionPlayerStatus: async (sessionId: string, memberId: number, status: SessionPlayer['status']) => {
      const state = get();
      state._setError(null);

      try {
        await db.sessionPlayers
          .where('[sessionId+memberId]')
          .equals([sessionId, memberId])
          .modify({ status });

        set((state) => {
          const sessionPlayer = state.sessionPlayers.find(
            sp => sp.sessionId === sessionId && sp.memberId === memberId
          );
          if (sessionPlayer) {
            sessionPlayer.status = status;
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '参加者ステータスの更新に失敗しました';
        state._setError(errorMessage);
        throw error;
      }
    },

    loadSessionPlayers: async (sessionId: string) => {
      const state = get();
      state._setLoading(true);
      state._setError(null);

      try {
        const sessionPlayers = await db.sessionPlayers
          .where('sessionId')
          .equals(sessionId)
          .toArray();

        set((state) => {
          // Remove existing session players for this session and add new ones
          state.sessionPlayers = state.sessionPlayers.filter(sp => sp.sessionId !== sessionId);
          state.sessionPlayers.push(...sessionPlayers);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'セッション参加者の読み込みに失敗しました';
        state._setError(errorMessage);
        throw error;
      } finally {
        state._setLoading(false);
      }
    },

    // Utility methods
    getSessionPlayers: (sessionId: string) => {
      const state = get();
      return state.sessionPlayers.filter(sp => sp.sessionId === sessionId);
    },

    getMembersBySession: (sessionId: string) => {
      const state = get();
      const sessionPlayersForSession = state.sessionPlayers.filter(sp => sp.sessionId === sessionId);
      
      return sessionPlayersForSession.map(sessionPlayer => {
        const member = state.members.find(m => m.id === sessionPlayer.memberId);
        if (!member) {
          throw new Error(`Member with id ${sessionPlayer.memberId} not found`);
        }
        return { member, sessionPlayer };
      });
    },

    clearMembers: () => {
      set((state) => {
        state.members = [];
        state.sessionPlayers = [];
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