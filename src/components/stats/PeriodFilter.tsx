import {
  type PeriodFilterType,
  PERIOD_FILTER_LABELS,
} from '@/lib/statsCalculator';

interface PeriodFilterProps {
  value: PeriodFilterType;
  onChange: (value: PeriodFilterType) => void;
}

const FILTER_OPTIONS: PeriodFilterType[] = [
  'current',
  'last3',
  'thisMonth',
  'all',
];

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
      {FILTER_OPTIONS.map((option) => {
        const isSelected = value === option;
        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all duration-fast shrink-0 ${
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
            }`}
          >
            {PERIOD_FILTER_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}
