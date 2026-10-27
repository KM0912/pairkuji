import { create } from 'zustand';
import { db } from '@/lib/db';
import type { Member } from '@/types/member';

type State = {
  members: Member[];
  allMembers: Member[];
  isLoading: boolean;
  isInitialLoad: boolean;
  error: string | null;
};

type Actions = {
  load: () => Promise<void>;
  loadAll: () => Promise<void>;
  add: (name: string) => Promise<number | null>;
  addMany: (names: string[]) => Promise<{ added: number; skipped: string[] }>;
  update: (
    id: number,
    updates: Partial<Pick<Member, 'name' | 'isActive'>>
  ) => Promise<boolean>;
  remove: (id: number) => Promise<void>;
  clearError: () => void;
};

export const useMemberStore = create<State & Actions>((set, get) => ({
  members: [],
  allMembers: [],
  isLoading: false,
  isInitialLoad: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const all = await db.members.orderBy('createdAt').reverse().toArray();
      const list = all.filter((m) => !m.isDeleted);
      set({ members: list, isLoading: false, isInitialLoad: true });
    } catch (e: unknown) {
      set({
        error: e instanceof Error ? e.message : '名簿を読み込めませんでした',
        isLoading: false,
        isInitialLoad: true,
      });
    }
  },

  loadAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const list = await db.members.orderBy('createdAt').reverse().toArray();
      set({ allMembers: list, isLoading: false, isInitialLoad: true });
    } catch (e: unknown) {
      set({
        error: e instanceof Error ? e.message : '名簿を読み込めませんでした',
        isLoading: false,
        isInitialLoad: true,
      });
    }
  },

  add: async (name: string) => {
    const now = new Date().toISOString();
    const member: Omit<Member, 'id'> = {
      name: name.trim(),
      isActive: true,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };
    if (!member.name) return null;
    try {
      const rows = await db.members.toArray();
      const duplicate = rows.some(
        (row) => !row.isDeleted && row.name.trim() === member.name
      );
      if (duplicate) {
        set({ error: '同じ名前の選手がすでにいます' });
        return null;
      }
      const id = await db.members.add(member as Member);
      const created: Member = { id: Number(id), ...member };
      set({ members: [created, ...get().members] });
      return created.id;
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : '選手を追加できませんでした' });
      return null;
    }
  },

  addMany: async (names: string[]) => {
    const stored = await db.members.toArray();
    const existing = new Set(
      stored.filter((member) => !member.isDeleted).map((member) => member.name.trim())
    );
    const skipped: string[] = [];
    const toAdd: string[] = [];
    const seen = new Set<string>();
    for (const raw of names) {
      const name = raw.trim();
      if (!name) continue;
      if (existing.has(name) || seen.has(name)) {
        skipped.push(name);
        continue;
      }
      seen.add(name);
      toAdd.push(name);
    }

    if (toAdd.length === 0) return { added: 0, skipped };

    const now = new Date().toISOString();
    try {
      const created: Member[] = [];
      await db.transaction('rw', db.members, async () => {
        for (const name of toAdd) {
          const member: Omit<Member, 'id'> = {
            name,
            isActive: true,
            isDeleted: false,
            createdAt: now,
            updatedAt: now,
          };
          const id = await db.members.add(member as Member);
          created.push({ id: Number(id), ...member });
        }
      });
      set({ members: [...created, ...get().members] });
      return { added: created.length, skipped };
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : '選手を追加できませんでした' });
      return { added: 0, skipped };
    }
  },

  update: async (id, updates) => {
    try {
      const existing = await db.members.get(id);
      if (!existing) return false;
      const nextName = updates.name?.trim();
      const renamed =
        nextName != null && nextName.length > 0 && nextName !== existing.name.trim();
      if (renamed && nextName) {
        const rows = await db.members.toArray();
        const duplicate = rows.some(
          (row) => row.id !== id && !row.isDeleted && row.name.trim() === nextName
        );
        if (duplicate) {
          set({ error: '同じ名前の選手がすでにいます' });
          return false;
        }
      }
      const updated: Member = {
        ...existing,
        ...updates,
        ...(nextName ? { name: nextName } : {}),
        ...(renamed ? { isSample: false } : {}),
        updatedAt: new Date().toISOString(),
      };
      await db.members.put(updated);
      set({ members: get().members.map((m) => (m.id === id ? updated : m)) });
      return true;
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : '選手を更新できませんでした' });
      return false;
    }
  },

  remove: async (id) => {
    try {
      const now = new Date().toISOString();
      await db.members.update(id, { isDeleted: true, updatedAt: now });
      set({
        members: get().members.filter((m) => m.id !== id),
        allMembers: get().allMembers.map((m) =>
          m.id === id ? { ...m, isDeleted: true, updatedAt: now } : m
        ),
      });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : '選手を削除できませんでした' });
    }
  },

  clearError: () => set({ error: null }),
}));
