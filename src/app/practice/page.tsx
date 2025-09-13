'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMemberStore } from '@/lib/stores/memberStore';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import { Header } from '@/components/practice/Header';
import { ParticipantSelection } from '@/components/practice/ParticipantSelection';
import { ParticipantManagement } from '@/components/practice/ParticipantManagement';
import { CourtManagement } from '@/components/practice/CourtManagement';
import { AddParticipantModal } from '@/components/practice/AddParticipantModal';
import { PairStatsModal } from '@/components/practice/PairStatsModal';
import { SubstitutionHint } from '@/components/practice/SubstitutionHint';

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

  useEffect(() => {
    loadMembers();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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


  const onAddParticipant = async (memberId: number) => {
    await addParticipant(memberId);
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

  return (
    <main className="bg-slate-50 min-h-screen">
      <div className="max-w-md mx-auto px-4 py-6">
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
          <div className="space-y-8">
            <ParticipantManagement
              settings={settings}
              players={players}
              memberMap={memberMap}
              matchCounts={matchCounts}
              updateCourts={updateCourts}
              toggleStatus={toggleStatus}
              onShowAddParticipant={() => setShowAddParticipant(true)}
            />

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
        )}

        <AddParticipantModal
          isOpen={showAddParticipant}
          availableMembers={availableMembers}
          onAddParticipant={onAddParticipant}
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
