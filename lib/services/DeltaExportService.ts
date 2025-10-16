/**
 * Delta Export Service
 * 
 * Manages incremental/delta exports to reduce database load
 * Supports multiple change detection methods:
 * - Timestamp-based: Track changes using a timestamp column
 * - Version-based: Track changes using a version/revision column
 * - Change Data Capture (CDC): Use database-specific CDC features
 * - Hash-based: Detect changes by comparing record hashes
 */

import { EventEmitter } from 'events';

export interface DeltaConfig {
  id: string;
  dataSourceId: string;
  tableName: string;
  method: 'timestamp' | 'version' | 'hash' | 'cdc';
  
  // Method-specific configuration
  trackingColumn?: string; // For timestamp/version methods
  primaryKeyColumns: string[]; // Columns that uniquely identify a row
  hashColumns?: string[]; // Columns to include in hash (if empty, use all)
  
  // State tracking
  lastSyncValue?: any; // Last timestamp/version synced
  lastSyncDate?: Date;
  lastHashMap?: Map<string, string>; // Map of primary key -> hash
  
  // Batch configuration
  batchSize?: number;
  maxBatches?: number;
  pauseBetweenBatches?: number; // Milliseconds
  
  // Performance options
  enableCompression?: boolean;
  parallelBatches?: number;
}

export interface DeltaExportResult {
  success: boolean;
  method: string;
  recordsExported: number;
  recordsChanged: number;
  recordsAdded: number;
  recordsDeleted: number;
  batchesProcessed: number;
  duration: number;
  newSyncValue?: any;
  newSyncDate: Date;
  bytesTransferred: number;
  error?: string;
}

export interface DeltaBatch {
  batchNumber: number;
  records: any[];
  operations: ('insert' | 'update' | 'delete')[];
  fromValue?: any;
  toValue?: any;
}

export interface ExportMetadata {
  exportId: string;
  dataSourceId: string;
  tableName: string;
  method: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  recordsProcessed: number;
  currentBatch: number;
  totalBatches: number;
}

class DeltaExportService extends EventEmitter {
  private static instance: DeltaExportService;
  private configs: Map<string, DeltaConfig>;
  private activeExports: Map<string, ExportMetadata>;
  private exportHistory: ExportMetadata[];

  private constructor() {
    super();
    this.configs = new Map();
    this.activeExports = new Map();
    this.exportHistory = [];
  }

  static getInstance(): DeltaExportService {
    if (!DeltaExportService.instance) {
      DeltaExportService.instance = new DeltaExportService();
    }
    return DeltaExportService.instance;
  }

  /**
   * Register a delta configuration for a data source
   */
  registerDeltaConfig(config: DeltaConfig): void {
    this.configs.set(config.id, config);
    this.emit('config:registered', config);
  }

  /**
   * Get delta configuration
   */
  getDeltaConfig(configId: string): DeltaConfig | undefined {
    return this.configs.get(configId);
  }

  /**
   * Update delta configuration
   */
  updateDeltaConfig(configId: string, updates: Partial<DeltaConfig>): void {
    const config = this.configs.get(configId);
    if (config) {
      Object.assign(config, updates);
      this.emit('config:updated', config);
    }
  }

  /**
   * Execute a delta export
   */
  async executeDeltaExport(
    configId: string,
    dataProvider: any // Database provider instance
  ): Promise<DeltaExportResult> {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Delta config not found: ${configId}`);
    }

    const exportId = `export_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const startTime = Date.now();

    // Initialize export metadata
    const metadata: ExportMetadata = {
      exportId,
      dataSourceId: config.dataSourceId,
      tableName: config.tableName,
      method: config.method,
      startTime: new Date(),
      status: 'running',
      progress: 0,
      recordsProcessed: 0,
      currentBatch: 0,
      totalBatches: 0
    };

    this.activeExports.set(exportId, metadata);
    this.emit('export:started', metadata);

    try {
      let result: DeltaExportResult;

      switch (config.method) {
        case 'timestamp':
        case 'version':
          result = await this.executeTimestampDelta(config, dataProvider, metadata);
          break;
        case 'hash':
          result = await this.executeHashDelta(config, dataProvider, metadata);
          break;
        case 'cdc':
          result = await this.executeCDCDelta(config, dataProvider, metadata);
          break;
        default:
          throw new Error(`Unsupported delta method: ${config.method}`);
      }

      // Update metadata
      metadata.status = 'completed';
      metadata.endTime = new Date();
      metadata.progress = 100;

      // Update config with new sync value
      if (result.newSyncValue !== undefined) {
        config.lastSyncValue = result.newSyncValue;
        config.lastSyncDate = result.newSyncDate;
      }

      this.activeExports.delete(exportId);
      this.exportHistory.push(metadata);

      this.emit('export:completed', { metadata, result });

      return result;
    } catch (error) {
      metadata.status = 'failed';
      metadata.endTime = new Date();

      this.activeExports.delete(exportId);
      this.exportHistory.push(metadata);

      this.emit('export:failed', { metadata, error });

      return {
        success: false,
        method: config.method,
        recordsExported: metadata.recordsProcessed,
        recordsChanged: 0,
        recordsAdded: 0,
        recordsDeleted: 0,
        batchesProcessed: metadata.currentBatch,
        duration: Date.now() - startTime,
        newSyncDate: new Date(),
        bytesTransferred: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Execute timestamp/version-based delta export
   */
  private async executeTimestampDelta(
    config: DeltaConfig,
    dataProvider: any,
    metadata: ExportMetadata
  ): Promise<DeltaExportResult> {
    const startTime = Date.now();
    const batchSize = config.batchSize || 1000;
    let totalRecords = 0;
    let totalBatches = 0;
    let bytesTransferred = 0;
    let newSyncValue = config.lastSyncValue;

    // Build query to get changed records
    const trackingColumn = config.trackingColumn;
    if (!trackingColumn) {
      throw new Error('Tracking column required for timestamp/version delta');
    }

    // Get count of changed records
    const countQuery = this.buildCountQuery(config);
    const countResult = await dataProvider.executeQuery(countQuery);
    const totalChanged = countResult[0]?.count || countResult[0]?.COUNT || 0;

    metadata.totalBatches = Math.ceil(totalChanged / batchSize);

    // Process in batches
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const batchQuery = this.buildDeltaQuery(config, batchSize, offset);
      const batchRecords = await dataProvider.executeQuery(batchQuery);

      if (batchRecords.length === 0) {
        hasMore = false;
        break;
      }

      totalBatches++;
      metadata.currentBatch = totalBatches;

      // Process batch
      const batch: DeltaBatch = {
        batchNumber: totalBatches,
        records: batchRecords,
        operations: batchRecords.map(() => 'insert'), // Assume all are inserts/updates
        fromValue: offset === 0 ? config.lastSyncValue : undefined
      };

      // Emit batch for processing
      this.emit('batch:ready', { config, batch, metadata });

      // Track the highest tracking value in this batch
      const batchMaxValue = this.getMaxTrackingValue(batchRecords, trackingColumn);
      if (batchMaxValue !== undefined && batchMaxValue > (newSyncValue || 0)) {
        newSyncValue = batchMaxValue;
      }

      totalRecords += batchRecords.length;
      bytesTransferred += this.estimateBatchSize(batchRecords);

      metadata.recordsProcessed = totalRecords;
      metadata.progress = Math.min((totalRecords / (totalChanged || 1)) * 100, 99);

      this.emit('export:progress', metadata);

      // Pause between batches if configured
      if (config.pauseBetweenBatches && config.pauseBetweenBatches > 0) {
        await this.sleep(config.pauseBetweenBatches);
      }

      offset += batchSize;

      // Check max batches limit
      if (config.maxBatches && totalBatches >= config.maxBatches) {
        hasMore = false;
      }

      if (batchRecords.length < batchSize) {
        hasMore = false;
      }
    }

    return {
      success: true,
      method: config.method,
      recordsExported: totalRecords,
      recordsChanged: totalRecords,
      recordsAdded: totalRecords, // Can't distinguish without more info
      recordsDeleted: 0,
      batchesProcessed: totalBatches,
      duration: Date.now() - startTime,
      newSyncValue,
      newSyncDate: new Date(),
      bytesTransferred
    };
  }

  /**
   * Execute hash-based delta export
   */
  private async executeHashDelta(
    config: DeltaConfig,
    dataProvider: any,
    metadata: ExportMetadata
  ): Promise<DeltaExportResult> {
    const startTime = Date.now();
    const batchSize = config.batchSize || 1000;
    let recordsAdded = 0;
    let recordsChanged = 0;
    let recordsDeleted = 0;
    let totalBatches = 0;
    let bytesTransferred = 0;

    // Get current hash map
    const oldHashMap = config.lastHashMap || new Map<string, string>();
    const newHashMap = new Map<string, string>();

    // Query all records
    const query = `SELECT * FROM ${config.tableName}`;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const batchQuery = `${query} LIMIT ${batchSize} OFFSET ${offset}`;
      const batchRecords = await dataProvider.executeQuery(batchQuery);

      if (batchRecords.length === 0) {
        hasMore = false;
        break;
      }

      totalBatches++;
      metadata.currentBatch = totalBatches;

      const changedRecords: any[] = [];
      const operations: ('insert' | 'update' | 'delete')[] = [];

      // Compare hashes
      for (const record of batchRecords) {
        const pk = this.getPrimaryKey(record, config.primaryKeyColumns);
        const hash = this.calculateHash(record, config.hashColumns);

        newHashMap.set(pk, hash);

        const oldHash = oldHashMap.get(pk);

        if (!oldHash) {
          // New record
          changedRecords.push(record);
          operations.push('insert');
          recordsAdded++;
        } else if (oldHash !== hash) {
          // Changed record
          changedRecords.push(record);
          operations.push('update');
          recordsChanged++;
        }
        // else: unchanged, skip
      }

      // Emit batch if there are changes
      if (changedRecords.length > 0) {
        const batch: DeltaBatch = {
          batchNumber: totalBatches,
          records: changedRecords,
          operations
        };

        this.emit('batch:ready', { config, batch, metadata });
        bytesTransferred += this.estimateBatchSize(changedRecords);
      }

      metadata.recordsProcessed += batchRecords.length;
      this.emit('export:progress', metadata);

      if (config.pauseBetweenBatches && config.pauseBetweenBatches > 0) {
        await this.sleep(config.pauseBetweenBatches);
      }

      offset += batchSize;

      if (config.maxBatches && totalBatches >= config.maxBatches) {
        hasMore = false;
      }
    }

    // Find deleted records (in old map but not in new map)
    for (const [pk] of oldHashMap) {
      if (!newHashMap.has(pk)) {
        recordsDeleted++;
      }
    }

    // Update config with new hash map
    config.lastHashMap = newHashMap;

    return {
      success: true,
      method: 'hash',
      recordsExported: recordsAdded + recordsChanged,
      recordsChanged,
      recordsAdded,
      recordsDeleted,
      batchesProcessed: totalBatches,
      duration: Date.now() - startTime,
      newSyncDate: new Date(),
      bytesTransferred
    };
  }

  /**
   * Execute CDC-based delta export (database-specific)
   */
  private async executeCDCDelta(
    config: DeltaConfig,
    dataProvider: any,
    metadata: ExportMetadata
  ): Promise<DeltaExportResult> {
    // CDC is database-specific, delegate to the provider
    if (typeof dataProvider.executeCDCQuery === 'function') {
      return await dataProvider.executeCDCQuery(config, metadata);
    }

    throw new Error('CDC not supported by this data provider');
  }

  /**
   * Build count query for changed records
   */
  private buildCountQuery(config: DeltaConfig): string {
    const whereClause = config.lastSyncValue
      ? `WHERE ${config.trackingColumn} > ${this.formatValue(config.lastSyncValue, config.method)}`
      : '';

    return `SELECT COUNT(*) as count FROM ${config.tableName} ${whereClause}`;
  }

  /**
   * Build delta query to fetch changed records
   */
  private buildDeltaQuery(config: DeltaConfig, limit: number, offset: number): string {
    const whereClause = config.lastSyncValue
      ? `WHERE ${config.trackingColumn} > ${this.formatValue(config.lastSyncValue, config.method)}`
      : '';

    return `
      SELECT * FROM ${config.tableName} 
      ${whereClause}
      ORDER BY ${config.trackingColumn}
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  /**
   * Get maximum tracking value from batch
   */
  private getMaxTrackingValue(records: any[], trackingColumn: string): any {
    if (records.length === 0) return undefined;

    let maxValue = records[0][trackingColumn];

    for (const record of records) {
      const value = record[trackingColumn];
      if (value > maxValue) {
        maxValue = value;
      }
    }

    return maxValue;
  }

  /**
   * Format value for SQL query
   */
  private formatValue(value: any, method: string): string {
    if (method === 'timestamp') {
      if (value instanceof Date) {
        return `'${value.toISOString()}'`;
      }
      return `'${value}'`;
    } else if (method === 'version') {
      return String(value);
    }

    return `'${value}'`;
  }

  /**
   * Get primary key value from record
   */
  private getPrimaryKey(record: any, pkColumns: string[]): string {
    return pkColumns.map(col => String(record[col])).join('|');
  }

  /**
   * Calculate hash of a record
   */
  private calculateHash(record: any, columns?: string[]): string {
    const columnsToHash = columns || Object.keys(record);
    const values = columnsToHash.map(col => String(record[col] ?? '')).join('|');
    
    // Simple hash function (in production, use a proper hash like SHA-256)
    return this.simpleHash(values);
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Estimate batch size in bytes
   */
  private estimateBatchSize(records: any[]): number {
    return records.reduce((total, record) => {
      return total + JSON.stringify(record).length;
    }, 0);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get active exports
   */
  getActiveExports(): ExportMetadata[] {
    return Array.from(this.activeExports.values());
  }

  /**
   * Get export history
   */
  getExportHistory(limit?: number): ExportMetadata[] {
    const history = this.exportHistory.sort((a, b) => 
      b.startTime.getTime() - a.startTime.getTime()
    );

    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Clear export history
   */
  clearHistory(): void {
    this.exportHistory = [];
  }

  /**
   * Get statistics for a data source
   */
  getDataSourceStats(dataSourceId: string): {
    totalExports: number;
    successfulExports: number;
    failedExports: number;
    totalRecordsExported: number;
    lastExportDate?: Date;
  } {
    const exports = this.exportHistory.filter(e => e.dataSourceId === dataSourceId);

    return {
      totalExports: exports.length,
      successfulExports: exports.filter(e => e.status === 'completed').length,
      failedExports: exports.filter(e => e.status === 'failed').length,
      totalRecordsExported: exports.reduce((sum, e) => sum + e.recordsProcessed, 0),
      lastExportDate: exports.length > 0 ? exports[0].endTime : undefined
    };
  }
}

export const deltaExportService = DeltaExportService.getInstance();
export default deltaExportService;


