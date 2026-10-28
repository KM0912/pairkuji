import { type Member } from '@/types/member';
import { type PracticePlayer } from '@/types/practice';
import { substitutionHint } from '@/lib/practiceLabels';
import { AvailabilityMenu } from '@/components/practice/AvailabilityMenu';

interface SubstitutionHintProps {
  substituting: number | null;
  memberMap: Map<number, Member>;
  playerMap: Map<number, PracticePlayer>;
  onCancel: () => void;
  onBreak?: () => void;
  onEarly?: () => void;
}

export function SubstitutionHint({
  substituting,
  memberMap,
  playerMap,
  onCancel,
  onBreak,
  onEarly,
}: SubstitutionHintProps) {
  if (!substituting) return null;
  const name = memberMap.get(substituting)?.name ?? '選手';

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-lg bg-secondary px-3 py-2 shadow-level-2 [@media(max-height:500px)]:py-1 [@media(max-height:500px)_and_(min-width:640px)]:flex [@media(max-height:500px)_and_(min-width:640px)]:items-center [@media(max-height:500px)_and_(min-width:640px)]:gap-2"
    >
      <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-sm">
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {playerMap.get(substituting)?.playerNumber}
        </span>
        <span className="min-w-0 flex-1 [@media(max-height:500px)]:truncate">{substitutionHint(name)}</span>
        <button
          type="button"
          className="inline-flex min-h-11 shrink-0 items-center px-2 font-semibold underline"
          onClick={onCancel}
        >
          解除
        </button>
      </div>
      {onBreak && onEarly && (
        <AvailabilityMenu
          name={name}
          caption="休憩・早退"
          className="mt-2 w-full gap-1.5 whitespace-nowrap rounded-lg px-3 [@media(max-height:500px)_and_(min-width:640px)]:mt-0 [@media(max-height:500px)_and_(min-width:640px)]:w-auto [@media(max-height:500px)_and_(min-width:640px)]:shrink-0"
          onBreak={onBreak}
          onEarly={onEarly}
        />
      )}
    </div>
  );
}
