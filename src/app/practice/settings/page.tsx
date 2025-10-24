'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemberStore } from '@/lib/stores/memberStore';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import { ParticipantSelection } from '@/components/practice/ParticipantSelection';
import { ParticipantManagement } from '@/components/practice/ParticipantManagement';
import { AddParticipantModal } from '@/components/practice/AddParticipantModal';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CourtSelector } from '@/components/ui/CourtSelector';
import { Layers, Users } from 'lucide-react';

export default function PracticeSettingsPage() {
  const router = useRouter();
  const { members, load: loadMembers } = useMemberStore();
  const {
    settings,
    players,
    rounds,
    selectedMembers,
    selectedCourts,
    load,
    startPractice,
    toggleStatus,
    updateCourts,
    addParticipant,
    setSelectedMembers,
    setSelectedCourts,
  } = usePracticeStore();

  const [courts, setCourts] = useState(2);

  const handleCourtsChange = (newCourts: number) => {
    setCourts(newCourts);
    setSelectedCourts(newCourts);
  };
  const [selected, setSelected] = useState<number[]>([]);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [pendingCourts, setPendingCourts] = useState<number>(2);

  useEffect(() => {
    loadMembers();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!settings) {
      setSelected(selectedMembers);
      setCourts(selectedCourts);
      return;
    }
    setPendingCourts(settings.courts);
  }, [settings, selectedMembers, selectedCourts]);

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id!, m])),
    [members]
  );

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

  const onToggleSelect = (id: number) => {
    const newSelected = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    setSelected(newSelected);
    setSelectedMembers(newSelected);
  };

  const onStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length < 4) return;
    await startPractice(courts, selected);
    router.push('/practice');
  };

  const onAddParticipants = async (memberIds: number[]) => {
    for (const id of memberIds) {
      await addParticipant(id);
    }
    setShowAddParticipant(false);
  };

  return (
    <div className="pb-24 space-y-6">
      {settings ? (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="h-4 w-4 text-primary" />
                  コート設定
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted p-3">
                <CourtSelector
                  courts={pendingCourts}
                  setCourts={(newCourts) => {
                    setPendingCourts(newCourts);
                    updateCourts(newCourts);
                  }}
                  size="sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="h-[540px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-primary" />
                  参加者管理
                </CardTitle>
                <CardDescription>
                  参加者の出場状況と追加を設定できます。
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="h-full">
              <ParticipantManagement
                settings={settings}
                players={players}
                memberMap={memberMap}
                matchCounts={matchCounts}
                updateCourts={updateCourts}
                toggleStatus={toggleStatus}
                onShowAddParticipant={() => setShowAddParticipant(true)}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <ParticipantSelection
          members={members}
          courts={courts}
          setCourts={handleCourtsChange}
          selected={selected}
          onToggleSelect={onToggleSelect}
          onStart={onStart}
        />
      )}

      <AddParticipantModal
        isOpen={showAddParticipant}
        availableMembers={availableMembers}
        onAddParticipants={onAddParticipants}
        onClose={() => setShowAddParticipant(false)}
      />
    </div>
  );
}
