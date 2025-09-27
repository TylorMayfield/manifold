"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  LogEntry,
  LogLevel,
  LogCategory,
  LogFilter,
  LogViewerState,
} from "../types/logs";
import { clientLogger } from "../lib/utils/ClientLogger";

interface LogContextType {
  logs: LogEntry[];
  addLog: (entry: LogEntry) => void;
  clearLogs: () => void;
  filters: LogFilter;
  setFilters: (filters: LogFilter) => void;
  filteredLogs: LogEntry[];
  isAutoScroll: boolean;
  setIsAutoScroll: (autoScroll: boolean) => void;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  maxEntries: number;
  setMaxEntries: (max: number) => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export const useLogs = () => {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error("useLogs must be used within a LogProvider");
  }
  return context;
};

interface LogProviderProps {
  children: React.ReactNode;
}

export const LogProvider: React.FC<LogProviderProps> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filters, setFilters] = useState<LogFilter>({
    levels: ["debug", "info", "warn", "error", "success"],
    categories: [
      "system",
      "database",
      "file-import",
      "data-processing",
      "user-action",
      "api",
      "electron",
      "ui",
      "backup",
    ],
  });
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [maxEntries, setMaxEntries] = useState(1000);

  const addLog = useCallback(
    (entry: LogEntry) => {
      setLogs((prevLogs) => {
        const newLogs = [entry, ...prevLogs];
        // Keep only the most recent entries
        return newLogs.slice(0, maxEntries);
      });
    },
    [maxEntries]
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Filter logs based on current filters
  const filteredLogs = logs.filter((log) => {
    // Check log level filter
    if (!filters.levels.includes(log.level)) {
      return false;
    }

    // Check category filter
    if (!filters.categories.includes(log.category)) {
      return false;
    }

    // Check search text filter
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const messageMatch = log.message.toLowerCase().includes(searchLower);
      const sourceMatch =
        log.source?.toLowerCase().includes(searchLower) || false;
      const detailsMatch = log.details
        ? JSON.stringify(log.details).toLowerCase().includes(searchLower)
        : false;

      if (!messageMatch && !sourceMatch && !detailsMatch) {
        return false;
      }
    }

    // Check date range filter
    if (filters.dateRange) {
      const logDate = log.timestamp.getTime();
      const startTime = filters.dateRange.start.getTime();
      const endTime = filters.dateRange.end.getTime();

      if (logDate < startTime || logDate > endTime) {
        return false;
      }
    }

    return true;
  });

  // Listen to logger events
  useEffect(() => {
    clientLogger.addListener(addLog);

    // Initial log entry
    clientLogger.info(
      "Log viewer initialized",
      "system",
      { timestamp: new Date() },
      "LogProvider"
    );

    return () => {
      clientLogger.removeListener(addLog);
    };
  }, [addLog]);

  const value: LogContextType = {
    logs,
    addLog,
    clearLogs,
    filters,
    setFilters,
    filteredLogs,
    isAutoScroll,
    setIsAutoScroll,
    isMinimized,
    setIsMinimized,
    maxEntries,
    setMaxEntries,
  };

  return <LogContext.Provider value={value}>{children}</LogContext.Provider>;
};
