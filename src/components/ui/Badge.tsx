import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const baseClasses = 'inline-flex items-center font-semibold rounded-full';
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-indigo-100 text-indigo-800',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };
  
  const allClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();
  
  return (
    <span className={allClasses}>
      {children}
    </span>
  );
};

interface StatusBadgeProps {
  status: 'active' | 'rest' | 'absent';
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const statusConfig = {
    active: { variant: 'success' as const, label: '参加中' },
    rest: { variant: 'warning' as const, label: '休憩' },
    absent: { variant: 'default' as const, label: '離席' },
  };
  
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  );
};