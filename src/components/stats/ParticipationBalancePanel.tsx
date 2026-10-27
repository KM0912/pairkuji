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

  const even = balance.rateSpreadPoints < 5;

  return (
    <div className="space-y-3">
      <div
        className={`rounded-lg border px-3 py-2 text-sm ${
          even
            ? 'border-border bg-muted/40 text-foreground'
            : 'border-amber-200 bg-amber-50 text-amber-900'
        }`}
      >
        {even
          ? '参加したラウンドの中での出場率は揃っています。来た回数の合計では比べていません。'
          : `出場率の差は${balance.rateSpreadPoints}ポイントです（高い人 ${percent(balance.rateMax)}% / 低い人 ${percent(balance.rateMin)}%）。来た回数ではなく、その人が入ったラウンドの中での割合です。`}
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
