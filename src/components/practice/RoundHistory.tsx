import { X, History, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayerNumber } from '@/components/ui/PlayerNumber';
import type { Round } from '@/types/round';
import type { Member } from '@/types/member';

interface RoundHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  rounds: Round[];
  memberMap: Map<number, Member>;
}

export function RoundHistory({
  isOpen,
  onClose,
  rounds,
  memberMap,
}: RoundHistoryProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-4xl max-h-[85vh] rounded-2xl bg-card shadow-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              ラウンド履歴
            </h2>
            <span className="text-sm text-muted-foreground">
              ({rounds.length}ラウンド)
            </span>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={onClose}
            className="w-auto px-2 py-1 text-muted-foreground hover:text-foreground shadow-none hover:shadow-none border-transparent"
            aria-label="閉じる"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="overflow-auto max-h-[70vh] px-5 py-4">
          {rounds.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <History className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                まだラウンドがありません
              </h3>
              <p className="text-sm text-muted-foreground">
                組み合わせを生成すると履歴が表示されます
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {rounds.map((round) => (
                <div
                  key={round.roundNo}
                  className="bg-secondary rounded-xl p-4 border border-border"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      ラウンド {round.roundNo}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      ({round.courts.length}コート, 休憩{round.rests.length}名)
                    </span>
                  </div>

                  {/* コート一覧 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {round.courts.map((court) => (
                      <div
                        key={court.courtNo}
                        className="bg-card rounded-lg p-3 border border-border"
                      >
                        <div className="text-sm font-medium text-foreground mb-2">
                          コート {court.courtNo}
                        </div>
                        <div className="space-y-2">
                          {/* ペアA */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-8">
                              ペアA
                            </span>
                            <div className="flex items-center gap-1">
                              {court.pairA.map((memberId) => {
                                const member = memberMap.get(memberId);
                                return (
                                  <div
                                    key={memberId}
                                    className="flex items-center gap-1"
                                  >
                                    <PlayerNumber
                                      number={memberId}
                                      variant="neutral"
                                      size="sm"
                                    />
                                    <span className="text-sm text-foreground">
                                      {member?.name || `ID:${memberId}`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          {/* VS */}
                          <div className="text-center text-xs text-muted-foreground font-medium">
                            VS
                          </div>
                          {/* ペアB */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-8">
                              ペアB
                            </span>
                            <div className="flex items-center gap-1">
                              {court.pairB.map((memberId) => {
                                const member = memberMap.get(memberId);
                                return (
                                  <div
                                    key={memberId}
                                    className="flex items-center gap-1"
                                  >
                                    <PlayerNumber
                                      number={memberId}
                                      variant="neutral"
                                      size="sm"
                                    />
                                    <span className="text-sm text-foreground">
                                      {member?.name || `ID:${memberId}`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 休憩者 */}
                  {round.rests.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700">
                          休憩 ({round.rests.length}名)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {round.rests.map((memberId) => {
                          const member = memberMap.get(memberId);
                          return (
                            <div
                              key={memberId}
                              className="flex items-center gap-1"
                            >
                              <PlayerNumber
                                number={memberId}
                                variant="neutral"
                                size="sm"
                              />
                              <span className="text-sm text-amber-700">
                                {member?.name || `ID:${memberId}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
