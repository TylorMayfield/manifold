import { v4 as uuidv4 } from "uuid";
import { LogEntry, LogLevel, LogCategory } from "../../types/logs";
// import { DatabaseLogger } from "../services/DatabaseLogger"; // Server-side only

class Logger {
  private static instance: Logger;
  private listeners: ((entry: LogEntry) => void)[] = [];
  private maxEntries: number = 1000;
  private dbLogger: any = null; // DatabaseLogger | null = null; // Server-side only

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Initialize database logging (server-side only)
  async initializeDatabaseLogging(): Promise<void> {
    try {
      // Server-side database logging is not available in client-side logger
      console.log("Database logging not available in client-side logger");
    } catch (error) {
      console.warn("Failed to initialize database logging:", error);
      this.dbLogger = null;
    }
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

  private async emit(entry: LogEntry): Promise<void> {
    // Emit to listeners
    this.listeners.forEach((listener) => listener(entry));

    // Log to database if available
    if (this.dbLogger) {
      try {
        await this.dbLogger.logAppEvent(
          entry.level,
          entry.category,
          entry.message,
          entry.details,
          entry.source,
          entry.projectId,
          entry.dataSourceId
        );
      } catch (error) {
        // Fallback to console if database logging fails
        console.error("Failed to log to database:", error);
      }
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
