import { renderHook, act, waitFor } from '@testing-library/react'
import { useApi } from '../../../hooks/useApi'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('useApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useApi('/test-endpoint'))

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const { result } = renderHook(() => useApi('/test-endpoint'))

    act(() => {
      result.current.fetchData()
    })

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.data).toEqual(mockData)
      expect(result.current.error).toBeNull()
    })

    expect(mockFetch).toHaveBeenCalledWith('/test-endpoint', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })

  it('should handle fetch errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useApi('/test-endpoint'))

    act(() => {
      result.current.fetchData()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Network error')
      expect(result.current.data).toBeNull()
    })
  })

  it('should handle HTTP errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })

    const { result } = renderHook(() => useApi('/test-endpoint'))

    act(() => {
      result.current.fetchData()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('HTTP error! status: 404')
      expect(result.current.data).toBeNull()
    })
  })

  it('should support POST requests', async () => {
    const mockData = { id: 1, name: 'Test' }
    const requestData = { name: 'New Item' }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const { result } = renderHook(() => useApi('/test-endpoint'))

    await act(async () => {
      await result.current.postData(requestData)
    })

    expect(mockFetch).toHaveBeenCalledWith('/test-endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })

    expect(result.current.data).toEqual(mockData)
  })

  it('should support PUT requests', async () => {
    const mockData = { id: 1, name: 'Updated' }
    const requestData = { name: 'Updated Item' }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const { result } = renderHook(() => useApi('/test-endpoint'))

    await act(async () => {
      await result.current.putData(requestData)
    })

    expect(mockFetch).toHaveBeenCalledWith('/test-endpoint', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })

    expect(result.current.data).toEqual(mockData)
  })

  it('should support DELETE requests', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    const { result } = renderHook(() => useApi('/test-endpoint'))

    await act(async () => {
      await result.current.deleteData()
    })

    expect(mockFetch).toHaveBeenCalledWith('/test-endpoint', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })

  it('should handle custom headers', async () => {
    const customHeaders = {
      'Authorization': 'Bearer token',
      'X-Custom-Header': 'value',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    const { result } = renderHook(() => useApi('/test-endpoint', { headers: customHeaders }))

    await act(async () => {
      await result.current.fetchData()
    })

    expect(mockFetch).toHaveBeenCalledWith('/test-endpoint', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders,
      },
    })
  })

  it('should reset state', async () => {
    const mockData = { id: 1, name: 'Test' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const { result } = renderHook(() => useApi('/test-endpoint'))

    // Fetch data first
    await act(async () => {
      await result.current.fetchData()
    })

    expect(result.current.data).toEqual(mockData)

    // Reset state
    act(() => {
      result.current.reset()
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('should handle multiple concurrent requests', async () => {
    const mockData1 = { id: 1, name: 'Test 1' }
    const mockData2 = { id: 2, name: 'Test 2' }

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData1,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData2,
      })

    const { result } = renderHook(() => useApi('/test-endpoint'))

    // Start first request
    act(() => {
      result.current.fetchData()
    })

    // Start second request before first completes
    act(() => {
      result.current.fetchData()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should have the data from the last request
    expect(result.current.data).toEqual(mockData2)
  })

  it('should handle request cancellation', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise(resolve => {
      resolvePromise = resolve
    })

    mockFetch.mockReturnValueOnce(promise)

    const { result, unmount } = renderHook(() => useApi('/test-endpoint'))

    act(() => {
      result.current.fetchData()
    })

    expect(result.current.loading).toBe(true)

    // Unmount component (simulating cancellation)
    unmount()

    // Resolve the promise after unmount
    resolvePromise!({
      ok: true,
      json: async () => ({ id: 1 }),
    })

    // Should not throw errors after unmount
    await expect(promise).resolves.toBeDefined()
  })
})
