import { DataProvider, DataProviderConfig, ExecutionResult } from '../types';

export interface SQLProviderConfig extends DataProviderConfig {
  type: 'sql';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  connectionString?: string;
  query?: string;
  tableName?: string;
  dialect: 'postgresql' | 'mysql' | 'mssql' | 'oracle';
}

export class SQLProvider implements DataProvider {
  private config: SQLProviderConfig;

  constructor(config: SQLProviderConfig) {
    this.config = config;
  }

  async validate(): Promise<{ valid: boolean; error?: string }> {
    try {
      if (this.config.connectionString) {
        return { valid: true };
      }

      // Validate required fields
      const required = ['host', 'port', 'database', 'username', 'password'];
      for (const field of required) {
        if (!this.config[field as keyof SQLProviderConfig]) {
          return { valid: false, error: `${field} is required` };
        }
      }

      if (!this.config.query && !this.config.tableName) {
        return { valid: false, error: 'Either query or table name must be specified' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Validation failed: ${error}` };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const validation = await this.validate();
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Test connection based on dialect
      switch (this.config.dialect) {
        case 'postgresql':
          return await this.testPostgreSQL();
        case 'mysql':
          return await this.testMySQL();
        case 'mssql':
          return await this.testMSSQL();
        case 'oracle':
          return await this.testOracle();
        default:
          return { success: false, error: `Unsupported dialect: ${this.config.dialect}` };
      }
    } catch (error) {
      return { success: false, error: `Connection test failed: ${error}` };
    }
  }

  private async testPostgreSQL(): Promise<{ success: boolean; error?: string }> {
    try {
      const { Client } = require('pg');
      const client = new Client({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl
      });
      
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      
      return { success: true };
    } catch (error) {
      return { success: false, error: `PostgreSQL connection failed: ${error}` };
    }
  }

  private async testMySQL(): Promise<{ success: boolean; error?: string }> {
    try {
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl
      });
      
      await connection.execute('SELECT 1');
      await connection.end();
      
      return { success: true };
    } catch (error) {
      return { success: false, error: `MySQL connection failed: ${error}` };
    }
  }

  private async testMSSQL(): Promise<{ success: boolean; error?: string }> {
    try {
      const sql = require('mssql');
      const config = {
        server: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        options: {
          encrypt: this.config.ssl
        }
      };
      
      const pool = await sql.connect(config);
      await pool.request().query('SELECT 1');
      await pool.close();
      
      return { success: true };
    } catch (error) {
      return { success: false, error: `SQL Server connection failed: ${error}` };
    }
  }

  private async testOracle(): Promise<{ success: boolean; error?: string }> {
    try {
      const oracledb = require('oracledb');
      
      // Oracle connection string format
      const connectionString = `${this.config.host}:${this.config.port}/${this.config.database}`;
      
      const connection = await oracledb.getConnection({
        user: this.config.username,
        password: this.config.password,
        connectString: connectionString
      });
      
      await connection.execute('SELECT 1 FROM DUAL');
      await connection.close();
      
      return { success: true };
    } catch (error) {
      return { success: false, error: `Oracle connection failed: ${error}` };
    }
  }

  async execute(): Promise<ExecutionResult> {
    try {
      const query = this.config.query || `SELECT * FROM ${this.config.tableName}`;
      
      // Execute query based on dialect
      switch (this.config.dialect) {
        case 'postgresql':
          return await this.executePostgreSQL(query);
        case 'mysql':
          return await this.executeMySQL(query);
        case 'mssql':
          return await this.executeMSSQL(query);
        case 'oracle':
          return await this.executeOracle(query);
        default:
          throw new Error(`Unsupported dialect: ${this.config.dialect}`);
      }
    } catch (error) {
      throw new Error(`SQL execution failed: ${error}`);
    }
  }

  private async executePostgreSQL(query: string): Promise<ExecutionResult> {
    const { Client } = require('pg');
    const client = new Client({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl
    });
    
    await client.connect();
    const result = await client.query(query);
    await client.end();
    
    return {
      data: result.rows,
      metadata: {
        query,
        dialect: 'postgresql',
        rowCount: result.rows.length,
        columns: result.fields?.map(f => f.name) || [],
        executionTime: Date.now()
      }
    };
  }

  private async executeMySQL(query: string): Promise<ExecutionResult> {
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl
    });
    
    const [rows, fields] = await connection.execute(query);
    await connection.end();
    
    return {
      data: rows,
      metadata: {
        query,
        dialect: 'mysql',
        rowCount: Array.isArray(rows) ? rows.length : 0,
        columns: fields?.map(f => f.name) || [],
        executionTime: Date.now()
      }
    };
  }

  private async executeMSSQL(query: string): Promise<ExecutionResult> {
    const sql = require('mssql');
    const config = {
      server: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      options: {
        encrypt: this.config.ssl
      }
    };
    
    const pool = await sql.connect(config);
    const result = await pool.request().query(query);
    await pool.close();
    
    return {
      data: result.recordset,
      metadata: {
        query,
        dialect: 'mssql',
        rowCount: result.recordset.length,
        columns: result.recordset.columns || [],
        executionTime: Date.now()
      }
    };
  }

  private async executeOracle(query: string): Promise<ExecutionResult> {
    const oracledb = require('oracledb');
    const connectionString = `${this.config.host}:${this.config.port}/${this.config.database}`;
    
    const connection = await oracledb.getConnection({
      user: this.config.username,
      password: this.config.password,
      connectString: connectionString
    });
    
    const result = await connection.execute(query);
    await connection.close();
    
    return {
      data: result.rows || [],
      metadata: {
        query,
        dialect: 'oracle',
        rowCount: result.rows?.length || 0,
        columns: result.metaData?.map(m => m.name) || [],
        executionTime: Date.now()
      }
    };
  }

  async preview(limit: number = 10): Promise<ExecutionResult> {
    const limitQuery = this.config.query 
      ? `${this.config.query} LIMIT ${limit}`
      : `SELECT * FROM ${this.config.tableName} LIMIT ${limit}`;
    
    const originalQuery = this.config.query;
    this.config.query = limitQuery;
    
    try {
      const result = await this.execute();
      return result;
    } finally {
      this.config.query = originalQuery;
    }
  }

  async getSchema(): Promise<any> {
    try {
      // Mock schema for now
      // TODO: Implement actual schema introspection based on dialect
      return {
        tables: [
          {
            name: this.config.tableName || 'users',
            columns: [
              { name: 'id', type: 'INTEGER', nullable: false, primaryKey: true },
              { name: 'name', type: 'VARCHAR', nullable: true },
              { name: 'email', type: 'VARCHAR', nullable: true },
              { name: 'created_at', type: 'TIMESTAMP', nullable: true }
            ]
          }
        ],
        dialect: this.config.dialect
      };
    } catch (error) {
      throw new Error(`Schema introspection failed: ${error}`);
    }
  }

  getConfig(): SQLProviderConfig {
    return this.config;
  }
}
