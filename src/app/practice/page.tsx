'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMemberStore } from '@/lib/stores/memberStore';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import { ParticipantSelection } from '@/components/practice/ParticipantSelection';
import { ParticipantManagement } from '@/components/practice/ParticipantManagement';
import { CourtManagement } from '@/components/practice/CourtManagement';
import { AddParticipantModal } from '@/components/practice/AddParticipantModal';
import { SubstitutionHint } from '@/components/practice/SubstitutionHint';
import { FullscreenDisplay } from '@/components/practice/FullscreenDisplay';
import { RoundHistory } from '@/components/stats/RoundHistory';
import { Button } from '@/components/ui/button';
import { CourtSelector } from '@/components/ui/CourtSelector';
import {
  Users,
  LayoutGrid,
  Layers,
  Maximize,
  AlertTriangle,
  RotateCcw,
  Shuffle,
  X,
} from 'lucide-react';

export default function PracticePage() {
  const { members, load: loadMembers } = useMemberStore();
  const {
    settings,
    players,
    rounds,
    load,
    startPractice,
    toggleStatus,
    generateNextRound,
    resetPractice,
    addParticipant,
    substitutePlayer,
    updateCourts,
  } = usePracticeStore();

  const [courts, setCourts] = useState(2);
  const [selected, setSelected] = useState<number[]>([]);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [substituting, setSubstituting] = useState<number | null>(null);
  const combosRef = useRef<HTMLDivElement | null>(null);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [showCourtModal, setShowCourtModal] = useState(false);
  const [pendingCourts, setPendingCourts] = useState<number>(courts);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [showRoundHistory, setShowRoundHistory] = useState(false);

  useEffect(() => {
    loadMembers();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!settings) {
      setShowRoundSummary(false);
      setShowCourtModal(false);
      setShowParticipantModal(false);
    }
  }, [settings]);

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

  const onStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length < 4) return;
    await startPractice(courts, selected);
  };

  const latestRound = rounds[rounds.length - 1];

  // Calculate match counts for each player (include playedOffset, with -1 bias for joiners)
  const matchCounts = useMemo(() => {
    const counts = new Map<number, number>();

    rounds.forEach((round) => {
      round.courts.forEach((court) => {
        [...court.pairA, ...court.pairB].forEach((memberId) => {
          counts.set(memberId, (counts.get(memberId) || 0) + 1);
        });
      });
    });

    // Add each player's playedOffset, and subtract 1 if they have an offset (prioritize next round)
    players.forEach((p) => {
      const base = counts.get(p.memberId) || 0;
      const offset = p.playedOffset || 0;
      const bias = offset > 0 ? 1 : 0;
      const value = base + offset - bias;
      counts.set(p.memberId, Math.max(0, value));
    });

    return counts;
  }, [rounds, players]);

  const availableMembers = members.filter(
    (m) => m.isActive && !players.some((p) => p.memberId === m.id)
  );

  const onAddParticipants = async (memberIds: number[]) => {
    for (const id of memberIds) {
      await addParticipant(id);
    }
    setShowAddParticipant(false);
  };

  const onPlayerClick = async (memberId: number) => {
    if (!substituting) {
      // First click - select player for substitution
      setSubstituting(memberId);
    } else if (substituting === memberId) {
      // Click same player - deselect
      setSubstituting(null);
    } else {
      // Click different player - perform substitution
      await substitutePlayer(substituting, memberId);
      setSubstituting(null);
    }
  };

  const handleReset = () => {
    setSubstituting(null);
    resetPractice();
    setShowResetConfirm(false);
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
  };

  const handleGenerateNextRound = async () => {
    // 既存のラウンドがある場合は確認ダイアログを表示
    if (rounds.length > 0) {
      setShowGenerateConfirm(true);
    } else {
      // 初回の場合は直接生成
      await executeGenerateNextRound();
    }
  };

  const executeGenerateNextRound = async () => {
    await generateNextRound();
    requestAnimationFrame(() => {
      combosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    updateCourts(pendingCourts);
    setShowCourtModal(false);
  };

  return (
    <div>
      {!settings ? (
        <ParticipantSelection
          members={members}
          courts={courts}
          setCourts={setCourts}
          selected={selected}
          onToggleSelect={onToggleSelect}
          onStart={onStart}
        />
      ) : (
        <>
          {/* ヘッダーエリア */}
          <div className="flex gap-1 mb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRoundSummary(true)}
              className="flex-1 min-w-0 text-base sm:text-sm"
            >
              <Layers />
              <span className="sm:text-inherit text-xs">ラウンド</span>
              <span className="sm:text-inherit text-xs">{rounds.length}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCourtModal(true)}
              className="flex-1 min-w-0 text-base sm:text-sm"
            >
              <LayoutGrid />
              <span className="sm:text-inherit text-xs">コート</span>
              <span className="sm:text-inherit text-xs">{settings.courts}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenParticipants}
              className="flex-1 min-w-0 text-base sm:text-sm"
            >
              <Users />
              <span className="sm:text-inherit text-xs">参加者</span>
              <span className="sm:text-inherit text-xs">{players.length}</span>
            </Button>
          </div>

          {/* コート管理 */}
          <div ref={combosRef} className="space-y-6 pb-16">
            <div>
              {/* TODO: フルスクリーン機能を使用するか検討 */}
              {/* TODO: 不要な場合は関連する処理をすべて削除する */}
              {/* {latestRound && (
                <div className="mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFullscreen(true)}
                    className="w-full"
                  >
                    <Maximize />
                    フルスクリーン表示
                  </Button>
                </div>
              )} */}
              <CourtManagement
                players={players}
                latestRound={latestRound}
                memberMap={memberMap}
                playerMap={playerMap}
                substituting={substituting}
                onPlayerClick={onPlayerClick}
              />
            </div>
          </div>
        </>
      )}

      {/* Court count modal */}
      {showCourtModal && settings && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-card shadow-xl border border-border p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                コート数を変更
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCourtModal(false)}
                aria-label="閉じる"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                コート数
              </label>
              <div className="bg-muted rounded-lg p-3 border border-border">
                <CourtSelector
                  courts={pendingCourts}
                  setCourts={setPendingCourts}
                  size="sm"
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
                className="flex-1 px-4 py-2 text-sm"
                disabled={pendingCourts === settings.courts}
              >
                更新
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Buttons */}
      {settings && (
        <div className="fixed bottom-24 left-4 right-4 z-30">
          <div className="max-w-6xl mx-auto">
            <div className="flex gap-3">
              <Button
                onClick={handleResetClick}
                variant="destructiveOutline"
                title="練習をリセット"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleGenerateNextRound}
                className="flex-1 shadow-2xl"
                disabled={
                  players.filter((p) => p.status === 'active').length < 4
                }
              >
                <span className="inline-flex items-center gap-2 font-semibold">
                  <Shuffle className="w-5 h-5" />
                  次の組み合わせを生成
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
        onClose={() => setShowAddParticipant(false)}
      />

      <SubstitutionHint
        substituting={substituting}
        memberMap={memberMap}
        playerMap={playerMap}
      />

      {/* Round summary modal */}
      {showRoundSummary && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-card shadow-xl border border-border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">
                ラウンド履歴
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowRoundSummary(false)}
                aria-label="閉じる"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="max-h-72 overflow-auto px-4 py-3 space-y-2 text-sm">
              {rounds.length === 0 ? (
                <p className="text-muted-foreground">
                  まだラウンドがありません。
                </p>
              ) : (
                rounds
                  .slice()
                  .reverse()
                  .map((round) => (
                    <div
                      key={round.roundNo}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2"
                    >
                      <div className="font-medium text-foreground">
                        ラウンド {round.roundNo}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        コート {round.courts.length} / 休憩 {round.rests.length}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Participant management modal */}
      {showParticipantModal && settings && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-card shadow-xl border border-border">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  参加者の管理
                </h2>
                <p className="text-xs text-muted-foreground">
                  出場可 {players.filter((p) => p.status === 'active').length} /
                  全体 {players.length}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowParticipantModal(false)}
                aria-label="閉じる"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="h-[60vh] px-5 py-4">
              <ParticipantManagement
                settings={settings}
                players={players}
                memberMap={memberMap}
                matchCounts={matchCounts}
                updateCourts={updateCourts}
                toggleStatus={toggleStatus}
                onShowAddParticipant={() => setShowAddParticipant(true)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen display */}
      {showFullscreen && latestRound && (
        <FullscreenDisplay
          round={latestRound}
          memberMap={memberMap}
          playerMap={playerMap}
          roundNumber={rounds.length}
          substituting={substituting}
          onClose={() => setShowFullscreen(false)}
          onPlayerClick={onPlayerClick}
          onGenerateNextRound={handleGenerateNextRound}
        />
      )}

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl w-full max-w-sm mx-4 shadow-2xl">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  練習をリセットしますか？
                </h3>
                <p className="text-sm text-muted-foreground">
                  すべてのラウンドデータが削除され、元に戻すことはできません。
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
                  onClick={handleReset}
                  className="flex-1"
                >
                  リセット
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate round confirmation modal */}
      {showGenerateConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl w-full max-w-sm mx-4 shadow-2xl">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shuffle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  ラウンド {rounds.length + 1} を生成しますか？
                </h3>
                <p className="text-sm text-muted-foreground">
                  新しい組み合わせが作成されます。
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowGenerateConfirm(false)}
                  variant="secondary"
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  onClick={async () => {
                    setShowGenerateConfirm(false);
                    await executeGenerateNextRound();
                  }}
                  className="flex-1"
                >
                  生成する
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Round history modal */}
      <RoundHistory
        isOpen={showRoundHistory}
        onClose={() => setShowRoundHistory(false)}
        rounds={rounds}
        memberMap={memberMap}
      />
    </div>
  );
}
