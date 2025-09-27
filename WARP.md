# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Manifold is a powerful, context-agnostic desktop application for data integration and consolidation built with Next.js and Electron. It features a glassmorphic design system and comprehensive logging capabilities for managing various data sources and their relationships.

## Development Commands

### Core Development
```bash
# Start development environment (Next.js + Electron)
npm run dev

# Start only Next.js dev server (useful for web-only development)
npm run dev:next

# Start only Electron (requires Next.js to be running first)
npm run dev:electron
```

### Building & Distribution
```bash
# Build Next.js application
npm run build

# Build complete Electron application
npm run build:electron

# Create distributable packages for all platforms
npm run dist

# Platform-specific builds
npm run dist:mac     # macOS only
npm run dist:win     # Windows only
npm run dist:linux   # Linux only
```

### Development Utilities
```bash
# TypeScript type checking
npm run type-check

# CSS linting (uses stylelint with Tailwind config)
npx stylelint "**/*.css"

# Clean build artifacts
npm run clean

# Full clean and reinstall
npm run clean:install

# Create new release (e.g., npm run release 1.0.0)
npm run release <version>
```

### Testing
While no test runner is configured, you can add tests using:
```bash
# Example for adding Jest
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15 with React 19 and TypeScript
- **Desktop**: Electron 28 with context isolation
- **Styling**: Tailwind CSS with custom glassmorphic components
- **Database**: better-sqlite3 for local data storage
- **Build**: Turbopack for fast compilation

### Core Architecture Patterns

1. **Hybrid Desktop-Web Application**
   - Next.js runs as the frontend
   - Electron provides desktop integration and native features
   - IPC communication between renderer and main processes

2. **Context-Based State Management**
   - `LogContext` for application-wide logging
   - `NavigationContext` for app navigation state
   - React Context pattern preferred over external state management

3. **Provider-Based Data Sources**
   - Unified `DataProvider` interface for all data sources
   - Supports file uploads, API connections, SQL dumps, MySQL, and custom scripts
   - Extensible configuration system via `DataProviderConfig`

4. **Snapshot-Based Data Versioning**
   - Each data import creates a snapshot with version control
   - Enables comparison and rollback capabilities
   - Stores both raw data and inferred schema

### Key Directory Structure

```
├── app/                    # Next.js app router pages
├── components/             # React components organized by feature
│   ├── ui/                # Reusable glassmorphic UI components
│   ├── projects/          # Project management components  
│   ├── data-sources/      # Data source management
│   └── logs/              # Logging interface components
├── lib/                   # Core business logic
│   ├── database/          # Database layer (server-side only)
│   ├── services/          # Background services and processors
│   └── utils/             # Utility functions including logger
├── contexts/              # React context providers
├── types/                 # TypeScript type definitions
└── public/electron.js     # Electron main process
```

## Data Architecture

### Core Entity Types
- **Project**: Top-level container for data integration work
- **DataProvider**: Unified interface for all data sources (files, APIs, databases)
- **Snapshot**: Versioned data imports with schema detection
- **Relationship**: Connections between data sources for consolidation
- **ConsolidatedModel**: Merged datasets based on relationships

### Database Layer
- Client-side code should **never** directly import from `lib/database/`
- Use Electron IPC calls for database operations:
  - `window.electron.getProjects()`
  - `window.electron.createProject(project)`
  - `window.electron.getDataSources(projectId)`

### Logging System
- Comprehensive logging via `LogContext` and `lib/utils/logger.ts`
- 8 categories: system, database, file-import, data-processing, user-action, api, electron, ui
- 5 levels: debug, info, warn, error, success
- Real-time filtering and export capabilities

## Development Guidelines

### Component Development
- Use glassmorphic design patterns from existing UI components
- Follow the established component structure in `components/ui/`
- Implement proper TypeScript typing
- Use React hooks for state management where appropriate

### Data Source Integration
- Extend `DataProviderType` union in `types/index.ts`
- Implement provider logic in `lib/services/`
- Add configuration options to `DataProviderConfig`
- Update upload quota tracking per user rules

### Styling Conventions
- Use Tailwind CSS with custom glassmorphic utilities
- Follow existing glass effect patterns (backdrop-blur, opacity layers)
- Ensure responsive design across screen sizes
- Maintain accessibility standards

### Electron Integration
- Use context isolation for security
- Implement IPC handlers in `public/electron.js`
- Expose safe APIs via `public/preload.js`
- Handle cross-platform considerations

## Key Features in Development

### Implemented
- Project workspace management
- File upload system (CSV/JSON)
- Real-time logging with filtering
- Glassmorphic UI design system
- Basic data source management

### In Progress
- Snapshot system for data versioning
- Visual relationship mapping canvas
- SQL dump import functionality

### Planned
- Consolidated model generation
- Advanced data transformations
- API connector framework
- Export capabilities

## Important Notes

### Security Considerations
- Electron uses context isolation (nodeIntegration: false)
- Database operations are restricted to main process
- File operations use secure IPC communication

### Performance Considerations
- Logging system has configurable max entries (default 1000)
- Large file uploads use progress tracking
- Database operations are asynchronous

### Development Environment
- Requires Node.js 18+
- Uses `--legacy-peer-deps` for dependency installation
- Development server runs on port 3000 with Electron connecting to it

### Build Process
- Next.js builds to `out/` directory for Electron packaging
- Electron Builder creates platform-specific distributables
- GitHub Actions handles CI/CD for releases

## Troubleshooting

### Common Issues
- If Electron fails to connect, check Next.js is running on port 3000
- Database errors indicate server-side only access - use IPC calls
- Styling issues may require Tailwind CSS rebuild

### Debug Tools
- Electron DevTools available in development
- Console logging available through logger utility
- Real-time log viewer in application UI