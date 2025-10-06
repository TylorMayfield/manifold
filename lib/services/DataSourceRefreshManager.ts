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
    createSnapshot: boolean = true
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
      const freshData = await this.fetchFreshData(dataSource);

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
  private async fetchFreshData(dataSource: any): Promise<any[]> {
    const type = dataSource.type;

    switch (type) {
      case 'api':
      case 'api_script':
        return await this.fetchFromApi(dataSource);

      case 'database':
      case 'mysql':
      case 'postgres':
        return await this.fetchFromDatabase(dataSource);

      case 'mock':
        return await this.generateMockData(dataSource);

      default:
        logger.warn(
          'Unsupported data source type for refresh',
          'data-refresh',
          { type },
          'DataSourceRefreshManager'
        );
        return [];
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
   * Fetch data from database
   */
  private async fetchFromDatabase(dataSource: any): Promise<any[]> {
    // This would use the appropriate database provider
    // For now, return empty array (implement based on your DB providers)
    logger.warn(
      'Database refresh not yet implemented',
      'data-refresh',
      { dataSourceId: dataSource.id },
      'DataSourceRefreshManager'
    );
    return [];
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

