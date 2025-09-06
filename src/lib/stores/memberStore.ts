import { create } from 'zustand';
import { db } from '@/lib/db';
import type { Member } from '@/types/member';

type State = {
  members: Member[];
  isLoading: boolean;
  error: string | null;
};

type Actions = {
  load: () => Promise<void>;
  add: (name: string) => Promise<void>;
  update: (id: number, updates: Partial<Pick<Member, 'name' | 'isActive'>>) => Promise<void>;
  remove: (id: number) => Promise<void>;
  clearError: () => void;
};

export const useMemberStore = create<State & Actions>((set, get) => ({
  members: [],
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const list = await db.members.orderBy('createdAt').reverse().toArray();
      set({ members: list, isLoading: false });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to load members', isLoading: false });
    }
  },

  add: async (name: string) => {
    const now = new Date().toISOString();
    const member: Omit<Member, 'id'> = {
      name: name.trim(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    if (!member.name) return;
    try {
      const id = await db.members.add(member as Member);
      set({ members: [{ id, ...member }, ...get().members] });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to add member' });
    }
  },

  update: async (id, updates) => {
    try {
      const existing = await db.members.get(id);
      if (!existing) return;
      const updated: Member = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      await db.members.put(updated);
      set({ members: get().members.map(m => (m.id === id ? updated : m)) });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to update member' });
    }
  },

  remove: async (id) => {
    try {
      await db.members.delete(id);
      set({ members: get().members.filter(m => m.id !== id) });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to delete member' });
    }
  },

  clearError: () => set({ error: null }),
}));

