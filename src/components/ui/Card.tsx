import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'interactive' | 'highlighted';
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  onClick,
  variant = 'default',
}) => {
  const baseClasses = 'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden';
  
  const variantClasses = {
    default: '',
    interactive: 'hover:shadow-md hover:border-gray-300 cursor-pointer transition-all duration-200',
    highlighted: 'ring-2 ring-blue-500 border-blue-200',
  };
  
  const clickableProps = onClick ? {
    onClick,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
    tabIndex: 0,
    role: 'button',
    'aria-label': title || 'カード',
  } : {};
  
  const allClasses = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();
  
  return (
    <div className={allClasses} {...clickableProps}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 bg-gray-50 ${className}`}>
      {children}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`px-6 py-4 border-t border-gray-200 bg-gray-50 ${className}`}>
      {children}
    </div>
  );
};