import { CoreDatabase } from "./CoreDatabase";
import { DataSourceDatabase } from "./DataSourceDatabase";
import { app } from "electron";
import path from "path";
import fs from "fs";
import { logger } from "../utils/logger";
import { DataProvider, DataProviderType } from "../../types";

export interface DataSourceConfig {
  id: string;
  projectId: string;
  name: string;
  type: DataProviderType;
  config: any;
  status: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
  syncInterval?: number;
  dataPath?: string; // Path to data source database
}

export interface ImportResult {
  versionId: string;
  version: number;
  recordCount: number;
  diffData?: any;
  duration: number;
  errors?: string[];
}

export class SeparatedDatabaseManager {
  private static instance: SeparatedDatabaseManager;
  private coreDb: CoreDatabase;
  private dataSourceDbs: Map<string, DataSourceDatabase> = new Map();

  private constructor() {
    this.coreDb = CoreDatabase.getInstance();
  }

  static getInstance(): SeparatedDatabaseManager {
    if (!SeparatedDatabaseManager.instance) {
      SeparatedDatabaseManager.instance = new SeparatedDatabaseManager();
    }
    return SeparatedDatabaseManager.instance;
  }

  async initialize(): Promise<void> {
    await this.coreDb.initialize();
    logger.success("Separated database manager initialized", "database", {}, "SeparatedDatabaseManager");
  }

  // Core database operations (configs and metadata only)
  async createDataSource(projectId: string, dataSourceData: {
    name: string;
    type: DataProviderType;
    config: any;
    syncInterval?: number;
  }): Promise<DataSourceConfig> {
    // Create data source entry in core database
    const dataSource = await this.coreDb.createDataSource(projectId, dataSourceData);
    
    // Create dedicated database for this data source
    const dataPath = this.getDataSourceDbPath(projectId, dataSource.id);
    const dataSourceDb = DataSourceDatabase.getInstance(projectId, dataSource.id, dataPath);
    await dataSourceDb.initialize();
    
    this.dataSourceDbs.set(dataSource.id, dataSourceDb);
    
    // Update data source with data path
    const updatedDataSource = await this.coreDb.updateDataSource(dataSource.id, {
      config: {
        ...dataSourceData.config,
        dataPath: dataPath
      }
    });

    logger.success(
      "Data source created with separated storage",
      "database",
      { 
        projectId, 
        dataSourceId: dataSource.id, 
        dataPath 
      },
      "SeparatedDatabaseManager"
    );

    return this.mapToDataSourceConfig(updatedDataSource);
  }

  async getDataSource(projectId: string, dataSourceId: string): Promise<DataSourceConfig | null> {
    const dataSource = await this.coreDb.client.dataSource.findFirst({
      where: { 
        id: dataSourceId,
        projectId: projectId
      }
    });

    if (!dataSource) return null;

    // Ensure data source database is loaded
    await this.ensureDataSourceDbLoaded(projectId, dataSourceId);

    return this.mapToDataSourceConfig(dataSource);
  }

  async getDataSources(projectId: string): Promise<DataSourceConfig[]> {
    const dataSources = await this.coreDb.getDataSources(projectId);
    
    // Load all data source databases
    for (const ds of dataSources) {
      await this.ensureDataSourceDbLoaded(projectId, ds.id);
    }

    return dataSources.map(ds => this.mapToDataSourceConfig(ds));
  }

  async updateDataSource(projectId: string, dataSourceId: string, updates: {
    name?: string;
    config?: any;
    status?: string;
    enabled?: boolean;
    syncInterval?: number;
  }): Promise<DataSourceConfig> {
    const updatedDataSource = await this.coreDb.updateDataSource(dataSourceId, updates);
    return this.mapToDataSourceConfig(updatedDataSource);
  }

  async deleteDataSource(projectId: string, dataSourceId: string): Promise<void> {
    // Get data source info before deletion
    const dataSource = await this.getDataSource(projectId, dataSourceId);
    if (!dataSource) return;

    // Close and remove data source database
    const dataSourceDb = this.dataSourceDbs.get(dataSourceId);
    if (dataSourceDb) {
      await dataSourceDb.close();
      this.dataSourceDbs.delete(dataSourceId);
    }

    // Delete data source database file
    if (dataSource.dataPath && fs.existsSync(dataSource.dataPath)) {
      try {
        fs.unlinkSync(dataSource.dataPath);
        logger.info(
          "Data source database file deleted",
          "database",
          { dataSourceId, path: dataSource.dataPath },
          "SeparatedDatabaseManager"
        );
      } catch (error) {
        logger.error(
          "Failed to delete data source database file",
          "database",
          { dataSourceId, path: dataSource.dataPath, error },
          "SeparatedDatabaseManager"
        );
      }
    }

    // Delete from core database
    await this.coreDb.deleteDataSource(dataSourceId);
  }

  // Data operations (using dedicated data source databases)
  async importData(
    projectId: string, 
    dataSourceId: string, 
    data: any[],
    options: {
      schema?: any;
      metadata?: any;
      enableDiff?: boolean;
      diffKey?: string;
    } = {}
  ): Promise<ImportResult> {
    const startTime = Date.now();
    
    // Get data source database
    const dataSourceDb = await this.getDataSourceDb(projectId, dataSourceId);
    if (!dataSourceDb) {
      throw new Error(`Data source database not found: ${dataSourceId}`);
    }

    // Get latest version for diffing
    const latestVersion = await dataSourceDb.getLatestVersion();
    
    // Create new version
    const newVersion = await dataSourceDb.createVersion({
      data,
      schema: options.schema,
      metadata: {
        ...options.metadata,
        importTime: new Date().toISOString(),
        recordCount: data.length,
        enableDiff: options.enableDiff,
        diffKey: options.diffKey
      },
      previousVersionId: latestVersion?.id
    });

    // Update core database with last sync time
    await this.coreDb.updateDataSource(dataSourceId, {
      status: "completed",
      lastSyncAt: new Date()
    });

    const duration = Date.now() - startTime;

    logger.success(
      "Data imported successfully",
      "database",
      { 
        projectId, 
        dataSourceId, 
        version: newVersion.version, 
        recordCount: data.length,
        duration 
      },
      "SeparatedDatabaseManager"
    );

    return {
      versionId: newVersion.id,
      version: newVersion.version,
      recordCount: data.length,
      diffData: newVersion.diffData,
      duration
    };
  }

  async getLatestData(projectId: string, dataSourceId: string): Promise<any[]> {
    const dataSourceDb = await this.getDataSourceDb(projectId, dataSourceId);
    if (!dataSourceDb) {
      throw new Error(`Data source database not found: ${dataSourceId}`);
    }

    const latestVersion = await dataSourceDb.getLatestVersion();
    return latestVersion?.data || [];
  }

  async getDataVersion(projectId: string, dataSourceId: string, version: number): Promise<any[]> {
    const dataSourceDb = await this.getDataSourceDb(projectId, dataSourceId);
    if (!dataSourceDb) {
      throw new Error(`Data source database not found: ${dataSourceId}`);
    }

    const versionData = await dataSourceDb.getVersionByNumber(version);
    return versionData?.data || [];
  }

  async getDataDiff(projectId: string, dataSourceId: string, fromVersion: number, toVersion: number): Promise<any> {
    const dataSourceDb = await this.getDataSourceDb(projectId, dataSourceId);
    if (!dataSourceDb) {
      throw new Error(`Data source database not found: ${dataSourceId}`);
    }

    return await dataSourceDb.getVersionDiff(fromVersion, toVersion);
  }

  async getAllVersions(projectId: string, dataSourceId: string, limit?: number): Promise<any[]> {
    const dataSourceDb = await this.getDataSourceDb(projectId, dataSourceId);
    if (!dataSourceDb) {
      throw new Error(`Data source database not found: ${dataSourceId}`);
    }

    return await dataSourceDb.getAllVersions(limit);
  }

  async getDataSourceStats(projectId: string, dataSourceId: string): Promise<any> {
    const dataSourceDb = await this.getDataSourceDb(projectId, dataSourceId);
    if (!dataSourceDb) {
      throw new Error(`Data source database not found: ${dataSourceId}`);
    }

    return await dataSourceDb.getStats();
  }

  // Utility methods
  private async ensureDataSourceDbLoaded(projectId: string, dataSourceId: string): Promise<void> {
    if (this.dataSourceDbs.has(dataSourceId)) {
      return;
    }

    const dataSource = await this.coreDb.client.dataSource.findFirst({
      where: { id: dataSourceId, projectId }
    });

    if (!dataSource) {
      throw new Error(`Data source not found: ${dataSourceId}`);
    }

    const config = JSON.parse(dataSource.config);
    const dataPath = config.dataPath || this.getDataSourceDbPath(projectId, dataSourceId);
    
    const dataSourceDb = DataSourceDatabase.getInstance(projectId, dataSourceId, dataPath);
    await dataSourceDb.initialize();
    
    this.dataSourceDbs.set(dataSourceId, dataSourceDb);
  }

  private async getDataSourceDb(projectId: string, dataSourceId: string): Promise<DataSourceDatabase | null> {
    await this.ensureDataSourceDbLoaded(projectId, dataSourceId);
    return this.dataSourceDbs.get(dataSourceId) || null;
  }

  private getDataSourceDbPath(projectId: string, dataSourceId: string): string {
    const appDataPath = app.getPath("userData");
    return path.join(appDataPath, "data-sources", projectId, `${dataSourceId}.db`);
  }

  private mapToDataSourceConfig(dataSource: any): DataSourceConfig {
    const config = JSON.parse(dataSource.config || "{}");
    
    return {
      id: dataSource.id,
      projectId: dataSource.projectId,
      name: dataSource.name,
      type: dataSource.type,
      config: config,
      status: dataSource.status,
      enabled: true, // Default to enabled
      createdAt: dataSource.createdAt,
      updatedAt: dataSource.updatedAt,
      lastSyncAt: dataSource.lastSyncAt,
      syncInterval: config.syncInterval,
      dataPath: config.dataPath
    };
  }

  // Cleanup and maintenance
  async cleanupOldVersions(projectId: string, dataSourceId: string, keepVersions: number = 10): Promise<void> {
    const dataSourceDb = await this.getDataSourceDb(projectId, dataSourceId);
    if (dataSourceDb) {
      await dataSourceDb.cleanupOldVersions(keepVersions);
    }
  }

  async cleanupAllOldVersions(projectId: string, keepVersions: number = 10): Promise<void> {
    const dataSources = await this.getDataSources(projectId);
    
    for (const dataSource of dataSources) {
      await this.cleanupOldVersions(projectId, dataSource.id, keepVersions);
    }
  }

  // Backup and restore
  async backupDataSource(projectId: string, dataSourceId: string, backupPath: string): Promise<void> {
    const dataSource = await this.getDataSource(projectId, dataSourceId);
    if (!dataSource || !dataSource.dataPath) {
      throw new Error(`Data source or data path not found: ${dataSourceId}`);
    }

    // Ensure backup directory exists
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Copy database file
    fs.copyFileSync(dataSource.dataPath, backupPath);
    
    logger.success(
      "Data source backed up",
      "database",
      { projectId, dataSourceId, backupPath },
      "SeparatedDatabaseManager"
    );
  }

  async restoreDataSource(projectId: string, dataSourceId: string, backupPath: string): Promise<void> {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    const dataSourceDb = await this.getDataSourceDb(projectId, dataSourceId);
    if (!dataSourceDb) {
      throw new Error(`Data source database not found: ${dataSourceId}`);
    }

    // Close current database
    await dataSourceDb.close();
    this.dataSourceDbs.delete(dataSourceId);

    // Copy backup to data path
    const dataPath = dataSourceDb.getDbPath();
    fs.copyFileSync(backupPath, dataPath);

    // Reopen database
    await this.ensureDataSourceDbLoaded(projectId, dataSourceId);
    
    logger.success(
      "Data source restored",
      "database",
      { projectId, dataSourceId, backupPath },
      "SeparatedDatabaseManager"
    );
  }

  async close(): Promise<void> {
    // Close all data source databases
    for (const [dataSourceId, dataSourceDb] of this.dataSourceDbs) {
      await dataSourceDb.close();
    }
    this.dataSourceDbs.clear();

    // Close core database
    await this.coreDb.close();
  }
}
