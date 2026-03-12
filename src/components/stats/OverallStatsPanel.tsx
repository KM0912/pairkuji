import type { Member } from '@/types/member';
import type { OverallPlayerStats } from '@/lib/statsCalculator';
import { Trophy } from 'lucide-react';

interface OverallStatsPanelProps {
  memberMap: Map<number, Member>;
  stats: OverallPlayerStats[];
}

export function OverallStatsPanel({ memberMap, stats }: OverallStatsPanelProps) {
  if (stats.length === 0) {
    return (
      <div className="text-caption text-muted-foreground">
        まだ試合結果が記録されていません。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-small text-muted-foreground">
        全セッションの通算成績
      </div>

      <div className="space-y-2">
        {stats.map((record, index) => {
          const member = memberMap.get(record.playerId);
          const name = member?.name ?? '???';
          const winRateText =
            record.winRate !== null
              ? `${Math.round(record.winRate * 100)}%`
              : '-';
          const winRatePercent =
            record.winRate !== null ? Math.round(record.winRate * 100) : 0;

          return (
            <div
              key={record.playerId}
              className="rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-caption font-semibold text-foreground truncate">
                    {name}
                  </span>
                </div>
                <div className="flex items-center gap-1 min-w-[48px] justify-end shrink-0">
                  {record.winRate !== null && (
                    <Trophy className="w-3.5 h-3.5 text-accent" />
                  )}
                  <span
                    className={`text-sm font-bold ${
                      record.winRate !== null
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {winRateText}
                  </span>
                </div>
              </div>

              {/* 勝率バー */}
              {record.winRate !== null && (
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-normal"
                    style={{ width: `${winRatePercent}%` }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div>
                  <span className="text-accent font-medium">{record.wins}W</span>
                  {' '}
                  <span className="text-destructive font-medium">{record.losses}L</span>
                  {record.unrecorded > 0 && (
                    <span className="ml-1">未登録{record.unrecorded}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span>{record.totalMatches}試合</span>
                  <span>{record.sessionCount}回参加</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
