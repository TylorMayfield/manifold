import { useState, useCallback, useRef } from "react";

export interface UndoRedoState<T> {
  value: T;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  setValue: (newValue: T, addToHistory?: boolean) => void;
  clearHistory: () => void;
  getHistoryLength: () => number;
}

export interface UndoRedoOptions {
  maxHistorySize?: number;
  debounceMs?: number;
  includeInitialValue?: boolean;
}

/**
 * Custom hook for undo/redo functionality
 * @param initialValue - The initial value
 * @param options - Configuration options
 * @returns UndoRedoState with undo/redo functionality
 */
export function useUndoRedo<T>(
  initialValue: T,
  options: UndoRedoOptions = {}
): UndoRedoState<T> {
  const {
    maxHistorySize = 50,
    debounceMs = 0,
    includeInitialValue = true,
  } = options;

  const [value, setValue] = useState<T>(initialValue);
  const historyRef = useRef<T[]>([initialValue]);
  const currentIndexRef = useRef(includeInitialValue ? 0 : -1);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Helper to get current state
  const getCurrentState = useCallback(() => {
    const history = historyRef.current;
    const currentIndex = currentIndexRef.current;
    return {
      canUndo: currentIndex > 0,
      canRedo: currentIndex < history.length - 1,
    };
  }, []);

  // Helper to add value to history
  const addToHistory = useCallback(
    (newValue: T) => {
      const history = historyRef.current;
      const currentIndex = currentIndexRef.current;

      // Remove any history after current index (when branching)
      historyRef.current = history.slice(0, currentIndex + 1);
      currentIndexRef.current = historyRef.current.length;

      // Add new value
      historyRef.current.push(newValue);

      // Trim history if it exceeds max size
      if (historyRef.current.length > maxHistorySize) {
        historyRef.current = historyRef.current.slice(-maxHistorySize);
        currentIndexRef.current = historyRef.current.length - 1;
      }
    },
    [maxHistorySize]
  );

  // Set value function
  const setValueWithHistory = useCallback(
    (newValue: T, shouldAddToHistory: boolean = true) => {
      if (debounceMs > 0) {
        // Clear existing timeout
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }

        // Set new timeout
        debounceTimeoutRef.current = setTimeout(() => {
          setValue(newValue);
          if (shouldAddToHistory) {
            addToHistory(newValue);
          }
        }, debounceMs);
      } else {
        setValue(newValue);
        if (shouldAddToHistory) {
          addToHistory(newValue);
        }
      }
    },
    [debounceMs, addToHistory]
  );

  // Undo function
  const undo = useCallback(() => {
    const history = historyRef.current;
    const currentIndex = currentIndexRef.current;

    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      currentIndexRef.current = newIndex;
      setValue(history[newIndex]);
    }
  }, []);

  // Redo function
  const redo = useCallback(() => {
    const history = historyRef.current;
    const currentIndex = currentIndexRef.current;

    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      currentIndexRef.current = newIndex;
      setValue(history[newIndex]);
    }
  }, []);

  // Clear history function
  const clearHistory = useCallback(() => {
    historyRef.current = [value];
    currentIndexRef.current = 0;
  }, [value]);

  // Get history length
  const getHistoryLength = useCallback(() => {
    return historyRef.current.length;
  }, []);

  const currentState = getCurrentState();

  return {
    value,
    canUndo: currentState.canUndo,
    canRedo: currentState.canRedo,
    undo,
    redo,
    setValue: setValueWithHistory,
    clearHistory,
    getHistoryLength,
  };
}

/**
 * Hook for text-based undo/redo with additional features
 */
export function useTextUndoRedo(
  initialText: string = "",
  options: UndoRedoOptions & {
    autoSave?: boolean;
    saveInterval?: number;
  } = {}
) {
  const { autoSave = false, saveInterval = 2000, ...undoRedoOptions } = options;

  const undoRedo = useUndoRedo(initialText, {
    ...undoRedoOptions,
    debounceMs: 300, // Debounce text changes
  });

  // Auto-save functionality
  const [lastSaved, setLastSaved] = useState<string>(initialText);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const setTextWithAutoSave = useCallback(
    (newText: string, shouldAddToHistory: boolean = true) => {
      undoRedo.setValue(newText, shouldAddToHistory);

      if (autoSave && newText !== lastSaved) {
        // Clear existing timeout
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }

        // Set new auto-save timeout
        autoSaveTimeoutRef.current = setTimeout(() => {
          setLastSaved(newText);
          // Here you could trigger an auto-save action
          console.log("Auto-saving text:", newText);
        }, saveInterval);
      }
    },
    [undoRedo, autoSave, lastSaved, saveInterval]
  );

  return {
    ...undoRedo,
    setValue: setTextWithAutoSave,
    lastSaved,
    hasUnsavedChanges: undoRedo.value !== lastSaved,
  };
}

/**
 * Hook for form-based undo/redo
 */
export function useFormUndoRedo<T extends Record<string, any>>(
  initialFormData: T,
  options: UndoRedoOptions = {}
) {
  return useUndoRedo(initialFormData, {
    ...options,
    debounceMs: 500, // Debounce form changes
  });
}

/**
 * Utility to create undo/redo actions for keyboard shortcuts
 */
export function createUndoRedoActions(undoRedo: UndoRedoState<any>) {
  return {
    undo: () => {
      if (undoRedo.canUndo) {
        undoRedo.undo();
      }
    },
    redo: () => {
      if (undoRedo.canRedo) {
        undoRedo.redo();
      }
    },
  };
}

/**
 * Utility to merge undo/redo with existing keyboard shortcuts
 */
export function withUndoRedoShortcuts<T extends Record<string, any>>(
  shortcuts: T,
  undoRedo: UndoRedoState<any>
): T & { undo: () => void; redo: () => void } {
  const actions = createUndoRedoActions(undoRedo);
  return {
    ...shortcuts,
    ...actions,
  };
}
