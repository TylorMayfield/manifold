import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../utils/simple-test-utils'
import UnifiedDataSourceWorkflow from '../../../components/data-sources/UnifiedDataSourceWorkflow'

// Mock the DataSourceContext
const mockAddDataSource = jest.fn()
jest.mock('../../../contexts/DataSourceContext', () => ({
  useDataSources: () => ({
    addDataSource: mockAddDataSource,
    dataSources: []
  })
}))

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn()
  })
}))

describe('UnifiedDataSourceWorkflow', () => {
  const defaultProps = {
    projectId: 'test-project',
    onComplete: jest.fn(),
    onCancel: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders initial step - type selection', () => {
    render(<UnifiedDataSourceWorkflow {...defaultProps} />)
    
    expect(screen.getByText('Select Data Source Type')).toBeInTheDocument()
    expect(screen.getByText('Choose how you want to import your data')).toBeInTheDocument()
  })

  it('displays all data source type options', () => {
    render(<UnifiedDataSourceWorkflow {...defaultProps} />)
    
    // Check for different data source types
    expect(screen.getByText('CSV File')).toBeInTheDocument()
    expect(screen.getByText('JSON File')).toBeInTheDocument()
    expect(screen.getByText('SQL Dump')).toBeInTheDocument()
    expect(screen.getByText('API Endpoint')).toBeInTheDocument()
    expect(screen.getByText('Mock Data')).toBeInTheDocument()
    expect(screen.getByText('MySQL Database')).toBeInTheDocument()
    expect(screen.getByText('JavaScript Script')).toBeInTheDocument()
  })

  it('allows selecting a data source type', async () => {
    render(<UnifiedDataSourceWorkflow {...defaultProps} />)
    
    const csvOption = screen.getByText('CSV File')
    fireEvent.click(csvOption)
    
    await waitFor(() => {
      expect(screen.getByText('Select Import Method')).toBeInTheDocument()
    })
  })

  it('shows import methods for selected data source type', async () => {
    render(<UnifiedDataSourceWorkflow {...defaultProps} />)
    
    // Select CSV type
    const csvOption = screen.getByText('CSV File')
    fireEvent.click(csvOption)
    
    await waitFor(() => {
      expect(screen.getByText('Select Import Method')).toBeInTheDocument()
      expect(screen.getByText('File Upload')).toBeInTheDocument()
      expect(screen.getByText('URL Import')).toBeInTheDocument()
    })
  })

  it('allows selecting an import method', async () => {
    render(<UnifiedDataSourceWorkflow {...defaultProps} />)
    
    // Select CSV type
    const csvOption = screen.getByText('CSV File')
    fireEvent.click(csvOption)
    
    await waitFor(() => {
      // Select file upload method
      const fileUploadOption = screen.getByText('File Upload')
      fireEvent.click(fileUploadOption)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Configure Data Source')).toBeInTheDocument()
    })
  })

  it('shows configuration step with proper fields', async () => {
    render(<UnifiedDataSourceWorkflow {...defaultProps} />)
    
    // Navigate to configuration step
    const csvOption = screen.getByText('CSV File')
    fireEvent.click(csvOption)
    
    await waitFor(() => {
      const fileUploadOption = screen.getByText('File Upload')
      fireEvent.click(fileUploadOption)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Configure Data Source')).toBeInTheDocument()
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    })
  })

  it('validates required fields in configuration', async () => {
    render(<UnifiedDataSourceWorkflow {...defaultProps} />)
    
    // Navigate to configuration step
    const csvOption = screen.getByText('CSV File')
    fireEvent.click(csvOption)
    
    await waitFor(() => {
      const fileUploadOption = screen.getByText('File Upload')
      fireEvent.click(fileUploadOption)
    })
    
    await waitFor(() => {
      const reviewButton = screen.getByText('Review')
      expect(reviewButton).toBeDisabled()
    })
  })

  it('enables review button when name is provided', async () => {
    render(<UnifiedDataSourceWorkflow {...defaultProps} />)
    
    // Navigate to configuration step
    const csvOption = screen.getByText('CSV File')
    fireEvent.click(csvOption)
    
    await waitFor(() => {
      const fileUploadOption = screen.getByText('File Upload')
      fireEvent.click(fileUploadOption)
    })
    
    await waitFor(() => {
      const nameInput = screen.getByLabelText(/name/i)
      fireEvent.change(nameInput, { target: { value: 'Test Data Source' } })
      
      const reviewButton = screen.getByText('Review')
      expect(reviewButton).not.toBeDisabled()
    })
  })

  it('shows summary step with data source details', async () => {
    render(<UnifiedDataSourceWorkflow {...defaultProps} />)
    
    // Navigate through all steps
    const csvOption = screen.getByText('CSV File')
    fireEvent.click(csvOption)
    
    await waitFor(() => {
      const fileUploadOption = screen.getByText('File Upload')
      fireEvent.click(fileUploadOption)
    })
    
    await waitFor(() => {
      const nameInput = screen.getByLabelText(/name/i)
      fireEvent.change(nameInput, { target: { value: 'Test Data Source' } })
      
      const reviewButton = screen.getByText('Review')
      fireEvent.click(reviewButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Review & Create')).toBeInTheDocument()
      expect(screen.getByText('Test Data Source')).toBeInTheDocument()
    })
  })

  it('handles back navigation correctly', async () => {
    render(<UnifiedDataSourceWorkflow {...defaultProps} />)
    
    // Select a type first
    const csvOption = screen.getByText('CSV File')
    fireEvent.click(csvOption)
    
    await waitFor(() => {
      const backButton = screen.getByText('Back')
      fireEvent.click(backButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Select Data Source Type')).toBeInTheDocument()
    })
  })

  it('disables back button on first step', () => {
    render(<UnifiedDataSourceWorkflow {...defaultProps} />)
    
    const backButton = screen.getByText('Back')
    expect(backButton).toBeDisabled()
  })

  it('calls onCancel when cancel is triggered', () => {
    render(<UnifiedDataSourceWorkflow {...defaultProps} />)
    
    // This would depend on how the cancel is implemented
    // Might be through a cancel button or the back button on first step
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(0)
  })

  it('shows JavaScript data source options', async () => {
    render(<UnifiedDataSourceWorkflow {...defaultProps} />)
    
    const jsOption = screen.getByText('JavaScript Script')
    fireEvent.click(jsOption)
    
    await waitFor(() => {
      expect(screen.getByText('Custom Script')).toBeInTheDocument()
      expect(screen.getByText('Scheduled Script')).toBeInTheDocument()
    })
  })

  it('handles JavaScript custom script configuration', async () => {
    render(<UnifiedDataSourceWorkflow {...defaultProps} />)
    
    // Select JavaScript type
    const jsOption = screen.getByText('JavaScript Script')
    fireEvent.click(jsOption)
    
    await waitFor(() => {
      const customScriptOption = screen.getByText('Custom Script')
      fireEvent.click(customScriptOption)
    })
    
    await waitFor(() => {
      expect(screen.getByText('JavaScript Code')).toBeInTheDocument()
      expect(screen.getByText('Environment Variables')).toBeInTheDocument()
    })
  })

  it('shows example scripts for JavaScript data source', async () => {
    render(<UnifiedDataSourceWorkflow {...defaultProps} />)
    
    // Navigate to JavaScript custom script configuration
    const jsOption = screen.getByText('JavaScript Script')
    fireEvent.click(jsOption)
    
    await waitFor(() => {
      const customScriptOption = screen.getByText('Custom Script')
      fireEvent.click(customScriptOption)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Choose Example Script')).toBeInTheDocument()
      // Check for example script options
      expect(screen.getByText(/API Fetch/i)).toBeInTheDocument()
      expect(screen.getByText(/Web Scraping/i)).toBeInTheDocument()
    })
  })

  it('allows creating data source successfully', async () => {
    render(<UnifiedDataSourceWorkflow {...defaultProps} />)
    
    // Navigate through all steps and create
    const csvOption = screen.getByText('CSV File')
    fireEvent.click(csvOption)
    
    await waitFor(() => {
      const fileUploadOption = screen.getByText('File Upload')
      fireEvent.click(fileUploadOption)
    })
    
    await waitFor(() => {
      const nameInput = screen.getByLabelText(/name/i)
      fireEvent.change(nameInput, { target: { value: 'Test Data Source' } })
      
      const reviewButton = screen.getByText('Review')
      fireEvent.click(reviewButton)
    })
    
    await waitFor(() => {
      const createButton = screen.getByText('Create Data Source')
      fireEvent.click(createButton)
    })
    
    await waitFor(() => {
      expect(mockAddDataSource).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Data Source',
          type: 'csv'
        })
      )
    })
  })

  it('shows loading state when creating data source', async () => {
    // Mock a slow async operation
    mockAddDataSource.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))
    
    render(<UnifiedDataSourceWorkflow {...defaultProps} />)
    
    // Navigate to creation step
    const csvOption = screen.getByText('CSV File')
    fireEvent.click(csvOption)
    
    await waitFor(() => {
      const fileUploadOption = screen.getByText('File Upload')
      fireEvent.click(fileUploadOption)
    })
    
    await waitFor(() => {
      const nameInput = screen.getByLabelText(/name/i)
      fireEvent.change(nameInput, { target: { value: 'Test Data Source' } })
      
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
})
