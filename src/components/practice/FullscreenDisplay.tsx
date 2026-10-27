import { useEffect } from 'react';
import { type CourtDisplayMode } from '@/hooks/useCourtDisplayMode';
import { type Member } from '@/types/member';
import { type PracticePlayer } from '@/types/practice';
import { type Round } from '@/types/round';
import { X, Shuffle } from 'lucide-react';
import { PlayerNumber } from '../ui/PlayerNumber';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface FullscreenDisplayProps {
  round: Round;
  players: PracticePlayer[];
  memberMap: Map<number, Member>;
  playerMap: Map<number, PracticePlayer>;
  roundNumber: number;
  substituting: number | null;
  onClose: () => void;
  onPlayerClick: (memberId: number) => Promise<void>;
  onGenerateNextRound: () => Promise<void>;
  courtDisplayMode?: CourtDisplayMode;
}

export function FullscreenDisplay({
  round,
  players,
  memberMap,
  playerMap,
  roundNumber,
  substituting,
  onClose,
  onPlayerClick,
  onGenerateNextRound,
  courtDisplayMode = 'normal',
}: FullscreenDisplayProps) {
  const numberEmphasis = courtDisplayMode === 'numberEmphasis';
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const requestLock = async () => {
      if (!('wakeLock' in navigator)) return;
      try {
        const next = await navigator.wakeLock.request('screen');
        if (cancelled) {
          await next.release();
          return;
        }
        lock = next;
      } catch {
        // 画面のスリープ防止が使えない環境では掲示だけ続ける
      }
    };

    void requestLock();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void requestLock();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release();
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
  const shownIds = new Set<number>([
    ...round.courts.flatMap((court) => [...court.pairA, ...court.pairB]),
    ...restingPlayers,
  ]);
  const manualRestPlayers = players.filter(
    (player) => player.status === 'rest' && !shownIds.has(player.memberId)
  );

  return (
    <div className="fixed inset-0 z-modal bg-background overflow-auto">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border z-10">
        <div className="flex items-center justify-between p-3">
          <h1 className="font-heading font-bold text-foreground text-title">
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
                  <h2 className="font-heading font-bold text-foreground text-title">
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
                            type="button"
                            className={cn(
                              'bg-card border rounded-md w-full min-w-0 transition-all duration-fast active:scale-[0.97]',
                              'flex items-center gap-2 p-2 min-h-[64px]',
                              substituting === id
                                ? 'border-warning bg-warning/10 ring-2 ring-warning/30'
                                : 'border-primary/30 hover:bg-primary/10 hover:border-primary/40'
                            )}
                            onClick={() => onPlayerClick(id)}
                            title={numberEmphasis ? name : undefined}
                            aria-label={`番号${number}、${name}を選択して入れ替え`}
                          >
                            <PlayerNumber
                              number={number}
                              variant="primary"
                              size="xl"
                            />
                            <div
                              className="min-w-0 flex-1 truncate text-left text-lg font-bold text-foreground"
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
                  <div className="flex-1 rounded-md border border-primary/40 bg-primary/5 p-2 min-w-0">
                    <div className="space-y-2">
                      {court.pairB.map((id) => {
                        const member = memberMap.get(id);
                        const player = playerMap.get(id);
                        const name = member?.name ?? '???';
                        const number = player?.playerNumber ?? '?';
                        return (
                          <button
                            key={id}
                            type="button"
                            className={cn(
                              'bg-card border rounded-md w-full min-w-0 transition-all duration-fast active:scale-[0.97]',
                              'flex items-center gap-2 p-2 min-h-[64px]',
                              substituting === id
                                ? 'border-warning bg-warning/10 ring-2 ring-warning/30'
                                : 'border-primary/30 hover:bg-primary/10 hover:border-primary/40'
                            )}
                            onClick={() => onPlayerClick(id)}
                            title={numberEmphasis ? name : undefined}
                            aria-label={`番号${number}、${name}を選択して入れ替え`}
                          >
                            <PlayerNumber
                              number={number}
                              variant="primary"
                              size="xl"
                            />
                            <div
                              className="min-w-0 flex-1 truncate text-left text-lg font-bold text-foreground"
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
              <h3 className="font-bold text-foreground mb-2 text-lg">休憩</h3>
              <div className="flex flex-wrap gap-1.5">
                {restingPlayers.map((id) => {
                  const member = memberMap.get(id);
                  const player = playerMap.get(id);
                  const name = member?.name ?? '???';
                  const number = player?.playerNumber ?? '?';
                  return (
                    <button
                      key={id}
                      type="button"
                      className={cn(
                        'bg-card border border-border rounded-full transition-all duration-fast active:scale-[0.97]',
                        'flex items-center gap-2 px-3 py-2 min-h-[52px]',
                        substituting === id
                          ? 'border-warning bg-warning/10 ring-2 ring-warning/30'
                          : 'hover:bg-muted'
                      )}
                      onClick={() => onPlayerClick(id)}
                      title={numberEmphasis ? name : undefined}
                      aria-label={`番号${number}、${name}を選択して入れ替え`}
                    >
                      <PlayerNumber
                        number={number}
                        variant="neutral"
                            size="lg"
                      />
                      <div
                        className="max-w-[140px] truncate text-base font-bold text-foreground"
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

          {manualRestPlayers.length > 0 && (
            <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3 opacity-70">
              <h3 className="mb-2 text-lg font-bold text-foreground">お休み中</h3>
              <div className="flex flex-wrap gap-2">
                {manualRestPlayers.map((player) => {
                  const member = memberMap.get(player.memberId);
                  const name = member?.name ?? '???';
                  return (
                    <span
                      key={player.memberId}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2"
                    >
                      <PlayerNumber
                        number={player.playerNumber}
                        variant="neutral"
                        size="lg"
                      />
                      <span className="max-w-[140px] truncate text-base font-bold text-muted-foreground">
                        {name}
                      </span>
                    </span>
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
          variant="default"
          onClick={onGenerateNextRound}
          className="w-full"
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
