import React from 'react';

interface PlayerNumberProps {
  number: number | string;
  variant?: 'primary' | 'secondary' | 'neutral';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const variantStyles = {
  // メイン番号（ブランド）
  primary: 'bg-primary text-primary-foreground',
  // 補助番号（アクセント）
  secondary: 'bg-accent text-accent-foreground',
  // ニュートラル（濃色ベース）
  neutral: 'bg-foreground text-background',
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
