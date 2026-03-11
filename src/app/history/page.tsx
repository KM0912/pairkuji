'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMemberStore } from '@/lib/stores/memberStore';
import { db } from '@/lib/db';
import { Spinner } from '@/components/ui/spinner';
import { History, ChevronRight, Trophy, Building2 } from 'lucide-react';
import type { PracticeSession } from '@/types/practiceSession';

export default function HistoryPage() {
  const router = useRouter();
  const {
    members,
    isLoading: membersLoading,
    isInitialLoad: membersInitialLoad,
    load: loadMembers,
  } = useMemberStore();

  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMembers();
    db.practiceSessions
      .orderBy('startedAt')
      .reverse()
      .toArray()
      .then((data) => {
        setSessions(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id!, m])),
    [members]
  );

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

  if (sessions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">練習履歴</h1>
            <p className="text-muted-foreground">
              まだ完了した練習がありません。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="space-y-3">
        {sessions.map((session) => {
          const startDate = new Date(session.startedAt);
          const endDate = new Date(session.endedAt);
          const roundCount = session.rounds.length;
          const recordedCount = session.rounds.reduce((acc, r) => {
            return acc + r.courts.filter((c) => c.result != null).length;
          }, 0);
          const totalMatches = session.rounds.reduce(
            (acc, r) => acc + r.courts.length,
            0
          );
          const playerNames = session.playerIds
            .map((id) => memberMap.get(id)?.name ?? '???')
            .slice(0, 4);
          const remainingCount = session.playerIds.length - playerNames.length;

          return (
            <button
              key={session.id}
              className="w-full text-left rounded-xl border-2 border-border/50 bg-card p-4 shadow-level-1 hover:shadow-level-2 hover:border-primary/30 transition-all duration-fast active:scale-[0.98]"
              onClick={() => router.push(`/history/${session.id}`)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-bold text-foreground">
                  {startDate.toLocaleDateString('ja-JP', {
                    month: 'long',
                    day: 'numeric',
                  })}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {startDate.toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    〜
                    {endDate.toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              {session.clubTags && session.clubTags.length > 0 && (
                <div className="flex items-center gap-1 mb-1 flex-wrap">
                  {session.clubTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-0.5 text-xs font-medium text-primary"
                    >
                      <Building2 className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{session.courts}面</span>
                <span>{session.playerIds.length}人</span>
                <span>{roundCount}ラウンド</span>
                {recordedCount > 0 && (
                  <span className="flex items-center gap-0.5 text-success">
                    <Trophy className="w-3 h-3" />
                    {recordedCount}/{totalMatches}
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-muted-foreground truncate">
                {playerNames.join('、')}
                {remainingCount > 0 && ` 他${remainingCount}名`}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
