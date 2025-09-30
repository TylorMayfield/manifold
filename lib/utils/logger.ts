/**
 * Logger utility for application-wide logging
 * Provides consistent logging interface across the application
 */

export interface Logger {
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  success: (...args: any[]) => void;
}

class LoggerImpl implements Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  info(...args: any[]): void {
    console.log('[INFO]', new Date().toISOString(), ...args);
  }

  warn(...args: any[]): void {
    console.warn('[WARN]', new Date().toISOString(), ...args);
  }

  error(...args: any[]): void {
    console.error('[ERROR]', new Date().toISOString(), ...args);
  }

  debug(...args: any[]): void {
    if (this.isDevelopment) {
      console.debug('[DEBUG]', new Date().toISOString(), ...args);
    }
  }

  success(...args: any[]): void {
    console.log('[SUCCESS]', new Date().toISOString(), ...args);
  }
}

export const logger = new LoggerImpl();