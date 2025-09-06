interface AutoSaveConfig {
  delay: number;
  maxRetries: number;
  enabled: boolean;
}

interface AutoSaveTask<T> {
  key: string;
  data: T;
  saveFunction: (data: T) => Promise<void>;
  timeout: NodeJS.Timeout;
  retryCount: number;
  config: AutoSaveConfig;
}

export class AutoSaveManager {
  private static instance: AutoSaveManager | null = null;
  private tasks: Map<string, AutoSaveTask<any>> = new Map();
  private defaultConfig: AutoSaveConfig = {
    delay: 500,
    maxRetries: 3,
    enabled: true,
  };

  private constructor() {
    // Handle page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    // Handle page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }
  }

  public static getInstance(): AutoSaveManager {
    if (!AutoSaveManager.instance) {
      AutoSaveManager.instance = new AutoSaveManager();
    }
    return AutoSaveManager.instance;
  }

  public scheduleAutoSave<T>(
    key: string,
    data: T,
    saveFunction: (data: T) => Promise<void>,
    config: Partial<AutoSaveConfig> = {}
  ): void {
    const mergedConfig = { ...this.defaultConfig, ...config };

    if (!mergedConfig.enabled) {
      return;
    }

    // Cancel existing save for this key
    this.cancelAutoSave(key);

    // Schedule new save
    const timeout = setTimeout(async () => {
      await this.performSave(key, data, saveFunction, mergedConfig);
    }, mergedConfig.delay);

    // Store the task
    this.tasks.set(key, {
      key,
      data,
      saveFunction,
      timeout,
      retryCount: 0,
      config: mergedConfig,
    });
  }

  public cancelAutoSave(key: string): void {
    const task = this.tasks.get(key);
    if (task) {
      clearTimeout(task.timeout);
      this.tasks.delete(key);
    }
  }

  public async forceSave(key: string): Promise<void> {
    const task = this.tasks.get(key);
    if (task) {
      clearTimeout(task.timeout);
      await this.performSave(key, task.data, task.saveFunction, task.config);
    }
  }

  public async saveAll(): Promise<void> {
    const savePromises: Promise<void>[] = [];

    this.tasks.forEach((task, key) => {
      clearTimeout(task.timeout);
      savePromises.push(
        this.performSave(key, task.data, task.saveFunction, task.config)
      );
    });

    await Promise.allSettled(savePromises);
  }

  public getTaskStatus(key: string): {
    exists: boolean;
    retryCount: number;
    config: AutoSaveConfig;
  } | null {
    const task = this.tasks.get(key);
    if (!task) {
      return null;
    }

    return {
      exists: true,
      retryCount: task.retryCount,
      config: task.config,
    };
  }

  public setDefaultConfig(config: Partial<AutoSaveConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  private async performSave<T>(
    key: string,
    data: T,
    saveFunction: (data: T) => Promise<void>,
    config: AutoSaveConfig
  ): Promise<void> {
    const task = this.tasks.get(key);
    
    try {
      await saveFunction(data);
      
      // Remove task on successful save
      if (task) {
        this.tasks.delete(key);
      }
      
      // Emit success event
      this.emitSaveEvent(key, 'success', null);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (task && task.retryCount < config.maxRetries) {
        // Retry with exponential backoff
        task.retryCount++;
        const retryDelay = Math.min(1000 * Math.pow(2, task.retryCount - 1), 5000);
        
        task.timeout = setTimeout(async () => {
          await this.performSave(key, data, saveFunction, config);
        }, retryDelay);
        
        // Update task in map
        this.tasks.set(key, task);
        
        // Emit retry event
        this.emitSaveEvent(key, 'retry', errorMessage);
        
      } else {
        // Max retries exceeded, remove task
        if (task) {
          this.tasks.delete(key);
        }
        
        // Emit error event
        this.emitSaveEvent(key, 'error', errorMessage);
        
        console.error(`Auto-save failed for key "${key}":`, error);
      }
    }
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Page is being hidden, save all pending tasks immediately
      this.saveAll().catch(error => {
        console.error('Failed to save all tasks on visibility change:', error);
      });
    }
  }

  private handleBeforeUnload(): void {
    // Attempt to save all pending tasks (may not be reliable)
    const savePromises: Promise<void>[] = [];

    this.tasks.forEach((task, key) => {
      clearTimeout(task.timeout);
      savePromises.push(
        task.saveFunction(task.data).catch((error: any) => {
          console.warn(`Failed to save "${key}" on page unload:`, error);
        })
      );
    });

    // Clear all tasks
    this.tasks.clear();
  }

  private emitSaveEvent(key: string, type: 'success' | 'error' | 'retry', error: string | null): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('autosave', {
        detail: { key, type, error, timestamp: new Date() }
      });
      window.dispatchEvent(event);
    }
  }

  // Cleanup method
  public destroy(): void {
    // Cancel all pending saves
    this.tasks.forEach((task) => {
      clearTimeout(task.timeout);
    });
    this.tasks.clear();

    // Remove event listeners
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }

    AutoSaveManager.instance = null;
  }
}

// Export singleton instance
export const autoSaveManager = AutoSaveManager.getInstance();