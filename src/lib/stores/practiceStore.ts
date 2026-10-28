import { create } from 'zustand';
import { db } from '@/lib/db';
import type { PracticePlayer, PracticeSettings } from '@/types/practice';
import type { Round, CourtMatch, MatchResult } from '@/types/round';
import type { PracticeSession } from '@/types/practiceSession';
import {
  generateFairRound,
  calculatePlayerStats,
} from '@/lib/fairnessAlgorithm';
import { MAX_COURTS } from '@/lib/constants';

const SETTINGS_ID = 1;

type State = {
  settings: PracticeSettings | null;
  players: PracticePlayer[];
  rounds: Round[];
  sessions: PracticeSession[];
  isLoading: boolean;
  isInitialLoad: boolean;
  /** 組み合わせ生成中。画面全体の読み込みとは分ける。 */
  isGenerating: boolean;
  /** 練習の終了処理中。二重に履歴へ保存しない。 */
  isResetting: boolean;
  error: string | null;
};

type Actions = {
  load: () => Promise<void>;
  loadSessions: () => Promise<void>;
  startPractice: (courts: number, memberIds: number[], clubTags?: string[]) => Promise<void>;
  toggleStatus: (memberId: number) => Promise<void>;
  setPlayerAvailability: (
    memberId: number,
    mode: 'active' | 'break' | 'early'
  ) => Promise<void>;
  generateNextRound: () => Promise<void>;
  undoLastRound: () => Promise<boolean>;
  resetPractice: () => Promise<'saved' | 'ended' | 'failed'>;
  addParticipant: (memberId: number) => Promise<void>;
  substitutePlayer: (fromMemberId: number, toMemberId: number) => Promise<boolean>;
  updateCourts: (courts: number) => Promise<void>;
  recordResult: (roundNo: number, courtNo: number, result: MatchResult) => Promise<void>;
  updateSessionResult: (sessionId: number, roundNo: number, courtNo: number, result: MatchResult) => Promise<void>;
  updateSessionTags: (sessionId: number, tags: string[]) => Promise<void>;
  deleteSessionCourt: (sessionId: number, roundNo: number, courtNo: number) => Promise<void>;
  deleteSession: (sessionId: number) => Promise<void>;
  clearError: () => void;
};

export const usePracticeStore = create<State & Actions>((set, get) => ({
  settings: null,
  players: [],
  rounds: [],
  sessions: [],
  isLoading: false,
  isInitialLoad: false,
  isGenerating: false,
  isResetting: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const [storedSettings, players, rounds] = await Promise.all([
        db.practiceSettings.get(SETTINGS_ID),
        db.practicePlayers.toArray(),
        db.rounds.orderBy('roundNo').toArray(),
      ]);
      let settings = storedSettings ?? null;
      if (settings && settings.courts > MAX_COURTS) {
        settings = { ...settings, courts: MAX_COURTS };
        await db.practiceSettings.put(settings);
      }
      set({
        settings,
        players,
        rounds,
        isLoading: false,
        isInitialLoad: true,
      });
    } catch (e: unknown) {
      set({
        error: e instanceof Error ? e.message : '練習データを読み込めませんでした',
        isLoading: false,
        isInitialLoad: true,
      });
    }
  },

  loadSessions: async () => {
    try {
      const sessions = await db.practiceSessions.toArray();
      set({ sessions });
    } catch (e: unknown) {
      set({
        error: e instanceof Error ? e.message : '履歴を読み込めませんでした',
      });
    }
  },

  startPractice: async (courts, memberIds, clubTags?) => {
    const now = new Date().toISOString();
    const normalizedCourts = Math.min(
      MAX_COURTS,
      Math.max(1, Math.floor(courts))
    );
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
            courts: normalizedCourts,
            currentRound: 0,
            startedAt: now,
            updatedAt: now,
            clubTags,
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
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : '練習を開始できませんでした' });
    }
  },

  toggleStatus: async (memberId) => {
    const player = get().players.find((item) => item.memberId === memberId);
    if (!player) return;
    await get().setPlayerAvailability(
      memberId,
      player.status === 'active' ? 'break' : 'active'
    );
  },

  setPlayerAvailability: async (memberId, mode) => {
    try {
      const player = await db.practicePlayers.get(memberId);
      if (!player) return;
      const updated: PracticePlayer =
        mode === 'active'
          ? { ...player, status: 'active' }
          : { ...player, status: 'rest', restKind: mode };
      if (mode === 'active') delete updated.restKind;
      await db.practicePlayers.put(updated);
      set({
        players: get().players.map((item) =>
          item.memberId === memberId ? updated : item
        ),
      });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : '出場状態を変更できませんでした' });
    }
  },

  generateNextRound: async () => {
    const state = get();
    const s = state.settings;
    if (!s || state.isGenerating) return;
    const activePlayers = state.players.filter((p) => p.status === 'active');

    if (activePlayers.length < 4) {
      set({
        error: `出場できる人が${activePlayers.length}人です（4人必要）。休憩・早退の人を戻すか、参加者を追加してください`,
      });
      return;
    }

    set({ isGenerating: true, error: null });
    try {

      // 新しい公平性アルゴリズムを使用（各プレイヤーの playedOffset を内部で加味）
      const { courts, rests } = generateFairRound(
        activePlayers,
        Math.min(MAX_COURTS, s.courts),
        state.rounds
      );

      const nextNo = s.currentRound + 1;
      const returning = state.players.filter(
        (player) => player.status === 'rest' && player.restKind === 'break'
      );
      const breakMemberIds = returning.map((player) => player.memberId);
      const round: Round = { roundNo: nextNo, courts, rests, breakMemberIds };

      await db.transaction(
        'rw',
        db.rounds,
        db.practiceSettings,
        db.practicePlayers,
        async () => {
          await db.rounds.put(round);
          await db.practiceSettings.put({
            ...s,
            currentRound: nextNo,
            updatedAt: new Date().toISOString(),
          });
          for (const player of returning) {
            const next: PracticePlayer = { ...player, status: 'active' };
            delete next.restKind;
            await db.practicePlayers.put(next);
          }
        }
      );

      const returnedIds = new Set(returning.map((player) => player.memberId));
      set({
        rounds: [...state.rounds, round],
        players: state.players.map((player) => {
          if (!returnedIds.has(player.memberId)) return player;
          const next: PracticePlayer = { ...player, status: 'active' };
          delete next.restKind;
          return next;
        }),
        settings: {
          ...s,
          currentRound: nextNo,
          updatedAt: new Date().toISOString(),
        },
        isGenerating: false,
      });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : '組み合わせを生成できませんでした', isGenerating: false });
    }
  },

  undoLastRound: async () => {
    const state = get();
    const settings = state.settings;
    const last = state.rounds[state.rounds.length - 1];
    if (!settings || !last) return false;

    const remaining = state.rounds.slice(0, -1);
    const previous = remaining[remaining.length - 1];
    const currentRound = previous ? previous.roundNo : 0;
    const updatedAt = new Date().toISOString();
    const breakMemberIds = last.breakMemberIds ?? [];
    const restoredIds: number[] = [];

    try {
      await db.transaction(
        'rw',
        db.rounds,
        db.practiceSettings,
        db.practicePlayers,
        async () => {
          await db.rounds.delete(last.roundNo);
          await db.practiceSettings.put({
            ...settings,
            currentRound,
            updatedAt,
          });
          for (const memberId of breakMemberIds) {
            const player = await db.practicePlayers.get(memberId);
            // 生成後に早退などへ変えた人は、いまの状態を残す
            if (!player || player.status !== 'active') continue;
            await db.practicePlayers.put({
              ...player,
              status: 'rest',
              restKind: 'break',
            });
            restoredIds.push(memberId);
          }
        }
      );
      const restored = new Set(restoredIds);
      set({
        rounds: remaining,
        settings: { ...settings, currentRound, updatedAt },
        players: state.players.map((player) =>
          restored.has(player.memberId)
            ? { ...player, status: 'rest', restKind: 'break' }
            : player
        ),
      });
      return true;
    } catch (e: unknown) {
      set({
        error: e instanceof Error ? e.message : '直前のラウンドを取り消せませんでした',
      });
      return false;
    }
  },

  resetPractice: async () => {
    if (get().isResetting) return 'failed';
    set({ isResetting: true });
    const state = get();
    let archived = false;
    try {
      await db.transaction(
        'rw',
        db.practiceSettings,
        db.practicePlayers,
        db.rounds,
        db.practiceSessions,
        async () => {
          // ラウンドが1つ以上ある場合、セッションをアーカイブ
          if (state.settings && state.rounds.length > 0) {
            const session: PracticeSession = {
              startedAt: state.settings.startedAt ?? new Date().toISOString(),
              endedAt: new Date().toISOString(),
              courts: state.settings.courts,
              playerIds: state.players.map((p) => p.memberId),
              participants: state.players.map((p) => ({
                memberId: p.memberId,
                playerNumber: p.playerNumber,
              })),
              rounds: state.rounds,
              clubTags: state.settings.clubTags,
            };
            await db.practiceSessions.add(session);
            archived = true;
          }

          await db.practiceSettings.clear();
          await db.practicePlayers.clear();
          await db.rounds.clear();
        }
      );
      set({
        settings: null,
        players: [],
        rounds: [],
        error: null,
        isResetting: false,
      });
      return archived ? 'saved' : 'ended';
    } catch (e: unknown) {
      set({
        error: e instanceof Error ? e.message : '練習を終了できませんでした',
        isResetting: false,
      });
      return 'failed';
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
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : '参加者を追加できませんでした' });
    }
  },

  substitutePlayer: async (fromMemberId, toMemberId) => {
    const state = get();
    if (!state.settings) return false;

    try {
      // Update the latest round with substitution
      const latestRound = state.rounds[state.rounds.length - 1];
      if (!latestRound) return false;

      const updatedRound = { ...latestRound };

      // Update courts - swap fromMemberId and toMemberId
      updatedRound.courts = latestRound.courts.map((court) => ({
        ...court,
        pairA: court.pairA.map((id) => {
          if (id === fromMemberId) return toMemberId;
          if (id === toMemberId) return fromMemberId;
          return id;
        }) as [number, number],
        pairB: court.pairB.map((id) => {
          if (id === fromMemberId) return toMemberId;
          if (id === toMemberId) return fromMemberId;
          return id;
        }) as [number, number],
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
      return true;
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : '選手を入れ替えられませんでした' });
      return false;
    }
  },

  updateCourts: async (courts) => {
    const state = get();
    if (!state.settings) return;
    const normalizedCourts = Math.min(
      MAX_COURTS,
      Math.max(1, Math.floor(courts))
    );

    try {
      const updatedSettings = {
        ...state.settings,
        courts: normalizedCourts,
        updatedAt: new Date().toISOString(),
      };

      await db.practiceSettings.put(updatedSettings);
      set({ settings: updatedSettings });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'コート数を変更できませんでした' });
    }
  },

  recordResult: async (roundNo, courtNo, result) => {
    const state = get();
    const roundIndex = state.rounds.findIndex((r) => r.roundNo === roundNo);
    if (roundIndex === -1) return;

    try {
      const round = state.rounds[roundIndex]!;
      const updatedCourts = round.courts.map((court) =>
        court.courtNo === courtNo ? { ...court, result } : court
      );
      const updatedRound: Round = { ...round, courts: updatedCourts };

      await db.rounds.put(updatedRound);

      const updatedRounds = [...state.rounds];
      updatedRounds[roundIndex] = updatedRound;
      set({ rounds: updatedRounds });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : '勝敗を記録できませんでした' });
    }
  },

  updateSessionResult: async (sessionId, roundNo, courtNo, result) => {
    try {
      const session = await db.practiceSessions.get(sessionId);
      if (!session) return;

      const updatedRounds = session.rounds.map((round) => {
        if (round.roundNo !== roundNo) return round;
        return {
          ...round,
          courts: round.courts.map((court) =>
            court.courtNo === courtNo ? { ...court, result } : court
          ),
        };
      });

      await db.practiceSessions.update(sessionId, { rounds: updatedRounds });
      set({
        sessions: get().sessions.map((s) =>
          s.id === sessionId ? { ...s, rounds: updatedRounds } : s
        ),
      });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : '勝敗を更新できませんでした' });
    }
  },

  updateSessionTags: async (sessionId, tags) => {
    try {
      await db.practiceSessions.update(sessionId, { clubTags: tags });
      set({
        sessions: get().sessions.map((s) =>
          s.id === sessionId ? { ...s, clubTags: tags } : s
        ),
      });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'クラブを更新できませんでした' });
    }
  },

  deleteSessionCourt: async (sessionId, roundNo, courtNo) => {
    try {
      const session = await db.practiceSessions.get(sessionId);
      if (!session) return;

      const updatedRounds = session.rounds
        .map((round) => {
          if (round.roundNo !== roundNo) return round;
          return {
            ...round,
            courts: round.courts.filter((court) => court.courtNo !== courtNo),
          };
        })
        .filter((round) => round.courts.length > 0);

      await db.practiceSessions.update(sessionId, { rounds: updatedRounds });
      set({
        sessions: get().sessions.map((s) =>
          s.id === sessionId ? { ...s, rounds: updatedRounds } : s
        ),
      });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : '試合を削除できませんでした' });
    }
  },

  deleteSession: async (sessionId) => {
    try {
      await db.practiceSessions.delete(sessionId);
      set({
        sessions: get().sessions.filter((s) => s.id !== sessionId),
      });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : '履歴を削除できませんでした' });
    }
  },

  clearError: () => set({ error: null }),
}));
