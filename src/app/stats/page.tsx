'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import { useMemberStore } from '@/lib/stores/memberStore';
import { PairStatsPanel } from '@/components/stats/PairStatsPanel';
import { OpponentStatsPanel } from '@/components/stats/OpponentStatsPanel';
import { BarChart3 } from 'lucide-react';

export default function StatsPage() {
  const { members, load: loadMembers } = useMemberStore();
  const { settings, players, rounds, load } = usePracticeStore();

  const [statsMode, setStatsMode] = useState<'pair' | 'opponent'>('pair');

  useEffect(() => {
    loadMembers();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id!, m])),
    [members]
  );

  // ペア統計の計算
  const pairCounts = useMemo(() => {
    const counts = new Map<string, number>();

    if (!rounds || rounds.length === 0) {
      return counts;
    }

    rounds.forEach((round) => {
      round.courts.forEach((court) => {
        const pairA = [court.pairA[0], court.pairA[1]]
          .filter((id): id is number => id !== undefined)
          .sort((a, b) => a - b);
        const pairB = [court.pairB[0], court.pairB[1]]
          .filter((id): id is number => id !== undefined)
          .sort((a, b) => a - b);

        // チーム内のペア（2人揃っている場合のみ）
        if (pairA.length === 2) {
          const pairAKey = `${pairA[0]}-${pairA[1]}`;
          counts.set(pairAKey, (counts.get(pairAKey) || 0) + 1);
        }
        if (pairB.length === 2) {
          const pairBKey = `${pairB[0]}-${pairB[1]}`;
          counts.set(pairBKey, (counts.get(pairBKey) || 0) + 1);
        }
      });
    });

    return counts;
  }, [rounds]);

  // 対戦相手統計の計算
  const opponentCounts = useMemo(() => {
    const counts = new Map<string, number>();

    if (!rounds || rounds.length === 0) {
      return counts;
    }

    rounds.forEach((round) => {
      round.courts.forEach((court) => {
        const pairA = court.pairA;
        const pairB = court.pairB;

        // ペアA vs ペアBの対戦
        pairA.forEach((player1: number) => {
          pairB.forEach((player2: number) => {
            const key = `${Math.min(player1, player2)}-${Math.max(player1, player2)}`;
            counts.set(key, (counts.get(key) || 0) + 1);
          });
        });
      });
    });

    return counts;
  }, [rounds]);

  if (!settings) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">統計</h1>
            <p className="text-muted-foreground">
              練習が開始されていないため、統計データは表示できません。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">統計</h1>
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
          </div>

          {/* 統計コンテンツ */}
          <div className="bg-card rounded-2xl shadow-xl border border-border">
            <div className="p-6">
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
      </div>
    </div>
  );
}
