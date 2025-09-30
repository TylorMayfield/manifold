import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import path from "path";
import fs from "fs";
import { logger } from "../utils/logger";

export interface ImportResult {
  success: boolean;
  message: string;
  recordsImported?: number;
  versionId?: string;
}

export interface DataSourceConfig {
  id?: string;
  name: string;
  type: string;
  config?: any;
  lastSyncAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  status?: string;
  versionRetention?: VersionRetentionPolicy;
}

export interface VersionRetentionPolicy {
  strategy: 'keep-last' | 'keep-all' | 'keep-days';
  value?: number; // Number of versions to keep or days to retain
  autoCleanup?: boolean; // Auto-cleanup on import
}

export interface DataQueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  filters?: Record<string, any>;
}

export interface DataSourceMetadata {
  projectId: string;
  dataSourceId: string;
  dbPath: string;
  db: SqlJsDatabase | null;
  SQL: any;
}

/**
 * SeparatedDatabaseManager
 * Manages individual SQLite databases for each data source
 * Each data source gets its own database file for isolation and performance
 */
export class SeparatedDatabaseManager {
  private static instance: SeparatedDatabaseManager;
  private databases: Map<string, DataSourceMetadata> = new Map();
  private baseDataPath: string;

  private constructor() {
    // Determine base data path
    const isBuild = process.env.NEXT_PHASE === 'phase-production-build' || process.env.CI;
    
    if (isBuild || typeof window !== 'undefined') {
      this.baseDataPath = path.join(process.cwd(), "data", "datasources");
    } else {
      try {
        const electron = require("electron");
        if (electron && electron.app) {
          this.baseDataPath = path.join(electron.app.getPath("userData"), "datasources");
        } else {
          this.baseDataPath = path.join(process.cwd(), "data", "datasources");
        }
      } catch (error) {
        this.baseDataPath = path.join(process.cwd(), "data", "datasources");
      }
    }

    // Ensure base directory exists
    if (!fs.existsSync(this.baseDataPath)) {
      fs.mkdirSync(this.baseDataPath, { recursive: true });
    }

    logger.info("SeparatedDatabaseManager initialized", "database", { 
      baseDataPath: this.baseDataPath 
    });
  }

  public static getInstance(): SeparatedDatabaseManager {
    if (!SeparatedDatabaseManager.instance) {
      SeparatedDatabaseManager.instance = new SeparatedDatabaseManager();
    }
    return SeparatedDatabaseManager.instance;
  }

  /**
   * Get or create a database connection for a data source
   */
  async getDataSourceDb(projectId: string, dataSourceId: string): Promise<SqlJsDatabase> {
    const key = `${projectId}_${dataSourceId}`;
    
    if (!this.databases.has(key)) {
      const dbPath = this.getDataSourceDbPath(projectId, dataSourceId);
      const SQL = await initSqlJs();
      
      const metadata: DataSourceMetadata = {
        projectId,
        dataSourceId,
        dbPath,
        db: null,
        SQL,
      };
      
      this.databases.set(key, metadata);
    }

    const metadata = this.databases.get(key)!;
    
    if (!metadata.db) {
      // Ensure directory exists
      const dbDir = path.dirname(metadata.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Load existing database or create new one
      if (fs.existsSync(metadata.dbPath)) {
        const buffer = fs.readFileSync(metadata.dbPath);
        metadata.db = new metadata.SQL.Database(buffer);
      } else {
        metadata.db = new metadata.SQL.Database();
      }

      metadata.db.run("PRAGMA foreign_keys = ON");
      
      // Initialize tables
      this.initializeTables(metadata.db);
      
      // Save to disk
      this.saveDatabase(metadata);
      
      logger.info("Data source database opened", "database", {
        projectId,
        dataSourceId,
        path: metadata.dbPath
      });
    }

    return metadata.db;
  }

  /**
   * Save database to disk
   */
  private saveDatabase(metadata: DataSourceMetadata): void {
    if (!metadata.db) return;
    const data = metadata.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(metadata.dbPath, buffer);
  }

  /**
   * Helper to run queries and get all results
   */
  private queryAll(db: SqlJsDatabase, sql: string, params: any[] = []): any[] {
    const results = db.exec(sql, params);
    if (results.length === 0) return [];
    
    const { columns, values } = results[0];
    return values.map(row => {
      const obj: any = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  }

  /**
   * Helper to run queries and get first result
   */
  private queryOne(db: SqlJsDatabase, sql: string, params: any[] = []): any | null {
    const results = this.queryAll(db, sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Initialize database tables
   */
  private initializeTables(db: SqlJsDatabase): void {
    db.run(`
      CREATE TABLE IF NOT EXISTS data_versions (
        id TEXT PRIMARY KEY,
        version INTEGER NOT NULL,
        recordCount INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS data_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        versionId TEXT NOT NULL,
        recordData TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (versionId) REFERENCES data_versions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_records_version ON data_records(versionId);
      CREATE INDEX IF NOT EXISTS idx_versions_created ON data_versions(createdAt DESC);
    `);
  }

  /**
   * Get database path for a data source
   */
  private getDataSourceDbPath(projectId: string, dataSourceId: string): string {
    return path.join(this.baseDataPath, projectId, `${dataSourceId}.db`);
  }

  /**
   * Import data into a data source database
   */
  async importData(
    projectId: string,
    dataSourceId: string,
    data: any[],
    schema?: any,
    retentionPolicy?: VersionRetentionPolicy
  ): Promise<ImportResult> {
    try {
      const db = await this.getDataSourceDb(projectId, dataSourceId);
      const metadata = this.databases.get(`${projectId}_${dataSourceId}`)!;
      
      // Create new version
      const versionId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const version = this.getNextVersion(db);
      
      // Insert version record
      db.run(
        `INSERT INTO data_versions (id, version, recordCount, createdAt, metadata)
         VALUES (?, ?, ?, ?, ?)`,
        [
          versionId,
          version,
          data.length,
          new Date().toISOString(),
          JSON.stringify(schema || {})
        ]
      );

      // Insert all records
      for (const record of data) {
        db.run(
          `INSERT INTO data_records (versionId, recordData, createdAt)
           VALUES (?, ?, ?)`,
          [
            versionId,
            JSON.stringify(record),
            new Date().toISOString()
          ]
        );
      }

      // Save to disk
      this.saveDatabase(metadata);

      logger.success("Data imported successfully", "database", {
        projectId,
        dataSourceId,
        recordCount: data.length,
        versionId,
        version
      });

      // Apply retention policy if auto-cleanup is enabled
      if (retentionPolicy?.autoCleanup) {
        await this.applyRetentionPolicy(projectId, dataSourceId, retentionPolicy);
      }

      return {
        success: true,
        message: `Successfully imported ${data.length} records`,
        recordsImported: data.length,
        versionId,
      };
    } catch (error) {
      logger.error("Failed to import data", "database", {
        projectId,
        dataSourceId,
        error
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get next version number for a data source
   */
  private getNextVersion(db: SqlJsDatabase): number {
    const result = this.queryOne(db, `
      SELECT COALESCE(MAX(version), 0) + 1 as nextVersion
      FROM data_versions
    `);
    
    return result ? result.nextVersion : 1;
  }

  /**
   * Get data from a data source
   */
  async getDataSourceData(
    projectId: string,
    dataSourceId: string,
    options: DataQueryOptions = {}
  ): Promise<any[]> {
    try {
      const db = await this.getDataSourceDb(projectId, dataSourceId);
      
      const {
        limit = 100,
        offset = 0,
        orderBy = 'id',
        orderDirection = 'ASC'
      } = options;

      // Get latest version
      const latestVersion = this.queryOne(db, `
        SELECT id FROM data_versions
        ORDER BY version DESC
        LIMIT 1
      `);

      if (!latestVersion) {
        return [];
      }

      // Get records from latest version
      const records = this.queryAll(db, `
        SELECT recordData
        FROM data_records
        WHERE versionId = ?
        ORDER BY ${orderBy} ${orderDirection}
        LIMIT ? OFFSET ?
      `, [latestVersion.id, limit, offset]);

      return records.map((r: any) => JSON.parse(r.recordData));
    } catch (error) {
      logger.error("Failed to get data source data", "database", {
        projectId,
        dataSourceId,
        error
      });
      return [];
    }
  }

  /**
   * Get all data sources for a project (from metadata)
   */
  async getDataSources(projectId: string): Promise<DataSourceConfig[]> {
    try {
      // In a full implementation, this would query a project metadata database
      // For now, scan the filesystem for data source databases
      const projectPath = path.join(this.baseDataPath, projectId);
      
      if (!fs.existsSync(projectPath)) {
        return [];
      }

      const files = fs.readdirSync(projectPath);
      const dataSources: DataSourceConfig[] = [];

      for (const file of files) {
        if (file.endsWith('.db')) {
          const dataSourceId = file.replace('.db', '');
          const stats = fs.statSync(path.join(projectPath, file));
          
          dataSources.push({
            id: dataSourceId,
            name: dataSourceId, // In real impl, would come from metadata
            type: 'unknown',
            createdAt: stats.birthtime,
            updatedAt: stats.mtime,
          });
        }
      }

      return dataSources;
    } catch (error) {
      logger.error("Failed to get data sources", "database", {
        projectId,
        error
      });
      return [];
    }
  }

  /**
   * Create a new data source
   */
  async createDataSource(projectId: string, config: DataSourceConfig): Promise<DataSourceConfig> {
    try {
      const dataSourceId = config.id || `ds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create database for this data source
      const db = await this.getDataSourceDb(projectId, dataSourceId);
      
      logger.success("Data source created", "database", {
        projectId,
        dataSourceId,
        name: config.name,
        type: config.type
      });

      return {
        ...config,
        id: dataSourceId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
      };
    } catch (error) {
      logger.error("Failed to create data source", "database", {
        projectId,
        config,
        error
      });
      throw error;
    }
  }

  /**
   * Update a data source configuration
   */
  async updateDataSource(
    projectId: string,
    dataSourceId: string,
    updates: Partial<DataSourceConfig>
  ): Promise<void> {
    try {
      // In a full implementation, this would update metadata in a project database
      // For now, log the update
      logger.info("Data source updated", "database", {
        projectId,
        dataSourceId,
        updates
      });
    } catch (error) {
      logger.error("Failed to update data source", "database", {
        projectId,
        dataSourceId,
        error
      });
      throw error;
    }
  }

  /**
   * Delete a data source and its database
   */
  async deleteDataSource(projectId: string, dataSourceId: string): Promise<void> {
    try {
      const key = `${projectId}_${dataSourceId}`;
      
      // Close database connection if open
      if (this.databases.has(key)) {
        const metadata = this.databases.get(key)!;
        if (metadata.db) {
          metadata.db.close();
        }
        this.databases.delete(key);
      }

      // Delete database file
      const dbPath = this.getDataSourceDbPath(projectId, dataSourceId);
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        
        logger.success("Data source deleted", "database", {
          projectId,
          dataSourceId,
          path: dbPath
        });
      }
    } catch (error) {
      logger.error("Failed to delete data source", "database", {
        projectId,
        dataSourceId,
        error
      });
      throw error;
    }
  }

  /**
   * Get statistics for a data source
   */
  async getDataSourceStats(projectId: string, dataSourceId: string): Promise<any> {
    try {
      const db = await this.getDataSourceDb(projectId, dataSourceId);
      
      const stats = this.queryOne(db, `
        SELECT 
          COUNT(DISTINCT id) as totalVersions,
          COALESCE(SUM(recordCount), 0) as totalRecords,
          MAX(version) as latestVersion,
          MIN(version) as oldestVersion
        FROM data_versions
      `) || { totalVersions: 0, totalRecords: 0, latestVersion: null, oldestVersion: null };

      const latestImport = this.queryOne(db, `
        SELECT createdAt FROM data_versions
        ORDER BY createdAt DESC LIMIT 1
      `);

      return {
        ...stats,
        lastImportAt: latestImport ? new Date(latestImport.createdAt) : null,
        dataSizeBytes: fs.existsSync(this.getDataSourceDbPath(projectId, dataSourceId))
          ? fs.statSync(this.getDataSourceDbPath(projectId, dataSourceId)).size
          : 0
      };
    } catch (error) {
      logger.error("Failed to get data source stats", "database", {
        projectId,
        dataSourceId,
        error
      });
      return null;
    }
  }

  /**
   * Get all versions for a data source
   */
  async getDataVersions(projectId: string, dataSourceId: string): Promise<any[]> {
    try {
      const db = await this.getDataSourceDb(projectId, dataSourceId);
      
      const versions = this.queryAll(db, `
        SELECT id, version, recordCount, createdAt, metadata
        FROM data_versions
        ORDER BY version DESC
      `);

      return versions.map((v: any) => ({
        ...v,
        createdAt: new Date(v.createdAt),
        metadata: v.metadata ? JSON.parse(v.metadata) : null
      }));
    } catch (error) {
      logger.error("Failed to get data versions", "database", {
        projectId,
        dataSourceId,
        error
      });
      return [];
    }
  }

  /**
   * Close a specific data source database
   */
  async closeDataSource(projectId: string, dataSourceId: string): Promise<void> {
    const key = `${projectId}_${dataSourceId}`;
    
    if (this.databases.has(key)) {
      const metadata = this.databases.get(key)!;
      if (metadata.db) {
        metadata.db.close();
        metadata.db = null;
      }
      this.databases.delete(key);
      
      logger.info("Data source database closed", "database", {
        projectId,
        dataSourceId
      });
    }
  }

  /**
   * Close all database connections
   */
  async closeAll(): Promise<void> {
    for (const [key, metadata] of this.databases.entries()) {
      if (metadata.db) {
        metadata.db.close();
      }
    }
    this.databases.clear();
    
    logger.info("All data source databases closed", "database");
  }

  /**
   * Get database file size
   */
  async getDataSourceSize(projectId: string, dataSourceId: string): Promise<number> {
    const dbPath = this.getDataSourceDbPath(projectId, dataSourceId);
    
    if (fs.existsSync(dbPath)) {
      return fs.statSync(dbPath).size;
    }
    
    return 0;
  }

  /**
   * Compact/vacuum a data source database
   */
  async compactDataSource(projectId: string, dataSourceId: string): Promise<void> {
    try {
      const db = await this.getDataSourceDb(projectId, dataSourceId);
      db.exec('VACUUM');
      
      logger.success("Data source database compacted", "database", {
        projectId,
        dataSourceId
      });
    } catch (error) {
      logger.error("Failed to compact data source database", "database", {
        projectId,
        dataSourceId,
        error
      });
      throw error;
    }
  }

  /**
   * Delete old versions to save space
   */
  async cleanupOldVersions(
    projectId: string,
    dataSourceId: string,
    keepVersions: number = 10
  ): Promise<number> {
    try {
      const db = await this.getDataSourceDb(projectId, dataSourceId);
      
      // Get versions to delete (keep latest N versions)
      const versionsToDelete = db.prepare(`
        SELECT id FROM data_versions
        ORDER BY version DESC
        LIMIT -1 OFFSET ?
      `).all(keepVersions) as { id: string }[];

      if (versionsToDelete.length === 0) {
        return 0;
      }

      // Delete old versions
      const deleteRecords = db.prepare(`
        DELETE FROM data_records WHERE versionId = ?
      `);

      const deleteVersion = db.prepare(`
        DELETE FROM data_versions WHERE id = ?
      `);

      const transaction = db.transaction(() => {
        for (const version of versionsToDelete) {
          deleteRecords.run(version.id);
          deleteVersion.run(version.id);
        }
      });

      transaction();

      logger.success("Old versions cleaned up", "database", {
        projectId,
        dataSourceId,
        deletedVersions: versionsToDelete.length,
        keptVersions: keepVersions
      });

      return versionsToDelete.length;
    } catch (error) {
      logger.error("Failed to cleanup old versions", "database", {
        projectId,
        dataSourceId,
        error
      });
      throw error;
    }
  }

  /**
   * Apply retention policy to a data source
   */
  async applyRetentionPolicy(
    projectId: string,
    dataSourceId: string,
    policy: VersionRetentionPolicy
  ): Promise<number> {
    try {
      let deletedCount = 0;

      switch (policy.strategy) {
        case 'keep-last':
          // Keep only the last N versions
          const keepCount = policy.value || 10;
          deletedCount = await this.cleanupOldVersions(projectId, dataSourceId, keepCount);
          logger.info(`Applied keep-last policy: keeping ${keepCount} versions`, "database", {
            projectId,
            dataSourceId,
            deletedCount
          });
          break;

        case 'keep-days':
          // Keep versions from the last N days
          const days = policy.value || 30;
          deletedCount = await this.cleanupVersionsByAge(projectId, dataSourceId, days);
          logger.info(`Applied keep-days policy: keeping ${days} days`, "database", {
            projectId,
            dataSourceId,
            deletedCount
          });
          break;

        case 'keep-all':
          // Don't delete anything
          logger.info("Applied keep-all policy: no cleanup", "database", {
            projectId,
            dataSourceId
          });
          break;

        default:
          logger.warn("Unknown retention strategy", "database", {
            projectId,
            dataSourceId,
            strategy: policy.strategy
          });
      }

      return deletedCount;
    } catch (error) {
      logger.error("Failed to apply retention policy", "database", {
        projectId,
        dataSourceId,
        policy,
        error
      });
      throw error;
    }
  }

  /**
   * Clean up versions older than specified days
   */
  async cleanupVersionsByAge(
    projectId: string,
    dataSourceId: string,
    days: number
  ): Promise<number> {
    try {
      const db = await this.getDataSourceDb(projectId, dataSourceId);
      
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffISO = cutoffDate.toISOString();

      // Get versions older than cutoff
      const versionsToDelete = db.prepare(`
        SELECT id FROM data_versions
        WHERE createdAt < ?
      `).all(cutoffISO) as { id: string }[];

      if (versionsToDelete.length === 0) {
        return 0;
      }

      // Delete old versions
      const deleteRecords = db.prepare(`
        DELETE FROM data_records WHERE versionId = ?
      `);

      const deleteVersion = db.prepare(`
        DELETE FROM data_versions WHERE id = ?
      `);

      const transaction = db.transaction(() => {
        for (const version of versionsToDelete) {
          deleteRecords.run(version.id);
          deleteVersion.run(version.id);
        }
      });

      transaction();

      logger.success("Old versions cleaned up by age", "database", {
        projectId,
        dataSourceId,
        deletedVersions: versionsToDelete.length,
        days,
        cutoffDate: cutoffISO
      });

      return versionsToDelete.length;
    } catch (error) {
      logger.error("Failed to cleanup versions by age", "database", {
        projectId,
        dataSourceId,
        error
      });
      throw error;
    }
  }

  /**
   * Set retention policy for a data source
   */
  async setRetentionPolicy(
    projectId: string,
    dataSourceId: string,
    policy: VersionRetentionPolicy
  ): Promise<void> {
    try {
      // Store policy in database metadata table
      const db = await this.getDataSourceDb(projectId, dataSourceId);
      
      // Create metadata table if it doesn't exist
      db.exec(`
        CREATE TABLE IF NOT EXISTS datasource_metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);

      // Store retention policy
      db.run(
        `INSERT OR REPLACE INTO datasource_metadata (key, value, updatedAt)
         VALUES ('retentionPolicy', ?, ?)`,
        [
          JSON.stringify(policy),
          new Date().toISOString()
        ]
      );

      // Save to disk
      const metadata = this.databases.get(`${projectId}_${dataSourceId}`)!;
      this.saveDatabase(metadata);

      logger.info("Retention policy set", "database", {
        projectId,
        dataSourceId,
        policy
      });
    } catch (error) {
      logger.error("Failed to set retention policy", "database", {
        projectId,
        dataSourceId,
        error
      });
      throw error;
    }
  }

  /**
   * Get retention policy for a data source
   */
  async getRetentionPolicy(
    projectId: string,
    dataSourceId: string
  ): Promise<VersionRetentionPolicy | null> {
    try {
      const db = await this.getDataSourceDb(projectId, dataSourceId);
      
      // Check if metadata table exists
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='datasource_metadata'
      `).get();

      if (!tableExists) {
        return null;
      }

      // Get retention policy
      const result = db.prepare(`
        SELECT value FROM datasource_metadata
        WHERE key = 'retentionPolicy'
      `).get() as { value: string } | undefined;

      if (!result) {
        return null;
      }

      return JSON.parse(result.value) as VersionRetentionPolicy;
    } catch (error) {
      logger.error("Failed to get retention policy", "database", {
        projectId,
        dataSourceId,
        error
      });
      return null;
    }
  }

  /**
   * Get retention info for a data source
   */
  async getRetentionInfo(
    projectId: string,
    dataSourceId: string
  ): Promise<{
    policy: VersionRetentionPolicy | null;
    totalVersions: number;
    oldestVersion: Date | null;
    newestVersion: Date | null;
    estimatedDeletableVersions: number;
  }> {
    try {
      const db = await this.getDataSourceDb(projectId, dataSourceId);
      const policy = await this.getRetentionPolicy(projectId, dataSourceId);

      // Get version info
      const versionInfo = db.prepare(`
        SELECT 
          COUNT(*) as total,
          MIN(createdAt) as oldest,
          MAX(createdAt) as newest
        FROM data_versions
      `).get() as { total: number; oldest: string; newest: string };

      let estimatedDeletable = 0;

      if (policy) {
        switch (policy.strategy) {
          case 'keep-last':
            const keepCount = policy.value || 10;
            estimatedDeletable = Math.max(0, versionInfo.total - keepCount);
            break;

          case 'keep-days':
            const days = policy.value || 30;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            const oldCount = db.prepare(`
              SELECT COUNT(*) as count FROM data_versions
              WHERE createdAt < ?
            `).get(cutoffDate.toISOString()) as { count: number };
            estimatedDeletable = oldCount.count;
            break;

          case 'keep-all':
            estimatedDeletable = 0;
            break;
        }
      }

      return {
        policy,
        totalVersions: versionInfo.total,
        oldestVersion: versionInfo.oldest ? new Date(versionInfo.oldest) : null,
        newestVersion: versionInfo.newest ? new Date(versionInfo.newest) : null,
        estimatedDeletableVersions: estimatedDeletable
      };
    } catch (error) {
      logger.error("Failed to get retention info", "database", {
        projectId,
        dataSourceId,
        error
      });
      throw error;
    }
  }
}