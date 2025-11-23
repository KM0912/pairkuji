import { type Member } from '@/types/member';
import { type PracticePlayer } from '@/types/practice';
import { type Round } from '@/types/round';
import { PiCourtBasketball } from 'react-icons/pi';
import { IconBadge } from '../ui/IconBadge';
import { PlayerNumber } from '../ui/PlayerNumber';

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
    <section>
      {latestRound ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {latestRound.courts.map((cm) => (
              <div
                key={cm.courtNo}
                className="py-3 px-3 rounded-xl border-2 bg-gradient-to-br from-card to-card/50 border-primary/20 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="inline-flex items-center gap-2 text-foreground font-bold">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <IconBadge icon={PiCourtBasketball} size="sm" className="text-primary" />
                    </div>
                    <span className="text-sm tracking-wide">COURT {cm.courtNo}</span>
                  </div>
                </div>
                <div className="flex items-stretch gap-2">
                  {/* Team A */}
                  <div className="flex-1 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-2 min-w-0 shadow-sm">
                    <div className="space-y-1">
                      {cm.pairA.map((id) => {
                        const member = memberMap.get(id);
                        const player = playerMap.get(id);
                        const name = member?.name ?? '???';
                        const number = player?.playerNumber ?? '?';
                        return (
                          <button
                            key={id}
                            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all duration-200 w-full min-w-0 min-h-[48px] active:scale-[0.98] border-2 ${
                              substituting === id
                                ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-300 shadow-md'
                                : 'bg-white/80 border-primary/40 hover:bg-primary/15 hover:border-primary/50 hover:shadow-sm'
                            }`}
                            onClick={() => onPlayerClick(id)}
                          >
                            <PlayerNumber
                              number={number}
                              variant="primary"
                              size="xs"
                            />
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-sm font-semibold text-left truncate text-foreground"
                                title={name}
                              >
                                {name.length > 12
                                  ? name.substring(0, 12) + '...'
                                  : name}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Team B */}
                  <div className="flex-1 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-2 min-w-0 shadow-sm">
                    <div className="space-y-1">
                      {cm.pairB.map((id) => {
                        const member = memberMap.get(id);
                        const player = playerMap.get(id);
                        const name = member?.name ?? '???';
                        const number = player?.playerNumber ?? '?';
                        return (
                          <button
                            key={id}
                            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all duration-200 w-full min-w-0 min-h-[48px] active:scale-[0.98] border-2 ${
                              substituting === id
                                ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-300 shadow-md'
                                : 'bg-white/80 border-primary/40 hover:bg-primary/15 hover:border-primary/50 hover:shadow-sm'
                            }`}
                            onClick={() => onPlayerClick(id)}
                          >
                            <PlayerNumber
                              number={number}
                              variant="primary"
                              size="xs"
                            />
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-sm font-semibold text-left truncate text-foreground"
                                title={name}
                              >
                                {name.length > 12
                                  ? name.substring(0, 12) + '...'
                                  : name}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {(() => {
            // Get all players currently in courts
            const playersInCourts = latestRound.courts.flatMap((court) => [
              ...court.pairA,
              ...court.pairB,
            ]);
            // Get all active players not in courts
            const restingPlayers = players
              .filter(
                (p) =>
                  p.status === 'active' && !playersInCourts.includes(p.memberId)
              )
              .map((p) => p.memberId);

            return (
              restingPlayers.length > 0 && (
                <div className="rounded-xl border-2 border-border/50 bg-gradient-to-br from-muted/80 to-muted/50 p-3 shadow-sm">
                  <div className="mb-2 font-semibold text-foreground text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
                    休憩中
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {restingPlayers.map((id) => {
                      const member = memberMap.get(id);
                      const player = playerMap.get(id);
                      const name = member?.name ?? '???';
                      const number = player?.playerNumber ?? '?';
                      return (
                        <button
                          key={id}
                          className={`inline-flex items-center gap-2 rounded-full border-2 px-3.5 py-2 text-sm font-medium transition-all duration-200 min-h-[44px] active:scale-95 shadow-sm ${
                            substituting === id
                              ? 'bg-yellow-100 border-yellow-400 text-yellow-800 ring-2 ring-yellow-300 shadow-md'
                              : 'bg-white/90 border-border/60 text-foreground hover:bg-muted hover:border-border hover:shadow-md'
                          }`}
                          onClick={() => onPlayerClick(id)}
                        >
                          <PlayerNumber
                            number={number}
                            variant="neutral"
                            size="xs"
                          />
                          <span
                            className="truncate max-w-[100px] text-left"
                            title={name}
                          >
                            {name.length > 12
                              ? name.substring(0, 12) + '...'
                              : name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            );
          })()}
        </div>
      ) : (
        <div className="text-muted-foreground text-sm">
          <div>
            まだ組み合わせがありません。下部のボタンで生成してください。
          </div>
        </div>
      )}
    </section>
  );
}
