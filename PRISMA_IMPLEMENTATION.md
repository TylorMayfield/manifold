# Prisma SQLite Implementation

This document outlines the new Prisma-based SQLite database architecture for Manifold.

## Architecture Overview

The new implementation uses a **hub-and-spoke** database architecture:

- **Core Database (Hub)**: `core.db` - Contains application metadata, project indexing, and job management
- **Project Databases (Spokes)**: `projects/{projectId}.db` - Individual SQLite databases for each project's data

## Database Structure

### Core Database (`core.db`)

The core database contains:

- **Projects**: Project metadata and indexing
- **Data Sources**: Data source definitions and status
- **Backups**: Backup job records and metadata
- **Jobs**: All job management (backup, import, export, etc.)
- **App Settings**: Application configuration
- **Import History**: Import tracking across projects

### Project Databases (`projects/{projectId}.db`)

Each project has its own SQLite database containing:

- **Data Sources**: Project-specific data source configurations
- **Snapshots**: Imported data snapshots
- **Relationships**: Data relationships between sources
- **Consolidated Models**: Data models and transformations
- **Import History**: Project-specific import tracking

## Key Components

### 1. Database Services

- **`CoreDatabase`**: Manages the core application database
- **`ProjectDatabase`**: Manages individual project databases
- **`DatabaseManager`**: Unified interface for both core and project operations
- **`PrismaDatabaseService`**: Type-safe service layer using Prisma

### 2. Backup System

- **`BackupJobService`**: Handles backup job creation and execution
- **`PrismaBackupService`**: High-level backup management
- **Backup Types**:
  - **CSV**: Export project data to CSV format
  - **SQLite**: Copy project database file
  - **Full**: Complete JSON backup with all data

### 3. Job Management

All operations are now handled as **Jobs**:

- **Backup Jobs**: Create backups in various formats
- **Import Jobs**: Import data from various sources
- **Export Jobs**: Export data to various formats
- **Sync Jobs**: Synchronize data between sources

## Usage Examples

### Creating a Project

```typescript
import { DatabaseManager } from "./lib/database/DatabaseManager";

const dbManager = DatabaseManager.getInstance();
await dbManager.initialize();

const project = await dbManager.createProject({
  name: "My Project",
  description: "A sample project",
});
```

### Creating a Backup Job

```typescript
import { BackupJobService } from "./lib/services/BackupJobService";

const backupService = BackupJobService.getInstance();

const jobId = await backupService.createBackupJob({
  projectId: "proj_123",
  type: "sqlite",
  includeData: true,
  compression: false,
});
```

### Managing Data Sources

```typescript
// Create a data source
const dataSource = await dbManager.createDataSource(projectId, {
  name: "CSV Import",
  type: "file",
  config: { path: "/path/to/file.csv" },
});

// Get project data sources
const dataSources = await dbManager.getDataSources(projectId);
```

## Migration from Legacy System

The new system maintains backward compatibility:

1. **`DatabaseService`** now tries Prisma first, then falls back to legacy implementation
2. **Existing APIs** remain unchanged
3. **Gradual migration** - components can be updated incrementally

## Database Scripts

```bash
# Generate Prisma clients
npm run db:generate
npm run db:generate:project

# Run migrations
npm run db:migrate
npm run db:migrate:project

# Open Prisma Studio
npm run db:studio

# Reset database
npm run db:reset
```

## Benefits

### 1. **Type Safety**

- Full TypeScript support with Prisma
- Compile-time type checking
- Auto-generated types

### 2. **Performance**

- Optimized SQLite queries
- Connection pooling
- Efficient indexing

### 3. **Scalability**

- Separate databases per project
- Reduced contention
- Better resource management

### 4. **Maintainability**

- Clear separation of concerns
- Standardized database operations
- Easy to extend and modify

### 5. **Backup & Recovery**

- Job-based backup system
- Multiple export formats
- Incremental backups

## File Structure

```
lib/
├── database/
│   ├── CoreDatabase.ts          # Core database management
│   ├── ProjectDatabase.ts       # Project database management
│   ├── DatabaseManager.ts       # Unified database interface
│   └── generated/
│       └── project-client/      # Generated Prisma client for projects
├── services/
│   ├── PrismaDatabaseService.ts # Type-safe database service
│   ├── BackupJobService.ts      # Backup job management
│   └── PrismaBackupService.ts   # High-level backup service
prisma/
├── schema.prisma                # Core database schema
├── project-schema.prisma        # Project database schema
└── migrations/
    ├── 20241220000000_init/     # Core database migration
    └── project/
        └── 20241220000000_init/ # Project database migration
```

## Next Steps

1. **Update Components**: Gradually migrate existing components to use Prisma services
2. **Add More Job Types**: Implement import, export, and sync jobs
3. **Performance Optimization**: Add database indexing and query optimization
4. **Monitoring**: Add database performance monitoring
5. **Testing**: Add comprehensive database tests

## Troubleshooting

### Common Issues

1. **Database Locked**: Ensure no other processes are accessing the database
2. **Migration Errors**: Check that the database file is not corrupted
3. **Type Errors**: Regenerate Prisma clients after schema changes

### Debug Commands

```bash
# Check database status
npm run db:studio

# Reset and recreate
npm run db:reset

# Generate fresh clients
npm run db:generate
npm run db:generate:project
```
