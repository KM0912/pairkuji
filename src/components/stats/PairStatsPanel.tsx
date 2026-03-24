import { getDisplayName } from '@/lib/utils';
import type { Member } from '@/types/member';
import { type PracticePlayer } from '@/types/practice';

interface PairStatsPanelProps {
  players: PracticePlayer[];
  pairCounts: Map<string, number>;
  /** 履歴など出場番号がないとき、表示名で組み合わせを示す */
  useDisplayNames?: boolean;
  memberMap?: Map<number, Member>;
}

export function PairStatsPanel({
  players,
  pairCounts,
  useDisplayNames = false,
  memberMap,
}: PairStatsPanelProps) {
  const sortedPlayers = [...players].sort(
    (a, b) => a.playerNumber - b.playerNumber
  );

  const allPairs: Array<{
    key: string;
    player1: PracticePlayer;
    player2: PracticePlayer;
    count: number;
  }> = [];

  for (let i = 0; i < sortedPlayers.length; i++) {
    for (let j = i + 1; j < sortedPlayers.length; j++) {
      const p1 = sortedPlayers[i]!;
      const p2 = sortedPlayers[j]!;
      const key = `${Math.min(p1.memberId, p2.memberId)}-${Math.max(
        p1.memberId,
        p2.memberId
      )}`;
      const count = pairCounts.get(key) || 0;

      allPairs.push({
        key,
        player1: p1,
        player2: p2,
        count,
      });
    }
  }

  allPairs.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    if (a.player1.playerNumber !== b.player1.playerNumber) {
      return a.player1.playerNumber - b.player1.playerNumber;
    }
    return a.player2.playerNumber - b.player2.playerNumber;
  });

  const totalPairs = allPairs.length;
  const neverMetPairs = allPairs.filter((pair) => pair.count === 0).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-small text-muted-foreground">
          未対戦 {neverMetPairs}/{totalPairs}
        </div>
      </div>

      {totalPairs === 0 ? (
        <div className="text-caption text-muted-foreground">
          参加者が不足しているため、ペア統計はまだ表示できません。
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between text-small text-muted-foreground">
            <span>
              {useDisplayNames
                ? '表示名の組み合わせとペア回数'
                : '出場番号の組み合わせとペア回数'}
            </span>
            <span className="font-medium text-foreground">
              総ペア数 {totalPairs}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allPairs.map(({ key, player1, player2, count }) => (
              <div
                key={key}
                className={`flex items-center justify-between gap-1 rounded-lg border px-2 py-1.5 text-xs ${
                  count > 0
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-muted border-border text-muted-foreground'
                }`}
              >
                {useDisplayNames && memberMap ? (
                  <div className="flex min-w-0 flex-1 items-center gap-0.5 text-[11px] leading-tight">
                    <span className="truncate font-medium text-foreground">
                      {getDisplayName(memberMap, player1.memberId)}
                    </span>
                    <span className="shrink-0 text-muted-foreground">×</span>
                    <span className="truncate font-medium text-foreground">
                      {getDisplayName(memberMap, player2.memberId)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-foreground text-background text-[11px] font-semibold">
                      {player1.playerNumber}
                    </span>
                    <span className="text-[10px] text-muted-foreground">×</span>
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-foreground text-background text-[11px] font-semibold">
                      {player2.playerNumber}
                    </span>
                  </div>
                )}
                <span className="shrink-0 text-xs font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
