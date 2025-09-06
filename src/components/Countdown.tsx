'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, CardContent } from './ui';
import { useTimer } from '../hooks/useTimer';
import { requestPermissions } from '../lib/notifications';

interface CountdownProps {
  durationMinutes?: number;
  autoStart?: boolean;
  onTimeUp?: () => void;
  showControls?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Countdown: React.FC<CountdownProps> = ({
  durationMinutes = 15,
  autoStart = false,
  onTimeUp,
  showControls = true,
  size = 'md',
  className = '',
}) => {
  const [permissions, setPermissions] = useState<{
    notifications: boolean;
    sound: boolean;
  }>({ notifications: false, sound: false });

  const durationMs = durationMinutes * 60 * 1000;

  const {
    remainingMs,
    totalMs,
    isRunning,
    isFinished,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    formatTime,
    getProgress,
  } = useTimer({
    onTimeUp,
    enableNotifications: permissions.notifications,
    enableVibration: true,
    enableSound: permissions.sound,
  });

  useEffect(() => {
    const initializePermissions = async () => {
      const perms = await requestPermissions();
      setPermissions(perms);
    };

    initializePermissions();
  }, []);

  useEffect(() => {
    if (autoStart && !isRunning && remainingMs === 0) {
      startTimer(durationMs);
    }
  }, [autoStart, isRunning, remainingMs, durationMs, startTimer]);

  useEffect(() => {
    if (remainingMs === 0 && totalMs === 0) {
      resetTimer();
      startTimer(durationMs);
    }
  }, [durationMs, remainingMs, totalMs, resetTimer, startTimer]);

  const getTimeColor = () => {
    const progress = getProgress();
    if (isFinished) return 'text-red-600';
    if (progress > 80) return 'text-red-500';
    if (progress > 50) return 'text-yellow-500';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    const progress = getProgress();
    if (isFinished) return 'bg-red-500';
    if (progress > 80) return 'bg-red-400';
    if (progress > 50) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  const sizeClasses = {
    sm: {
      time: 'text-4xl',
      card: 'p-4',
      progress: 'h-2',
      button: 'text-sm px-3 py-1.5',
    },
    md: {
      time: 'text-6xl',
      card: 'p-6',
      progress: 'h-3',
      button: 'text-base px-4 py-2',
    },
    lg: {
      time: 'text-8xl',
      card: 'p-8',
      progress: 'h-4',
      button: 'text-lg px-6 py-3',
    },
  };

  const classes = sizeClasses[size];

  const handleStartPause = () => {
    if (isRunning) {
      pauseTimer();
    } else if (remainingMs > 0) {
      resumeTimer();
    } else {
      startTimer(durationMs);
    }
  };

  const handleReset = () => {
    resetTimer();
    startTimer(durationMs);
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardContent className={classes.card}>
        <div className="text-center space-y-6">
          {/* Timer Display */}
          <div className="space-y-4">
            <div className={`font-mono font-bold ${classes.time} ${getTimeColor()} ${isFinished ? 'animate-pulse' : ''}`}>
              {formatTime(remainingMs)}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`${classes.progress} ${getProgressColor()} transition-all duration-300 ease-out`}
                style={{ width: `${getProgress()}%` }}
              />
            </div>
            
            {/* Status Text */}
            <div className="text-sm text-gray-600">
              {isFinished ? (
                <span className="text-red-600 font-medium">時間終了！</span>
              ) : isRunning ? (
                <span className="text-blue-600">実行中...</span>
              ) : remainingMs > 0 ? (
                <span className="text-gray-500">一時停止中</span>
              ) : (
                <span className="text-gray-500">開始準備完了</span>
              )}
            </div>
          </div>

          {/* Controls */}
          {showControls && (
            <div className="flex justify-center space-x-3">
              <Button
                onClick={handleStartPause}
                variant={isRunning ? 'secondary' : 'primary'}
                className={classes.button}
              >
                {isRunning ? (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    停止
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    開始
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleReset}
                variant="outline"
                className={classes.button}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                リセット
              </Button>
            </div>
          )}
          
          {/* Permissions Notice */}
          {showControls && (!permissions.notifications || !permissions.sound) && (
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <p className="font-medium mb-1">通知設定</p>
              {!permissions.notifications && (
                <p>• ブラウザ通知が無効です</p>
              )}
              {!permissions.sound && (
                <p>• 音声アラートが無効です</p>
              )}
              <p className="mt-2 text-gray-400">
                設定で有効にすると時間終了時に通知されます
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};