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
    <div role="status" aria-live="polite" className="fixed bottom-40 left-1/2 z-toast max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-lg bg-secondary px-4 py-2 shadow-level-3">
      <div className="flex min-h-11 items-center gap-2 text-sm">
        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-primary-foreground bg-primary rounded-full">
          {playerMap.get(substituting)?.playerNumber}
        </span>
        <span>{substitutionHint(memberMap.get(substituting)?.name ?? '選手')}</span>
        <button
          type="button"
          className="inline-flex min-h-11 shrink-0 items-center px-2 font-semibold underline"
          onClick={onCancel}
        >
          解除
        </button>
      </div>
    </div>
  );
}
