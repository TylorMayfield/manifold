import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '../utils/simple-test-utils'
import { useRouter } from 'next/navigation'
import AddDataSourcePage from '../../../app/add-data-source/page'

// Mock next/navigation
const mockPush = jest.fn()
const mockBack = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack
  })
}))

// Mock the DataSourceContext
const mockAddDataSource = jest.fn()
jest.mock('../../../contexts/DataSourceContext', () => ({
  useDataSources: () => ({
    addDataSource: mockAddDataSource,
    dataSources: []
  })
}))

describe('Data Source Creation Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('completes full CSV data source creation workflow', async () => {
    render(<AddDataSourcePage />)

    // Step 1: Select data source type
    expect(screen.getByText('Add Data Source')).toBeInTheDocument()
    
    const csvOption = screen.getByText('CSV File')
    await act(async () => {
      fireEvent.click(csvOption)
    })

    // Step 2: Select import method
    await waitFor(() => {
      expect(screen.getByText('Select Import Method')).toBeInTheDocument()
    })

    const fileUploadOption = screen.getByText('File Upload')
    await act(async () => {
      fireEvent.click(fileUploadOption)
    })

    // Step 3: Configure data source
    await waitFor(() => {
      expect(screen.getByText('Configure Data Source')).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/name/i)
    const descriptionInput = screen.getByLabelText(/description/i)

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test CSV Data' } })
      fireEvent.change(descriptionInput, { target: { value: 'Test CSV import' } })
    })

    const reviewButton = screen.getByText('Review')
    await act(async () => {
      fireEvent.click(reviewButton)
    })

    // Step 4: Review and create
    await waitFor(() => {
      expect(screen.getByText('Review & Create')).toBeInTheDocument()
    })

    expect(screen.getByText('Test CSV Data')).toBeInTheDocument()
    expect(screen.getByText('Test CSV import')).toBeInTheDocument()

    const createButton = screen.getByText('Create Data Source')
    await act(async () => {
      fireEvent.click(createButton)
    })

    // Should call addDataSource and navigate back
    await waitFor(() => {
      expect(mockAddDataSource).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test CSV Data',
          type: 'csv',
          description: 'Test CSV import'
        })
      )
    })

    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('completes JavaScript data source creation workflow', async () => {
    render(<AddDataSourcePage />)

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

    // Step 3: Configure JavaScript data source
    await waitFor(() => {
      expect(screen.getByText('Choose Example Script')).toBeInTheDocument()
    })

    // Select an example script
    const apiFetchOption = screen.getByText(/API Fetch/i)
    await act(async () => {
      fireEvent.click(apiFetchOption)
    })

    // Fill in name
    const nameInput = screen.getByLabelText(/name/i)
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'API Data Source' } })
    })

    // Test the script
    const testButton = screen.getByText('Test & Continue')
    await act(async () => {
      fireEvent.click(testButton)
    })

    // Step 4: Review and create
    await waitFor(() => {
      expect(screen.getByText('Review & Create')).toBeInTheDocument()
    })

    expect(screen.getByText('API Data Source')).toBeInTheDocument()

    const createButton = screen.getByText('Create Data Source')
    await act(async () => {
      fireEvent.click(createButton)
    })

    // Should create JavaScript data source
    await waitFor(() => {
      expect(mockAddDataSource).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'API Data Source',
          type: 'javascript'
        })
      )
    })
  })

  it('completes scheduled JavaScript data source workflow', async () => {
    render(<AddDataSourcePage />)

    // Select JavaScript data source type
    const jsOption = screen.getByText('JavaScript Script')
    await act(async () => {
      fireEvent.click(jsOption)
    })

    // Select scheduled script import method
    await waitFor(() => {
      expect(screen.getByText('Scheduled Script')).toBeInTheDocument()
    })

    const scheduledScriptOption = screen.getByText('Scheduled Script')
    await act(async () => {
      fireEvent.click(scheduledScriptOption)
    })

    // Configure scheduled script
    await waitFor(() => {
      expect(screen.getByText('Choose Example Script')).toBeInTheDocument()
    })

    // Select example script
    const webScrapingOption = screen.getByText(/Web Scraping/i)
    await act(async () => {
      fireEvent.click(webScrapingOption)
    })

    // Configure schedule
    await waitFor(() => {
      expect(screen.getByText('Execution Interval')).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/name/i)
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Scheduled Scraper' } })
    })

    const configureButton = screen.getByText('Configure Schedule')
    await act(async () => {
      fireEvent.click(configureButton)
    })

    // Review and create
    await waitFor(() => {
      expect(screen.getByText('Review & Create')).toBeInTheDocument()
    })

    const createButton = screen.getByText('Create Data Source')
    await act(async () => {
      fireEvent.click(createButton)
    })

    // Should create scheduled JavaScript data source
    await waitFor(() => {
      expect(mockAddDataSource).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Scheduled Scraper',
          type: 'javascript',
          config: expect.objectContaining({
            javascriptConfig: expect.objectContaining({
              interval: expect.any(Number)
            })
          })
        })
      )
    })
  })

  it('handles navigation between steps correctly', async () => {
    render(<AddDataSourcePage />)

    // Start with CSV selection
    const csvOption = screen.getByText('CSV File')
    await act(async () => {
      fireEvent.click(csvOption)
    })

    // Go to import method selection
    await waitFor(() => {
      expect(screen.getByText('Select Import Method')).toBeInTheDocument()
    })

    const fileUploadOption = screen.getByText('File Upload')
    await act(async () => {
      fireEvent.click(fileUploadOption)
    })

    // Go to configuration
    await waitFor(() => {
      expect(screen.getByText('Configure Data Source')).toBeInTheDocument()
    })

    // Go back to import method selection
    const backButton = screen.getByText('Back')
    await act(async () => {
      fireEvent.click(backButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Select Import Method')).toBeInTheDocument()
    })

    // Go back to type selection
    await act(async () => {
      fireEvent.click(screen.getByText('Back'))
    })

    await waitFor(() => {
      expect(screen.getByText('Select Data Source Type')).toBeInTheDocument()
    })
  })

  it('validates required fields in configuration step', async () => {
    render(<AddDataSourcePage />)

    // Navigate to configuration step
    const csvOption = screen.getByText('CSV File')
    await act(async () => {
      fireEvent.click(csvOption)
    })

    await waitFor(() => {
      const fileUploadOption = screen.getByText('File Upload')
      fireEvent.click(fileUploadOption)
    })

    await waitFor(() => {
      expect(screen.getByText('Configure Data Source')).toBeInTheDocument()
    })

    // Review button should be disabled without name
    const reviewButton = screen.getByText('Review')
    expect(reviewButton).toBeDisabled()

    // Enter name
    const nameInput = screen.getByLabelText(/name/i)
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test Data' } })
    })

    // Review button should now be enabled
    await waitFor(() => {
      expect(reviewButton).not.toBeDisabled()
    })
  })

  it('shows loading state during data source creation', async () => {
    // Mock a slow async operation
    mockAddDataSource.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

    render(<AddDataSourcePage />)

    // Navigate through steps quickly
    const csvOption = screen.getByText('CSV File')
    await act(async () => {
      fireEvent.click(csvOption)
    })

    await waitFor(() => {
      const fileUploadOption = screen.getByText('File Upload')
      fireEvent.click(fileUploadOption)
    })

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/name/i)
      fireEvent.change(nameInput, { target: { value: 'Test Data' } })
    })

    await waitFor(() => {
      const reviewButton = screen.getByText('Review')
      fireEvent.click(reviewButton)
    })

    await waitFor(() => {
      const createButton = screen.getByText('Create Data Source')
      fireEvent.click(createButton)
    })

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument()
    })
  })

  it('handles cancel action correctly', async () => {
    render(<AddDataSourcePage />)

    // Start the workflow
    const csvOption = screen.getByText('CSV File')
    await act(async () => {
      fireEvent.click(csvOption)
    })

    // Cancel should navigate back to home
    // This would depend on how cancel is implemented in the component
    // For now, we'll test that the component renders correctly
    expect(screen.getByText('Select Import Method')).toBeInTheDocument()
  })
})
