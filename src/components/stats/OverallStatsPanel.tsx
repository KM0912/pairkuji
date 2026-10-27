import type { Member } from '@/types/member';
import { MIN_RANKED_MATCHES, type OverallPlayerStats } from '@/lib/statsCalculator';
import { getDisplayName } from '@/lib/utils';
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
        勝率は、勝ち÷結果がある試合です。{MIN_RANKED_MATCHES}試合未満は順位に入りません。
      </div>

      <div className="space-y-2">
        {stats.map((record) => {
          const name = getDisplayName(memberMap, record.playerId);
          const winRate = record.winRate;
          const ranked = winRate !== null && record.totalMatches >= MIN_RANKED_MATCHES;
          let rank: number | null = null;
          if (winRate !== null && record.totalMatches >= MIN_RANKED_MATCHES) {
            const rate = winRate;
            rank =
              stats.filter((item) => {
                if (item.winRate === null || item.totalMatches < MIN_RANKED_MATCHES) {
                  return false;
                }
                if (item.winRate > rate) return true;
                if (item.winRate < rate) return false;
                if (item.totalMatches !== record.totalMatches) {
                  return item.totalMatches > record.totalMatches;
                }
                return item.playerId < record.playerId;
              }).length + 1;
          }
          const topRate = stats.reduce<number | null>((best, item) => {
            if (item.winRate === null || item.totalMatches < MIN_RANKED_MATCHES) {
              return best;
            }
            return best === null || item.winRate > best ? item.winRate : best;
          }, null);
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
                    {rank ?? '–'}
                  </span>
                  <span className="text-caption font-semibold text-foreground truncate">
                    {name}
                  </span>
                </div>
                <div className="flex items-center gap-1 min-w-[48px] justify-end shrink-0">
                  {ranked && topRate !== null && record.winRate === topRate && (
                    <Trophy className="w-3.5 h-3.5 text-accent" aria-label="勝率1位" />
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
                  <span className="text-accent font-medium">{record.wins}勝</span>
                  {' '}
                  <span className="text-destructive font-medium">{record.losses}敗</span>
                  {record.unrecorded > 0 && (
                    <span className="ml-1">結果未入力{record.unrecorded}</span>
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
