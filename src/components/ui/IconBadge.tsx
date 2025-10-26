import React from 'react';
import { LucideIcon } from 'lucide-react';
import { IconType } from 'react-icons';

interface IconBadgeProps {
  icon: LucideIcon | IconType;
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles = {
  primary: 'text-primary',
  secondary: 'text-accent',
  success: 'text-primary',
  warning: 'text-amber-700',
  danger: 'text-destructive',
  neutral: 'text-muted-foreground',
};

const sizeStyles = {
  sm: 'h-6 w-6',
  md: 'h-7 w-7',
  lg: 'h-8 w-8',
};

const iconSizeStyles = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-4 w-4',
};

export function IconBadge({
  icon: Icon,
  variant = 'neutral',
  size = 'md',
  className = '',
}: IconBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center justify-center rounded-lg
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `
        .trim()
        .replace(/\s+/g, ' ')}
    >
      <Icon className={iconSizeStyles[size]} />
    </span>
  );
}
