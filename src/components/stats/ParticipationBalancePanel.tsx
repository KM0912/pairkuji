import type { Member } from '@/types/member';
import type { ParticipationBalance } from '@/lib/statsCalculator';
import { getDisplayName } from '@/lib/utils';

interface ParticipationBalancePanelProps {
  memberMap: Map<number, Member>;
  balance: ParticipationBalance;
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

  const even = balance.playedSpread === 0 && balance.restSpread === 0;

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
          ? '出場回数と休憩回数は揃っています。'
          : `出場の差 ${balance.playedSpread}回（最多 ${balance.playedMax} / 最少 ${balance.playedMin}）、休憩の差 ${balance.restSpread}回（最多 ${balance.restMax} / 最少 ${balance.restMin}）`}
      </div>
      <div className="space-y-2">
        {balance.records.map((record) => {
          const total = record.played + record.rested;
          const playedPercent = total > 0 ? Math.round((record.played / total) * 100) : 0;
          const underPlayed = record.played === balance.playedMin && balance.playedSpread > 0;
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
                  出場 {record.played} / 休憩 {record.rested}
                  {underPlayed ? ' ・少なめ' : ''}
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
