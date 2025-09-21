import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'default';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantStyles = {
  primary:
    'bg-gradient-to-r from-blue-400 to-emerald-400 text-white hover:from-blue-500 hover:to-emerald-500 disabled:from-slate-400 disabled:to-slate-400',
  secondary:
    'bg-gradient-to-r from-emerald-50 to-blue-50 text-slate-700 hover:from-emerald-100 hover:to-blue-100 hover:text-slate-800 disabled:from-slate-100 disabled:to-slate-100 border border-emerald-200',
  danger:
    'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 disabled:from-slate-400 disabled:to-slate-400 shadow-red-500/25',
  default:
    'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300',
};

const sizeStyles = {
  sm: 'py-2 px-4 text-sm min-h-[40px]',
  md: 'py-3 px-5 text-base min-h-[52px]',
  lg: 'py-4 px-6 text-lg min-h-[60px]',
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
        rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-[0.98]
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
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
