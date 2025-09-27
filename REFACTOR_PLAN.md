# Manifold ETL Refactor Plan

## Vision
Transform Manifold into a focused, lightweight desktop ETL tool with:
- Clean black/white cell-shaded UI
- SQLite-based data versioning
- Pipeline-driven transformations
- Scheduled job execution
- Cross-source data merging

## Current State Analysis

### Keep (Core ETL Components)
- **Data Sources**: File upload, CSV parsing, database connections
- **Projects**: Project management and organization
- **Snapshots**: Data versioning concept (needs refactoring)
- **Job Scheduling**: Basic scheduling infrastructure
- **Electron App**: Desktop framework
- **SQLite**: Database layer

### Remove/Simplify
- **Glassmorphic UI**: Replace with cell-shaded black/white
- **Complex Relationship Canvas**: Simplify to basic joins
- **Multiple Database Services**: Consolidate to single ETL service
- **Prisma**: Remove complexity, use direct SQLite
- **Backup Systems**: Focus on data versioning instead
- **WebSocket/Real-time**: Not needed for ETL tool
- **Data Warehouse Integration**: Out of scope
- **Complex Analytics**: Focus on basic data viewing

## New Architecture

### Core Entities
```typescript
interface DataSource {
  id: string;
  name: string;
  type: 'csv' | 'database' | 'api' | 'script';
  config: DataSourceConfig;
  projectId: string;
}

interface Snapshot {
  id: string;
  dataSourceId: string;
  version: number;
  filePath: string; // Path to SQLite file
  recordCount: number;
  schema: TableSchema;
  createdAt: Date;
}

interface Pipeline {
  id: string;
  name: string;
  steps: TransformStep[];
  inputSources: string[];
  projectId: string;
}

interface Job {
  id: string;
  name: string;
  pipelineId: string;
  schedule: string; // cron
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

interface ExportTarget {
  id: string;
  name: string;
  type: 'file' | 'api' | 'database';
  config: ExportConfig;
}
```

### Directory Structure
```
lib/
├── etl/
│   ├── ingest/          # Data source adapters
│   ├── transform/       # Pipeline engine
│   ├── export/          # Export adapters
│   ├── diff/            # Snapshot comparison
│   └── merge/           # Cross-source merging
├── scheduler/           # Job management
├── metadata/            # SQLite indexing
└── storage/             # File management

components/
├── sources/             # Data source management
├── pipelines/           # Transform pipeline builder
├── jobs/                # Job scheduler UI
├── diff/                # Snapshot comparison viewer
└── ui/                  # Cell-shaded components

data/
├── projects/
│   └── {project-id}/
│       ├── metadata.sqlite     # Project index
│       └── snapshots/
│           ├── {timestamp}_source1.sqlite
│           └── {timestamp}_source2.sqlite
```

## UI Design System - Cell Shaded Black/White

### Color Palette
- **Background**: Pure white (#FFFFFF)
- **Surface**: Light gray (#F8F9FA)
- **Borders**: Black (#000000) - 1-2px solid lines
- **Text Primary**: Black (#000000)
- **Text Secondary**: Dark gray (#404040)
- **Accent**: Single accent color for state (maybe blue #0066FF)

### Visual Style
- **Cell-shaded borders**: Thick black outlines on all components
- **High contrast**: No gradients or transparency
- **Geometric shapes**: Sharp corners, no rounded edges
- **Comic book aesthetic**: Bold lines, clear sections
- **Minimal shadows**: Hard drop shadows if any

### Typography
- **Monospace font**: For code/data display
- **Sans-serif**: For UI text
- **Bold weights**: Emphasize hierarchy

## Implementation Phases

### Phase 1: Design System (Week 1)
1. Create new Tailwind config with cell-shaded theme
2. Build core UI components (Button, Input, Card, Table)
3. Update main layout with new aesthetic
4. Remove glassmorphic styles

### Phase 2: ETL Core (Week 2)
1. Implement data ingestion adapters
2. Create snapshot versioning system
3. Build basic pipeline framework
4. Implement job scheduler

### Phase 3: UI Components (Week 3)
1. Data source management interface
2. Pipeline builder (visual)
3. Job scheduler dashboard
4. Snapshot diff viewer

### Phase 4: Integration & Polish (Week 4)
1. Connect UI to ETL engine
2. Add export functionality
3. Testing and debugging
4. Documentation updates

## Success Criteria
- [ ] Clean, fast desktop app focused on ETL
- [ ] Cell-shaded black/white aesthetic
- [ ] Sub-second data ingestion for medium files
- [ ] Visual pipeline builder
- [ ] Reliable job scheduling
- [ ] Clear snapshot versioning and diffing
- [ ] Simple cross-source data merging
- [ ] Lightweight (~50MB installed)