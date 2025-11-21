import { type Member } from '@/types/member';
import { type PracticePlayer } from '@/types/practice';
import { type Round } from '@/types/round';
import { PiCourtBasketball } from 'react-icons/pi';
import { Users } from 'lucide-react';
import { IconBadge } from '../ui/IconBadge';
import { PlayerNumber } from '../ui/PlayerNumber';
import { Card, CardContent } from '../ui/card';

interface CourtManagementProps {
  players: PracticePlayer[];
  latestRound: Round | undefined;
  memberMap: Map<number, Member>;
  playerMap: Map<number, PracticePlayer>;
  substituting: number | null;
  onPlayerClick: (memberId: number) => Promise<void>;
}

export function CourtManagement({
  players,
  latestRound,
  memberMap,
  playerMap,
  substituting,
  onPlayerClick,
}: CourtManagementProps) {
  return (
    <section className="space-y-4">
      {latestRound ? (
        <>
          {/* コート一覧 */}
          <div className="space-y-3">
            {latestRound.courts.map((cm) => (
              <Card
                key={cm.courtNo}
                className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden"
              >
                <CardContent className="p-4">
                  {/* コートヘッダー */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <PiCourtBasketball className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-bold text-foreground">
                        コート {cm.courtNo}
                      </span>
                    </div>
                  </div>

                  {/* ペア表示 */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Team A */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground mb-1 px-1">
                        ペア A
                      </div>
                      <div className="space-y-1.5">
                        {cm.pairA.map((id) => {
                          const member = memberMap.get(id);
                          const player = playerMap.get(id);
                          const name = member?.name ?? '???';
                          const number = player?.playerNumber ?? '?';
                          const isSubstituting = substituting === id;
                          return (
                            <button
                              key={id}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 transition-all duration-200 w-full min-w-0 min-h-[52px] active:scale-[0.98] border-2 ${
                                isSubstituting
                                  ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-300 shadow-md'
                                  : 'bg-card border-primary/30 hover:bg-primary/10 hover:border-primary/50 hover:shadow-sm'
                              }`}
                              onClick={() => onPlayerClick(id)}
                            >
                              <PlayerNumber
                                number={number}
                                variant="primary"
                                size="sm"
                              />
                              <div className="flex-1 min-w-0 text-left">
                                <div
                                  className="text-sm font-semibold text-foreground truncate"
                                  title={name}
                                >
                                  {name}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Team B */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground mb-1 px-1">
                        ペア B
                      </div>
                      <div className="space-y-1.5">
                        {cm.pairB.map((id) => {
                          const member = memberMap.get(id);
                          const player = playerMap.get(id);
                          const name = member?.name ?? '???';
                          const number = player?.playerNumber ?? '?';
                          const isSubstituting = substituting === id;
                          return (
                            <button
                              key={id}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 transition-all duration-200 w-full min-w-0 min-h-[52px] active:scale-[0.98] border-2 ${
                                isSubstituting
                                  ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-300 shadow-md'
                                  : 'bg-card border-primary/30 hover:bg-primary/10 hover:border-primary/50 hover:shadow-sm'
                              }`}
                              onClick={() => onPlayerClick(id)}
                            >
                              <PlayerNumber
                                number={number}
                                variant="primary"
                                size="sm"
                              />
                              <div className="flex-1 min-w-0 text-left">
                                <div
                                  className="text-sm font-semibold text-foreground truncate"
                                  title={name}
                                >
                                  {name}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 休憩者セクション */}
          {(() => {
            const playersInCourts = latestRound.courts.flatMap((court) => [
              ...court.pairA,
              ...court.pairB,
            ]);
            const restingPlayers = players
              .filter(
                (p) =>
                  p.status === 'active' && !playersInCourts.includes(p.memberId)
              )
              .map((p) => p.memberId);

            return (
              restingPlayers.length > 0 && (
                <Card className="border-2 border-muted">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="font-semibold text-foreground">
                        休憩 ({restingPlayers.length}名)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {restingPlayers.map((id) => {
                        const member = memberMap.get(id);
                        const player = playerMap.get(id);
                        const name = member?.name ?? '???';
                        const number = player?.playerNumber ?? '?';
                        const isSubstituting = substituting === id;
                        return (
                          <button
                            key={id}
                            className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all duration-200 min-h-[44px] active:scale-95 ${
                              isSubstituting
                                ? 'bg-yellow-100 border-yellow-400 text-yellow-800 ring-2 ring-yellow-300 shadow-md'
                                : 'bg-card border-border text-foreground hover:bg-muted hover:border-primary/30'
                            }`}
                            onClick={() => onPlayerClick(id)}
                          >
                            <PlayerNumber
                              number={number}
                              variant="neutral"
                              size="xs"
                            />
                            <span
                              className="truncate max-w-[120px]"
                              title={name}
                            >
                              {name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            );
          })()}
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <PiCourtBasketball className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              まだ組み合わせがありません
            </h3>
            <p className="text-sm text-muted-foreground">
              下部のボタンで最初の組み合わせを生成してください
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
