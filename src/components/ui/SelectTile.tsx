import React from 'react';

interface SelectTileProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  left?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

const baseClasses =
  'flex items-center gap-2 rounded-lg border transition-all duration-fast ease-out-expo active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20';

const sizeMap = {
  sm: 'px-3 py-2 min-h-[44px] text-sm',
  md: 'px-4 py-3 min-h-[48px] text-sm',
} as const;

const selectedClasses =
  'bg-primary/10 border-primary text-primary shadow-level-2 ring-1 ring-primary/30';

const unselectedClasses =
  'bg-card border-border text-foreground active:bg-secondary';

export function SelectTile({
  selected = false,
  left,
  size = 'md',
  className = '',
  children,
  type: buttonType = 'button',
  ...props
}: SelectTileProps) {
  const classes = [
    baseClasses,
    sizeMap[size],
    selected ? selectedClasses : unselectedClasses,
    className,
  ]
    .join(' ')
    .trim();

  return (
    <button
      type={buttonType}
      aria-pressed={selected}
      {...props}
      className={classes}
    >
      {left}
      {typeof children === 'string' ? (
        <span className="font-medium truncate text-center w-full">
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
