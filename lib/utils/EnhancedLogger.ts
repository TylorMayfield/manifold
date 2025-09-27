import { v4 as uuidv4 } from "uuid";
import { LogEntry, LogLevel, LogCategory } from "../../types/logs";
// import { DatabaseLogger } from "../services/DatabaseLogger"; // Server-side only

class EnhancedLogger {
  private static instance: EnhancedLogger;
  private listeners: ((entry: LogEntry) => void)[] = [];
  private maxEntries: number = 1000;
  private dbLogger: any = null; // DatabaseLogger | null = null; // Server-side only
  private logQueue: LogEntry[] = [];
  private isProcessingQueue: boolean = false;

  static getInstance(): EnhancedLogger {
    if (!EnhancedLogger.instance) {
      EnhancedLogger.instance = new EnhancedLogger();
    }
    return EnhancedLogger.instance;
  }

  // Initialize database logging (server-side only)
  async initializeDatabaseLogging(): Promise<void> {
    try {
      // Server-side database logging is not available in client-side logger
      console.log(
        "Enhanced database logging not available in client-side logger"
      );
    } catch (error) {
      console.warn("Failed to initialize enhanced database logging:", error);
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
    } else {
      // Queue logs if database logger is not available yet
      this.logQueue.push(entry);
      if (this.logQueue.length > 1000) {
        this.logQueue.shift(); // Remove oldest log if queue is too large
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

  // Process queued logs
  private async processLogQueue(): Promise<void> {
    if (
      this.isProcessingQueue ||
      !this.dbLogger ||
      this.logQueue.length === 0
    ) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const logsToProcess = [...this.logQueue];
      this.logQueue = [];

      for (const entry of logsToProcess) {
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
          console.error("Failed to process queued log:", error);
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Public logging methods (async)
  async debug(
    message: string,
    details?: any,
    source?: string,
    projectId?: string,
    dataSourceId?: string
  ): Promise<void> {
    const entry = this.createLogEntry(
      "debug",
      "system",
      message,
      details,
      source,
      projectId,
      dataSourceId
    );
    await this.emit(entry);
  }

  async info(
    message: string,
    category: LogCategory = "system",
    details?: any,
    source?: string,
    projectId?: string,
    dataSourceId?: string
  ): Promise<void> {
    const entry = this.createLogEntry(
      "info",
      category,
      message,
      details,
      source,
      projectId,
      dataSourceId
    );
    await this.emit(entry);
  }

  async warn(
    message: string,
    category: LogCategory = "system",
    details?: any,
    source?: string,
    projectId?: string,
    dataSourceId?: string
  ): Promise<void> {
    const entry = this.createLogEntry(
      "warn",
      category,
      message,
      details,
      source,
      projectId,
      dataSourceId
    );
    await this.emit(entry);
  }

  async error(
    message: string,
    category: LogCategory = "system",
    details?: any,
    source?: string,
    projectId?: string,
    dataSourceId?: string
  ): Promise<void> {
    const entry = this.createLogEntry(
      "error",
      category,
      message,
      details,
      source,
      projectId,
      dataSourceId
    );
    await this.emit(entry);
  }

  async success(
    message: string,
    category: LogCategory = "system",
    details?: any,
    source?: string,
    projectId?: string,
    dataSourceId?: string
  ): Promise<void> {
    const entry = this.createLogEntry(
      "success",
      category,
      message,
      details,
      source,
      projectId,
      dataSourceId
    );
    await this.emit(entry);
  }

  // Synchronous versions for backward compatibility
  debugSync(
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
    this.emit(entry).catch((error) =>
      console.error("Failed to emit log:", error)
    );
  }

  infoSync(
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
    this.emit(entry).catch((error) =>
      console.error("Failed to emit log:", error)
    );
  }

  warnSync(
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
    this.emit(entry).catch((error) =>
      console.error("Failed to emit log:", error)
    );
  }

  errorSync(
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
    this.emit(entry).catch((error) =>
      console.error("Failed to emit log:", error)
    );
  }

  successSync(
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
    this.emit(entry).catch((error) =>
      console.error("Failed to emit log:", error)
    );
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

  // Get database logger instance
  getDatabaseLogger(): any | null {
    return this.dbLogger;
  }

  // Get queued logs count
  getQueuedLogsCount(): number {
    return this.logQueue.length;
  }

  // Clear queued logs
  clearQueuedLogs(): void {
    this.logQueue = [];
  }

  // Set max entries
  setMaxEntries(max: number): void {
    this.maxEntries = max;
  }

  getMaxEntries(): number {
    return this.maxEntries;
  }
}

export const enhancedLogger = EnhancedLogger.getInstance();
export default enhancedLogger;
