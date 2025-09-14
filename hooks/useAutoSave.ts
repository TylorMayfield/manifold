"use client";

import { useEffect, useRef, useCallback } from "react";

export interface AutoSaveOptions {
  delay?: number; // Delay in milliseconds before saving
  onSave: (data: any) => void;
  onLoad?: () => any;
  storageKey?: string; // Key for localStorage
  enabled?: boolean;
  debounceMs?: number; // Debounce delay
}

export default function useAutoSave<T extends Record<string, any>>(
  data: T,
  options: AutoSaveOptions
) {
  const {
    delay = 2000, // 2 seconds default
    onSave,
    onLoad,
    storageKey,
    enabled = true,
    debounceMs = 500,
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSavedRef = useRef<string | undefined>(undefined);
  const isInitialLoadRef = useRef(true);

  // Load saved data on mount
  useEffect(() => {
    if (!enabled || !storageKey || !onLoad) return;

    try {
      const savedData = onLoad();
      if (savedData && Object.keys(savedData).length > 0) {
        isInitialLoadRef.current = true;
        // Apply saved data to form (this should be handled by parent component)
      }
    } catch (error) {
      console.error("Failed to load auto-saved data:", error);
    }
  }, [enabled, storageKey, onLoad]);

  // Auto-save effect
  useEffect(() => {
    if (!enabled || isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    // Skip if data hasn't changed
    const currentDataString = JSON.stringify(data);
    if (currentDataString === lastSavedRef.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      try {
        onSave(data);
        lastSavedRef.current = currentDataString;
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, onSave, enabled]);

  // Manual save function
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      onSave(data);
      lastSavedRef.current = JSON.stringify(data);
    } catch (error) {
      console.error("Manual save failed:", error);
    }
  }, [data, onSave]);

  // Clear saved data
  const clearSaved = useCallback(() => {
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error("Failed to clear saved data:", error);
      }
    }
  }, [storageKey]);

  return {
    saveNow,
    clearSaved,
  };
}

// Hook for localStorage-based auto-save
export function useLocalStorageAutoSave<T extends Record<string, any>>(
  data: T,
  storageKey: string,
  options: Partial<AutoSaveOptions> = {}
) {
  const onSave = useCallback(
    (dataToSave: T) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      } catch (error) {
        console.error("Failed to save to localStorage:", error);
      }
    },
    [storageKey]
  );

  const onLoad = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
      return null;
    }
  }, [storageKey]);

  return useAutoSave(data, {
    onSave,
    onLoad,
    storageKey,
    ...options,
  });
}

// Hook for sessionStorage-based auto-save
export function useSessionStorageAutoSave<T extends Record<string, any>>(
  data: T,
  storageKey: string,
  options: Partial<AutoSaveOptions> = {}
) {
  const onSave = useCallback(
    (dataToSave: T) => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(dataToSave));
      } catch (error) {
        console.error("Failed to save to sessionStorage:", error);
      }
    },
    [storageKey]
  );

  const onLoad = useCallback((): T | null => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Failed to load from sessionStorage:", error);
      return null;
    }
  }, [storageKey]);

  return useAutoSave(data, {
    onSave,
    onLoad,
    storageKey,
    ...options,
  });
}
