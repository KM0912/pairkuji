import { Button } from '@/components/ui/button';

interface CourtSelectorProps {
  courts: number;
  setCourts: (courts: number) => void;
  maxCourts?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function CourtSelector({
  courts,
  setCourts,
  maxCourts = 10,
  className = '',
}: CourtSelectorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        type="button"
        size="sm"
        variant="default"
        onClick={() => setCourts(Math.max(1, courts - 1))}
        className={
          'rounded-full bg-card hover:bg-muted shadow-sm border-border flex items-center justify-center'
        }
        aria-label="コート数を減らす"
      >
        <span className={'text-sm font-bold text-foreground'}>−</span>
      </Button>
      <div className="flex-1 text-center">
        <div className={'text-lg font-bold text-foreground'}>{courts}</div>
        <div className="text-xs text-muted-foreground">コート</div>
      </div>
      <Button
        type="button"
        size="sm"
        variant="default"
        onClick={() => setCourts(Math.min(maxCourts, courts + 1))}
        className={
          'rounded-full bg-card hover:bg-muted shadow-sm border-border flex items-center justify-center'
        }
        aria-label="コート数を増やす"
      >
        <span className={'text-sm font-bold text-foreground'}>＋</span>
      </Button>
    </div>
  );
}
