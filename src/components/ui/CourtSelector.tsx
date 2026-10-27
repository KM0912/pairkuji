import { Button } from '@/components/ui/button';
import { MAX_COURTS } from '@/lib/constants';

interface CourtSelectorProps {
  courts: number;
  setCourts: (courts: number) => void;
  maxCourts?: number;
  className?: string;
}

export function CourtSelector({
  courts,
  setCourts,
  maxCourts = MAX_COURTS,
  className = '',
}: CourtSelectorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setCourts(Math.max(1, courts - 1))}
        className={
          'min-h-11 min-w-11 rounded-full bg-card hover:bg-muted shadow-level-1 border-border flex items-center justify-center'
        }
        aria-label="コート数を減らす"
      >
        <span className={'text-caption font-bold text-foreground'}>−</span>
      </Button>
      <div className="flex-1 text-center">
        <div className={'font-heading text-title font-bold text-foreground'}>{courts}</div>
        <div className="text-small text-muted-foreground">コート</div>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          if (courts >= maxCourts) return;
          setCourts(Math.min(maxCourts, courts + 1));
        }}
        disabled={courts >= maxCourts}
        className={
          'min-h-11 min-w-11 rounded-full bg-card hover:bg-muted shadow-level-1 border-border flex items-center justify-center'
        }
        aria-label="コート数を増やす"
      >
        <span className={'text-caption font-bold text-foreground'}>＋</span>
      </Button>
    </div>
  );
}
