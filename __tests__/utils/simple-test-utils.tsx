import React, { ReactElement } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'

// Minimal wrapper without context providers for isolated component testing
const MinimalWrapper = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const simpleRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult => render(ui, { wrapper: MinimalWrapper, ...options })

// Mock data factories (same as main test-utils)
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

// Re-export everything from testing library
export * from '@testing-library/react'

// Override render method
export { simpleRender as render }

// Test to satisfy Jest
describe('simple-test-utils', () => {
  it('exports render function', () => {
    expect(simpleRender).toBeDefined()
  })
})
