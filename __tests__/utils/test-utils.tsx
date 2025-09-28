import React, { ReactElement } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { LogProvider } from '../../contexts/LogContext'
import { DataSourceProvider } from '../../contexts/DataSourceContext'
import { SettingsProvider } from '../../contexts/SettingsContext'

// Custom render function that includes all the providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <SettingsProvider>
      <LogProvider>
        <DataSourceProvider>
          {children}
        </DataSourceProvider>
      </LogProvider>
    </SettingsProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult => render(ui, { wrapper: AllTheProviders, ...options })

// Mock data factories
export const createMockDataSource = (overrides = {}) => ({
  id: 'mock-ds-1',
  projectId: 'default',
  name: 'Mock Data Source',
  type: 'mock',
  config: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  status: 'idle',
  enabled: true,
  ...overrides
})

export const createMockSnapshot = (overrides = {}) => ({
  id: 'mock-snap-1',
  projectId: 'default',
  dataSourceId: 'mock-ds-1',
  version: 1,
  data: [{ id: 1, name: 'Test Row' }],
  recordCount: 1,
  createdAt: new Date(),
  ...overrides
})

export const createMockPipeline = (overrides = {}) => ({
  id: 'mock-pipe-1',
  name: 'Mock Pipeline',
  description: 'Test pipeline',
  steps: [],
  inputSourceIds: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

export const createMockJob = (overrides = {}) => ({
  id: 'mock-job-1',
  name: 'Mock Job',
  pipelineId: 'mock-pipe-1',
  schedule: '0 0 * * *',
  enabled: true,
  status: 'idle',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

// Async test helpers
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0))

// Mock API responses
export const mockApiSuccess = (data: any) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => data,
    text: async () => JSON.stringify(data)
  })
}

export const mockApiError = (message = 'API Error', status = 500) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status,
    statusText: message,
    text: async () => message
  })
}

// re-export everything
export * from '@testing-library/react'

// override render method
export { customRender as render }

// Basic test to satisfy Jest requirement
describe('test-utils', () => {
  it('exports render function', () => {
    expect(customRender).toBeDefined()
  })
})
