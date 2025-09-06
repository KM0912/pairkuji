'use client';

import React, { useEffect } from 'react';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: 'auto' | 'half' | 'full';
  showHandle?: boolean;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  height = 'auto',
  showHandle = true,
}) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const heightClasses = {
    auto: 'max-h-[80vh]',
    half: 'h-[50vh]',
    full: 'h-[90vh]',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } ${heightClasses[height]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center py-3">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 id="sheet-title" className="text-xl font-semibold text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2"
              aria-label="閉じる"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className={`px-6 py-6 overflow-y-auto ${height === 'auto' ? 'max-h-[calc(80vh-100px)]' : 'flex-1'}`}>
          {children}
        </div>
      </div>
    </>
  );
};

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
    disabled?: boolean;
  }>;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  isOpen,
  onClose,
  title,
  actions,
}) => {
  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={title} height="auto">
      <div className="space-y-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              action.onClick();
              onClose();
            }}
            disabled={action.disabled}
            className={`w-full text-left px-4 py-4 text-lg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              action.variant === 'danger'
                ? 'text-red-600 hover:bg-red-50'
                : 'text-gray-900 hover:bg-gray-100'
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="w-full px-4 py-4 text-lg text-center text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          キャンセル
        </button>
      </div>
    </Sheet>
  );
};