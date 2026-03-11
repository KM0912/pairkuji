interface ClubFilterProps {
  tags: string[];
  value: string | null;
  onChange: (tag: string | null) => void;
}

export function ClubFilter({ tags, value, onChange }: ClubFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
      <button
        onClick={() => onChange(null)}
        className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all duration-fast shrink-0 ${
          value === null
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
        }`}
      >
        すべて
      </button>
      {tags.map((tag) => {
        const isSelected = value === tag;
        return (
          <button
            key={tag}
            onClick={() => onChange(tag)}
            className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all duration-fast shrink-0 ${
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
            }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
