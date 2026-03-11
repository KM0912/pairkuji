'use client';

import { useState, useMemo } from 'react';
import type { Member } from '@/types/member';
import type { PracticeSession } from '@/types/practiceSession';
import type { Round } from '@/types/round';
import { calculateHeadToHead } from '@/lib/statsCalculator';
import { Swords, ShieldAlert, Target } from 'lucide-react';

interface HeadToHeadProps {
  memberMap: Map<number, Member>;
  sessions: PracticeSession[];
  currentRounds: Round[];
  playerIds: number[];
}

export function HeadToHead({
  memberMap,
  sessions,
  currentRounds,
  playerIds,
}: HeadToHeadProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  const records = useMemo(() => {
    if (selectedPlayerId === null) return [];
    return calculateHeadToHead(sessions, currentRounds, selectedPlayerId);
  }, [sessions, currentRounds, selectedPlayerId]);

  // 天敵（最も勝率が低い相手、1試合以上）
  const nemesis = useMemo(() => {
    const withMatches = records.filter((r) => r.totalMatches >= 1 && r.winRate !== null);
    if (withMatches.length === 0) return null;
    return withMatches.reduce((min, r) =>
      r.winRate! < min.winRate! ? r : min
    );
  }, [records]);

  // カモ（最も勝率が高い相手、1試合以上）
  const prey = useMemo(() => {
    const withMatches = records.filter((r) => r.totalMatches >= 1 && r.winRate !== null);
    if (withMatches.length === 0) return null;
    return withMatches.reduce((max, r) =>
      r.winRate! > max.winRate! ? r : max
    );
  }, [records]);

  if (playerIds.length === 0) {
    return (
      <div className="text-caption text-muted-foreground">
        まだ試合結果が記録されていません。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-small text-muted-foreground">
        プレイヤーを選択して対戦成績を確認
      </div>

      {/* プレイヤー選択 */}
      <div className="flex flex-wrap gap-1.5">
        {playerIds.map((id) => {
          const name = memberMap.get(id)?.name ?? '???';
          const isSelected = selectedPlayerId === id;

          return (
            <button
              key={id}
              onClick={() => setSelectedPlayerId(isSelected ? null : id)}
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-fast ${
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground border border-border'
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      {selectedPlayerId !== null && (
        <>
          {/* 天敵 & カモ サマリー */}
          {(nemesis || prey) && (
            <div className="grid grid-cols-2 gap-2">
              {prey && prey.winRate !== null && prey.winRate > 0 && (
                <div className="rounded-lg border border-success/30 bg-success/5 px-3 py-2">
                  <div className="flex items-center gap-1 text-[10px] text-success font-medium mb-1">
                    <Target className="w-3 h-3" />
                    カモ
                  </div>
                  <div className="text-xs font-semibold text-foreground truncate">
                    {memberMap.get(prey.opponentId)?.name ?? '???'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {prey.wins}W {prey.losses}L ({Math.round(prey.winRate * 100)}%)
                  </div>
                </div>
              )}
              {nemesis && nemesis.winRate !== null && nemesis.winRate < 1 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                  <div className="flex items-center gap-1 text-[10px] text-destructive font-medium mb-1">
                    <ShieldAlert className="w-3 h-3" />
                    天敵
                  </div>
                  <div className="text-xs font-semibold text-foreground truncate">
                    {memberMap.get(nemesis.opponentId)?.name ?? '???'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {nemesis.wins}W {nemesis.losses}L ({Math.round(nemesis.winRate * 100)}%)
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 対戦成績一覧 */}
          {records.length === 0 ? (
            <div className="text-caption text-muted-foreground">
              対戦記録がありません。
            </div>
          ) : (
            <div className="space-y-1.5">
              {records.map((record) => {
                const name = memberMap.get(record.opponentId)?.name ?? '???';
                const winRateText =
                  record.winRate !== null
                    ? `${Math.round(record.winRate * 100)}%`
                    : '-';

                return (
                  <div
                    key={record.opponentId}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Swords className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium text-foreground truncate">
                        vs {name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-xs text-muted-foreground">
                        <span className="text-success font-medium">{record.wins}W</span>
                        {' '}
                        <span className="text-destructive font-medium">{record.losses}L</span>
                      </div>
                      <span
                        className={`text-xs font-bold min-w-[32px] text-right ${
                          record.winRate !== null && record.winRate >= 0.5
                            ? 'text-success'
                            : record.winRate !== null
                              ? 'text-destructive'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {winRateText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
