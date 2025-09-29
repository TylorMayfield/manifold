import { logger } from '../utils/logger'
import { DataProviderConfig, ImportProgress } from '../../types'
import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'

export interface SQLParseResult {
  statements: SQLStatement[]
  tables: string[]
  errors: string[]
  warnings: string[]
}

export interface SQLStatement {
  type: 'DDL' | 'DML' | 'DCL' | 'OTHER'
  statement: string
  table?: string
  operation?: string
  lineNumber?: number
}

export interface SQLTableInfo {
  name: string
  columns: SQLColumnInfo[]
  indexes: string[]
  constraints: string[]
  dataRows?: number
}

export interface SQLColumnInfo {
  name: string
  type: string
  nullable: boolean
  defaultValue?: string
  primaryKey?: boolean
  unique?: boolean
}

export class SQLDataSourceService {
  private static instance: SQLDataSourceService

  static getInstance(): SQLDataSourceService {
    if (!SQLDataSourceService.instance) {
      SQLDataSourceService.instance = new SQLDataSourceService()
    }
    return SQLDataSourceService.instance
  }

  /**
   * Parse SQL file content and extract statements, tables, and metadata
   */
  async parseSQLFile(
    filePath: string,
    config: DataProviderConfig['sqlConfig']
  ): Promise<SQLParseResult> {
    try {
      logger.info('Starting SQL file parsing', 'data-processing', { filePath }, 'SQLDataSourceService')
      
      const content = await this.readSQLFile(filePath, config?.encoding)
      const statements = this.parseSQLStatements(content, config)
      const tables = this.extractTableNames(statements)
      const errors: string[] = []
      const warnings: string[] = []

      logger.success('SQL file parsed successfully', 'data-processing', { 
        statements: statements.length,
        tables: tables.length 
      }, 'SQLDataSourceService')

      return {
        statements,
        tables,
        errors,
        warnings
      }
    } catch (error: any) {
      logger.error('Failed to parse SQL file', 'data-processing', { 
        error: error.message,
        filePath 
      }, 'SQLDataSourceService')
      throw error
    }
  }

  /**
   * Parse SQL content string
   */
  async parseSQLContent(
    content: string,
    config: DataProviderConfig['sqlConfig']
  ): Promise<SQLParseResult> {
    try {
      logger.info('Starting SQL content parsing', 'data-processing', { 
        contentLength: content.length 
      }, 'SQLDataSourceService')
      
      const statements = this.parseSQLStatements(content, config)
      const tables = this.extractTableNames(statements)
      const errors: string[] = []
      const warnings: string[] = []

      logger.success('SQL content parsed successfully', 'data-processing', { 
        statements: statements.length,
        tables: tables.length 
      }, 'SQLDataSourceService')

      return {
        statements,
        tables,
        errors,
        warnings
      }
    } catch (error: any) {
      logger.error('Failed to parse SQL content', 'data-processing', { 
        error: error.message 
      }, 'SQLDataSourceService')
      throw error
    }
  }

  /**
   * Execute SQL statements against a SQLite database
   */
  async executeSQL(
    statements: SQLStatement[],
    databasePath: string,
    config: DataProviderConfig['sqlConfig'],
    onProgress?: (progress: ImportProgress) => void
  ): Promise<{
    success: boolean
    recordsProcessed: number
    tablesCreated: string[]
    errors: string[]
    warnings: string[]
  }> {
    const db = new Database(databasePath)
    const results = {
      success: true,
      recordsProcessed: 0,
      tablesCreated: [] as string[],
      errors: [] as string[],
      warnings: [] as string[]
    }

    try {
      logger.info('Starting SQL execution', 'data-processing', { 
        statements: statements.length,
        databasePath 
      }, 'SQLDataSourceService')

      // Filter statements based on configuration
      const filteredStatements = this.filterStatements(statements, config)
      
      let processedCount = 0
      const batchSize = config?.batchSize || 100
      const skipErrors = config?.skipErrors || false

      for (let i = 0; i < filteredStatements.length; i += batchSize) {
        const batch = filteredStatements.slice(i, i + batchSize)
        
        // Process batch in transaction
        const transaction = db.transaction(() => {
          for (const stmt of batch) {
            try {
              this.executeStatement(db, stmt, results, config)
              processedCount++
              
              // Report progress
              if (onProgress) {
                onProgress({
                  stage: 'parsing',
                  progress: Math.round((processedCount / filteredStatements.length) * 100),
                  message: `Processing statement ${processedCount}/${filteredStatements.length}`,
                  recordsProcessed: results.recordsProcessed,
                  totalRecords: filteredStatements.length,
                  currentRecord: processedCount
                })
              }
            } catch (error: any) {
              const errorMsg = `Statement ${processedCount + 1}: ${error.message}`
              results.errors.push(errorMsg)
              
              if (!skipErrors) {
                throw error
              } else {
                results.warnings.push(errorMsg)
              }
            }
          }
        })

        transaction()
      }

      results.success = results.errors.length === 0 || skipErrors
      
      logger.success('SQL execution completed', 'data-processing', { 
        processed: processedCount,
        records: results.recordsProcessed,
        tables: results.tablesCreated.length,
        errors: results.errors.length 
      }, 'SQLDataSourceService')

      return results
    } catch (error: any) {
      logger.error('SQL execution failed', 'data-processing', { 
        error: error.message 
      }, 'SQLDataSourceService')
      results.success = false
      results.errors.push(error.message)
      return results
    } finally {
      db.close()
    }
  }

  /**
   * Analyze SQL file and return table information
   */
  async analyzeSQLFile(
    filePath: string,
    config: DataProviderConfig['sqlConfig']
  ): Promise<SQLTableInfo[]> {
    try {
      const parseResult = await this.parseSQLFile(filePath, config)
      return this.extractTableInfo(parseResult.statements)
    } catch (error: any) {
      logger.error('Failed to analyze SQL file', 'data-processing', { 
        error: error.message,
        filePath 
      }, 'SQLDataSourceService')
      throw error
    }
  }

  /**
   * Read SQL file with specified encoding
   */
  private async readSQLFile(filePath: string, encoding: string = 'utf8'): Promise<string> {
    try {
      const buffer = await fs.promises.readFile(filePath)
      
      switch (encoding) {
        case 'utf16':
          return buffer.toString('utf16le')
        case 'latin1':
          return buffer.toString('latin1')
        case 'utf8':
        default:
          return buffer.toString('utf8')
      }
    } catch (error: any) {
      throw new Error(`Failed to read SQL file: ${error.message}`)
    }
  }

  /**
   * Parse SQL statements from content
   */
  private parseSQLStatements(
    content: string,
    config: DataProviderConfig['sqlConfig']
  ): SQLStatement[] {
    const delimiter = config?.customDelimiter || ';'
    const statements: SQLStatement[] = []
    
    // Split by delimiter and clean up
    const rawStatements = content
      .split(delimiter)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)

    let lineNumber = 1
    
    for (const rawStmt of rawStatements) {
      const statement = rawStmt.trim()
      if (!statement) continue

      // Count lines for this statement
      const linesInStatement = statement.split('\n').length - 1
      
      const parsed = this.parseStatement(statement, lineNumber)
      if (parsed) {
        statements.push(parsed)
      }
      
      lineNumber += linesInStatement + 1
    }

    return statements
  }

  /**
   * Parse individual SQL statement
   */
  private parseStatement(statement: string, lineNumber: number): SQLStatement | null {
    const upperStmt = statement.toUpperCase().trim()
    
    // Determine statement type
    let type: SQLStatement['type'] = 'OTHER'
    let table: string | undefined
    let operation: string | undefined

    if (upperStmt.startsWith('CREATE TABLE')) {
      type = 'DDL'
      operation = 'CREATE_TABLE'
      table = this.extractTableName(statement, 'CREATE TABLE')
    } else if (upperStmt.startsWith('DROP TABLE')) {
      type = 'DDL'
      operation = 'DROP_TABLE'
      table = this.extractTableName(statement, 'DROP TABLE')
    } else if (upperStmt.startsWith('ALTER TABLE')) {
      type = 'DDL'
      operation = 'ALTER_TABLE'
      table = this.extractTableName(statement, 'ALTER TABLE')
    } else if (upperStmt.startsWith('INSERT INTO')) {
      type = 'DML'
      operation = 'INSERT'
      table = this.extractTableName(statement, 'INSERT INTO')
    } else if (upperStmt.startsWith('UPDATE')) {
      type = 'DML'
      operation = 'UPDATE'
      table = this.extractTableName(statement, 'UPDATE')
    } else if (upperStmt.startsWith('DELETE FROM')) {
      type = 'DML'
      operation = 'DELETE'
      table = this.extractTableName(statement, 'DELETE FROM')
    } else if (upperStmt.startsWith('CREATE INDEX') || upperStmt.startsWith('CREATE UNIQUE INDEX')) {
      type = 'DDL'
      operation = 'CREATE_INDEX'
    } else if (upperStmt.startsWith('CREATE UNIQUE')) {
      type = 'DDL'
      operation = 'CREATE_UNIQUE'
    }

    return {
      type,
      statement,
      table,
      operation,
      lineNumber
    }
  }

  /**
   * Extract table name from SQL statement
   */
  private extractTableName(statement: string, keyword: string): string | undefined {
    const regex = new RegExp(`\\b${keyword}\\s+(?:IF\\s+(?:NOT\\s+)?EXISTS\\s+)?(?:\\w+\\.)?(\\w+)`, 'i')
    const match = statement.match(regex)
    return match ? match[1] : undefined
  }

  /**
   * Extract table names from statements
   */
  private extractTableNames(statements: SQLStatement[]): string[] {
    const tables = new Set<string>()
    
    statements.forEach(stmt => {
      if (stmt.table) {
        tables.add(stmt.table)
      }
    })
    
    return Array.from(tables)
  }

  /**
   * Filter statements based on configuration
   */
  private filterStatements(
    statements: SQLStatement[],
    config: DataProviderConfig['sqlConfig']
  ): SQLStatement[] {
    return statements.filter(stmt => {
      // Schema only mode
      if (config?.schemaOnly && stmt.type !== 'DDL') {
        return false
      }
      
      // Data only mode
      if (config?.dataOnly && stmt.type !== 'DML') {
        return false
      }
      
      // Table filtering
      if (stmt.table) {
        if (config?.tableFilter && !config.tableFilter.includes(stmt.table)) {
          return false
        }
        if (config?.excludeTables && config.excludeTables.includes(stmt.table)) {
          return false
        }
      }
      
      // Operation filtering
      if (config?.createTables === false && stmt.operation === 'CREATE_TABLE') {
        return false
      }
      if (config?.insertData === false && stmt.operation === 'INSERT') {
        return false
      }
      if (config?.indexes === false && stmt.operation === 'CREATE_INDEX') {
        return false
      }
      if (config?.constraints === false && stmt.operation === 'ALTER_TABLE') {
        return false
      }
      
      return true
    })
  }

  /**
   * Execute individual SQL statement
   */
  private executeStatement(
    db: Database.Database,
    stmt: SQLStatement,
    results: any,
    config: DataProviderConfig['sqlConfig']
  ): void {
    try {
      // Prepare and execute statement
      const prepared = db.prepare(stmt.statement)
      
      if (stmt.operation === 'INSERT') {
        // Count INSERT statements as records
        results.recordsProcessed++
      } else if (stmt.operation === 'CREATE_TABLE' && stmt.table) {
        results.tablesCreated.push(stmt.table)
      }
      
      prepared.run()
    } catch (error: any) {
      // Handle dialect-specific issues
      if (config?.dialect && config.dialect !== 'sqlite') {
        // Convert dialect-specific syntax to SQLite
        const convertedStmt = this.convertToSQLite(stmt.statement, config.dialect)
        if (convertedStmt !== stmt.statement) {
          const prepared = db.prepare(convertedStmt)
          prepared.run()
          return
        }
      }
      throw error
    }
  }

  /**
   * Convert dialect-specific SQL to SQLite
   */
  private convertToSQLite(statement: string, dialect: string): string {
    let converted = statement

    switch (dialect) {
      case 'mysql':
        // Convert MySQL-specific syntax
        converted = converted
          .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
          .replace(/ENGINE=\w+/gi, '')
          .replace(/DEFAULT CHARSET=\w+/gi, '')
          .replace(/COLLATE=\w+/gi, '')
          .replace(/`/g, '"')
        break
      
      case 'postgresql':
        // Convert PostgreSQL-specific syntax
        converted = converted
          .replace(/SERIAL/gi, 'INTEGER')
          .replace(/BIGSERIAL/gi, 'INTEGER')
          .replace(/SMALLSERIAL/gi, 'INTEGER')
          .replace(/"/g, '"')
        break
    }

    return converted
  }

  /**
   * Extract table information from statements
   */
  private extractTableInfo(statements: SQLStatement[]): SQLTableInfo[] {
    const tableMap = new Map<string, SQLTableInfo>()
    
    statements.forEach(stmt => {
      if (stmt.operation === 'CREATE_TABLE' && stmt.table) {
        const tableInfo: SQLTableInfo = {
          name: stmt.table,
          columns: this.extractColumnsFromCreateTable(stmt.statement),
          indexes: [],
          constraints: []
        }
        tableMap.set(stmt.table, tableInfo)
      } else if (stmt.operation === 'CREATE_INDEX') {
        const tableName = this.extractTableName(stmt.statement, 'ON')
        if (tableName && tableMap.has(tableName)) {
          tableMap.get(tableName)!.indexes.push(stmt.statement)
        }
      } else if (stmt.operation === 'INSERT' && stmt.table) {
        if (tableMap.has(stmt.table)) {
          const info = tableMap.get(stmt.table)!
          info.dataRows = (info.dataRows || 0) + 1
        }
      }
    })
    
    return Array.from(tableMap.values())
  }

  /**
   * Extract column information from CREATE TABLE statement
   */
  private extractColumnsFromCreateTable(statement: string): SQLColumnInfo[] {
    const columns: SQLColumnInfo[] = []
    
    // Simple regex to extract column definitions
    const columnRegex = /(\w+)\s+([^,\n]+?)(?:,\s*(?=\w+\s+\w+)|$)/g
    let match
    
    while ((match = columnRegex.exec(statement)) !== null) {
      const name = match[1]
      const definition = match[2].trim()
      
      columns.push({
        name,
        type: this.extractTypeFromDefinition(definition),
        nullable: !definition.toUpperCase().includes('NOT NULL'),
        primaryKey: definition.toUpperCase().includes('PRIMARY KEY'),
        unique: definition.toUpperCase().includes('UNIQUE')
      })
    }
    
    return columns
  }

  /**
   * Extract data type from column definition
   */
  private extractTypeFromDefinition(definition: string): string {
    const upperDef = definition.toUpperCase()
    
    if (upperDef.includes('INT')) return 'INTEGER'
    if (upperDef.includes('VARCHAR') || upperDef.includes('TEXT')) return 'TEXT'
    if (upperDef.includes('DECIMAL') || upperDef.includes('NUMERIC')) return 'REAL'
    if (upperDef.includes('DATE') || upperDef.includes('TIME')) return 'TEXT'
    if (upperDef.includes('BOOLEAN') || upperDef.includes('BOOL')) return 'INTEGER'
    
    return 'TEXT' // Default fallback
  }
}
