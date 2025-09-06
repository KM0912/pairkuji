'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from './ui';

interface AutoSaveEvent {
  key: string;
  type: 'success' | 'error' | 'retry';
  error: string | null;
  timestamp: Date;
}

interface AutoSaveStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const AutoSaveStatus: React.FC<AutoSaveStatusProps> = ({
  className = '',
  showDetails = false,
}) => {
  const [lastEvent, setLastEvent] = useState<AutoSaveEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleAutoSaveEvent = (event: CustomEvent<AutoSaveEvent>) => {
      setLastEvent(event.detail);
      setIsVisible(true);
      
      // Auto-hide success messages after 3 seconds
      if (event.detail.type === 'success') {
        setTimeout(() => {
          setIsVisible(false);
        }, 3000);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('autosave', handleAutoSaveEvent as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('autosave', handleAutoSaveEvent as EventListener);
      }
    };
  }, []);

  if (!isVisible || !lastEvent) {
    return null;
  }

  const getStatusConfig = () => {
    switch (lastEvent.type) {
      case 'success':
        return {
          variant: 'success' as const,
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          text: '自動保存完了',
        };
      case 'error':
        return {
          variant: 'danger' as const,
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.346 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          text: '保存エラー',
        };
      case 'retry':
        return {
          variant: 'warning' as const,
          icon: (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ),
          text: '再試行中',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Badge variant={config.variant} className="flex items-center space-x-1">
        {config.icon}
        <span>{config.text}</span>
      </Badge>
      
      {showDetails && (
        <div className="text-xs text-gray-500">
          {lastEvent.timestamp.toLocaleTimeString()}
          {lastEvent.error && (
            <div className="text-red-500 mt-1" title={lastEvent.error}>
              {lastEvent.error.length > 50 
                ? `${lastEvent.error.substring(0, 50)}...` 
                : lastEvent.error
              }
            </div>
          )}
        </div>
      )}
      
      {lastEvent.type === 'error' && (
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 ml-2"
          title="閉じる"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

interface SavingIndicatorProps {
  isSaving: boolean;
  className?: string;
}

export const SavingIndicator: React.FC<SavingIndicatorProps> = ({
  isSaving,
  className = '',
}) => {
  if (!isSaving) return null;

  return (
    <div className={`flex items-center space-x-2 text-blue-600 ${className}`}>
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <span className="text-sm">保存中...</span>
    </div>
  );
};