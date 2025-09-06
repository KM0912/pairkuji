'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from './ui';
import { AutoSaveStatus } from './AutoSaveStatus';
import { useSessionStore } from '../lib/stores/sessionStore';

interface SessionHeaderProps {
  sessionId: string;
  showBackButton?: boolean;
  actions?: React.ReactNode;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({ 
  sessionId, 
  showBackButton = true,
  actions 
}) => {
  const { currentSession } = useSessionStore();

  return (
    <header className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <Link href="/">
              <Button variant="outline" size="sm">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                戻る
              </Button>
            </Link>
          )}
          
          <div>
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {currentSession?.title || `セッション ${sessionId.slice(-6)}`}
              </h1>
              <AutoSaveStatus />
            </div>
            {currentSession && (
              <p className="text-gray-600">
                {currentSession.courts}コート
                {currentSession.currentRound > 0 && ` • ${currentSession.currentRound}ラウンド完了`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {actions}
        </div>
      </div>
    </header>
  );
};