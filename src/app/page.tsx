'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePracticeStore } from '@/lib/stores/practiceStore';
import { useMemberStore } from '@/lib/stores/memberStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Play, Users, Clock, ArrowRight, Zap } from 'lucide-react';
import { PiCourtBasketball } from 'react-icons/pi';

export default function HomePage() {
  const router = useRouter();
  const { settings, players, rounds, load, isLoading, isInitialLoad } =
    usePracticeStore();
  const { members, load: loadMembers, isLoading: membersLoading } =
    useMemberStore();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    load();
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = () => {
    setIsNavigating(true);
    router.push('/practice');
  };

  const handleNewPractice = () => {
    setIsNavigating(true);
    router.push('/practice');
  };

  const isLoadingData = isLoading || !isInitialLoad || membersLoading;
  const hasActivePractice = !!settings;
  const activePlayersCount = players.filter((p) => p.status === 'active').length;
  const totalRounds = rounds.length;

  if (isLoadingData) {
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
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* ヒーローセクション */}
      <div className="text-center space-y-4 pt-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 mb-4">
          <Zap className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          ダブルス練習を始めましょう
        </h1>
        <p className="text-muted-foreground text-base">
          公平な組み合わせを自動生成して、効率的に練習を進めます
        </p>
      </div>

      {/* 練習状態カード */}
      {hasActivePractice ? (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  練習中
                </h2>
                <p className="text-sm text-muted-foreground">
                  前回の練習を続けますか？
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm font-medium text-primary">進行中</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center p-3 rounded-lg bg-card border border-border">
                <div className="flex items-center justify-center mb-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {activePlayersCount}
                </div>
                <div className="text-xs text-muted-foreground">参加者</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-card border border-border">
                <div className="flex items-center justify-center mb-1">
                  <PiCourtBasketball className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {settings.courts}
                </div>
                <div className="text-xs text-muted-foreground">コート</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-card border border-border">
                <div className="flex items-center justify-center mb-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {totalRounds}
                </div>
                <div className="text-xs text-muted-foreground">ラウンド</div>
              </div>
            </div>

            <Button
              onClick={handleContinue}
              disabled={isNavigating}
              className="w-full h-12 text-base font-semibold shadow-lg"
              size="lg"
            >
              <span className="inline-flex items-center gap-2">
                <Play className="w-5 h-5" />
                練習を続ける
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-dashed border-border">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">
                新しい練習を開始
              </h2>
              <p className="text-sm text-muted-foreground">
                参加者を選択して、公平な組み合わせを生成します
              </p>
            </div>
            <Button
              onClick={handleNewPractice}
              disabled={isNavigating || members.length === 0}
              className="w-full h-12 text-base font-semibold shadow-lg"
              size="lg"
            >
              <span className="inline-flex items-center gap-2">
                <Play className="w-5 h-5" />
                練習を開始
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
            {members.length === 0 && (
              <p className="text-xs text-muted-foreground">
                まずはメンバーページで選手を追加してください
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* クイックアクション */}
      <div className="grid grid-cols-2 gap-3">
        <Card
          className="cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => router.push('/members')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground text-sm">
                メンバー管理
              </div>
              <div className="text-xs text-muted-foreground">
                {members.length}名登録
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => router.push('/stats')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground text-sm">
                統計・履歴
              </div>
              <div className="text-xs text-muted-foreground">
                {totalRounds}ラウンド
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
