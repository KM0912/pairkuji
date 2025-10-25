'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMemberStore } from '@/lib/stores/memberStore';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import { ParticipantManagement } from '@/components/practice/ParticipantManagement';
import { CourtManagement } from '@/components/practice/CourtManagement';
import { AddParticipantModal } from '@/components/practice/AddParticipantModal';
import { PairStatsPanel } from '@/components/stats/PairStatsPanel';
import { OpponentStatsPanel } from '@/components/stats/OpponentStatsPanel';
import { SubstitutionHint } from '@/components/practice/SubstitutionHint';
import { FullscreenDisplay } from '@/components/practice/FullscreenDisplay';
import { RoundHistory } from '@/components/stats/RoundHistory';
import { Button } from '@/components/ui/button';
import { CourtSelector } from '@/components/ui/CourtSelector';
import Link from 'next/link';
import {
  Users,
  LayoutGrid,
  Layers,
  BarChart3,
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
    toggleStatus,
    generateNextRound,
    resetPractice,
    addParticipant,
    substitutePlayer,
    updateCourts,
  } = usePracticeStore();

  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [substituting, setSubstituting] = useState<number | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsMode, setStatsMode] = useState<'pair' | 'opponent'>('pair');
  const combosRef = useRef<HTMLDivElement | null>(null);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [showCourtModal, setShowCourtModal] = useState(false);
  const [pendingCourts, setPendingCourts] = useState<number>(2);
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
    if (settings) {
      setPendingCourts(settings.courts);
    }
  }, [settings]);

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id!, m])),
    [members]
  );
  const playerMap = useMemo(
    () => new Map(players.map((p) => [p.memberId, p])),
    [players]
  );

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

  // Calculate pair counts from all rounds
  const pairCounts = useMemo(() => {
    const counts = new Map<string, number>();

    rounds.forEach((round) => {
      round.courts.forEach((court) => {
        // Count pairs in Team A
        const [a1, a2] = court.pairA.sort((a, b) => a - b);
        if (a1 !== undefined && a2 !== undefined) {
          const key = `${a1}-${a2}`;
          counts.set(key, (counts.get(key) || 0) + 1);
        }

        // Count pairs in Team B
        const [b1, b2] = court.pairB.sort((a, b) => a - b);
        if (b1 !== undefined && b2 !== undefined) {
          const key = `${b1}-${b2}`;
          counts.set(key, (counts.get(key) || 0) + 1);
        }
      });
    });

    return counts;
  }, [rounds]);

  // Calculate opponent counts (times two players faced each other on opposing teams)
  const opponentCounts = useMemo(() => {
    const counts = new Map<string, number>();

    rounds.forEach((round) => {
      round.courts.forEach((court) => {
        const teamA = court.pairA.filter((id) => id !== undefined) as number[];
        const teamB = court.pairB.filter((id) => id !== undefined) as number[];

        teamA.forEach((a) => {
          teamB.forEach((b) => {
            const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
            counts.set(key, (counts.get(key) || 0) + 1);
          });
        });
      });
    });

    return counts;
  }, [rounds]);

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
    <div className="pb-24">
      {settings ? (
        <section ref={combosRef} className="space-y-6 pb-16">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowRoundSummary(true)}
            >
              <Layers />
              ラウンド
              <span>{rounds.length}</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowCourtModal(true)}
            >
              <LayoutGrid />
              コート
              <span>{settings.courts}</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleOpenParticipants}
            >
              <Users />
              参加者
              <span>{players.length}</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowStatsModal(true)}
            >
              <BarChart3 />
              統計
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetClick}
            >
              <RotateCcw />
              リセット
            </Button>
          </div>

          {latestRound && (
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
          )}
          <CourtManagement
            players={players}
            latestRound={latestRound}
            memberMap={memberMap}
            playerMap={playerMap}
            substituting={substituting}
            onPlayerClick={onPlayerClick}
          />
        </section>
      ) : (
        <section className="mx-auto flex min-h-[320px] max-w-md flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <Shuffle className="h-10 w-10 text-primary" />
          <div className="space-y-2">
            <p className="text-base font-semibold text-foreground">
              ダブルス練習がまだ開始されていません
            </p>
            <p className="text-sm text-muted-foreground">
              設定画面で参加者とコート数を選び、「ダブルス練習開始」を押してください。
            </p>
          </div>
          <Button asChild>
            <Link href="/practice/settings">設定画面へ移動</Link>
          </Button>
        </section>
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

      {/* Pair stats modal */}
      {showStatsModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-4xl rounded-2xl bg-card shadow-xl border border-border">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  統計
                </h2>
                <div className="mt-2 inline-flex rounded-md border border-border bg-secondary p-0.5">
                  <button
                    type="button"
                    className={`px-3 py-1.5 text-xs rounded ${
                      statsMode === 'pair'
                        ? 'bg-card border border-border text-foreground'
                        : 'text-muted-foreground'
                    }`}
                    onClick={() => setStatsMode('pair')}
                  >
                    ペア
                  </button>
                  <button
                    type="button"
                    className={`ml-1 px-3 py-1.5 text-xs rounded ${
                      statsMode === 'opponent'
                        ? 'bg-card border border-border text-foreground'
                        : 'text-muted-foreground'
                    }`}
                    onClick={() => setStatsMode('opponent')}
                  >
                    対戦相手
                  </button>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowStatsModal(false)}
                aria-label="閉じる"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="max-h-[60vh] overflow-auto px-5 py-4">
              {statsMode === 'pair' ? (
                <PairStatsPanel players={players} pairCounts={pairCounts} />
              ) : (
                <OpponentStatsPanel
                  players={players}
                  opponentCounts={opponentCounts}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Next Round Button */}
      {settings && (
        <div className="fixed bottom-24 left-4 right-4 z-30">
          <div className="max-w-6xl mx-auto">
            <Button
              onClick={handleGenerateNextRound}
              className="w-full shadow-2xl"
              disabled={players.filter((p) => p.status === 'active').length < 4}
            >
              <span className="inline-flex items-center gap-2 text-base font-semibold">
                <Shuffle className="w-5 h-5" />
                次の組み合わせを生成
              </span>
            </Button>
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
