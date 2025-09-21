import { type Member } from '@/types/member';
import { type PracticePlayer } from '@/types/practice';
import { type Round } from '@/types/round';
import { LayoutGrid } from 'lucide-react';
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
                className="py-2 px-2 rounded-lg border bg-white border-slate-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                    <IconBadge icon={LayoutGrid} size="sm" />
                    <span className="text-xs">COURT {cm.courtNo}</span>
                  </div>
                </div>
                <div className="flex items-stretch gap-1.5">
                  {/* Team A */}
                  <div className="flex-1 rounded-md border border-sky-400 bg-sky-50 p-1 min-w-0">
                    <div className="space-y-0.5">
                      {cm.pairA.map((id) => {
                        const member = memberMap.get(id);
                        const player = playerMap.get(id);
                        const name = member?.name ?? '???';
                        const number = player?.playerNumber ?? '?';
                        return (
                          <button
                            key={id}
                            className={`flex items-center gap-1 rounded-md px-1.5 py-1 transition-all duration-200 w-full min-w-0 min-h-[28px] active:scale-95 border ${
                              substituting === id
                                ? 'bg-yellow-50 border-yellow-400 ring-1 ring-yellow-300'
                                : 'bg-white border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                            }`}
                            onClick={() => onPlayerClick(id)}
                          >
                            <PlayerNumber
                              number={number}
                              variant="team-a"
                              size="xs"
                            />
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-xs font-medium text-left truncate"
                                title={name}
                              >
                                {name.length > 8
                                  ? name.substring(0, 8) + '...'
                                  : name}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Team B */}
                  <div className="flex-1 rounded-md border border-emerald-400 bg-emerald-50 p-1 min-w-0">
                    <div className="space-y-0.5">
                      {cm.pairB.map((id) => {
                        const member = memberMap.get(id);
                        const player = playerMap.get(id);
                        const name = member?.name ?? '???';
                        const number = player?.playerNumber ?? '?';
                        return (
                          <button
                            key={id}
                            className={`flex items-center gap-1 rounded-md px-1.5 py-1 transition-all duration-200 w-full min-w-0 min-h-[28px] active:scale-95 border ${
                              substituting === id
                                ? 'bg-yellow-50 border-yellow-400 ring-1 ring-yellow-300'
                                : 'bg-white border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300'
                            }`}
                            onClick={() => onPlayerClick(id)}
                          >
                            <PlayerNumber
                              number={number}
                              variant="team-b"
                              size="xs"
                            />
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-xs font-medium text-left truncate"
                                title={name}
                              >
                                {name.length > 8
                                  ? name.substring(0, 8) + '...'
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
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-700">
                  <div className="mb-1.5 font-medium text-slate-700 text-xs">休憩</div>
                  <div className="flex flex-wrap gap-1">
                    {restingPlayers.map((id) => {
                      const member = memberMap.get(id);
                      const player = playerMap.get(id);
                      const name = member?.name ?? '???';
                      const number = player?.playerNumber ?? '?';
                      return (
                        <button
                          key={id}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-all duration-200 min-h-[24px] active:scale-95 ${
                            substituting === id
                              ? 'bg-yellow-100 border-yellow-400 text-yellow-800 ring-1 ring-yellow-300'
                              : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                          }`}
                          onClick={() => onPlayerClick(id)}
                        >
                          <PlayerNumber
                            number={number}
                            variant="neutral"
                            size="xs"
                          />
                          <span
                            className="truncate max-w-[80px] text-left"
                            title={name}
                          >
                            {name.length > 8 ? name.substring(0, 8) + '...' : name}
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
        <div className="text-slate-600 text-sm">
          <div>まだ組み合わせがありません。下部のボタンで生成してください。</div>
        </div>
      )}
    </section>
  );
}
