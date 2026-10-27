import type { Member } from '@/types/member';
import type { ParticipationBalance } from '@/lib/statsCalculator';
import { getDisplayName } from '@/lib/utils';

interface ParticipationBalancePanelProps {
  memberMap: Map<number, Member>;
  balance: ParticipationBalance;
}

function percent(rate: number | null): number {
  if (rate == null) return 0;
  return Math.round(rate * 100);
}

export function ParticipationBalancePanel({
  memberMap,
  balance,
}: ParticipationBalancePanelProps) {
  if (balance.records.length === 0) {
    return (
      <div className="text-caption text-muted-foreground">
        まだ出場データがありません。
      </div>
    );
  }

  const excess = balance.warningExcessPoints;
  const judged = balance.participationJudged;
  const even = judged && excess < 5;

  return (
    <div className="space-y-3">
      <div
        className={`rounded-lg border px-3 py-2 text-sm ${
          !judged || even
            ? 'border-border bg-muted/40 text-foreground'
            : 'border-amber-200 bg-amber-50 text-amber-900'
        }`}
      >
        {!judged
          ? 'ラウンドが少ないため判定していません'
          : even
            ? '参加したラウンドの中での出場率は、人数とコート数から見て揃っています。'
            : `出場率は、1回の練習で最後までいた人について、人数とコート数から見た差より${excess}ポイント開いています。`}
      </div>
      <div className="space-y-2">
        {balance.records.map((record) => {
          const playedPercent = percent(record.playRate);
          return (
            <div
              key={record.playerId}
              className="rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="truncate text-caption font-semibold text-foreground">
                  {getDisplayName(memberMap, record.playerId)}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  出場率 {playedPercent}%（出場 {record.played} / 休憩 {record.rested}）
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${playedPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
