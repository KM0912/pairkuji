import { useEffect, useRef, useCallback, useState } from 'react';

interface UseAutoSaveOptions {
  delay?: number; // デバウンス時間（デフォルト500ms）
  maxRetries?: number; // 再試行回数
  enabled?: boolean; // 自動保存の有効/無効
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  saveCount: number;
  forceSave: () => Promise<void>;
}

export function useAutoSave<T>(
  data: T,
  saveFunction: (data: T) => Promise<void>,
  options: UseAutoSaveOptions = {}
): UseAutoSaveReturn {
  const {
    delay = 500,
    maxRetries = 3,
    enabled = true,
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveCount, setSaveCount] = useState(0);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<T>(data);
  const retryCountRef = useRef(0);
  const saveFunctionRef = useRef(saveFunction);

  // Update save function ref when it changes
  useEffect(() => {
    saveFunctionRef.current = saveFunction;
  }, [saveFunction]);

  const performSave = useCallback(async (dataToSave: T, attempt: number = 0): Promise<void> => {
    if (!enabled) return;

    setIsSaving(true);
    setError(null);

    try {
      await saveFunctionRef.current(dataToSave);
      setLastSaved(new Date());
      setSaveCount(prev => prev + 1);
      retryCountRef.current = 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '自動保存に失敗しました';
      
      if (attempt < maxRetries) {
        // Retry with exponential backoff
        const retryDelay = Math.min(1000 * Math.pow(2, attempt), 5000);
        setTimeout(() => {
          performSave(dataToSave, attempt + 1);
        }, retryDelay);
        return; // Don't set isSaving to false yet
      } else {
        setError(errorMessage);
        retryCountRef.current = 0;
      }
    } finally {
      if (attempt === 0 || attempt >= maxRetries) {
        setIsSaving(false);
      }
    }
  }, [enabled, maxRetries]);

  const scheduleSave = useCallback((dataToSave: T) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule new save with debounce
    timeoutRef.current = setTimeout(() => {
      performSave(dataToSave);
    }, delay);
  }, [delay, performSave]);

  const forceSave = useCallback(async (): Promise<void> => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await performSave(data);
  }, [data, performSave]);

  // Watch for data changes
  useEffect(() => {
    if (!enabled) return;

    // Deep comparison to avoid unnecessary saves
    const hasChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
    
    if (hasChanged && data !== undefined && data !== null) {
      previousDataRef.current = data;
      scheduleSave(data);
    }
  }, [data, enabled, scheduleSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Save on page unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        // Perform synchronous save if possible
        try {
          // Note: This might not work reliably due to browser restrictions
          // The main auto-save logic should handle most cases
          performSave(data);
        } catch (error) {
          console.warn('Failed to save on page unload:', error);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && timeoutRef.current) {
        // Page is being hidden, save immediately
        clearTimeout(timeoutRef.current);
        performSave(data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [data, enabled, performSave]);

  return {
    isSaving,
    lastSaved,
    error,
    saveCount,
    forceSave,
  };
}