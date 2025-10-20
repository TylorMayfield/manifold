import { logger } from '../utils/logger';

export interface RefreshSchedule {
  enabled: boolean;
  interval: number; // in minutes
  lastRefresh?: Date;
  nextRefresh?: Date;
  autoSnapshot: boolean;
  notifyOnComplete: boolean;
}

export interface DataSourceVersion {
  version: number;
  snapshotId: string;
  createdAt: Date;
  recordCount: number;
  changes?: {
    added: number;
    modified: number;
    deleted: number;
  };
}

export interface RefreshResult {
  success: boolean;
  dataSourceId: string;
  newVersion: number;
  snapshotId: string;
  recordCount: number;
  duration: number;
  changes?: {
    added: number;
    modified: number;
    deleted: number;
  };
  error?: string;
}

export class DataSourceRefreshManager {
  private static instance: DataSourceRefreshManager;
  private refreshTimers: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  static getInstance(): DataSourceRefreshManager {
    if (!DataSourceRefreshManager.instance) {
      DataSourceRefreshManager.instance = new DataSourceRefreshManager();
    }
    return DataSourceRefreshManager.instance;
  }

  /**
   * Schedule automatic refresh for a data source
   */
  async scheduleRefresh(
    dataSourceId: string,
    schedule: RefreshSchedule
  ): Promise<void> {
    if (!schedule.enabled) {
      this.cancelRefresh(dataSourceId);
      return;
    }

    // Cancel existing timer
    this.cancelRefresh(dataSourceId);

    const intervalMs = schedule.interval * 60 * 1000;
    const timer = setInterval(async () => {
      try {
        logger.info(
          'Scheduled refresh triggered',
          'data-refresh',
          { dataSourceId, interval: schedule.interval },
          'DataSourceRefreshManager'
        );

        await this.refreshDataSource(dataSourceId, schedule.autoSnapshot);
      } catch (error) {
        logger.error(
          'Scheduled refresh failed',
          'data-refresh',
          { error, dataSourceId },
          'DataSourceRefreshManager'
        );
      }
    }, intervalMs);

    this.refreshTimers.set(dataSourceId, timer);

    logger.success(
      'Refresh schedule created',
      'data-refresh',
      { dataSourceId, intervalMinutes: schedule.interval },
      'DataSourceRefreshManager'
    );
  }

  /**
   * Cancel scheduled refresh for a data source
   */
  cancelRefresh(dataSourceId: string): void {
    const timer = this.refreshTimers.get(dataSourceId);
    if (timer) {
      clearInterval(timer);
      this.refreshTimers.delete(dataSourceId);
      logger.info(
        'Refresh schedule cancelled',
        'data-refresh',
        { dataSourceId },
        'DataSourceRefreshManager'
      );
    }
  }

  /**
   * Manually refresh a data source
   */
  async refreshDataSource(
    dataSourceId: string,
    createSnapshot: boolean = true,
    options?: { hasHeaders?: boolean }
  ): Promise<RefreshResult> {
    const startTime = Date.now();

    try {
      logger.info(
        'Starting data source refresh',
        'data-refresh',
        { dataSourceId, createSnapshot },
        'DataSourceRefreshManager'
      );

      // Import MongoDB database
      const { MongoDatabase } = await import('../server/database/MongoDatabase');
      const db = MongoDatabase.getInstance();
      await db.initialize();

      // Get the data source
      const dataSource: any = await db.getDataSource(dataSourceId);
      if (!dataSource) {
        throw new Error(`Data source ${dataSourceId} not found`);
      }

      // Fetch fresh data based on data source type
      const freshData = await this.fetchFreshData(dataSource, options);

      // Get previous snapshot for comparison
      const previousSnapshots = await db.getSnapshots(dataSourceId);
      const previousSnapshot: any = previousSnapshots[0];

      // Calculate changes
      const changes = previousSnapshot
        ? this.calculateChanges(previousSnapshot.data || [], freshData)
        : { added: freshData.length, modified: 0, deleted: 0 };

      // Create new snapshot if requested
      let snapshotId = '';
      let newVersion = 1;

      if (createSnapshot) {
        const { v4: uuidv4 } = await import('uuid');
        snapshotId = uuidv4();
        newVersion = previousSnapshot ? previousSnapshot.version + 1 : 1;

        await db.createSnapshot({
          id: snapshotId,
          projectId: dataSource.projectId || 'default',
          dataSourceId,
          version: newVersion,
          data: freshData,
          schema: this.inferSchema(freshData),
          metadata: {
            refreshedAt: new Date().toISOString(),
            refreshType: 'manual',
            previousVersion: previousSnapshot?.version,
            changes,
          },
          recordCount: freshData.length,
          createdAt: new Date(),
        });
      }

      // Update data source last refresh time
      await db.updateDataSource(dataSourceId, {
        lastRefreshAt: new Date(),
      });

      const duration = Date.now() - startTime;

      logger.success(
        'Data source refreshed successfully',
        'data-refresh',
        {
          dataSourceId,
          duration,
          recordCount: freshData.length,
          changes,
          newVersion,
        },
        'DataSourceRefreshManager'
      );

      return {
        success: true,
        dataSourceId,
        newVersion,
        snapshotId,
        recordCount: freshData.length,
        duration,
        changes,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(
        'Data source refresh failed',
        'data-refresh',
        { error, dataSourceId, duration },
        'DataSourceRefreshManager'
      );

      return {
        success: false,
        dataSourceId,
        newVersion: 0,
        snapshotId: '',
        recordCount: 0,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fetch fresh data based on data source type
   */
  private async fetchFreshData(dataSource: any, options?: { hasHeaders?: boolean }): Promise<any[]> {
    const type = dataSource.type;

    switch (type) {
      case 'api':
      case 'api_script':
        return await this.fetchFromApi(dataSource);

      case 'database':
      case 'mysql':
      case 'postgres':
      case 'mssql':
      case 'sqlite':
      case 'odbc':
        return await this.fetchFromDatabase(dataSource);

      case 'csv':
      case 'json':
      case 'excel':
        return await this.fetchFromFile(dataSource, options);

      case 'mock':
        return await this.generateMockData(dataSource);

      default:
        logger.warn(
          'Unsupported data source type for refresh',
          'data-refresh',
          { type },
          'DataSourceRefreshManager'
        );
        // For unsupported types, get the latest snapshot data instead of returning empty
        return await this.getLatestSnapshotData(dataSource.id);
    }
  }

  /**
   * Fetch data from API
   */
  private async fetchFromApi(dataSource: any): Promise<any[]> {
    const url = dataSource.config?.url || dataSource.config?.apiConfig?.url;
    if (!url) {
      throw new Error('API URL not configured');
    }

    const response = await fetch(url, {
      method: dataSource.config?.method || 'GET',
      headers: dataSource.config?.headers || {},
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  }

  /**
   * Fetch data from file (CSV, JSON, Excel)
   */
  private async fetchFromFile(dataSource: any, options?: { hasHeaders?: boolean }): Promise<any[]> {
    const hasHeaders = options?.hasHeaders ?? true; // Default to true if not specified
    try {
      const filePath = dataSource.config?.filePath;
      const fileUrl = dataSource.config?.importUrl;

      // For file-based sources, we return the existing snapshot data
      // since we can't automatically re-read local files or uploaded files
      // The user would need to manually re-upload or provide a URL
      if (!filePath && !fileUrl) {
        logger.info(
          'File-based data source without path/URL, returning latest snapshot data',
          'data-refresh',
          { dataSourceId: dataSource.id, type: dataSource.type },
          'DataSourceRefreshManager'
        );
        return await this.getLatestSnapshotData(dataSource.id);
      }

      // If there's a URL, we can fetch it
      if (fileUrl) {
        logger.info(
          'Fetching file from URL',
          'data-refresh',
          { dataSourceId: dataSource.id, url: fileUrl },
          'DataSourceRefreshManager'
        );
        
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || '';
        const text = await response.text();

        // Parse based on file type
        if (dataSource.type === 'csv' || contentType.includes('csv')) {
          const Papa = await import('papaparse');
          const result = Papa.parse(text, { header: hasHeaders, skipEmptyLines: true, dynamicTyping: true });
          let data = result.data as any[];
          
          // If no headers, convert array rows to objects
          if (!hasHeaders && data.length > 0 && Array.isArray(data[0])) {
            data = data.map((row: any[]) => {
              const obj: any = {};
              row.forEach((val, idx) => {
                obj[`Column${idx + 1}`] = val;
              });
              return obj;
            });
          }
          
          return data;
        } else if (dataSource.type === 'json' || contentType.includes('json')) {
          const parsed = JSON.parse(text);
          return Array.isArray(parsed) ? parsed : [parsed];
        } else if (dataSource.type === 'excel') {
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(text, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          if (hasHeaders) {
            return XLSX.utils.sheet_to_json(worksheet, { defval: null });
          } else {
            // No headers - read as arrays and convert to objects
            const arrayData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
            return arrayData.map((row: any[]) => {
              const obj: any = {};
              row.forEach((val, idx) => {
                obj[`Column${idx + 1}`] = val;
              });
              return obj;
            });
          }
        }
      }

      // For local file paths, return existing snapshot data
      // (we can't read local files in a server environment without proper file access)
      logger.info(
        'Local file path detected, returning latest snapshot data',
        'data-refresh',
        { dataSourceId: dataSource.id, filePath },
        'DataSourceRefreshManager'
      );
      return await this.getLatestSnapshotData(dataSource.id);

    } catch (error) {
      logger.error(
        'Failed to fetch from file',
        'data-refresh',
        { error, dataSourceId: dataSource.id },
        'DataSourceRefreshManager'
      );
      // Fallback to latest snapshot data
      return await this.getLatestSnapshotData(dataSource.id);
    }
  }

  /**
   * Get latest snapshot data as fallback
   */
  private async getLatestSnapshotData(dataSourceId: string): Promise<any[]> {
    try {
      const { MongoDatabase } = await import('../server/database/MongoDatabase');
      const db = MongoDatabase.getInstance();
      await db.initialize();

      const snapshots = await db.getSnapshots(dataSourceId);
      if (snapshots.length === 0) {
        return [];
      }

      const latestSnapshot = snapshots[0];
      const importedData = await db.getImportedData({
        dataSourceId,
        snapshotId: latestSnapshot.id,
        limit: 100000
      });

      return importedData.data || [];
    } catch (error) {
      logger.error(
        'Failed to get latest snapshot data',
        'data-refresh',
        { error, dataSourceId },
        'DataSourceRefreshManager'
      );
      return [];
    }
  }

  /**
   * Fetch data from database
   */
  private async fetchFromDatabase(dataSource: any): Promise<any[]> {
    // This would use the appropriate database provider
    // For now, return latest snapshot data (implement based on your DB providers)
    logger.info(
      'Database refresh using latest snapshot (live query not yet implemented)',
      'data-refresh',
      { dataSourceId: dataSource.id, type: dataSource.type },
      'DataSourceRefreshManager'
    );
    return await this.getLatestSnapshotData(dataSource.id);
  }

  /**
   * Generate mock data
   */
  private async generateMockData(dataSource: any): Promise<any[]> {
    const { generateMockData } = await import('../utils/mockDataGenerator');
    const templateId = dataSource.config?.mockConfig?.templateId || 'customers';
    const recordCount = dataSource.config?.mockConfig?.recordCount || 1000;
    const mockSnapshot = generateMockData(templateId, recordCount);
    return mockSnapshot.data;
  }

  /**
   * Calculate changes between old and new data
   */
  private calculateChanges(oldData: any[], newData: any[]): {
    added: number;
    modified: number;
    deleted: number;
  } {
    // Simple implementation - compare by ID or hash
    const oldIds = new Set(oldData.map((item) => this.getItemId(item)));
    const newIds = new Set(newData.map((item) => this.getItemId(item)));

    const added = newData.filter((item) => !oldIds.has(this.getItemId(item))).length;
    const deleted = oldData.filter((item) => !newIds.has(this.getItemId(item))).length;
    const modified = newData.length - added;

    return { added, modified, deleted };
  }

  /**
   * Get unique identifier for an item
   */
  private getItemId(item: any): string {
    // Try common ID fields
    if (item.id) return String(item.id);
    if (item._id) return String(item._id);
    if (item.uuid) return String(item.uuid);
    
    // Fallback to JSON hash
    return JSON.stringify(item);
  }

  /**
   * Infer schema from data
   */
  private inferSchema(data: any[]): any {
    if (data.length === 0) return null;

    const sample = data[0];
    const columns = Object.keys(sample).map((key) => ({
      name: key,
      type: typeof sample[key],
    }));

    return { columns };
  }

  /**
   * Get all versions for a data source
   */
  async getVersionHistory(dataSourceId: string): Promise<DataSourceVersion[]> {
    try {
      const { MongoDatabase } = await import('../server/database/MongoDatabase');
      const db = MongoDatabase.getInstance();
      await db.initialize();

      const snapshots = await db.getSnapshots(dataSourceId);
      
      return snapshots.map((snapshot: any) => ({
        version: snapshot.version || 1,
        snapshotId: snapshot.id,
        createdAt: new Date(snapshot.createdAt),
        recordCount: snapshot.recordCount || 0,
        changes: snapshot.metadata?.changes,
      }));
    } catch (error) {
      logger.error(
        'Failed to get version history',
        'data-refresh',
        { error, dataSourceId },
        'DataSourceRefreshManager'
      );
      return [];
    }
  }

  /**
   * Get data freshness status
   */
  async getFreshnessStatus(dataSourceId: string): Promise<{
    isFresh: boolean;
    lastRefresh: Date | null;
    ageMinutes: number;
    status: 'fresh' | 'stale' | 'critical' | 'unknown';
  }> {
    try {
      const { MongoDatabase } = await import('../server/database/MongoDatabase');
      const db = MongoDatabase.getInstance();
      await db.initialize();

      const dataSource: any = await db.getDataSource(dataSourceId);
      const lastRefresh = dataSource?.lastRefreshAt;

      if (!lastRefresh) {
        return {
          isFresh: false,
          lastRefresh: null,
          ageMinutes: Infinity,
          status: 'unknown',
        };
      }

      const ageMs = Date.now() - new Date(lastRefresh).getTime();
      const ageMinutes = Math.floor(ageMs / (1000 * 60));

      let status: 'fresh' | 'stale' | 'critical' | 'unknown' = 'fresh';
      if (ageMinutes > 1440) status = 'critical'; // > 24 hours
      else if (ageMinutes > 60) status = 'stale'; // > 1 hour

      return {
        isFresh: status === 'fresh',
        lastRefresh: new Date(lastRefresh),
        ageMinutes,
        status,
      };
    } catch (error) {
      logger.error(
        'Failed to get freshness status',
        'data-refresh',
        { error, dataSourceId },
        'DataSourceRefreshManager'
      );
      return {
        isFresh: false,
        lastRefresh: null,
        ageMinutes: Infinity,
        status: 'unknown',
      };
    }
  }

  /**
   * Clean up all timers
   */
  destroy(): void {
    this.refreshTimers.forEach((timer) => clearInterval(timer));
    this.refreshTimers.clear();
  }
}

export const dataSourceRefreshManager = DataSourceRefreshManager.getInstance();

