'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMemberStore } from '@/lib/stores/memberStore';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import { Header } from '@/components/practice/Header';
import { ParticipantSelection } from '@/components/practice/ParticipantSelection';
import { ParticipantManagement } from '@/components/practice/ParticipantManagement';
import { CourtManagement } from '@/components/practice/CourtManagement';
import { AddParticipantModal } from '@/components/practice/AddParticipantModal';
import { PairStatsModal } from '@/components/practice/PairStatsModal';
import { SubstitutionHint } from '@/components/practice/SubstitutionHint';
import { Users, LayoutGrid, ChevronDown } from 'lucide-react';

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
  const [showPairStats, setShowPairStats] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = window.localStorage.getItem('participantsAccordionOpen');
    return saved === 'true';
  });
  const participantsAccordionRef = useRef<HTMLDivElement | null>(null);
  const [accordionMaxHeight, setAccordionMaxHeight] = useState<string>('0px');

  useEffect(() => {
    loadMembers();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist accordion state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        'participantsAccordionOpen',
        String(isParticipantsOpen)
      );
    } catch {}
  }, [isParticipantsOpen]);

  // Smooth accordion animation: set max-height to scrollHeight when open
  useEffect(() => {
    const el = participantsAccordionRef.current;
    if (!el) return;
    if (isParticipantsOpen) {
      setAccordionMaxHeight(el.scrollHeight + 'px');
    } else {
      setAccordionMaxHeight('0px');
    }
  }, [isParticipantsOpen, players.length, showAddParticipant]);

  useEffect(() => {
    if (!isParticipantsOpen) return;
    const onResize = () => {
      const el = participantsAccordionRef.current;
      if (!el) return;
      setAccordionMaxHeight(el.scrollHeight + 'px');
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isParticipantsOpen]);

  // Smooth accordion animation: set max-height to scrollHeight when open
  useEffect(() => {
    const el = participantsAccordionRef.current;
    if (!el) return;
    if (isParticipantsOpen) {
      setAccordionMaxHeight(el.scrollHeight + 'px');
    } else {
      setAccordionMaxHeight('0px');
    }
  }, [isParticipantsOpen, players.length, showAddParticipant]);

  useEffect(() => {
    if (!isParticipantsOpen) return;
    const onResize = () => {
      const el = participantsAccordionRef.current;
      if (!el) return;
      setAccordionMaxHeight(el.scrollHeight + 'px');
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isParticipantsOpen]);

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

  // Calculate match counts for each player
  const matchCounts = useMemo(() => {
    const counts = new Map<number, number>();

    rounds.forEach((round) => {
      round.courts.forEach((court) => {
        [...court.pairA, ...court.pairB].forEach((memberId) => {
          counts.set(memberId, (counts.get(memberId) || 0) + 1);
        });
      });
    });

    return counts;
  }, [rounds]);

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

  const toggleParticipantsAccordion = () => {
    const next = !isParticipantsOpen;
    setIsParticipantsOpen(next);
  };

  return (
    <main className="bg-slate-50 min-h-screen">
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
            {/* ステータスバー */}
            <section className="mb-3 sm:mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`${isParticipantsOpen ? 'sm:col-span-2' : ''}`}>
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={toggleParticipantsAccordion}
                      aria-controls="participants-accordion-content"
                      aria-expanded={isParticipantsOpen}
                      className="w-full flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-700 border border-blue-200">
                          <Users className="h-4 w-4" />
                        </span>
                        <div className="text-left">
                          <div className="text-sm text-slate-700">
                            参加者 <span className="font-semibold">{players.length}</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            出場可 {players.filter((p) => p.status === 'active').length}
                          </div>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                          isParticipantsOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    <div
                      id="participants-accordion-content"
                      ref={participantsAccordionRef}
                      className={`overflow-hidden transition-[max-height] duration-300 ease-in-out`}
                      style={{ maxHeight: accordionMaxHeight }}
                    >
                      <div className="p-4">
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
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">
                      <LayoutGrid className="h-4 w-4" />
                    </span>
                    <div className="text-sm text-slate-700">コート数</div>
                  </div>
                  <select
                    value={settings.courts}
                    onChange={(e) => updateCourts(Number(e.target.value))}
                    className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold min-h-[36px] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors"
                    aria-label="コート数を変更"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                
              </div>
            </section>

            {/* 2カラムレイアウト */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="md:col-span-5">
                <CourtManagement
                  players={players}
                  latestRound={latestRound}
                  memberMap={memberMap}
                  playerMap={playerMap}
                  substituting={substituting}
                  onGenerateNextRound={generateNextRound}
                  onPlayerClick={onPlayerClick}
                  onShowPairStats={() => setShowPairStats(true)}
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

        <PairStatsModal
          isOpen={showPairStats}
          players={players}
          pairCounts={pairCounts}
          onClose={() => setShowPairStats(false)}
        />
      </div>
    </main>
  );
}
