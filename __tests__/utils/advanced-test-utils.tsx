import React from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { ThemeProvider } from 'styled-components'
import { DataSourceProvider } from '../../contexts/DataSourceContext'
import { SettingsProvider } from '../../contexts/SettingsContext'
import { LogProvider } from '../../contexts/LogContext'
import { NavigationProvider } from '../../contexts/NavigationContext'
import { PipelineProvider } from '../../contexts/PipelineContext'
import { JobProvider } from '../../contexts/JobContext'

// Mock theme for styled-components
const mockTheme = {
  colors: {
    primary: '#000000',
    secondary: '#ffffff',
    accent: '#007bff',
    error: '#dc3545',
    success: '#28a745',
    warning: '#ffc107',
    info: '#17a2b8',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1200px',
  },
  fonts: {
    mono: 'Monaco, Consolas, "Courier New", monospace',
    sans: 'system-ui, -apple-system, sans-serif',
  },
}

// Custom render function with all providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider theme={mockTheme}>
      <NavigationProvider>
        <DataSourceProvider>
          <SettingsProvider>
            <LogProvider>
              <PipelineProvider>
                <JobProvider>
                  {children}
                </JobProvider>
              </PipelineProvider>
            </LogProvider>
          </SettingsProvider>
        </DataSourceProvider>
      </NavigationProvider>
    </ThemeProvider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult => render(ui, { wrapper: AllTheProviders, ...options })

// Mock data generators
export const mockDataGenerators = {
  dataSource: (overrides: Partial<any> = {}) => ({
    id: 'test-ds-1',
    name: 'Test Data Source',
    type: 'csv',
    description: 'Test description',
    config: { delimiter: ',' },
    status: 'idle',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  project: (overrides: Partial<any> = {}) => ({
    id: 'test-project-1',
    name: 'Test Project',
    description: 'Test project description',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  job: (overrides: Partial<any> = {}) => ({
    id: 'test-job-1',
    name: 'Test Job',
    type: 'backup',
    status: 'active',
    schedule: '0 2 * * *',
    config: { backupType: 'core_config' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastRun: new Date().toISOString(),
    ...overrides,
  }),

  dataVersion: (overrides: Partial<any> = {}) => ({
    id: 'test-version-1',
    version: 1,
    recordCount: 100,
    schema: { id: 'number', name: 'string' },
    metadata: { source: 'csv' },
    createdAt: new Date().toISOString(),
    data: JSON.stringify([{ id: 1, name: 'Test' }]),
    ...overrides,
  }),

  execution: (overrides: Partial<any> = {}) => ({
    id: 'test-execution-1',
    jobId: 'test-job-1',
    status: 'completed',
    startTime: new Date(),
    endTime: new Date(Date.now() + 5000),
    duration: 5000,
    logs: ['Execution started', 'Processing data', 'Execution completed'],
    error: null,
    ...overrides,
  }),
}

// Test helpers
export const testHelpers = {
  // Wait for async operations
  waitForAsync: () => new Promise(resolve => setTimeout(resolve, 0)),

  // Mock fetch with different scenarios
  mockFetch: {
    success: (data: any) => jest.fn().mockResolvedValue({
      ok: true,
      json: async () => data,
      status: 200,
    }),

    error: (status: number = 500, message: string = 'Server Error') => jest.fn().mockResolvedValue({
      ok: false,
      status,
      statusText: message,
      json: async () => ({ error: message }),
    }),

    networkError: () => jest.fn().mockRejectedValue(new Error('Network Error')),

    timeout: (delay: number = 1000) => jest.fn().mockImplementation(() => 
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), delay))
    ),
  },

  // Mock localStorage
  mockLocalStorage: () => {
    const store: Record<string, string> = {}
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => { store[key] = value }),
      removeItem: jest.fn((key: string) => { delete store[key] }),
      clear: jest.fn(() => { Object.keys(store).forEach(key => delete store[key]) }),
    }
  },

  // Mock file operations
  mockFileSystem: () => ({
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
    unlinkSync: jest.fn(),
    statSync: jest.fn(),
    readdirSync: jest.fn(),
  }),

  // Create mock context values
  mockContexts: {
    dataSource: {
      dataSources: [],
      loading: false,
      error: null,
      addDataSource: jest.fn(),
      updateDataSource: jest.fn(),
      deleteDataSource: jest.fn(),
      refreshDataSources: jest.fn(),
    },

    settings: {
      settings: {},
      loading: false,
      error: null,
      updateSettings: jest.fn(),
      resetSettings: jest.fn(),
    },

    logs: {
      logs: [],
      loading: false,
      error: null,
      addLog: jest.fn(),
      clearLogs: jest.fn(),
      refreshLogs: jest.fn(),
    },
  },

  // Form testing utilities
  form: {
    fillInput: async (input: HTMLElement, value: string) => {
      const { fireEvent } = await import('@testing-library/react')
      fireEvent.change(input, { target: { value } })
    },

    submitForm: async (form: HTMLElement) => {
      const { fireEvent } = await import('@testing-library/react')
      fireEvent.submit(form)
    },

    selectOption: async (select: HTMLElement, value: string) => {
      const { fireEvent } = await import('@testing-library/react')
      fireEvent.change(select, { target: { value } })
    },
  },

  // Navigation testing utilities
  navigation: {
    mockRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    }),

    mockPathname: (pathname: string) => pathname,
    mockSearchParams: (params: Record<string, string>) => new URLSearchParams(params),
  },
}

// Performance testing utilities
export const performanceHelpers = {
  // Measure render time
  measureRender: async (renderFn: () => void): Promise<number> => {
    const start = performance.now()
    renderFn()
    await new Promise(resolve => setTimeout(resolve, 0))
    return performance.now() - start
  },

  // Memory usage testing
  measureMemory: () => {
    if ('memory' in performance) {
      return (performance as any).memory
    }
    return null
  },

  // Component render count
  renderCount: new Map<string, number>(),
  
  incrementRenderCount: (componentName: string) => {
    const count = performanceHelpers.renderCount.get(componentName) || 0
    performanceHelpers.renderCount.set(componentName, count + 1)
  },
}

// Accessibility testing utilities
export const a11yHelpers = {
  // Check for required ARIA attributes
  checkAriaAttributes: (element: HTMLElement) => {
    const issues: string[] = []
    
    if (element.getAttribute('role') === 'button' && !element.getAttribute('aria-label') && !element.textContent?.trim()) {
      issues.push('Button missing accessible name')
    }
    
    if (element.getAttribute('aria-expanded') && !element.getAttribute('aria-controls')) {
      issues.push('Element with aria-expanded missing aria-controls')
    }
    
    return issues
  },

  // Test keyboard navigation
  testKeyboardNavigation: async (elements: HTMLElement[]) => {
    const { fireEvent } = await import('@testing-library/react')
    const results = []
    
    for (let i = 0; i < elements.length; i++) {
      fireEvent.keyDown(elements[i], { key: 'Tab' })
      results.push({
        element: elements[i],
        tabIndex: i,
        focused: document.activeElement === elements[i]
      })
    }
    
    return results
  },

  // Check color contrast (simplified)
  checkColorContrast: (foreground: string, background: string) => {
    // Simplified contrast check - in real implementation, use proper contrast calculation
    return foreground !== background
  },
}

// Snapshot testing utilities
export const snapshotHelpers = {
  // Create consistent snapshots
  normalizeSnapshot: (snapshot: string) => {
    return snapshot
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, 'MOCK_DATE')
      .replace(/id="[^"]*"/g, 'id="MOCK_ID"')
      .replace(/data-testid="[^"]*"/g, 'data-testid="MOCK_TEST_ID"')
  },

  // Compare snapshots with tolerance
  compareWithTolerance: (actual: string, expected: string, tolerance: number = 0.1) => {
    const actualNormalized = snapshotHelpers.normalizeSnapshot(actual)
    const expectedNormalized = snapshotHelpers.normalizeSnapshot(expected)
    
    const similarity = actualNormalized === expectedNormalized ? 1 : 
      (actualNormalized.length - Math.abs(actualNormalized.length - expectedNormalized.length)) / actualNormalized.length
    
    return similarity >= (1 - tolerance)
  },
}

// Error boundary testing
export const errorBoundaryHelpers = {
  // Create error boundary wrapper
  createErrorBoundary: (onError?: (error: Error) => void) => {
    return class TestErrorBoundary extends React.Component<
      { children: React.ReactNode },
      { hasError: boolean }
    > {
      constructor(props: { children: React.ReactNode }) {
        super(props)
        this.state = { hasError: false }
      }

      static getDerivedStateFromError() {
        return { hasError: true }
      }

      componentDidCatch(error: Error) {
        onError?.(error)
      }

      render() {
        if (this.state.hasError) {
          return <div data-testid="error-boundary">Something went wrong</div>
        }
        return this.props.children
      }
    }
  },
}

// Re-export everything from testing library
export * from '@testing-library/react'
export { customRender as render }
export { mockDataGenerators, testHelpers, performanceHelpers, a11yHelpers, snapshotHelpers, errorBoundaryHelpers }
