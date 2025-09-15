import { type Member } from '@/types/member';
import { type PracticePlayer, type PracticeSettings } from '@/types/practice';
import { Button } from '../ui/Button';
import { PlayerNumber } from '../ui/PlayerNumber';

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
                  <PlayerNumber
                    number={p.playerNumber}
                    variant="primary"
                    size="sm"
                  />
                  <span className="truncate">{m.name}</span>
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {matchCounts.get(p.memberId) || 0}試合
                  </span>
                </div>
                <button
                  className={`text-sm px-3 py-1 rounded-full border-2 transition flex-shrink-0 font-medium ${
                    p.status === 'active'
                      ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-400 text-emerald-700 hover:from-emerald-100 hover:to-emerald-200 shadow-sm'
                      : 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-400 text-amber-700 hover:from-amber-100 hover:to-amber-200 shadow-sm'
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
        <Button variant="secondary" onClick={onShowAddParticipant}>
          + 参加者を追加
        </Button>
      </div>
    </div>
  );
}
