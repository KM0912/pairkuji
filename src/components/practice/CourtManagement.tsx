import { type Member } from '@/types/member';
import { type PracticePlayer } from '@/types/practice';
import { type Round } from '@/types/round';
import { Shuffle, BarChart3, LayoutGrid, Layers } from 'lucide-react';
import { Button } from '../ui/Button';
import { IconBadge } from '../ui/IconBadge';
import { PlayerNumber } from '../ui/PlayerNumber';

interface CourtManagementProps {
  players: PracticePlayer[];
  latestRound: Round | undefined;
  memberMap: Map<number, Member>;
  playerMap: Map<number, PracticePlayer>;
  substituting: number | null;
  onGenerateNextRound: () => Promise<void>;
  onPlayerClick: (memberId: number) => Promise<void>;
  onShowPairStats: () => void;
}

export function CourtManagement({
  players,
  latestRound,
  memberMap,
  playerMap,
  substituting,
  onGenerateNextRound,
  onPlayerClick,
  onShowPairStats,
}: CourtManagementProps) {
  return (
    <section className="bg-white px-4 py-6 rounded-2xl border border-slate-200 shadow-lg">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <IconBadge icon={Layers} />
            組み合わせ
          </h2>
          <button
            onClick={onShowPairStats}
            className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            aria-label="ペア統計を表示"
          >
            <BarChart3 className="w-4 h-4" />
            ペア統計
          </button>
        </div>
        <Button
          variant="primary"
          onClick={onGenerateNextRound}
          disabled={players.filter((p) => p.status === 'active').length < 4}
        >
          <span className="inline-flex items-center gap-2">
            <Shuffle className="w-4 h-4" />
            次の組み合わせを生成
          </span>
        </Button>
      </div>
      {latestRound ? (
        <div className="space-y-4">
          <div>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              ラウンド
              <strong className="ml-1">{latestRound.roundNo}</strong>
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {latestRound.courts.map((cm, index) => (
              <div
                key={cm.courtNo}
                className={`py-3 px-1 ${
                  index % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="inline-flex items-center gap-2 text-slate-700 font-medium">
                    <IconBadge icon={LayoutGrid} />
                    <span className="text-sm">COURT {cm.courtNo}</span>
                  </div>
                </div>
                <div className="flex items-stretch gap-2">
                  {/* Team A */}
                  <div className="flex-1 rounded-lg border-2 border-blue-500 bg-gradient-to-br from-blue-100 to-blue-200/80 p-1.5 min-w-0 shadow-lg">
                    <div className="text-xs font-bold uppercase tracking-wide text-blue-800 mb-1 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 shadow-sm"></div>
                      <span className="text-blue-700">TEAM A</span>
                    </div>
                    <div className="space-y-1">
                      {cm.pairA.map((id) => {
                        const member = memberMap.get(id);
                        const player = playerMap.get(id);
                        const name = member?.name ?? '???';
                        const number = player?.playerNumber ?? '?';
                        return (
                          <button
                            key={id}
                            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-all duration-200 w-full min-w-0 min-h-[36px] active:scale-95 shadow-sm border-2 ${
                              substituting === id
                                ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-300 shadow-md'
                                : 'bg-white border-blue-300 hover:bg-blue-50 hover:border-blue-400 hover:shadow-md'
                            }`}
                            onClick={() => onPlayerClick(id)}
                          >
                            <PlayerNumber number={number} variant="team-a" size="sm" />
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-sm font-medium text-left truncate"
                                title={name}
                              >
                                {name.length > 10
                                  ? name.substring(0, 10) + '...'
                                  : name}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Team B */}
                  <div className="flex-1 rounded-lg border-2 border-emerald-500 bg-gradient-to-br from-emerald-100 to-emerald-200/80 p-1.5 min-w-0 shadow-lg">
                    <div className="text-xs font-bold uppercase tracking-wide text-emerald-800 mb-1 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-sm"></div>
                      <span className="text-emerald-700">TEAM B</span>
                    </div>
                    <div className="space-y-1">
                      {cm.pairB.map((id) => {
                        const member = memberMap.get(id);
                        const player = playerMap.get(id);
                        const name = member?.name ?? '???';
                        const number = player?.playerNumber ?? '?';
                        return (
                          <button
                            key={id}
                            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-all duration-200 w-full min-w-0 min-h-[36px] active:scale-95 shadow-sm border-2 ${
                              substituting === id
                                ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-300 shadow-md'
                                : 'bg-white border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 hover:shadow-md'
                            }`}
                            onClick={() => onPlayerClick(id)}
                          >
                            <PlayerNumber number={number} variant="team-b" size="sm" />
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-sm font-medium text-left truncate"
                                title={name}
                              >
                                {name.length > 10
                                  ? name.substring(0, 10) + '...'
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
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="mb-2 font-medium text-slate-700">休憩</div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {restingPlayers.map((id) => {
                      const member = memberMap.get(id);
                      const player = playerMap.get(id);
                      const name = member?.name ?? '???';
                      const number = player?.playerNumber ?? '?';
                      return (
                        <button
                          key={id}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-sm transition-all duration-200 min-h-[32px] active:scale-95 ${
                            substituting === id
                              ? 'bg-yellow-100 border-yellow-400 text-yellow-800 ring-2 ring-yellow-300 shadow-md'
                              : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50 hover:shadow-sm'
                          }`}
                          onClick={() => onPlayerClick(id)}
                        >
                          <PlayerNumber number={number} variant="neutral" size="xs" />
                          <span
                            className="truncate max-w-[130px] text-left"
                            title={name}
                          >
                            {name}
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
          まだ組み合わせがありません。ボタンで生成してください。
        </div>
      )}
    </section>
  );
}
