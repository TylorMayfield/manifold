import {
  BaseProvider,
  ProviderConfig,
  ExecutionContext,
  ExecutionResult,
  ValidationResult,
  ValidationError,
  TestConnectionResult,
  ColumnInfo,
  ProgressInfo,
  TableInfo
} from './BaseProvider';

export interface DatabaseConnection {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  connectionTimeout?: number;
  queryTimeout?: number;
  maxConnections?: number;
  schema?: string; // For PostgreSQL
}

export interface DatabaseProviderConfig extends ProviderConfig {
  connection: DatabaseConnection;
  options: {
    query?: string;
    tableName?: string;
    batchSize?: number;
    streaming?: boolean;
    includeSchema?: boolean;
    dateFields?: string[];
    transformQuery?: string; // SQL transformation
    customWhereClause?: string;
    orderBy?: string;
    limit?: number;
    offset?: number;
  };
}

export abstract class BaseDatabaseProvider extends BaseProvider {
  protected config: DatabaseProviderConfig;
  protected connection: any; // Database-specific connection object

  constructor(config: ProviderConfig) {
    super(config);
    this.config = config as DatabaseProviderConfig;
  }

  abstract get databaseType(): string;
  abstract createConnection(): Promise<any>;
  abstract closeConnection(): Promise<void>;
  abstract executeQuery(query: string, params?: any[]): Promise<any[]>;
  abstract getTableList(): Promise<TableInfo[]>;
  abstract getTableColumns(tableName: string): Promise<ColumnInfo[]>;
  abstract buildConnectionString(): string;

  async validateConfig(config?: Partial<DatabaseProviderConfig>): Promise<ValidationResult> {
    const configToValidate = config ? { ...this.config, ...config } : this.config;
    const errors: ValidationError[] = [];

    // Validate connection parameters
    if (!configToValidate.connection.host) {
      errors.push({
        field: 'connection.host',
        code: 'MISSING_HOST',
        message: 'Database host is required'
      });
    }

    if (!configToValidate.connection.port || configToValidate.connection.port <= 0) {
      errors.push({
        field: 'connection.port',
        code: 'INVALID_PORT',
        message: 'Valid port number is required'
      });
    }

    if (!configToValidate.connection.database) {
      errors.push({
        field: 'connection.database',
        code: 'MISSING_DATABASE',
        message: 'Database name is required'
      });
    }

    if (!configToValidate.connection.username) {
      errors.push({
        field: 'connection.username',
        code: 'MISSING_USERNAME',
        message: 'Database username is required'
      });
    }

    // Validate that either query or tableName is provided
    if (!configToValidate.options.query && !configToValidate.options.tableName) {
      errors.push({
        field: 'options',
        code: 'MISSING_QUERY_OR_TABLE',
        message: 'Either a SQL query or table name is required'
      });
    }

    // Validate batch size
    if (configToValidate.options.batchSize && configToValidate.options.batchSize <= 0) {
      errors.push({
        field: 'options.batchSize',
        code: 'INVALID_BATCH_SIZE',
        message: 'Batch size must be a positive number'
      });
    }

    // Validate SQL query syntax (basic check)
    if (configToValidate.options.query) {
      const query = configToValidate.options.query.trim().toLowerCase();
      if (!query.startsWith('select')) {
        errors.push({
          field: 'options.query',
          code: 'INVALID_QUERY',
          message: 'Only SELECT queries are allowed for data extraction'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async testConnection(): Promise<TestConnectionResult> {
    const startTime = Date.now();

    try {
      // Test database connection
      await this.createConnection();
      
      // Test a simple query
      const testQuery = this.getTestQuery();
      await this.executeQuery(testQuery);
      
      await this.closeConnection();

      const latency = Date.now() - startTime;

      return {
        success: true,
        message: `Successfully connected to ${this.databaseType} database`,
        latency
      };

    } catch (error) {
      try {
        await this.closeConnection();
      } catch {
        // Ignore cleanup errors
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        latency: Date.now() - startTime
      };
    }
  }

  async run(ctx: ExecutionContext): Promise<ExecutionResult> {
    this.isRunning = true;
    this.currentContext = ctx;
    const startTime = Date.now();

    try {
      this.emitLog('info', `Starting ${this.databaseType} data extraction`);
      
      // Create database connection
      await this.createConnection();
      
      // Build and execute query
      const query = await this.buildExtractionQuery();
      const results = await this.executeExtractionQuery(query, ctx);
      
      await this.closeConnection();

      const duration = Date.now() - startTime;
      this.updateScheduleMetadata(new Date(), true);

      this.emitLog('info', `Database extraction completed: ${results.recordsProcessed} records in ${this.formatDuration(duration)}`);

      return {
        success: true,
        recordsProcessed: results.recordsProcessed,
        bytesProcessed: results.bytesProcessed,
        duration,
        metadata: {
          database: this.config.connection.database,
          host: this.config.connection.host,
          query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
          columns: results.columns,
          tableInfo: results.tableInfo
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateScheduleMetadata(new Date(), false);
      
      this.emitLog('error', 'Database extraction failed', error);
      
      try {
        await this.closeConnection();
      } catch {
        // Ignore cleanup errors
      }
      
      return this.createExecutionError(
        'DATABASE_EXTRACTION_FAILED',
        error instanceof Error ? error.message : String(error),
        error
      );
    } finally {
      this.isRunning = false;
      this.currentContext = undefined;
    }
  }

  async listAvailableTables(): Promise<TableInfo[]> {
    try {
      await this.createConnection();
      const tables = await this.getTableList();
      await this.closeConnection();
      return tables;
    } catch (error) {
      try {
        await this.closeConnection();
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  async getTableSchema(tableName: string): Promise<ColumnInfo[]> {
    try {
      await this.createConnection();
      const columns = await this.getTableColumns(tableName);
      await this.closeConnection();
      return columns;
    } catch (error) {
      try {
        await this.closeConnection();
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  async previewData(options: { limit?: number; tableName?: string } = {}): Promise<any[]> {
    const limit = options.limit || 10;
    const tableName = options.tableName || this.config.options.tableName;

    try {
      await this.createConnection();
      
      let query: string;
      if (this.config.options.query) {
        // Use custom query with LIMIT
        query = this.addLimitToQuery(this.config.options.query, limit);
      } else if (tableName) {
        // Simple table query
        query = `SELECT * FROM ${this.escapeIdentifier(tableName)} LIMIT ${limit}`;
      } else {
        throw new Error('No query or table name specified for preview');
      }

      const results = await this.executeQuery(query);
      await this.closeConnection();
      
      return results;
    } catch (error) {
      try {
        await this.closeConnection();
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  protected async buildExtractionQuery(): Promise<string> {
    if (this.config.options.query) {
      // Use custom query
      let query = this.config.options.query;
      
      // Add WHERE clause if specified
      if (this.config.options.customWhereClause) {
        const whereKeyword = query.toLowerCase().includes(' where ') ? ' AND ' : ' WHERE ';
        query += whereKeyword + this.config.options.customWhereClause;
      }
      
      // Add ORDER BY if specified
      if (this.config.options.orderBy) {
        query += ` ORDER BY ${this.config.options.orderBy}`;
      }
      
      // Add LIMIT and OFFSET if specified
      if (this.config.options.limit) {
        query += ` LIMIT ${this.config.options.limit}`;
      }
      
      if (this.config.options.offset) {
        query += ` OFFSET ${this.config.options.offset}`;
      }
      
      return query;
    } else if (this.config.options.tableName) {
      // Build query from table name
      let query = `SELECT * FROM ${this.escapeIdentifier(this.config.options.tableName)}`;
      
      if (this.config.options.customWhereClause) {
        query += ` WHERE ${this.config.options.customWhereClause}`;
      }
      
      if (this.config.options.orderBy) {
        query += ` ORDER BY ${this.config.options.orderBy}`;
      }
      
      if (this.config.options.limit) {
        query += ` LIMIT ${this.config.options.limit}`;
      }
      
      if (this.config.options.offset) {
        query += ` OFFSET ${this.config.options.offset}`;
      }
      
      return query;
    } else {
      throw new Error('No query or table name specified');
    }
  }

  protected async executeExtractionQuery(
    query: string, 
    ctx: ExecutionContext
  ): Promise<{
    recordsProcessed: number;
    bytesProcessed: number;
    columns: string[];
    tableInfo?: TableInfo;
  }> {
    const batchSize = this.config.options.batchSize || 1000;
    let recordsProcessed = 0;
    let bytesProcessed = 0;
    let columns: string[] = [];
    let tableInfo: TableInfo | undefined;

    if (this.config.options.streaming && batchSize > 0) {
      // Streaming execution for large datasets
      let offset = this.config.options.offset || 0;
      let hasMoreData = true;

      while (hasMoreData) {
        this.checkAborted();

        // Build batched query
        const batchQuery = this.addPaginationToQuery(query, batchSize, offset);
        const batchResults = await this.executeQuery(batchQuery);

        if (batchResults.length === 0) {
          hasMoreData = false;
          break;
        }

        // Get columns from first batch
        if (recordsProcessed === 0 && batchResults.length > 0) {
          columns = Object.keys(batchResults[0]);
          
          // Get table info if using a single table
          if (this.config.options.tableName) {
            try {
              const tableColumns = await this.getTableColumns(this.config.options.tableName);
              tableInfo = {
                name: this.config.options.tableName,
                type: 'table',
                columns: tableColumns,
                recordCount: recordsProcessed // Will be updated
              };
            } catch (err) {
              this.emitLog('warn', 'Failed to get table info', err);
            }
          }
        }

        // Process batch results
        for (const row of batchResults) {
          // Here you would typically insert the row into your target database
          // For now, we'll just count and estimate size
          recordsProcessed++;
          bytesProcessed += this.estimateRowSize(row);
        }

        // Emit progress
        const progress: ProgressInfo = {
          percent: this.config.options.limit ? 
            Math.min((recordsProcessed / this.config.options.limit) * 100, 99) : 
            Math.min((recordsProcessed / 10000) * 100, 99), // Rough estimate
          recordsProcessed,
          currentStep: `Processed ${recordsProcessed.toLocaleString()} records`,
          bytesProcessed
        };

        this.emitProgress(progress);

        offset += batchSize;

        // Check if we got fewer results than batch size (end of data)
        if (batchResults.length < batchSize) {
          hasMoreData = false;
        }
      }
    } else {
      // Single query execution
      const results = await this.executeQuery(query);
      recordsProcessed = results.length;

      if (results.length > 0) {
        columns = Object.keys(results[0]);
        
        for (const row of results) {
          bytesProcessed += this.estimateRowSize(row);
        }
      }

      // Get table info
      if (this.config.options.tableName) {
        try {
          const tableColumns = await this.getTableColumns(this.config.options.tableName);
          tableInfo = {
            name: this.config.options.tableName,
            type: 'table',
            columns: tableColumns,
            recordCount: recordsProcessed
          };
        } catch (err) {
          this.emitLog('warn', 'Failed to get table info', err);
        }
      }

      this.emitProgress({
        percent: 100,
        recordsProcessed,
        currentStep: 'Extraction completed',
        bytesProcessed
      });
    }

    return {
      recordsProcessed,
      bytesProcessed,
      columns,
      tableInfo
    };
  }

  protected getTestQuery(): string {
    return 'SELECT 1 as test_connection';
  }

  protected addLimitToQuery(query: string, limit: number): string {
    // Simple implementation - database-specific providers can override
    return `${query} LIMIT ${limit}`;
  }

  protected addPaginationToQuery(query: string, limit: number, offset: number): string {
    // Simple implementation - database-specific providers can override
    return `${query} LIMIT ${limit} OFFSET ${offset}`;
  }

  protected escapeIdentifier(identifier: string): string {
    // Default implementation - database-specific providers should override
    return `"${identifier}"`;
  }

  private estimateRowSize(row: any): number {
    // Rough estimate of row size in bytes
    return JSON.stringify(row).length;
  }

  async dispose(): Promise<void> {
    try {
      await this.closeConnection();
    } catch (error) {
      // Ignore cleanup errors
    }
    await super.dispose();
  }
}