'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Modal } from './ui';
import { Countdown } from './Countdown';
import { useSessionStore } from '../lib/stores/sessionStore';

interface SessionHeaderProps {
  sessionId: string;
  showBackButton?: boolean;
  showTimer?: boolean;
  actions?: React.ReactNode;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({ 
  sessionId, 
  showBackButton = true,
  showTimer = false,
  actions 
}) => {
  const { currentSession } = useSessionStore();
  const [timerModalOpen, setTimerModalOpen] = useState(false);

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
            <h1 className="text-2xl font-bold text-gray-900">
              {currentSession?.title || `セッション ${sessionId.slice(-6)}`}
            </h1>
            {currentSession && (
              <p className="text-gray-600">
                {currentSession.courts}コート・{currentSession.minutesPerGame}分/試合
                {currentSession.currentRound > 0 && ` • ${currentSession.currentRound}ラウンド完了`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {showTimer && currentSession && (
            <Button
              variant="outline"
              onClick={() => setTimerModalOpen(true)}
              className="flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              タイマー
            </Button>
          )}
          
          {actions}
        </div>
      </div>

      {/* Timer Modal */}
      <Modal
        isOpen={timerModalOpen}
        onClose={() => setTimerModalOpen(false)}
        title="試合タイマー"
        size="sm"
      >
        <Countdown
          durationMinutes={currentSession?.minutesPerGame || 15}
          onTimeUp={() => {
            console.log('Time is up!');
          }}
        />
      </Modal>
    </header>
  );
};