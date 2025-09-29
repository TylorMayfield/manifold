import { logger } from '../utils/logger'
import { SeparatedDatabaseManager } from '../server/database/SeparatedDatabaseManager'
import { DataSourceDatabase } from '../server/database/DataSourceDatabase'
import {
  DataLake,
  DataLakeConfig,
  DataLakeMetadata,
  DataLakeBuildResult,
  DataLakeSchema,
  DataLakeTable,
  DataLakeColumn,
  DataLakeRelationship,
  DataLakeQuery,
  DataLakeQueryResult,
  DataLakeExport,
  DataLakeBackup,
  DataLakeMonitoring,
  DataLakeAlert,
  BuildError,
  BuildWarning,
  DataQualityIssue,
  QueryPerformanceMetrics
} from '../../types/dataLake'
import { DataSourceConfig } from '../server/database/SeparatedDatabaseManager'
import { DataVersion } from '../server/database/DataSourceDatabase'
import path from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'

// Conditional electron import for server-side only
let app: any = null
if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.electron) {
  try {
    const { app: electronApp } = require('electron')
    app = electronApp
  } catch (error) {
    // Electron not available, use mock for build process
    app = {
      getPath: (name: string) => {
        switch (name) {
          case 'userData': return process.cwd() + '/data'
          default: return process.cwd()
        }
      }
    }
  }
}

export class DataLakeService {
  private static instance: DataLakeService
  private dbManager: SeparatedDatabaseManager
  private dataLakes: Map<string, DataLake> = new Map()

  private constructor() {
    this.dbManager = SeparatedDatabaseManager.getInstance()
  }

  static getInstance(): DataLakeService {
    if (!DataLakeService.instance) {
      DataLakeService.instance = new DataLakeService()
    }
    return DataLakeService.instance
  }

  /**
   * Create a new data lake
   */
  async createDataLake(
    projectId: string,
    dataLakeData: {
      name: string
      description?: string
      config: DataLakeConfig
    }
  ): Promise<DataLake> {
    try {
      logger.info('Creating new data lake', 'data-lake', { projectId, name: dataLakeData.name }, 'DataLakeService')

      const dataLakeId = `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const storageLocation = path.join(
        app.getPath('userData'),
        'data_lakes',
        projectId,
        `${dataLakeId}.db`
      )

      // Ensure data lakes directory exists
      const dataLakeDir = path.dirname(storageLocation)
      if (!fs.existsSync(dataLakeDir)) {
        fs.mkdirSync(dataLakeDir, { recursive: true })
      }

      const dataLake: DataLake = {
        id: dataLakeId,
        projectId,
        name: dataLakeData.name,
        description: dataLakeData.description,
        status: 'draft',
        config: dataLakeData.config,
        metadata: {
          totalRecords: 0,
          totalDataSources: dataLakeData.config.dataSourceIds.length,
          totalSize: 0,
          schemaVersion: 1,
          columnCount: 0,
          dataTypes: {},
          storageLocation,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Store data lake configuration in core database
      await this.storeDataLakeConfig(dataLake)

      // Initialize data lake database
      await this.initializeDataLakeDatabase(dataLake)

      this.dataLakes.set(dataLakeId, dataLake)

      logger.success(`Data lake created: ${dataLake.name}`, 'data-lake', { dataLakeId }, 'DataLakeService')
      return dataLake

    } catch (error: any) {
      logger.error('Failed to create data lake', 'data-lake', { error: error.message, stack: error.stack }, 'DataLakeService')
      throw error
    }
  }

  /**
   * Build/rebuild a data lake
   */
  async buildDataLake(dataLakeId: string): Promise<DataLakeBuildResult> {
    const dataLake = await this.getDataLake(dataLakeId)
    if (!dataLake) {
      throw new Error(`Data lake with ID ${dataLakeId} not found`)
    }

    const buildId = `build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = new Date()

    const buildResult: DataLakeBuildResult = {
      id: buildId,
      dataLakeId,
      status: 'running',
      startTime,
      recordsProcessed: 0,
      dataSourcesProcessed: 0,
      errors: [],
      warnings: [],
      memoryUsage: 0,
      cpuUsage: 0,
      diskUsage: 0,
    }

    try {
      logger.info('Starting data lake build', 'data-lake', { dataLakeId, buildId }, 'DataLakeService')

      // Update data lake status
      dataLake.status = 'building'
      await this.updateDataLake(dataLake)

      // Get data sources for the lake
      const dataSources = await this.getDataSourcesForLake(dataLake)
      if (dataSources.length === 0) {
        throw new Error('No data sources found for data lake')
      }

      // Initialize build database
      const buildDb = await this.initializeBuildDatabase(dataLake)

      // Process each data source
      for (const dataSource of dataSources) {
        try {
          logger.info(`Processing data source: ${dataSource.name}`, 'data-lake', { dataSourceId: dataSource.id }, 'DataLakeService')

          const sourceDb = DataSourceDatabase.getInstance(dataSource.id, dataSource.config.dataPath)
          await sourceDb.initialize()

          // Get latest data version
          const latestVersion = await sourceDb.getLatestDataVersion()
          if (!latestVersion) {
            buildResult.warnings.push({
              id: `warn_${Date.now()}`,
              type: 'data_quality_warning',
              message: `No data found in data source: ${dataSource.name}`,
              sourceDataSourceId: dataSource.id,
              timestamp: new Date(),
            })
            continue
          }

          // Get data from version
          const data = await sourceDb.getDataFromVersion(latestVersion.id)
          if (!data || data.length === 0) {
            buildResult.warnings.push({
              id: `warn_${Date.now()}`,
              type: 'data_quality_warning',
              message: `Empty data in data source: ${dataSource.name}`,
              sourceDataSourceId: dataSource.id,
              timestamp: new Date(),
            })
            continue
          }

          // Transform and store data
          const transformedData = await this.transformDataSourceData(data, dataSource, dataLake.config)
          await this.storeDataInLake(buildDb, dataSource, transformedData, dataLake.config)

          buildResult.recordsProcessed += transformedData.length
          buildResult.dataSourcesProcessed++

        } catch (error: any) {
          logger.error(`Error processing data source: ${dataSource.name}`, 'data-lake', { error: error.message }, 'DataLakeService')
          buildResult.errors.push({
            id: `error_${Date.now()}`,
            type: 'data_source_error',
            message: `Failed to process data source ${dataSource.name}: ${error.message}`,
            sourceDataSourceId: dataSource.id,
            timestamp: new Date(),
            stackTrace: error.stack,
          })
        }
      }

      // Create relationships and indexes
      await this.createRelationshipsAndIndexes(buildDb, dataLake.config)

      // Calculate metadata
      const metadata = await this.calculateDataLakeMetadata(buildDb, dataLake.config)
      dataLake.metadata = { ...dataLake.metadata, ...metadata }

      // Replace production database with build database
      await this.promoteBuildToProduction(dataLake, buildDb)

      // Update build result
      buildResult.status = 'completed'
      buildResult.endTime = new Date()
      buildResult.duration = buildResult.endTime.getTime() - startTime.getTime()

      // Update data lake
      dataLake.status = 'ready'
      dataLake.lastBuiltAt = new Date()
      dataLake.metadata = { ...dataLake.metadata, ...metadata }
      await this.updateDataLake(dataLake)

      logger.success(`Data lake build completed: ${dataLake.name}`, 'data-lake', { 
        dataLakeId, 
        buildId, 
        duration: buildResult.duration,
        recordsProcessed: buildResult.recordsProcessed 
      }, 'DataLakeService')

      return buildResult

    } catch (error: any) {
      logger.error('Data lake build failed', 'data-lake', { error: error.message, stack: error.stack }, 'DataLakeService')

      buildResult.status = 'failed'
      buildResult.endTime = new Date()
      buildResult.duration = buildResult.endTime.getTime() - startTime.getTime()

      dataLake.status = 'error'
      await this.updateDataLake(dataLake)

      buildResult.errors.push({
        id: `error_${Date.now()}`,
        type: 'transformation_error',
        message: `Build failed: ${error.message}`,
        timestamp: new Date(),
        stackTrace: error.stack,
      })

      return buildResult
    }
  }

  /**
   * Get data lake by ID
   */
  async getDataLake(dataLakeId: string): Promise<DataLake | null> {
    if (this.dataLakes.has(dataLakeId)) {
      return this.dataLakes.get(dataLakeId)!
    }

    // Load from database
    try {
      const dataLake = await this.loadDataLakeFromDatabase(dataLakeId)
      if (dataLake) {
        this.dataLakes.set(dataLakeId, dataLake)
      }
      return dataLake
    } catch (error: any) {
      logger.error('Failed to load data lake from database', 'data-lake', { error: error.message }, 'DataLakeService')
      return null
    }
  }

  /**
   * Get all data lakes for a project
   */
  async getDataLakesForProject(projectId: string): Promise<DataLake[]> {
    try {
      // This would query the core database for data lake configurations
      // For now, return empty array as we need to implement the database storage
      return []
    } catch (error: any) {
      logger.error('Failed to get data lakes for project', 'data-lake', { error: error.message }, 'DataLakeService')
      return []
    }
  }

  /**
   * Execute a query against a data lake
   */
  async executeQuery(
    dataLakeId: string,
    query: DataLakeQuery
  ): Promise<DataLakeQueryResult> {
    const dataLake = await this.getDataLake(dataLakeId)
    if (!dataLake) {
      throw new Error(`Data lake with ID ${dataLakeId} not found`)
    }

    if (dataLake.status !== 'ready') {
      throw new Error(`Data lake is not ready for queries. Status: ${dataLake.status}`)
    }

    const resultId = `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = new Date()

    const queryResult: DataLakeQueryResult = {
      id: resultId,
      queryId: query.id,
      executedAt: startTime,
      duration: 0,
      status: 'running',
    }

    try {
      logger.info('Executing data lake query', 'data-lake', { dataLakeId, queryId: query.id }, 'DataLakeService')

      // Open data lake database
      const db = new Database(dataLake.metadata.storageLocation, { readonly: true })
      
      // Execute query
      const stmt = db.prepare(query.sql)
      const rows = stmt.all(query.parameters || {})

      const endTime = new Date()
      queryResult.duration = endTime.getTime() - startTime.getTime()
      queryResult.status = 'completed'
      queryResult.totalRows = rows.length
      queryResult.returnedRows = rows.length

      if (rows.length > 0) {
        queryResult.columns = Object.keys(rows[0])
        queryResult.rows = rows.map(row => Object.values(row))
      } else {
        queryResult.columns = []
        queryResult.rows = []
      }

      db.close()

      logger.success('Data lake query executed successfully', 'data-lake', { 
        dataLakeId, 
        queryId: query.id, 
        duration: queryResult.duration,
        rowsReturned: queryResult.returnedRows 
      }, 'DataLakeService')

      return queryResult

    } catch (error: any) {
      logger.error('Data lake query failed', 'data-lake', { error: error.message }, 'DataLakeService')

      queryResult.status = 'failed'
      queryResult.error = error.message
      queryResult.errorType = 'sql_error'

      return queryResult
    }
  }

  /**
   * Export data lake data
   */
  async exportDataLake(
    dataLakeId: string,
    exportConfig: {
      name: string
      exportType: 'csv' | 'json' | 'parquet' | 'sqlite' | 'excel'
      filters?: any[]
      format?: any
    }
  ): Promise<DataLakeExport> {
    const dataLake = await this.getDataLake(dataLakeId)
    if (!dataLake) {
      throw new Error(`Data lake with ID ${dataLakeId} not found`)
    }

    const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const dataExport: DataLakeExport = {
      id: exportId,
      dataLakeId,
      name: exportConfig.name,
      exportType: exportConfig.exportType,
      filters: exportConfig.filters,
      format: exportConfig.format || {},
      status: 'pending',
      createdAt: new Date(),
    }

    try {
      logger.info('Starting data lake export', 'data-lake', { dataLakeId, exportId }, 'DataLakeService')

      dataExport.status = 'running'

      // This would implement the actual export logic based on export type
      // For now, we'll simulate the export process
      await new Promise(resolve => setTimeout(resolve, 1000))

      dataExport.status = 'completed'
      dataExport.completedAt = new Date()
      dataExport.filePath = path.join(app.getPath('userData'), 'exports', `${exportId}.${exportConfig.exportType}`)
      dataExport.fileSize = 1024 * 1024 // 1MB simulated
      dataExport.recordCount = dataLake.metadata.totalRecords

      logger.success('Data lake export completed', 'data-lake', { dataLakeId, exportId }, 'DataLakeService')

      return dataExport

    } catch (error: any) {
      logger.error('Data lake export failed', 'data-lake', { error: error.message }, 'DataLakeService')

      dataExport.status = 'failed'
      dataExport.error = error.message

      return dataExport
    }
  }

  /**
   * Get data lake monitoring information
   */
  async getDataLakeMonitoring(dataLakeId: string): Promise<DataLakeMonitoring> {
    const dataLake = await this.getDataLake(dataLakeId)
    if (!dataLake) {
      throw new Error(`Data lake with ID ${dataLakeId} not found`)
    }

    // Calculate monitoring metrics
    const storageStats = fs.statSync(dataLake.metadata.storageLocation)
    const storageUsed = storageStats.size
    const storageAvailable = fs.statSync(path.dirname(dataLake.metadata.storageLocation)).size

    return {
      dataLakeId,
      lastChecked: new Date(),
      healthStatus: dataLake.status === 'ready' ? 'healthy' : 'error',
      healthScore: dataLake.status === 'ready' ? 95 : 30,
      averageQueryTime: 0, // Would be calculated from query history
      totalQueries: 0,
      errorRate: 0,
      storageUsed,
      storageAvailable,
      storageGrowthRate: 0,
      dataAge: dataLake.lastBuiltAt ? Date.now() - dataLake.lastBuiltAt.getTime() : Infinity,
      staleDataSources: [],
      alertThresholds: {
        maxQueryTime: 5000,
        maxErrorRate: 0.05,
        maxStorageUsage: 1000000000, // 1GB
        maxDataAge: 24 * 60 * 60 * 1000, // 24 hours
      },
      activeAlerts: [],
    }
  }

  // Private helper methods

  private async storeDataLakeConfig(dataLake: DataLake): Promise<void> {
    // Store data lake configuration in core database
    // This would be implemented with the actual database storage
    logger.info('Storing data lake configuration', 'data-lake', { dataLakeId: dataLake.id }, 'DataLakeService')
  }

  private async updateDataLake(dataLake: DataLake): Promise<void> {
    dataLake.updatedAt = new Date()
    this.dataLakes.set(dataLake.id, dataLake)
    
    // Update in database
    await this.storeDataLakeConfig(dataLake)
  }

  private async loadDataLakeFromDatabase(dataLakeId: string): Promise<DataLake | null> {
    // Load data lake configuration from core database
    // This would be implemented with the actual database loading
    return null
  }

  private async initializeDataLakeDatabase(dataLake: DataLake): Promise<void> {
    // Create SQLite database for the data lake
    const db = new Database(dataLake.metadata.storageLocation)
    
    // Create tables for data lake storage
    db.exec(`
      CREATE TABLE IF NOT EXISTS data_lake_metadata (
        id TEXT PRIMARY KEY,
        data_lake_id TEXT NOT NULL,
        table_name TEXT NOT NULL,
        source_data_source_id TEXT NOT NULL,
        record_count INTEGER DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        schema_version INTEGER DEFAULT 1,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS data_lake_relationships (
        id TEXT PRIMARY KEY,
        data_lake_id TEXT NOT NULL,
        name TEXT NOT NULL,
        source_table TEXT NOT NULL,
        target_table TEXT NOT NULL,
        source_columns TEXT NOT NULL,
        target_columns TEXT NOT NULL,
        relationship_type TEXT NOT NULL,
        join_type TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS data_lake_indexes (
        id TEXT PRIMARY KEY,
        data_lake_id TEXT NOT NULL,
        table_name TEXT NOT NULL,
        index_name TEXT NOT NULL,
        columns TEXT NOT NULL,
        index_type TEXT NOT NULL,
        is_unique BOOLEAN DEFAULT 0
      );
    `)

    db.close()
  }

  private async getDataSourcesForLake(dataLake: DataLake): Promise<DataSourceConfig[]> {
    const dataSources: DataSourceConfig[] = []
    
    for (const dataSourceId of dataLake.config.dataSourceIds) {
      const dataSource = await this.dbManager.getDataSource(dataSourceId)
      if (dataSource) {
        dataSources.push(dataSource)
      }
    }
    
    return dataSources
  }

  private async initializeBuildDatabase(dataLake: DataLake): Promise<Database.Database> {
    const buildDbPath = `${dataLake.metadata.storageLocation}.build`
    return new Database(buildDbPath)
  }

  private async transformDataSourceData(
    data: any[],
    dataSource: DataSourceConfig,
    lakeConfig: DataLakeConfig
  ): Promise<any[]> {
    // Apply transformations based on lake configuration
    let transformedData = [...data]

    // Apply custom transformations
    if (lakeConfig.settings.customTransformations) {
      for (const transformation of lakeConfig.settings.customTransformations) {
        if (transformation.sourceDataSourceId === dataSource.id) {
          transformedData = await this.applyTransformation(transformedData, transformation)
        }
      }
    }

    // Apply deduplication
    if (lakeConfig.settings.deduplication && lakeConfig.settings.deduplicationKey) {
      transformedData = this.deduplicateData(transformedData, lakeConfig.settings.deduplicationKey)
    }

    return transformedData
  }

  private async applyTransformation(data: any[], transformation: any): Promise<any[]> {
    // Apply the transformation logic
    // This would implement the actual transformation based on type
    return data
  }

  private deduplicateData(data: any[], key: string): any[] {
    const seen = new Set()
    return data.filter(item => {
      const keyValue = item[key]
      if (seen.has(keyValue)) {
        return false
      }
      seen.add(keyValue)
      return true
    })
  }

  private async storeDataInLake(
    db: Database.Database,
    dataSource: DataSourceConfig,
    data: any[],
    config: DataLakeConfig
  ): Promise<void> {
    if (data.length === 0) return

    // Create table for this data source
    const tableName = `ds_${dataSource.id.replace(/[^a-zA-Z0-9]/g, '_')}`
    const columns = Object.keys(data[0])
    
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        ${columns.map(col => `"${col}" TEXT`).join(', ')}
      )
    `
    
    db.exec(createTableSql)

    // Insert data
    const insertSql = `
      INSERT INTO ${tableName} (${columns.map(col => `"${col}"`).join(', ')})
      VALUES (${columns.map(() => '?').join(', ')})
    `
    
    const insertStmt = db.prepare(insertSql)
    
    for (const row of data) {
      const values = columns.map(col => JSON.stringify(row[col]))
      insertStmt.run(...values)
    }

    // Update metadata
    const metadataSql = `
      INSERT OR REPLACE INTO data_lake_metadata 
      (id, data_lake_id, table_name, source_data_source_id, record_count, last_updated)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    
    const metadataStmt = db.prepare(metadataSql)
    metadataStmt.run(
      `meta_${dataSource.id}`,
      config.dataSourceIds[0], // Assuming single data lake
      tableName,
      dataSource.id,
      data.length,
      new Date().toISOString()
    )
  }

  private async createRelationshipsAndIndexes(
    db: Database.Database,
    config: DataLakeConfig
  ): Promise<void> {
    // Create relationships based on configuration
    if (config.relationships) {
      for (const relationship of config.relationships) {
        const relationshipSql = `
          INSERT INTO data_lake_relationships 
          (id, data_lake_id, name, source_table, target_table, source_columns, target_columns, relationship_type, join_type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        
        const relationshipStmt = db.prepare(relationshipSql)
        relationshipStmt.run(
          relationship.id,
          config.dataSourceIds[0], // Assuming single data lake
          relationship.name,
          relationship.sourceTableId,
          relationship.targetTableId,
          JSON.stringify(relationship.sourceColumns),
          JSON.stringify(relationship.targetColumns),
          relationship.relationshipType,
          relationship.joinType
        )
      }
    }

    // Create indexes based on configuration
    if (config.settings.indexing && config.settings.indexFields) {
      for (const indexField of config.settings.indexFields) {
        const indexSql = `
          INSERT INTO data_lake_indexes 
          (id, data_lake_id, table_name, index_name, columns, index_type)
          VALUES (?, ?, ?, ?, ?, ?)
        `
        
        const indexStmt = db.prepare(indexSql)
        indexStmt.run(
          `idx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          config.dataSourceIds[0],
          'all_tables', // Would be specific table
          `idx_${indexField}`,
          JSON.stringify([indexField]),
          'btree'
        )
      }
    }
  }

  private async calculateDataLakeMetadata(
    db: Database.Database,
    config: DataLakeConfig
  ): Promise<Partial<DataLakeMetadata>> {
    // Calculate metadata from the database
    const metadataQuery = db.prepare(`
      SELECT 
        SUM(record_count) as total_records,
        COUNT(*) as total_tables
      FROM data_lake_metadata
    `)
    
    const result = metadataQuery.get() as { total_records: number; total_tables: number }

    return {
      totalRecords: result.total_records || 0,
      totalDataSources: config.dataSourceIds.length,
      totalSize: 0, // Would calculate actual file size
      schemaVersion: 1,
      columnCount: 0, // Would calculate from schema
      dataTypes: {}, // Would analyze data types
    }
  }

  private async promoteBuildToProduction(dataLake: DataLake, buildDb: Database.Database): Promise<void> {
    buildDb.close()
    
    // Replace production database with build database
    const buildDbPath = `${dataLake.metadata.storageLocation}.build`
    const productionDbPath = dataLake.metadata.storageLocation
    
    // Backup production database
    const backupPath = `${productionDbPath}.backup.${Date.now()}`
    if (fs.existsSync(productionDbPath)) {
      fs.copyFileSync(productionDbPath, backupPath)
    }
    
    // Replace with build database
    fs.renameSync(buildDbPath, productionDbPath)
    
    // Clean up backup after successful promotion
    setTimeout(() => {
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath)
      }
    }, 60000) // Keep backup for 1 minute
  }
}
