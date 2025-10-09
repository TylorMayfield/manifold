/**
 * Data Lake Service
 * 
 * Manages data lakes - consolidated data stores that combine multiple data sources
 * Provides building, querying, and management functionality
 */

import { DataLake, DataLakeConfig, DataFilter } from '../../types/dataLake';
import { MongoDatabase } from '../server/database/MongoDatabase';
import { clientLogger } from '../utils/ClientLogger';

export interface DataLakeQueryOptions {
  filters?: DataFilter[];
  sort?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
  fields?: string[];
}

export interface DataLakeQueryResult {
  columns: string[];
  rows: any[][];
  totalCount: number;
  hasMore: boolean;
}

export interface DataLakeBuildResult {
  success: boolean;
  lakeId: string;
  recordsProcessed: number;
  recordsStored: number;
  recordsFiltered: number;
  recordsDuplicated: number;
  status: 'ready' | 'error';
  error?: string;
  buildTime: number;
  metadata: {
    sources: {
      dataSourceId: string;
      recordsLoaded: number;
      snapshotVersion?: number;
    }[];
    consolidatedAt: Date;
    schemaFields: string[];
  };
}

export class DataLakeService {
  private static instance: DataLakeService;
  private dataLakes: Map<string, DataLake> = new Map();
  private dataLakeStorage: Map<string, any[]> = new Map(); // In-memory storage for now

  private constructor() {
    // Initialize from database would go here
    this.initializeFromDatabase();
  }

  public static getInstance(): DataLakeService {
    if (!DataLakeService.instance) {
      DataLakeService.instance = new DataLakeService();
    }
    return DataLakeService.instance;
  }

  private async initializeFromDatabase(): Promise<void> {
    try {
      // In the future, load existing data lakes from persistent storage
      clientLogger.info('Data Lake Service initialized', 'data-lake');
    } catch (error) {
      clientLogger.error('Failed to initialize Data Lake Service', 'data-lake', { error });
    }
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Get all data lakes for a project
   */
  async getDataLakes(projectId: string): Promise<DataLake[]> {
    const lakes = Array.from(this.dataLakes.values()).filter(
      (lake) => lake.projectId === projectId
    );
    
    clientLogger.info(`Retrieved ${lakes.length} data lakes for project ${projectId}`, 'data-lake');
    return lakes;
  }

  /**
   * Get a specific data lake by ID
   */
  async getDataLake(lakeId: string): Promise<DataLake | null> {
    return this.dataLakes.get(lakeId) || null;
  }

  /**
   * Create a new data lake
   */
  async createDataLake(params: {
    projectId: string;
    name: string;
    description?: string;
    config: DataLakeConfig;
  }): Promise<DataLake> {
    const { projectId, name, description, config } = params;

    const dataLake: DataLake = {
      id: `lake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      name,
      description,
      status: 'draft',
      config,
      metadata: {
        totalRecords: 0,
        dataSources: config.dataSourceIds.map(id => ({
          dataSourceId: id,
          recordCount: 0,
          lastSyncedAt: new Date(),
        })),
        storageSize: 0,
        lastBuiltAt: undefined,
        schemaVersion: 1,
        indexedFields: config.settings.indexFields || [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.dataLakes.set(dataLake.id, dataLake);

    clientLogger.info(`Data lake created: ${name}`, 'data-lake', {
      lakeId: dataLake.id,
      sources: config.dataSourceIds.length,
    });

    return dataLake;
  }

  /**
   * Update a data lake
   */
  async updateDataLake(
    lakeId: string,
    updates: Partial<Omit<DataLake, 'id' | 'projectId' | 'createdAt'>>
  ): Promise<DataLake | null> {
    const lake = this.dataLakes.get(lakeId);
    if (!lake) {
      return null;
    }

    const updated: DataLake = {
      ...lake,
      ...updates,
      updatedAt: new Date(),
    };

    this.dataLakes.set(lakeId, updated);

    clientLogger.info(`Data lake updated: ${lakeId}`, 'data-lake');

    return updated;
  }

  /**
   * Delete a data lake
   */
  async deleteDataLake(lakeId: string): Promise<boolean> {
    const existed = this.dataLakes.has(lakeId);
    
    if (existed) {
      this.dataLakes.delete(lakeId);
      this.dataLakeStorage.delete(lakeId);
      
      clientLogger.info(`Data lake deleted: ${lakeId}`, 'data-lake');
    }

    return existed;
  }

  // ==================== BUILD OPERATIONS ====================

  /**
   * Build a data lake by consolidating data from all configured sources
   */
  async buildDataLake(
    lakeId: string,
    options: { force?: boolean } = {}
  ): Promise<DataLakeBuildResult> {
    const startTime = Date.now();
    const lake = this.dataLakes.get(lakeId);

    if (!lake) {
      throw new Error(`Data lake not found: ${lakeId}`);
    }

    try {
      // Update status to building
      await this.updateDataLake(lakeId, { status: 'building' });

      clientLogger.info(`Building data lake: ${lake.name}`, 'data-lake', {
        lakeId,
        sources: lake.config.dataSourceIds.length,
      });

      // Load data from MongoDB
      const db = MongoDatabase.getInstance();
      await db.initialize();

      const allData: any[] = [];
      const sourceMetadata: DataLakeBuildResult['metadata']['sources'] = [];

      // Load data from each data source
      for (const dataSourceId of lake.config.dataSourceIds) {
        try {
          clientLogger.info(`Loading data from source: ${dataSourceId}`, 'data-lake');

          // Get latest snapshot for this source
          const snapshots = await db.getSnapshots(dataSourceId);
          
          if (snapshots.length === 0) {
            clientLogger.warn(`No snapshots found for source: ${dataSourceId}`, 'data-lake');
            sourceMetadata.push({
              dataSourceId,
              recordsLoaded: 0,
            });
            continue;
          }

          const latestSnapshot: any = snapshots[0];

          // Load snapshot data
          const importedDataResult = await db.getImportedData({
            dataSourceId,
            snapshotId: latestSnapshot.id as string,
            limit: 100000,
          });

          const sourceData = importedDataResult.data.map(d => ({
            ...d.data,
            _dataSourceId: dataSourceId, // Tag with source
            _snapshotId: latestSnapshot.id,
            _snapshotVersion: latestSnapshot.version,
          }));

          allData.push(...sourceData);

          sourceMetadata.push({
            dataSourceId,
            recordsLoaded: sourceData.length,
            snapshotVersion: latestSnapshot.version,
          });

          clientLogger.success(
            `Loaded ${sourceData.length} records from ${dataSourceId}`,
            'data-lake'
          );
        } catch (error) {
          clientLogger.error(`Failed to load data from source: ${dataSourceId}`, 'data-lake', {
            error,
          });
          // Continue with other sources
        }
      }

      // Apply transformations based on config
      let processedData = allData;
      let filteredCount = 0;
      let duplicateCount = 0;

      // Apply deduplication
      if (lake.config.settings.deduplication) {
        const key = lake.config.settings.deduplicationKey || 'id';
        const beforeCount = processedData.length;
        processedData = this.deduplicateData(processedData, key);
        duplicateCount = beforeCount - processedData.length;
        
        clientLogger.info(
          `Deduplication: Removed ${duplicateCount} duplicates`,
          'data-lake'
        );
      }

      // Apply custom filters if configured
      if (lake.config.settings.customFilters) {
        const beforeCount = processedData.length;
        processedData = this.applyFilters(processedData, lake.config.settings.customFilters);
        filteredCount = beforeCount - processedData.length;
        
        clientLogger.info(`Filtering: Removed ${filteredCount} records`, 'data-lake');
      }

      // Store the consolidated data
      this.dataLakeStorage.set(lakeId, processedData);

      // Extract schema fields
      const schemaFields = processedData.length > 0 ? Object.keys(processedData[0]) : [];

      // Update lake metadata
      const buildTime = Date.now() - startTime;
      await this.updateDataLake(lakeId, {
        status: 'ready',
        metadata: {
          ...lake.metadata,
          totalRecords: processedData.length,
          lastBuiltAt: new Date(),
          schemaVersion: lake.metadata.schemaVersion + 1,
          dataSources: sourceMetadata.map(src => ({
            dataSourceId: src.dataSourceId,
            recordCount: src.recordsLoaded,
            lastSyncedAt: new Date(),
          })),
        },
        lastBuiltAt: new Date(),
      });

      const result: DataLakeBuildResult = {
        success: true,
        lakeId,
        recordsProcessed: allData.length,
        recordsStored: processedData.length,
        recordsFiltered: filteredCount,
        recordsDuplicated: duplicateCount,
        status: 'ready',
        buildTime,
        metadata: {
          sources: sourceMetadata,
          consolidatedAt: new Date(),
          schemaFields,
        },
      };

      clientLogger.success(`Data lake built successfully: ${lake.name}`, 'data-lake', {
        lakeId,
        recordsStored: result.recordsStored,
        buildTime: `${buildTime}ms`,
      });

      return result;
    } catch (error) {
      // Update status to error
      await this.updateDataLake(lakeId, { status: 'error' });

      const errorMessage = error instanceof Error ? error.message : String(error);
      
      clientLogger.error(`Failed to build data lake: ${lake.name}`, 'data-lake', {
        lakeId,
        error: errorMessage,
      });

      return {
        success: false,
        lakeId,
        recordsProcessed: 0,
        recordsStored: 0,
        recordsFiltered: 0,
        recordsDuplicated: 0,
        status: 'error',
        error: errorMessage,
        buildTime: Date.now() - startTime,
        metadata: {
          sources: [],
          consolidatedAt: new Date(),
          schemaFields: [],
        },
      };
    }
  }

  // ==================== QUERY OPERATIONS ====================

  /**
   * Query data from a built data lake
   */
  async queryDataLake(
    lakeId: string,
    options: DataLakeQueryOptions = {}
  ): Promise<DataLakeQueryResult> {
    const lake = this.dataLakes.get(lakeId);

    if (!lake) {
      throw new Error(`Data lake not found: ${lakeId}`);
    }

    if (lake.status !== 'ready') {
      throw new Error(`Data lake is not ready. Status: ${lake.status}`);
    }

    const data = this.dataLakeStorage.get(lakeId) || [];

    if (data.length === 0) {
      return {
        columns: [],
        rows: [],
        totalCount: 0,
        hasMore: false,
      };
    }

    // Apply filters
    let filteredData = data;
    if (options.filters && options.filters.length > 0) {
      filteredData = this.applyFilters(filteredData, options.filters);
    }

    // Apply sorting
    if (options.sort) {
      filteredData = this.sortData(filteredData, options.sort);
    }

    const totalCount = filteredData.length;

    // Apply pagination
    const limit = options.limit || 1000;
    const offset = options.offset || 0;
    const paginatedData = filteredData.slice(offset, offset + limit);
    const hasMore = offset + limit < totalCount;

    // Convert to row format
    const columns = options.fields || (paginatedData.length > 0 ? Object.keys(paginatedData[0]) : []);
    const rows = paginatedData.map(record => 
      columns.map(col => record[col])
    );

    clientLogger.info(`Queried data lake: ${lake.name}`, 'data-lake', {
      lakeId,
      totalCount,
      returned: rows.length,
      filters: options.filters?.length || 0,
    });

    return {
      columns,
      rows,
      totalCount,
      hasMore,
    };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Deduplicate data based on a key field
   */
  private deduplicateData(data: any[], key: string): any[] {
    const seen = new Set<string>();
    return data.filter(record => {
      const value = String(record[key] ?? Math.random());
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  /**
   * Apply filters to data
   */
  private applyFilters(data: any[], filters: DataFilter[]): any[] {
    return data.filter(record => {
      return filters.every(filter => {
        const value = record[filter.field];
        
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'gt':
            return value > filter.value;
          case 'lt':
            return value < filter.value;
          case 'between':
            return Array.isArray(filter.value) && 
                   value >= filter.value[0] && 
                   value <= filter.value[1];
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(value);
          default:
            return true;
        }
      });
    });
  }

  /**
   * Sort data
   */
  private sortData(
    data: any[],
    sort: { field: string; direction: 'asc' | 'desc' }
  ): any[] {
    return [...data].sort((a, b) => {
      const aVal = a[sort.field];
      const bVal = b[sort.field];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal > bVal ? 1 : -1;
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Get storage size estimate
   */
  private getStorageSize(data: any[]): number {
    return JSON.stringify(data).length;
  }
}

// Export singleton instance
export const dataLakeService = DataLakeService.getInstance();
