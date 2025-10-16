import { BaseDatabaseProvider, DatabaseProviderConfig } from './BaseDatabaseProvider';
import { ProviderConfig, ColumnInfo, TableInfo, ValidationResult, ValidationError } from './BaseProvider';

/**
 * ODBC Provider for generic database connectivity
 * Supports any ODBC-compliant database (Access, Informix, DB2, etc.)
 */

export interface OdbcProviderConfig extends ProviderConfig {
  type: 'odbc';
  connection: {
    driver: string; // ODBC driver name (e.g., 'SQL Server', 'PostgreSQL Unicode', etc.)
    host?: string;
    port?: number;
    database: string;
    username: string;
    password: string;
    dsn?: string; // Data Source Name (alternative to driver/host/port)
    connectionString?: string; // Custom connection string
    ssl?: boolean;
    connectionTimeout?: number;
    queryTimeout?: number;
    maxConnections?: number;
    schema?: string;
    // ODBC-specific options
    odbcOptions?: {
      MARS_Connection?: boolean; // Multiple Active Result Sets
      AnsiNPW?: boolean; // ANSI Null, Padding, Warnings
      ApplicationIntent?: 'ReadWrite' | 'ReadOnly';
      Encrypt?: boolean;
      TrustServerCertificate?: boolean;
    };
  };
  options: DatabaseProviderConfig['options'] & {
    // Delta/incremental support
    deltaConfig?: {
      enabled: boolean;
      trackingColumn: string; // Column to track changes (e.g., 'updated_at', 'modified_date')
      trackingType: 'timestamp' | 'integer' | 'version'; // Type of tracking column
      lastValue?: any; // Last synced value
    };
    // Batch export configuration
    batchExport?: {
      enabled: boolean;
      batchSize: number;
      maxBatches?: number; // Limit total batches
      pauseBetweenBatches?: number; // Milliseconds to pause
    };
  };
}

export class OdbcProvider extends BaseDatabaseProvider {
  protected config: OdbcProviderConfig;
  private odbc: any; // ODBC connection instance

  constructor(config: ProviderConfig) {
    super(config);
    this.config = config as OdbcProviderConfig;
  }

  get type(): string {
    return 'odbc';
  }

  get displayName(): string {
    return 'ODBC Database';
  }

  get description(): string {
    return 'Connect to any ODBC-compliant database (Access, DB2, Informix, etc.)';
  }

  get databaseType(): string {
    return `ODBC (${this.config.connection.driver || 'Generic'})`;
  }

  async validateConfig(config?: any): Promise<ValidationResult> {
    const configToValidate = config ? { ...this.config, ...config } : this.config;
    const errors: ValidationError[] = [];

    // Check for DSN or connection details
    if (!configToValidate.connection.dsn && !configToValidate.connection.driver) {
      errors.push({
        field: 'connection.driver',
        code: 'MISSING_DRIVER_OR_DSN',
        message: 'Either ODBC driver name or DSN is required'
      });
    }

    if (!configToValidate.connection.database && !configToValidate.connection.dsn) {
      errors.push({
        field: 'connection.database',
        code: 'MISSING_DATABASE',
        message: 'Database name is required when not using DSN'
      });
    }

    if (!configToValidate.connection.username) {
      errors.push({
        field: 'connection.username',
        code: 'MISSING_USERNAME',
        message: 'Username is required'
      });
    }

    // Validate delta configuration
    if (configToValidate.options.deltaConfig?.enabled) {
      if (!configToValidate.options.deltaConfig.trackingColumn) {
        errors.push({
          field: 'options.deltaConfig.trackingColumn',
          code: 'MISSING_TRACKING_COLUMN',
          message: 'Tracking column is required for delta sync'
        });
      }
    }

    // Call base validation
    const baseValidation = await super.validateConfig(configToValidate);
    errors.push(...baseValidation.errors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  buildConnectionString(): string {
    const conn = this.config.connection;

    // Use custom connection string if provided
    if (conn.connectionString) {
      return conn.connectionString;
    }

    // Use DSN if provided
    if (conn.dsn) {
      return `DSN=${conn.dsn};UID=${conn.username};PWD=${conn.password}`;
    }

    // Build connection string from components
    let connStr = `DRIVER={${conn.driver}};`;
    
    if (conn.host) {
      connStr += `SERVER=${conn.host}${conn.port ? ',' + conn.port : ''};`;
    }
    
    connStr += `DATABASE=${conn.database};`;
    connStr += `UID=${conn.username};`;
    connStr += `PWD=${conn.password};`;

    // Add ODBC-specific options
    if (conn.odbcOptions) {
      for (const [key, value] of Object.entries(conn.odbcOptions)) {
        connStr += `${key}=${value};`;
      }
    }

    return connStr;
  }

  async createConnection(): Promise<any> {
    try {
      // Dynamically import ODBC module
      // Note: Requires 'odbc' npm package to be installed
      const odbcModule = await this.loadOdbcModule();
      
      const connectionString = this.buildConnectionString();
      this.emitLog('info', `Connecting to ODBC database: ${this.sanitizeConnectionString(connectionString)}`);

      this.odbc = await odbcModule.connect(connectionString);
      
      this.emitLog('info', 'ODBC connection established successfully');
      return this.odbc;
    } catch (error) {
      throw new Error(`Failed to connect to ODBC database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async closeConnection(): Promise<void> {
    if (this.odbc) {
      try {
        await this.odbc.close();
        this.odbc = null;
        this.emitLog('info', 'ODBC connection closed');
      } catch (error) {
        this.emitLog('warn', 'Error closing ODBC connection', error);
      }
    }
  }

  async executeQuery(query: string, params?: any[]): Promise<any[]> {
    if (!this.odbc) {
      throw new Error('ODBC connection not established');
    }

    try {
      this.emitLog('debug', `Executing query: ${query.substring(0, 100)}...`);
      
      const result = params && params.length > 0
        ? await this.odbc.query(query, params)
        : await this.odbc.query(query);

      return Array.isArray(result) ? result : [result];
    } catch (error) {
      throw new Error(`ODBC query execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getTableList(): Promise<TableInfo[]> {
    try {
      // Use ODBC catalog functions to get tables
      const tables = await this.odbc.tables(
        null, // catalog
        this.config.connection.schema || null, // schema
        null, // table name pattern
        'TABLE,VIEW' // table types
      );

      const tableInfos: TableInfo[] = [];

      for (const table of tables) {
        const tableName = table.TABLE_NAME;
        const tableType = table.TABLE_TYPE?.toLowerCase().includes('view') ? 'view' : 'table';

        // Get row count for tables
        let recordCount: number | undefined;
        if (tableType === 'table') {
          try {
            const countQuery = `SELECT COUNT(*) as count FROM ${this.escapeIdentifier(tableName)}`;
            const result = await this.executeQuery(countQuery);
            recordCount = result[0]?.count || result[0]?.COUNT || 0;
          } catch {
            // Ignore count errors
          }
        }

        // Get columns
        let columns: ColumnInfo[] = [];
        try {
          columns = await this.getTableColumns(tableName);
        } catch {
          // Ignore column errors
        }

        tableInfos.push({
          name: tableName,
          type: tableType,
          description: table.REMARKS || undefined,
          schema: table.TABLE_SCHEM || undefined,
          recordCount,
          columns
        });
      }

      return tableInfos;
    } catch (error) {
      throw new Error(`Failed to get table list: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getTableColumns(tableName: string): Promise<ColumnInfo[]> {
    try {
      const columns = await this.odbc.columns(
        null, // catalog
        this.config.connection.schema || null, // schema
        tableName, // table name
        null // column name pattern
      );

      return columns.map((col: any) => ({
        name: col.COLUMN_NAME,
        type: this.mapOdbcType(col.TYPE_NAME, col.DATA_TYPE),
        nullable: col.NULLABLE === 1,
        primaryKey: false, // Will be determined separately if needed
        maxLength: col.COLUMN_SIZE,
        precision: col.DECIMAL_DIGITS,
        defaultValue: col.COLUMN_DEF
      }));
    } catch (error) {
      throw new Error(`Failed to get columns for table ${tableName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  protected async buildExtractionQuery(): Promise<string> {
    const baseQuery = await super.buildExtractionQuery();

    // Add delta filtering if enabled
    if (this.config.options.deltaConfig?.enabled && this.config.options.deltaConfig.lastValue) {
      const deltaCol = this.escapeIdentifier(this.config.options.deltaConfig.trackingColumn);
      const operator = this.getDeltaOperator();
      const value = this.formatDeltaValue(this.config.options.deltaConfig.lastValue);

      // Add WHERE clause for delta
      const whereKeyword = baseQuery.toLowerCase().includes(' where ') ? ' AND ' : ' WHERE ';
      return baseQuery + whereKeyword + `${deltaCol} ${operator} ${value}`;
    }

    return baseQuery;
  }

  protected escapeIdentifier(identifier: string): string {
    // ODBC standard uses double quotes, but this can vary by driver
    // Override this method for specific drivers if needed
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  private async loadOdbcModule(): Promise<any> {
    try {
      // Try to load the ODBC module
      // In a real implementation, you'd use: return require('odbc');
      // For now, we'll provide a mock for demonstration
      return await import('odbc').catch(() => {
        // If ODBC module not available, provide instructions
        throw new Error(
          'ODBC module not installed. Please install it using: npm install odbc\n' +
          'Note: ODBC requires native dependencies and an ODBC driver manager (unixODBC on Linux/Mac, built-in on Windows)'
        );
      });
    } catch (error) {
      throw error;
    }
  }

  private sanitizeConnectionString(connStr: string): string {
    // Remove password from connection string for logging
    return connStr.replace(/PWD=[^;]+;?/gi, 'PWD=***;');
  }

  private mapOdbcType(typeName: string, dataType: number): string {
    // Map ODBC SQL types to our standard types
    const typeUpper = typeName?.toUpperCase() || '';

    if (typeUpper.includes('INT') || typeUpper.includes('SERIAL')) return 'integer';
    if (typeUpper.includes('CHAR') || typeUpper.includes('TEXT') || typeUpper.includes('VARCHAR')) return 'string';
    if (typeUpper.includes('DECIMAL') || typeUpper.includes('NUMERIC') || typeUpper.includes('MONEY')) return 'decimal';
    if (typeUpper.includes('FLOAT') || typeUpper.includes('DOUBLE') || typeUpper.includes('REAL')) return 'decimal';
    if (typeUpper.includes('DATE') || typeUpper.includes('TIME')) return 'datetime';
    if (typeUpper.includes('BOOL') || typeUpper.includes('BIT')) return 'boolean';
    if (typeUpper.includes('BLOB') || typeUpper.includes('BINARY') || typeUpper.includes('IMAGE')) return 'binary';
    if (typeUpper.includes('JSON')) return 'json';
    if (typeUpper.includes('XML')) return 'xml';

    // Fallback to string for unknown types
    return 'string';
  }

  private getDeltaOperator(): string {
    // Return appropriate comparison operator based on tracking type
    return '>';
  }

  private formatDeltaValue(value: any): string {
    const trackingType = this.config.options.deltaConfig?.trackingType || 'timestamp';

    if (trackingType === 'timestamp') {
      // Format as SQL timestamp
      if (value instanceof Date) {
        return `'${value.toISOString().replace('T', ' ').substring(0, 19)}'`;
      }
      return `'${value}'`;
    } else if (trackingType === 'integer' || trackingType === 'version') {
      return String(value);
    }

    return `'${value}'`;
  }

  /**
   * Update the last delta value after successful sync
   */
  async updateDeltaTracker(newValue: any): Promise<void> {
    if (this.config.options.deltaConfig) {
      this.config.options.deltaConfig.lastValue = newValue;
      this.emitLog('info', `Updated delta tracker to: ${newValue}`);
    }
  }

  /**
   * Get the maximum value of the tracking column
   */
  async getMaxTrackingValue(): Promise<any> {
    if (!this.config.options.deltaConfig?.enabled || !this.config.options.tableName) {
      return null;
    }

    const trackingCol = this.escapeIdentifier(this.config.options.deltaConfig.trackingColumn);
    const tableName = this.escapeIdentifier(this.config.options.tableName);
    
    const query = `SELECT MAX(${trackingCol}) as max_value FROM ${tableName}`;
    const result = await this.executeQuery(query);

    return result[0]?.max_value || result[0]?.MAX_VALUE;
  }
}


