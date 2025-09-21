'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMemberStore } from '@/lib/stores/memberStore';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import { Header } from '@/components/practice/Header';
import { ParticipantSelection } from '@/components/practice/ParticipantSelection';
import { ParticipantManagement } from '@/components/practice/ParticipantManagement';
import { CourtManagement } from '@/components/practice/CourtManagement';
import { AddParticipantModal } from '@/components/practice/AddParticipantModal';
import { PairStatsPanel } from '@/components/practice/PairStatsPanel';
import { SubstitutionHint } from '@/components/practice/SubstitutionHint';
import { FullscreenDisplay } from '@/components/practice/FullscreenDisplay';
import { Button } from '@/components/ui/Button';
import { Users, LayoutGrid, Layers, BarChart3, Maximize } from 'lucide-react';

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
  const [showStatsModal, setShowStatsModal] = useState(false);
  const combosRef = useRef<HTMLDivElement | null>(null);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [showCourtModal, setShowCourtModal] = useState(false);
  const [pendingCourts, setPendingCourts] = useState<number>(courts);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

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
  };

  const handleGenerateNextRound = async () => {
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
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Header settings={settings} onReset={handleReset} />

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

            {/* コート管理 */}
            <div
              ref={combosRef}
              className="space-y-6 mt-6"
            >
              <div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => setShowRoundSummary(true)}
                    className="flex items-center justify-center gap-2 px-3 py-3 text-sm text-slate-600 shadow-none hover:shadow-none border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 hover:text-slate-700"
                  >
                    <Layers className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-medium text-slate-800 text-sm">ラウンド</span>
                    <span className="text-slate-600 text-sm">{rounds.length}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => setShowCourtModal(true)}
                    className="flex items-center justify-center gap-2 px-3 py-3 text-sm text-slate-600 shadow-none hover:shadow-none border-slate-200 hover:border-sky-400 hover:bg-sky-50 hover:text-slate-700"
                  >
                    <LayoutGrid className="h-4 w-4 text-sky-600 flex-shrink-0" />
                    <span className="font-medium text-slate-800 text-sm">コート</span>
                    <span className="text-slate-600 text-sm">{settings.courts}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleOpenParticipants}
                    className="flex items-center justify-center gap-2 px-3 py-3 text-sm text-slate-600 shadow-none hover:shadow-none border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:text-slate-700"
                  >
                    <Users className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                    <span className="font-medium text-slate-800 text-sm">参加者</span>
                    <span className="text-slate-600 text-sm">{players.length}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => setShowStatsModal(true)}
                    className="flex items-center justify-center gap-2 px-3 py-3 text-sm text-slate-600 shadow-none hover:shadow-none border-slate-200 hover:border-purple-400 hover:bg-purple-50 hover:text-slate-700"
                  >
                    <BarChart3 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <span className="font-medium text-slate-800 text-sm">統計</span>
                  </Button>
                </div>

                {latestRound && (
                  <div className="mb-4">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowFullscreen(true)}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Maximize className="h-4 w-4" />
                      <span className="font-medium">フルスクリーン表示</span>
                    </Button>
                  </div>
                )}
                <CourtManagement
                  players={players}
                  latestRound={latestRound}
                  memberMap={memberMap}
                  playerMap={playerMap}
                  substituting={substituting}
                  onGenerateNextRound={handleGenerateNextRound}
                  onPlayerClick={onPlayerClick}
                />
              </div>
            </div>
          </>
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

      </div>

      {/* Round summary modal */}
      {showRoundSummary && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-800">ラウンド履歴</h2>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setShowRoundSummary(false)}
                className="w-auto px-2 py-1 text-slate-400 hover:text-slate-600 shadow-none hover:shadow-none border-transparent"
                aria-label="閉じる"
              >
                ✕
              </Button>
            </div>
            <div className="max-h-72 overflow-auto px-4 py-3 space-y-2 text-sm">
              {rounds.length === 0 ? (
                <p className="text-slate-500">まだラウンドがありません。</p>
              ) : (
                rounds
                  .slice()
                  .reverse()
                  .map((round) => (
                    <div
                      key={round.roundNo}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div className="font-medium text-slate-700">
                        ラウンド {round.roundNo}
                      </div>
                      <div className="text-xs text-slate-500">
                        コート {round.courts.length} / 休憩 {round.rests.length}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Court count modal */}
      {showCourtModal && settings && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">
                コート数を変更
              </h2>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setShowCourtModal(false)}
                className="w-auto px-2 py-1 text-slate-400 hover:text-slate-600 shadow-none hover:shadow-none border-transparent"
                aria-label="閉じる"
              >
                ✕
              </Button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                コート数
              </label>
              <select
                value={pendingCourts}
                onChange={(e) => setPendingCourts(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setShowCourtModal(false)}
                className="w-auto px-4 py-2 text-sm text-slate-600 shadow-none hover:shadow-none border-slate-300 hover:bg-slate-50"
              >
                キャンセル
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirmCourts}
                className="w-auto px-4 py-2 text-sm"
                disabled={pendingCourts === settings.courts}
              >
                更新
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Participant management modal */}
      {showParticipantModal && settings && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  参加者の管理
                </h2>
                <p className="text-xs text-slate-500">
                  出場可 {players.filter((p) => p.status === 'active').length} / 全体 {players.length}
                </p>
              </div>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setShowParticipantModal(false)}
                className="w-auto px-2 py-1 text-slate-400 hover:text-slate-600 shadow-none hover:shadow-none border-transparent"
                aria-label="閉じる"
              >
                ✕
              </Button>
            </div>
            <div className="max-h-[70vh] overflow-auto px-5 py-4">
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

      {/* Pair stats modal */}
      {showStatsModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  ペア統計
                </h2>
                <p className="text-xs text-slate-500">
                  ペアの組み合わせ回数を確認できます
                </p>
              </div>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setShowStatsModal(false)}
                className="w-auto px-2 py-1 text-slate-400 hover:text-slate-600 shadow-none hover:shadow-none border-transparent"
                aria-label="閉じる"
              >
                ✕
              </Button>
            </div>
            <div className="max-h-[70vh] overflow-auto px-5 py-4">
              <PairStatsPanel players={players} pairCounts={pairCounts} />
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
    </main>
  );
}
