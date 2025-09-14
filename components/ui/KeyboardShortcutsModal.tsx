"use client";

import React from "react";
import { X, Command } from "lucide-react";
import Modal from "./Modal";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: Array<{
    key: string;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
    description: string;
  }>;
}

export default function KeyboardShortcutsModal({
  isOpen,
  onClose,
  shortcuts,
}: KeyboardShortcutsModalProps) {
  const formatShortcut = (shortcut: {
    key: string;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
  }) => {
    const keys = [];

    if (shortcut.ctrlKey || shortcut.metaKey) {
      keys.push("Ctrl");
    }
    if (shortcut.altKey) {
      keys.push("Alt");
    }
    if (shortcut.shiftKey) {
      keys.push("Shift");
    }
    keys.push(shortcut.key.toUpperCase());

    return keys;
  };

  const getKeyIcon = (key: string) => {
    switch (key.toLowerCase()) {
      case "ctrl":
        return <span className="text-xs font-bold">⌃</span>;
      case "alt":
        return <span className="text-xs font-bold">⌥</span>;
      case "shift":
        return <span className="text-xs font-bold">⇧</span>;
      case "command":
        return <Command className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = getCategory(shortcut.description);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, typeof shortcuts>);

  function getCategory(description: string): string {
    if (
      description.includes("Project") ||
      description.includes("Data Source")
    ) {
      return "Data Management";
    }
    if (
      description.includes("View") ||
      description.includes("Table") ||
      description.includes("Chart")
    ) {
      return "Views & Navigation";
    }
    if (
      description.includes("System") ||
      description.includes("Monitor") ||
      description.includes("Settings")
    ) {
      return "System";
    }
    if (description.includes("Search") || description.includes("Help")) {
      return "General";
    }
    return "Other";
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title=""
      showCloseButton={false}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
          <p className="text-white/60 mt-1">
            Speed up your workflow with these keyboard shortcuts
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedShortcuts).map(
          ([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-white mb-4">
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <span className="text-white/80 text-sm">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center space-x-1">
                      {formatShortcut(shortcut).map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && (
                            <span className="text-white/40 mx-1">+</span>
                          )}
                          <div className="flex items-center space-x-1 px-2 py-1 bg-white/10 rounded text-xs text-white/80 border border-white/20">
                            {getKeyIcon(key)}
                            <span>{key}</span>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="p-1 rounded bg-blue-500/20">
            <Command className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-white mb-1">Pro Tip</h4>
            <p className="text-sm text-white/80">
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs border border-white/20">
                ?
              </kbd>{" "}
              at any time to open this shortcuts panel!
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
