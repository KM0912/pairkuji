import { create } from 'zustand';
import { db } from '@/lib/db';
import type { PracticePlayer, PracticeSettings } from '@/types/practice';
import type { Round, CourtMatch } from '@/types/round';
import {
  generateFairRound,
  calculatePlayerStats,
} from '@/lib/fairnessAlgorithm';

const SETTINGS_ID = 1;

type State = {
  settings: PracticeSettings | null;
  players: PracticePlayer[];
  rounds: Round[];
  selectedMembers: number[]; // 設定画面で選択された参加者を一時保存
  selectedCourts: number; // 設定画面で選択されたコート数を一時保存
  isLoading: boolean;
  error: string | null;
};

type Actions = {
  load: () => Promise<void>;
  startPractice: (courts: number, memberIds: number[]) => Promise<void>;
  startPracticeFromSelected: () => Promise<void>;
  toggleStatus: (memberId: number) => Promise<void>;
  generateNextRound: () => Promise<void>;
  resetPractice: () => Promise<void>;
  addParticipant: (memberId: number) => Promise<void>;
  substitutePlayer: (fromMemberId: number, toMemberId: number) => Promise<void>;
  updateCourts: (courts: number) => Promise<void>;
  setSelectedMembers: (memberIds: number[]) => void;
  setSelectedCourts: (courts: number) => void;
  clearError: () => void;
};

export const usePracticeStore = create<State & Actions>((set, get) => ({
  settings: null,
  players: [],
  rounds: [],
  selectedMembers: [],
  selectedCourts: 2,
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const [settings, players, rounds] = await Promise.all([
        db.practiceSettings.get(SETTINGS_ID),
        db.practicePlayers.toArray(),
        db.rounds.orderBy('roundNo').toArray(),
      ]);
      set({ settings: settings ?? null, players, rounds, isLoading: false });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to load practice', isLoading: false });
    }
  },

  startPractice: async (courts, memberIds) => {
    const now = new Date().toISOString();
    try {
      await db.transaction(
        'rw',
        db.practiceSettings,
        db.practicePlayers,
        db.rounds,
        async () => {
          await db.practiceSettings.clear();
          await db.practicePlayers.clear();
          await db.rounds.clear();
          const settings: PracticeSettings = {
            id: SETTINGS_ID,
            courts,
            currentRound: 0,
            startedAt: now,
            updatedAt: now,
          };
          await db.practiceSettings.put(settings);
          const players: PracticePlayer[] = memberIds.map((mid, index) => ({
            memberId: mid,
            playerNumber: index + 1, // 選択順に番号を振る（1から開始）
            status: 'active',
            createdAt: now,
          }));
          await db.practicePlayers.bulkPut(players);
        }
      );

      await get().load();
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to start practice' });
    }
  },

  startPracticeFromSelected: async () => {
    const state = get();
    if (state.selectedMembers.length < 4) {
      set({ error: '参加者が4名未満のため練習を開始できません' });
      return;
    }
    await get().startPractice(state.selectedCourts, state.selectedMembers);
  },

  toggleStatus: async (memberId) => {
    try {
      const player = await db.practicePlayers.get(memberId);
      if (!player) return;
      const updated: PracticePlayer = {
        ...player,
        status: player.status === 'active' ? 'rest' : 'active',
      };
      await db.practicePlayers.put(updated);
      set({
        players: get().players.map((p) =>
          p.memberId === memberId ? updated : p
        ),
      });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to toggle status' });
    }
  },

  generateNextRound: async () => {
    const state = get();
    const s = state.settings;
    if (!s) return;
    try {
      const activePlayers = state.players.filter((p) => p.status === 'active');

      if (activePlayers.length < 4) {
        set({ error: '参加者が4名未満のため組み合わせを生成できません' });
        return;
      }

      // 新しい公平性アルゴリズムを使用（各プレイヤーの playedOffset を内部で加味）
      const { courts, rests } = generateFairRound(
        activePlayers,
        s.courts,
        state.rounds
      );

      const nextNo = s.currentRound + 1;
      const round: Round = { roundNo: nextNo, courts, rests };

      await db.transaction('rw', db.rounds, db.practiceSettings, async () => {
        await db.rounds.put(round);
        await db.practiceSettings.put({
          ...s,
          currentRound: nextNo,
          updatedAt: new Date().toISOString(),
        });
      });

      set({
        rounds: [...state.rounds, round],
        settings: {
          ...s,
          currentRound: nextNo,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to generate round' });
    }
  },

  resetPractice: async () => {
    try {
      await db.transaction(
        'rw',
        db.practiceSettings,
        db.practicePlayers,
        db.rounds,
        async () => {
          await db.practiceSettings.clear();
          await db.practicePlayers.clear();
          await db.rounds.clear();
        }
      );
      set({ settings: null, players: [], rounds: [] });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to reset practice' });
    }
  },

  addParticipant: async (memberId) => {
    const state = get();
    try {
      // Check if member is already participating
      if (state.players.some((p) => p.memberId === memberId)) {
        set({ error: 'この選手は既に参加しています' });
        return;
      }

      const now = new Date().toISOString();
      const nextPlayerNumber =
        Math.max(...state.players.map((p) => p.playerNumber), 0) + 1;

      // 現在の出場可（active）における「有効な試合数（既存の playedOffset を含む）」の最小値を算出
      const activePlayers = state.players.filter((p) => p.status === 'active');
      const activeIds = activePlayers.map((p) => p.memberId);
      let minPlayed = 0;
      if (activeIds.length > 0) {
        const offsets = new Map<number, number>();
        activePlayers.forEach((p) =>
          offsets.set(p.memberId, p.playedOffset ?? 0)
        );
        const stats = calculatePlayerStats(activeIds, state.rounds, offsets);
        const values = activeIds.map((id) => stats.get(id)?.playedCount ?? 0);
        minPlayed = values.length ? Math.min(...values) : 0;
      }

      const newPlayer: PracticePlayer = {
        memberId,
        playerNumber: nextPlayerNumber,
        status: 'active',
        createdAt: now,
        playedOffset: minPlayed,
      };

      await db.practicePlayers.put(newPlayer);
      set({ players: [...state.players, newPlayer] });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to add participant' });
    }
  },

  substitutePlayer: async (fromMemberId, toMemberId) => {
    const state = get();
    if (!state.settings) return;

    try {
      // Update the latest round with substitution
      const latestRound = state.rounds[state.rounds.length - 1];
      if (!latestRound) return;

      const updatedRound = { ...latestRound };

      // Update courts - swap fromMemberId and toMemberId
      updatedRound.courts = latestRound.courts.map((court) => ({
        ...court,
        pairA: court.pairA.map((id) => {
          if (id === fromMemberId) return toMemberId;
          if (id === toMemberId) return fromMemberId;
          return id;
        }),
        pairB: court.pairB.map((id) => {
          if (id === fromMemberId) return toMemberId;
          if (id === toMemberId) return fromMemberId;
          return id;
        }),
      }));

      // Update rests - swap fromMemberId and toMemberId
      updatedRound.rests = latestRound.rests.map((id) => {
        if (id === fromMemberId) return toMemberId;
        if (id === toMemberId) return fromMemberId;
        return id;
      });

      // Clean up duplicates and ensure proper placement
      // Remove any duplicates that might have occurred during swapping
      const allCourtPlayers = updatedRound.courts.flatMap((court) => [
        ...court.pairA,
        ...court.pairB,
      ]);

      // Remove court players from rests
      updatedRound.rests = updatedRound.rests.filter(
        (id) => !allCourtPlayers.includes(id)
      );

      // Ensure both players are somewhere (either in court or in rests)
      if (
        !allCourtPlayers.includes(fromMemberId) &&
        !updatedRound.rests.includes(fromMemberId)
      ) {
        updatedRound.rests.push(fromMemberId);
      }
      if (
        !allCourtPlayers.includes(toMemberId) &&
        !updatedRound.rests.includes(toMemberId)
      ) {
        updatedRound.rests.push(toMemberId);
      }

      // Update database
      await db.rounds.put(updatedRound);

      // Update state
      const updatedRounds = [...state.rounds];
      updatedRounds[updatedRounds.length - 1] = updatedRound;
      set({ rounds: updatedRounds });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to substitute player' });
    }
  },

  updateCourts: async (courts) => {
    const state = get();
    if (!state.settings) return;

    try {
      const updatedSettings = {
        ...state.settings,
        courts,
        updatedAt: new Date().toISOString(),
      };

      await db.practiceSettings.put(updatedSettings);
      set({ settings: updatedSettings });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to update courts' });
    }
  },

  setSelectedMembers: (memberIds) => set({ selectedMembers: memberIds }),

  setSelectedCourts: (courts) => set({ selectedCourts: courts }),

  clearError: () => set({ error: null }),
}));
