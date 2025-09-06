import { useState, useEffect, useCallback, useRef } from 'react';
import { showTimeUpNotification, vibrate, playTimeUpSound } from '../lib/notifications';

interface UseTimerOptions {
  onTimeUp?: () => void;
  enableNotifications?: boolean;
  enableVibration?: boolean;
  enableSound?: boolean;
}

interface UseTimerReturn {
  remainingMs: number;
  totalMs: number;
  isRunning: boolean;
  isFinished: boolean;
  startTimer: (durationMs: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  setTimer: (durationMs: number) => void;
  formatTime: (ms: number) => string;
  getProgress: () => number; // 0-100 percentage
}

export function useTimer(options: UseTimerOptions = {}): UseTimerReturn {
  const {
    onTimeUp,
    enableNotifications = true,
    enableVibration = true,
    enableSound = true,
  } = options;

  const [remainingMs, setRemainingMs] = useState(0);
  const [totalMs, setTotalMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const formatTime = useCallback((ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const getProgress = useCallback((): number => {
    if (totalMs === 0) return 0;
    return Math.max(0, Math.min(100, ((totalMs - remainingMs) / totalMs) * 100));
  }, [remainingMs, totalMs]);

  const handleTimeUp = useCallback(async () => {
    setIsRunning(false);
    setIsFinished(true);
    setRemainingMs(0);
    clearTimer();

    // Trigger notifications
    if (enableNotifications) {
      showTimeUpNotification();
    }
    
    if (enableVibration) {
      vibrate([500, 200, 500, 200, 500]);
    }
    
    if (enableSound) {
      playTimeUpSound();
    }

    // Call user callback
    if (onTimeUp) {
      onTimeUp();
    }
  }, [onTimeUp, enableNotifications, enableVibration, enableSound, clearTimer]);

  const startTimer = useCallback((durationMs: number) => {
    clearTimer();
    
    const startTime = Date.now();
    startTimeRef.current = startTime;
    pausedTimeRef.current = 0;
    
    setTotalMs(durationMs);
    setRemainingMs(durationMs);
    setIsRunning(true);
    setIsFinished(false);

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, durationMs - elapsed);
      
      setRemainingMs(remaining);
      
      if (remaining === 0) {
        handleTimeUp();
      }
    }, 100); // Update every 100ms for smooth display
  }, [clearTimer, handleTimeUp]);

  const pauseTimer = useCallback(() => {
    if (isRunning && intervalRef.current) {
      clearTimer();
      setIsRunning(false);
      pausedTimeRef.current = Date.now();
    }
  }, [isRunning, clearTimer]);

  const resumeTimer = useCallback(() => {
    if (!isRunning && remainingMs > 0 && pausedTimeRef.current > 0) {
      const pausedDuration = Date.now() - pausedTimeRef.current;
      startTimeRef.current += pausedDuration;
      pausedTimeRef.current = 0;
      
      setIsRunning(true);
      
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTimeRef.current;
        const remaining = Math.max(0, totalMs - elapsed);
        
        setRemainingMs(remaining);
        
        if (remaining === 0) {
          handleTimeUp();
        }
      }, 100);
    }
  }, [isRunning, remainingMs, totalMs, handleTimeUp]);

  const resetTimer = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setIsFinished(false);
    setRemainingMs(totalMs);
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;
  }, [clearTimer, totalMs]);

  const setTimer = useCallback((durationMs: number) => {
    clearTimer();
    setTotalMs(durationMs);
    setRemainingMs(durationMs);
    setIsRunning(false);
    setIsFinished(false);
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;
  }, [clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  // Handle visibility change to pause/resume timer
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning) {
        // Page is hidden but timer is running - we'll let it continue
        // The interval will keep running in the background
      } else if (!document.hidden && isRunning) {
        // Page is visible and timer should be running
        // Recalculate remaining time in case of discrepancy
        if (startTimeRef.current > 0) {
          const now = Date.now();
          const elapsed = now - startTimeRef.current;
          const remaining = Math.max(0, totalMs - elapsed);
          setRemainingMs(remaining);
          
          if (remaining === 0 && !isFinished) {
            handleTimeUp();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, totalMs, isFinished, handleTimeUp]);

  return {
    remainingMs,
    totalMs,
    isRunning,
    isFinished,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    setTimer,
    formatTime,
    getProgress,
  };
}