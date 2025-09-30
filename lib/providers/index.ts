// Export all provider types and classes
export { BaseProvider, ProviderFactory } from './BaseProvider';
export { BaseDatabaseProvider } from './BaseDatabaseProvider';
export { CsvProvider } from './CsvProvider';
export { JsonProvider } from './JsonProvider';
export { ScriptProvider } from './ScriptProvider';
export { MockProvider } from './MockProvider';
export { SqliteProvider } from './SqliteProvider';

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
export type { ScriptProviderConfig } from './ScriptProvider';
export type { MockProviderConfig, MockDataField } from './MockProvider';
export type { SqliteProviderConfig } from './SqliteProvider';

// Register all providers with the factory
import { ProviderFactory } from './BaseProvider';
import { CsvProvider } from './CsvProvider';
import { JsonProvider } from './JsonProvider';
import { ScriptProvider } from './ScriptProvider';
import { MockProvider } from './MockProvider';
import { SqliteProvider } from './SqliteProvider';

// Register providers
ProviderFactory.registerProvider('csv', CsvProvider);
ProviderFactory.registerProvider('json', JsonProvider);
ProviderFactory.registerProvider('script', ScriptProvider);
ProviderFactory.registerProvider('mock', MockProvider);
ProviderFactory.registerProvider('sqlite', SqliteProvider);

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
    class: SqliteProvider,
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