# Separated Database Architecture

## Overview

This document describes the new separated database architecture for Manifold ETL, which separates configuration storage from actual data storage for better performance, scalability, and data management.

## Architecture Principles

### 1. Core Database (Configuration Only)
- **Purpose**: Stores application configuration, metadata, and indexes
- **Location**: `core.db` (SQLite)
- **Contents**:
  - Project definitions
  - Data source configurations
  - Job schedules
  - User settings
  - Relationships between data sources
  - Import history metadata

### 2. Data Source Databases (Data Only)
- **Purpose**: Stores actual imported data with versioning
- **Location**: Individual SQLite files per data source
- **Structure**: `data-sources/{projectId}/{dataSourceId}.db`
- **Contents**:
  - Versioned data snapshots
  - Schema evolution tracking
  - Import logs and quality metrics
  - Diff data between versions

## Benefits

### Performance
- **Faster queries**: Each data source has its own optimized database
- **Parallel processing**: Multiple data sources can be processed simultaneously
- **Reduced contention**: No single database bottleneck

### Scalability
- **Independent scaling**: Each data source can grow independently
- **Selective backup**: Only backup data sources that have changed
- **Distributed storage**: Data can be stored across different storage systems

### Data Management
- **Version control**: Each import creates a new version with diff tracking
- **Selective cleanup**: Remove old versions per data source
- **Data isolation**: Problems in one data source don't affect others

### Development
- **Easier testing**: Test individual data sources in isolation
- **Better debugging**: Clear separation of concerns
- **Simpler maintenance**: Update configurations without touching data

## Database Structure

### Core Database Schema

```sql
-- Projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  data_path TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Data sources table (configuration only)
CREATE TABLE data_sources (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config TEXT, -- JSON configuration including dataPath
  status TEXT DEFAULT 'idle',
  enabled BOOLEAN DEFAULT 1,
  sync_interval INTEGER, -- Minutes between syncs
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_sync_at DATETIME,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

### Data Source Database Schema

```sql
-- Data versions table (stores each import)
CREATE TABLE data_versions (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  data TEXT NOT NULL, -- JSON array of records
  schema TEXT, -- JSON schema definition
  metadata TEXT, -- JSON metadata about the import
  record_count INTEGER NOT NULL DEFAULT 0,
  previous_version_id TEXT,
  diff_data TEXT, -- JSON diff data from previous version
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (previous_version_id) REFERENCES data_versions(id)
);

-- Schema evolution tracking
CREATE TABLE schema_versions (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  schema TEXT NOT NULL, -- JSON schema
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Import logs for debugging
CREATE TABLE import_logs (
  id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL,
  status TEXT NOT NULL, -- pending, completed, failed
  message TEXT,
  error_details TEXT,
  duration_ms INTEGER,
  records_processed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (version_id) REFERENCES data_versions(id)
);

-- Data quality metrics
CREATE TABLE quality_metrics (
  id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  threshold REAL,
  status TEXT, -- pass, warning, fail
  details TEXT, -- JSON details
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (version_id) REFERENCES data_versions(id)
);
```

## Data Versioning & Diffing

### Version Management
- Each import creates a new version with an incrementing version number
- Previous version ID is stored for diff calculation
- Schema changes are tracked separately

### Diff Algorithm
The system calculates differences between versions by:
1. **Added records**: Records present in new version but not in old
2. **Removed records**: Records present in old version but not in new
3. **Modified records**: Records with different values between versions
4. **Field-level changes**: Detailed tracking of which fields changed

### Diff Data Structure
```json
{
  "added": 5,
  "removed": 2,
  "modified": 3,
  "totalChanges": 10,
  "details": {
    "added": [...],
    "removed": [...],
    "modified": [
      {
        "old": {...},
        "new": {...},
        "changes": {
          "field1": {
            "type": "modified",
            "oldValue": "old",
            "newValue": "new"
          }
        }
      }
    ]
  }
}
```

## JavaScript Data Source Integration

### Script Execution
- Safe execution environment with limited globals
- Support for environment variables
- Timeout protection (max 5 seconds for setTimeout)
- Mock fetch implementation for API calls

### Available Context
```javascript
// Safe globals
console.log, console.error, console.warn
JSON, Date, Math
setTimeout (limited to 5 seconds)

// Helper functions
utils.generateId()
utils.formatDate()
utils.parseJSON()
utils.stringifyJSON()

// Mock fetch (returns mock responses)
fetch(url, options)

// User variables (from configuration)
// Any variables defined in the data source config
```

### Example Script
```javascript
// Fetch data from an API
async function fetchData() {
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
  
  // Transform the data
  return data.map(item => ({
    id: utils.generateId(),
    name: item.title,
    value: item.amount,
    timestamp: utils.formatDate()
  }));
}

// Return the data
return await fetchData();
```

## Usage Examples

### Creating a Data Source
```typescript
import { SeparatedDatabaseManager } from './lib/server/database/SeparatedDatabaseManager';

const dbManager = SeparatedDatabaseManager.getInstance();

// Create a JavaScript data source
const dataSource = await dbManager.createDataSource('project1', {
  name: 'API Data',
  type: 'javascript',
  config: {
    script: 'return await fetchData();',
    variables: {
      apiUrl: 'https://api.example.com',
      apiKey: 'secret123'
    },
    enableDiff: true,
    diffKey: 'id'
  },
  syncInterval: 60 // minutes
});
```

### Importing Data
```typescript
// Import data using JavaScript script
const result = await dbManager.importData('project1', 'datasource1', data, {
  schema: { id: 'string', name: 'string', value: 'number' },
  enableDiff: true,
  diffKey: 'id'
});

console.log(`Imported ${result.recordCount} records as version ${result.version}`);
```

### Getting Data with Diff
```typescript
// Get latest data
const latestData = await dbManager.getLatestData('project1', 'datasource1');

// Get specific version
const versionData = await dbManager.getDataVersion('project1', 'datasource1', 5);

// Get diff between versions
const diff = await dbManager.getDataDiff('project1', 'datasource1', 4, 5);
console.log(`Changes: ${diff.totalChanges} (${diff.added} added, ${diff.removed} removed, ${diff.modified} modified)`);
```

## Migration Strategy

### From Current Architecture
1. **Phase 1**: Implement new architecture alongside existing
2. **Phase 2**: Migrate existing data sources to new structure
3. **Phase 3**: Remove old snapshot tables from core database
4. **Phase 4**: Update all client code to use new APIs

### Data Migration
```typescript
// Migrate existing snapshots to new structure
async function migrateSnapshots(projectId: string, dataSourceId: string) {
  const oldSnapshots = await oldDb.getSnapshots(dataSourceId);
  
  for (const snapshot of oldSnapshots) {
    await dbManager.importData(projectId, dataSourceId, snapshot.data, {
      schema: snapshot.schema,
      metadata: snapshot.metadata
    });
  }
}
```

## Performance Considerations

### Database Optimization
- **WAL Mode**: Each data source database uses WAL mode for better concurrency
- **Indexes**: Proper indexing on version numbers and timestamps
- **Cleanup**: Automatic cleanup of old versions (configurable retention)

### Memory Management
- **Lazy Loading**: Data source databases are loaded on demand
- **Connection Pooling**: Reuse database connections where possible
- **Batch Operations**: Process large datasets in batches

### Storage Optimization
- **Compression**: Consider compressing old versions
- **Archival**: Move very old versions to cold storage
- **Deduplication**: Store only changed records in diff data

## Security Considerations

### Script Execution
- **Sandboxed Environment**: Limited global access
- **Timeout Protection**: Prevent infinite loops
- **Resource Limits**: Memory and CPU usage limits
- **Network Restrictions**: Mock fetch for security

### Data Access
- **Path Validation**: Ensure database paths are within allowed directories
- **Permission Checks**: Verify user access to projects and data sources
- **Audit Logging**: Log all data access and modifications

## Monitoring & Observability

### Metrics
- **Import Success Rate**: Track successful vs failed imports
- **Performance Metrics**: Import duration, record counts
- **Storage Usage**: Database sizes, version counts
- **Data Quality**: Quality metrics per version

### Logging
- **Import Logs**: Detailed logs for each import operation
- **Error Tracking**: Comprehensive error logging with context
- **Performance Logs**: Timing and resource usage information

### Alerts
- **Failed Imports**: Alert on consecutive import failures
- **Storage Limits**: Alert when approaching storage limits
- **Performance Degradation**: Alert on slow imports
- **Data Quality Issues**: Alert on quality metric failures

## Future Enhancements

### Advanced Features
- **Incremental Imports**: Only import changed data
- **Real-time Sync**: WebSocket-based real-time data updates
- **Data Lineage**: Track data flow between sources
- **Schema Evolution**: Automatic schema migration tools

### Scalability Improvements
- **Distributed Storage**: Support for cloud storage backends
- **Sharding**: Split large data sources across multiple databases
- **Replication**: Replicate critical data for redundancy
- **Caching**: Intelligent caching for frequently accessed data

### Developer Experience
- **Schema Validation**: Automatic schema validation and suggestions
- **Data Profiling**: Automatic data profiling and quality analysis
- **Visual Diff**: Web UI for viewing data differences
- **Import Templates**: Pre-built templates for common data sources
