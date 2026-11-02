import type { PracticeLevel } from '@/types/practice';
import {
  PRACTICE_LEVELS,
  PRACTICE_LEVEL_LABELS,
  PRACTICE_LEVEL_CLASSES,
  practiceLevelLabel,
} from '@/lib/practiceLevels';
import { cn } from '@/lib/utils';

export function PracticeLevelBadge({
  level,
  className,
}: {
  level?: PracticeLevel;
  className?: string;
}) {
  if (!level) return null;
  return (
    <span
      className={cn(
        'practice-level-badge inline-flex min-w-5 shrink-0 items-center justify-center rounded px-1 py-0.5 text-xs font-bold leading-none',
        PRACTICE_LEVEL_CLASSES[level],
        className
      )}
      aria-label={practiceLevelLabel(level)}
    >
      {level}
    </span>
  );
}

export function PracticeLevelLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground" aria-label="今日のレベルの目安">
      {PRACTICE_LEVELS.map((level) => (
        <span key={level} className="inline-flex items-center gap-1">
          <PracticeLevelBadge level={level} />
          <span>{PRACTICE_LEVEL_LABELS[level]}</span>
        </span>
      ))}
    </div>
  );
}
