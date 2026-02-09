import { useState, useEffect, useCallback } from 'react';
import type { SpreadResult } from '../types';
import { useTelegram } from './useTelegram';

const HISTORY_KEY = 'tarot_history';
const MAX_HISTORY = 50;

export function useHistory() {
  const { saveToCloud, loadFromCloud } = useTelegram();
  const [history, setHistory] = useState<SpreadResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка истории при монтировании
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await loadFromCloud(HISTORY_KEY);
      if (data) {
        const parsed = JSON.parse(data) as SpreadResult[];
        setHistory(parsed);
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setIsLoading(false);
    }
  }, [loadFromCloud]);

  const addReading = useCallback(async (reading: SpreadResult) => {
    const updated = [reading, ...history].slice(0, MAX_HISTORY);
    setHistory(updated);
    await saveToCloud(HISTORY_KEY, JSON.stringify(updated));
  }, [history, saveToCloud]);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    await saveToCloud(HISTORY_KEY, JSON.stringify([]));
  }, [saveToCloud]);

  return {
    history,
    isLoading,
    addReading,
    clearHistory,
  };
}
