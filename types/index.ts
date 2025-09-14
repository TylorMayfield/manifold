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
}

export type DataProviderType =
  | "file"
  | "sql_dump"
  | "custom_script"
  | "api"
  | "mock"
  | "mysql";

// Keep DataSource as alias for backward compatibility
export type DataSource = DataProvider;
export type DataSourceType = DataProviderType;

export interface DataProviderConfig {
  // File provider config
  filePath?: string;
  fileType?: "csv" | "json";

  // SQL dump config
  sqlPath?: string;
  sqlDialect?: "mysql" | "postgresql" | "sqlite";

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
    recordCount: number;
    schema: TableSchema;
    dataTypes: Record<string, string>;
    seed?: number;
  };

  // MySQL database config
  mysqlConfig?: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    tables?: string[]; // Specific tables to sync, if empty sync all
    syncInterval?: number; // Minutes between syncs
  };

  // Custom script config
  customScriptConfig?: {
    language: "javascript" | "python" | "bash";
    code: string;
    variables?: Record<string, string>;
    schedule?: string; // Cron-like schedule
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
