import React from 'react'
import { render, RenderOptions, RenderResult, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Router } from 'next/router'
import { mockRouter } from './mock-router'

// Enhanced UI workflow testing utilities
export interface WorkflowTestConfig {
  mockApi?: boolean
  mockRouter?: boolean
  mockContexts?: boolean
  enableRealTimers?: boolean
  debugMode?: boolean
}

export class WorkflowTestRunner {
  private config: WorkflowTestConfig
  private user: ReturnType<typeof userEvent.setup>

  constructor(config: WorkflowTestConfig = {}) {
    this.config = {
      mockApi: true,
      mockRouter: true,
      mockContexts: true,
      enableRealTimers: false,
      debugMode: false,
      ...config
    }

    if (this.config.enableRealTimers) {
      jest.useRealTimers()
    } else {
      jest.useFakeTimers()
    }

    this.user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    })
  }

  /**
   * Render component with all necessary providers and mocks
   */
  renderWithProviders(ui: React.ReactElement, options?: RenderOptions): RenderResult {
    const AllProviders = ({ children }: { children: React.ReactNode }) => {
      let wrappedChildren = children

      // Wrap with router if needed
      if (this.config.mockRouter) {
        wrappedChildren = (
          <Router>
            {wrappedChildren}
          </Router>
        )
      }

      return <>{wrappedChildren}</>
    }

    return render(ui, { wrapper: AllProviders, ...options })
  }

  /**
   * Complete a multi-step workflow with validation at each step
   */
  async completeWorkflow(steps: WorkflowStep[]): Promise<WorkflowResult> {
    const result: WorkflowResult = {
      success: true,
      steps: [],
      errors: [],
      duration: 0
    }

    const startTime = Date.now()

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        const stepResult = await this.executeStep(step, i)
        
        result.steps.push(stepResult)

        if (!stepResult.success) {
          result.success = false
          result.errors.push(`Step ${i + 1} failed: ${stepResult.error}`)
          
          if (step.required) {
            break
          }
        }

        // Wait for any async operations
        if (step.waitAfter) {
          await this.wait(step.waitAfter)
        }
      }
    } catch (error: any) {
      result.success = false
      result.errors.push(`Workflow failed: ${error.message}`)
    }

    result.duration = Date.now() - startTime
    return result
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(step: WorkflowStep, index: number): Promise<StepResult> {
    const stepResult: StepResult = {
      stepIndex: index,
      stepName: step.name,
      success: false,
      error: null,
      duration: 0,
      actions: []
    }

    const startTime = Date.now()

    try {
      // Validate pre-conditions
      if (step.preConditions) {
        for (const condition of step.preConditions) {
          const element = await this.findElement(condition.selector, condition.timeout)
          if (!element) {
            throw new Error(`Pre-condition failed: Element not found: ${condition.selector}`)
          }
        }
      }

      // Execute actions
      for (const action of step.actions) {
        const actionResult = await this.executeAction(action)
        stepResult.actions.push(actionResult)

        if (!actionResult.success && action.required) {
          throw new Error(`Required action failed: ${actionResult.error}`)
        }
      }

      // Validate post-conditions
      if (step.postConditions) {
        await this.wait(step.waitFor || 100) // Default wait

        for (const condition of step.postConditions) {
          const element = await this.findElement(condition.selector, condition.timeout)
          if (!element) {
            throw new Error(`Post-condition failed: Element not found: ${condition.selector}`)
          }
        }
      }

      stepResult.success = true
    } catch (error: any) {
      stepResult.error = error.message
      stepResult.success = false
    }

    stepResult.duration = Date.now() - startTime
    return stepResult
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: WorkflowAction): Promise<ActionResult> {
    const actionResult: ActionResult = {
      actionType: action.type,
      success: false,
      error: null,
      duration: 0
    }

    const startTime = Date.now()

    try {
      switch (action.type) {
        case 'click':
          const clickElement = await this.findElement(action.selector, action.timeout)
          if (!clickElement) {
            throw new Error(`Element not found for click: ${action.selector}`)
          }
          await this.user.click(clickElement)
          break

        case 'type':
          const typeElement = await this.findElement(action.selector, action.timeout)
          if (!typeElement) {
            throw new Error(`Element not found for type: ${action.selector}`)
          }
          await this.user.clear(typeElement)
          await this.user.type(typeElement, action.value || '')
          break

        case 'select':
          const selectElement = await this.findElement(action.selector, action.timeout)
          if (!selectElement) {
            throw new Error(`Element not found for select: ${action.selector}`)
          }
          await this.user.selectOptions(selectElement, action.value || '')
          break

        case 'wait':
          await this.wait(action.duration || 1000)
          break

        case 'waitFor':
          await waitFor(() => {
            const element = screen.queryByText(action.value || '')
            if (!element) {
              throw new Error(`Element not found: ${action.value}`)
            }
          }, { timeout: action.timeout || 5000 })
          break

        case 'upload':
          const uploadElement = await this.findElement(action.selector, action.timeout)
          if (!uploadElement) {
            throw new Error(`Element not found for upload: ${action.selector}`)
          }
          const file = new File(['test content'], action.value || 'test.txt', { type: 'text/plain' })
          await this.user.upload(uploadElement, file)
          break

        case 'scroll':
          const scrollElement = await this.findElement(action.selector, action.timeout)
          if (!scrollElement) {
            throw new Error(`Element not found for scroll: ${action.selector}`)
          }
          scrollElement.scrollIntoView()
          break

        default:
          throw new Error(`Unknown action type: ${action.type}`)
      }

      actionResult.success = true
    } catch (error: any) {
      actionResult.error = error.message
      actionResult.success = false
    }

    actionResult.duration = Date.now() - startTime
    return actionResult
  }

  /**
   * Find element with timeout
   */
  private async findElement(selector: string, timeout: number = 5000): Promise<Element | null> {
    try {
      return await waitFor(() => {
        const element = screen.queryByText(selector) || 
                       screen.queryByLabelText(selector) ||
                       screen.queryByTestId(selector) ||
                       screen.queryByRole('button', { name: selector }) ||
                       screen.queryByRole('textbox', { name: selector })
        
        if (!element) {
          throw new Error(`Element not found: ${selector}`)
        }
        return element
      }, { timeout })
    } catch {
      return null
    }
  }

  /**
   * Wait for specified duration
   */
  private async wait(duration: number): Promise<void> {
    if (this.config.enableRealTimers) {
      await new Promise(resolve => setTimeout(resolve, duration))
    } else {
      act(() => {
        jest.advanceTimersByTime(duration)
      })
    }
  }

  /**
   * Debug current state
   */
  debug(): void {
    if (this.config.debugMode) {
      console.log('Current DOM state:')
      screen.debug()
    }
  }

  /**
   * Take screenshot of current state (for visual regression testing)
   */
  async takeScreenshot(name: string): Promise<string> {
    // This would integrate with a visual testing library
    return `screenshot-${name}-${Date.now()}.png`
  }

  /**
   * Cleanup after test
   */
  cleanup(): void {
    jest.clearAllMocks()
    if (!this.config.enableRealTimers) {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    }
  }
}

// Type definitions
export interface WorkflowStep {
  name: string
  required?: boolean
  preConditions?: ElementCondition[]
  actions: WorkflowAction[]
  postConditions?: ElementCondition[]
  waitAfter?: number
  waitFor?: number
}

export interface WorkflowAction {
  type: 'click' | 'type' | 'select' | 'wait' | 'waitFor' | 'upload' | 'scroll'
  selector: string
  value?: string
  duration?: number
  timeout?: number
  required?: boolean
}

export interface ElementCondition {
  selector: string
  timeout?: number
}

export interface WorkflowResult {
  success: boolean
  steps: StepResult[]
  errors: string[]
  duration: number
}

export interface StepResult {
  stepIndex: number
  stepName: string
  success: boolean
  error: string | null
  duration: number
  actions: ActionResult[]
}

export interface ActionResult {
  actionType: string
  success: boolean
  error: string | null
  duration: number
}

// Predefined workflow templates
export const workflowTemplates = {
  /**
   * Complete data source creation workflow
   */
  dataSourceCreation: (type: string, method: string, config: any = {}): WorkflowStep[] => [
    {
      name: 'Select Data Source Type',
      required: true,
      actions: [
        { type: 'click', selector: `${type} File` }
      ],
      postConditions: [
        { selector: 'Select Import Method' }
      ]
    },
    {
      name: 'Select Import Method',
      required: true,
      actions: [
        { type: 'click', selector: method }
      ],
      postConditions: [
        { selector: 'Configure Data Source' }
      ]
    },
    {
      name: 'Configure Data Source',
      required: true,
      actions: [
        { type: 'type', selector: 'Name', value: config.name || 'Test Data Source' },
        { type: 'type', selector: 'Description', value: config.description || 'Test description' }
      ],
      postConditions: [
        { selector: 'Review' }
      ]
    },
    {
      name: 'Review and Create',
      required: true,
      actions: [
        { type: 'click', selector: 'Review' },
        { type: 'waitFor', selector: 'Review & Create' },
        { type: 'click', selector: 'Create Data Source' }
      ]
    }
  ],

  /**
   * Plugin management workflow
   */
  pluginManagement: (): WorkflowStep[] => [
    {
      name: 'Navigate to Plugins',
      required: true,
      actions: [
        { type: 'click', selector: 'Plugins' }
      ],
      postConditions: [
        { selector: 'Plugin Manager' }
      ]
    },
    {
      name: 'View Plugin List',
      required: true,
      postConditions: [
        { selector: 'Total plugins' }
      ]
    }
  ],

  /**
   * Settings configuration workflow
   */
  settingsConfiguration: (): WorkflowStep[] => [
    {
      name: 'Navigate to Settings',
      required: true,
      actions: [
        { type: 'click', selector: 'Settings' }
      ],
      postConditions: [
        { selector: 'Application Settings' }
      ]
    },
    {
      name: 'Configure General Settings',
      required: true,
      actions: [
        { type: 'type', selector: 'Application Name', value: 'Test App' },
        { type: 'select', selector: 'Default Timezone', value: 'UTC' }
      ]
    },
    {
      name: 'Save Settings',
      required: true,
      actions: [
        { type: 'click', selector: 'Save Settings' }
      ]
    }
  ]
}

// Helper functions for common test scenarios
export const workflowHelpers = {
  /**
   * Mock API responses for workflow tests
   */
  mockApiResponses: (responses: Record<string, any>) => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      const response = responses[url]
      if (response) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(response)
        })
      }
      return Promise.reject(new Error(`No mock response for ${url}`))
    })
  },

  /**
   * Mock router navigation
   */
  mockRouter: () => {
    const mockPush = jest.fn()
    const mockBack = jest.fn()
    
    jest.mock('next/router', () => ({
      useRouter: () => ({
        push: mockPush,
        back: mockBack,
        pathname: '/',
        query: {},
        asPath: '/'
      })
    }))

    return { mockPush, mockBack }
  },

  /**
   * Create test data for workflows
   */
  createTestData: (type: string) => {
    const testData = {
      csv: {
        name: 'Test CSV Data',
        description: 'Test CSV import',
        file: new File(['name,age\nJohn,30\nJane,25'], 'test.csv', { type: 'text/csv' })
      },
      json: {
        name: 'Test JSON Data',
        description: 'Test JSON import',
        file: new File(['[{"name":"John","age":30}]'], 'test.json', { type: 'application/json' })
      },
      sql: {
        name: 'Test SQL Data',
        description: 'Test SQL import',
        content: 'CREATE TABLE users (id INT, name VARCHAR(50));'
      }
    }

    return testData[type as keyof typeof testData] || testData.csv
  }
}

export default WorkflowTestRunner
