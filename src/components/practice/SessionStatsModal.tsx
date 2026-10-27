import { Fragment, useMemo } from 'react';
import type { MatchResult, Round } from '@/types/round';
import type { PracticePlayer } from '@/types/practice';
import type { Member } from '@/types/member';
import type { WinRateRecord } from '@/lib/winRateCalculator';
import { WinRatePanel } from '@/components/stats/WinRatePanel';
import { PairStatsPanel } from '@/components/stats/PairStatsPanel';
import { OpponentStatsPanel } from '@/components/stats/OpponentStatsPanel';
import { PlayerNumber } from '@/components/ui/PlayerNumber';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Trophy } from 'lucide-react';
import { PiCourtBasketball } from 'react-icons/pi';
import { IconBadge } from '@/components/ui/IconBadge';
import { cn, getDisplayName } from '@/lib/utils';
import { WAITING_THIS_ROUND, courtLabel } from '@/lib/practiceLabels';

interface SessionStatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rounds: Round[];
  players: PracticePlayer[];
  memberMap: Map<number, Member>;
  pairCounts: Map<string, number>;
  opponentCounts: Map<string, number>;
  winRates: Map<number, WinRateRecord>;
  onRecordResult?: (
    roundNo: number,
    courtNo: number,
    result: MatchResult
  ) => Promise<void>;
}

function pairNumbers(
  ids: readonly number[],
  playerMap: Map<number, PracticePlayer>
): string {
  return ids
    .map((id) => String(playerMap.get(id)?.playerNumber ?? '?'))
    .join('・');
}

function HistoryPlayerLabel({
  memberId,
  memberMap,
  playerMap,
}: {
  memberId: number;
  memberMap: Map<number, Member>;
  playerMap: Map<number, PracticePlayer>;
}) {
  const number = playerMap.get(memberId)?.playerNumber ?? '?';
  return (
    <span className="inline-flex items-center gap-1 min-w-0">
      <PlayerNumber number={number} variant="primary" size="xs" />
      <span className="truncate">{getDisplayName(memberMap, memberId)}</span>
    </span>
  );
}

export function SessionStatsModal({
  open,
  onOpenChange,
  rounds,
  players,
  memberMap,
  pairCounts,
  opponentCounts,
  winRates,
  onRecordResult,
}: SessionStatsModalProps) {
  const playerMap = useMemo(
    () => new Map(players.map((p) => [p.memberId, p])),
    [players]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-2 border-border/50 p-0">
        <DialogTitle className="sr-only">ラウンド履歴・統計</DialogTitle>
        <DialogDescription className="sr-only">
          ラウンド履歴とセッション内統計を表示します
        </DialogDescription>

        <Tabs defaultValue="history" className="w-full">
          <div className="border-b pb-0 pl-4 pr-16 pt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="history" className="text-xs">
                履歴
              </TabsTrigger>
              <TabsTrigger value="winrate" className="text-xs">
                勝率
              </TabsTrigger>
              <TabsTrigger value="pair" className="text-xs">
                ペア
              </TabsTrigger>
              <TabsTrigger value="opponent" className="text-xs">
                対戦
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="max-h-[60vh] overflow-auto px-4 py-3">
            <TabsContent value="history" className="mt-0">
              {rounds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  まだラウンドがありません。
                </p>
              ) : (
                <div className="space-y-4">
                  {rounds
                    .slice()
                    .reverse()
                    .map((round) => (
                      <div key={round.roundNo}>
                        <div className="text-xs font-bold text-foreground mb-2">
                          ラウンド {round.roundNo}
                        </div>
                        <div className="space-y-2">
                          {round.courts.map((court) => (
                            <div
                              key={court.courtNo}
                              className="rounded-lg border border-border bg-card p-3"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <IconBadge
                                  icon={PiCourtBasketball}
                                  size="sm"
                                  className="text-primary"
                                />
                                <span className="text-xs font-semibold text-foreground">
                                  {courtLabel(court.courtNo)}
                                </span>
                                {court.result != null && (
                                  <span className="text-xs text-accent ml-auto">
                                    <Trophy className="w-3 h-3 inline-block mr-0.5" />
                                    {pairNumbers(
                                      court.result === 'pairA' ? court.pairA : court.pairB,
                                      playerMap
                                    )}
                                    の勝ち
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    'flex-1 rounded-md border p-2 text-xs',
                                    court.result === 'pairA'
                                      ? 'border-accent/50 bg-accent/10'
                                      : 'border-border bg-muted/30'
                                  )}
                                >
                                  <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
                                    {court.pairA.map((id, index) => (
                                      <Fragment key={id}>
                                        {index > 0 && (
                                          <span className="text-muted-foreground">
                                            /
                                          </span>
                                        )}
                                        <HistoryPlayerLabel
                                          memberId={id}
                                          memberMap={memberMap}
                                          playerMap={playerMap}
                                        />
                                      </Fragment>
                                    ))}
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground font-bold">
                                  vs
                                </span>
                                <div
                                  className={cn(
                                    'flex-1 rounded-md border p-2 text-xs',
                                    court.result === 'pairB'
                                      ? 'border-accent/50 bg-accent/10'
                                      : 'border-border bg-muted/30'
                                  )}
                                >
                                  <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
                                    {court.pairB.map((id, index) => (
                                      <Fragment key={id}>
                                        {index > 0 && (
                                          <span className="text-muted-foreground">
                                            /
                                          </span>
                                        )}
                                        <HistoryPlayerLabel
                                          memberId={id}
                                          memberMap={memberMap}
                                          playerMap={playerMap}
                                        />
                                      </Fragment>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              {onRecordResult && (
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    className={cn(
                                      'min-h-[44px] rounded-md px-2 text-xs font-semibold',
                                      court.result === 'pairA'
                                        ? 'bg-accent text-accent-foreground'
                                        : 'bg-muted text-muted-foreground'
                                    )}
                                    onClick={() =>
                                      void onRecordResult(
                                        round.roundNo,
                                        court.courtNo,
                                        court.result === 'pairA' ? null : 'pairA'
                                      )
                                    }
                                  >
                                    {court.result === 'pairA'
                                      ? `${pairNumbers(court.pairA, playerMap)}の勝ち✓`
                                      : '勝ち'}
                                  </button>
                                  <button
                                    type="button"
                                    className={cn(
                                      'min-h-[44px] rounded-md px-2 text-xs font-semibold',
                                      court.result === 'pairB'
                                        ? 'bg-accent text-accent-foreground'
                                        : 'bg-muted text-muted-foreground'
                                    )}
                                    onClick={() =>
                                      void onRecordResult(
                                        round.roundNo,
                                        court.courtNo,
                                        court.result === 'pairB' ? null : 'pairB'
                                      )
                                    }
                                  >
                                    {court.result === 'pairB'
                                      ? `${pairNumbers(court.pairB, playerMap)}の勝ち✓`
                                      : '勝ち'}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                          {round.rests.length > 0 && (
                            <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted-foreground px-1">
                              <span className="shrink-0">{WAITING_THIS_ROUND}:</span>
                              {round.rests.map((id, index) => (
                                <Fragment key={id}>
                                  {index > 0 && <span>、</span>}
                                  <HistoryPlayerLabel
                                    memberId={id}
                                    memberMap={memberMap}
                                    playerMap={playerMap}
                                  />
                                </Fragment>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="winrate" className="mt-0">
              <WinRatePanel memberMap={memberMap} winRates={winRates} />
            </TabsContent>

            <TabsContent value="pair" className="mt-0">
              <PairStatsPanel players={players} pairCounts={pairCounts} />
            </TabsContent>

            <TabsContent value="opponent" className="mt-0">
              <OpponentStatsPanel
                players={players}
                opponentCounts={opponentCounts}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
