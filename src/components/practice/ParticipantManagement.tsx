import { type Member } from '@/types/member';
import { type PracticePlayer, type PracticeSettings } from '@/types/practice';
import { Button } from '../ui/button';
import { PlayerNumber } from '../ui/PlayerNumber';

interface ParticipantManagementProps {
  settings: PracticeSettings;
  players: PracticePlayer[];
  memberMap: Map<number, Member>;
  matchCounts: Map<number, number>;
  updateCourts: (courts: number) => void;
  onSetAvailability: (
    memberId: number,
    mode: 'active' | 'break' | 'early'
  ) => Promise<void>;
  onShowAddParticipant: () => void;
}

export function ParticipantManagement({
  settings,
  players,
  memberMap,
  matchCounts,
  updateCourts,
  onSetAvailability,
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
                  <div className="flex shrink-0 gap-1">
                    {p.status === 'active' ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="min-h-11 px-2"
                          onClick={() => void onSetAvailability(p.memberId, 'break')}
                          aria-label={`${m.name}を次の1ラウンドだけ休憩にする`}
                        >
                          休憩
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="min-h-11 px-2"
                          onClick={() => void onSetAvailability(p.memberId, 'early')}
                          aria-label={`${m.name}を早退にする`}
                        >
                          早退
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="success"
                        className="min-h-11"
                        onClick={() => void onSetAvailability(p.memberId, 'active')}
                        aria-label={`${m.name}を出場に戻す`}
                      >
                        {p.restKind === 'break' ? '休憩を戻す' : '早退を戻す'}
                      </Button>
                    )}
                  </div>
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
