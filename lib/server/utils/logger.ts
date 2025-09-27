type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';
type LogCategory = 'database' | 'system' | 'etl' | 'user' | 'security' | 'job' | 'api';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any;
  source?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private log(level: LogLevel, message: string, category: LogCategory, details?: any, source?: string) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      details,
      source
    };

    // Console output for development
    const logFn = level === 'error' ? console.error : 
                  level === 'warn' ? console.warn : 
                  console.log;
    
    const prefix = `[${entry.timestamp.toISOString()}] [${level.toUpperCase()}] [${category}]`;
    const sourceInfo = source ? ` (${source})` : '';
    
    logFn(`${prefix}${sourceInfo}: ${message}`, details || '');

    // Store in memory (could be extended to store in database)
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  debug(message: string, category: LogCategory, details?: any, source?: string) {
    this.log('debug', message, category, details, source);
  }

  info(message: string, category: LogCategory, details?: any, source?: string) {
    this.log('info', message, category, details, source);
  }

  warn(message: string, category: LogCategory, details?: any, source?: string) {
    this.log('warn', message, category, details, source);
  }

  error(message: string, category: LogCategory, details?: any, source?: string) {
    this.log('error', message, category, details, source);
  }

  success(message: string, category: LogCategory, details?: any, source?: string) {
    this.log('success', message, category, details, source);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();
export type { LogLevel, LogCategory, LogEntry };