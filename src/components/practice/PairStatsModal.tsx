import { type PracticePlayer } from '@/types/practice';

interface PairStatsModalProps {
  isOpen: boolean;
  players: PracticePlayer[];
  pairCounts: Map<string, number>;
  onClose: () => void;
}

export function PairStatsModal({
  isOpen,
  players,
  pairCounts,
  onClose,
}: PairStatsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">ペア統計</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          {/* Generate all possible pairs */}
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-auto">
            {(() => {
              const sortedPlayers = [...players].sort(
                (a, b) => a.playerNumber - b.playerNumber
              );
              const allPairs = [];

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

              // Sort by count descending, then by player numbers for consistency
              allPairs.sort((a, b) => {
                if (b.count !== a.count) return b.count - a.count;
                if (a.player1!.playerNumber !== b.player1!.playerNumber) {
                  return a.player1!.playerNumber - b.player1!.playerNumber;
                }
                return a.player2!.playerNumber - b.player2!.playerNumber;
              });

              if (allPairs.length === 0) {
                return (
                  <div className="col-span-2 text-center text-gray-500 py-8">
                    参加者が不足しています
                  </div>
                );
              }

              return allPairs.map(({ key, player1, player2, count }) => (
                <div
                  key={key}
                  className={`flex items-center justify-between p-2 rounded border text-xs ${
                    count > 0
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span
                      className={`inline-flex items-center justify-center w-4 h-4 text-xs font-semibold text-white rounded-full ${
                        count > 0 ? 'bg-blue-600' : 'bg-gray-400'
                      }`}
                    >
                      {player1!.playerNumber}
                    </span>
                    <span className="text-xs text-gray-500">×</span>
                    <span
                      className={`inline-flex items-center justify-center w-4 h-4 text-xs font-semibold text-white rounded-full ${
                        count > 0 ? 'bg-blue-600' : 'bg-gray-400'
                      }`}
                    >
                      {player2!.playerNumber}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      count > 0 ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {count}
                  </span>
                </div>
              ));
            })()}
          </div>

          <div className="flex gap-3 pt-4 mt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}