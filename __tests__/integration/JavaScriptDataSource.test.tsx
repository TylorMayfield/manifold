import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '../../utils/advanced-test-utils'
import { mockDataGenerators, testHelpers } from '../../utils/advanced-test-utils'
import UnifiedDataSourceWorkflow from '../../../components/data-sources/UnifiedDataSourceWorkflow'
import { JavaScriptDataSourceService } from '../../../lib/services/JavaScriptDataSourceService'

// Mock the JavaScript data source service
jest.mock('../../../lib/services/JavaScriptDataSourceService', () => ({
  JavaScriptDataSourceService: jest.fn().mockImplementation(() => ({
    executeScript: jest.fn(),
    diffData: jest.fn(),
  }))
}))

// Mock vm2 for script execution
jest.mock('vm2', () => ({
  VM: jest.fn().mockImplementation(() => ({
    run: jest.fn(),
    freeze: jest.fn(),
  }))
}))

describe('JavaScript Data Source Integration Tests', () => {
  let mockJsService: any
  let mockVm: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockJsService = {
      executeScript: jest.fn(),
      diffData: jest.fn(),
    }
    
    mockVm = {
      run: jest.fn(),
      freeze: jest.fn(),
    }
    
    const { JavaScriptDataSourceService } = require('../../../lib/services/JavaScriptDataSourceService')
    JavaScriptDataSourceService.mockImplementation(() => mockJsService)
    
    const { VM } = require('vm2')
    VM.mockImplementation(() => mockVm)
  })

  describe('Custom Script Workflow', () => {
    it('should complete full custom script workflow', async () => {
      const mockAddDataSource = jest.fn()
      
      // Mock the DataSourceContext
      jest.doMock('../../../contexts/DataSourceContext', () => ({
        useDataSources: () => ({
          addDataSource: mockAddDataSource,
          dataSources: []
        })
      }))

      render(<UnifiedDataSourceWorkflow projectId="test-project" onComplete={jest.fn()} onCancel={jest.fn()} />)

      // Step 1: Select JavaScript data source type
      const jsOption = screen.getByText('JavaScript Script')
      await act(async () => {
        fireEvent.click(jsOption)
      })

      // Step 2: Select custom script import method
      await waitFor(() => {
        expect(screen.getByText('Custom Script')).toBeInTheDocument()
      })

      const customScriptOption = screen.getByText('Custom Script')
      await act(async () => {
        fireEvent.click(customScriptOption)
      })

      // Step 3: Configure custom script
      await waitFor(() => {
        expect(screen.getByText('Choose Example Script')).toBeInTheDocument()
      })

      // Select API Fetch example
      const apiFetchOption = screen.getByText(/API Fetch/i)
      await act(async () => {
        fireEvent.click(apiFetchOption)
      })

      // Fill in data source name
      const nameInput = screen.getByLabelText(/name/i)
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'API Data Source' } })
      })

      // Add environment variable
      const addVariableButton = screen.getByText(/add variable/i)
      await act(async () => {
        fireEvent.click(addVariableButton)
      })

      const variableNameInput = screen.getByPlaceholderText(/variable name/i)
      const variableValueInput = screen.getByPlaceholderText(/variable value/i)
      
      await act(async () => {
        fireEvent.change(variableNameInput, { target: { value: 'API_URL' } })
        fireEvent.change(variableValueInput, { target: { value: 'https://api.example.com' } })
      })

      // Test the script
      mockVm.run.mockResolvedValue([{ id: 1, name: 'Test Data' }])
      mockJsService.executeScript.mockResolvedValue([{ id: 1, name: 'Test Data' }])

      const testButton = screen.getByText('Test & Continue')
      await act(async () => {
        fireEvent.click(testButton)
      })

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/script executed successfully/i)).toBeInTheDocument()
      })

      // Continue to review
      const continueButton = screen.getByText(/continue/i)
      await act(async () => {
        fireEvent.click(continueButton)
      })

      // Step 4: Review and create
      await waitFor(() => {
        expect(screen.getByText('Review & Create')).toBeInTheDocument()
      })

      expect(screen.getByText('API Data Source')).toBeInTheDocument()
      expect(screen.getByText('JavaScript Script')).toBeInTheDocument()

      const createButton = screen.getByText('Create Data Source')
      await act(async () => {
        fireEvent.click(createButton)
      })

      // Verify data source was created with correct configuration
      await waitFor(() => {
        expect(mockAddDataSource).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'API Data Source',
            type: 'javascript',
            config: expect.objectContaining({
              javascriptConfig: expect.objectContaining({
                script: expect.stringContaining('fetch'),
                variables: expect.objectContaining({
                  API_URL: 'https://api.example.com'
                }),
                outputFormat: 'array'
              })
            })
          })
        )
      })
    })

    it('should handle script execution errors', async () => {
      render(<UnifiedDataSourceWorkflow projectId="test-project" onComplete={jest.fn()} onCancel={jest.fn()} />)

      // Navigate to custom script configuration
      const jsOption = screen.getByText('JavaScript Script')
      await act(async () => {
        fireEvent.click(jsOption)
      })

      await waitFor(() => {
        const customScriptOption = screen.getByText('Custom Script')
        fireEvent.click(customScriptOption)
      })

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i)
        fireEvent.change(nameInput, { target: { value: 'Error Test' } })
      })

      // Mock script execution error
      mockVm.run.mockRejectedValue(new Error('Script execution failed'))
      mockJsService.executeScript.mockRejectedValue(new Error('Script execution failed'))

      const testButton = screen.getByText('Test & Continue')
      await act(async () => {
        fireEvent.click(testButton)
      })

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/script execution failed/i)).toBeInTheDocument()
      })
    })

    it('should validate script output format', async () => {
      render(<UnifiedDataSourceWorkflow projectId="test-project" onComplete={jest.fn()} onCancel={jest.fn()} />)

      // Navigate to custom script configuration
      const jsOption = screen.getByText('JavaScript Script')
      await act(async () => {
        fireEvent.click(jsOption)
      })

      await waitFor(() => {
        const customScriptOption = screen.getByText('Custom Script')
        fireEvent.click(customScriptOption)
      })

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i)
        fireEvent.change(nameInput, { target: { value: 'Format Test' } })
      })

      // Mock invalid script output (object instead of array)
      mockVm.run.mockResolvedValue({ invalid: 'format' })
      mockJsService.executeScript.mockResolvedValue({ invalid: 'format' })

      const testButton = screen.getByText('Test & Continue')
      await act(async () => {
        fireEvent.click(testButton)
      })

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/expected array format/i)).toBeInTheDocument()
      })
    })
  })

  describe('Scheduled Script Workflow', () => {
    it('should complete full scheduled script workflow', async () => {
      const mockAddDataSource = jest.fn()
      
      jest.doMock('../../../contexts/DataSourceContext', () => ({
        useDataSources: () => ({
          addDataSource: mockAddDataSource,
          dataSources: []
        })
      }))

      render(<UnifiedDataSourceWorkflow projectId="test-project" onComplete={jest.fn()} onCancel={jest.fn()} />)

      // Step 1: Select JavaScript data source type
      const jsOption = screen.getByText('JavaScript Script')
      await act(async () => {
        fireEvent.click(jsOption)
      })

      // Step 2: Select scheduled script import method
      await waitFor(() => {
        expect(screen.getByText('Scheduled Script')).toBeInTheDocument()
      })

      const scheduledScriptOption = screen.getByText('Scheduled Script')
      await act(async () => {
        fireEvent.click(scheduledScriptOption)
      })

      // Step 3: Configure scheduled script
      await waitFor(() => {
        expect(screen.getByText('Choose Example Script')).toBeInTheDocument()
      })

      // Select Web Scraping example
      const webScrapingOption = screen.getByText(/Web Scraping/i)
      await act(async () => {
        fireEvent.click(webScrapingOption)
      })

      // Fill in data source name
      const nameInput = screen.getByLabelText(/name/i)
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Scheduled Scraper' } })
      })

      // Configure execution interval
      const intervalInput = screen.getByLabelText(/execution interval/i)
      await act(async () => {
        fireEvent.change(intervalInput, { target: { value: '30' } })
      })

      // Enable diffing
      const enableDiffCheckbox = screen.getByLabelText(/enable diffing/i)
      await act(async () => {
        fireEvent.click(enableDiffCheckbox)
      })

      // Set diff key
      const diffKeyInput = screen.getByLabelText(/diff key/i)
      await act(async () => {
        fireEvent.change(diffKeyInput, { target: { value: 'id' } })
      })

      // Configure schedule
      const configureButton = screen.getByText('Configure Schedule')
      await act(async () => {
        fireEvent.click(configureButton)
      })

      // Step 4: Review and create
      await waitFor(() => {
        expect(screen.getByText('Review & Create')).toBeInTheDocument()
      })

      expect(screen.getByText('Scheduled Scraper')).toBeInTheDocument()
      expect(screen.getByText('JavaScript Script')).toBeInTheDocument()

      const createButton = screen.getByText('Create Data Source')
      await act(async () => {
        fireEvent.click(createButton)
      })

      // Verify data source was created with scheduling configuration
      await waitFor(() => {
        expect(mockAddDataSource).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Scheduled Scraper',
            type: 'javascript',
            config: expect.objectContaining({
              javascriptConfig: expect.objectContaining({
                interval: 30,
                enableDiff: true,
                diffKey: 'id',
                schedule: expect.any(String)
              })
            })
          })
        )
      })
    })

    it('should validate cron expression format', async () => {
      render(<UnifiedDataSourceWorkflow projectId="test-project" onComplete={jest.fn()} onCancel={jest.fn()} />)

      // Navigate to scheduled script configuration
      const jsOption = screen.getByText('JavaScript Script')
      await act(async () => {
        fireEvent.click(jsOption)
      })

      await waitFor(() => {
        const scheduledScriptOption = screen.getByText('Scheduled Script')
        fireEvent.click(scheduledScriptOption)
      })

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i)
        fireEvent.change(nameInput, { target: { value: 'Cron Test' } })
      })

      // Enter invalid cron expression
      const cronInput = screen.getByLabelText(/cron expression/i)
      await act(async () => {
        fireEvent.change(cronInput, { target: { value: 'invalid cron' } })
      })

      const configureButton = screen.getByText('Configure Schedule')
      await act(async () => {
        fireEvent.click(configureButton)
      })

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid cron expression/i)).toBeInTheDocument()
      })
    })
  })

  describe('Script Execution and Data Processing', () => {
    it('should execute script with environment variables', async () => {
      const mockScript = `
        const response = await fetch(API_URL + '/data');
        const data = await response.json();
        return data;
      `

      mockVm.run.mockResolvedValue([{ id: 1, name: 'Test' }])
      mockJsService.executeScript.mockResolvedValue([{ id: 1, name: 'Test' }])

      const service = new JavaScriptDataSourceService()
      const config = {
        script: mockScript,
        variables: { API_URL: 'https://api.example.com' },
        outputFormat: 'array' as const
      }

      const result = await service.executeScript(mockScript, config)

      expect(mockVm.freeze).toHaveBeenCalledWith('https://api.example.com', 'API_URL')
      expect(mockVm.run).toHaveBeenCalledWith(mockScript)
      expect(result).toEqual([{ id: 1, name: 'Test' }])
    })

    it('should handle script timeout', async () => {
      const mockScript = `
        while(true) {
          // Infinite loop
        }
      `

      mockVm.run.mockRejectedValue(new Error('Script execution timeout'))
      mockJsService.executeScript.mockRejectedValue(new Error('Script execution timeout'))

      const service = new JavaScriptDataSourceService()
      const config = {
        script: mockScript,
        timeout: 1000
      }

      await expect(service.executeScript(mockScript, config)).rejects.toThrow('Script execution timeout')
    })

    it('should perform data diffing correctly', async () => {
      const oldData = [
        { id: 1, name: 'Item 1', value: 100 },
        { id: 2, name: 'Item 2', value: 200 },
        { id: 3, name: 'Item 3', value: 300 }
      ]

      const newData = [
        { id: 1, name: 'Item 1 Updated', value: 150 }, // Updated
        { id: 2, name: 'Item 2', value: 200 }, // Unchanged
        { id: 4, name: 'Item 4', value: 400 } // New
      ]

      const expectedDiff = {
        newRecords: [{ id: 4, name: 'Item 4', value: 400 }],
        updatedRecords: [{ id: 1, name: 'Item 1 Updated', value: 150 }],
        deletedRecords: [{ id: 3, name: 'Item 3', value: 300 }]
      }

      mockJsService.diffData.mockResolvedValue(expectedDiff)

      const service = new JavaScriptDataSourceService()
      const result = await service.diffData(oldData, newData, 'id')

      expect(mockJsService.diffData).toHaveBeenCalledWith(oldData, newData, 'id')
      expect(result).toEqual(expectedDiff)
    })

    it('should handle different output formats', async () => {
      // Test array format
      mockVm.run.mockResolvedValue([{ id: 1 }, { id: 2 }])
      mockJsService.executeScript.mockResolvedValue([{ id: 1 }, { id: 2 }])

      let service = new JavaScriptDataSourceService()
      let config = { outputFormat: 'array' as const }
      let result = await service.executeScript('return [];', config)
      expect(Array.isArray(result)).toBe(true)

      // Test object format
      mockVm.run.mockResolvedValue({ data: [{ id: 1 }], total: 1 })
      mockJsService.executeScript.mockResolvedValue({ data: [{ id: 1 }], total: 1 })

      service = new JavaScriptDataSourceService()
      config = { outputFormat: 'object' as const }
      result = await service.executeScript('return {};', config)
      expect(typeof result).toBe('object')
      expect(Array.isArray(result)).toBe(false)
    })
  })

  describe('Example Script Templates', () => {
    it('should load and apply API fetch template', async () => {
      render(<UnifiedDataSourceWorkflow projectId="test-project" onComplete={jest.fn()} onCancel={jest.fn()} />)

      // Navigate to custom script configuration
      const jsOption = screen.getByText('JavaScript Script')
      await act(async () => {
        fireEvent.click(jsOption)
      })

      await waitFor(() => {
        const customScriptOption = screen.getByText('Custom Script')
        fireEvent.click(customScriptOption)
      })

      await waitFor(() => {
        expect(screen.getByText(/API Fetch/i)).toBeInTheDocument()
      })

      // Select API fetch template
      const apiFetchOption = screen.getByText(/API Fetch/i)
      await act(async () => {
        fireEvent.click(apiFetchOption)
      })

      // Check that script content is loaded
      const scriptTextarea = screen.getByDisplayValue(/fetch/i)
      expect(scriptTextarea).toHaveValue(expect.stringContaining('fetch'))
    })

    it('should load and apply web scraping template', async () => {
      render(<UnifiedDataSourceWorkflow projectId="test-project" onComplete={jest.fn()} onCancel={jest.fn()} />)

      // Navigate to scheduled script configuration
      const jsOption = screen.getByText('JavaScript Script')
      await act(async () => {
        fireEvent.click(jsOption)
      })

      await waitFor(() => {
        const scheduledScriptOption = screen.getByText('Scheduled Script')
        fireEvent.click(scheduledScriptOption)
      })

      await waitFor(() => {
        expect(screen.getByText(/Web Scraping/i)).toBeInTheDocument()
      })

      // Select web scraping template
      const webScrapingOption = screen.getByText(/Web Scraping/i)
      await act(async () => {
        fireEvent.click(webScrapingOption)
      })

      // Check that script content is loaded
      const scriptTextarea = screen.getByDisplayValue(/document/i)
      expect(scriptTextarea).toHaveValue(expect.stringContaining('document'))
    })

    it('should load and apply data transformation template', async () => {
      render(<UnifiedDataSourceWorkflow projectId="test-project" onComplete={jest.fn()} onCancel={jest.fn()} />)

      // Navigate to custom script configuration
      const jsOption = screen.getByText('JavaScript Script')
      await act(async () => {
        fireEvent.click(jsOption)
      })

      await waitFor(() => {
        const customScriptOption = screen.getByText('Custom Script')
        fireEvent.click(customScriptOption)
      })

      await waitFor(() => {
        expect(screen.getByText(/Data Transformation/i)).toBeInTheDocument()
      })

      // Select data transformation template
      const transformOption = screen.getByText(/Data Transformation/i)
      await act(async () => {
        fireEvent.click(transformOption)
      })

      // Check that script content is loaded
      const scriptTextarea = screen.getByDisplayValue(/map/i)
      expect(scriptTextarea).toHaveValue(expect.stringContaining('map'))
    })
  })
})
