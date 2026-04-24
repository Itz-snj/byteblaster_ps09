'use client';

import { useState, useEffect, useCallback } from 'react';

const API_KEY_STORAGE_KEY = 'gemini_api_key';

export interface UseApiKeyReturn {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  hasApiKey: boolean;
}

export function useApiKey(): UseApiKeyReturn {
  const [apiKey, setApiKeyState] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (stored) {
      setApiKeyState(stored);
    }
  }, []);

  const setApiKey = useCallback((key: string) => {
    const trimmedKey = key.trim();
    localStorage.setItem(API_KEY_STORAGE_KEY, trimmedKey);
    setApiKeyState(trimmedKey);
  }, []);

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKeyState(null);
  }, []);

  return {
    apiKey,
    setApiKey,
    clearApiKey,
    hasApiKey: !!apiKey,
  };
}