import { useState } from 'react';
import type { Member } from '@/types/member';
import type { PracticeLevel, PracticePlayer } from '@/types/practice';
import {
  PRACTICE_LEVELS,
  PRACTICE_LEVEL_LABELS,
  practiceLevelCardClass,
  practiceLevelLabel,
} from '@/lib/practiceLevels';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PlayerNumber } from '@/components/ui/PlayerNumber';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { PracticeLevelBadge } from '@/components/practice/PracticeLevelBadge';

interface PracticeLevelDialogProps {
  players: PracticePlayer[];
  memberMap: Map<number, Member>;
  onSetLevels: (memberIds: number[], level: PracticeLevel | null) => Promise<boolean>;
  onClose: () => void;
}

export function PracticeLevelDialog({
  players,
  memberMap,
  onSetLevels,
  onClose,
}: PracticeLevelDialogProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const orderedPlayers = [...players].sort((a, b) => a.playerNumber - b.playerNumber);
  const allSelected = selectedIds.length === players.length;

  const togglePlayer = (memberId: number) => {
    setSelectedIds((previous) => previous.includes(memberId)
      ? previous.filter((id) => id !== memberId)
      : [...previous, memberId]);
  };

  const applyLevel = async (level: PracticeLevel | null) => {
    if (isSaving || selectedIds.length === 0) return;
    setIsSaving(true);
    setError(null);
    setMessage('');
    try {
      const saved = await onSetLevels(selectedIds, level);
      if (!saved) {
        setError('レベルを保存できませんでした。もう一度お試しください。');
        return;
      }
      setMessage(level
        ? `${selectedIds.length}人を${practiceLevelLabel(level)}にしました`
        : `${selectedIds.length}人を未設定に戻しました`);
      setSelectedIds([]);
    } catch {
      setError('レベルを保存できませんでした。もう一度お試しください。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="practice-level-dialog top-1/2 flex max-h-[calc(100dvh-2rem)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl">
        <div className="practice-level-dialog-header shrink-0 border-b px-4 py-4 sm:px-5">
          <DialogTitle className="pr-6 text-base font-semibold">今日のレベル設定</DialogTitle>
          <DialogDescription className="mt-1 text-xs leading-relaxed">
            この練習会の中での目安です。選手を選び、下のレベルを押すと保存されます。
          </DialogDescription>
        </div>

        <div className="flex shrink-0 items-center justify-between px-4 sm:px-5">
          <span className="text-sm font-semibold" aria-live="polite">{selectedIds.length}人を選択中</span>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 px-2 text-xs"
            disabled={isSaving}
            onClick={() => setSelectedIds(allSelected ? [] : players.map((player) => player.memberId))}
          >
            {allSelected ? '選択を解除' : '全員を選択'}
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 sm:px-5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {orderedPlayers.map((player) => {
              const name = memberMap.get(player.memberId)?.name ?? '削除済みの選手';
              const checked = selectedIds.includes(player.memberId);
              return (
                <label
                  key={player.memberId}
                  className={cn(
                    'flex min-h-14 cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 transition-shadow focus-within:ring-2 focus-within:ring-foreground focus-within:ring-offset-2 motion-reduce:transition-none',
                    player.level ? practiceLevelCardClass(player.level) : 'border-border bg-card',
                    checked && 'ring-2 ring-inset ring-foreground',
                    isSaving && 'cursor-wait opacity-70'
                  )}
                >
                  <input
                    type="checkbox"
                    className="size-5 shrink-0 accent-primary"
                    checked={checked}
                    disabled={isSaving}
                    onChange={() => togglePlayer(player.memberId)}
                    aria-label={`番号${player.playerNumber}、${name}、${practiceLevelLabel(player.level)}`}
                  />
                  <PlayerNumber number={player.playerNumber} variant="neutral" size="xs" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium" title={name}>{name}</span>
                  <PracticeLevelBadge level={player.level} />
                  {!player.level && <span className="shrink-0 text-xs text-muted-foreground">未設定</span>}
                </label>
              );
            })}
          </div>
        </div>

        <div className="practice-level-dialog-footer flex shrink-0 flex-col gap-2 border-t bg-background px-4 pb-4 pt-3 sm:px-5" aria-busy={isSaving}>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="選んだ選手にレベルを設定">
            {PRACTICE_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                disabled={selectedIds.length === 0 || isSaving}
                onClick={() => void applyLevel(level)}
                className={cn(
                  'flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 px-2 py-2 text-sm font-semibold transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none',
                  practiceLevelCardClass(level)
                )}
                aria-label={`選んだ${selectedIds.length}人を${practiceLevelLabel(level)}にする`}
              >
                <span className="font-bold">{level}</span>
                <span>{PRACTICE_LEVEL_LABELS[level]}</span>
              </button>
            ))}
          </div>
          <div className="practice-level-dialog-status min-h-5 text-xs" role={error ? 'alert' : 'status'}>
            <span className={error ? 'text-destructive' : 'text-muted-foreground'}>
              {isSaving ? '保存中…' : error ?? message}
            </span>
          </div>
          <div className="practice-level-dialog-controls flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 flex-1 text-sm"
              disabled={selectedIds.length === 0 || isSaving}
              onClick={() => void applyLevel(null)}
            >
              未設定に戻す
            </Button>
            <Button type="button" className="min-h-11 flex-1" disabled={isSaving} onClick={onClose}>
              完了
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
