export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  dataPath: string; // Path to project's data directory
}

export interface DataProvider {
  id: string;
  projectId: string;
  name: string;
  type: DataProviderType;
  config: DataProviderConfig;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
  status?: "idle" | "running" | "completed" | "error";
  enabled?: boolean;
  syncInterval?: number;
  snapshotPolicy?: SnapshotRetentionPolicy;
}

export type DataProviderType =
  | "csv"
  | "json"
  | "sql"
  | "sql_dump"
  | "api_script"
  | "mock"
  | "mysql"
  | "postgres"
  | "sqlite"
  | "odbc"
  | "mssql"
  | "javascript"
  | "sqlite_generator"
  | "json_generator"
  | "csv_generator";

// Keep DataSource as alias for backward compatibility
export type DataSource = DataProvider;
export type DataSourceType = DataProviderType;

export interface DataProviderConfig {
  // Unified import method
  importMethod?: string;

  // File provider config
  filePath?: string;
  fileType?: "csv" | "json";
  uploadFile?: File;
  importUrl?: string;

  // Database config
  mysqlConfig?: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    tables?: string[]; // Specific tables to sync, if empty sync all
    syncInterval?: number; // Minutes between syncs
  };

  // ODBC config
  odbcConfig?: {
    driver: string; // ODBC driver name
    host?: string;
    port?: number;
    database: string;
    username: string;
    password: string;
    dsn?: string; // Data Source Name
    connectionString?: string; // Custom connection string
    ssl?: boolean;
    tables?: string[];
    // Delta/incremental sync
    deltaSync?: {
      enabled: boolean;
      trackingColumn: string;
      trackingType: 'timestamp' | 'integer' | 'version';
    };
    // Batch export
    batchExport?: {
      enabled: boolean;
      batchSize: number;
      pauseBetweenBatches?: number;
    };
  };

  // MSSQL config
  mssqlConfig?: {
    host: string;
    port?: number;
    database: string;
    username: string;
    password: string;
    domain?: string; // For Windows authentication
    instanceName?: string; // Named instance
    encrypt?: boolean;
    trustServerCertificate?: boolean;
    tables?: string[];
    // Delta/Change Tracking
    deltaSync?: {
      enabled: boolean;
      method: 'change_tracking' | 'timestamp' | 'rowversion';
      trackingColumn?: string;
    };
    // Batch export with SQL Server optimizations
    batchExport?: {
      enabled: boolean;
      batchSize: number;
      noLock?: boolean; // Use NOLOCK hint
      pauseBetweenBatches?: number;
    };
    // Query hints
    queryHints?: {
      noLock?: boolean;
      readPast?: boolean;
      maxDop?: number;
    };
  };

  // SQL dump config
  sqlPath?: string;
  sqlDialect?: "mysql" | "postgresql" | "sqlite";

  // Raw SQL config
  sqlConfig?: {
    filePath?: string;
    sqlContent?: string;
    dialect: "mysql" | "postgresql" | "sqlite" | "generic";
    encoding?: "utf8" | "utf16" | "latin1";
    batchSize?: number; // Number of statements to process at once
    skipErrors?: boolean; // Continue processing if individual statements fail
    createTables?: boolean; // Whether to create tables from DDL statements
    insertData?: boolean; // Whether to process INSERT statements
    indexes?: boolean; // Whether to create indexes
    constraints?: boolean; // Whether to create foreign keys and constraints
    customDelimiter?: string; // Custom statement delimiter (default: ';')
    tableFilter?: string[]; // Only process specific tables
    excludeTables?: string[]; // Exclude specific tables
    dataOnly?: boolean; // Only process data (no DDL)
    schemaOnly?: boolean; // Only process schema (no data)
  };

  // API config
  apiConfig?: {
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    headers?: Record<string, string>;
    params?: Record<string, string>;
    authType?: "none" | "basic" | "bearer" | "api-key";
    authConfig?: Record<string, any>;
    body?: any;
  };

  // Custom script config
  scriptContent?: string;
  scriptLanguage?: "javascript";
  schedule?: string; // Cron expression

  // API config
  apiUrl?: string;
  apiMethod?: "GET" | "POST" | "PUT" | "DELETE";
  apiHeaders?: Record<string, string>;
  apiParams?: Record<string, string>;
  apiAuthType?: "none" | "bearer" | "basic" | "api_key";
  apiAuthConfig?: {
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
  apiBody?: string;

  // Mock data config
  mockConfig?: {
    templateId: string;
    recordCount: number;
    schema?: TableSchema;
    dataTypes?: Record<string, string>;
    seed?: number;
  };

  // Custom script config
  customScriptConfig?: {
    language: "javascript" | "python" | "bash";
    code: string;
    variables?: Record<string, string>;
    schedule?: string; // Cron-like schedule
  };

  // JavaScript script config
  javascriptConfig?: {
    script: string;
    interval?: number; // Minutes between executions
    schedule?: string; // Cron expression
    timeout?: number; // Script execution timeout in seconds
    variables?: Record<string, any>; // Environment variables for the script
    enableDiff?: boolean; // Enable data diffing between runs
    diffKey?: string; // Field to use for diffing (default: 'id')
    outputFormat?: "array" | "object"; // Expected output format
  };
}

// Keep DataSourceConfig as alias for backward compatibility
export type DataSourceConfig = DataProviderConfig;

export interface Snapshot {
  id: string;
  projectId?: string;
  dataSourceId: string;
  version?: number;
  data: any[]; // Raw data from source
  schema?: TableSchema;
  metadata?: any;
  createdAt: Date;
  recordCount?: number;
}

export interface SnapshotRetentionPolicy {
  keepLast?: number; // keep last N snapshots
  maxAgeDays?: number; // delete snapshots older than N days
  maxTotalSizeMB?: number; // optional total size cap per data source
  dryRun?: boolean; // if true, report only without deleting
}

export interface TableSchema {
  columns: ColumnSchema[];
  primaryKeys?: string[];
}

export interface ColumnSchema {
  name: string;
  type: "string" | "number" | "boolean" | "date";
  nullable: boolean;
  unique?: boolean;
}

export interface Relationship {
  id: string;
  projectId: string;
  sourceDataSourceId: string;
  targetDataSourceId: string;
  sourceColumn: string;
  targetColumn: string;
  relationshipType: "one_to_one" | "one_to_many" | "many_to_many";
  joinType: "inner" | "left" | "right" | "outer";
  createdAt: Date;
}

export interface ConsolidatedModel {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  dataSourceIds: string[];
  relationshipIds: string[];
  modelData?: any; // The actual consolidated data
  metadata?: any; // Additional metadata about the model
  recordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
}

export interface ImportProgress {
  stage: "reading" | "parsing" | "storing" | "indexing" | "complete" | "error";
  progress: number; // 0-100
  message: string;
  error?: string;
  // Enhanced progress details
  recordsProcessed?: number;
  totalRecords?: number;
  currentRecord?: number;
  bytesProcessed?: number;
  totalBytes?: number;
  startTime?: Date;
  estimatedCompletion?: Date;
  // Stage-specific details
  currentTable?: string;
  currentColumn?: string;
  validationErrors?: string[];
  warnings?: string[];
}

// ETL Pipeline Types
export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  steps: TransformStep[];
  inputSourceIds: string[];
  outputConfig?: ExportConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransformStep {
  id: string;
  type: TransformType;
  name: string;
  config: TransformConfig;
  order: number;
}

export type TransformType =
  | "filter"
  | "map"
  | "aggregate"
  | "join"
  | "sort"
  | "deduplicate"
  | "custom_script";

export interface TransformConfig {
  // Filter config
  filterExpression?: string;

  // Map config
  fieldMappings?: { from: string; to: string; transform?: string }[];

  // Aggregate config
  groupBy?: string[];
  aggregations?: {
    field: string;
    operation: "sum" | "avg" | "count" | "min" | "max";
  }[];

  // Join config
  joinType?: "inner" | "left" | "right" | "outer";
  joinKey?: string;
  targetSourceId?: string;

  // Sort config
  sortFields?: { field: string; direction: "asc" | "desc" }[];

  // Custom script config
  scriptContent?: string;
  scriptLanguage?: "javascript" | "python";
}

// Job Scheduling Types
export type JobType =
  | "pipeline"
  | "data_sync"
  | "backup"
  | "cleanup"
  | "custom_script"
  | "api_poll"
  | "workflow";

export interface Job {
  id: string;
  name: string;
  type: JobType;
  pipelineId: string;
  schedule: string; // cron expression
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type JobStatus = "idle" | "running" | "completed" | "failed" | "paused";

export interface JobExecution {
  id: string;
  jobId: string;
  status: JobStatus;
  startTime: Date;
  endTime?: Date;
  recordsProcessed?: number;
  error?: string;
  logs?: string[];
}

// Export Configuration
export interface ExportConfig {
  type: ExportType;
  destination: string;
  format?: "csv" | "json" | "sql";
  // File export
  filePath?: string;
  // API export
  apiUrl?: string;
  apiMethod?: "POST" | "PUT";
  apiHeaders?: Record<string, string>;
  // Database export
  connectionString?: string;
  tableName?: string;
  mode?: "replace" | "append" | "upsert";
}

export type ExportType = "file" | "api" | "database";

// Data Browser Types
export interface DataBrowserQuery {
  sourceId: string;
  snapshotId?: string;
  tableName?: string;
  filters?: DataFilter[];
  sort?: { field: string; direction: "asc" | "desc" };
  limit?: number;
  offset?: number;
}

export interface DataFilter {
  field: string;
  operator: "equals" | "contains" | "gt" | "lt" | "between" | "in";
  value: any;
}

export interface DataBrowserResult {
  columns: string[];
  rows: any[][];
  totalCount: number;
  hasMore: boolean;
}

// Re-export data lake types
export * from './dataLake'
