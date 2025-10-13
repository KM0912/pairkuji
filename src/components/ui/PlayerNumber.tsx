import React from 'react';

interface PlayerNumberProps {
  number: number | string;
  variant?: 'primary' | 'secondary' | 'neutral' | 'team-a' | 'team-b';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const variantStyles = {
  // メイン番号（ブランド）
  primary: 'bg-brand-primary text-white',
  // 補助番号（情報トーン）
  secondary: 'bg-state-info-bg text-state-info-fg',
  // ニュートラル（濃色ベース）
  neutral: 'bg-ink-base text-white',
  // チーム/コート識別（色と番号で識別）
  'team-a': 'bg-court-1 text-white',
  'team-b': 'bg-court-3 text-white',
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
