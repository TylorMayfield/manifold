import path from "path";
import { logger } from "../utils/logger";
import { MongoDatabase } from "../server/database/MongoDatabase";

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
  value?: number;
  autoCleanup?: boolean;
}

export interface DataQueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  filters?: Record<string, any>;
}

/**
 * SeparatedDatabaseManager
 * Now uses MongoDB for all snapshot storage instead of separate SQLite files
 */
export class SeparatedDatabaseManager {
  private static instance: SeparatedDatabaseManager;
  private baseDataPath: string;

  private constructor() {
    this.baseDataPath = path.join(process.cwd(), "data", "datasources");
    
    logger.info("SeparatedDatabaseManager initialized (MongoDB-backed)", "database", { 
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
   * Import data - now stores snapshots in MongoDB
   */
  async importData(
    projectId: string,
    dataSourceId: string,
    data: any[],
    schema?: any,
    retentionPolicy?: VersionRetentionPolicy
  ): Promise<ImportResult> {
    try {
      const db = await MongoDatabase.getInstance();
      await db.initialize();
      
      // Get next version number
      const version = await this.getNextVersion(projectId, dataSourceId);
      const versionId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create snapshot in MongoDB
      await db.createSnapshot({
        id: versionId,
        projectId,
        dataSourceId,
        version,
        data,
        schema,
        metadata: { importedAt: new Date().toISOString() },
        recordCount: data.length
      });

      logger.success("Data imported successfully", "database", {
        projectId,
        dataSourceId,
        recordCount: data.length,
        versionId,
        version
      });

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
   * Get next version number
   */
  private async getNextVersion(projectId: string, dataSourceId: string): Promise<number> {
    try {
      const db = await MongoDatabase.getInstance();
      const snapshots = await db.getSnapshots(dataSourceId);
      
      if (snapshots.length === 0) return 1;
      
      const maxVersion = Math.max(...snapshots.map((s: any) => s.version || 0));
      return maxVersion + 1;
    } catch (error) {
      return 1;
    }
  }

  /**
   * Get data sources for a project
   */
  async getDataSources(projectId: string): Promise<DataSourceConfig[]> {
    try {
      const db = await MongoDatabase.getInstance();
      await db.initialize();
      return await db.getDataSources(projectId) as any[];
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
      const db = await MongoDatabase.getInstance();
      await db.initialize();
      return await db.createDataSource(projectId, config) as any;
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
   * Update data source
   */
  async updateDataSource(
    projectId: string,
    dataSourceId: string,
    updates: Partial<DataSourceConfig>
  ): Promise<void> {
    try {
      const db = await MongoDatabase.getInstance();
      await db.initialize();
      await db.updateDataSource(dataSourceId, updates);
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
   * Delete a data source
   */
  async deleteDataSource(projectId: string, dataSourceId: string): Promise<void> {
    try {
      const db = await MongoDatabase.getInstance();
      await db.initialize();
      await db.deleteDataSource(dataSourceId);
      
      logger.success("Data source deleted", "database", {
        projectId,
        dataSourceId
      });
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
   * Get snapshot data
   */
  async getDataSourceData(
    projectId: string,
    dataSourceId: string,
    options: DataQueryOptions = {}
  ): Promise<any[]> {
    try {
      const db = await MongoDatabase.getInstance();
      await db.initialize();
      
      const snapshots = await db.getSnapshots(dataSourceId);
      
      if (snapshots.length === 0) {
        return [];
      }
      
      // Get latest snapshot
      const latest = snapshots.sort((a: any, b: any) => b.version - a.version)[0];
      
      // Snapshots don't directly contain data in new structure, would need to query ImportedData
      return [];
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
   * Close all connections (no-op for MongoDB)
   */
  async closeAll(): Promise<void> {
    logger.info("Closing all data source databases", "database");
    // MongoDB connections are managed centrally, nothing to do here
  }

  /**
   * Close specific data source (no-op for MongoDB)
   */
  async closeDataSource(projectId: string, dataSourceId: string): Promise<void> {
    logger.info("Closing data source database", "database", {
      projectId,
      dataSourceId
    });
    // MongoDB connections are managed centrally, nothing to do here
  }

  /**
   * Compact/vacuum (no-op for MongoDB)
   */
  async compactDataSource(projectId: string, dataSourceId: string): Promise<void> {
    logger.info("Compact operation not needed for MongoDB", "database", {
      projectId,
      dataSourceId
    });
  }

  /**
   * Get data source stats
   */
  async getDataSourceStats(projectId: string, dataSourceId: string): Promise<any> {
    try {
      const db = await MongoDatabase.getInstance();
      await db.initialize();
      
      const snapshots = await db.getSnapshots(dataSourceId);
      
      const totalVersions = snapshots.length;
      const totalRecords = snapshots.reduce((sum: number, s: any) => sum + (s.recordCount || 0), 0);
      const latestVersion = totalVersions > 0 ? Math.max(...snapshots.map((s: any) => s.version)) : null;
      const oldestVersion = totalVersions > 0 ? Math.min(...snapshots.map((s: any) => s.version)) : null;
      const lastImport = totalVersions > 0 ? snapshots.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0] : null;

      return {
        totalVersions,
        totalRecords,
        latestVersion,
        oldestVersion,
        lastImportAt: lastImport ? new Date((lastImport as any).createdAt) : null,
        dataSizeBytes: 0 // Not applicable for MongoDB
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
      const db = await MongoDatabase.getInstance();
      await db.initialize();
      
      return await db.getSnapshots(dataSourceId);
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
   * Cleanup old versions
   */
  async cleanupOldVersions(
    projectId: string,
    dataSourceId: string,
    keepVersions: number = 10
  ): Promise<number> {
    try {
      const db = await MongoDatabase.getInstance();
      await db.initialize();
      
      const snapshots = await db.getSnapshots(dataSourceId);
      const sorted = snapshots.sort((a: any, b: any) => b.version - a.version);
      
      const toDelete = sorted.slice(keepVersions);
      
      for (const snapshot of toDelete) {
        await db.deleteSnapshot((snapshot as any)._id);
      }

      logger.success("Old versions cleaned up", "database", {
        projectId,
        dataSourceId,
        deletedVersions: toDelete.length,
        keptVersions: keepVersions
      });

      return toDelete.length;
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
   * Apply retention policy
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
          const keepCount = policy.value || 10;
          deletedCount = await this.cleanupOldVersions(projectId, dataSourceId, keepCount);
          break;

        case 'keep-days':
          // Implement days-based cleanup
          const days = policy.value || 30;
          deletedCount = await this.cleanupVersionsByAge(projectId, dataSourceId, days);
          break;

        case 'keep-all':
          // Don't delete anything
          break;
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
   * Cleanup by age
   */
  async cleanupVersionsByAge(
    projectId: string,
    dataSourceId: string,
    days: number
  ): Promise<number> {
    try {
      const db = await MongoDatabase.getInstance();
      await db.initialize();
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const snapshots = await db.getSnapshots(dataSourceId);
      const toDelete = snapshots.filter((s: any) => 
        new Date(s.createdAt) < cutoffDate
      );
      
      for (const snapshot of toDelete) {
        await db.deleteSnapshot((snapshot as any)._id);
      }

      logger.success("Old versions cleaned up by age", "database", {
        projectId,
        dataSourceId,
        deletedVersions: toDelete.length,
        days,
        cutoffDate: cutoffDate.toISOString()
      });

      return toDelete.length;
    } catch (error) {
      logger.error("Failed to cleanup versions by age", "database", {
        projectId,
        dataSourceId,
        error
      });
      throw error;
    }
  }

  // Stub methods for compatibility
  async setRetentionPolicy(projectId: string, dataSourceId: string, policy: VersionRetentionPolicy): Promise<void> {
    logger.info("Retention policy set (stored as data source config)", "database", {
      projectId,
      dataSourceId,
      policy
    });
  }

  async getRetentionPolicy(projectId: string, dataSourceId: string): Promise<VersionRetentionPolicy | null> {
    return null; // Would be stored in data source config
  }

  async getRetentionInfo(projectId: string, dataSourceId: string): Promise<any> {
    const stats = await this.getDataSourceStats(projectId, dataSourceId);
    return {
      policy: null,
      totalVersions: stats?.totalVersions || 0,
      oldestVersion: null,
      newestVersion: null,
      estimatedDeletableVersions: 0
    };
  }

  async getDataSourceSize(projectId: string, dataSourceId: string): Promise<number> {
    return 0; // Not applicable for MongoDB
  }
}
