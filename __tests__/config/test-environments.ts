import { Config } from '@jest/types'

// Test environment configurations
export const testEnvironments = {
  // Unit test configuration
  unit: {
    displayName: 'Unit Tests',
    testMatch: ['<rootDir>/__tests__/components/**/*.test.{ts,tsx}', '<rootDir>/__tests__/hooks/**/*.test.{ts,tsx}'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    collectCoverageFrom: [
      'components/**/*.{js,jsx,ts,tsx}',
      'hooks/**/*.{js,jsx,ts,tsx}',
      '!**/*.d.ts',
      '!**/node_modules/**',
    ],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },

  // Integration test configuration
  integration: {
    displayName: 'Integration Tests',
    testMatch: ['<rootDir>/__tests__/integration/**/*.test.{ts,tsx}', '<rootDir>/__tests__/api/**/*.test.{ts,tsx}'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testTimeout: 30000, // Longer timeout for integration tests
    collectCoverageFrom: [
      'lib/**/*.{js,jsx,ts,tsx}',
      'app/api/**/*.{js,jsx,ts,tsx}',
      '!**/*.d.ts',
      '!**/node_modules/**',
    ],
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  },

  // Performance test configuration
  performance: {
    displayName: 'Performance Tests',
    testMatch: ['<rootDir>/__tests__/performance/**/*.test.{ts,tsx}'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testTimeout: 60000, // Longer timeout for performance tests
    collectCoverage: false, // Skip coverage for performance tests
    maxWorkers: 1, // Run performance tests sequentially
  },

  // Accessibility test configuration
  accessibility: {
    displayName: 'Accessibility Tests',
    testMatch: ['<rootDir>/__tests__/accessibility/**/*.test.{ts,tsx}'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    collectCoverageFrom: [
      'components/**/*.{js,jsx,ts,tsx}',
      '!**/*.d.ts',
      '!**/node_modules/**',
    ],
    coverageThreshold: {
      global: {
        branches: 85,
        functions: 85,
        lines: 85,
        statements: 85,
      },
    },
  },

  // E2E workflow test configuration
  e2e: {
    displayName: 'End-to-End Tests',
    testMatch: ['<rootDir>/__tests__/workflows/**/*.test.{ts,tsx}'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testTimeout: 45000, // Longer timeout for E2E tests
    collectCoverage: false, // Skip coverage for E2E tests
    maxWorkers: 2, // Limit workers for E2E tests
  },

  // Database test configuration
  database: {
    displayName: 'Database Tests',
    testMatch: ['<rootDir>/__tests__/lib/database/**/*.test.{ts,tsx}'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testTimeout: 20000,
    collectCoverageFrom: [
      'lib/server/database/**/*.{js,jsx,ts,tsx}',
      '!**/*.d.ts',
      '!**/node_modules/**',
    ],
    coverageThreshold: {
      global: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },

  // Service test configuration
  services: {
    displayName: 'Service Tests',
    testMatch: ['<rootDir>/__tests__/services/**/*.test.{ts,tsx}'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    collectCoverageFrom: [
      'lib/services/**/*.{js,jsx,ts,tsx}',
      '!**/*.d.ts',
      '!**/node_modules/**',
    ],
    coverageThreshold: {
      global: {
        branches: 85,
        functions: 85,
        lines: 85,
        statements: 85,
      },
    },
  },
}

// Combined configuration for all tests
export const fullTestConfig: Config.InitialOptions = {
  projects: Object.values(testEnvironments),
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageDirectory: 'coverage',
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage/html-report',
      filename: 'report.html',
      expand: true,
    }],
    ['jest-junit', {
      outputDirectory: './coverage',
      outputName: 'junit.xml',
    }],
  ],
  globalSetup: '<rootDir>/__tests__/config/global-setup.ts',
  globalTeardown: '<rootDir>/__tests__/config/global-teardown.ts',
}

// CI-specific configuration
export const ciTestConfig: Config.InitialOptions = {
  ...fullTestConfig,
  ci: true,
  watchman: false,
  maxWorkers: 2,
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './coverage',
      outputName: 'junit.xml',
    }],
  ],
}

// Development configuration
export const devTestConfig: Config.InitialOptions = {
  ...fullTestConfig,
  watchman: true,
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/coverage/',
  ],
  collectCoverage: false,
}

// Production build validation configuration
export const productionTestConfig: Config.InitialOptions = {
  ...fullTestConfig,
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  maxWorkers: 4,
}

export default fullTestConfig
