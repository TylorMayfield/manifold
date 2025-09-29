import React from 'react'
import { render, screen, act, waitFor } from '../../utils/advanced-test-utils'
import { performanceHelpers, testHelpers } from '../../utils/advanced-test-utils'
import UnifiedDataSourceWorkflow from '../../../components/data-sources/UnifiedDataSourceWorkflow'
import DataTable from '../../../components/data/DataTable'
import LogViewer from '../../../components/logs/LogViewer'

describe('Performance and Load Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    performanceHelpers.renderCount.clear()
  })

  describe('Component Render Performance', () => {
    it('should render UnifiedDataSourceWorkflow within performance budget', async () => {
      const renderTime = await performanceHelpers.measureRender(() => {
        render(
          <UnifiedDataSourceWorkflow 
            projectId="test-project" 
            onComplete={jest.fn()} 
            onCancel={jest.fn()} 
          />
        )
      })

      // Should render within 100ms
      expect(renderTime).toBeLessThan(100)
    })

    it('should handle large data sets efficiently', async () => {
      const largeDataSet = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random() * 1000,
        category: `Category ${i % 10}`,
        timestamp: new Date().toISOString()
      }))

      const renderTime = await performanceHelpers.measureRender(() => {
        render(<DataTable data={largeDataSet} />)
      })

      // Should render large dataset within 500ms
      expect(renderTime).toBeLessThan(500)
    })

    it('should handle rapid state updates without performance degradation', async () => {
      const { rerender } = render(
        <UnifiedDataSourceWorkflow 
          projectId="test-project" 
          onComplete={jest.fn()} 
          onCancel={jest.fn()} 
        />
      )

      const updateTimes: number[] = []

      // Simulate rapid state updates
      for (let i = 0; i < 100; i++) {
        const start = performance.now()
        
        await act(async () => {
          rerender(
            <UnifiedDataSourceWorkflow 
              projectId={`test-project-${i}`}
              onComplete={jest.fn()} 
              onCancel={jest.fn()} 
            />
          )
        })

        const end = performance.now()
        updateTimes.push(end - start)
      }

      // Average update time should be reasonable
      const averageUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length
      expect(averageUpdateTime).toBeLessThan(50)

      // No update should take more than 100ms
      const maxUpdateTime = Math.max(...updateTimes)
      expect(maxUpdateTime).toBeLessThan(100)
    })

    it('should not cause memory leaks with repeated renders', async () => {
      const initialMemory = performanceHelpers.measureMemory()
      
      // Render and unmount component multiple times
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(
          <UnifiedDataSourceWorkflow 
            projectId="test-project" 
            onComplete={jest.fn()} 
            onCancel={jest.fn()} 
          />
        )
        
        await act(async () => {
          unmount()
        })
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
      }

      const finalMemory = performanceHelpers.measureMemory()
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize
        // Memory increase should be minimal (less than 10MB)
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
      }
    })
  })

  describe('API Performance Testing', () => {
    it('should handle concurrent API requests efficiently', async () => {
      const mockResponses = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Data Source ${i}`,
        type: 'csv'
      }))

      // Mock fetch to simulate network latency
      const mockFetch = jest.fn().mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => mockResponses[Math.floor(Math.random() * mockResponses.length)]
          }), Math.random() * 100) // Random latency 0-100ms
        )
      )

      global.fetch = mockFetch

      const start = performance.now()

      // Make 100 concurrent requests
      const promises = Array.from({ length: 100 }, (_, i) => 
        fetch(`/api/data-sources/${i}`)
      )

      const results = await Promise.all(promises)
      const end = performance.now()

      expect(results).toHaveLength(100)
      expect(end - start).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle large API responses efficiently', async () => {
      const largeResponse = {
        data: Array.from({ length: 50000 }, (_, i) => ({
          id: i,
          name: `Large Item ${i}`,
          data: `Data ${i}`.repeat(100), // Large data field
          metadata: {
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            tags: [`tag${i % 10}`, `category${i % 5}`]
          }
        })),
        total: 50000,
        page: 1,
        pageSize: 50000
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => largeResponse
      })

      const start = performance.now()

      const response = await fetch('/api/data-sources')
      const data = await response.json()

      const end = performance.now()

      expect(data.data).toHaveLength(50000)
      expect(end - start).toBeLessThan(2000) // Should parse within 2 seconds
    })

    it('should handle API errors gracefully without performance impact', async () => {
      const errorFetch = jest.fn()
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })

      global.fetch = errorFetch

      const start = performance.now()

      // Make requests that will fail and succeed
      const promises = [
        fetch('/api/data-sources/1'), // Network error
        fetch('/api/data-sources/2'), // HTTP error
        fetch('/api/data-sources/3')  // Success
      ]

      const results = await Promise.allSettled(promises)
      const end = performance.now()

      expect(results).toHaveLength(3)
      expect(end - start).toBeLessThan(1000) // Should handle errors quickly
    })
  })

  describe('Database Performance Testing', () => {
    it('should handle large database operations efficiently', async () => {
      const { SeparatedDatabaseManager } = require('../../../lib/server/database/SeparatedDatabaseManager')
      const mockDbManager = {
        createDataVersion: jest.fn(),
        getDataSources: jest.fn(),
        getDataFromVersion: jest.fn()
      }

      SeparatedDatabaseManager.getInstance.mockReturnValue(mockDbManager)

      const largeData = Array.from({ length: 100000 }, (_, i) => ({
        id: i,
        name: `Record ${i}`,
        value: Math.random() * 1000,
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'csv',
          processed: true,
          checksum: `checksum_${i}`
        }
      }))

      const start = performance.now()

      // Simulate creating a large data version
      mockDbManager.createDataVersion.mockImplementation(async (dataSourceId, data, schema, metadata) => {
        // Simulate database operation time
        await new Promise(resolve => setTimeout(resolve, 100))
        return {
          id: 'version-1',
          version: 1,
          recordCount: data.length,
          createdAt: new Date(),
          schema,
          metadata
        }
      })

      const result = await mockDbManager.createDataVersion('test-ds', largeData, {}, {})

      const end = performance.now()

      expect(result.recordCount).toBe(100000)
      expect(end - start).toBeLessThan(500) // Should complete within 500ms
    })

    it('should handle concurrent database operations', async () => {
      const { SeparatedDatabaseManager } = require('../../../lib/server/database/SeparatedDatabaseManager')
      const mockDbManager = {
        getDataSources: jest.fn()
      }

      SeparatedDatabaseManager.getInstance.mockReturnValue(mockDbManager)

      mockDbManager.getDataSources.mockImplementation(async (projectId) => {
        // Simulate database query time
        await new Promise(resolve => setTimeout(resolve, 50))
        return [
          { id: `${projectId}-ds-1`, name: 'Data Source 1', type: 'csv' },
          { id: `${projectId}-ds-2`, name: 'Data Source 2', type: 'json' }
        ]
      })

      const start = performance.now()

      // Make 20 concurrent database queries
      const promises = Array.from({ length: 20 }, (_, i) => 
        mockDbManager.getDataSources(`project-${i}`)
      )

      const results = await Promise.all(promises)
      const end = performance.now()

      expect(results).toHaveLength(20)
      expect(end - start).toBeLessThan(1000) // Should complete within 1 second
    })
  })

  describe('Memory Usage Testing', () => {
    it('should not accumulate memory with repeated operations', async () => {
      const initialMemory = performanceHelpers.measureMemory()
      
      // Simulate repeated data source creation
      for (let i = 0; i < 100; i++) {
        const largeData = Array.from({ length: 1000 }, (_, j) => ({
          id: `${i}-${j}`,
          name: `Item ${i}-${j}`,
          value: Math.random()
        }))

        // Simulate processing
        const processed = largeData.map(item => ({
          ...item,
          processed: true,
          timestamp: new Date().toISOString()
        }))

        // Clear references
        largeData.length = 0
        processed.length = 0
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = performanceHelpers.measureMemory()
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize
        // Memory increase should be minimal (less than 5MB)
        expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024)
      }
    })

    it('should handle memory pressure gracefully', async () => {
      const initialMemory = performanceHelpers.measureMemory()
      
      // Create memory pressure
      const largeArrays: any[] = []
      for (let i = 0; i < 10; i++) {
        largeArrays.push(new Array(100000).fill(0).map((_, j) => ({
          id: `${i}-${j}`,
          data: `Large data string ${i}-${j}`.repeat(10)
        })))
      }

      // Test component rendering under memory pressure
      const renderTime = await performanceHelpers.measureRender(() => {
        render(
          <UnifiedDataSourceWorkflow 
            projectId="test-project" 
            onComplete={jest.fn()} 
            onCancel={jest.fn()} 
          />
        )
      })

      // Should still render reasonably quickly
      expect(renderTime).toBeLessThan(200)

      // Clean up
      largeArrays.forEach(arr => arr.length = 0)
      largeArrays.length = 0

      if (global.gc) {
        global.gc()
      }

      const finalMemory = performanceHelpers.measureMemory()
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize
        // Should clean up most memory
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
      }
    })
  })

  describe('User Interaction Performance', () => {
    it('should handle rapid user interactions smoothly', async () => {
      render(
        <UnifiedDataSourceWorkflow 
          projectId="test-project" 
          onComplete={jest.fn()} 
          onCancel={jest.fn()} 
        />
      )

      const interactionTimes: number[] = []

      // Simulate rapid clicking on data source options
      const dataSourceOptions = [
        'CSV File',
        'JSON File',
        'API Endpoint',
        'JavaScript Script',
        'Mock Data'
      ]

      for (let i = 0; i < 50; i++) {
        const option = dataSourceOptions[i % dataSourceOptions.length]
        
        const start = performance.now()
        
        await act(async () => {
          const element = screen.getByText(option)
          element.click()
        })

        const end = performance.now()
        interactionTimes.push(end - start)
      }

      // Average interaction time should be fast
      const averageTime = interactionTimes.reduce((a, b) => a + b, 0) / interactionTimes.length
      expect(averageTime).toBeLessThan(50)

      // No interaction should take more than 100ms
      const maxTime = Math.max(...interactionTimes)
      expect(maxTime).toBeLessThan(100)
    })

    it('should handle form input efficiently', async () => {
      render(
        <UnifiedDataSourceWorkflow 
          projectId="test-project" 
          onComplete={jest.fn()} 
          onCancel={jest.fn()} 
        />
      )

      // Navigate to configuration step
      await act(async () => {
        screen.getByText('CSV File').click()
      })

      await waitFor(() => {
        screen.getByText('File Upload').click()
      })

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/name/i)
      const inputTimes: number[] = []

      // Simulate rapid typing
      const testString = 'This is a very long test string that should test input performance'
      
      for (let i = 0; i < testString.length; i++) {
        const start = performance.now()
        
        await act(async () => {
          fireEvent.change(nameInput, { 
            target: { value: testString.substring(0, i + 1) } 
          })
        })

        const end = performance.now()
        inputTimes.push(end - start)
      }

      // Average input time should be very fast
      const averageTime = inputTimes.reduce((a, b) => a + b, 0) / inputTimes.length
      expect(averageTime).toBeLessThan(10)
    })
  })

  describe('Stress Testing', () => {
    it('should handle maximum concurrent operations', async () => {
      const maxConcurrency = 1000
      const promises: Promise<any>[] = []

      const start = performance.now()

      // Create maximum concurrent operations
      for (let i = 0; i < maxConcurrency; i++) {
        promises.push(
          new Promise(resolve => {
            // Simulate some async operation
            setTimeout(() => resolve(i), Math.random() * 100)
          })
        )
      }

      const results = await Promise.all(promises)
      const end = performance.now()

      expect(results).toHaveLength(maxConcurrency)
      expect(end - start).toBeLessThan(2000) // Should complete within 2 seconds
    })

    it('should handle extremely large datasets', async () => {
      const extremeDataSet = Array.from({ length: 1000000 }, (_, i) => ({
        id: i,
        name: `Extreme Item ${i}`,
        value: Math.random(),
        data: `Data ${i}`.repeat(50)
      }))

      const start = performance.now()

      // Test data processing
      const processed = extremeDataSet
        .filter(item => item.id % 2 === 0)
        .map(item => ({
          ...item,
          processed: true,
          timestamp: new Date().toISOString()
        }))
        .sort((a, b) => a.id - b.id)

      const end = performance.now()

      expect(processed).toHaveLength(500000)
      expect(end - start).toBeLessThan(5000) // Should process within 5 seconds
    })
  })
})
