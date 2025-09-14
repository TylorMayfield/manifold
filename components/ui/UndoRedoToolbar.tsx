"use client";

import { Undo2, Redo2, RotateCcw, History } from "lucide-react";
import Button from "./Button";
import { UndoRedoState } from "../../hooks/useUndoRedo";

interface UndoRedoToolbarProps {
  undoRedo: UndoRedoState<any>;
  showHistoryCount?: boolean;
  showClearButton?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "compact" | "minimal";
  className?: string;
}

export default function UndoRedoToolbar({
  undoRedo,
  showHistoryCount = false,
  showClearButton = false,
  size = "sm",
  variant = "default",
  className = "",
}: UndoRedoToolbarProps) {
  const { canUndo, canRedo, undo, redo, clearHistory, getHistoryLength } =
    undoRedo;

  const buttonSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "md";
  const iconSize =
    size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  if (variant === "minimal") {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-1 rounded transition-colors ${
            canUndo
              ? "text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-10"
              : "text-white text-opacity-30 cursor-not-allowed"
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className={iconSize} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-1 rounded transition-colors ${
            canRedo
              ? "text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-10"
              : "text-white text-opacity-30 cursor-not-allowed"
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className={iconSize} />
        </button>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Button
          onClick={undo}
          disabled={!canUndo}
          variant="ghost"
          size={buttonSize}
          icon={<Undo2 className={iconSize} />}
          title="Undo (Ctrl+Z)"
        />
        <Button
          onClick={redo}
          disabled={!canRedo}
          variant="ghost"
          size={buttonSize}
          icon={<Redo2 className={iconSize} />}
          title="Redo (Ctrl+Y)"
        />
        {showClearButton && (
          <Button
            onClick={clearHistory}
            disabled={getHistoryLength() <= 1}
            variant="ghost"
            size={buttonSize}
            icon={<RotateCcw className={iconSize} />}
            title="Clear History"
          />
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Button
        onClick={undo}
        disabled={!canUndo}
        variant="outline"
        size={buttonSize}
        icon={<Undo2 className={iconSize} />}
        title="Undo (Ctrl+Z)"
      >
        Undo
      </Button>
      <Button
        onClick={redo}
        disabled={!canRedo}
        variant="outline"
        size={buttonSize}
        icon={<Redo2 className={iconSize} />}
        title="Redo (Ctrl+Y)"
      >
        Redo
      </Button>

      {showHistoryCount && (
        <div className="flex items-center space-x-1 text-xs text-white text-opacity-60">
          <History className="h-3 w-3" />
          <span>{getHistoryLength()}</span>
        </div>
      )}

      {showClearButton && (
        <Button
          onClick={clearHistory}
          disabled={getHistoryLength() <= 1}
          variant="ghost"
          size={buttonSize}
          icon={<RotateCcw className={iconSize} />}
          title="Clear History"
        />
      )}
    </div>
  );
}

/**
 * Keyboard shortcut component for undo/redo
 */
interface UndoRedoShortcutsProps {
  undoRedo: UndoRedoState<any>;
  onKeyboardShortcut?: (action: "undo" | "redo") => void;
}

export function UndoRedoShortcuts({
  undoRedo,
  onKeyboardShortcut,
}: UndoRedoShortcutsProps) {
  // This component doesn't render anything, it just handles keyboard shortcuts
  // The actual keyboard handling should be done in the parent component
  // using the useKeyboardShortcuts hook with createUndoRedoActions

  return null;
}
