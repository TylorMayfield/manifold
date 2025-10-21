// Export all provider types and classes
export { BaseProvider, ProviderFactory } from './BaseProvider';
export { BaseDatabaseProvider } from './BaseDatabaseProvider';
export { CsvProvider } from './CsvProvider';
export { JsonProvider } from './JsonProvider';
export { ExcelProvider } from './ExcelProvider';
export { ScriptProvider } from './ScriptProvider';
export { MockProvider } from './MockProvider';
export { SqliteProvider } from './SqliteProvider';
export { OdbcProvider } from './OdbcProvider';
export { MssqlProvider } from './MssqlProvider';

// Export all interfaces
export type {
  ProviderConfig,
  ExecutionContext,
  ExecutionResult,
  ValidationResult,
  ValidationError,
  TestConnectionResult,
  ColumnInfo,
  ProgressInfo,
  LogLevel,
  TableInfo
} from './BaseProvider';

export type { DatabaseConnection, DatabaseProviderConfig } from './BaseDatabaseProvider';
export type { CsvProviderConfig } from './CsvProvider';
export type { JsonProviderConfig } from './JsonProvider';
export type { ExcelProviderConfig } from './ExcelProvider';
export type { ScriptProviderConfig } from './ScriptProvider';
export type { MockProviderConfig, MockDataField } from './MockProvider';
export type { SqliteProviderConfig } from './SqliteProvider';
export type { OdbcProviderConfig } from './OdbcProvider';
export type { MssqlProviderConfig, MssqlConnection } from './MssqlProvider';

// Register all providers with the factory
import { ProviderFactory } from './BaseProvider';
import { CsvProvider } from './CsvProvider';
import { JsonProvider } from './JsonProvider';
import { ExcelProvider } from './ExcelProvider';
import { SQLiteProvider } from './SQLiteProvider';
import { SQLProvider } from './SQLProvider';
import { FTPProvider } from './FTPProvider';
import { FileCollectionProvider } from './FileCollectionProvider';
import { ScriptProvider } from './ScriptProvider';
import { MockProvider } from './MockProvider';
import { SqliteProvider } from './SqliteProvider';
import { OdbcProvider } from './OdbcProvider';
import { MssqlProvider } from './MssqlProvider';

// Register providers
ProviderFactory.registerProvider('csv', CsvProvider);
ProviderFactory.registerProvider('json', JsonProvider);
ProviderFactory.registerProvider('excel', ExcelProvider);
ProviderFactory.registerProvider('sqlite', SQLiteProvider);
ProviderFactory.registerProvider('sql', SQLProvider);
ProviderFactory.registerProvider('ftp', FTPProvider);
ProviderFactory.registerProvider('file_collection', FileCollectionProvider);
ProviderFactory.registerProvider('script', ScriptProvider);
ProviderFactory.registerProvider('mock', MockProvider);
ProviderFactory.registerProvider('odbc', OdbcProvider);
ProviderFactory.registerProvider('mssql', MssqlProvider);

// Provider registry with metadata
export const PROVIDER_REGISTRY = {
  csv: {
    class: CsvProvider,
    displayName: 'CSV Files',
    description: 'Import data from CSV files with automatic type detection and streaming support',
    supportedFormats: ['.csv'],
    features: [
      'Streaming import for large files',
      'Automatic type inference',
      'Custom delimiters',
      'Header detection',
      'Transform functions',
      'URL and local file support'
    ],
    category: 'file'
  },
  json: {
    class: JsonProvider,
    displayName: 'JSON Files',
    description: 'Import data from JSON files with nested object flattening and streaming support',
    supportedFormats: ['.json', '.jsonl', '.ndjson'],
    features: [
      'Nested object flattening',
      'JSONPath extraction',
      'NDJSON/JSONL support',
      'Array handling options',
      'Transform functions',
      'URL and local file support'
    ],
    category: 'file'
  },
  excel: {
    class: ExcelProvider,
    displayName: 'Excel Files',
    description: 'Import data from Excel files (XLS, XLSX) with automatic type detection and sheet selection',
    supportedFormats: ['.xls', '.xlsx', '.xlsm'],
    features: [
      'XLS, XLSX, and XLSM support',
      'Multiple sheet support',
      'Automatic type inference',
      'Custom range selection',
      'Header row configuration',
      'Transform functions',
      'URL and local file support'
    ],
    category: 'file'
  },
  script: {
    class: ScriptProvider,
    displayName: 'Custom Scripts',
    description: 'Execute custom JavaScript, Python, or shell scripts for data processing',
    supportedFormats: ['.js', '.py', '.sh'],
    features: [
      'JavaScript, Python, and Shell support',
      'Custom data transformation',
      'Environment variable support',
      'Timeout and error handling',
      'Output parsing (JSON/JSONL)',
      'Progress tracking'
    ],
    category: 'script'
  },
  mock: {
    class: MockProvider,
    displayName: 'Mock Data Generator',
    description: 'Generate realistic fake data for testing and development purposes',
    supportedFormats: [],
    features: [
      'Realistic data generation',
      '17+ field types available',
      'Custom field generators',
      'Reproducible with seeds',
      'Batch processing',
      'Null value support'
    ],
    category: 'generator'
  },
  sqlite: {
    class: SQLiteProvider,
    displayName: 'SQLite Database',
    description: 'Connect to SQLite databases for data extraction and analysis',
    supportedFormats: ['.db', '.sqlite', '.sqlite3'],
    features: [
      'Local and in-memory databases',
      'Custom SQL queries',
      'Table introspection',
      'Streaming for large datasets',
      'Transaction support',
      'Performance optimizations'
    ],
    category: 'database'
  },
  sql: {
    class: SQLProvider,
    displayName: 'SQL Database',
    description: 'Connect to PostgreSQL, MySQL, SQL Server, Oracle databases',
    supportedFormats: ['postgresql', 'mysql', 'mssql', 'oracle'],
    features: [
      'Multiple database types',
      'Connection string support',
      'Custom SQL queries',
      'Schema introspection',
      'SSL support',
      'Connection pooling'
    ],
    category: 'database'
  },
  ftp: {
    class: FTPProvider,
    displayName: 'FTP/SFTP Server',
    description: 'Import files from FTP or SFTP servers',
    supportedFormats: ['.csv', '.json', '.xml', '.txt'],
    features: [
      'FTP and SFTP support',
      'Secure authentication',
      'File download and parsing',
      'Multiple file formats',
      'Custom delimiters',
      'Header detection'
    ],
    category: 'remote'
  },
  file_collection: {
    class: FileCollectionProvider,
    displayName: 'File Collection',
    description: 'Manage collections of files (images, documents, etc.) with delta tracking',
    supportedFormats: ['.jpg', '.png', '.gif', '.pdf', '.doc', '*'],
    features: [
      'File indexing and metadata extraction',
      'Delta detection (added/removed/modified)',
      'Image metadata (dimensions, EXIF)',
      'Checksum calculation (MD5/SHA256)',
      'Recursive directory scanning',
      'File type filtering',
      'Profile picture management',
      'Document versioning'
    ],
    category: 'file'
  },
  odbc: {
    class: OdbcProvider,
    displayName: 'ODBC Database',
    description: 'Connect to any ODBC-compliant database (Access, DB2, Informix, etc.)',
    supportedFormats: [],
    features: [
      'Universal database connectivity',
      'Support for any ODBC driver',
      'Delta/incremental sync',
      'Batch export to reduce load',
      'Custom connection strings',
      'DSN support',
      'Table introspection'
    ],
    category: 'database'
  },
  mssql: {
    class: MssqlProvider,
    displayName: 'Microsoft SQL Server',
    description: 'Connect to Microsoft SQL Server with advanced features and optimizations',
    supportedFormats: [],
    features: [
      'Change Tracking support',
      'Optimized bulk operations',
      'Query hints (NOLOCK, MAXDOP)',
      'Delta sync with rowversion',
      'Connection pooling',
      'Named instance support',
      'Batch export to reduce load',
      'Table introspection'
    ],
    category: 'database'
  }
} as const;

// Helper functions
export function getAvailableProviders(): typeof PROVIDER_REGISTRY {
  return PROVIDER_REGISTRY;
}

export function getProviderByType(type: keyof typeof PROVIDER_REGISTRY) {
  return PROVIDER_REGISTRY[type];
}

export function getSupportedFileExtensions(): string[] {
  return Object.values(PROVIDER_REGISTRY)
    .flatMap(provider => provider.supportedFormats)
    .sort();
}

export function getProvidersByCategory(category: string) {
  return Object.entries(PROVIDER_REGISTRY)
    .filter(([_, provider]) => provider.category === category)
    .reduce((acc, [key, provider]) => {
      (acc as any)[key] = provider;
      return acc;
    }, {} as Partial<typeof PROVIDER_REGISTRY>);
}