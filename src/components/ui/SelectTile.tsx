import React from 'react';

interface SelectTileProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

const baseClasses =
  'flex items-center gap-2 rounded-lg border transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20';

const sizeMap = {
  sm: 'px-3 py-2 min-h-[44px] text-sm',
  md: 'px-4 py-3 min-h-[48px] text-sm',
} as const;

const selectedClasses =
  'bg-primary/10 border-primary text-primary shadow-md ring-1 ring-primary/30';

const unselectedClasses =
  'bg-card border-border text-foreground active:bg-secondary';

export function SelectTile({
  selected = false,
  left,
  right,
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
        <span className="font-medium truncate text-center flex-1">
          {children}
        </span>
      ) : (
        children
      )}
      {right}
    </button>
  );
}
