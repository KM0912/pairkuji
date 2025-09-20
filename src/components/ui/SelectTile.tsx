import React from 'react';

interface SelectTileProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  left?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

const baseClasses =
  'flex items-center justify-center gap-1 rounded-lg border text-center transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200';

const sizeMap = {
  sm: 'px-2 py-1 min-h-[34px] text-xs',
  md: 'px-3 py-2 min-h-[44px] text-sm',
} as const;

const selectedClasses =
  'bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-200 shadow-sm';

const unselectedClasses =
  'bg-white border-slate-300 text-slate-800 active:bg-slate-100';

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
        <span className="font-medium truncate">{children}</span>
      ) : (
        children
      )}
    </button>
  );
}
