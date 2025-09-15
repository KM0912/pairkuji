import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'default';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantStyles = {
  primary:
    'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-400',
  secondary:
    'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 hover:from-blue-200 hover:to-blue-300 disabled:from-slate-300 disabled:to-slate-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400',
  default:
    'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900',
};

const sizeStyles = {
  sm: 'py-2 px-3 text-sm min-h-[36px]',
  md: 'py-3 px-4 text-base min-h-[48px]',
  lg: 'py-4 px-6 text-lg min-h-[56px]',
};

export function Button({
  children,
  variant = 'default',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        w-full rounded-xl font-semibold shadow-lg hover:shadow-xl
        transition-all duration-200 border disabled:opacity-50
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${loading ? 'cursor-not-allowed' : ''}
        ${className}
      `
        .trim()
        .replace(/\s+/g, ' ')}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
