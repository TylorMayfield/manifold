import { Config } from '@jest/types'

export default async function globalSetup(globalConfig: Config.GlobalConfig, projectConfig: Config.ProjectConfig) {
  console.log('🚀 Starting global test setup...')

  // Set up test environment variables
  process.env.NODE_ENV = 'test'
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api'
  process.env.DATABASE_URL = 'file:./test.db'
  process.env.JWT_SECRET = 'test-jwt-secret'

  // Mock Electron APIs for testing
  global.electron = {
    ipcRenderer: {
      invoke: jest.fn(),
      on: jest.fn(),
      removeAllListeners: jest.fn(),
    },
    ipcMain: {
      handle: jest.fn(),
      on: jest.fn(),
      removeAllListeners: jest.fn(),
    },
    app: {
      getPath: jest.fn((path: string) => {
        const paths: Record<string, string> = {
          userData: '/tmp/test-user-data',
          temp: '/tmp',
          home: '/tmp/home',
        }
        return paths[path] || '/tmp'
      }),
      getName: jest.fn(() => 'Manifold ETL'),
      getVersion: jest.fn(() => '1.0.0'),
      isPackaged: jest.fn(() => false),
    },
    dialog: {
      showOpenDialog: jest.fn(),
      showSaveDialog: jest.fn(),
      showErrorBox: jest.fn(),
      showMessageBox: jest.fn(),
    },
    shell: {
      openExternal: jest.fn(),
      openPath: jest.fn(),
      showItemInFolder: jest.fn(),
    },
    clipboard: {
      writeText: jest.fn(),
      readText: jest.fn(),
    },
    nativeImage: {
      createFromPath: jest.fn(),
      createFromDataURL: jest.fn(),
    },
  }

  // Mock file system operations
  const fs = require('fs')
  const originalExistsSync = fs.existsSync
  const originalMkdirSync = fs.mkdirSync
  const originalWriteFileSync = fs.writeFileSync
  const originalReadFileSync = fs.readFileSync
  const originalUnlinkSync = fs.unlinkSync

  // Create test directories
  const testDirs = [
    '/tmp/test-user-data',
    '/tmp/test-user-data/data_sources',
    '/tmp/test-user-data/backups',
    '/tmp/test-user-data/backups/core',
  ]

  testDirs.forEach(dir => {
    if (!originalExistsSync(dir)) {
      originalMkdirSync(dir, { recursive: true })
    }
  })

  // Mock console methods to reduce noise in tests
  const originalConsole = { ...console }
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }

  // Set up performance testing utilities
  global.performance = {
    ...performance,
    mark: jest.fn(),
    measure: jest.fn(),
    now: jest.fn(() => Date.now()),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  }

  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))

  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))

  // Mock MutationObserver
  global.MutationObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn(() => []),
  }))

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })

  // Mock getComputedStyle
  global.getComputedStyle = jest.fn(() => ({
    getPropertyValue: jest.fn(() => ''),
    setProperty: jest.fn(),
    removeProperty: jest.fn(),
  }))

  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
  }
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock,
    writable: true,
  })

  // Mock fetch with default implementation
  global.fetch = jest.fn()

  // Set up test database
  const { CoreDatabase } = require('../../lib/server/database/CoreDatabase')
  const coreDb = CoreDatabase.getInstance()
  
  try {
    await coreDb.initialize()
    console.log('✅ Test database initialized')
  } catch (error) {
    console.warn('⚠️ Test database initialization failed:', error)
  }

  // Set up test data
  await setupTestData()

  console.log('✅ Global test setup completed')
}

async function setupTestData() {
  try {
    // Create test projects
    const { SeparatedDatabaseManager } = require('../../lib/server/database/SeparatedDatabaseManager')
    const dbManager = SeparatedDatabaseManager.getInstance()
    
    await dbManager.initialize()

    // Create test project
    const testProject = await dbManager.createProject({
      name: 'Test Project',
      description: 'Project for testing purposes'
    })

    // Create test data sources
    await dbManager.createDataSource(testProject.id, {
      name: 'Test CSV Data Source',
      type: 'csv',
      config: { delimiter: ',' },
      syncInterval: 60
    })

    await dbManager.createDataSource(testProject.id, {
      name: 'Test JavaScript Data Source',
      type: 'javascript',
      config: {
        javascriptConfig: {
          script: 'return [{ id: 1, name: "Test" }];',
          outputFormat: 'array'
        }
      },
      syncInterval: 30
    })

    console.log('✅ Test data created')
  } catch (error) {
    console.warn('⚠️ Test data setup failed:', error)
  }
}

// Cleanup function for global teardown
export async function cleanup() {
  console.log('🧹 Starting global test cleanup...')

  // Clean up test database files
  const fs = require('fs')
  const path = require('path')
  
  const testFiles = [
    './test.db',
    './test.db-journal',
    './test.db-wal',
    './test.db-shm',
  ]

  testFiles.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file)
      }
    } catch (error) {
      console.warn(`Failed to clean up ${file}:`, error)
    }
  })

  // Clean up test directories
  try {
    const { execSync } = require('child_process')
    execSync('rm -rf /tmp/test-user-data', { stdio: 'ignore' })
  } catch (error) {
    console.warn('Failed to clean up test directories:', error)
  }

  console.log('✅ Global test cleanup completed')
}
