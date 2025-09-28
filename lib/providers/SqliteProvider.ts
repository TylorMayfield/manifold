import Database from 'better-sqlite3';
import * as fs from 'fs';
import { BaseDatabaseProvider, DatabaseProviderConfig } from './BaseDatabaseProvider';
import { ProviderConfig, ColumnInfo, TableInfo } from './BaseProvider';

export interface SqliteProviderConfig extends ProviderConfig {
  type: 'sqlite';
  connection: {
    filePath: string;
    readonly?: boolean;
    memory?: boolean; // Use in-memory database
    timeout?: number;
    verbose?: boolean;
  };
  options: DatabaseProviderConfig['options'];
}

export class SqliteProvider extends BaseDatabaseProvider {
  private config: SqliteProviderConfig;
  private db: Database.Database | null = null;

  constructor(config: ProviderConfig) {
    super(config);
    this.config = config as SqliteProviderConfig;
  }

  get type(): string {
    return 'sqlite';
  }

  get displayName(): string {
    return 'SQLite Database';
  }

  get description(): string {
    return 'Connect to SQLite databases for data extraction and analysis';
  }

  get databaseType(): string {
    return 'SQLite';
  }

  async validateConfig(config?: Partial<SqliteProviderConfig>): Promise<any> {
    const configToValidate = config ? { ...this.config, ...config } : this.config;
    const baseValidation = await super.validateConfig(configToValidate);

    // SQLite-specific validations
    if (!configToValidate.connection.memory) {
      if (!configToValidate.connection.filePath) {
        baseValidation.errors.push({
          field: 'connection.filePath',
          code: 'MISSING_FILE_PATH',
          message: 'Database file path is required for file-based SQLite databases'
        });
      } else {
        // Check if file exists (unless it's a new database)
        try {
          if (!fs.existsSync(configToValidate.connection.filePath) && configToValidate.connection.readonly) {
            baseValidation.errors.push({
              field: 'connection.filePath',
              code: 'FILE_NOT_FOUND',
              message: 'SQLite database file not found'
            });
          }
        } catch (err) {
          baseValidation.errors.push({
            field: 'connection.filePath',
            code: 'FILE_ACCESS_ERROR',
            message: 'Unable to access SQLite database file'
          });
        }
      }
    }

    return {
      isValid: baseValidation.errors.length === 0,
      errors: baseValidation.errors
    };
  }

  buildConnectionString(): string {
    if (this.config.connection.memory) {
      return ':memory:';
    }
    return this.config.connection.filePath;
  }

  async createConnection(): Promise<Database.Database> {
    try {
      const dbPath = this.config.connection.memory ? ':memory:' : this.config.connection.filePath;
      
      this.db = new Database(dbPath, {
        readonly: this.config.connection.readonly || false,
        timeout: this.config.connection.timeout || 5000,
        verbose: this.config.connection.verbose ? console.log : undefined
      });

      // Enable WAL mode for better performance (if not readonly)
      if (!this.config.connection.readonly && !this.config.connection.memory) {
        this.db.pragma('journal_mode = WAL');
      }

      return this.db;
    } catch (error) {
      throw new Error(`Failed to connect to SQLite database: ${error}`);
    }
  }

  async closeConnection(): Promise<void> {
    if (this.db) {
      try {
        this.db.close();
        this.db = null;
      } catch (error) {
        // Ignore close errors
      }
    }
  }

  async executeQuery(query: string, params?: any[]): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database connection not established');
    }

    try {
      const stmt = this.db.prepare(query);
      
      if (query.trim().toLowerCase().startsWith('select')) {
        // SELECT query
        return stmt.all(params || []);
      } else {
        // Non-SELECT query
        const result = stmt.run(params || []);
        return [{ 
          changes: result.changes, 
          lastInsertRowid: result.lastInsertRowid 
        }];
      }
    } catch (error) {
      throw new Error(`Query execution failed: ${error}`);
    }
  }

  async getTableList(): Promise<TableInfo[]> {
    const query = `
      SELECT 
        name,
        type,
        sql
      FROM sqlite_master 
      WHERE type IN ('table', 'view')
      AND name NOT LIKE 'sqlite_%'
      ORDER BY type, name
    `;

    const results = await this.executeQuery(query);
    const tables: TableInfo[] = [];

    for (const row of results) {
      try {
        // Get row count for tables
        let recordCount: number | undefined;
        if (row.type === 'table') {
          try {
            const countResult = await this.executeQuery(`SELECT COUNT(*) as count FROM "${row.name}"`);
            recordCount = countResult[0].count;
          } catch {
            // Ignore count errors
          }
        }

        // Get column information
        let columns: ColumnInfo[] = [];
        try {
          columns = await this.getTableColumns(row.name);
        } catch {
          // Ignore column info errors
        }

        tables.push({
          name: row.name,
          type: row.type === 'view' ? 'view' : 'table',
          description: row.sql ? `${row.type} definition` : undefined,
          recordCount,
          columns
        });
      } catch (error) {
        this.emitLog('warn', `Failed to get info for ${row.type} ${row.name}`, error);
        // Still add basic table info
        tables.push({
          name: row.name,
          type: row.type === 'view' ? 'view' : 'table'
        });
      }
    }

    return tables;
  }

  async getTableColumns(tableName: string): Promise<ColumnInfo[]> {
    const query = `PRAGMA table_info("${tableName}")`;
    const results = await this.executeQuery(query);

    return results.map((row) => ({
      name: row.name,
      type: this.mapSqliteType(row.type),
      nullable: !row.notnull,
      primaryKey: !!row.pk,
      defaultValue: row.dflt_value
    }));
  }

  protected escapeIdentifier(identifier: string): string {
    // SQLite uses double quotes for identifiers
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  protected addLimitToQuery(query: string, limit: number): string {
    // Check if query already has LIMIT clause
    if (query.toLowerCase().includes(' limit ')) {
      return query;
    }
    return `${query} LIMIT ${limit}`;
  }

  protected addPaginationToQuery(query: string, limit: number, offset: number): string {
    // Remove existing LIMIT/OFFSET if present
    let cleanQuery = query.replace(/\s+LIMIT\s+\d+/gi, '').replace(/\s+OFFSET\s+\d+/gi, '');
    return `${cleanQuery} LIMIT ${limit} OFFSET ${offset}`;
  }

  private mapSqliteType(sqliteType: string): string {
    const type = sqliteType.toUpperCase();
    
    // SQLite affinity mapping
    if (type.includes('INT')) return 'integer';
    if (type.includes('CHAR') || type.includes('TEXT') || type.includes('CLOB')) return 'string';
    if (type.includes('BLOB')) return 'binary';
    if (type.includes('REAL') || type.includes('FLOA') || type.includes('DOUB')) return 'decimal';
    if (type.includes('DATE') || type.includes('TIME')) return 'datetime';
    if (type.includes('BOOL')) return 'boolean';
    
    // Default to string for unknown types
    return 'string';
  }

  // SQLite-specific utility methods
  async vacuum(): Promise<void> {
    if (!this.db) {
      throw new Error('Database connection not established');
    }
    
    this.db.exec('VACUUM');
  }

  async analyze(): Promise<void> {
    if (!this.db) {
      throw new Error('Database connection not established');
    }
    
    this.db.exec('ANALYZE');
  }

  async getDbInfo(): Promise<{
    pageSize: number;
    pageCount: number;
    freePages: number;
    fileSize: number;
    version: string;
  }> {
    if (!this.db) {
      throw new Error('Database connection not established');
    }

    const pageSize = this.db.pragma('page_size', { simple: true }) as number;
    const pageCount = this.db.pragma('page_count', { simple: true }) as number;
    const freePages = this.db.pragma('freelist_count', { simple: true }) as number;
    const version = this.db.pragma('user_version', { simple: true }) as string;

    return {
      pageSize,
      pageCount,
      freePages,
      fileSize: pageSize * pageCount,
      version
    };
  }

  async enableForeignKeys(enable: boolean = true): Promise<void> {
    if (!this.db) {
      throw new Error('Database connection not established');
    }
    
    this.db.pragma(`foreign_keys = ${enable ? 'ON' : 'OFF'}`);
  }

  async getTableIndexes(tableName: string): Promise<Array<{
    name: string;
    unique: boolean;
    columns: string[];
  }>> {
    const query = `PRAGMA index_list("${tableName}")`;
    const indexes = await this.executeQuery(query);
    
    const result = [];
    for (const index of indexes) {
      const indexInfoQuery = `PRAGMA index_info("${index.name}")`;
      const indexInfo = await this.executeQuery(indexInfoQuery);
      
      result.push({
        name: index.name,
        unique: !!index.unique,
        columns: indexInfo.map(col => col.name)
      });
    }
    
    return result;
  }

  // Override previewData to add SQLite-specific optimizations
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
        // Use ROWID for better performance if no specific order needed
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
}