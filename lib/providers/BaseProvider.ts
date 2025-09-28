import { EventEmitter } from 'events';

// Common interfaces for all providers
export interface ProviderConfig {
  id: string;
  name: string;
  type: string;
  schedule?: {
    cron?: string;
    timezone?: string;
    isOneTime?: boolean;
    isEnabled?: boolean;
    nextRunAt?: Date;
    lastRunAt?: Date;
  };
  connection: Record<string, any>;
  options: Record<string, any>;
}

export interface ExecutionContext {
  jobId?: string;
  executionId: string;
  dataSourceId: string;
  projectId: string;
  userId?: string;
  isTest?: boolean;
  abortSignal?: AbortSignal;
  onProgress?: (progress: ProgressInfo) => void;
  onLog?: (level: LogLevel, message: string, details?: any) => void;
}

export interface ProgressInfo {
  percent: number;
  currentStep?: string;
  message?: string;
  recordsProcessed?: number;
  totalRecords?: number;
  bytesProcessed?: number;
  totalBytes?: number;
  estimatedTimeRemaining?: number;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: string[];
}

export interface ValidationError {
  field?: string;
  code: string;
  message: string;
  details?: any;
}

export interface ExecutionResult {
  success: boolean;
  recordsProcessed: number;
  bytesProcessed?: number;
  duration: number;
  metadata?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
}

export interface TableInfo {
  name: string;
  schema?: string;
  type: 'table' | 'view' | 'materialized_view';
  description?: string;
  recordCount?: number;
  columns?: ColumnInfo[];
  lastModified?: Date;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey?: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
  description?: string;
  defaultValue?: any;
}

export interface TestConnectionResult {
  success: boolean;
  message?: string;
  latency?: number;
  version?: string;
  error?: string;
}

// Abstract base class that all providers should extend
export abstract class BaseProvider extends EventEmitter {
  protected config: ProviderConfig;
  protected isRunning: boolean = false;
  protected currentContext?: ExecutionContext;

  constructor(config: ProviderConfig) {
    super();
    this.config = config;
  }

  /**
   * Get the provider type (e.g., 'csv', 'postgresql', 'mysql')
   */
  abstract get type(): string;

  /**
   * Get display name for this provider type
   */
  abstract get displayName(): string;

  /**
   * Get description of what this provider does
   */
  abstract get description(): string;

  /**
   * Validate the provider configuration
   */
  abstract validateConfig(config?: Partial<ProviderConfig>): Promise<ValidationResult>;

  /**
   * Test connection with the current configuration
   */
  abstract testConnection(): Promise<TestConnectionResult>;

  /**
   * Main execution method - extracts data and returns results
   */
  abstract run(ctx: ExecutionContext): Promise<ExecutionResult>;

  /**
   * Get available tables/datasets (optional - not all providers support this)
   */
  async listAvailableTables?(): Promise<TableInfo[]>;

  /**
   * Get schema information for a specific table (optional)
   */
  async getTableSchema?(tableName: string): Promise<ColumnInfo[]>;

  /**
   * Get a preview of data (optional - useful for UI)
   */
  async previewData?(options?: { limit?: number; tableName?: string }): Promise<any[]>;

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    this.isRunning = false;
    this.currentContext = undefined;
    this.removeAllListeners();
  }

  /**
   * Get current execution state
   */
  getExecutionState(): {
    isRunning: boolean;
    context?: ExecutionContext;
    startedAt?: Date;
  } {
    return {
      isRunning: this.isRunning,
      context: this.currentContext,
      startedAt: this.currentContext ? new Date() : undefined
    };
  }

  /**
   * Abort current execution
   */
  async abort(): Promise<void> {
    if (this.currentContext?.abortSignal) {
      // Trigger abort signal if available
      (this.currentContext.abortSignal as any).abort?.();
    }
    this.isRunning = false;
    this.emit('aborted');
  }

  // Helper methods for providers to use
  protected emitProgress(progress: ProgressInfo): void {
    this.currentContext?.onProgress?.(progress);
    this.emit('progress', progress);
  }

  protected emitLog(level: LogLevel, message: string, details?: any): void {
    this.currentContext?.onLog?.(level, message, details);
    this.emit('log', { level, message, details, timestamp: new Date() });
  }

  protected checkAborted(): void {
    if (this.currentContext?.abortSignal?.aborted) {
      throw new Error('Execution was aborted');
    }
  }

  protected formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  protected formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }

  protected validateRequiredFields(data: any, requiredFields: string[]): ValidationError[] {
    const errors: ValidationError[] = [];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push({
          field,
          code: 'REQUIRED_FIELD_MISSING',
          message: `${field} is required`
        });
      }
    }
    
    return errors;
  }

  protected createExecutionError(
    code: string, 
    message: string, 
    originalError?: any
  ): ExecutionResult {
    return {
      success: false,
      recordsProcessed: 0,
      duration: 0,
      error: {
        code,
        message,
        stack: originalError?.stack
      }
    };
  }

  // Schedule-related helper methods
  protected getNextRunTime(): Date | undefined {
    if (!this.config.schedule?.cron || !this.config.schedule?.isEnabled) {
      return undefined;
    }

    // This would integrate with a cron parser library
    // For now, return a simple implementation
    const now = new Date();
    const nextRun = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    return nextRun;
  }

  protected updateScheduleMetadata(lastRunAt: Date, success: boolean): void {
    if (this.config.schedule) {
      this.config.schedule.lastRunAt = lastRunAt;
      if (success) {
        this.config.schedule.nextRunAt = this.getNextRunTime();
      }
    }
  }
}

// Factory for creating provider instances
export class ProviderFactory {
  private static providerTypes = new Map<string, new (config: ProviderConfig) => BaseProvider>();

  static registerProvider(type: string, providerClass: new (config: ProviderConfig) => BaseProvider): void {
    this.providerTypes.set(type, providerClass);
  }

  static createProvider(config: ProviderConfig): BaseProvider {
    const ProviderClass = this.providerTypes.get(config.type);
    if (!ProviderClass) {
      throw new Error(`Unknown provider type: ${config.type}`);
    }
    return new ProviderClass(config);
  }

  static getAvailableTypes(): string[] {
    return Array.from(this.providerTypes.keys());
  }

  static getProviderInfo(type: string): { displayName: string; description: string } | null {
    const ProviderClass = this.providerTypes.get(type);
    if (!ProviderClass) {
      return null;
    }
    
    // Create a temporary instance to get info
    const tempConfig: ProviderConfig = {
      id: 'temp',
      name: 'temp',
      type,
      connection: {},
      options: {}
    };
    const instance = new ProviderClass(tempConfig);
    const info = {
      displayName: instance.displayName,
      description: instance.description
    };
    instance.dispose();
    return info;
  }
}