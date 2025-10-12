import React from 'react';
import { gradientColors } from '../../lib/colors';

interface PlayerNumberProps {
  number: number | string;
  variant?: 'primary' | 'secondary' | 'neutral' | 'team-a' | 'team-b';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const variantStyles = {
  primary: 'bg-blue-100 text-blue-700',
  secondary: 'bg-emerald-100 text-emerald-700',
  neutral: 'bg-slate-600 text-white',
  'team-a': `${gradientColors.teamA} text-white`,
  'team-b': `${gradientColors.teamB} text-white`,
};

const sizeStyles = {
  xs: 'w-4 h-4 text-[10px]',
  sm: 'w-5 h-5 text-xs',
  md: 'w-6 h-6 text-xs',
};

export function PlayerNumber({
  number,
  variant = 'primary',
  size = 'xs',
  className = '',
}: PlayerNumberProps) {
  return (
    <span
      className={`
        inline-flex items-center justify-center rounded-full font-bold shadow-sm
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `
        .trim()
        .replace(/\s+/g, ' ')}
    >
      {number}
    </span>
  );
}
