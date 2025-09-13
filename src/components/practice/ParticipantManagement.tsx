import { type Member } from '@/types/member';
import { type PracticePlayer, type PracticeSettings } from '@/types/practice';

interface ParticipantManagementProps {
  settings: PracticeSettings;
  players: PracticePlayer[];
  memberMap: Map<number, Member>;
  matchCounts: Map<number, number>;
  updateCourts: (courts: number) => void;
  toggleStatus: (memberId: number) => Promise<void>;
  onShowAddParticipant: () => void;
}

export function ParticipantManagement({
  settings,
  players,
  memberMap,
  matchCounts,
  updateCourts,
  toggleStatus,
  onShowAddParticipant,
}: ParticipantManagementProps) {
  return (
    <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-700">
          コート数:
          <select
            value={settings.courts}
            onChange={(e) => updateCourts(Number(e.target.value))}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold min-h-[40px] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="text-gray-700">
          ラウンド: <strong>{settings.currentRound}</strong>
        </div>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {players
            .sort((a, b) => a.playerNumber - b.playerNumber)
            .map((p) => {
              const m = memberMap.get(p.memberId);
              if (!m) return null;
              return (
                <div
                  key={p.memberId}
                  className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 shadow-sm"
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold text-white bg-blue-600 rounded-full">
                      {p.playerNumber}
                    </span>
                    <span className="truncate">{m.name}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {matchCounts.get(p.memberId) || 0}試合
                    </span>
                  </div>
                  <button
                    className={`text-sm px-3 py-1 rounded-full border-2 transition flex-shrink-0 font-medium ${
                      p.status === 'active'
                        ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-400 text-emerald-700 hover:from-emerald-100 hover:to-green-100 shadow-sm'
                        : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300 text-orange-600 hover:from-orange-100 hover:to-amber-100 shadow-sm'
                    }`}
                    onClick={() => toggleStatus(p.memberId)}
                  >
                    {p.status === 'active' ? '出場可' : '休憩'}
                  </button>
                </div>
              );
            })}
        </div>

        {/* Add participant button */}
        <div className="flex justify-center pt-2">
          <button
            className="text-sm text-emerald-600 hover:text-emerald-700 border border-emerald-300 hover:border-emerald-400 px-6 py-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors min-h-[48px] font-medium"
            onClick={onShowAddParticipant}
          >
            + 参加者を追加
          </button>
        </div>
      </div>
    </section>
  );
}