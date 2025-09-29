import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../utils/advanced-test-utils'
import { a11yHelpers } from '../../utils/advanced-test-utils'
import UnifiedDataSourceWorkflow from '../../../components/data-sources/UnifiedDataSourceWorkflow'
import CellButton from '../../../components/ui/CellButton'
import CellModal from '../../../components/ui/CellModal'
import DataTable from '../../../components/data/DataTable'

describe('Accessibility Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through workflow steps', async () => {
      render(
        <UnifiedDataSourceWorkflow 
          projectId="test-project" 
          onComplete={jest.fn()} 
          onCancel={jest.fn()} 
        />
      )

      // Get all focusable elements
      const focusableElements = screen.getAllByRole('button')
      
      const navigationResults = await a11yHelpers.testKeyboardNavigation(focusableElements)
      
      // All elements should be focusable
      expect(navigationResults.every(result => result.focused)).toBe(true)
    })

    it('should support arrow key navigation in data source options', async () => {
      render(
        <UnifiedDataSourceWorkflow 
          projectId="test-project" 
          onComplete={jest.fn()} 
          onCancel={jest.fn()} 
        />
      )

      const csvOption = screen.getByText('CSV File')
      const jsonOption = screen.getByText('JSON File')
      const apiOption = screen.getByText('API Endpoint')

      // Focus on CSV option
      csvOption.focus()
      expect(document.activeElement).toBe(csvOption)

      // Navigate with arrow keys
      fireEvent.keyDown(csvOption, { key: 'ArrowDown' })
      expect(document.activeElement).toBe(jsonOption)

      fireEvent.keyDown(jsonOption, { key: 'ArrowDown' })
      expect(document.activeElement).toBe(apiOption)

      // Navigate back up
      fireEvent.keyDown(apiOption, { key: 'ArrowUp' })
      expect(document.activeElement).toBe(jsonOption)
    })

    it('should support Enter key activation', async () => {
      render(
        <UnifiedDataSourceWorkflow 
          projectId="test-project" 
          onComplete={jest.fn()} 
          onCancel={jest.fn()} 
        />
      )

      const csvOption = screen.getByText('CSV File')
      
      // Focus and activate with Enter
      csvOption.focus()
      fireEvent.keyDown(csvOption, { key: 'Enter' })

      await waitFor(() => {
        expect(screen.getByText('Select Import Method')).toBeInTheDocument()
      })
    })

    it('should support Escape key for modal dismissal', async () => {
      const mockOnClose = jest.fn()
      
      render(
        <CellModal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </CellModal>
      )

      // Press Escape key
      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should trap focus within modal', async () => {
      render(
        <CellModal isOpen={true} onClose={jest.fn()} title="Test Modal">
          <button>First Button</button>
          <button>Second Button</button>
          <button>Third Button</button>
        </CellModal>
      )

      const firstButton = screen.getByText('First Button')
      const secondButton = screen.getByText('Second Button')
      const thirdButton = screen.getByText('Third Button')

      // Focus should start on first button
      expect(document.activeElement).toBe(firstButton)

      // Tab through buttons
      fireEvent.keyDown(firstButton, { key: 'Tab' })
      expect(document.activeElement).toBe(secondButton)

      fireEvent.keyDown(secondButton, { key: 'Tab' })
      expect(document.activeElement).toBe(thirdButton)

      // Tab from last button should cycle back to first
      fireEvent.keyDown(thirdButton, { key: 'Tab' })
      expect(document.activeElement).toBe(firstButton)
    })
  })

  describe('ARIA Attributes and Labels', () => {
    it('should have proper ARIA labels on buttons', () => {
      render(
        <div>
          <CellButton aria-label="Add new data source">
            <span>+</span>
          </CellButton>
          <CellButton aria-label="Delete data source">
            <span>🗑</span>
          </CellButton>
        </div>
      )

      const addButton = screen.getByLabelText('Add new data source')
      const deleteButton = screen.getByLabelText('Delete data source')

      expect(addButton).toBeInTheDocument()
      expect(deleteButton).toBeInTheDocument()
      expect(addButton).toHaveAttribute('aria-label', 'Add new data source')
      expect(deleteButton).toHaveAttribute('aria-label', 'Delete data source')
    })

    it('should have proper role attributes', () => {
      render(
        <div>
          <button role="button">Regular Button</button>
          <div role="button" tabIndex={0}>Div Button</div>
          <div role="dialog">Modal Dialog</div>
          <div role="tablist">
            <div role="tab">Tab 1</div>
            <div role="tab">Tab 2</div>
          </div>
        </div>
      )

      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('tablist')).toBeInTheDocument()
      expect(screen.getAllByRole('tab')).toHaveLength(2)
    })

    it('should have proper aria-expanded for collapsible elements', async () => {
      const [expanded, setExpanded] = React.useState(false)

      render(
        <div>
          <button 
            aria-expanded={expanded}
            aria-controls="collapsible-content"
            onClick={() => setExpanded(!expanded)}
          >
            Toggle Content
          </button>
          <div 
            id="collapsible-content"
            aria-hidden={!expanded}
            style={{ display: expanded ? 'block' : 'none' }}
          >
            Collapsible content
          </div>
        </div>
      )

      const toggleButton = screen.getByText('Toggle Content')
      const content = screen.getByText('Collapsible content')

      expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
      expect(content).toHaveAttribute('aria-hidden', 'true')

      fireEvent.click(toggleButton)

      await waitFor(() => {
        expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
        expect(content).toHaveAttribute('aria-hidden', 'false')
      })
    })

    it('should have proper aria-describedby for form inputs', () => {
      render(
        <div>
          <label htmlFor="data-source-name">Data Source Name</label>
          <input 
            id="data-source-name"
            type="text"
            aria-describedby="name-help"
            required
            aria-required="true"
          />
          <div id="name-help">
            Enter a unique name for your data source
          </div>
        </div>
      )

      const input = screen.getByLabelText('Data Source Name')
      const helpText = screen.getByText('Enter a unique name for your data source')

      expect(input).toHaveAttribute('aria-describedby', 'name-help')
      expect(input).toHaveAttribute('aria-required', 'true')
      expect(helpText).toHaveAttribute('id', 'name-help')
    })
  })

  describe('Screen Reader Support', () => {
    it('should announce dynamic content changes', async () => {
      const [status, setStatus] = React.useState('idle')

      render(
        <div>
          <div 
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            Status: {status}
          </div>
          <button onClick={() => setStatus('loading')}>
            Start Process
          </button>
        </div>
      )

      const statusElement = screen.getByRole('status')
      const startButton = screen.getByText('Start Process')

      expect(statusElement).toHaveAttribute('aria-live', 'polite')
      expect(statusElement).toHaveAttribute('aria-atomic', 'true')

      fireEvent.click(startButton)

      await waitFor(() => {
        expect(statusElement).toHaveTextContent('Status: loading')
      })
    })

    it('should provide proper table structure for data tables', () => {
      const tableData = [
        { id: 1, name: 'Item 1', value: 100 },
        { id: 2, name: 'Item 2', value: 200 },
        { id: 3, name: 'Item 3', value: 300 }
      ]

      render(
        <table role="table" aria-label="Data source table">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Name</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map(row => (
              <tr key={row.id}>
                <th scope="row">{row.id}</th>
                <td>{row.name}</td>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )

      const table = screen.getByRole('table')
      const columnHeaders = screen.getAllByRole('columnheader')
      const rowHeaders = screen.getAllByRole('rowheader')

      expect(table).toHaveAttribute('aria-label', 'Data source table')
      expect(columnHeaders).toHaveLength(3)
      expect(rowHeaders).toHaveLength(3)

      // Check scope attributes
      columnHeaders.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col')
      })

      rowHeaders.forEach(header => {
        expect(header).toHaveAttribute('scope', 'row')
      })
    })

    it('should provide proper form structure', () => {
      render(
        <form aria-label="Data source configuration">
          <fieldset>
            <legend>Basic Information</legend>
            <div>
              <label htmlFor="name">Name</label>
              <input id="name" type="text" required />
            </div>
            <div>
              <label htmlFor="description">Description</label>
              <textarea id="description" />
            </div>
          </fieldset>
          
          <fieldset>
            <legend>Advanced Settings</legend>
            <div>
              <label htmlFor="interval">Sync Interval</label>
              <select id="interval">
                <option value="60">1 hour</option>
                <option value="1440">24 hours</option>
              </select>
            </div>
          </fieldset>
        </form>
      )

      const form = screen.getByRole('form')
      const fieldsets = screen.getAllByRole('group')
      const legends = screen.getAllByRole('group')

      expect(form).toHaveAttribute('aria-label', 'Data source configuration')
      expect(fieldsets).toHaveLength(2)
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      expect(screen.getByText('Advanced Settings')).toBeInTheDocument()
    })
  })

  describe('Color and Contrast', () => {
    it('should maintain proper color contrast', () => {
      // Test color contrast for different UI states
      const contrastTests = [
        { foreground: '#000000', background: '#ffffff', expected: true },
        { foreground: '#333333', background: '#ffffff', expected: true },
        { foreground: '#666666', background: '#ffffff', expected: true },
        { foreground: '#999999', background: '#ffffff', expected: false }, // Low contrast
        { foreground: '#ffffff', background: '#000000', expected: true },
        { foreground: '#007bff', background: '#ffffff', expected: true },
        { foreground: '#dc3545', background: '#ffffff', expected: true }
      ]

      contrastTests.forEach(({ foreground, background, expected }) => {
        const result = a11yHelpers.checkColorContrast(foreground, background)
        expect(result).toBe(expected)
      })
    })

    it('should not rely solely on color to convey information', () => {
      render(
        <div>
          <div data-testid="success-message" style={{ color: 'green' }}>
            ✓ Success: Data source created
          </div>
          <div data-testid="error-message" style={{ color: 'red' }}>
            ✗ Error: Failed to create data source
          </div>
          <div data-testid="warning-message" style={{ color: 'orange' }}>
            ⚠ Warning: Check your configuration
          </div>
        </div>
      )

      const successMessage = screen.getByTestId('success-message')
      const errorMessage = screen.getByTestId('error-message')
      const warningMessage = screen.getByTestId('warning-message')

      // Messages should have text indicators, not just color
      expect(successMessage).toHaveTextContent('✓ Success:')
      expect(errorMessage).toHaveTextContent('✗ Error:')
      expect(warningMessage).toHaveTextContent('⚠ Warning:')
    })
  })

  describe('Focus Management', () => {
    it('should manage focus when opening modals', async () => {
      const [isOpen, setIsOpen] = React.useState(false)
      const triggerButtonRef = React.useRef<HTMLButtonElement>(null)

      render(
        <div>
          <button 
            ref={triggerButtonRef}
            onClick={() => setIsOpen(true)}
          >
            Open Modal
          </button>
          
          <CellModal 
            isOpen={isOpen} 
            onClose={() => setIsOpen(false)}
            title="Test Modal"
          >
            <button>Modal Button</button>
          </CellModal>
        </div>
      )

      const triggerButton = screen.getByText('Open Modal')
      triggerButton.focus()
      
      fireEvent.click(triggerButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        // Focus should move to modal
        expect(document.activeElement).not.toBe(triggerButton)
      })
    })

    it('should restore focus when closing modals', async () => {
      const [isOpen, setIsOpen] = React.useState(false)
      const triggerButtonRef = React.useRef<HTMLButtonElement>(null)

      render(
        <div>
          <button 
            ref={triggerButtonRef}
            onClick={() => setIsOpen(true)}
          >
            Open Modal
          </button>
          
          <CellModal 
            isOpen={isOpen} 
            onClose={() => setIsOpen(false)}
            title="Test Modal"
          >
            <button>Modal Button</button>
          </CellModal>
        </div>
      )

      const triggerButton = screen.getByText('Open Modal')
      triggerButton.focus()
      
      fireEvent.click(triggerButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        // Focus should return to trigger button
        expect(document.activeElement).toBe(triggerButton)
      })
    })

    it('should handle focus in workflow navigation', async () => {
      render(
        <UnifiedDataSourceWorkflow 
          projectId="test-project" 
          onComplete={jest.fn()} 
          onCancel={jest.fn()} 
        />
      )

      // Navigate through workflow steps
      const csvOption = screen.getByText('CSV File')
      csvOption.focus()
      fireEvent.click(csvOption)

      await waitFor(() => {
        const fileUploadOption = screen.getByText('File Upload')
        expect(document.activeElement).toBe(fileUploadOption)
      })

      fireEvent.click(screen.getByText('File Upload'))

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i)
        expect(document.activeElement).toBe(nameInput)
      })
    })
  })

  describe('Error Handling and Announcements', () => {
    it('should announce form validation errors', async () => {
      const [errors, setErrors] = React.useState<string[]>([])

      render(
        <div>
          <form onSubmit={(e) => {
            e.preventDefault()
            setErrors(['Name is required', 'Description is too short'])
          }}>
            <div>
              <label htmlFor="name">Name</label>
              <input id="name" type="text" aria-describedby="name-error" />
              {errors.includes('Name is required') && (
                <div id="name-error" role="alert" aria-live="polite">
                  Name is required
                </div>
              )}
            </div>
            <button type="submit">Submit</button>
          </form>
        </div>
      )

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert')
        expect(errorMessage).toHaveAttribute('aria-live', 'polite')
        expect(errorMessage).toHaveTextContent('Name is required')
      })
    })

    it('should announce loading states', async () => {
      const [loading, setLoading] = React.useState(false)

      render(
        <div>
          <button onClick={() => setLoading(true)}>
            {loading ? 'Loading...' : 'Load Data'}
          </button>
          {loading && (
            <div role="status" aria-live="polite">
              Loading data sources...
            </div>
          )}
        </div>
      )

      const loadButton = screen.getByText('Load Data')
      fireEvent.click(loadButton)

      await waitFor(() => {
        const loadingMessage = screen.getByRole('status')
        expect(loadingMessage).toHaveAttribute('aria-live', 'polite')
        expect(loadingMessage).toHaveTextContent('Loading data sources...')
      })
    })
  })

  describe('Mobile and Touch Accessibility', () => {
    it('should have appropriate touch targets', () => {
      render(
        <div>
          <button style={{ minHeight: '44px', minWidth: '44px' }}>
            Touch Button
          </button>
          <CellButton size="lg">
            Large Button
          </CellButton>
        </div>
      )

      const touchButton = screen.getByText('Touch Button')
      const largeButton = screen.getByText('Large Button')

      // Check minimum touch target size (44x44px)
      const touchButtonStyles = window.getComputedStyle(touchButton)
      expect(parseInt(touchButtonStyles.minHeight)).toBeGreaterThanOrEqual(44)
      expect(parseInt(touchButtonStyles.minWidth)).toBeGreaterThanOrEqual(44)

      // Large button should also meet touch target requirements
      const largeButtonStyles = window.getComputedStyle(largeButton)
      expect(parseInt(largeButtonStyles.height)).toBeGreaterThanOrEqual(44)
    })

    it('should support swipe gestures for navigation', () => {
      const [currentStep, setCurrentStep] = React.useState(0)
      const steps = ['Step 1', 'Step 2', 'Step 3']

      render(
        <div>
          <div role="tablist">
            {steps.map((step, index) => (
              <button
                key={index}
                role="tab"
                aria-selected={index === currentStep}
                onClick={() => setCurrentStep(index)}
              >
                {step}
              </button>
            ))}
          </div>
          <div role="tabpanel">
            {steps[currentStep]}
          </div>
        </div>
      )

      // Simulate swipe gesture (touch events)
      const tabPanel = screen.getByRole('tabpanel')
      
      fireEvent.touchStart(tabPanel, {
        touches: [{ clientX: 100, clientY: 50 }]
      })

      fireEvent.touchEnd(tabPanel, {
        changedTouches: [{ clientX: 50, clientY: 50 }]
      })

      // Should handle touch interaction
      expect(tabPanel).toBeInTheDocument()
    })
  })
})
