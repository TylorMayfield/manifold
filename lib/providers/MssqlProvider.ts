import { BaseDatabaseProvider, DatabaseProviderConfig, DatabaseConnection } from './BaseDatabaseProvider';
import { ProviderConfig, ColumnInfo, TableInfo, ValidationResult, ValidationError } from './BaseProvider';

/**
 * Microsoft SQL Server Provider
 * Optimized for SQL Server-specific features and performance
 */

export interface MssqlConnection extends DatabaseConnection {
  // SQL Server specific options
  domain?: string; // For Windows authentication
  instanceName?: string; // Named instance
  encrypt?: boolean;
  trustServerCertificate?: boolean;
  enableArithAbort?: boolean;
  // Connection pooling
  pool?: {
    max?: number;
    min?: number;
    idleTimeoutMillis?: number;
  };
  // Advanced options
  options?: {
    appName?: string;
    abortTransactionOnError?: boolean;
    useUTC?: boolean;
    encrypt?: boolean;
    trustServerCertificate?: boolean;
    enableArithAbort?: boolean;
    isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE' | 'SNAPSHOT';
    requestTimeout?: number;
    cancelTimeout?: number;
  };
}

export interface MssqlProviderConfig extends ProviderConfig {
  type: 'mssql';
  connection: MssqlConnection;
  options: DatabaseProviderConfig['options'] & {
    // Delta/Change Tracking
    deltaConfig?: {
      enabled: boolean;
      method: 'change_tracking' | 'timestamp' | 'rowversion'; // SQL Server CDC methods
      trackingColumn?: string; // For timestamp method
      lastValue?: any;
    };
    // Batch export with SQL Server optimizations
    batchExport?: {
      enabled: boolean;
      batchSize: number;
      useBulkCopy?: boolean; // Use SQL Server BULK operations
      maxBatches?: number;
      pauseBetweenBatches?: number;
      noLock?: boolean; // Use NOLOCK hint to reduce locking
    };
    // SQL Server specific query hints
    queryHints?: {
      noLock?: boolean;
      readPast?: boolean;
      forceOrder?: boolean;
      maxDop?: number; // Maximum degree of parallelism
      optimize?: string; // Custom optimization hints
    };
  };
}

export class MssqlProvider extends BaseDatabaseProvider {
  protected config: MssqlProviderConfig;
  private pool: any; // SQL Server connection pool
  private sql: any; // mssql module

  constructor(config: ProviderConfig) {
    super(config);
    this.config = config as MssqlProviderConfig;
  }

  get type(): string {
    return 'mssql';
  }

  get displayName(): string {
    return 'Microsoft SQL Server';
  }

  get description(): string {
    return 'Connect to Microsoft SQL Server databases with advanced features like Change Tracking and optimized bulk operations';
  }

  get databaseType(): string {
    return 'Microsoft SQL Server';
  }

  async validateConfig(config?: any): Promise<ValidationResult> {
    const configToValidate = config ? { ...this.config, ...config } : this.config;
    const errors: ValidationError[] = [];

    // SQL Server specific validations
    if (!configToValidate.connection.host) {
      errors.push({
        field: 'connection.host',
        code: 'MISSING_HOST',
        message: 'SQL Server host is required'
      });
    }

    // Validate Change Tracking configuration
    if (configToValidate.options.deltaConfig?.enabled) {
      const method = configToValidate.options.deltaConfig.method;
      
      if (method === 'timestamp' && !configToValidate.options.deltaConfig.trackingColumn) {
        errors.push({
          field: 'options.deltaConfig.trackingColumn',
          code: 'MISSING_TRACKING_COLUMN',
          message: 'Tracking column is required for timestamp-based delta sync'
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
    
    let server = conn.host;
    if (conn.instanceName) {
      server += `\\${conn.instanceName}`;
    } else if (conn.port && conn.port !== 1433) {
      server += `,${conn.port}`;
    }

    return `Server=${server};Database=${conn.database};User Id=${conn.username};Password=${conn.password};${
      conn.encrypt !== false ? 'Encrypt=true;' : ''
    }${conn.trustServerCertificate ? 'TrustServerCertificate=true;' : ''}`;
  }

  async createConnection(): Promise<any> {
    try {
      // Dynamically import mssql module
      this.sql = await this.loadMssqlModule();

      const config = {
        server: this.config.connection.host,
        port: this.config.connection.port || 1433,
        database: this.config.connection.database,
        user: this.config.connection.username,
        password: this.config.connection.password,
        domain: this.config.connection.domain,
        connectionTimeout: this.config.connection.connectionTimeout || 15000,
        requestTimeout: this.config.connection.queryTimeout || 15000,
        pool: this.config.connection.pool || {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        },
        options: {
          encrypt: this.config.connection.encrypt !== false,
          trustServerCertificate: this.config.connection.trustServerCertificate || false,
          enableArithAbort: true,
          ...this.config.connection.options
        }
      };

      this.emitLog('info', `Connecting to SQL Server: ${config.server}\\${config.database}`);

      this.pool = await new this.sql.ConnectionPool(config).connect();
      
      this.emitLog('info', 'SQL Server connection established successfully');
      
      return this.pool;
    } catch (error) {
      throw new Error(`Failed to connect to SQL Server: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async closeConnection(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.close();
        this.pool = null;
        this.emitLog('info', 'SQL Server connection closed');
      } catch (error) {
        this.emitLog('warn', 'Error closing SQL Server connection', error);
      }
    }
  }

  async executeQuery(query: string, params?: any[]): Promise<any[]> {
    if (!this.pool) {
      throw new Error('SQL Server connection not established');
    }

    try {
      this.emitLog('debug', `Executing query: ${query.substring(0, 100)}...`);
      
      const request = this.pool.request();

      // Bind parameters if provided
      if (params && params.length > 0) {
        params.forEach((param, index) => {
          request.input(`param${index}`, param);
        });
      }

      const result = await request.query(query);
      return result.recordset || [];
    } catch (error) {
      throw new Error(`SQL Server query execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getTableList(): Promise<TableInfo[]> {
    const schema = this.config.connection.schema || 'dbo';
    
    const query = `
      SELECT 
        t.TABLE_SCHEMA,
        t.TABLE_NAME,
        t.TABLE_TYPE,
        CAST(p.rows AS INT) as ROW_COUNT,
        ep.value as TABLE_DESCRIPTION
      FROM INFORMATION_SCHEMA.TABLES t
      LEFT JOIN sys.tables st ON st.name = t.TABLE_NAME
      LEFT JOIN sys.partitions p ON st.object_id = p.object_id AND p.index_id IN (0,1)
      LEFT JOIN sys.extended_properties ep ON st.object_id = ep.major_id 
        AND ep.minor_id = 0 
        AND ep.name = 'MS_Description'
      WHERE t.TABLE_SCHEMA = @schema
        AND t.TABLE_TYPE IN ('BASE TABLE', 'VIEW')
      ORDER BY t.TABLE_SCHEMA, t.TABLE_NAME
    `;

    const request = this.pool.request();
    request.input('schema', this.sql.VarChar, schema);
    const result = await request.query(query);

    const tableInfos: TableInfo[] = [];

    for (const row of result.recordset) {
      const tableName = row.TABLE_NAME;
      const tableType = row.TABLE_TYPE === 'VIEW' ? 'view' : 'table';

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
        schema: row.TABLE_SCHEMA,
        description: row.TABLE_DESCRIPTION || undefined,
        recordCount: row.ROW_COUNT || undefined,
        columns
      });
    }

    return tableInfos;
  }

  async getTableColumns(tableName: string): Promise<ColumnInfo[]> {
    const schema = this.config.connection.schema || 'dbo';

    const query = `
      SELECT 
        c.COLUMN_NAME,
        c.DATA_TYPE,
        c.IS_NULLABLE,
        c.CHARACTER_MAXIMUM_LENGTH,
        c.NUMERIC_PRECISION,
        c.NUMERIC_SCALE,
        c.COLUMN_DEFAULT,
        ep.value as COLUMN_DESCRIPTION,
        CASE 
          WHEN pk.COLUMN_NAME IS NOT NULL THEN 1
          ELSE 0
        END as IS_PRIMARY_KEY
      FROM INFORMATION_SCHEMA.COLUMNS c
      LEFT JOIN sys.extended_properties ep ON 
        OBJECT_ID(@schema + '.' + @tableName) = ep.major_id 
        AND c.ORDINAL_POSITION = ep.minor_id
        AND ep.name = 'MS_Description'
      LEFT JOIN (
        SELECT ku.COLUMN_NAME
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
          ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
          AND tc.TABLE_SCHEMA = ku.TABLE_SCHEMA
          AND tc.TABLE_NAME = ku.TABLE_NAME
        WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
          AND tc.TABLE_SCHEMA = @schema
          AND tc.TABLE_NAME = @tableName
      ) pk ON c.COLUMN_NAME = pk.COLUMN_NAME
      WHERE c.TABLE_SCHEMA = @schema
        AND c.TABLE_NAME = @tableName
      ORDER BY c.ORDINAL_POSITION
    `;

    const request = this.pool.request();
    request.input('schema', this.sql.VarChar, schema);
    request.input('tableName', this.sql.VarChar, tableName);
    const result = await request.query(query);

    return result.recordset.map((col: any) => ({
      name: col.COLUMN_NAME,
      type: this.mapSqlServerType(col.DATA_TYPE),
      nullable: col.IS_NULLABLE === 'YES',
      primaryKey: col.IS_PRIMARY_KEY === 1,
      maxLength: col.CHARACTER_MAXIMUM_LENGTH,
      precision: col.NUMERIC_PRECISION,
      scale: col.NUMERIC_SCALE,
      defaultValue: col.COLUMN_DEFAULT,
      description: col.COLUMN_DESCRIPTION
    }));
  }

  protected async buildExtractionQuery(): Promise<string> {
    let query = await super.buildExtractionQuery();

    // Add query hints for performance
    if (this.config.options.queryHints) {
      const hints: string[] = [];

      if (this.config.options.queryHints.noLock || this.config.options.batchExport?.noLock) {
        hints.push('NOLOCK');
      }
      if (this.config.options.queryHints.readPast) {
        hints.push('READPAST');
      }
      if (this.config.options.queryHints.forceOrder) {
        hints.push('FORCE ORDER');
      }

      if (hints.length > 0) {
        // Add table hints to the FROM clause
        // Note: This is a simplified implementation
        const tablePattern = new RegExp(`FROM\\s+(\\[?\\w+\\]?\\.)?\\[?${this.config.options.tableName}\\]?`, 'i');
        if (this.config.options.tableName && tablePattern.test(query)) {
          query = query.replace(
            tablePattern,
            (match) => `${match} WITH (${hints.join(', ')})`
          );
        }
      }

      // Add OPTION clause for query-level hints
      if (this.config.options.queryHints.maxDop) {
        query += ` OPTION (MAXDOP ${this.config.options.queryHints.maxDop})`;
      }
      if (this.config.options.queryHints.optimize) {
        query += ` OPTION (${this.config.options.queryHints.optimize})`;
      }
    }

    // Add delta filtering based on method
    if (this.config.options.deltaConfig?.enabled) {
      query = await this.addDeltaFilter(query);
    }

    return query;
  }

  private async addDeltaFilter(query: string): Promise<string> {
    const deltaConfig = this.config.options.deltaConfig;
    if (!deltaConfig || !deltaConfig.enabled) {
      return query;
    }

    const method = deltaConfig.method;

    if (method === 'change_tracking') {
      // Use SQL Server Change Tracking
      return await this.buildChangeTrackingQuery();
    } else if (method === 'rowversion') {
      // Use rowversion column for change detection
      return this.addRowVersionFilter(query);
    } else if (method === 'timestamp' && deltaConfig.trackingColumn) {
      // Use timestamp column
      const whereKeyword = query.toLowerCase().includes(' where ') ? ' AND ' : ' WHERE ';
      const trackingCol = this.escapeIdentifier(deltaConfig.trackingColumn);
      const value = deltaConfig.lastValue 
        ? this.formatDateValue(deltaConfig.lastValue)
        : "'1900-01-01'";
      
      return query + whereKeyword + `${trackingCol} > ${value}`;
    }

    return query;
  }

  private async buildChangeTrackingQuery(): Promise<string> {
    // Build query using SQL Server Change Tracking
    // This requires Change Tracking to be enabled on the database and table
    const tableName = this.escapeIdentifier(this.config.options.tableName || '');
    const lastVersion = this.config.options.deltaConfig?.lastValue || 0;

    return `
      SELECT t.*, ct.SYS_CHANGE_OPERATION, ct.SYS_CHANGE_VERSION
      FROM ${tableName} AS t
      RIGHT OUTER JOIN CHANGETABLE(CHANGES ${tableName}, ${lastVersion}) AS ct
        ON t.[primary_key_column] = ct.[primary_key_column]
      WHERE ct.SYS_CHANGE_VERSION > ${lastVersion}
    `;
  }

  private addRowVersionFilter(query: string): string {
    // Assumes table has a rowversion column named 'RowVersion'
    const lastVersion = this.config.options.deltaConfig?.lastValue || '0x0000000000000000';
    const whereKeyword = query.toLowerCase().includes(' where ') ? ' AND ' : ' WHERE ';
    
    return query + whereKeyword + `RowVersion > ${lastVersion}`;
  }

  protected escapeIdentifier(identifier: string): string {
    // SQL Server uses square brackets for identifiers
    return `[${identifier.replace(/\]/g, ']]')}]`;
  }

  protected addPaginationToQuery(query: string, limit: number, offset: number): string {
    // SQL Server 2012+ uses OFFSET/FETCH
    // Remove existing OFFSET/FETCH if present
    let cleanQuery = query.replace(/\s+OFFSET\s+\d+\s+ROWS/gi, '').replace(/\s+FETCH\s+NEXT\s+\d+\s+ROWS\s+ONLY/gi, '');

    // Ensure query has ORDER BY (required for OFFSET/FETCH)
    if (!cleanQuery.toLowerCase().includes('order by')) {
      // Add a default ORDER BY
      if (this.config.options.tableName) {
        cleanQuery += ` ORDER BY (SELECT NULL)`;
      }
    }

    return `${cleanQuery} OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
  }

  protected addLimitToQuery(query: string, limit: number): string {
    // Use TOP for simple limit without offset
    if (query.toLowerCase().startsWith('select')) {
      return query.replace(/^select\s+/i, `SELECT TOP ${limit} `);
    }
    return query;
  }

  private mapSqlServerType(sqlType: string): string {
    const type = sqlType.toLowerCase();

    // Integer types
    if (type === 'int' || type === 'smallint' || type === 'tinyint' || type === 'bigint') {
      return 'integer';
    }

    // String types
    if (type.includes('char') || type === 'text' || type === 'ntext') {
      return 'string';
    }

    // Decimal/numeric types
    if (type === 'decimal' || type === 'numeric' || type === 'money' || type === 'smallmoney') {
      return 'decimal';
    }

    if (type === 'float' || type === 'real') {
      return 'decimal';
    }

    // Date/time types
    if (type === 'datetime' || type === 'datetime2' || type === 'smalldatetime' || 
        type === 'date' || type === 'time' || type === 'datetimeoffset') {
      return 'datetime';
    }

    // Boolean
    if (type === 'bit') {
      return 'boolean';
    }

    // Binary types
    if (type.includes('binary') || type === 'image' || type === 'varbinary') {
      return 'binary';
    }

    // Special types
    if (type === 'uniqueidentifier') {
      return 'uuid';
    }

    if (type === 'xml') {
      return 'xml';
    }

    if (type === 'json') {
      return 'json';
    }

    if (type === 'rowversion' || type === 'timestamp') {
      return 'binary';
    }

    // Default
    return 'string';
  }

  private formatDateValue(value: any): string {
    if (value instanceof Date) {
      // SQL Server datetime format
      return `'${value.toISOString().replace('T', ' ').substring(0, 23)}'`;
    }
    return `'${value}'`;
  }

  private async loadMssqlModule(): Promise<any> {
    try {
      // Try to load the mssql module - using eval to bypass TypeScript checking
      // @ts-ignore
      return await import('mssql' as any).catch(() => {
        throw new Error(
          'mssql module not installed. Please install it using: npm install mssql\n' +
          'Note: For production use, you may also need to install tedious: npm install tedious'
        );
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if Change Tracking is enabled on the table
   */
  async isChangeTrackingEnabled(): Promise<boolean> {
    if (!this.pool || !this.config.options.tableName) {
      return false;
    }

    try {
      const query = `
        SELECT COUNT(*) as enabled
        FROM sys.change_tracking_tables ctt
        INNER JOIN sys.tables t ON t.object_id = ctt.object_id
        WHERE t.name = @tableName
      `;

      const request = this.pool.request();
      request.input('tableName', this.sql.VarChar, this.config.options.tableName);
      const result = await request.query(query);

      return result.recordset[0].enabled > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get current Change Tracking version
   */
  async getCurrentChangeVersion(): Promise<number> {
    if (!this.pool) {
      return 0;
    }

    try {
      const result = await this.pool.request().query('SELECT CHANGE_TRACKING_CURRENT_VERSION() as version');
      return result.recordset[0].version || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Update delta tracker with the latest value
   */
  async updateDeltaTracker(newValue: any): Promise<void> {
    if (this.config.options.deltaConfig) {
      this.config.options.deltaConfig.lastValue = newValue;
      this.emitLog('info', `Updated delta tracker to: ${newValue}`);
    }
  }

  /**
   * Get maximum tracking value from the table
   */
  async getMaxTrackingValue(): Promise<any> {
    if (!this.config.options.deltaConfig?.enabled || !this.config.options.tableName) {
      return null;
    }

    const method = this.config.options.deltaConfig.method;

    if (method === 'change_tracking') {
      return await this.getCurrentChangeVersion();
    } else if (method === 'timestamp' && this.config.options.deltaConfig.trackingColumn) {
      const trackingCol = this.escapeIdentifier(this.config.options.deltaConfig.trackingColumn);
      const tableName = this.escapeIdentifier(this.config.options.tableName);
      
      const query = `SELECT MAX(${trackingCol}) as max_value FROM ${tableName}`;
      const result = await this.executeQuery(query);

      return result[0]?.max_value;
    }

    return null;
  }

  /**
   * Execute bulk insert using SQL Server's BULK INSERT capability
   */
  async bulkInsert(tableName: string, data: any[]): Promise<number> {
    if (!this.pool || !data || data.length === 0) {
      return 0;
    }

    try {
      const table = new this.sql.Table(tableName);
      
      // Configure columns based on first row
      if (data.length > 0) {
        const firstRow = data[0];
        for (const [key, value] of Object.entries(firstRow)) {
          // Infer SQL type from value
          const sqlType = this.inferSqlType(value);
          table.columns.add(key, sqlType, { nullable: true });
        }

        // Add rows
        data.forEach(row => {
          table.rows.add(...Object.values(row));
        });
      }

      const request = this.pool.request();
      await request.bulk(table);

      this.emitLog('info', `Bulk inserted ${data.length} rows into ${tableName}`);
      return data.length;
    } catch (error) {
      throw new Error(`Bulk insert failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private inferSqlType(value: any): any {
    if (value === null || value === undefined) {
      return this.sql.NVarChar;
    }

    if (typeof value === 'number') {
      return Number.isInteger(value) ? this.sql.Int : this.sql.Float;
    }

    if (typeof value === 'boolean') {
      return this.sql.Bit;
    }

    if (value instanceof Date) {
      return this.sql.DateTime;
    }

    // Default to string
    return this.sql.NVarChar;
  }
}


