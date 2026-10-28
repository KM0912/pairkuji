import { type Member } from '@/types/member';
import { type PracticePlayer } from '@/types/practice';
import { substitutionHint } from '@/lib/practiceLabels';

interface SubstitutionHintProps {
  substituting: number | null;
  memberMap: Map<number, Member>;
  playerMap: Map<number, PracticePlayer>;
  onCancel: () => void;
}

export function SubstitutionHint({
  substituting,
  memberMap,
  playerMap,
  onCancel,
}: SubstitutionHintProps) {
  if (!substituting) return null;

  return (
    <div role="status" aria-live="polite" className="rounded-lg bg-secondary px-3 py-2 shadow-level-2">
      <div className="flex min-h-11 items-center gap-2 text-sm">
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {playerMap.get(substituting)?.playerNumber}
        </span>
        <span className="min-w-0 flex-1">{substitutionHint(memberMap.get(substituting)?.name ?? '選手')}</span>
        <button
          type="button"
          className="inline-flex min-h-11 shrink-0 items-center px-2 font-semibold underline"
          onClick={onCancel}
        >
          解除
        </button>
      </div>
      <p className="text-xs text-muted-foreground">選んだ選手の下から休憩・早退も選べます。</p>
    </div>
  );
}
