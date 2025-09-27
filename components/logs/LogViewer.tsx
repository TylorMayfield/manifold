"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Filter,
  Search,
  Download,
  Settings,
  Play,
  Pause,
  Eye,
  EyeOff,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  Bug,
} from "lucide-react";
import { useLogs } from "../../contexts/LogContext";
import { LogLevel, LogCategory } from "../../types/logs";
import Button from "../ui/Button";
import Input from "../ui/Input";

const LogViewer: React.FC = () => {
  const {
    filteredLogs,
    clearLogs,
    filters,
    setFilters,
    isAutoScroll,
    setIsAutoScroll,
    isMinimized,
    setIsMinimized,
    maxEntries,
    setMaxEntries,
  } = useLogs();

  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isAutoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [filteredLogs, isAutoScroll]);

  // Update search filter when search text changes
  useEffect(() => {
    setFilters({
      ...filters,
      searchText: searchText || undefined,
    });
  }, [searchText]);

  const getLogIcon = (level: LogLevel) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "debug":
        return <Bug className="h-4 w-4 text-purple-400" />;
      default:
        return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  const getLogLevelColor = (level: LogLevel) => {
    switch (level) {
      case "error":
        return "text-red-300 bg-red-500/20";
      case "warn":
        return "text-yellow-300 bg-yellow-500/20";
      case "success":
        return "text-green-300 bg-green-500/20";
      case "debug":
        return "text-purple-300 bg-purple-500/20";
      default:
        return "text-blue-300 bg-blue-500/20";
    }
  };

  const getCategoryColor = (category: LogCategory) => {
    const colors = {
      system: "bg-gray-500/20 text-gray-300",
      database: "bg-blue-500/20 text-blue-300",
      "file-import": "bg-green-500/20 text-green-300",
      "data-processing": "bg-purple-500/20 text-purple-300",
      "user-action": "bg-orange-500/20 text-orange-300",
      api: "bg-cyan-500/20 text-cyan-300",
      electron: "bg-indigo-500/20 text-indigo-300",
      ui: "bg-pink-500/20 text-pink-300",
      backup: "bg-yellow-500/20 text-yellow-300",
    };
    return colors[category as keyof typeof colors] || colors.system;
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  };

  const exportLogs = () => {
    const logData = filteredLogs.map((log) => ({
      timestamp: log.timestamp.toISOString(),
      level: log.level,
      category: log.category,
      message: log.message,
      source: log.source,
      details: log.details,
    }));

    const dataStr = JSON.stringify(logData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `manifold-logs-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleLogLevel = (level: LogLevel) => {
    const newLevels = filters.levels.includes(level)
      ? filters.levels.filter((l) => l !== level)
      : [...filters.levels, level];

    setFilters({ ...filters, levels: newLevels });
  };

  const toggleCategory = (category: LogCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];

    setFilters({ ...filters, categories: newCategories });
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="card rounded-xl p-3 flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-subtle"></div>
            <span className="text-sm text-gray-700">
              {filteredLogs.length} logs
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsMinimized(false)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 z-50 flex flex-col animate-scale-in">
      <div className="card-elevated rounded-2xl flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-subheading text-gray-900">Log Viewer</h3>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-subtle"></div>
              <span className="text-caption">{filteredLogs.length}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={exportLogs}>
              <Download className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsAutoScroll(!isAutoScroll)}
            >
              {isAutoScroll ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMinimized(true)}
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-4 py-3 border-b border-white/10 space-y-3">
            <Input
              placeholder="Search logs..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />

            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">
                Log Levels
              </label>
              <div className="flex flex-wrap gap-1">
                {(
                  ["debug", "info", "warn", "error", "success"] as LogLevel[]
                ).map((level) => (
                  <button
                    key={level}
                    onClick={() => toggleLogLevel(level)}
                    className={`px-2 py-1 rounded text-xs transition-all duration-200 ${
                      filters.levels.includes(level)
                        ? getLogLevelColor(level)
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">
                Categories
              </label>
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    "system",
                    "database",
                    "file-import",
                    "data-processing",
                    "user-action",
                    "api",
                    "electron",
                    "ui",
                  ] as LogCategory[]
                ).map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-2 py-1 rounded text-xs transition-all duration-200 ${
                      filters.categories.includes(category)
                        ? getCategoryColor(category)
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Button size="sm" variant="outline" onClick={clearLogs}>
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
              <span className="text-xs text-gray-500">
                Max: {maxEntries} entries
              </span>
            </div>
          </div>
        )}

        {/* Logs */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No logs to display</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="card rounded-lg p-3 text-xs">
                <div className="flex items-start space-x-2">
                  {getLogIcon(log.level)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getLogLevelColor(
                          log.level
                        )}`}
                      >
                        {log.level.toUpperCase()}
                      </span>
                      <span className="text-gray-400">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 mb-1">
                      <span
                        className={`px-2 py-1 rounded text-xs ${getCategoryColor(
                          log.category
                        )}`}
                      >
                        {log.category}
                      </span>
                      {log.source && (
                        <span className="text-gray-500">from {log.source}</span>
                      )}
                    </div>

                    <p className="text-gray-800 mb-1">{log.message}</p>

                    {log.details && (
                      <details className="text-gray-500">
                        <summary className="cursor-pointer hover:text-gray-700 transition-colors duration-200">
                          Details
                        </summary>
                        <pre className="mt-1 text-xs bg-white/5 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
