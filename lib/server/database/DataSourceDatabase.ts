import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { logger } from "../utils/logger";

export interface DataVersion {
  id: string;
  version: number;
  data: any[];
  schema: any;
  metadata: any;
  recordCount: number;
  createdAt: Date;
  previousVersionId?: string;
  diffData?: any; // Changes from previous version
}

export interface DataSourceStats {
  totalVersions: number;
  totalRecords: number;
  latestVersion: number;
  oldestVersion: number;
  dataSizeBytes: number;
  lastImportAt: Date;
}

export class DataSourceDatabase {
  private static instances: Map<string, DataSourceDatabase> = new Map();
  private db: Database.Database;
  private dataSourceId: string;
  private dbPath: string;
  private projectId: string;

  private constructor(projectId: string, dataSourceId: string, dbPath: string) {
    this.projectId = projectId;
    this.dataSourceId = dataSourceId;
    this.dbPath = dbPath;
    this.db = new Database(dbPath);
    
    // Enable foreign keys and WAL mode for better performance
    this.db.pragma("foreign_keys = ON");
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("synchronous = NORMAL");
  }

  static getInstance(projectId: string, dataSourceId: string, dbPath: string): DataSourceDatabase {
    const key = `${projectId}_${dataSourceId}`;
    if (!DataSourceDatabase.instances.has(key)) {
      DataSourceDatabase.instances.set(
        key,
        new DataSourceDatabase(projectId, dataSourceId, dbPath)
      );
    }
    return DataSourceDatabase.instances.get(key)!;
  }

  async initialize(): Promise<void> {
    try {
      // Ensure database file exists
      if (!fs.existsSync(this.dbPath)) {
        // Create directory if it doesn't exist
        const dbDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }
      }

      // Create tables
      this.createTables();
      
      logger.success(
        "Data source database initialized",
        "database",
        { 
          projectId: this.projectId, 
          dataSourceId: this.dataSourceId,
          path: this.dbPath 
        },
        "DataSourceDatabase"
      );
    } catch (error) {
      logger.error(
        "Failed to initialize data source database",
        "database",
        { 
          projectId: this.projectId, 
          dataSourceId: this.dataSourceId,
          error 
        },
        "DataSourceDatabase"
      );
      throw error;
    }
  }

  private createTables(): void {
    // Data versions table - stores each import as a version
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS data_versions (
        id TEXT PRIMARY KEY,
        version INTEGER NOT NULL,
        data TEXT NOT NULL, -- JSON array of records
        schema TEXT, -- JSON schema definition
        metadata TEXT, -- JSON metadata about the import
        record_count INTEGER NOT NULL DEFAULT 0,
        previous_version_id TEXT,
        diff_data TEXT, -- JSON diff data from previous version
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (previous_version_id) REFERENCES data_versions(id)
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_data_versions_version ON data_versions(version);
      CREATE INDEX IF NOT EXISTS idx_data_versions_created_at ON data_versions(created_at);
      CREATE INDEX IF NOT EXISTS idx_data_versions_previous_version ON data_versions(previous_version_id);
    `);

    // Schema evolution tracking
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_versions (
        id TEXT PRIMARY KEY,
        version INTEGER NOT NULL,
        schema TEXT NOT NULL, -- JSON schema
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Import logs for debugging and monitoring
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS import_logs (
        id TEXT PRIMARY KEY,
        version_id TEXT NOT NULL,
        status TEXT NOT NULL, -- pending, completed, failed
        message TEXT,
        error_details TEXT,
        duration_ms INTEGER,
        records_processed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (version_id) REFERENCES data_versions(id)
      )
    `);

    // Data quality metrics
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS quality_metrics (
        id TEXT PRIMARY KEY,
        version_id TEXT NOT NULL,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        threshold REAL,
        status TEXT, -- pass, warning, fail
        details TEXT, -- JSON details
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (version_id) REFERENCES data_versions(id)
      )
    `);
  }

  // Version management
  async createVersion(data: {
    data: any[];
    schema?: any;
    metadata?: any;
    previousVersionId?: string;
  }): Promise<DataVersion> {
    const versionId = `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get next version number
    const latestVersion = await this.getLatestVersion();
    const versionNumber = latestVersion ? latestVersion.version + 1 : 1;

    // Calculate diff if there's a previous version
    let diffData = null;
    if (data.previousVersionId || latestVersion) {
      const prevVersion = data.previousVersionId 
        ? await this.getVersionById(data.previousVersionId)
        : latestVersion;
      
      if (prevVersion) {
        diffData = this.calculateDiff(prevVersion.data, data.data);
      }
    }

    const stmt = this.db.prepare(`
      INSERT INTO data_versions (
        id, version, data, schema, metadata, record_count, 
        previous_version_id, diff_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      versionId,
      versionNumber,
      JSON.stringify(data.data),
      data.schema ? JSON.stringify(data.schema) : null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.data.length,
      data.previousVersionId || (latestVersion ? latestVersion.id : null),
      diffData ? JSON.stringify(diffData) : null
    );

    // Update schema version if schema changed
    if (data.schema) {
      await this.updateSchemaVersion(data.schema, versionNumber);
    }

    return await this.getVersionById(versionId);
  }

  async getLatestVersion(): Promise<DataVersion | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM data_versions 
      ORDER BY version DESC 
      LIMIT 1
    `);
    
    const result = stmt.get() as any;
    return result ? this.mapToDataVersion(result) : null;
  }

  async getVersionById(id: string): Promise<DataVersion | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM data_versions WHERE id = ?
    `);
    
    const result = stmt.get(id) as any;
    return result ? this.mapToDataVersion(result) : null;
  }

  async getVersionByNumber(version: number): Promise<DataVersion | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM data_versions WHERE version = ?
    `);
    
    const result = stmt.get(version) as any;
    return result ? this.mapToDataVersion(result) : null;
  }

  async getAllVersions(limit?: number): Promise<DataVersion[]> {
    const query = `
      SELECT * FROM data_versions 
      ORDER BY version DESC
      ${limit ? `LIMIT ${limit}` : ''}
    `;
    
    const stmt = this.db.prepare(query);
    const results = stmt.all() as any[];
    
    return results.map(result => this.mapToDataVersion(result));
  }

  async getVersionDiff(fromVersion: number, toVersion: number): Promise<any> {
    const fromVer = await this.getVersionByNumber(fromVersion);
    const toVer = await this.getVersionByNumber(toVersion);
    
    if (!fromVer || !toVer) {
      throw new Error(`Version not found: ${fromVersion} or ${toVersion}`);
    }

    return this.calculateDiff(fromVer.data, toVer.data);
  }

  private calculateDiff(oldData: any[], newData: any[]): any {
    const oldMap = new Map(oldData.map(item => [item.id || JSON.stringify(item), item]));
    const newMap = new Map(newData.map(item => [item.id || JSON.stringify(item), item]));
    
    const added = [];
    const removed = [];
    const modified = [];
    
    // Find added and modified records
    for (const [key, newItem] of newMap) {
      if (!oldMap.has(key)) {
        added.push(newItem);
      } else {
        const oldItem = oldMap.get(key);
        if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
          modified.push({
            old: oldItem,
            new: newItem,
            changes: this.getObjectDiff(oldItem, newItem)
          });
        }
      }
    }
    
    // Find removed records
    for (const [key, oldItem] of oldMap) {
      if (!newMap.has(key)) {
        removed.push(oldItem);
      }
    }
    
    return {
      added: added.length,
      removed: removed.length,
      modified: modified.length,
      totalChanges: added.length + removed.length + modified.length,
      details: { added, removed, modified }
    };
  }

  private getObjectDiff(oldObj: any, newObj: any): any {
    const changes: any = {};
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    
    for (const key of allKeys) {
      if (!(key in oldObj)) {
        changes[key] = { type: 'added', value: newObj[key] };
      } else if (!(key in newObj)) {
        changes[key] = { type: 'removed', value: oldObj[key] };
      } else if (oldObj[key] !== newObj[key]) {
        changes[key] = { 
          type: 'modified', 
          oldValue: oldObj[key], 
          newValue: newObj[key] 
        };
      }
    }
    
    return changes;
  }

  private mapToDataVersion(result: any): DataVersion {
    return {
      id: result.id,
      version: result.version,
      data: JSON.parse(result.data),
      schema: result.schema ? JSON.parse(result.schema) : null,
      metadata: result.metadata ? JSON.parse(result.metadata) : null,
      recordCount: result.record_count,
      createdAt: new Date(result.created_at),
      previousVersionId: result.previous_version_id,
      diffData: result.diff_data ? JSON.parse(result.diff_data) : null
    };
  }

  // Schema management
  private async updateSchemaVersion(schema: any, version: number): Promise<void> {
    const schemaId = `schema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const stmt = this.db.prepare(`
      INSERT INTO schema_versions (id, version, schema, description)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(
      schemaId,
      version,
      JSON.stringify(schema),
      `Schema for data version ${version}`
    );
  }

  async getLatestSchema(): Promise<any> {
    const stmt = this.db.prepare(`
      SELECT schema FROM schema_versions 
      ORDER BY version DESC 
      LIMIT 1
    `);
    
    const result = stmt.get() as any;
    return result ? JSON.parse(result.schema) : null;
  }

  // Import logging
  async createImportLog(versionId: string, status: string, message?: string): Promise<string> {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const stmt = this.db.prepare(`
      INSERT INTO import_logs (id, version_id, status, message, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(logId, versionId, status, message);
    return logId;
  }

  async updateImportLog(
    logId: string, 
    data: {
      status?: string;
      message?: string;
      errorDetails?: string;
      durationMs?: number;
      recordsProcessed?: number;
    }
  ): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE import_logs 
      SET status = COALESCE(?, status),
          message = COALESCE(?, message),
          error_details = COALESCE(?, error_details),
          duration_ms = COALESCE(?, duration_ms),
          records_processed = COALESCE(?, records_processed),
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      data.status || null,
      data.message || null,
      data.errorDetails || null,
      data.durationMs || null,
      data.recordsProcessed || null,
      logId
    );
  }

  // Quality metrics
  async addQualityMetric(
    versionId: string,
    metric: {
      name: string;
      value: number;
      threshold?: number;
      status?: string;
      details?: any;
    }
  ): Promise<void> {
    const metricId = `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const stmt = this.db.prepare(`
      INSERT INTO quality_metrics (
        id, version_id, metric_name, metric_value, threshold, status, details
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      metricId,
      versionId,
      metric.name,
      metric.value,
      metric.threshold || null,
      metric.status || null,
      metric.details ? JSON.stringify(metric.details) : null
    );
  }

  async getQualityMetrics(versionId?: string): Promise<any[]> {
    const query = versionId 
      ? `SELECT * FROM quality_metrics WHERE version_id = ? ORDER BY created_at DESC`
      : `SELECT * FROM quality_metrics ORDER BY created_at DESC`;
    
    const stmt = this.db.prepare(query);
    const results = versionId ? stmt.all(versionId) : stmt.all();
    
    return (results as any[]).map(result => ({
      ...result,
      details: result.details ? JSON.parse(result.details) : null
    }));
  }

  // Statistics and analytics
  async getStats(): Promise<DataSourceStats> {
    const versionCount = this.db.prepare(`SELECT COUNT(*) as count FROM data_versions`).get() as any;
    const recordCount = this.db.prepare(`SELECT SUM(record_count) as total FROM data_versions`).get() as any;
    const latestVersion = this.db.prepare(`SELECT MAX(version) as max FROM data_versions`).get() as any;
    const oldestVersion = this.db.prepare(`SELECT MIN(version) as min FROM data_versions`).get() as any;
    const lastImport = this.db.prepare(`SELECT MAX(created_at) as last FROM data_versions`).get() as any;
    
    // Calculate database file size
    const stats = fs.statSync(this.dbPath);
    
    return {
      totalVersions: versionCount.count || 0,
      totalRecords: recordCount.total || 0,
      latestVersion: latestVersion.max || 0,
      oldestVersion: oldestVersion.min || 0,
      dataSizeBytes: stats.size,
      lastImportAt: lastImport.last ? new Date(lastImport.last) : new Date()
    };
  }

  // Cleanup operations
  async cleanupOldVersions(keepVersions: number = 10): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM data_versions 
      WHERE id NOT IN (
        SELECT id FROM data_versions 
        ORDER BY version DESC 
        LIMIT ?
      )
    `);
    
    const result = stmt.run(keepVersions);
    logger.info(
      `Cleaned up ${result.changes} old versions`,
      "database",
      { dataSourceId: this.dataSourceId, keepVersions },
      "DataSourceDatabase"
    );
  }

  async close(): Promise<void> {
    await this.db.close();
    const key = `${this.projectId}_${this.dataSourceId}`;
    DataSourceDatabase.instances.delete(key);
  }

  getDbPath(): string {
    return this.dbPath;
  }

  getDataSourceId(): string {
    return this.dataSourceId;
  }

  getProjectId(): string {
    return this.projectId;
  }
}
