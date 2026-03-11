'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMemberStore } from '@/lib/stores/memberStore';
import { db } from '@/lib/db';
import { Spinner } from '@/components/ui/spinner';
import { WinRatePanel } from '@/components/stats/WinRatePanel';
import { calculateWinRates } from '@/lib/winRateCalculator';
import { ArrowLeft, Trophy } from 'lucide-react';
import { PiCourtBasketball } from 'react-icons/pi';
import { IconBadge } from '@/components/ui/IconBadge';
import { cn } from '@/lib/utils';
import type { PracticeSession } from '@/types/practiceSession';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const {
    members,
    isLoading: membersLoading,
    isInitialLoad: membersInitialLoad,
    load: loadMembers,
  } = useMemberStore();

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sessionId = Number(params.id);

  useEffect(() => {
    loadMembers();
    if (!isNaN(sessionId)) {
      db.practiceSessions
        .get(sessionId)
        .then((data) => {
          setSession(data ?? null);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id!, m])),
    [members]
  );

  const winRates = useMemo(() => {
    if (!session) return new Map();
    return calculateWinRates(session.rounds);
  }, [session]);

  if (isLoading || membersLoading || !membersInitialLoad) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="size-8" />
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">セッションが見つかりません。</p>
          <button
            className="mt-4 text-primary underline"
            onClick={() => router.push('/history')}
          >
            履歴に戻る
          </button>
        </div>
      </div>
    );
  }

  const startDate = new Date(session.startedAt);
  const endDate = new Date(session.endedAt);

  return (
    <div className="bg-background">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-4">
        <button
          className="p-2 rounded-lg hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => router.push('/history')}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-sm font-bold text-foreground">
            {startDate.toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h1>
          <p className="text-xs text-muted-foreground">
            {startDate.toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            〜
            {endDate.toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            ・{session.courts}面・{session.playerIds.length}人
          </p>
        </div>
      </div>

      {/* 勝率サマリ */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          勝率
        </h2>
        <WinRatePanel memberMap={memberMap} winRates={winRates} />
      </div>

      {/* ラウンド詳細 */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          ラウンド詳細
        </h2>
        <div className="space-y-4">
          {session.rounds.map((round) => (
            <div key={round.roundNo}>
              <div className="text-xs font-bold text-foreground mb-2">
                ラウンド {round.roundNo}
              </div>
              <div className="space-y-2">
                {round.courts.map((court) => (
                  <div
                    key={court.courtNo}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <IconBadge
                        icon={PiCourtBasketball}
                        size="sm"
                        className="text-primary"
                      />
                      <span className="text-xs font-semibold text-foreground">
                        COURT {court.courtNo}
                      </span>
                      {court.result != null && (
                        <span className="text-xs text-success ml-auto">
                          <Trophy className="w-3 h-3 inline-block mr-0.5" />
                          {court.result === 'pairA' ? '左' : '右'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'flex-1 rounded-md border p-2 text-xs',
                          court.result === 'pairA'
                            ? 'border-success/50 bg-success/10'
                            : 'border-border bg-muted/30'
                        )}
                      >
                        {court.pairA
                          .map((id) => memberMap.get(id)?.name ?? '???')
                          .join(' / ')}
                      </div>
                      <span className="text-xs text-muted-foreground font-bold">
                        vs
                      </span>
                      <div
                        className={cn(
                          'flex-1 rounded-md border p-2 text-xs',
                          court.result === 'pairB'
                            ? 'border-success/50 bg-success/10'
                            : 'border-border bg-muted/30'
                        )}
                      >
                        {court.pairB
                          .map((id) => memberMap.get(id)?.name ?? '???')
                          .join(' / ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
