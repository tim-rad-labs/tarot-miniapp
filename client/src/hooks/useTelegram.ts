import { useEffect, useCallback } from 'react';

/**
 * Telegram WebApp interface
 */
interface TelegramWebApp {
  ready: () => void;
  close: () => void;
  expand: () => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    setText: (text: string) => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  CloudStorage: {
    setItem: (key: string, value: string, callback?: (error: Error | null, stored: boolean) => void) => void;
    getItem: (key: string, callback: (error: Error | null, value: string) => void) => void;
    getItems: (keys: string[], callback: (error: Error | null, values: Record<string, string>) => void) => void;
    removeItem: (key: string, callback?: (error: Error | null, removed: boolean) => void) => void;
    getKeys: (callback: (error: Error | null, keys: string[]) => void) => void;
  };
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  colorScheme: 'light' | 'dark';
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  platform: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

function getTg(): TelegramWebApp | null {
  try {
    if (window.Telegram && window.Telegram.WebApp) {
      return window.Telegram.WebApp;
    }
  } catch (e) {
    console.error('Failed to get Telegram WebApp:', e);
  }
  return null;
}

export function useTelegram() {
  const tg = getTg();

  useEffect(() => {
    if (tg) {
      try {
        tg.ready();
        tg.expand();
      } catch (e) {
        console.warn('Telegram SDK methods (ready/expand) not supported in this environment:', e);
      }
    }
  }, [tg]);

  const hapticImpact = useCallback((style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
    tg?.HapticFeedback?.impactOccurred(style);
  }, [tg]);

  const hapticNotification = useCallback((type: 'error' | 'success' | 'warning') => {
    tg?.HapticFeedback?.notificationOccurred(type);
  }, [tg]);

  const hapticSelection = useCallback(() => {
    tg?.HapticFeedback?.selectionChanged();
  }, [tg]);

  // CloudStorage helpers
  const saveToCloud = useCallback((key: string, value: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!tg?.CloudStorage) {
        // Fallback to localStorage
        try {
          localStorage.setItem(key, value);
          resolve(true);
        } catch {
          resolve(false);
        }
        return;
      }
      try {
        tg.CloudStorage.setItem(key, value, (error, stored) => {
          resolve(!error && stored);
        });
      } catch (e) {
        console.warn('Telegram CloudStorage setItem error:', e);
        try {
          localStorage.setItem(key, value);
          resolve(true);
        } catch {
          resolve(false);
        }
      }
    });
  }, [tg]);

  const loadFromCloud = useCallback((key: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!tg?.CloudStorage) {
        // Fallback to localStorage
        resolve(localStorage.getItem(key));
        return;
      }
      try {
        tg.CloudStorage.getItem(key, (error, value) => {
          resolve(error ? null : value);
        });
      } catch (e) {
        console.warn('Telegram CloudStorage getItem error:', e);
        resolve(localStorage.getItem(key));
      }
    });
  }, [tg]);

  const removeFromCloud = useCallback((key: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!tg?.CloudStorage) {
        localStorage.removeItem(key);
        resolve(true);
        return;
      }
      tg.CloudStorage.removeItem(key, (error, removed) => {
        resolve(!error && removed);
      });
    });
  }, [tg]);

  return {
    tg,
    user: tg?.initDataUnsafe?.user ?? null,
    colorScheme: tg?.colorScheme ?? 'dark',
    platform: tg?.platform ?? 'unknown',
    hapticImpact,
    hapticNotification,
    hapticSelection,
    saveToCloud,
    loadFromCloud,
    removeFromCloud,
    mainButton: tg?.MainButton ?? null,
    backButton: tg?.BackButton ?? null,
  };
}
