import { cn } from '@/lib/utils';

interface ClubFilterProps {
  tags: string[];
  value: string[];
  onChange: (tags: string[]) => void;
}

export function ClubFilter({ tags, value, onChange }: ClubFilterProps) {
  if (tags.length === 0) return null;

  const toggleTag = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else {
      onChange([...value, tag]);
    }
  };

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
      <button
        type="button"
        aria-pressed={value.length === 0}
        onClick={() => onChange([])}
        className={cn(
          'inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all duration-fast shrink-0',
          value.length === 0
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
        )}
      >
        すべて
      </button>
      {tags.map((tag) => {
        const isSelected = value.includes(tag);
        return (
          <button
            type="button"
            key={tag}
            aria-pressed={isSelected}
            onClick={() => toggleTag(tag)}
            className={cn(
              'inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all duration-fast shrink-0',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
            )}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
