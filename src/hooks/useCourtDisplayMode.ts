'use client';

import { useCallback, useEffect, useState } from 'react';

export type CourtDisplayMode = 'normal' | 'numberEmphasis';

const STORAGE_KEY = 'pairkuji-court-display-mode';

function parseStored(value: string | null): CourtDisplayMode {
  if (value === 'numberEmphasis' || value === 'normal') return value;
  return 'normal';
}

export function useCourtDisplayMode(): {
  mode: CourtDisplayMode;
  setMode: (mode: CourtDisplayMode) => void;
} {
  const [mode, setModeState] = useState<CourtDisplayMode>('normal');

  useEffect(() => {
    setModeState(parseStored(localStorage.getItem(STORAGE_KEY)));
  }, []);

  const setMode = useCallback((next: CourtDisplayMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  return { mode, setMode };
}
