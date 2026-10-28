import { useEffect } from 'react';
import { type Member } from '@/types/member';
import { type PracticePlayer } from '@/types/practice';
import { type Round } from '@/types/round';
import { X, Shuffle } from 'lucide-react';
import { PlayerNumber } from '../ui/PlayerNumber';
import { Button } from '../ui/button';
import {
  GENERATING_LABEL,
  NEXT_BREAK_ONCE,
  NEXT_EARLY,
  WAITING_THIS_ROUND,
  courtLabel,
} from '@/lib/practiceLabels';

interface FullscreenDisplayProps {
  round: Round;
  players: PracticePlayer[];
  memberMap: Map<number, Member>;
  playerMap: Map<number, PracticePlayer>;
  roundNumber: number;
  onClose: () => void;
  onGenerateNextRound: () => Promise<void>;
  generateBlockedReason?: string | null;
  isGenerating?: boolean;
  toast?: { message: string; canUndo: boolean } | null;
  onUndo?: () => void;
}

export function FullscreenDisplay({
  round,
  players,
  memberMap,
  playerMap,
  roundNumber,
  onClose,
  onGenerateNextRound,
  generateBlockedReason,
  isGenerating = false,
  toast,
  onUndo,
}: FullscreenDisplayProps) {
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

  useEffect(() => {
    const root = document.documentElement;
    void root.requestFullscreen?.().catch(() => {
      // フルスクリーンにできない端末では、この画面の拡大表示だけ使う
    });
    return () => {
      if (document.fullscreenElement) {
        void document.exitFullscreen?.().catch(() => {});
      }
    };
  }, []);

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
    return players
      .filter(
        (player) =>
          player.status === 'active' && !playersInCourts.includes(player.memberId)
      )
      .map((player) => player.memberId);
  };

  const restingPlayers = getRestingPlayers();
  const breakPlayers = players.filter(
    (player) => player.status === 'rest' && player.restKind === 'break'
  );
  const earlyPlayers = players.filter(
    (player) => player.status === 'rest' && player.restKind !== 'break'
  );

  const renderPlayer = (id: number) => {
    const member = memberMap.get(id);
    const player = playerMap.get(id);
    const name = member?.name ?? '???';
    const number = player?.playerNumber ?? '?';
    const nextOut =
      player?.status === 'rest'
        ? player.restKind === 'break'
          ? NEXT_BREAK_ONCE
          : NEXT_EARLY
        : null;
    return (
      <div
        key={id}
        className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-md border border-primary/30 bg-card p-2 landscape:min-h-[72px] landscape:gap-3 landscape:p-3"
        aria-label={`番号${number}、${name}${nextOut ? `、${nextOut}` : ''}`}
      >
        <PlayerNumber number={number} variant="primary" size="lg" className="landscape:min-h-14 landscape:min-w-14 landscape:text-2xl" />
        <div className="min-w-0 flex-1">
          <div
            className="whitespace-normal break-words text-left text-xl font-bold text-foreground landscape:truncate landscape:text-3xl"
            title={name}
          >
            {name}
          </div>
          {nextOut && (
            <div className="text-sm font-semibold text-amber-800">{nextOut}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="px-safe-screen fixed inset-0 z-modal overflow-auto bg-background">
      <div className="sticky top-0 z-sticky border-b border-border bg-background/95 px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-title font-bold text-foreground">
            🏸 第{roundNumber}ラウンド
          </h1>
          <button
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 transition-colors hover:bg-muted"
            aria-label="掲示を閉じる"
          >
            <X className="h-4 w-4" />
            <span className="text-xs">閉じる</span>
          </button>
        </div>
      </div>

      <div className="p-2 pb-40 landscape:p-3 landscape:pb-52">
        <div className="grid grid-cols-1 gap-2 landscape:grid-cols-2 landscape:gap-3">
          {round.courts.map((court) => (
            <div
              key={court.courtNo}
              className="rounded-lg border border-border bg-card p-2 landscape:p-3"
            >
              <div className="mb-1 text-center landscape:mb-3">
                <h2 className="font-heading text-title font-bold text-foreground">
                  {courtLabel(court.courtNo)}
                </h2>
              </div>
              <div className="flex flex-col gap-2 landscape:flex-row">
                <div className="min-w-0 flex-1 rounded-md border border-primary/40 bg-primary/5 p-2">
                  <div className="mb-1 text-xs font-semibold text-muted-foreground">ペアA</div>
                  <div className="space-y-1 landscape:space-y-2">{court.pairA.map(renderPlayer)}</div>
                </div>
                <div className="min-w-0 flex-1 rounded-md border border-primary/40 bg-primary/5 p-2">
                  <div className="mb-1 text-xs font-semibold text-muted-foreground">ペアB</div>
                  <div className="space-y-1 landscape:space-y-2">{court.pairB.map(renderPlayer)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {restingPlayers.length > 0 && (
          <div className="mt-3 rounded-lg border border-border bg-muted p-3">
            <h3 className="mb-2 text-lg font-bold text-foreground">{WAITING_THIS_ROUND}</h3>
            <div className="flex flex-wrap gap-1.5">
              {restingPlayers.map((id) => {
                const member = memberMap.get(id);
                const player = playerMap.get(id);
                const name = member?.name ?? '???';
                const number = player?.playerNumber ?? '?';
                return (
                  <div
                    key={id}
                    className="flex min-h-[52px] items-center gap-2 rounded-full border border-border bg-card px-3 py-2"
                    aria-label={`番号${number}、${name}`}
                  >
                    <PlayerNumber number={number} variant="neutral" size="lg" />
                    <div
                      className="max-w-[180px] truncate text-xl font-bold text-foreground landscape:text-2xl"
                      title={name}
                    >
                      {name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {breakPlayers.length > 0 && (
          <div className="mt-3 rounded-lg border border-border bg-muted p-3">
            <h3 className="mb-2 text-lg font-bold text-foreground">{NEXT_BREAK_ONCE}</h3>
            <div className="flex flex-wrap gap-2">
              {breakPlayers.map((player) => {
                const member = memberMap.get(player.memberId);
                const name = member?.name ?? '???';
                return (
                  <span
                    key={player.memberId}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2"
                  >
                    <PlayerNumber number={player.playerNumber} variant="neutral" size="lg" />
                    <span className="max-w-[180px] truncate text-xl font-bold text-foreground">
                      {name}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {earlyPlayers.length > 0 && (
          <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/40 p-3">
            <h3 className="mb-2 text-lg font-bold text-foreground">早退</h3>
            <div className="flex flex-wrap gap-2">
              {earlyPlayers.map((player) => {
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
                    <span className="max-w-[180px] truncate text-xl font-bold text-muted-foreground">
                      {name}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="pb-safe-bar fixed bottom-0 left-0 right-0 z-sticky space-y-2 border-t border-border bg-background/95 pl-[calc(0.5rem+var(--safe-left))] pr-[calc(0.5rem+var(--safe-right))] pt-2">
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-foreground px-3 py-2 text-xs text-background shadow-level-3"
          >
            <span>{toast.message}</span>
            {toast.canUndo && onUndo && (
              <button
                type="button"
                className="inline-flex min-h-11 shrink-0 items-center px-2 font-semibold underline"
                onClick={onUndo}
              >
                元に戻す
              </button>
            )}
          </div>
        )}
        {generateBlockedReason && (
          <p role="status" className="text-center text-xs text-amber-900">
            {generateBlockedReason}
          </p>
        )}
        <Button
          variant="default"
          onClick={onGenerateNextRound}
          className="w-full"
          disabled={isGenerating || generateBlockedReason != null}
          aria-busy={isGenerating}
        >
          <span className="inline-flex items-center gap-2">
            <Shuffle className="h-4 w-4" />
            {isGenerating ? GENERATING_LABEL : '次の組み合わせを生成'}
          </span>
        </Button>
      </div>
    </div>
  );
}
