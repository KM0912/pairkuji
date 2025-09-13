import { type Member } from '@/types/member';
import { type PracticePlayer } from '@/types/practice';
import { type Round } from '@/types/round';

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
    <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">組み合わせ</h2>
          <button
            onClick={onShowPairStats}
            className="text-sm text-slate-600 hover:text-slate-700 underline-offset-4 hover:underline transition-colors font-medium"
          >
            ペア統計
          </button>
        </div>
        <button
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white hover:from-blue-600 hover:to-emerald-600 disabled:opacity-50 disabled:from-slate-400 disabled:to-slate-400 font-semibold min-h-[48px] shadow-lg hover:shadow-xl transition-all duration-200 border border-blue-400"
          onClick={onGenerateNextRound}
          disabled={players.filter((p) => p.status === 'active').length < 4}
        >
          🎲 次の組み合わせを生成
        </button>
      </div>
      {latestRound ? (
        <div className="space-y-4">
          <div className="text-sm text-gray-500">Round {latestRound.roundNo}</div>
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {latestRound.courts.map((cm, index) => (
              <div
                key={cm.courtNo}
                className={`py-3 px-1 ${
                  index % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <div className="inline-flex items-center gap-2 text-slate-600 font-semibold">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{cm.courtNo}</span>
                    </div>
                    <span className="text-sm">COURT {cm.courtNo}</span>
                  </div>
                </div>
                <div className="flex items-stretch gap-2">
                  {/* Team A */}
                  <div className="flex-1 rounded-lg border-2 border-blue-400 bg-gradient-to-br from-blue-100 to-blue-200/80 p-1.5 min-w-0 shadow-lg">
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
                                : 'bg-white border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md'
                            }`}
                            onClick={() => onPlayerClick(id)}
                          >
                            <div className="h-5 w-5 shrink-0 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white grid place-items-center text-xs font-bold shadow-sm">
                              {number}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-sm font-medium text-left truncate"
                                title={name}
                              >
                                {name.length > 10 ? name.substring(0, 10) + '...' : name}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Team B */}
                  <div className="flex-1 rounded-lg border-2 border-emerald-400 bg-gradient-to-br from-emerald-100 to-emerald-200/80 p-1.5 min-w-0 shadow-lg">
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
                                : 'bg-white border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-md'
                            }`}
                            onClick={() => onPlayerClick(id)}
                          >
                            <div className="h-5 w-5 shrink-0 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white grid place-items-center text-xs font-bold shadow-sm">
                              {number}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-sm font-medium text-left truncate"
                                title={name}
                              >
                                {name.length > 10 ? name.substring(0, 10) + '...' : name}
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
                <div className="rounded-lg border bg-slate-50 p-3 text-sm text-gray-700">
                  <div className="mb-2 font-medium text-slate-600">休憩</div>
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
                              : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100 hover:shadow-sm'
                          }`}
                          onClick={() => onPlayerClick(id)}
                        >
                          <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-semibold text-white bg-gray-500 rounded-full">
                            {number}
                          </span>
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
        <div className="text-gray-500">
          まだ組み合わせがありません。ボタンで生成してください。
        </div>
      )}
    </section>
  );
}