import type { Round } from '@/types/round';
import type { PracticePlayer } from '@/types/practice';
import type { Member } from '@/types/member';
import type { WinRateRecord } from '@/lib/winRateCalculator';
import { WinRatePanel } from '@/components/stats/WinRatePanel';
import { PairStatsPanel } from '@/components/stats/PairStatsPanel';
import { OpponentStatsPanel } from '@/components/stats/OpponentStatsPanel';
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

interface SessionStatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rounds: Round[];
  players: PracticePlayer[];
  memberMap: Map<number, Member>;
  pairCounts: Map<string, number>;
  opponentCounts: Map<string, number>;
  winRates: Map<number, WinRateRecord>;
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
}: SessionStatsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-2 border-border/50 p-0">
        <DialogTitle className="sr-only">ラウンド履歴・統計</DialogTitle>
        <DialogDescription className="sr-only">
          ラウンド履歴とセッション内統計を表示します
        </DialogDescription>

        <Tabs defaultValue="history" className="w-full">
          <div className="border-b px-4 pt-4 pb-0">
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
              <div className="space-y-2 text-sm">
                {rounds.length === 0 ? (
                  <p className="text-muted-foreground">
                    まだラウンドがありません。
                  </p>
                ) : (
                  rounds
                    .slice()
                    .reverse()
                    .map((round) => (
                      <div
                        key={round.roundNo}
                        className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2"
                      >
                        <div className="font-medium text-foreground">
                          ラウンド {round.roundNo}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          コート {round.courts.length} / 休憩{' '}
                          {round.rests.length}
                        </div>
                      </div>
                    ))
                )}
              </div>
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
