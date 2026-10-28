'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMemberStore } from '@/lib/stores/memberStore';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import { ParticipantSelection } from '@/components/practice/ParticipantSelection';
import { ParticipantManagement } from '@/components/practice/ParticipantManagement';
import { CourtManagement } from '@/components/practice/CourtManagement';
import { AddParticipantModal } from '@/components/practice/AddParticipantModal';
import { SubstitutionHint } from '@/components/practice/SubstitutionHint';
import { Button } from '@/components/ui/button';
import { CourtSelector } from '@/components/ui/CourtSelector';
import { Spinner } from '@/components/ui/spinner';
import { SessionStatsModal } from '@/components/practice/SessionStatsModal';
import { FullscreenDisplay } from '@/components/practice/FullscreenDisplay';
import { useCourtDisplayMode } from '@/hooks/useCourtDisplayMode';
import { calculateWinRates } from '@/lib/winRateCalculator';
import { cn } from '@/lib/utils';
import {
  countOpponentOccurrencesInRounds,
  countPairOccurrencesInRounds,
} from '@/lib/statsCalculator';
import { Users, AlertTriangle, Shuffle, MoreVertical, Monitor } from 'lucide-react';
import { PiCourtBasketball } from 'react-icons/pi';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { shouldBlockPracticeScreen } from '@/lib/practiceScreen';
import {
  GENERATING_LABEL,
  substitutionToast,
} from '@/lib/practiceLabels';
import {
  canUndoSubstitution,
  courtsWithRecordedResult,
  type SubstitutionUndoState,
} from '@/lib/substitutionUndo';
import Link from 'next/link';

type PracticeToast = {
  message: string;
  undo?: { kind: 'round' } | ({ kind: 'substitution' } & SubstitutionUndoState);
};

const HIDE_RESULT_REMINDER_KEY = 'pairkuji-hide-result-reminder';

export default function PracticePage() {
  const {
    members,
    isInitialLoad: membersInitialLoad,
    error: memberError,
    load: loadMembers,
    add: addMember,
    clearError: clearMemberError,
  } = useMemberStore();
  const {
    settings,
    players,
    rounds,
    isInitialLoad: practiceInitialLoad,
    isGenerating,
    error,
    load,
    startPractice,
    setPlayerAvailability,
    generateNextRound,
    undoLastRound,
    resetPractice,
    clearError,
    addParticipant,
    substitutePlayer,
    updateCourts,
    recordResult,
  } = usePracticeStore();

  const activeCount = players.filter((player) => player.status === 'active').length;
  const generateBlockedReason =
    activeCount < 4
      ? `出場できる人が${activeCount}人です（4人必要）。休憩・早退の人を戻すか、参加者を追加してください`
      : null;

  const [courts, setCourts] = useState(2);
  const [isStarting, setIsStarting] = useState(false);
  const [clubTags, setClubTags] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [substituting, setSubstituting] = useState<number | null>(null);
  const combosRef = useRef<HTMLDivElement | null>(null);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [showCourtModal, setShowCourtModal] = useState(false);
  const [pendingCourts, setPendingCourts] = useState<number>(courts);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showPracticeMenu, setShowPracticeMenu] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [hideResultReminder, setHideResultReminder] = useState(false);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const [dismissResultReminder, setDismissResultReminder] = useState(false);
  const [toast, setToast] = useState<PracticeToast | null>(null);
  const [endedNotice, setEndedNotice] = useState<number[] | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [selectionNote, setSelectionNote] = useState<string | null>(null);
  const endingRef = useRef(false);
  const [courtNotice, setCourtNotice] = useState<string | null>(null);
  const roundCountAtCourtChange = useRef<number | null>(null);
  const { mode: courtDisplayMode, setMode: setCourtDisplayMode } =
    useCourtDisplayMode();

  useEffect(() => {
    clearMemberError();
    loadMembers();
    load();
    return () => clearMemberError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!settings) {
      setShowRoundSummary(false);
      setShowCourtModal(false);
      setShowParticipantModal(false);
      setShowBoard(false);
    }
  }, [settings]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    setHideResultReminder(window.localStorage.getItem(HIDE_RESULT_REMINDER_KEY) === '1');
  }, []);

  useEffect(() => {
    if (
      courtNotice &&
      roundCountAtCourtChange.current !== null &&
      rounds.length !== roundCountAtCourtChange.current
    ) {
      setCourtNotice(null);
    }
  }, [courtNotice, rounds.length]);

  useEffect(() => {
    if (!settings) {
      // practice is not active, clear selection
      setSelected([]);
      return;
    }
    // keep selected list in sync with players when practice is active
    setSelected(players.map((p) => p.memberId));
  }, [settings, players]);

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id!, m])),
    [members]
  );
  const playerMap = useMemo(
    () => new Map(players.map((p) => [p.memberId, p])),
    [players]
  );

  const onToggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onReorderSelected = (orderedIds: number[]) => {
    setSelected(orderedIds);
  };

  const onCreateMember = async (name: string) => {
    const id = await addMember(name);
    if (id != null) {
      setSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
  };

  const onStart = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMemberError();
    if (isStarting || selected.length < 4) return;
    setIsStarting(true);
    try {
      await startPractice(courts, selected, clubTags.length > 0 ? clubTags : undefined);
    } finally {
      setIsStarting(false);
    }
  };

  const latestRound = rounds[rounds.length - 1];

  useEffect(() => {
    setSubstituting(null);
  }, [latestRound?.roundNo]);

  useEffect(() => {
    if (settings) {
      setEndedNotice(null);
      setSelectionNote(null);
    }
  }, [settings]);
  const toastCanUndo =
    toast?.undo?.kind === 'round'
      ? true
      : toast?.undo?.kind === 'substitution'
        ? canUndoSubstitution(toast.undo, latestRound, players)
        : false;

  const missedResultCount = useMemo(() => {
    return rounds
      .slice(0, -1)
      .reduce(
        (count, round) =>
          count + round.courts.filter((court) => court.result == null).length,
        0
      );
  }, [rounds]);

  const matchCounts = useMemo(() => {
    const counts = new Map<number, number>();

    rounds.forEach((round) => {
      round.courts.forEach((court) => {
        [...court.pairA, ...court.pairB].forEach((memberId) => {
          counts.set(memberId, (counts.get(memberId) || 0) + 1);
        });
      });
    });

    players.forEach((player) => {
      const base = counts.get(player.memberId) || 0;
      counts.set(player.memberId, base + (player.playedOffset || 0));
    });

    return counts;
  }, [rounds, players]);

  const pairCounts = useMemo(
    () => countPairOccurrencesInRounds(rounds),
    [rounds]
  );

  const opponentCounts = useMemo(
    () => countOpponentOccurrencesInRounds(rounds),
    [rounds]
  );

  // 勝率の計算
  const winRates = useMemo(() => {
    return calculateWinRates(rounds);
  }, [rounds]);

  const availableMembers = members
    .filter((m) => m.isActive && !players.some((p) => p.memberId === m.id))
    .slice()
    .sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || (a.id ?? 0) - (b.id ?? 0)
    );

  const onAddParticipants = async (memberIds: number[]) => {
    for (const id of memberIds) {
      await addParticipant(id);
    }
    setShowAddParticipant(false);
  };

  const onPlayerClick = async (memberId: number) => {
    if (!substituting) {
      setSubstituting(memberId);
      return;
    }
    if (substituting === memberId) {
      setSubstituting(null);
      return;
    }
    const fromId = substituting;
    const toId = memberId;
    const roundNo = latestRound?.roundNo;
    const fromName = memberMap.get(fromId)?.name ?? '選手';
    const toName = memberMap.get(toId)?.name ?? '選手';
    const clearedResults = latestRound
      ? courtsWithRecordedResult(latestRound.courts, fromId, toId)
      : [];
    const swapped = await substitutePlayer(fromId, toId);
    setSubstituting(null);
    if (!swapped || roundNo == null) return;
    for (const court of clearedResults) {
      await recordResult(roundNo, court.courtNo, null);
    }
    const state = usePracticeStore.getState();
    const swappedRound = state.rounds.find((round) => round.roundNo === roundNo);
    setToast({
      message: clearedResults.length
        ? `${substitutionToast(fromName, toName)}。勝敗の記録を消しました`
        : substitutionToast(fromName, toName),
      undo: {
        kind: 'substitution',
        fromId,
        toId,
        roundNo,
        results: (swappedRound?.courts ?? []).map((court) => ({
          courtNo: court.courtNo,
          result: court.result ?? null,
        })),
        players: [fromId, toId].map((memberId) => {
          const player = state.players.find((item) => item.memberId === memberId);
          return {
            memberId,
            status: player?.status ?? 'active',
            restKind: player?.restKind,
          };
        }),
        clearedResults,
      },
    });
  };

  const changeAvailability = async (
    memberId: number,
    mode: 'active' | 'break' | 'early'
  ) => {
    setSubstituting(null);
    await setPlayerAvailability(memberId, mode);
  };

  const handleReset = async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    setIsEnding(true);
    const memberIds = players.map((player) => player.memberId);
    const saved = rounds.length > 0;
    setSubstituting(null);
    try {
      const result = await resetPractice();
      setShowResetConfirm(false);
      setClubTags([]);
      if (saved && result === 'saved') {
        setEndedNotice(memberIds);
        setSelectionNote(null);
      }
    } finally {
      endingRef.current = false;
      setIsEnding(false);
    }
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
  };

  const executeGenerateNextRound = async () => {
    setSubstituting(null);
    const before = rounds.length;
    await generateNextRound();
    const after = usePracticeStore.getState().rounds.length;
    if (after > before) {
      const created = usePracticeStore.getState().rounds[after - 1];
      setToast({
        message: `第${created?.roundNo ?? after}ラウンドを生成しました`,
        undo: { kind: 'round' },
      });
    }
    requestAnimationFrame(() => {
      combosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const performUndoRound = async () => {
    setShowUndoConfirm(false);
    setToast(null);
    const undone = await undoLastRound();
    if (undone) {
      setToast({ message: '直前のラウンドを元に戻しました' });
    }
  };

  const handleUndoRound = async () => {
    const last = rounds[rounds.length - 1];
    if (last?.courts.some((court) => court.result != null)) {
      setShowPracticeMenu(false);
      setShowUndoConfirm(true);
      return;
    }
    await performUndoRound();
  };

  const handleToastUndo = async () => {
    const current = toast;
    if (!current?.undo) return;
    if (current.undo.kind === 'round') {
      await handleUndoRound();
      return;
    }
    const { fromId, toId } = current.undo;
    const state = usePracticeStore.getState();
    const latest = state.rounds[state.rounds.length - 1];
    if (!canUndoSubstitution(current.undo, latest, state.players)) {
      setToast({
        message:
          latest?.roundNo !== current.undo.roundNo
            ? '次のラウンドのあとなので、入れ替えは戻せません'
            : '勝敗か出場が変わったので、入れ替えは戻せません',
      });
      return;
    }
    const restored = await substitutePlayer(fromId, toId);
    if (restored) {
      for (const court of current.undo.clearedResults ?? []) {
        await recordResult(current.undo.roundNo, court.courtNo, court.result);
      }
    }
    setToast({
      message: restored ? '入れ替えを元に戻しました' : '入れ替えを戻せませんでした',
    });
  };

  useEffect(() => {
    if (!showCourtModal && settings) {
      setPendingCourts(settings.courts);
    }
  }, [settings, showCourtModal]);

  const handleOpenParticipants = () => {
    setShowParticipantModal(true);
  };

  const handleConfirmCourts = () => {
    if (!settings || pendingCourts === settings.courts) {
      setShowCourtModal(false);
      return;
    }
    updateCourts(pendingCourts);
    setCourtNotice(
      `コート数を${pendingCourts}にしました。次のラウンドから反映されます。`
    );
    roundCountAtCourtChange.current = rounds.length;
    setShowCourtModal(false);
  };

  const showBootSpinner = shouldBlockPracticeScreen(
    membersInitialLoad,
    practiceInitialLoad
  );

  if (showBootSpinner) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="size-8" />
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {(error || (memberError && !showAddParticipant)) && (
        <div
          role="alert"
          className="fixed top-16 left-4 right-4 z-toast mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-lg bg-destructive p-3 text-sm text-destructive-foreground shadow-level-3"
        >
          <span>{error || memberError}</span>
          <button
            type="button"
            className="shrink-0 underline"
            onClick={() => {
              clearError();
              clearMemberError();
            }}
          >
            閉じる
          </button>
        </div>
      )}
      {!settings ? (
        <>
        {endedNotice && (
          <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-level-1">
            <p className="text-sm font-semibold text-foreground">履歴に保存しました</p>
            <p className="mt-1 text-xs text-muted-foreground">
              クラブは空に戻しています。コート数は、この画面の設定のままです。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/history"
                className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                履歴を見る
              </Link>
              <button
                type="button"
                className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold"
                onClick={() => {
                  setSelected(endedNotice);
                  setEndedNotice(null);
                  setSelectionNote('同じメンバーを選びました。内容を確認してから開始してください。');
                  requestAnimationFrame(() => {
                    document.getElementById('doubles-participants')?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  });
                }}
              >
                同じメンバーを選ぶ
              </button>
            </div>
          </div>
        )}
        <ParticipantSelection
          members={members}
          courts={courts}
          setCourts={setCourts}
          selected={selected}
          onToggleSelect={onToggleSelect}
          onReorderSelected={onReorderSelected}
          onStart={onStart}
          starting={isStarting}
          clubTags={clubTags}
          onClubTagsChange={setClubTags}
          onCreateMember={onCreateMember}
          notice={selectionNote}
        />
        </>
      ) : (
        <>
          {/* ヘッダーエリア */}
          <div className="mb-5 flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRoundSummary(true)}
              aria-label={`ラウンド ${rounds.length}`}
              className="min-w-0 flex-1 px-1.5 text-base shadow-level-1 hover:shadow-level-2 sm:px-3.5 sm:text-sm"
            >
              <Shuffle className="w-4 h-4" />
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-small font-bold text-primary">{rounds.length}</span>
              <span className="text-small font-semibold sm:hidden">回</span>
              <span className="hidden text-small font-semibold sm:inline">ラウンド</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCourtModal(true)}
              aria-label={`コート ${settings.courts}`}
              className="min-w-0 flex-1 px-1.5 text-base shadow-level-1 hover:shadow-level-2 sm:px-3.5 sm:text-sm"
            >
              <PiCourtBasketball className="w-4 h-4" />
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-small font-bold text-primary">{settings.courts}</span>
              <span className="text-small font-semibold sm:hidden">面</span>
              <span className="hidden text-small font-semibold sm:inline">コート</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenParticipants}
              aria-label={`参加者 出場${activeCount}人、全体${players.length}人`}
              className="min-w-0 flex-1 px-1.5 text-base shadow-level-1 hover:shadow-level-2 sm:px-3.5 sm:text-sm"
            >
              <Users className="w-4 h-4" />
              <span
                className="rounded bg-primary/10 px-1.5 py-0.5 text-small font-bold text-primary"
                title={`出場できる人${activeCount}人、全体${players.length}人`}
              >
                {activeCount}/{players.length}
              </span>
              <span className="text-small font-semibold sm:hidden">人</span>
              <span className="hidden text-small font-semibold sm:inline">参加者</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPracticeMenu(true)}
              className="min-h-11 min-w-11 shrink-0 px-0 shadow-level-1"
              aria-label="練習メニュー"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>

          {courtNotice && (
            <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {courtNotice}
            </p>
          )}

          {missedResultCount > 0 && !hideResultReminder && !dismissResultReminder && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <button
                type="button"
                onClick={() => setShowRoundSummary(true)}
                className="w-full text-left"
              >
                前のラウンドに結果未入力の試合が{missedResultCount}件あります。ここから付けられます。
              </button>
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  className="min-h-11 underline"
                  onClick={() => setDismissResultReminder(true)}
                >
                  閉じる
                </button>
                <button
                  type="button"
                  className="min-h-11 underline"
                  onClick={() => {
                    window.localStorage.setItem(HIDE_RESULT_REMINDER_KEY, '1');
                    setHideResultReminder(true);
                  }}
                >
                  結果未入力の通知を出さない
                </button>
              </div>
            </div>
          )}

          <div
            className="flex items-center gap-2 mb-4 -mt-1"
            role="group"
            aria-label="コートの表示モード"
          >
            <span className="text-xs text-muted-foreground shrink-0">
              表示
            </span>
            <div className="flex flex-1 rounded-lg border border-border bg-muted/50 p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => setCourtDisplayMode('normal')}
                aria-pressed={courtDisplayMode === 'normal'}
                className={cn(
                  'min-h-11 flex-1 rounded-md py-2 text-xs font-semibold transition-all',
                  courtDisplayMode === 'normal'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground'
                )}
              >
                通常
              </button>
              <button
                type="button"
                onClick={() => setCourtDisplayMode('numberEmphasis')}
                aria-pressed={courtDisplayMode === 'numberEmphasis'}
                className={cn(
                  'min-h-11 flex-1 rounded-md py-2 text-xs font-semibold transition-all',
                  courtDisplayMode === 'numberEmphasis'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground'
                )}
              >
                番号強調
              </button>
              <button
                type="button"
                onClick={() => latestRound && setShowBoard(true)}
                disabled={!latestRound}
                aria-pressed={showBoard}
                className="inline-flex min-h-11 items-center justify-center gap-1 rounded-md px-3 py-2 text-xs font-semibold text-muted-foreground disabled:opacity-40"
                title={
                  latestRound
                    ? '番号と名前を大きく表示します'
                    : '組み合わせを生成すると使えます'
                }
              >
                <Monitor className="h-3.5 w-3.5" />
                掲示
              </button>
            </div>
          </div>

          {/* コート管理 */}
          <div
            ref={combosRef}
            className={`space-y-6 ${
              substituting && generateBlockedReason
                ? 'pb-52'
                : substituting
                  ? 'pb-40'
                  : 'pb-32'
            }`}
          >
            <div>
              <CourtManagement
                players={players}
                latestRound={latestRound}
                memberMap={memberMap}
                playerMap={playerMap}
                matchCounts={matchCounts}
                pairCounts={pairCounts}
                substituting={substituting}
                onPlayerClick={onPlayerClick}
                onRecordResult={recordResult}
                onToggleStatus={(memberId) => changeAvailability(memberId, 'active')}
                onSetAvailability={changeAvailability}
                courtDisplayMode={courtDisplayMode}
              />
            </div>
          </div>
        </>
      )}

      {/* Court count modal */}
      <Dialog open={showCourtModal && !!settings} onOpenChange={(open) => !open && setShowCourtModal(false)}>
        <DialogContent className="max-w-md rounded-2xl border-2 border-border/50 p-6 space-y-6">
          <DialogTitle className="text-base font-semibold text-foreground">
            コート数を変更
          </DialogTitle>
          <DialogDescription className="sr-only">コート数を変更します</DialogDescription>
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              コート数
            </label>
            <p className="mb-3 text-xs text-muted-foreground">
              変更したコート数は、次に生成するラウンドから使われます。今表示中のラウンドはそのままです。
            </p>
            <div className="bg-muted rounded-lg p-3 border border-border">
              <CourtSelector
                courts={pendingCourts}
                setCourts={setPendingCourts}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setShowCourtModal(false)}
              className="flex-1 px-4 py-2 text-sm"
            >
              キャンセル
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleConfirmCourts}
              className="flex-1 px-4 py-2"
              disabled={!settings || pendingCourts === settings.courts}
            >
              更新
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fixed Bottom Buttons */}
      {settings && (
        <div className="bottom-above-nav fixed left-4 right-4 z-overlay">
          <div className="mx-auto max-w-2xl space-y-3 [@media(max-height:500px)]:space-y-1">
            <SubstitutionHint
              substituting={substituting}
              memberMap={memberMap}
              playerMap={playerMap}
              onCancel={() => setSubstituting(null)}
              onBreak={
                substituting
                  ? () => void changeAvailability(substituting, 'break')
                  : undefined
              }
              onEarly={
                substituting
                  ? () => void changeAvailability(substituting, 'early')
                  : undefined
              }
            />
            {generateBlockedReason && (
              <p
                role="status"
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900"
              >
                {generateBlockedReason}
              </p>
            )}
            <div className="flex gap-3">
              <Button
                onClick={() => void executeGenerateNextRound()}
                className="flex-1 shadow-level-3"
                disabled={isGenerating || generateBlockedReason != null}
                aria-busy={isGenerating}
              >
                <span className="inline-flex items-center gap-2 font-bold">
                  <Shuffle className="w-5 h-5" />
                  {isGenerating ? GENERATING_LABEL : '次の組み合わせを生成'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      <AddParticipantModal
        isOpen={showAddParticipant}
        availableMembers={availableMembers}
        onAddParticipants={onAddParticipants}
        onCreateMember={addMember}
        onClose={() => {
          clearMemberError();
          setShowAddParticipant(false);
        }}
      />

      {/* Round summary & session stats modal */}
      <SessionStatsModal
        open={showRoundSummary}
        onOpenChange={(open) => !open && setShowRoundSummary(false)}
        rounds={rounds}
        players={players}
        memberMap={memberMap}
        pairCounts={pairCounts}
        opponentCounts={opponentCounts}
        winRates={winRates}
        onRecordResult={recordResult}
      />

      {/* Participant management modal */}
      <Dialog open={showParticipantModal && !!settings} onOpenChange={(open) => !open && setShowParticipantModal(false)}>
        <DialogContent className="max-w-3xl rounded-2xl border-2 border-border/50 p-0">
          <div className="border-b py-4 pl-5 pr-16">
            <DialogTitle className="text-base font-semibold text-foreground">
              参加者の管理
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              出場できる人{activeCount}人 / 全体{players.length}人
            </p>
          </div>
          <DialogDescription className="sr-only">参加者のステータスを管理します</DialogDescription>
          <div className="h-[60vh] px-5 py-4">
            {settings && (
              <ParticipantManagement
                settings={settings}
                players={players}
                memberMap={memberMap}
                matchCounts={matchCounts}
                updateCourts={updateCourts}
                onSetAvailability={changeAvailability}
                onShowAddParticipant={() => setShowAddParticipant(true)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset confirmation modal */}
      <Dialog open={showResetConfirm} onOpenChange={(open) => !open && setShowResetConfirm(false)}>
        <DialogContent className="max-w-sm rounded-2xl border-2 border-border/50 p-6">
          <DialogTitle className="sr-only">練習を終了</DialogTitle>
          <DialogDescription className="sr-only">練習終了の確認ダイアログ</DialogDescription>
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              練習を終了しますか？
            </h3>
            <p className="text-sm text-muted-foreground">
              {rounds.length > 0
                ? 'ここまでのラウンドは履歴に保存されます。進行中の画面は練習前に戻ります。'
                : 'まだラウンドがないため、履歴には残りません。練習の設定だけ終了します。'}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handleCancelReset}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleReset()}
              className="flex-1"
              disabled={isEnding}
            >
              {isEnding ? '終了しています' : '終了する'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showUndoConfirm}
        onOpenChange={(open) => !open && setShowUndoConfirm(false)}
      >
        <DialogContent className="max-w-sm rounded-2xl border-2 border-border/50 p-6">
          <DialogTitle className="text-base font-semibold">ラウンドを元に戻しますか？</DialogTitle>
          <DialogDescription>
            このラウンドには勝敗が記録されています。元に戻すと、その勝敗も消えます。
          </DialogDescription>
          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setShowUndoConfirm(false)}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={() => void performUndoRound()}
            >
              元に戻す
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showPracticeMenu}
        onOpenChange={(open) => !open && setShowPracticeMenu(false)}
      >
        <DialogContent className="max-w-sm rounded-2xl border-2 border-border/50 p-6">
          <DialogTitle className="text-base font-semibold">メニュー</DialogTitle>
          <DialogDescription className="sr-only">
            掲示、元に戻す、練習終了
          </DialogDescription>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={rounds.length === 0}
              onClick={() => {
                setShowPracticeMenu(false);
                void handleUndoRound();
              }}
            >
              直前のラウンドを元に戻す
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (hideResultReminder) {
                  window.localStorage.removeItem(HIDE_RESULT_REMINDER_KEY);
                  setHideResultReminder(false);
                } else {
                  window.localStorage.setItem(HIDE_RESULT_REMINDER_KEY, '1');
                  setHideResultReminder(true);
                }
                setShowPracticeMenu(false);
              }}
            >
              {hideResultReminder ? '結果未入力の通知を出す' : '結果未入力の通知を出さない'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!latestRound}
              onClick={() => {
                setShowPracticeMenu(false);
                setShowBoard(true);
              }}
            >
              <Monitor className="w-4 h-4" />
              掲示
            </Button>
            <Button
              type="button"
              variant="destructiveOutline"
              onClick={() => {
                setShowPracticeMenu(false);
                handleResetClick();
              }}
            >
              練習終了
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showBoard && latestRound && (
        <FullscreenDisplay
          round={latestRound}
          players={players}
          memberMap={memberMap}
          playerMap={playerMap}
          roundNumber={latestRound.roundNo}
          onClose={() => setShowBoard(false)}
          onGenerateNextRound={executeGenerateNextRound}
          generateBlockedReason={generateBlockedReason}
          isGenerating={isGenerating}
          toast={
            toast
              ? { message: toast.message, canUndo: toastCanUndo }
              : null
          }
          onUndo={() => void handleToastUndo()}
        />
      )}

      {toast && !showBoard && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed left-4 right-4 z-toast ${
            error || memberError ? 'top-36' : 'top-16'
          }`}
        >
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-xl bg-foreground px-4 py-3 text-sm text-background shadow-level-3">
            <span>{toast.message}</span>
            {toastCanUndo && (
              <button
                type="button"
                className="inline-flex min-h-11 shrink-0 items-center px-2 font-semibold underline"
                onClick={() => void handleToastUndo()}
              >
                元に戻す
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
