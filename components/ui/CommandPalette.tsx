"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Database,
  Layers,
  Zap,
  Play,
  Webhook,
  Settings,
  FileText,
  Plus,
  Home,
  BarChart3,
  Puzzle,
  Command,
  ArrowRight,
  Clock,
} from "lucide-react";
import { cn } from "../../lib/utils/cn";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * CommandPalette - Quick navigation and action palette (Cmd+K / Ctrl+K)
 *
 * This component helps users:
 * 1. Navigate quickly to any part of the app
 * 2. Discover all available features
 * 3. Execute common actions without clicking through menus
 */
export default function CommandPalette({
  isOpen,
  onClose,
}: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Define all available commands
  const commands: CommandItem[] = useMemo(
    () => [
      // Navigation
      {
        id: "nav-home",
        label: "Go to Home",
        description: "Dashboard and overview",
        icon: Home,
        category: "Navigation",
        action: () => router.push("/"),
      },
      {
        id: "nav-data-sources",
        label: "Go to Data Sources",
        description: "Manage data connections",
        icon: Database,
        category: "Navigation",
        action: () => router.push("/data"),
        keywords: ["sources", "connections", "data"],
      },
      {
        id: "nav-data-lakes",
        label: "Go to Data Lakes",
        description: "Unified data lake management",
        icon: Layers,
        category: "Navigation",
        action: () => router.push("/data-lakes"),
        keywords: ["lakes", "consolidation", "unified"],
      },
      {
        id: "nav-pipelines",
        label: "Go to Pipelines",
        description: "Transform and process data",
        icon: Zap,
        category: "Navigation",
        action: () => router.push("/pipelines"),
        keywords: ["transform", "etl", "process"],
      },
      {
        id: "nav-jobs",
        label: "Go to Jobs",
        description: "Scheduled automation",
        icon: Play,
        category: "Navigation",
        action: () => router.push("/jobs"),
        keywords: ["schedule", "automation", "cron"],
      },
      {
        id: "nav-webhooks",
        label: "Go to Webhooks",
        description: "Notifications and integrations",
        icon: Webhook,
        category: "Navigation",
        action: () => router.push("/webhooks"),
        keywords: ["notifications", "integrations", "events"],
      },
      {
        id: "nav-observability",
        label: "Go to Observability",
        description: "Logs, metrics, and monitoring",
        icon: FileText,
        category: "Navigation",
        action: () => router.push("/observability"),
        keywords: ["logs", "monitoring", "metrics", "debug"],
      },
      {
        id: "nav-plugins",
        label: "Go to Plugins",
        description: "Manage and configure plugins",
        icon: Puzzle,
        category: "Navigation",
        action: () => router.push("/plugins"),
        keywords: ["extensions", "addons"],
      },
      {
        id: "nav-settings",
        label: "Go to Settings",
        description: "Application configuration",
        icon: Settings,
        category: "Navigation",
        action: () => router.push("/settings"),
        keywords: ["config", "preferences"],
      },

      // Actions
      {
        id: "action-add-source",
        label: "Add Data Source",
        description: "Create a new data connection",
        icon: Plus,
        category: "Actions",
        action: () => router.push("/add-data-source"),
        keywords: ["create", "new", "import"],
      },
      {
        id: "action-create-pipeline",
        label: "Create Pipeline",
        description: "Build a new data transformation pipeline",
        icon: Zap,
        category: "Actions",
        action: () => router.push("/pipelines"),
        keywords: ["create", "new", "transform"],
      },
      {
        id: "action-create-lake",
        label: "Create Data Lake",
        description: "Consolidate multiple data sources",
        icon: Layers,
        category: "Actions",
        action: () => router.push("/data-lakes"),
        keywords: ["create", "new", "consolidate"],
      },
      {
        id: "action-view-logs",
        label: "View Recent Logs",
        description: "Check application logs and errors",
        icon: FileText,
        category: "Actions",
        action: () => router.push("/observability"),
        keywords: ["debug", "errors", "troubleshoot"],
      },

      // Quick Links
      {
        id: "quick-snapshots",
        label: "View Snapshots",
        description: "Data version history",
        icon: Clock,
        category: "Quick Links",
        action: () => router.push("/snapshots"),
        keywords: ["history", "versions", "backup"],
      },
      {
        id: "quick-monitoring",
        label: "View Monitoring",
        description: "System health and performance",
        icon: BarChart3,
        category: "Quick Links",
        action: () => router.push("/monitoring"),
        keywords: ["health", "performance", "metrics"],
      },
    ],
    [router]
  );

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;

    const searchLower = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(searchLower) ||
        cmd.description?.toLowerCase().includes(searchLower) ||
        cmd.category.toLowerCase().includes(searchLower) ||
        cmd.keywords?.some((kw) => kw.toLowerCase().includes(searchLower))
    );
  }, [search, commands]);

  // Group by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selectedCommand = filteredCommands[selectedIndex];
        if (selectedCommand) {
          selectedCommand.action();
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Reset search when closed
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="relative w-full max-w-2xl bg-white border-2 border-gray-900 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b-2 border-gray-900 bg-gray-50">
          <Search className="w-5 h-5 text-gray-600 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for commands, pages, or actions..."
            className="flex-1 bg-transparent outline-none font-mono text-sm text-gray-900 placeholder:text-gray-500"
            autoFocus
          />
          <kbd className="px-2 py-1 text-xs font-mono bg-gray-200 border border-gray-400 rounded">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-[60vh] overflow-y-auto">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-mono text-gray-500">
                No commands found
              </p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => (
              <div
                key={category}
                className="border-b-2 border-gray-900 last:border-b-0"
              >
                <div className="px-4 py-2 bg-gray-100 border-b border-gray-300">
                  <p className="text-xs font-bold font-mono text-gray-700 uppercase tracking-wide">
                    {category}
                  </p>
                </div>
                <div>
                  {items.map((cmd, index) => {
                    const Icon = cmd.icon;
                    const globalIndex = filteredCommands.indexOf(cmd);
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 border-b border-gray-200 last:border-b-0 transition-all group",
                          isSelected
                            ? "bg-blue-500 text-white"
                            : "bg-white hover:bg-gray-50"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-5 h-5 flex-shrink-0 transition-transform",
                            isSelected
                              ? "text-white scale-110"
                              : "text-gray-600 group-hover:scale-110"
                          )}
                        />
                        <div className="flex-1 text-left">
                          <p
                            className={cn(
                              "font-bold font-mono text-sm",
                              isSelected ? "text-white" : "text-gray-900"
                            )}
                          >
                            {cmd.label}
                          </p>
                          {cmd.description && (
                            <p
                              className={cn(
                                "text-xs",
                                isSelected ? "text-white/90" : "text-gray-600"
                              )}
                            >
                              {cmd.description}
                            </p>
                          )}
                        </div>
                        <ArrowRight
                          className={cn(
                            "w-4 h-4 flex-shrink-0 transition-all",
                            isSelected
                              ? "text-white opacity-100"
                              : "text-gray-400 opacity-0 group-hover:opacity-100"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white text-xs font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded">
                ↑↓
              </kbd>
              <span className="text-gray-400">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded">
                ↵
              </kbd>
              <span className="text-gray-400">Select</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span className="text-gray-400">+K to open</span>
          </div>
        </div>
      </div>
    </div>
  );
}
