import { DataSource } from './index';

export interface VersionRetentionPolicy {
  strategy: 'keep-last' | 'keep-all' | 'keep-days';
  value?: number;
  autoCleanup?: boolean;
}

export interface DataSourceConfig {
  id?: string;
  name: string;
  type: string;
  config?: any;
  lastSyncAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  versionRetention?: VersionRetentionPolicy;
}

export interface DataLake {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: 'draft' | 'building' | 'ready' | 'error';
  config: DataLakeConfig;
  metadata: DataLakeMetadata;
  createdAt: Date;
  updatedAt: Date;
  lastBuiltAt?: Date;
  nextScheduledBuild?: Date;
}

export interface DataLakeConfig {
  // Data Sources to include in the lake
  dataSourceIds: string[];
  
  // Data Lake Settings
  settings: {
    // Storage settings
    storageType: 'sqlite' | 'parquet' | 'json' | 'csv';
    compression: boolean;
    partitioning: 'none' | 'date' | 'data_source' | 'custom';
    partitionFields?: string[];
    
    // Data processing settings
    deduplication: boolean;
    deduplicationKey?: string;
    dataValidation: boolean;
    schemaEvolution: 'strict' | 'relaxed' | 'auto';
    
    // Performance settings
    indexing: boolean;
    indexFields?: string[];
    caching: boolean;
    cacheSize?: number; // MB
    
    // Scheduling settings
    autoRefresh: boolean;
    refreshInterval?: number; // minutes
    refreshSchedule?: string; // cron expression
    
    // Advanced settings
    customTransformations?: DataTransformation[];
    customFilters?: DataFilter[];
    customJoins?: DataJoin[];
  };
  
  // Data Lake Schema
  schema?: DataLakeSchema;
  
  // Relationships between data sources
  relationships?: DataLakeRelationship[];
}

export interface DataLakeMetadata {
  // Statistics
  totalRecords: number;
  totalDataSources?: number;
  totalSize?: number; // bytes
  lastRecordTimestamp?: Date;
  lastBuiltAt?: Date;
  
  // Data source details
  dataSources?: Array<{
    dataSourceId: string;
    recordCount: number;
    lastSyncedAt: Date;
  }>;
  
  // Schema information
  schemaVersion?: number;
  columnCount?: number;
  dataTypes?: Record<string, string>;
  indexedFields?: string[];
  
  // Performance metrics
  buildTime?: number; // milliseconds
  queryPerformance?: QueryPerformanceMetrics;
  
  // Data quality metrics
  qualityScore?: number; // 0-100
  qualityIssues?: DataQualityIssue[];
  
  // Storage information
  storageLocation?: string;
  storageSize?: number;
  backupLocations?: string[];
}

export interface DataLakeSchema {
  version: number;
  tables: DataLakeTable[];
  relationships: DataLakeRelationship[];
  indexes: DataLakeIndex[];
  constraints: DataLakeConstraint[];
}

export interface DataLakeTable {
  id: string;
  name: string;
  sourceDataSourceId: string;
  columns: DataLakeColumn[];
  recordCount: number;
  lastUpdated: Date;
  metadata?: any;
}

export interface DataLakeColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue?: any;
  description?: string;
  sourceColumn?: string;
  transformations?: ColumnTransformation[];
}

export interface DataLakeRelationship {
  id: string;
  name: string;
  sourceTableId: string;
  targetTableId: string;
  sourceColumns: string[];
  targetColumns: string[];
  relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many';
  joinType: 'inner' | 'left' | 'right' | 'full';
  isActive: boolean;
}

export interface DataLakeIndex {
  id: string;
  name: string;
  tableId: string;
  columns: string[];
  indexType: 'btree' | 'hash' | 'fulltext';
  isUnique: boolean;
}

export interface DataLakeConstraint {
  id: string;
  name: string;
  tableId: string;
  type: 'primary_key' | 'foreign_key' | 'unique' | 'check';
  columns: string[];
  definition?: string;
}

export interface DataTransformation {
  id: string;
  name: string;
  type: 'column' | 'table' | 'aggregation' | 'filter';
  sourceDataSourceId?: string;
  config: any;
  order: number;
}

export interface DataFilter {
  id: string;
  name: string;
  sourceDataSourceId?: string;
  condition?: string;
  field?: string;
  operator?: 'equals' | 'contains' | 'gt' | 'lt' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'between';
  value?: any;
  isActive: boolean;
}

export interface DataJoin {
  id: string;
  name: string;
  sourceDataSourceId: string;
  targetDataSourceId: string;
  joinCondition: string;
  joinType: 'inner' | 'left' | 'right' | 'full';
}

export interface ColumnTransformation {
  type: 'rename' | 'cast' | 'format' | 'calculate' | 'lookup';
  config: any;
}

export interface QueryPerformanceMetrics {
  averageQueryTime: number;
  slowestQueries: SlowQuery[];
  indexUsage: IndexUsageStats[];
  cacheHitRate: number;
}

export interface SlowQuery {
  query: string;
  executionTime: number;
  timestamp: Date;
}

export interface IndexUsageStats {
  indexName: string;
  usageCount: number;
  lastUsed: Date;
}

export interface DataQualityIssue {
  id: string;
  type: 'missing_values' | 'duplicate_records' | 'schema_mismatch' | 'data_type_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedRecords: number;
  affectedTableId: string;
  detectedAt: Date;
  resolvedAt?: Date;
}

export interface DataLakeBuildResult {
  id: string;
  dataLakeId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  
  // Build statistics
  recordsProcessed: number;
  dataSourcesProcessed: number;
  errors: BuildError[];
  warnings: BuildWarning[];
  
  // Performance metrics
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  
  // Data quality results
  qualityScore?: number;
  qualityIssues?: DataQualityIssue[];
}

export interface BuildError {
  id: string;
  type: 'data_source_error' | 'schema_error' | 'transformation_error' | 'storage_error';
  message: string;
  sourceDataSourceId?: string;
  timestamp: Date;
  stackTrace?: string;
}

export interface BuildWarning {
  id: string;
  type: 'performance_warning' | 'data_quality_warning' | 'schema_warning';
  message: string;
  sourceDataSourceId?: string;
  timestamp: Date;
}

export interface DataLakeQuery {
  id: string;
  dataLakeId: string;
  name: string;
  sql: string;
  parameters?: Record<string, any>;
  isPublic: boolean;
  createdAt: Date;
  lastExecuted?: Date;
  executionCount: number;
  averageExecutionTime?: number;
  createdBy?: string;
}

export interface DataLakeQueryResult {
  id: string;
  queryId: string;
  executedAt: Date;
  duration: number; // milliseconds
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  
  // Results
  columns?: string[];
  rows?: any[][];
  totalRows?: number;
  returnedRows?: number;
  
  // Performance metrics
  memoryUsage?: number;
  cpuUsage?: number;
  
  // Error information
  error?: string;
  errorType?: string;
}

export interface DataLakeTemplate {
  id: string;
  name: string;
  description: string;
  category: 'ecommerce' | 'analytics' | 'iot' | 'finance' | 'healthcare' | 'custom';
  config: DataLakeConfig;
  sampleDataSources?: Partial<DataSource>[];
  tags: string[];
  isPublic: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataLakeExport {
  id: string;
  dataLakeId: string;
  name: string;
  exportType: 'csv' | 'json' | 'parquet' | 'sqlite' | 'excel';
  filters?: DataFilter[];
  format: {
    delimiter?: string;
    encoding?: string;
    compression?: boolean;
    includeHeaders?: boolean;
  };
  status: 'pending' | 'running' | 'completed' | 'failed';
  filePath?: string;
  fileSize?: number;
  recordCount?: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface DataLakeBackup {
  id: string;
  dataLakeId: string;
  name: string;
  backupType: 'full' | 'incremental' | 'differential';
  storageLocation: string;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed';
  size?: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface DataLakeMonitoring {
  dataLakeId: string;
  lastChecked: Date;
  
  // Health metrics
  healthStatus: 'healthy' | 'warning' | 'error';
  healthScore: number; // 0-100
  
  // Performance metrics
  averageQueryTime: number;
  totalQueries: number;
  errorRate: number;
  
  // Storage metrics
  storageUsed: number;
  storageAvailable: number;
  storageGrowthRate: number; // bytes per day
  
  // Data freshness
  dataAge: number; // hours since last update
  staleDataSources: string[];
  
  // Alert thresholds
  alertThresholds: {
    maxQueryTime: number;
    maxErrorRate: number;
    maxStorageUsage: number;
    maxDataAge: number;
  };
  
  // Active alerts
  activeAlerts: DataLakeAlert[];
}

export interface DataLakeAlert {
  id: string;
  dataLakeId: string;
  type: 'performance' | 'storage' | 'data_quality' | 'availability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
  triggeredAt: Date;
  resolvedAt?: Date;
  isResolved: boolean;
}
