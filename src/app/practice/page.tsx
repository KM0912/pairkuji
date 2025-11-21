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
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent } from '@/components/ui/card';
import { Users, AlertTriangle, RotateCcw, Shuffle, X, Clock } from 'lucide-react';
import { PiCourtBasketball } from 'react-icons/pi';

export default function PracticePage() {
  const {
    members,
    isLoading: membersLoading,
    isInitialLoad: membersInitialLoad,
    load: loadMembers,
  } = useMemberStore();
  const {
    settings,
    players,
    rounds,
    isLoading: practiceLoading,
    isInitialLoad: practiceInitialLoad,
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
      setSelected([]);
      return;
    }
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

  const matchCounts = useMemo(() => {
    const counts = new Map<number, number>();

    rounds.forEach((round) => {
      round.courts.forEach((court) => {
        [...court.pairA, ...court.pairB].forEach((memberId) => {
          counts.set(memberId, (counts.get(memberId) || 0) + 1);
        });
      });
    });

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
      setSubstituting(memberId);
    } else if (substituting === memberId) {
      setSubstituting(null);
    } else {
      await substitutePlayer(substituting, memberId);
      setSubstituting(null);
    }
  };

  const handleReset = () => {
    setSubstituting(null);
    resetPractice();
    setShowResetConfirm(false);
  };

  const handleGenerateNextRound = async () => {
    if (rounds.length > 0) {
      setShowGenerateConfirm(true);
    } else {
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

  const handleConfirmCourts = () => {
    updateCourts(pendingCourts);
    setShowCourtModal(false);
  };

  const isLoading = membersLoading || practiceLoading;
  const isInitialLoading = !membersInitialLoad || !practiceInitialLoad;
  const activePlayersCount = players.filter((p) => p.status === 'active').length;

  if (isLoading || isInitialLoading) {
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
          {/* ステータスヘッダー */}
          <div className="mb-6 space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                練習進行中
              </h1>
              <p className="text-sm text-muted-foreground">
                ラウンド {rounds.length} • {activePlayersCount}名出場可
              </p>
            </div>

            {/* クイックアクション */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRoundSummary(true)}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Shuffle className="w-5 h-5" />
                <span className="text-xs font-medium">ラウンド</span>
                <span className="text-sm font-bold">{rounds.length}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCourtModal(true)}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <PiCourtBasketball className="w-5 h-5" />
                <span className="text-xs font-medium">コート</span>
                <span className="text-sm font-bold">{settings.courts}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowParticipantModal(true)}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Users className="w-5 h-5" />
                <span className="text-xs font-medium">参加者</span>
                <span className="text-sm font-bold">{players.length}</span>
              </Button>
            </div>
          </div>

          {/* コート管理 */}
          <div ref={combosRef} className="space-y-6 pb-20">
            <CourtManagement
              players={players}
              latestRound={latestRound}
              memberMap={memberMap}
              playerMap={playerMap}
              substituting={substituting}
              onPlayerClick={onPlayerClick}
            />
          </div>
        </>
      )}

      {/* Court count modal */}
      {showCourtModal && settings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <Card className="w-full max-w-md shadow-2xl border-2">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <PiCourtBasketball className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    コート数を変更
                  </h2>
                </div>
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
                <div className="bg-muted/50 rounded-xl p-4 border border-border">
                  <CourtSelector
                    courts={pendingCourts}
                    setCourts={setPendingCourts}
                    size="md"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCourtModal(false)}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={handleConfirmCourts}
                  className="flex-1"
                  disabled={pendingCourts === settings.courts}
                >
                  更新
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fixed Bottom Buttons */}
      {settings && (
        <div className="fixed bottom-24 left-4 right-4 z-30">
          <div className="max-w-6xl mx-auto">
            <div className="flex gap-3">
              <Button
                onClick={() => setShowResetConfirm(true)}
                variant="destructiveOutline"
                title="練習をリセット"
                size="lg"
                className="px-4"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleGenerateNextRound}
                className="flex-1 shadow-2xl h-12 text-base font-semibold"
                disabled={activePlayersCount < 4}
                size="lg"
              >
                <span className="inline-flex items-center gap-2">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <Card className="w-full max-w-md shadow-2xl border-2">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  ラウンド履歴
                </h2>
              </div>
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
            <div className="max-h-96 overflow-auto px-6 py-4 space-y-2">
              {rounds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  まだラウンドがありません。
                </div>
              ) : (
                rounds
                  .slice()
                  .reverse()
                  .map((round) => (
                    <Card
                      key={round.roundNo}
                      className="border border-border hover:border-primary/30 transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">
                                {round.roundNo}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">
                                ラウンド {round.roundNo}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                コート {round.courts.length} / 休憩{' '}
                                {round.rests.length}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Participant management modal */}
      {showParticipantModal && settings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <Card className="w-full max-w-3xl shadow-2xl border-2 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4 flex-shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    参加者の管理
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground ml-13">
                  出場可 {activePlayersCount} / 全体 {players.length}
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
            <div className="flex-1 overflow-hidden px-6 py-4">
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
          </Card>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <Card className="w-full max-w-sm shadow-2xl border-2 border-destructive/20">
            <CardContent className="p-6">
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
                  onClick={() => setShowResetConfirm(false)}
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
            </CardContent>
          </Card>
        </div>
      )}

      {/* Generate round confirmation modal */}
      {showGenerateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <Card className="w-full max-w-sm shadow-2xl border-2">
            <CardContent className="p-6">
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
            </CardContent>
          </Card>
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
