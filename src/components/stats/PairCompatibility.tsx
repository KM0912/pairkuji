import type { Member } from '@/types/member';
import type { PairWinRate } from '@/lib/statsCalculator';
import { Trophy, Users } from 'lucide-react';

interface PairCompatibilityProps {
  memberMap: Map<number, Member>;
  pairWinRates: PairWinRate[];
}

export function PairCompatibility({
  memberMap,
  pairWinRates,
}: PairCompatibilityProps) {
  if (pairWinRates.length === 0) {
    return (
      <div className="text-caption text-muted-foreground">
        ペア相性を表示するには3試合以上のペアが必要です。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-small text-muted-foreground">
        3試合以上組んだペアの通算勝率ランキング
      </div>

      <div className="space-y-2">
        {pairWinRates.map((pair, index) => {
          const name1 = memberMap.get(pair.player1)?.name ?? '???';
          const name2 = memberMap.get(pair.player2)?.name ?? '???';
          const winRateText =
            pair.winRate !== null
              ? `${Math.round(pair.winRate * 100)}%`
              : '-';
          const winRatePercent =
            pair.winRate !== null ? Math.round(pair.winRate * 100) : 0;

          return (
            <div
              key={`${pair.player1}-${pair.player2}`}
              className="rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold shrink-0">
                    {index + 1}
                  </span>
                  <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-caption font-semibold text-foreground truncate">
                    {name1} & {name2}
                  </span>
                </div>
                <div className="flex items-center gap-1 min-w-[48px] justify-end shrink-0">
                  {pair.winRate !== null && pair.winRate >= 0.6 && (
                    <Trophy className="w-3.5 h-3.5 text-success" />
                  )}
                  <span
                    className={`text-sm font-bold ${
                      pair.winRate !== null
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {winRateText}
                  </span>
                </div>
              </div>

              {/* 勝率バー */}
              {pair.winRate !== null && (
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full bg-chart-3 rounded-full transition-all duration-normal"
                    style={{ width: `${winRatePercent}%` }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div>
                  <span className="text-success font-medium">{pair.wins}W</span>
                  {' '}
                  <span className="text-destructive font-medium">{pair.losses}L</span>
                </div>
                <span>{pair.totalMatches}試合</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
