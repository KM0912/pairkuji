'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import { useMemberStore } from '@/lib/stores/memberStore';
import { OverallStatsPanel } from '@/components/stats/OverallStatsPanel';
import { WinRateTrendChart } from '@/components/stats/WinRateTrendChart';
import { PairCompatibility } from '@/components/stats/PairCompatibility';
import { HeadToHead } from '@/components/stats/HeadToHead';
import { PeriodFilter } from '@/components/stats/PeriodFilter';
import { ClubFilter } from '@/components/stats/ClubFilter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { BarChart3 } from 'lucide-react';
import {
  type PeriodFilterType,
  calculateOverallStats,
  calculateSessionWinRates,
  calculatePairWinRates,
  filterSessions,
  filterSessionsByTag,
  getUniqueTags,
} from '@/lib/statsCalculator';

export default function StatsPage() {
  const {
    allMembers,
    isLoading: membersLoading,
    isInitialLoad: membersInitialLoad,
    loadAll: loadAllMembers,
  } = useMemberStore();
  const {
    rounds,
    sessions,
    isLoading: practiceLoading,
    isInitialLoad: practiceInitialLoad,
    load,
    loadSessions,
  } = usePracticeStore();

  const [periodFilter, setPeriodFilter] = useState<PeriodFilterType>('all');
  const [clubFilter, setClubFilter] = useState<string[]>([]);

  useEffect(() => {
    loadAllMembers();
    load();
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const memberMap = useMemo(
    () => new Map(allMembers.map((m) => [m.id!, m])),
    [allMembers]
  );

  const tags = useMemo(() => getUniqueTags(sessions), [sessions]);

  // クラブフィルタ → 期間フィルタ の順で適用
  const clubFilteredSessions = useMemo(
    () => filterSessionsByTag(sessions, clubFilter),
    [sessions, clubFilter]
  );

  const filteredSessions = useMemo(
    () => filterSessions(clubFilteredSessions, periodFilter),
    [clubFilteredSessions, periodFilter]
  );

  // 通算統計
  const overallStats = useMemo(
    () => calculateOverallStats(filteredSessions, rounds),
    [filteredSessions, rounds]
  );

  // セッション別勝率（推移グラフ用）
  const sessionWinRates = useMemo(
    () => calculateSessionWinRates(filteredSessions, rounds),
    [filteredSessions, rounds]
  );

  // ペア相性
  const pairWinRates = useMemo(
    () => calculatePairWinRates(filteredSessions, rounds),
    [filteredSessions, rounds]
  );

  // 全プレイヤーID（直接対決用）
  const allPlayerIds = useMemo(() => {
    const ids = new Set<number>();
    for (const stat of overallStats) {
      ids.add(stat.playerId);
    }
    return Array.from(ids).sort((a, b) => a - b);
  }, [overallStats]);

  const isLoading = membersLoading || practiceLoading;
  const isInitialLoading = !membersInitialLoad || !practiceInitialLoad;

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

  // 過去セッションも現在のラウンドもない場合のみ空表示
  const hasData = sessions.length > 0 || rounds.length > 0;

  if (!hasData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">統計</h1>
            <p className="text-muted-foreground">
              まだ試合データがありません。練習を開始して試合結果を記録すると統計が表示されます。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="mb-3 space-y-2">
        <ClubFilter tags={tags} value={clubFilter} onChange={setClubFilter} />
        <PeriodFilter value={periodFilter} onChange={setPeriodFilter} />
      </div>

      <Tabs defaultValue="overall" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overall" className="text-xs">通算</TabsTrigger>
          <TabsTrigger value="trend" className="text-xs">推移</TabsTrigger>
          <TabsTrigger value="pair" className="text-xs">ペア相性</TabsTrigger>
          <TabsTrigger value="h2h" className="text-xs">対決</TabsTrigger>
        </TabsList>

        <TabsContent value="overall" className="mt-6">
          <OverallStatsPanel memberMap={memberMap} stats={overallStats} />
        </TabsContent>

        <TabsContent value="trend" className="mt-6">
          <WinRateTrendChart
            memberMap={memberMap}
            sessionWinRates={sessionWinRates}
          />
        </TabsContent>

        <TabsContent value="pair" className="mt-6">
          <PairCompatibility
            memberMap={memberMap}
            pairWinRates={pairWinRates}
          />
        </TabsContent>

        <TabsContent value="h2h" className="mt-6">
          <HeadToHead
            memberMap={memberMap}
            sessions={filteredSessions}
            currentRounds={rounds}
            playerIds={allPlayerIds}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
