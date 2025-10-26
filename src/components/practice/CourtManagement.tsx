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
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-2">
            {latestRound.courts.map((cm) => (
              <div
                key={cm.courtNo}
                className="py-2 px-2 rounded-lg border bg-card border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="inline-flex items-center gap-1.5 text-foreground font-medium">
                    <IconBadge icon={PiCourtBasketball} size="sm" />
                    <span className="text-xs">COURT {cm.courtNo}</span>
                  </div>
                </div>
                <div className="flex items-stretch gap-1.5">
                  {/* Team A */}
                  <div className="flex-1 rounded-md border border-primary/40 bg-primary/5 p-1 min-w-0">
                    <div className="space-y-0.5">
                      {cm.pairA.map((id) => {
                        const member = memberMap.get(id);
                        const player = playerMap.get(id);
                        const name = member?.name ?? '???';
                        const number = player?.playerNumber ?? '?';
                        return (
                          <button
                            key={id}
                            className={`flex items-center gap-2 rounded-md px-3 py-2 transition-all duration-200 w-full min-w-0 min-h-[44px] active:scale-95 border ${
                              substituting === id
                                ? 'bg-yellow-50 border-yellow-400 ring-1 ring-yellow-300'
                                : 'bg-card border-primary/30 hover:bg-primary/10 hover:border-primary/40'
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
                                className="text-sm font-medium text-left truncate"
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
                  <div className="flex-1 rounded-md border border-primary/40 bg-primary/5 p-1 min-w-0">
                    <div className="space-y-0.5">
                      {cm.pairB.map((id) => {
                        const member = memberMap.get(id);
                        const player = playerMap.get(id);
                        const name = member?.name ?? '???';
                        const number = player?.playerNumber ?? '?';
                        return (
                          <button
                            key={id}
                            className={`flex items-center gap-2 rounded-md px-3 py-2 transition-all duration-200 w-full min-w-0 min-h-[44px] active:scale-95 border ${
                              substituting === id
                                ? 'bg-yellow-50 border-yellow-400 ring-1 ring-yellow-300'
                                : 'bg-card border-primary/30 hover:bg-primary/10 hover:border-primary/40'
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
                                className="text-sm font-medium text-left truncate"
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
                <div className="rounded-lg border border-border bg-muted p-2 text-sm text-foreground">
                  <div className="mb-1.5 font-medium text-foreground text-xs">
                    休憩
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
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all duration-200 min-h-[44px] active:scale-95 ${
                            substituting === id
                              ? 'bg-yellow-100 border-yellow-400 text-yellow-800 ring-1 ring-yellow-300'
                              : 'bg-card border-border text-foreground hover:bg-muted'
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
