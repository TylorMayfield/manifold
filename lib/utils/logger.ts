import { v4 as uuidv4 } from "uuid";
import { LogEntry, LogLevel, LogCategory } from "../../types/logs";

class Logger {
  private static instance: Logger;
  private listeners: ((entry: LogEntry) => void)[] = [];
  private maxEntries: number = 1000;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
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
      id: uuidv4(),
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

  // Category-specific logging methods
  database(
    message: string,
    level: LogLevel = "info",
    details?: any,
    source?: string,
    projectId?: string
  ): void {
    const entry = this.createLogEntry(
      level,
      "database",
      message,
      details,
      source,
      projectId
    );
    this.emit(entry);
  }

  fileImport(
    message: string,
    level: LogLevel = "info",
    details?: any,
    source?: string,
    projectId?: string,
    dataSourceId?: string
  ): void {
    const entry = this.createLogEntry(
      level,
      "file-import",
      message,
      details,
      source,
      projectId,
      dataSourceId
    );
    this.emit(entry);
  }

  dataProcessing(
    message: string,
    level: LogLevel = "info",
    details?: any,
    source?: string,
    projectId?: string,
    dataSourceId?: string
  ): void {
    const entry = this.createLogEntry(
      level,
      "data-processing",
      message,
      details,
      source,
      projectId,
      dataSourceId
    );
    this.emit(entry);
  }

  userAction(
    message: string,
    level: LogLevel = "info",
    details?: any,
    source?: string,
    projectId?: string
  ): void {
    const entry = this.createLogEntry(
      level,
      "user-action",
      message,
      details,
      source,
      projectId
    );
    this.emit(entry);
  }

  api(
    message: string,
    level: LogLevel = "info",
    details?: any,
    source?: string
  ): void {
    const entry = this.createLogEntry(level, "api", message, details, source);
    this.emit(entry);
  }

  electron(
    message: string,
    level: LogLevel = "info",
    details?: any,
    source?: string
  ): void {
    const entry = this.createLogEntry(
      level,
      "electron",
      message,
      details,
      source
    );
    this.emit(entry);
  }

  ui(
    message: string,
    level: LogLevel = "info",
    details?: any,
    source?: string
  ): void {
    const entry = this.createLogEntry(level, "ui", message, details, source);
    this.emit(entry);
  }

  // Listener management
  addListener(listener: (entry: LogEntry) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (entry: LogEntry) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Configuration
  setMaxEntries(max: number): void {
    this.maxEntries = max;
  }

  getMaxEntries(): number {
    return this.maxEntries;
  }
}

export const logger = Logger.getInstance();
export default logger;
