"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Filter,
  Search,
  Download,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  Bug,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { useLogs } from "../../contexts/LogContext";
import { LogLevel, LogCategory } from "../../types/logs";
import Button from "../ui/Button";
import Input from "../ui/Input";

interface LogViewerPageProps {}

const LogViewerPage: React.FC<LogViewerPageProps> = () => {
  const {
    filteredLogs,
    clearLogs,
    filters,
    setFilters,
    maxEntries,
    setMaxEntries,
  } = useLogs();

  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<
    Set<LogCategory>
  >(new Set(["system", "database", "api", "ui"]));

  // Update search filter when search text changes
  useEffect(() => {
    setFilters({
      ...filters,
      searchText: searchText || undefined,
    });
  }, [searchText]);

  // Organize logs by category
  const logsByCategory = filteredLogs.reduce((acc, log) => {
    if (!acc[log.category]) {
      acc[log.category] = [];
    }
    acc[log.category].push(log);
    return acc;
  }, {} as Record<LogCategory, typeof filteredLogs>);

  // Toggle category expansion
  const toggleCategory = (category: LogCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Toggle all categories
  const toggleAllCategories = () => {
    const allCategories = Object.keys(logsByCategory) as LogCategory[];
    const allExpanded = allCategories.every((cat) =>
      expandedCategories.has(cat)
    );

    if (allExpanded) {
      setExpandedCategories(new Set());
    } else {
      setExpandedCategories(new Set(allCategories));
    }
  };

  const getLogIcon = (level: LogLevel) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-jasper-400" />;
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-tangerine-400" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-apricot-400" />;
      case "debug":
        return <Bug className="h-4 w-4 text-dark_cyan-400" />;
      default:
        return <Info className="h-4 w-4 text-dark_cyan-400" />;
    }
  };

  const getLogLevelColor = (level: LogLevel) => {
    switch (level) {
      case "error":
        return "text-jasper-400 bg-jasper-400/10 border-jasper-400/20";
      case "warn":
        return "text-tangerine-400 bg-tangerine-400/10 border-tangerine-400/20";
      case "success":
        return "text-apricot-400 bg-apricot-400/10 border-apricot-400/20";
      case "debug":
        return "text-dark_cyan-400 bg-dark_cyan-400/10 border-dark_cyan-400/20";
      default:
        return "text-dark_cyan-400 bg-dark_cyan-400/10 border-dark_cyan-400/20";
    }
  };

  const getCategoryColor = (category: LogCategory) => {
    switch (category) {
      case "system":
        return "text-dark_cyan-400 bg-dark_cyan-400/10 border-dark_cyan-400/20";
      case "database":
        return "text-apricot-400 bg-apricot-400/10 border-apricot-400/20";
      case "api":
        return "text-tangerine-400 bg-tangerine-400/10 border-tangerine-400/20";
      case "ui":
        return "text-jasper-400 bg-jasper-400/10 border-jasper-400/20";
      default:
        return "text-dark_cyan-300 bg-dark_cyan-300/10 border-dark_cyan-300/20";
    }
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

    const blob = new Blob([JSON.stringify(logData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `manifold-logs-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleLevelFilter = (level: LogLevel) => {
    const currentLevels = filters.levels || [];
    const newLevels = currentLevels.includes(level)
      ? currentLevels.filter((l) => l !== level)
      : [...currentLevels, level];
    setFilters({
      ...filters,
      levels: newLevels,
    });
  };

  const toggleCategoryFilter = (category: LogCategory) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter((c) => c !== category)
      : [...currentCategories, category];
    setFilters({
      ...filters,
      categories: newCategories,
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Category Summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {Object.entries(logsByCategory).map(([category, logs]) => (
              <div key={category} className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {logs.length}
                </div>
                <div className="text-xs text-dark_cyan-400">
                  {category.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">Logs</h3>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-apricot-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">
                {filteredLogs.length}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button size="sm" variant="ghost" onClick={toggleAllCategories}>
              {Object.keys(logsByCategory).every((cat) =>
                expandedCategories.has(cat as LogCategory)
              ) ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {Object.keys(logsByCategory).every((cat) =>
                expandedCategories.has(cat as LogCategory)
              )
                ? "Collapse All"
                : "Expand All"}
            </Button>
            <Button size="sm" variant="ghost" onClick={exportLogs}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button size="sm" variant="ghost" onClick={clearLogs}>
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark_cyan-400" />
            <Input
              type="text"
              placeholder="Search logs..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-4">
            {/* Level Filters */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Log Levels
              </h4>
              <div className="flex flex-wrap gap-2">
                {(
                  ["error", "warn", "info", "success", "debug"] as LogLevel[]
                ).map((level) => (
                  <button
                    key={level}
                    onClick={() => toggleLevelFilter(level)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      !filters.levels || filters.levels.includes(level)
                        ? getLogLevelColor(level)
                        : "text-dark_cyan-300 bg-dark_cyan-300/10 border-dark_cyan-300/20"
                    }`}
                  >
                    {level.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filters */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Categories
              </h4>
              <div className="flex flex-wrap gap-2">
                {(["system", "database", "api", "ui"] as LogCategory[]).map(
                  (category) => (
                    <button
                      key={category}
                      onClick={() => toggleCategoryFilter(category)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        !filters.categories ||
                        filters.categories.includes(category)
                          ? getCategoryColor(category)
                          : "text-dark_cyan-300 bg-dark_cyan-300/10 border-dark_cyan-300/20"
                      }`}
                    >
                      {category.toUpperCase()}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Max Entries */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Max Entries
              </h4>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={maxEntries}
                  onChange={(e) => setMaxEntries(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-dark_cyan-400 w-16">
                  {maxEntries}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Logs Display */}
      <div className="flex-1 glass-card overflow-hidden">
        <div className="h-full overflow-y-auto p-4">
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-dark_cyan-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Logs
                </h3>
                <p className="text-dark_cyan-400">
                  No logs match your current filters. Try adjusting your filter
                  settings.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(logsByCategory).map(([category, logs]) => (
                <div key={category} className="space-y-2">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category as LogCategory)}
                    className="flex items-center justify-between w-full p-2 rounded-lg bg-dark_cyan-300/10 border border-dark_cyan-200/20 hover:bg-dark_cyan-300/20 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(
                          category as LogCategory
                        )}`}
                      >
                        {category.toUpperCase()}
                      </span>
                      <span className="text-xs text-dark_cyan-400">
                        {logs.length} entries
                      </span>
                    </div>
                    {expandedCategories.has(category as LogCategory) ? (
                      <ChevronUp className="h-4 w-4 text-dark_cyan-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-dark_cyan-400" />
                    )}
                  </button>

                  {/* Category Logs */}
                  {expandedCategories.has(category as LogCategory) && (
                    <div className="space-y-1 ml-4">
                      {logs.map((log, index) => (
                        <div
                          key={`${log.timestamp.getTime()}-${index}`}
                          className="flex items-center space-x-2 p-2 rounded bg-white/3 border border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex-shrink-0">
                            {getLogIcon(log.level)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs border ${getLogLevelColor(
                                  log.level
                                )}`}
                              >
                                {log.level.toUpperCase()}
                              </span>
                              <span className="text-xs text-dark_cyan-400">
                                {log.timestamp.toLocaleTimeString()}
                              </span>
                              {log.source && (
                                <span className="text-xs text-dark_cyan-500">
                                  {log.source}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-900 text-xs mt-0.5 truncate">
                              {log.message}
                            </p>
                            {log.details && (
                              <details className="mt-1">
                                <summary className="text-xs text-dark_cyan-400 cursor-pointer hover:text-dark_cyan-300">
                                  Details
                                </summary>
                                <pre className="mt-1 text-xs text-dark_cyan-300 bg-dark_cyan-100/20 p-2 rounded overflow-x-auto">
                                  {typeof log.details === "string"
                                    ? log.details
                                    : JSON.stringify(log.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewerPage;
