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
          <div className="grid grid-cols-1 gap-4">
            {latestRound.courts.map((cm) => (
              <div
                key={cm.courtNo}
                className="rounded-2xl border bg-white p-5 shadow-lg hover:shadow-xl transition-all duration-200 border-slate-200"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-xl">{cm.courtNo}</span>
                    </div>
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                      <span className="text-xs font-medium text-gray-600 bg-white px-2 py-0.5 rounded-full border shadow-sm">
                        COURT
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Team A */}
                  <div className="flex-1 rounded-xl border-2 border-blue-400 bg-gradient-to-br from-blue-100 to-blue-200/80 p-3 min-w-0 shadow-lg">
                    <div className="text-xs font-bold uppercase tracking-wide text-blue-800 mb-2 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 shadow-sm"></div>
                      <span className="text-blue-700">TEAM A</span>
                    </div>
                    <div className="space-y-2">
                      {cm.pairA.map((id) => {
                        const member = memberMap.get(id);
                        const player = playerMap.get(id);
                        const name = member?.name ?? '???';
                        const number = player?.playerNumber ?? '?';
                        return (
                          <button
                            key={id}
                            className={`flex items-center gap-2 rounded-lg px-2.5 py-2.5 transition-all duration-200 w-full min-w-0 min-h-[48px] active:scale-95 shadow-sm border-2 ${
                              substituting === id
                                ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-300 shadow-md'
                                : 'bg-white border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md'
                            }`}
                            onClick={() => onPlayerClick(id)}
                          >
                            <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white grid place-items-center text-sm font-bold shadow-md">
                              {number}
                            </div>
                            <div
                              className="text-sm font-medium text-left flex-1 min-w-0"
                              title={name}
                            >
                              {name}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Team B */}
                  <div className="flex-1 rounded-xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-100 to-emerald-200/80 p-3 min-w-0 shadow-lg">
                    <div className="text-xs font-bold uppercase tracking-wide text-emerald-800 mb-2 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-sm"></div>
                      <span className="text-emerald-700">TEAM B</span>
                    </div>
                    <div className="space-y-2">
                      {cm.pairB.map((id) => {
                        const member = memberMap.get(id);
                        const player = playerMap.get(id);
                        const name = member?.name ?? '???';
                        const number = player?.playerNumber ?? '?';
                        return (
                          <button
                            key={id}
                            className={`flex items-center gap-2 rounded-lg px-2.5 py-2.5 transition-all duration-200 w-full min-w-0 min-h-[48px] active:scale-95 shadow-sm border-2 ${
                              substituting === id
                                ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-300 shadow-md'
                                : 'bg-white border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-md'
                            }`}
                            onClick={() => onPlayerClick(id)}
                          >
                            <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white grid place-items-center text-sm font-bold shadow-md">
                              {number}
                            </div>
                            <div
                              className="text-sm font-medium text-left flex-1 min-w-0"
                              title={name}
                            >
                              {name}
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
                <div className="rounded-lg border bg-white p-3 text-sm text-gray-700">
                  <div className="mb-2 font-medium">休憩</div>
                  <div className="flex flex-wrap gap-2">
                    {restingPlayers.map((id) => {
                      const member = memberMap.get(id);
                      const player = playerMap.get(id);
                      const name = member?.name ?? '???';
                      const number = player?.playerNumber ?? '?';
                      return (
                        <button
                          key={id}
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm transition-all duration-200 min-h-[48px] active:scale-95 ${
                            substituting === id
                              ? 'bg-yellow-100 border-yellow-400 text-yellow-800 ring-2 ring-yellow-300 shadow-md'
                              : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100 hover:shadow-sm'
                          }`}
                          onClick={() => onPlayerClick(id)}
                        >
                          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-gray-500 rounded-full">
                            {number}
                          </span>
                          <span title={name}>
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
        <div className="text-gray-500">
          まだ組み合わせがありません。ボタンで生成してください。
        </div>
      )}
    </section>
  );
}