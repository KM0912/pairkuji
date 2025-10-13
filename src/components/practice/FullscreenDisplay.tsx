import { useEffect } from 'react';
import { type Member } from '@/types/member';
import { type PracticePlayer } from '@/types/practice';
import { type Round } from '@/types/round';
import { X, Shuffle } from 'lucide-react';
import { PlayerNumber } from '../ui/PlayerNumber';
import { Button } from '../ui/button';

interface FullscreenDisplayProps {
  round: Round;
  memberMap: Map<number, Member>;
  playerMap: Map<number, PracticePlayer>;
  roundNumber: number;
  substituting: number | null;
  onClose: () => void;
  onPlayerClick: (memberId: number) => Promise<void>;
  onGenerateNextRound: () => Promise<void>;
}

export function FullscreenDisplay({
  round,
  memberMap,
  playerMap,
  roundNumber,
  substituting,
  onClose,
  onPlayerClick,
  onGenerateNextRound,
}: FullscreenDisplayProps) {
  // Keep body scrollable in fullscreen
  useEffect(() => {
    return () => {
      // Only cleanup, don't prevent scrolling
    };
  }, []);

  // Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const getRestingPlayers = () => {
    const playersInCourts = round.courts.flatMap((court) => [
      ...court.pairA,
      ...court.pairB,
    ]);
    return round.rests.filter((id) => !playersInCourts.includes(id));
  };

  const restingPlayers = getRestingPlayers();

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border z-10">
        <div className="flex items-center justify-between p-3">
          <h1 className="font-bold text-foreground text-lg">
            🏸 第{roundNumber}ラウンド
          </h1>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-muted rounded-lg transition-colors"
            aria-label="フルスクリーンを閉じる"
          >
            <X className="w-3 h-3" />
            <span className="text-xs">閉じる</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="space-y-3">
          {/* Courts */}
          <div className="space-y-3">
            {round.courts.map((court) => (
              <div
                key={court.courtNo}
                className="border border-border rounded-lg p-3 bg-card"
              >
                {/* Court title */}
                <div className="text-center mb-3">
                  <h2 className="font-bold text-foreground text-lg">
                    COURT {court.courtNo}
                  </h2>
                </div>

                {/* Match */}
                <div className="flex items-stretch gap-2">
                  {/* Team A */}
                  <div className="flex-1 rounded-md border border-primary/40 bg-primary/5 p-2 min-w-0">
                    <div className="space-y-2">
                      {court.pairA.map((id) => {
                        const member = memberMap.get(id);
                        const player = playerMap.get(id);
                        const name = member?.name ?? '???';
                        const number = player?.playerNumber ?? '?';
                        return (
                          <button
                            key={id}
                          className={`flex items-center gap-1.5 bg-card border rounded-md w-full min-w-0 transition-all duration-200 active:scale-95 p-2 min-h-[36px] ${
                            substituting === id
                              ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-300'
                              : 'border-primary/30 hover:bg-primary/10 hover:border-primary/40'
                          }`}
                          onClick={() => onPlayerClick(id)}
                        >
                            <PlayerNumber
                              number={number}
                              variant="team-a"
                              size="xs"
                            />
                            <div
                              className="font-semibold text-foreground truncate text-sm"
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
                  <div className="flex-1 rounded-md border border-accent/40 bg-accent/5 p-2 min-w-0">
                    <div className="space-y-2">
                      {court.pairB.map((id) => {
                        const member = memberMap.get(id);
                        const player = playerMap.get(id);
                        const name = member?.name ?? '???';
                        const number = player?.playerNumber ?? '?';
                        return (
                          <button
                            key={id}
                          className={`flex items-center gap-1.5 bg-card border rounded-md w-full min-w-0 transition-all duration-200 active:scale-95 p-2 min-h-[36px] ${
                            substituting === id
                              ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-300'
                              : 'border-accent/30 hover:bg-accent/10 hover:border-accent/40'
                          }`}
                          onClick={() => onPlayerClick(id)}
                        >
                            <PlayerNumber
                              number={number}
                              variant="team-b"
                              size="xs"
                            />
                            <div
                              className="font-semibold text-foreground truncate text-sm"
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

          {/* Resting players */}
          {restingPlayers.length > 0 && (
            <div className="border border-border rounded-lg p-3 bg-muted">
              <h3 className="font-bold text-foreground mb-2 text-base">休憩</h3>
              <div className="flex flex-wrap gap-1.5">
                {restingPlayers.map((id) => {
                  const member = memberMap.get(id);
                  const player = playerMap.get(id);
                  const name = member?.name ?? '???';
                  const number = player?.playerNumber ?? '?';
                  return (
                    <button
                      key={id}
                      className={`flex items-center gap-1.5 bg-card border border-border rounded-full transition-all duration-200 active:scale-95 px-2.5 py-1.5 min-h-[32px] ${
                        substituting === id
                          ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-300'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => onPlayerClick(id)}
                    >
                      <PlayerNumber
                        number={number}
                        variant="neutral"
                        size="xs"
                      />
                      <div
                        className="font-semibold text-foreground truncate text-sm max-w-[100px]"
                        title={name}
                      >
                        {name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generate next round button - outside card */}
      <div className="sticky bottom-3 mx-3 mb-3">
        <Button
          variant="primary"
          onClick={onGenerateNextRound}
          className="w-full shadow-lg"
          size="sm"
        >
          <span className="inline-flex items-center gap-2">
            <Shuffle className="w-4 h-4" />
            次の組み合わせを生成
          </span>
        </Button>
      </div>
    </div>
  );
}
