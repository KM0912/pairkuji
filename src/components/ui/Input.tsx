import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  size = 'md',
  fullWidth = false,
  startIcon,
  endIcon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-lg min-h-[48px]',
    lg: 'px-6 py-4 text-xl min-h-[56px]',
  };
  
  const baseInputClasses = `
    block border rounded-lg shadow-sm transition-colors
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    disabled:bg-gray-50
  `;
  
  const stateClasses = error
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500';
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const inputClasses = `
    ${baseInputClasses}
    ${stateClasses}
    ${sizeClasses[size]}
    ${widthClass}
    ${startIcon ? 'pl-10' : ''}
    ${endIcon ? 'pr-10' : ''}
    ${className}
  `.replace(/\s+/g, ' ').trim();
  
  const id = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {startIcon}
          </div>
        )}
        
        <input
          {...props}
          id={id}
          className={inputClasses}
          disabled={disabled}
        />
        
        {endIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
            {endIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = `
    block w-full px-4 py-3 text-lg min-h-[120px]
    border rounded-lg shadow-sm transition-colors resize-vertical
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
  `;
  
  const stateClasses = error
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500';
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const textareaClasses = `${baseClasses} ${stateClasses} ${widthClass} ${className}`.replace(/\s+/g, ' ').trim();
  
  const id = props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <textarea
        {...props}
        id={id}
        className={textareaClasses}
        disabled={disabled}
      />
      
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};