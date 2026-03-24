import { type Member } from '@/types/member';
import { type PracticePlayer, type PracticeSettings } from '@/types/practice';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
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
    <div className="flex flex-col h-full">
      {/* 参加者一覧 - スクロール可能 */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-2">
          {players
            .sort((a, b) => a.playerNumber - b.playerNumber)
            .map((p) => {
              const m = memberMap.get(p.memberId);
              if (!m) return null;
              return (
                <div
                  key={p.memberId}
                  className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 shadow-level-1 border-border"
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <PlayerNumber
                      number={p.playerNumber}
                      variant="neutral"
                      size="sm"
                    />
                    <span className="truncate">{m.name}</span>
                    <span className="text-small text-muted-foreground flex-shrink-0">
                      {matchCounts.get(p.memberId) || 0}試合
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={p.status === 'active' ? 'success' : 'outline'}
                    className={cn(
                      'shrink-0 min-w-[4.25rem]',
                      p.status === 'rest' && 'text-muted-foreground'
                    )}
                    onClick={() => void toggleStatus(p.memberId)}
                    aria-label={`${m.name}のステータスを切り替え`}
                  >
                    {p.status === 'active' ? '出場可' : '休憩'}
                  </Button>
                </div>
              );
            })}
        </div>
      </div>

      {/* フッター: 参加者追加ボタン */}
      <div className="flex-shrink-0 border-t border-border pt-4 mt-4">
        <Button
          variant="default"
          onClick={onShowAddParticipant}
          className="w-full"
        >
          + 参加者を追加
        </Button>
      </div>
    </div>
  );
}
