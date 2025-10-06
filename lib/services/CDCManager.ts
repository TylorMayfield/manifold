/**
 * Change Data Capture (CDC) Manager
 * 
 * Implements incremental data loading by tracking changes and syncing only
 * new, modified, or deleted records instead of full reloads.
 * 
 * Features:
 * - Watermark-based CDC (timestamp tracking)
 * - Hash-based change detection
 * - Incremental sync strategies
 * - Merge operations (insert, update, delete)
 * - Conflict resolution
 */

import { logger } from '../utils/logger';
import crypto from 'crypto';

// ==================== TYPES ====================

export interface CDCConfig {
  dataSourceId: string;
  trackingMode: 'timestamp' | 'hash' | 'version' | 'log';
  timestampColumn?: string;
  primaryKey?: string | string[];
  compareColumns?: string[];
  enableDeletes?: boolean;
  batchSize?: number;
}

export interface CDCWatermark {
  dataSourceId: string;
  lastSyncTimestamp: Date;
  lastSyncVersion?: number;
  lastProcessedId?: string;
  recordsProcessed: number;
  metadata?: Record<string, any>;
}

export interface ChangeSet {
  inserts: any[];
  updates: any[];
  deletes: any[];
  unchanged: number;
  totalRecords: number;
  timestamp: Date;
}

export interface CDCSyncResult {
  dataSourceId: string;
  syncTimestamp: Date;
  changeSet: ChangeSet;
  watermark: CDCWatermark;
  duration: number;
  errors: string[];
}

export interface MergeStrategy {
  onConflict: 'source-wins' | 'target-wins' | 'newest-wins' | 'manual';
  softDelete?: boolean;
  auditChanges?: boolean;
}

// ==================== CDC MANAGER ====================

export class CDCManager {
  private static instance: CDCManager;
  private watermarks: Map<string, CDCWatermark> = new Map();

  static getInstance(): CDCManager {
    if (!CDCManager.instance) {
      CDCManager.instance = new CDCManager();
    }
    return CDCManager.instance;
  }

  /**
   * Perform incremental sync for a data source
   */
  async incrementalSync(
    dataSourceId: string,
    newData: any[],
    existingData: any[],
    config: CDCConfig
  ): Promise<CDCSyncResult> {
    const startTime = Date.now();
    const syncTimestamp = new Date();
    const errors: string[] = [];

    logger.info(`Starting incremental sync for ${dataSourceId}`, 'cdc', {
      dataSourceId,
      trackingMode: config.trackingMode,
      newRecords: newData.length,
      existingRecords: existingData.length,
    });

    try {
      // Get or create watermark
      let watermark = this.watermarks.get(dataSourceId) || {
        dataSourceId,
        lastSyncTimestamp: new Date(0),
        recordsProcessed: 0,
      };

      // Detect changes based on tracking mode
      let changeSet: ChangeSet;

      switch (config.trackingMode) {
        case 'timestamp':
          changeSet = await this.detectChangesTimestamp(newData, existingData, config, watermark);
          break;
        
        case 'hash':
          changeSet = await this.detectChangesHash(newData, existingData, config);
          break;
        
        case 'version':
          changeSet = await this.detectChangesVersion(newData, existingData, config);
          break;
        
        case 'log':
          changeSet = await this.detectChangesLog(newData, existingData, config);
          break;
        
        default:
          throw new Error(`Unknown tracking mode: ${config.trackingMode}`);
      }

      // Update watermark
      watermark = {
        ...watermark,
        lastSyncTimestamp: syncTimestamp,
        recordsProcessed: watermark.recordsProcessed + changeSet.inserts.length + changeSet.updates.length,
      };

      this.watermarks.set(dataSourceId, watermark);

      const duration = Date.now() - startTime;

      logger.success(`Incremental sync completed for ${dataSourceId}`, 'cdc', {
        dataSourceId,
        inserts: changeSet.inserts.length,
        updates: changeSet.updates.length,
        deletes: changeSet.deletes.length,
        unchanged: changeSet.unchanged,
        duration,
      });

      return {
        dataSourceId,
        syncTimestamp,
        changeSet,
        watermark,
        duration,
        errors,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(errorMessage);
      
      logger.error(`Incremental sync failed for ${dataSourceId}`, 'cdc', {
        dataSourceId,
        error: errorMessage,
      });

      throw error;
    }
  }

  /**
   * Timestamp-based change detection
   */
  private async detectChangesTimestamp(
    newData: any[],
    existingData: any[],
    config: CDCConfig,
    watermark: CDCWatermark
  ): Promise<ChangeSet> {
    if (!config.timestampColumn) {
      throw new Error('Timestamp column is required for timestamp-based CDC');
    }

    const timestampCol = config.timestampColumn;
    const primaryKey = Array.isArray(config.primaryKey) ? config.primaryKey : [config.primaryKey || 'id'];

    // Build index of existing records
    const existingIndex = new Map<string, any>();
    for (const record of existingData) {
      const key = this.buildCompositeKey(record, primaryKey);
      existingIndex.set(key, record);
    }

    const inserts: any[] = [];
    const updates: any[] = [];
    let unchanged = 0;

    // Check each new record
    for (const newRecord of newData) {
      const key = this.buildCompositeKey(newRecord, primaryKey);
      const timestamp = new Date(newRecord[timestampCol]);

      // Only process records modified after watermark
      if (timestamp <= watermark.lastSyncTimestamp) {
        unchanged++;
        continue;
      }

      const existingRecord = existingIndex.get(key);

      if (!existingRecord) {
        // New record
        inserts.push(newRecord);
      } else {
        // Check if actually changed
        const existingTimestamp = new Date(existingRecord[timestampCol]);
        if (timestamp > existingTimestamp) {
          updates.push({
            before: existingRecord,
            after: newRecord,
          });
        } else {
          unchanged++;
        }
      }

      // Remove from index to track deletes
      existingIndex.delete(key);
    }

    // Remaining records in index are potential deletes
    const deletes = config.enableDeletes ? Array.from(existingIndex.values()) : [];

    return {
      inserts,
      updates,
      deletes,
      unchanged,
      totalRecords: newData.length,
      timestamp: new Date(),
    };
  }

  /**
   * Hash-based change detection
   */
  private async detectChangesHash(
    newData: any[],
    existingData: any[],
    config: CDCConfig
  ): Promise<ChangeSet> {
    const primaryKey = Array.isArray(config.primaryKey) ? config.primaryKey : [config.primaryKey || 'id'];
    const compareColumns = config.compareColumns || null;

    // Build index with hashes
    const existingIndex = new Map<string, { record: any; hash: string }>();
    for (const record of existingData) {
      const key = this.buildCompositeKey(record, primaryKey);
      const hash = this.calculateRecordHash(record, compareColumns);
      existingIndex.set(key, { record, hash });
    }

    const inserts: any[] = [];
    const updates: any[] = [];
    let unchanged = 0;

    // Check each new record
    for (const newRecord of newData) {
      const key = this.buildCompositeKey(newRecord, primaryKey);
      const newHash = this.calculateRecordHash(newRecord, compareColumns);

      const existing = existingIndex.get(key);

      if (!existing) {
        // New record
        inserts.push(newRecord);
      } else if (existing.hash !== newHash) {
        // Record changed
        updates.push({
          before: existing.record,
          after: newRecord,
        });
      } else {
        // Unchanged
        unchanged++;
      }

      existingIndex.delete(key);
    }

    // Remaining records are deletes
    const deletes = config.enableDeletes 
      ? Array.from(existingIndex.values()).map(v => v.record)
      : [];

    return {
      inserts,
      updates,
      deletes,
      unchanged,
      totalRecords: newData.length,
      timestamp: new Date(),
    };
  }

  /**
   * Version-based change detection
   */
  private async detectChangesVersion(
    newData: any[],
    existingData: any[],
    config: CDCConfig
  ): Promise<ChangeSet> {
    const primaryKey = Array.isArray(config.primaryKey) ? config.primaryKey : [config.primaryKey || 'id'];
    const versionColumn = '_version';

    const existingIndex = new Map<string, any>();
    for (const record of existingData) {
      const key = this.buildCompositeKey(record, primaryKey);
      existingIndex.set(key, record);
    }

    const inserts: any[] = [];
    const updates: any[] = [];
    let unchanged = 0;

    for (const newRecord of newData) {
      const key = this.buildCompositeKey(newRecord, primaryKey);
      const newVersion = newRecord[versionColumn] || 0;

      const existingRecord = existingIndex.get(key);

      if (!existingRecord) {
        inserts.push(newRecord);
      } else {
        const existingVersion = existingRecord[versionColumn] || 0;
        if (newVersion > existingVersion) {
          updates.push({
            before: existingRecord,
            after: newRecord,
          });
        } else {
          unchanged++;
        }
      }

      existingIndex.delete(key);
    }

    const deletes = config.enableDeletes ? Array.from(existingIndex.values()) : [];

    return {
      inserts,
      updates,
      deletes,
      unchanged,
      totalRecords: newData.length,
      timestamp: new Date(),
    };
  }

  /**
   * Log-based change detection (for databases with change logs)
   */
  private async detectChangesLog(
    newData: any[],
    existingData: any[],
    config: CDCConfig
  ): Promise<ChangeSet> {
    // For databases that provide change logs (MySQL binlog, PostgreSQL WAL, etc.)
    // This would integrate with database-specific CDC mechanisms
    
    // For now, fall back to hash-based detection
    return this.detectChangesHash(newData, existingData, config);
  }

  /**
   * Merge changes into target dataset
   */
  async mergeChanges(
    existingData: any[],
    changeSet: ChangeSet,
    config: CDCConfig,
    strategy: MergeStrategy
  ): Promise<any[]> {
    const primaryKey = Array.isArray(config.primaryKey) ? config.primaryKey : [config.primaryKey || 'id'];

    // Build index of existing data
    const dataIndex = new Map<string, any>();
    for (const record of existingData) {
      const key = this.buildCompositeKey(record, primaryKey);
      dataIndex.set(key, record);
    }

    // Apply inserts
    for (const insert of changeSet.inserts) {
      const key = this.buildCompositeKey(insert, primaryKey);
      
      if (dataIndex.has(key)) {
        logger.warn('Insert conflict detected', 'cdc', { key, strategy: strategy.onConflict });
        
        if (strategy.onConflict === 'source-wins') {
          dataIndex.set(key, insert);
        }
        // For target-wins, keep existing (do nothing)
      } else {
        dataIndex.set(key, insert);
      }
    }

    // Apply updates
    for (const update of changeSet.updates) {
      const key = this.buildCompositeKey(update.after, primaryKey);
      
      const existing = dataIndex.get(key);
      if (!existing) {
        // Record doesn't exist, treat as insert
        dataIndex.set(key, update.after);
      } else {
        // Apply update based on strategy
        switch (strategy.onConflict) {
          case 'source-wins':
            dataIndex.set(key, update.after);
            break;
          
          case 'target-wins':
            // Keep existing
            break;
          
          case 'newest-wins':
            // Compare timestamps if available
            const existingTime = existing._updated_at || existing.updated_at || new Date(0);
            const newTime = update.after._updated_at || update.after.updated_at || new Date();
            if (newTime >= existingTime) {
              dataIndex.set(key, update.after);
            }
            break;
          
          case 'manual':
            // Would require user intervention
            logger.warn('Manual conflict resolution required', 'cdc', { key });
            break;
        }
      }
    }

    // Apply deletes
    if (strategy.softDelete) {
      // Soft delete: mark records as deleted
      for (const deleted of changeSet.deletes) {
        const key = this.buildCompositeKey(deleted, primaryKey);
        const existing = dataIndex.get(key);
        if (existing) {
          dataIndex.set(key, {
            ...existing,
            _deleted: true,
            _deleted_at: new Date(),
          });
        }
      }
    } else {
      // Hard delete: remove records
      for (const deleted of changeSet.deletes) {
        const key = this.buildCompositeKey(deleted, primaryKey);
        dataIndex.delete(key);
      }
    }

    return Array.from(dataIndex.values());
  }

  /**
   * Calculate hash of a record for change detection
   */
  private calculateRecordHash(record: any, columns?: string[] | null): string {
    let dataToHash: any;

    if (columns) {
      // Hash only specified columns
      dataToHash = {};
      for (const col of columns) {
        if (col in record) {
          dataToHash[col] = record[col];
        }
      }
    } else {
      // Hash entire record (excluding metadata fields)
      dataToHash = { ...record };
      delete dataToHash._id;
      delete dataToHash._updated_at;
      delete dataToHash._created_at;
      delete dataToHash._version;
    }

    const jsonString = JSON.stringify(dataToHash, Object.keys(dataToHash).sort());
    return crypto.createHash('md5').update(jsonString).digest('hex');
  }

  /**
   * Build composite key from multiple columns
   */
  private buildCompositeKey(record: any, keyColumns: string[]): string {
    return keyColumns
      .map(col => String(record[col] || ''))
      .join('|');
  }

  /**
   * Get watermark for a data source
   */
  getWatermark(dataSourceId: string): CDCWatermark | null {
    return this.watermarks.get(dataSourceId) || null;
  }

  /**
   * Set watermark for a data source
   */
  setWatermark(watermark: CDCWatermark): void {
    this.watermarks.set(watermark.dataSourceId, watermark);
  }

  /**
   * Reset watermark for a data source (forces full reload)
   */
  resetWatermark(dataSourceId: string): void {
    this.watermarks.delete(dataSourceId);
    logger.info(`Watermark reset for ${dataSourceId}`, 'cdc');
  }

  /**
   * Get all watermarks
   */
  getAllWatermarks(): CDCWatermark[] {
    return Array.from(this.watermarks.values());
  }

  /**
   * Calculate statistics for a change set
   */
  calculateChangeStats(changeSet: ChangeSet): {
    insertRate: number;
    updateRate: number;
    deleteRate: number;
    unchangedRate: number;
    totalChanges: number;
  } {
    const total = changeSet.totalRecords;
    const totalChanges = changeSet.inserts.length + changeSet.updates.length + changeSet.deletes.length;

    return {
      insertRate: total > 0 ? (changeSet.inserts.length / total) * 100 : 0,
      updateRate: total > 0 ? (changeSet.updates.length / total) * 100 : 0,
      deleteRate: total > 0 ? (changeSet.deletes.length / total) * 100 : 0,
      unchangedRate: total > 0 ? (changeSet.unchanged / total) * 100 : 0,
      totalChanges,
    };
  }
}

// Export singleton instance
export const cdcManager = CDCManager.getInstance();

