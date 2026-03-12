import type { Member } from '@/types/member';
import type { WinRateRecord } from '@/lib/winRateCalculator';
import { Trophy } from 'lucide-react';

interface WinRatePanelProps {
  memberMap: Map<number, Member>;
  winRates: Map<number, WinRateRecord>;
}

export function WinRatePanel({ memberMap, winRates }: WinRatePanelProps) {
  const sortedRecords = Array.from(winRates.values()).sort((a, b) => {
    // 勝率あり同士は勝率降順、勝率nullは末尾
    if (a.winRate !== null && b.winRate !== null) return b.winRate - a.winRate;
    if (a.winRate !== null) return -1;
    if (b.winRate !== null) return 1;
    return 0;
  });

  if (sortedRecords.length === 0) {
    return (
      <div className="text-caption text-muted-foreground">
        まだ試合結果が記録されていません。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-small text-muted-foreground">
        今回の練習の勝率（未登録の試合は除外）
      </div>

      <div className="space-y-2">
        {sortedRecords.map((record) => {
          const member = memberMap.get(record.playerId);
          const name = member?.name ?? '???';
          const total = record.wins + record.losses;
          const winRateText =
            record.winRate !== null
              ? `${Math.round(record.winRate * 100)}%`
              : '-';

          return (
            <div
              key={record.playerId}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-caption font-semibold text-foreground truncate">
                  {name}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-xs text-muted-foreground">
                  <span className="text-accent font-medium">{record.wins}W</span>
                  {' '}
                  <span className="text-destructive font-medium">{record.losses}L</span>
                  {record.unrecorded > 0 && (
                    <span className="ml-1 text-muted-foreground" title="未登録の試合数">
                      未登録{record.unrecorded}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 min-w-[48px] justify-end">
                  {record.winRate !== null && (
                    <Trophy className="w-3.5 h-3.5 text-accent" />
                  )}
                  <span
                    className={`text-sm font-bold ${
                      record.winRate !== null
                        ? total > 0
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {winRateText}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
