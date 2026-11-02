import type { Member } from '@/types/member';
import type { PracticePlayer, PlayerStatus } from '@/types/practice';
import { Button } from '@/components/ui/button';
import { PlayerNumber } from '@/components/ui/PlayerNumber';
import { PracticeLevelBadge } from '@/components/practice/PracticeLevelBadge';
import { practiceLevelCardClass } from '@/lib/practiceLevels';
import { cn } from '@/lib/utils';

interface ParticipantManagementProps {
  players: PracticePlayer[];
  memberMap: Map<number, Member>;
  matchCounts: Map<number, number>;
  onSetAvailability: (memberId: number, status: PlayerStatus) => Promise<void>;
  onShowAddParticipant: () => void;
}

export function ParticipantManagement({
  players,
  memberMap,
  matchCounts,
  onSetAvailability,
  onShowAddParticipant,
}: ParticipantManagementProps) {
  return (
    <div className="flex h-full flex-col">
      <p className="mb-3 text-xs text-muted-foreground">
        休憩にすると、「再開」を押すまで次の組み合わせから外れます。
      </p>
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 gap-2 pr-2 sm:grid-cols-2">
          {players
            .slice()
            .sort((a, b) => a.playerNumber - b.playerNumber)
            .map((player) => {
              const member = memberMap.get(player.memberId);
              if (!member) return null;
              const isActive = player.status === 'active';
              return (
                <div
                  key={player.memberId}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 shadow-level-1',
                    player.level ? practiceLevelCardClass(player.level) : 'border-border bg-card'
                  )}
                >
                  <PlayerNumber
                    number={player.playerNumber}
                    variant="neutral"
                    size="sm"
                  />
                  <PracticeLevelBadge level={player.level} />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate" title={member.name}>
                      {member.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {matchCounts.get(player.memberId) || 0}試合
                      {!isActive ? '・休憩中' : ''}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={isActive ? 'outline' : 'success'}
                    className="min-h-11 min-w-16 shrink-0"
                    onClick={() =>
                      void onSetAvailability(
                        player.memberId,
                        isActive ? 'rest' : 'active'
                      )
                    }
                    aria-label={
                      isActive
                        ? `${member.name}を休憩にする`
                        : `${member.name}の出場を再開`
                    }
                  >
                    {isActive ? '休憩' : '再開'}
                  </Button>
                </div>
              );
            })}
        </div>
      </div>
      <div className="mt-4 shrink-0 border-t border-border pt-4">
        <Button
          type="button"
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
