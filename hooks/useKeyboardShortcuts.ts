"use client";

import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
}

export interface KeyboardShortcutsConfig {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export default function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: KeyboardShortcutsConfig) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when user is typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true" ||
        target.closest("[contenteditable]")
      ) {
        return;
      }

      const pressedKey = event.key.toLowerCase();
      const hasCtrl = event.ctrlKey || event.metaKey; // Support both Ctrl and Cmd
      const hasAlt = event.altKey;
      const hasShift = event.shiftKey;

      // Find matching shortcut
      const matchingShortcut = shortcuts.find((shortcut) => {
        const keyMatch = shortcut.key.toLowerCase() === pressedKey;
        const ctrlMatch = (shortcut.ctrlKey || shortcut.metaKey) === hasCtrl;
        const altMatch = (shortcut.altKey || false) === hasAlt;
        const shiftMatch = (shortcut.shiftKey || false) === hasShift;

        return keyMatch && ctrlMatch && altMatch && shiftMatch;
      });

      if (matchingShortcut) {
        event.preventDefault();
        event.stopPropagation();
        matchingShortcut.action();
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

// Common keyboard shortcuts for the application
export const COMMON_SHORTCUTS = {
  // Navigation
  NEW_PROJECT: "n",
  OPEN_SETTINGS: ",",
  TOGGLE_SIDEBAR: "b",

  // Data operations
  NEW_DATA_SOURCE: "d",
  REFRESH_DATA: "r",
  EXPORT_DATA: "e",

  // View modes
  TABLE_VIEW: "1",
  CHART_VIEW: "2",

  // System
  SYSTEM_MONITOR: "m",
  JOB_MONITOR: "j",

  // General
  SEARCH: "k",
  HELP: "?",
  ESCAPE: "Escape",
} as const;

// Helper function to create shortcut objects
export function createShortcut(
  key: string,
  action: () => void,
  description: string,
  modifiers: {
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
  } = {}
): KeyboardShortcut {
  return {
    key,
    action,
    description,
    ...modifiers,
  };
}
