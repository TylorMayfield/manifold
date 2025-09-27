// Client-side logger that works in the browser
// This runs in the browser/renderer process and doesn't use Node.js modules

import { LogEntry, LogLevel, LogCategory } from "../../types/logs";

class ClientLogger {
  private static instance: ClientLogger;
  private listeners: ((entry: LogEntry) => void)[] = [];
  private maxEntries: number = 1000;
  private logQueue: LogEntry[] = [];

  static getInstance(): ClientLogger {
    if (!ClientLogger.instance) {
      ClientLogger.instance = new ClientLogger();
    }
    return ClientLogger.instance;
  }

  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    details?: any,
    source?: string,
    projectId?: string,
    dataSourceId?: string
  ): LogEntry {
    return {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      category,
      message,
      details,
      source,
      projectId,
      dataSourceId,
    };
  }

  private emit(entry: LogEntry): void {
    // Emit to listeners
    this.listeners.forEach((listener) => listener(entry));

    // Store in memory queue
    this.logQueue.push(entry);
    if (this.logQueue.length > this.maxEntries) {
      this.logQueue.shift(); // Remove oldest log
    }

    // Also log to console for development
    if (process.env.NODE_ENV === "development") {
      const timestamp = entry.timestamp.toISOString();
      const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${
        entry.category
      }]`;

      switch (entry.level) {
        case "error":
          console.error(`${prefix} ${entry.message}`, entry.details);
          break;
        case "warn":
          console.warn(`${prefix} ${entry.message}`, entry.details);
          break;
        case "success":
          console.log(`✅ ${prefix} ${entry.message}`, entry.details);
          break;
        default:
          console.log(`${prefix} ${entry.message}`, entry.details);
      }
    }

    // Try to send to Electron main process if available
    if (
      typeof window !== "undefined" &&
      (window as any).electronAPI?.logEvent
    ) {
      try {
        (window as any).electronAPI.logEvent(entry);
      } catch (error) {
        // Ignore errors when sending to main process
      }
    }
  }

  // Public logging methods
  debug(
    message: string,
    details?: any,
    source?: string,
    projectId?: string,
    dataSourceId?: string
  ): void {
    const entry = this.createLogEntry(
      "debug",
      "system",
      message,
      details,
      source,
      projectId,
      dataSourceId
    );
    this.emit(entry);
  }

  info(
    message: string,
    category: LogCategory = "system",
    details?: any,
    source?: string,
    projectId?: string,
    dataSourceId?: string
  ): void {
    const entry = this.createLogEntry(
      "info",
      category,
      message,
      details,
      source,
      projectId,
      dataSourceId
    );
    this.emit(entry);
  }

  warn(
    message: string,
    category: LogCategory = "system",
    details?: any,
    source?: string,
    projectId?: string,
    dataSourceId?: string
  ): void {
    const entry = this.createLogEntry(
      "warn",
      category,
      message,
      details,
      source,
      projectId,
      dataSourceId
    );
    this.emit(entry);
  }

  error(
    message: string,
    category: LogCategory = "system",
    details?: any,
    source?: string,
    projectId?: string,
    dataSourceId?: string
  ): void {
    const entry = this.createLogEntry(
      "error",
      category,
      message,
      details,
      source,
      projectId,
      dataSourceId
    );
    this.emit(entry);
  }

  success(
    message: string,
    category: LogCategory = "system",
    details?: any,
    source?: string,
    projectId?: string,
    dataSourceId?: string
  ): void {
    const entry = this.createLogEntry(
      "success",
      category,
      message,
      details,
      source,
      projectId,
      dataSourceId
    );
    this.emit(entry);
  }

  // Event listener methods
  addListener(listener: (entry: LogEntry) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (entry: LogEntry) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Get logs from memory
  getLogs(): LogEntry[] {
    return [...this.logQueue];
  }

  // Clear logs from memory
  clearLogs(): void {
    this.logQueue = [];
  }

  // Set max entries
  setMaxEntries(max: number): void {
    this.maxEntries = max;
  }

  getMaxEntries(): number {
    return this.maxEntries;
  }

  // Get logs by level
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logQueue.filter((entry) => entry.level === level);
  }

  // Get logs by category
  getLogsByCategory(category: LogCategory): LogEntry[] {
    return this.logQueue.filter((entry) => entry.category === category);
  }

  // Get recent logs
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logQueue.slice(-count);
  }

  // Get error logs
  getErrorLogs(): LogEntry[] {
    return this.getLogsByLevel("error");
  }

  // Get warning logs
  getWarningLogs(): LogEntry[] {
    return this.getLogsByLevel("warn");
  }
}

export const clientLogger = ClientLogger.getInstance();
export default clientLogger;
