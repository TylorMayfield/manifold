# Manifold - Data Integration Platform

A powerful, context-agnostic desktop application for data integration and consolidation built with Next.js and Electron. Features a stunning glassmorphic design and comprehensive logging system.

## ✨ What's New

- **🎨 Glassmorphic Design**: Beautiful frosted glass effects with animated gradients
- **📊 Real-time Log Viewer**: Comprehensive logging system with filtering and export
- **🔄 Live File Upload**: Drag-and-drop interface with progress tracking
- **🎯 Project Workspaces**: Dedicated spaces for each data integration project
- **🖥️ Native Desktop**: Full Electron integration with native file dialogs

## 🚀 Features

### ✅ Implemented

- **Project Management**: Create and manage data integration projects with dedicated workspaces
- **Glassmorphic UI**: Modern, beautiful interface with frosted glass effects and animated gradients
- **File Upload System**: Drag-and-drop interface for CSV and JSON files with progress tracking
- **Comprehensive Logging**: Real-time log viewer with filtering, search, and export capabilities
- **Electron Integration**: Desktop application wrapper with native file dialogs and menus
- **TypeScript**: Full type safety throughout the application
- **Component Library**: Reusable UI components with glassmorphic styling
- **Database Architecture**: SQLite-based data storage with better-sqlite3
- **Project Workspace**: Dedicated workspace for each project with data source management
- **Responsive Design**: Works seamlessly across different screen sizes
- **Accessibility**: Built with accessibility best practices in mind

### 🚧 In Progress

- **Data Source Management**: Import and manage various data sources
- **Snapshot System**: Version control for data sources with diffing capabilities
- **Visual Canvas**: Drag-and-drop relationship mapping between data sources

### 📋 Planned Features

- **SQL Dump Import**: Support for MySQL and PostgreSQL dumps
- **Custom Scripts**: JavaScript-based data connectors with integrated editor
- **API Integration**: Direct REST API connections with authentication
- **Consolidated Models**: Unified data model generation and management
- **SQL Query Interface**: Built-in SQL editor and executor
- **Export Functionality**: CSV, JSON, and SQLite export options
- **Cloud Sync**: Project synchronization and team collaboration
- **AI-Powered Mapping**: Automatic relationship detection between datasets

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Desktop**: Electron 28
- **Styling**: Tailwind CSS 4 with custom glassmorphic components
- **Database**: better-sqlite3
- **File Processing**: PapaParse (CSV), native JSON parsing
- **Icons**: Lucide React
- **Build**: Turbopack
- **Logging**: Custom logging system with React Context

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd manifold
```

2. Install dependencies:

```bash
npm install --legacy-peer-deps
```

3. Start the development server:

```bash
npm run dev:next
```

4. In a separate terminal, start Electron:

```bash
npm run dev:electron
```

### Build for Production

```bash
# Build Next.js app
npm run build

# Build Electron app
npm run build:electron

# Create distributable packages
npm run dist
```

## 🚀 CI/CD and Releases

This project includes comprehensive GitHub Actions workflows for automated building and releasing:

### Workflows

1. **Build and Release** (`.github/workflows/build-and-release.yml`):

   - Triggers on version tags (e.g., `v1.0.0`)
   - Builds for all platforms: macOS (Intel + Apple Silicon), Windows, Linux
   - Creates GitHub releases with platform-specific binaries
   - Generates release notes automatically

2. **Build and Test** (`.github/workflows/build-test.yml`):

   - Runs on pull requests and pushes to main/develop
   - Type checking and linting
   - Build verification
   - Uploads build artifacts

3. **Nightly Builds** (`.github/workflows/nightly-build.yml`):
   - Runs daily at 2 AM UTC
   - Creates test builds for development
   - Can be triggered manually

### Creating Releases

To create a new release:

1. **Automated release script** (recommended):

   ```bash
   npm run release 1.0.0
   ```

   This will:

   - Update `package.json` version
   - Create a git commit and tag
   - Push to remote repository
   - Trigger GitHub Actions build

2. **Manual tag-based release**:

   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. **Manual workflow trigger**:
   - Go to Actions → Build and Release
   - Click "Run workflow"
   - Enter version (e.g., `v1.0.0`)

### Release Assets

Each release includes:

- **macOS**: `.dmg` files for Intel and Apple Silicon
- **Windows**: `.exe` installer
- **Linux**: `.AppImage` for universal compatibility

### Build Scripts

```bash
# Development
npm run dev              # Start Next.js + Electron in development
npm run dev:next         # Start Next.js dev server only
npm run dev:electron     # Start Electron only (after Next.js)

# Production
npm run build            # Build Next.js app
npm run build:electron   # Build Next.js + create Electron binaries
npm run dist             # Build and create distributable packages
npm run dist:mac         # Build macOS binaries only
npm run dist:win         # Build Windows binaries only
npm run dist:linux       # Build Linux binaries only
npm run start            # Start production Next.js server

# Utilities
npm run type-check       # Run TypeScript type checking
npm run clean            # Clean build artifacts
npm run clean:install    # Clean and reinstall dependencies
npm run release <version> # Create a new release (e.g., npm run release 1.0.0)
```

## 📁 Project Structure

```
manifold/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page with glassmorphic design
│   ├── project/[id]/      # Project workspace pages
│   ├── globals.css        # Global styles with glassmorphic classes
│   └── layout.tsx         # Root layout with LogProvider
├── components/            # React components
│   ├── ui/               # Reusable UI components (glassmorphic)
│   ├── projects/         # Project-related components
│   ├── data-sources/     # Data source components
│   └── logs/             # Log viewer components
├── lib/                  # Core application logic
│   ├── database/         # Database management
│   ├── data-sources/     # Data source handlers
│   └── utils/            # Utility functions (including logger)
├── contexts/             # React contexts
│   └── LogContext.tsx    # Logging context provider
├── types/                # TypeScript type definitions
│   ├── index.ts          # Core types
│   └── logs.ts           # Logging types
├── public/               # Static assets and Electron files
│   ├── electron.js       # Electron main process
│   └── preload.js        # Electron preload script
└── package.json          # Dependencies and scripts
```

## 🎯 Current Development Status

The application now features a complete foundational architecture with:

1. **🎨 Glassmorphic Design System**:

   - Animated gradient backgrounds
   - Frosted glass components with backdrop blur
   - Smooth transitions and hover effects
   - Responsive design across all screen sizes

2. **📊 Comprehensive Logging**:

   - Real-time log viewer with filtering
   - Multiple log levels (debug, info, warn, error, success)
   - Category-based logging (system, database, file-import, etc.)
   - Export functionality for log analysis
   - Minimizable interface to save screen space

3. **📁 Project Management**:

   - Create and manage data integration projects
   - Dedicated project workspaces
   - Visual project cards with animations
   - Navigation between projects

4. **📤 File Upload System**:

   - Drag-and-drop interface with glassmorphic styling
   - Progress tracking with visual indicators
   - Support for CSV and JSON files
   - Error handling and validation

5. **🖥️ Desktop Integration**:
   - Native Electron wrapper with context isolation
   - Custom application menus
   - Native file dialogs
   - Cross-platform compatibility (Mac, Windows, Linux)

## 🔄 Next Steps

1. **Complete Data Source Ingestion**: Implement actual file processing and storage
2. **Database Integration**: Connect the UI to the SQLite database layer
3. **Snapshot System**: Build version control for data changes
4. **Visual Canvas**: Create the relationship mapping interface
5. **Query Interface**: Add SQL editor and execution capabilities
6. **Export Functionality**: Implement data export in various formats

## 🎨 Design System

### Glassmorphic Components

- **Glass Cards**: Translucent containers with backdrop blur
- **Glass Buttons**: Interactive elements with hover effects
- **Glass Inputs**: Form elements with focus states
- **Glass Modals**: Overlay dialogs with blur effects

### Color Palette

- **Background**: Animated gradients with multiple color stops
- **Text**: High contrast white text with opacity variations
- **Accents**: Blue and purple gradients for primary actions
- **Status**: Color-coded log levels and status indicators

## 📊 Logging System

### Features

- **Real-time Updates**: Live log streaming as events occur
- **Advanced Filtering**: Filter by level, category, search text, and date range
- **Visual Indicators**: Color-coded levels and categories
- **Export Capability**: Export logs to JSON for external analysis
- **Auto-scroll**: Automatically follow new logs with manual override

### Log Categories

- **System**: Application initialization and core operations
- **Database**: SQLite operations and data persistence
- **File Import**: CSV/JSON file processing and uploads
- **Data Processing**: Data transformation and analysis
- **User Action**: User interactions and navigation
- **API**: External API calls and responses
- **Electron**: Desktop application specific events
- **UI**: User interface events and interactions

## 📝 Development Notes

- **Security**: Electron's context isolation prevents security vulnerabilities
- **Performance**: Efficient logging system with configurable max entries
- **Scalability**: Modular architecture designed for easy feature additions
- **Accessibility**: WCAG-compliant design with proper contrast ratios
- **Type Safety**: Full TypeScript coverage with strict type checking

## 🤝 Contributing

This is a private project, but the codebase is structured to be easily extensible. Key areas for contribution include:

- Additional data source connectors
- Enhanced UI components with glassmorphic styling
- Database optimization and query performance
- Testing infrastructure and automated testing
- Documentation and code examples

## 📄 License

Private project - All rights reserved.

---

**Manifold** - Transforming data integration with beautiful, modern interfaces and powerful logging capabilities. 🚀
