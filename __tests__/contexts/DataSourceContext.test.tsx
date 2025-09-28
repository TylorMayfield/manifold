import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { DataSourceProvider, useDataSources } from '../../../contexts/DataSourceContext'
import { DataProvider } from '../../../types'

// Mock the API calls
const mockFetch = jest.fn()
global.fetch = mockFetch

// Test component to access context
const TestComponent = () => {
  const { dataSources, loading, error, addDataSource, updateDataSource, deleteDataSource, refreshDataSources } = useDataSources()

  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="error">{error || 'No Error'}</div>
      <div data-testid="data-sources-count">{dataSources.length}</div>
      <button onClick={() => addDataSource({ name: 'Test', type: 'csv' } as DataProvider)}>
        Add Data Source
      </button>
      <button onClick={() => updateDataSource('1', { name: 'Updated' })}>
        Update Data Source
      </button>
      <button onClick={() => deleteDataSource('1')}>
        Delete Data Source
      </button>
      <button onClick={refreshDataSources}>
        Refresh
      </button>
    </div>
  )
}

describe('DataSourceContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    })
  })

  it('should provide initial state', () => {
    render(
      <DataSourceProvider>
        <TestComponent />
      </DataSourceProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
    expect(screen.getByTestId('error')).toHaveTextContent('No Error')
    expect(screen.getByTestId('data-sources-count')).toHaveTextContent('0')
  })

  it('should load data sources on mount', async () => {
    const mockDataSources = [
      { id: '1', name: 'Test CSV', type: 'csv' },
      { id: '2', name: 'Test JSON', type: 'json' }
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDataSources,
    })

    render(
      <DataSourceProvider>
        <TestComponent />
      </DataSourceProvider>
    )

    await act(async () => {
      // Wait for the fetch to complete
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/data-sources')
    expect(screen.getByTestId('data-sources-count')).toHaveTextContent('2')
    expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
  })

  it('should handle loading errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(
      <DataSourceProvider>
        <TestComponent />
      </DataSourceProvider>
    )

    await act(async () => {
      // Wait for the fetch to complete
    })

    expect(screen.getByTestId('error')).toHaveTextContent('Network error')
    expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
  })

  it('should add a new data source', async () => {
    const newDataSource = { name: 'Test', type: 'csv' }
    const createdDataSource = { id: '3', ...newDataSource }

    // Mock successful creation
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // Initial load
      .mockResolvedValueOnce({ ok: true, json: async () => createdDataSource }) // Create

    render(
      <DataSourceProvider>
        <TestComponent />
      </DataSourceProvider>
    )

    await act(async () => {
      // Wait for initial load
    })

    await act(async () => {
      screen.getByText('Add Data Source').click()
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/data-sources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newDataSource),
    })

    expect(screen.getByTestId('data-sources-count')).toHaveTextContent('1')
  })

  it('should update an existing data source', async () => {
    const existingDataSource = { id: '1', name: 'Test CSV', type: 'csv' }
    const updatedDataSource = { ...existingDataSource, name: 'Updated' }

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [existingDataSource] }) // Initial load
      .mockResolvedValueOnce({ ok: true, json: async () => updatedDataSource }) // Update

    render(
      <DataSourceProvider>
        <TestComponent />
      </DataSourceProvider>
    )

    await act(async () => {
      // Wait for initial load
    })

    await act(async () => {
      screen.getByText('Update Data Source').click()
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/data-sources/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Updated' }),
    })
  })

  it('should delete a data source', async () => {
    const existingDataSource = { id: '1', name: 'Test CSV', type: 'csv' }

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [existingDataSource] }) // Initial load
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) }) // Delete

    render(
      <DataSourceProvider>
        <TestComponent />
      </DataSourceProvider>
    )

    await act(async () => {
      // Wait for initial load
    })

    await act(async () => {
      screen.getByText('Delete Data Source').click()
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/data-sources/1', {
      method: 'DELETE',
    })

    expect(screen.getByTestId('data-sources-count')).toHaveTextContent('0')
  })

  it('should refresh data sources', async () => {
    const initialDataSources = [{ id: '1', name: 'Test CSV', type: 'csv' }]
    const refreshedDataSources = [
      { id: '1', name: 'Test CSV', type: 'csv' },
      { id: '2', name: 'Test JSON', type: 'json' }
    ]

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => initialDataSources }) // Initial load
      .mockResolvedValueOnce({ ok: true, json: async () => refreshedDataSources }) // Refresh

    render(
      <DataSourceProvider>
        <TestComponent />
      </DataSourceProvider>
    )

    await act(async () => {
      // Wait for initial load
    })

    expect(screen.getByTestId('data-sources-count')).toHaveTextContent('1')

    await act(async () => {
      screen.getByText('Refresh').click()
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/data-sources')
    expect(screen.getByTestId('data-sources-count')).toHaveTextContent('2')
  })

  it('should handle API errors gracefully', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // Initial load
      .mockRejectedValueOnce(new Error('API Error')) // Add data source

    render(
      <DataSourceProvider>
        <TestComponent />
      </DataSourceProvider>
    )

    await act(async () => {
      // Wait for initial load
    })

    await act(async () => {
      screen.getByText('Add Data Source').click()
    })

    expect(screen.getByTestId('error')).toHaveTextContent('API Error')
  })

  it('should persist data sources to localStorage', async () => {
    const mockDataSources = [
      { id: '1', name: 'Test CSV', type: 'csv' },
      { id: '2', name: 'Test JSON', type: 'json' }
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDataSources,
    })

    const localStorageMock = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    })

    render(
      <DataSourceProvider>
        <TestComponent />
      </DataSourceProvider>
    )

    await act(async () => {
      // Wait for data to load
    })

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'dataSources',
      JSON.stringify(mockDataSources)
    )
  })

  it('should load data sources from localStorage on mount', () => {
    const cachedDataSources = [{ id: '1', name: 'Cached CSV', type: 'csv' }]
    
    const localStorageMock = {
      getItem: jest.fn().mockReturnValue(JSON.stringify(cachedDataSources)),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    })

    render(
      <DataSourceProvider>
        <TestComponent />
      </DataSourceProvider>
    )

    expect(screen.getByTestId('data-sources-count')).toHaveTextContent('1')
    expect(localStorageMock.getItem).toHaveBeenCalledWith('dataSources')
  })

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useDataSources must be used within a DataSourceProvider')

    consoleSpy.mockRestore()
  })
})
