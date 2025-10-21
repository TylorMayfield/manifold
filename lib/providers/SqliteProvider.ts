import { DataProvider, DataProviderConfig, ExecutionResult } from '../types';

export interface SQLiteProviderConfig extends DataProviderConfig {
  type: 'sqlite';
  filePath: string;
  query?: string;
  tableName?: string;
}

export class SQLiteProvider implements DataProvider {
  private config: SQLiteProviderConfig;

  constructor(config: SQLiteProviderConfig) {
    this.config = config;
  }

  async validate(): Promise<{ valid: boolean; error?: string }> {
    try {
      // Basic validation
      if (!this.config.filePath) {
        return { valid: false, error: 'File path is required' };
      }

      if (!this.config.query && !this.config.tableName) {
        return { valid: false, error: 'Either query or table name must be specified' };
      }

      // Check if file exists (basic check)
      const fs = await import('fs/promises');
      try {
        await fs.access(this.config.filePath);
      } catch (error) {
        return { valid: false, error: `SQLite file not found: ${this.config.filePath}` };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Validation failed: ${error}` };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const Database = require('better-sqlite3');
      const db = new Database(this.config.filePath);
      
      try {
        // Test basic query
        const result = db.prepare('SELECT 1 as test').get();
        return { success: result?.test === 1 };
      } finally {
        db.close();
      }
    } catch (error) {
      return { success: false, error: `Connection failed: ${error}` };
    }
  }

  async execute(): Promise<ExecutionResult> {
    try {
      const query = this.config.query || `SELECT * FROM ${this.config.tableName}`;
      
      // Use better-sqlite3 for synchronous operations (better performance)
      const Database = require('better-sqlite3');
      const db = new Database(this.config.filePath);
      
      try {
        const stmt = db.prepare(query);
        const rows = stmt.all();
        
        return {
          data: rows,
          metadata: {
            query,
            rowCount: rows.length,
            columns: rows.length > 0 ? Object.keys(rows[0]) : [],
            executionTime: Date.now()
          }
        };
      } finally {
        db.close();
      }
    } catch (error) {
      throw new Error(`SQLite execution failed: ${error}`);
    }
  }

  async preview(limit: number = 10): Promise<ExecutionResult> {
    const query = this.config.query || `SELECT * FROM ${this.config.tableName} LIMIT ${limit}`;
    this.config.query = query;
    return this.execute();
  }

  async getSchema(): Promise<any> {
    try {
      // Mock schema for now
      // TODO: Implement actual schema introspection
      return {
        tables: [
          {
            name: this.config.tableName || 'main_table',
            columns: [
              { name: 'id', type: 'INTEGER', nullable: false, primaryKey: true },
              { name: 'name', type: 'TEXT', nullable: true },
              { name: 'created_at', type: 'DATETIME', nullable: true }
            ]
          }
        ]
      };
    } catch (error) {
      throw new Error(`Schema introspection failed: ${error}`);
    }
  }

  getConfig(): SQLiteProviderConfig {
    return this.config;
  }
}