import { type CourtDisplayMode } from '@/hooks/useCourtDisplayMode';
import { type Member } from '@/types/member';
import { type PracticePlayer } from '@/types/practice';
import { type Round, type MatchResult } from '@/types/round';
import { PiCourtBasketball } from 'react-icons/pi';
import { IconBadge } from '../ui/IconBadge';
import { PlayerNumber } from '../ui/PlayerNumber';
import { Swords, Trophy, Users } from 'lucide-react';
import { AvailabilityMenu } from './AvailabilityMenu';
import { cn } from '@/lib/utils';
import {
  NEXT_BREAK_ONCE,
  NEXT_EARLY,
  WAITING_THIS_ROUND,
  courtLabel,
} from '@/lib/practiceLabels';

function MatchCountIndicator({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-small font-semibold leading-none tabular-nums text-muted-foreground',
        className
      )}
      aria-hidden="true"
    >
      <Swords className="size-3" />
      <span>{count}</span>
    </span>
  );
}

function nextOutLabel(player: PracticePlayer | undefined): string | null {
  if (!player || player.status !== 'rest') return null;
  return player.restKind === 'break' ? NEXT_BREAK_ONCE : NEXT_EARLY;
}

function pairNumbers(
  ids: readonly number[],
  playerMap: Map<number, PracticePlayer>
): string {
  return ids
    .map((id) => String(playerMap.get(id)?.playerNumber ?? '?'))
    .join('・');
}

function PairCountIndicator({
  pair,
  pairCounts,
}: {
  pair: [number, number];
  pairCounts: Map<string, number>;
}) {
  const key = `${Math.min(...pair)}-${Math.max(...pair)}`;
  const count = pairCounts.get(key) ?? 0;

  return (
    <div
      className="mb-2 flex items-center justify-center gap-1 whitespace-nowrap text-small font-semibold tabular-nums text-muted-foreground"
      title="今回の練習で、現在のラウンドを含めてこのペアを組んだ回数"
    >
      <Users className="size-3.5 shrink-0" aria-hidden="true" />
      <span>ペア {count}回目</span>
    </div>
  );
}

interface CourtManagementProps {
  players: PracticePlayer[];
  latestRound: Round | undefined;
  memberMap: Map<number, Member>;
  playerMap: Map<number, PracticePlayer>;
  matchCounts: Map<number, number>;
  pairCounts: Map<string, number>;
  substituting: number | null;
  onPlayerClick: (memberId: number) => Promise<void>;
  onRecordResult?: (
    roundNo: number,
    courtNo: number,
    result: MatchResult
  ) => Promise<void>;
  onToggleStatus?: (memberId: number) => Promise<void>;
  /** 待機の選手を、入れ替えとは別に休憩・早退へ移す */
  onSetAvailability?: (
    memberId: number,
    mode: 'break' | 'early'
  ) => Promise<void>;
  /** 番号を大きく表示し名前を隠す（投影・遠視用） */
  courtDisplayMode?: CourtDisplayMode;
}

export function CourtManagement({
  players,
  latestRound,
  memberMap,
  playerMap,
  matchCounts,
  pairCounts,
  substituting,
  onPlayerClick,
  onRecordResult,
  onToggleStatus,
  onSetAvailability,
  courtDisplayMode = 'normal',
}: CourtManagementProps) {
  const numberEmphasis = courtDisplayMode === 'numberEmphasis';
  const handleResultClick = (
    roundNo: number,
    courtNo: number,
    currentResult: MatchResult | undefined,
    side: 'pairA' | 'pairB'
  ) => {
    if (!onRecordResult) return;
    // タップで切り替え: 同じ側を再タップ → 結果未入力に戻す
    const newResult: MatchResult = currentResult === side ? null : side;
    onRecordResult(roundNo, courtNo, newResult);
  };

  return (
    <section>
      {latestRound ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {latestRound.courts.map((cm) => (
              <div
                key={cm.courtNo}
                className="py-3 px-3 rounded-xl border-2 bg-gradient-to-br from-card to-card/50 border-primary/20 shadow-level-1 hover:shadow-level-2 transition-all duration-normal ease-out-expo"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="inline-flex items-center gap-2 text-foreground font-bold">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <IconBadge
                        icon={PiCourtBasketball}
                        size="sm"
                        className="text-primary"
                      />
                    </div>
                    <span className="font-heading text-caption font-bold">
                      {courtLabel(cm.courtNo)}
                    </span>
                  </div>
                  {cm.result != null && (
                    <span className="text-xs font-medium text-accent">
                      <Trophy className="w-3.5 h-3.5 inline-block mr-0.5" />
                      {pairNumbers(
                        cm.result === 'pairA' ? cm.pairA : cm.pairB,
                        playerMap
                      )}
                      の勝ち
                    </span>
                  )}
                </div>
                <div className="flex items-stretch gap-2">
                  {/* Team A */}
                  <div
                    className={cn(
                      'flex-1 rounded-lg border-2 p-2 min-w-0 shadow-level-1 transition-all duration-fast',
                      cm.result === 'pairA'
                        ? 'border-accent/50 bg-gradient-to-br from-accent/15 to-accent/5'
                        : 'border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5'
                    )}
                  >
                    <PairCountIndicator pair={cm.pairA} pairCounts={pairCounts} />
                    <div className="space-y-1">
                      {cm.pairA.map((id) => {
                        const member = memberMap.get(id);
                        const player = playerMap.get(id);
                        const name = member?.name ?? '???';
                        const number = player?.playerNumber ?? '?';
                        const matchCount = matchCounts.get(id) ?? 0;
                        const nextOut = nextOutLabel(player);
                        return (
                          <div key={id} className="flex flex-col gap-1">
                          <button
                            type="button"
                            className={cn(
                              'relative w-full min-w-0 rounded-lg transition-all duration-fast active:scale-[0.97] border-2',
                              numberEmphasis
                                ? 'flex items-center justify-center px-2 pb-2 pt-5 min-h-[64px]'
                                : 'flex items-center gap-1.5 px-2 py-1.5 min-h-[48px] sm:gap-2.5 sm:px-3 sm:py-2.5',
                              substituting === id
                                ? 'bg-warning/10 border-warning ring-2 ring-warning/30 shadow-level-2'
                                : 'bg-white/80 border-primary/40 hover:bg-primary/15 hover:border-primary/50 hover:shadow-level-1'
                            )}
                            onClick={() => onPlayerClick(id)}
                            title={numberEmphasis ? name : undefined}
                            aria-label={`番号${number}、${name}、${matchCount}試合${nextOut ? `、${nextOut}` : ''}。タップで入れ替え。もう一度タップで解除`}
                          >
                            <PlayerNumber
                              number={number}
                              variant="primary"
                              size={numberEmphasis ? 'lg' : 'xs'}
                            />
                            {!numberEmphasis && (
                              <div className="flex flex-1 min-w-0 flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-1.5">
                                <div
                                  className="w-full min-w-0 flex-1 truncate text-left text-caption font-semibold text-foreground"
                                  title={name}
                                >
                                  {name}
                                </div>
                                <MatchCountIndicator count={matchCount} />
                              </div>
                            )}
                            {numberEmphasis && (
                              <MatchCountIndicator
                                count={matchCount}
                                className="absolute bottom-1.5 right-1.5 shrink-0 whitespace-nowrap rounded bg-muted/90 px-1 py-0.5 text-small font-semibold leading-none tabular-nums text-muted-foreground shadow-level-1"
                              />
                            )}
                          </button>
                          {onSetAvailability && (substituting === id || nextOut) && (
                            <div className="flex items-center gap-1">
                              {nextOut && (
                                <span className="shrink-0 rounded bg-amber-100 px-1.5 py-1 text-[10px] font-semibold leading-none text-amber-900">
                                  {nextOut}
                                </span>
                              )}
                              <AvailabilityMenu
                                name={name}
                                caption="休憩・早退"
                                className="min-w-0 flex-1 rounded-lg"
                                onBreak={() => {
                                  void onSetAvailability(id, 'break');
                                }}
                                onEarly={() => {
                                  void onSetAvailability(id, 'early');
                                }}
                              />
                            </div>
                          )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Team A 勝利ボタン */}
                    {onRecordResult && (
                      <button
                        className={cn(
                          'w-full mt-2 py-1.5 rounded-md text-xs font-semibold transition-all duration-fast active:scale-[0.97] min-h-[44px]',
                          cm.result === 'pairA'
                            ? 'bg-accent text-accent-foreground shadow-level-1'
                            : 'bg-muted/80 text-muted-foreground [@media(hover:hover)]:hover:bg-accent/20 [@media(hover:hover)]:hover:text-accent border border-border/50'
                        )}
                        onClick={() =>
                          handleResultClick(
                            latestRound.roundNo,
                            cm.courtNo,
                            cm.result,
                            'pairA'
                          )
                        }
                        aria-label={
                          cm.result === 'pairA'
                            ? `${pairNumbers(cm.pairA, playerMap)}の勝ち。もう一度押すと記録を消せます`
                            : `${pairNumbers(cm.pairA, playerMap)}を勝ちにする`
                        }
                      >
                        <Trophy className="w-3.5 h-3.5 inline-block mr-1" />
                        {cm.result === 'pairA'
                          ? `${pairNumbers(cm.pairA, playerMap)}の勝ち✓`
                          : '勝ち'}
                      </button>
                    )}
                  </div>

                  {/* Team B */}
                  <div
                    className={cn(
                      'flex-1 rounded-lg border-2 p-2 min-w-0 shadow-level-1 transition-all duration-fast',
                      cm.result === 'pairB'
                        ? 'border-accent/50 bg-gradient-to-br from-accent/15 to-accent/5'
                        : 'border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5'
                    )}
                  >
                    <PairCountIndicator pair={cm.pairB} pairCounts={pairCounts} />
                    <div className="space-y-1">
                      {cm.pairB.map((id) => {
                        const member = memberMap.get(id);
                        const player = playerMap.get(id);
                        const name = member?.name ?? '???';
                        const number = player?.playerNumber ?? '?';
                        const matchCount = matchCounts.get(id) ?? 0;
                        const nextOut = nextOutLabel(player);
                        return (
                          <div key={id} className="flex flex-col gap-1">
                          <button
                            type="button"
                            className={cn(
                              'relative w-full min-w-0 rounded-lg transition-all duration-fast active:scale-[0.97] border-2',
                              numberEmphasis
                                ? 'flex items-center justify-center px-2 pb-2 pt-5 min-h-[64px]'
                                : 'flex items-center gap-1.5 px-2 py-1.5 min-h-[48px] sm:gap-2.5 sm:px-3 sm:py-2.5',
                              substituting === id
                                ? 'bg-warning/10 border-warning ring-2 ring-warning/30 shadow-level-2'
                                : 'bg-white/80 border-primary/40 hover:bg-primary/15 hover:border-primary/50 hover:shadow-level-1'
                            )}
                            onClick={() => onPlayerClick(id)}
                            title={numberEmphasis ? name : undefined}
                            aria-label={`番号${number}、${name}、${matchCount}試合${nextOut ? `、${nextOut}` : ''}。タップで入れ替え。もう一度タップで解除`}
                          >
                            <PlayerNumber
                              number={number}
                              variant="primary"
                              size={numberEmphasis ? 'lg' : 'xs'}
                            />
                            {!numberEmphasis && (
                              <div className="flex flex-1 min-w-0 flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-1.5">
                                <div
                                  className="w-full min-w-0 flex-1 truncate text-left text-caption font-semibold text-foreground"
                                  title={name}
                                >
                                  {name}
                                </div>
                                <MatchCountIndicator count={matchCount} />
                              </div>
                            )}
                            {numberEmphasis && (
                              <MatchCountIndicator
                                count={matchCount}
                                className="absolute bottom-1.5 right-1.5 shrink-0 whitespace-nowrap rounded bg-muted/90 px-1 py-0.5 text-small font-semibold leading-none tabular-nums text-muted-foreground shadow-level-1"
                              />
                            )}
                          </button>
                          {onSetAvailability && (substituting === id || nextOut) && (
                            <div className="flex items-center gap-1">
                              {nextOut && (
                                <span className="shrink-0 rounded bg-amber-100 px-1.5 py-1 text-[10px] font-semibold leading-none text-amber-900">
                                  {nextOut}
                                </span>
                              )}
                              <AvailabilityMenu
                                name={name}
                                caption="休憩・早退"
                                className="min-w-0 flex-1 rounded-lg"
                                onBreak={() => {
                                  void onSetAvailability(id, 'break');
                                }}
                                onEarly={() => {
                                  void onSetAvailability(id, 'early');
                                }}
                              />
                            </div>
                          )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Team B 勝利ボタン */}
                    {onRecordResult && (
                      <button
                        className={cn(
                          'w-full mt-2 py-1.5 rounded-md text-xs font-semibold transition-all duration-fast active:scale-[0.97] min-h-[44px]',
                          cm.result === 'pairB'
                            ? 'bg-accent text-accent-foreground shadow-level-1'
                            : 'bg-muted/80 text-muted-foreground [@media(hover:hover)]:hover:bg-accent/20 [@media(hover:hover)]:hover:text-accent border border-border/50'
                        )}
                        onClick={() =>
                          handleResultClick(
                            latestRound.roundNo,
                            cm.courtNo,
                            cm.result,
                            'pairB'
                          )
                        }
                        aria-label={
                          cm.result === 'pairB'
                            ? `${pairNumbers(cm.pairB, playerMap)}の勝ち。もう一度押すと記録を消せます`
                            : `${pairNumbers(cm.pairB, playerMap)}を勝ちにする`
                        }
                      >
                        <Trophy className="w-3.5 h-3.5 inline-block mr-1" />
                        {cm.result === 'pairB'
                          ? `${pairNumbers(cm.pairB, playerMap)}の勝ち✓`
                          : '勝ち'}
                      </button>
                    )}
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
                <div className="rounded-xl border-2 border-border/50 bg-gradient-to-br from-muted/80 to-muted/50 p-3 shadow-level-1">
                    <div className="mb-2 font-heading font-semibold text-foreground text-caption flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
                    {WAITING_THIS_ROUND}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {restingPlayers.map((id) => {
                      const member = memberMap.get(id);
                      const player = playerMap.get(id);
                      const name = member?.name ?? '???';
                      const number = player?.playerNumber ?? '?';
                      const matchCount = matchCounts.get(id) ?? 0;
                      return (
                        <div key={id} className="relative inline-flex items-stretch">
                          <button
                            type="button"
                            className={cn(
                              'relative inline-flex items-center border-2 text-caption font-medium transition-all duration-fast active:scale-[0.97] shadow-level-1',
                              numberEmphasis
                                ? 'justify-center rounded-full px-2 py-2 min-h-[48px] min-w-[48px]'
                                : 'gap-2 rounded-full px-3.5 py-2 min-h-[44px]',
                              onSetAvailability && !numberEmphasis && 'rounded-r-none',
                              substituting === id
                                ? 'bg-warning/10 border-warning text-warning-foreground ring-2 ring-warning/30 shadow-level-2'
                                : 'bg-white/90 border-border/60 text-foreground hover:bg-muted hover:border-border hover:shadow-level-2'
                            )}
                            onClick={() => {
                              void onPlayerClick(id);
                            }}
                            title={numberEmphasis ? name : undefined}
                            aria-label={`番号${number}、${name}、${matchCount}試合。タップで入れ替え。もう一度タップで解除`}
                          >
                            <PlayerNumber
                              number={number}
                              variant="neutral"
                              size={numberEmphasis ? 'lg' : 'xs'}
                            />
                            {!numberEmphasis && (
                              <>
                                <span
                                  className="truncate max-w-[100px] text-left"
                                  title={name}
                                >
                                  {name}
                                </span>
                                <MatchCountIndicator count={matchCount} />
                              </>
                            )}
                            {numberEmphasis && (
                              <MatchCountIndicator
                                count={matchCount}
                                className="absolute -bottom-1 -right-1 shrink-0 whitespace-nowrap rounded-full border border-border bg-background px-1 py-0.5 text-[10px] font-semibold leading-none tabular-nums text-muted-foreground shadow-level-1"
                              />
                            )}
                          </button>
                          {onSetAvailability && (
                            <AvailabilityMenu
                              name={name}
                              className={cn(
                                'border-border/60',
                                numberEmphasis
                                  ? 'ml-1 rounded-full'
                                  : 'rounded-r-full border-l-0'
                              )}
                              onBreak={() => {
                                void onSetAvailability(id, 'break');
                              }}
                              onEarly={() => {
                                void onSetAvailability(id, 'early');
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            );
          })()}
          {(
            [
              {
                kind: 'break' as const,
                title: NEXT_BREAK_ONCE,
                note: '次の1ラウンドだけ組み合わせから外れ、その次は戻ります。タップすると今すぐ戻せます。',
              },
              {
                kind: 'early' as const,
                title: '早退',
                note: '戻すまで、次のラウンドの組み合わせに入りません。タップすると出場に戻せます。',
              },
            ] as const
          ).map((section) => {
            const sectionPlayers = players.filter(
              (player) =>
                player.status === 'rest' &&
                (section.kind === 'break'
                  ? player.restKind === 'break'
                  : player.restKind !== 'break')
            );
            if (sectionPlayers.length === 0) return null;
            return (
              <div
                key={section.kind}
                className="rounded-xl border border-dashed border-border bg-muted/30 p-3"
              >
                <div className="mb-1 font-heading font-semibold text-foreground text-caption">
                  {section.title}
                </div>
                <p className="mb-2 text-xs text-muted-foreground">{section.note}</p>
                <div className="flex flex-wrap gap-2">
                  {sectionPlayers.map((player) => {
                    const name = memberMap.get(player.memberId)?.name ?? '???';
                    return (
                      <button
                        key={player.memberId}
                        type="button"
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5 text-caption text-muted-foreground"
                        onClick={() => void onToggleStatus?.(player.memberId)}
                        aria-label={`${name}を出場に戻す`}
                      >
                        <PlayerNumber
                          number={player.playerNumber}
                          variant="neutral"
                          size="xs"
                        />
                        <span className="max-w-[120px] truncate">{name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-muted-foreground text-caption">
          <div>
            まだ組み合わせがありません。下部のボタンで生成してください。
          </div>
        </div>
      )}
    </section>
  );
}
