import React from 'react'
import { render, screen } from '../../utils/simple-test-utils'
import { ArrowLeft, Home } from 'lucide-react'
import PageLayout from '../../../components/layout/PageLayout'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

describe('PageLayout', () => {
  const defaultProps = {
    title: 'Test Page',
    subtitle: 'Test subtitle',
    icon: Home
  }

  it('renders with required props', () => {
    render(
      <PageLayout {...defaultProps}>
        <p>Page content</p>
      </PageLayout>
    )
    
    expect(screen.getByText('Test Page')).toBeInTheDocument()
    expect(screen.getByText('Test subtitle')).toBeInTheDocument()
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })

  it('renders without subtitle', () => {
    render(
      <PageLayout title="Test Page" icon={Home}>
        <p>Page content</p>
      </PageLayout>
    )
    
    expect(screen.getByText('Test Page')).toBeInTheDocument()
    expect(screen.queryByText('Test subtitle')).not.toBeInTheDocument()
  })

  it('renders back button when showBackButton is true', () => {
    render(
      <PageLayout {...defaultProps} showBackButton={true}>
        <p>Page content</p>
      </PageLayout>
    )
    
    const backButton = screen.getByRole('button')
    expect(backButton).toBeInTheDocument()
    expect(backButton).toContainHTML('ArrowLeft')
  })

  it('does not render back button when showBackButton is false', () => {
    render(
      <PageLayout {...defaultProps} showBackButton={false}>
        <p>Page content</p>
      </PageLayout>
    )
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders navigation when showNavigation is true', () => {
    render(
      <PageLayout {...defaultProps} showNavigation={true}>
        <p>Page content</p>
      </PageLayout>
    )
    
    // Navigation should be present (check for nav element or navigation components)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders header actions when provided', () => {
    const headerActions = <button>Action Button</button>
    render(
      <PageLayout {...defaultProps} headerActions={headerActions}>
        <p>Page content</p>
      </PageLayout>
    )
    
    expect(screen.getByText('Action Button')).toBeInTheDocument()
  })

  it('renders icon correctly', () => {
    render(
      <PageLayout {...defaultProps}>
        <p>Page content</p>
      </PageLayout>
    )
    
    // Icon should be rendered (Home icon)
    const icon = screen.getByTestId('page-icon') || document.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <PageLayout {...defaultProps} className="custom-page">
        <p>Page content</p>
      </PageLayout>
    )
    
    const pageContainer = document.querySelector('.custom-page')
    expect(pageContainer).toBeInTheDocument()
  })

  it('renders children content', () => {
    render(
      <PageLayout {...defaultProps}>
        <div data-testid="page-content">
          <h2>Child Title</h2>
          <p>Child content</p>
        </div>
      </PageLayout>
    )
    
    expect(screen.getByTestId('page-content')).toBeInTheDocument()
    expect(screen.getByText('Child Title')).toBeInTheDocument()
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('handles back button click', () => {
    const mockBack = jest.fn()
    const mockPush = jest.fn()
    
    jest.doMock('next/navigation', () => ({
      useRouter: () => ({
        back: mockBack,
        push: mockPush,
        replace: jest.fn(),
      }),
    }))

    render(
      <PageLayout {...defaultProps} showBackButton={true}>
        <p>Page content</p>
      </PageLayout>
    )
    
    const backButton = screen.getByRole('button')
    backButton.click()
    
    // Should call router.back() or router.push() depending on backButtonHref
    expect(mockBack).toHaveBeenCalled()
  })

  it('uses backButtonHref when provided', () => {
    const mockPush = jest.fn()
    
    jest.doMock('next/navigation', () => ({
      useRouter: () => ({
        back: jest.fn(),
        push: mockPush,
        replace: jest.fn(),
      }),
    }))

    render(
      <PageLayout {...defaultProps} showBackButton={true} backButtonHref="/home">
        <p>Page content</p>
      </PageLayout>
    )
    
    const backButton = screen.getByRole('button')
    backButton.click()
    
    expect(mockPush).toHaveBeenCalledWith('/home')
  })
})
