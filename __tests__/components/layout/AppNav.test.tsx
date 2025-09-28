import React from 'react'
import { render, screen, fireEvent } from '../../utils/simple-test-utils'
import { useRouter, usePathname } from 'next/navigation'
import AppNav from '../../../components/layout/AppNav'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn()
}))

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('AppNav', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any)
    mockUsePathname.mockReturnValue('/')
    mockPush.mockClear()
  })

  it('renders horizontal navigation by default', () => {
    render(<AppNav />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Data Sources')).toBeInTheDocument()
    expect(screen.getByText('Pipelines')).toBeInTheDocument()
    expect(screen.getByText('Jobs')).toBeInTheDocument()
    expect(screen.getByText('Webhooks')).toBeInTheDocument()
    expect(screen.getByText('Logs')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('cell-nav')
  })

  it('highlights active navigation item correctly', () => {
    mockUsePathname.mockReturnValue('/pipelines')
    render(<AppNav />)
    
    const pipelinesButton = screen.getByText('Pipelines').closest('button')
    expect(pipelinesButton).toHaveClass('active', 'bg-gray-100')
  })

  it('handles navigation clicks', () => {
    render(<AppNav />)
    
    const pipelinesButton = screen.getByText('Pipelines')
    fireEvent.click(pipelinesButton)
    
    expect(mockPush).toHaveBeenCalledWith('/pipelines')
  })

  it('renders vertical navigation when specified', () => {
    render(<AppNav variant="vertical" />)
    
    const nav = screen.getByRole('navigation')
    expect(nav.querySelector('.flex-col')).toBeInTheDocument()
  })

  it('shows descriptions when enabled', () => {
    render(<AppNav variant="vertical" showDescriptions />)
    
    expect(screen.getByText('Dashboard and overview')).toBeInTheDocument()
    expect(screen.getByText('Manage data connections')).toBeInTheDocument()
    expect(screen.getByText('Transform and process data')).toBeInTheDocument()
  })

  it('hides icons when showIcons is false', () => {
    render(<AppNav showIcons={false} />)
    
    // Icons should not be rendered
    const homeButton = screen.getByText('Home').closest('button')
    expect(homeButton?.querySelector('svg')).not.toBeInTheDocument()
  })

  it('shows icons by default', () => {
    render(<AppNav />)
    
    // Icons should be rendered
    const homeButton = screen.getByText('Home').closest('button')
    expect(homeButton?.querySelector('svg')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<AppNav className="custom-nav-class" />)
    
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('custom-nav-class')
  })

  it('handles root path active state correctly', () => {
    mockUsePathname.mockReturnValue('/')
    render(<AppNav />)
    
    const homeButton = screen.getByText('Home').closest('button')
    expect(homeButton).toHaveClass('active')
  })

  it('handles nested path active state correctly', () => {
    mockUsePathname.mockReturnValue('/pipelines/create')
    render(<AppNav />)
    
    const pipelinesButton = screen.getByText('Pipelines').closest('button')
    expect(pipelinesButton).toHaveClass('active')
    
    const homeButton = screen.getByText('Home').closest('button')
    expect(homeButton).not.toHaveClass('active')
  })

  it('renders all navigation items with correct structure', () => {
    render(<AppNav />)
    
    const navItems = [
      { text: 'Home', href: '/' },
      { text: 'Data Sources', href: '/data' },
      { text: 'Pipelines', href: '/pipelines' },
      { text: 'Jobs', href: '/jobs' },
      { text: 'Webhooks', href: '/webhooks' },
      { text: 'Logs', href: '/logs' },
      { text: 'Settings', href: '/settings' }
    ]

    navItems.forEach(({ text, href }) => {
      const button = screen.getByText(text)
      expect(button).toBeInTheDocument()
      
      fireEvent.click(button)
      expect(mockPush).toHaveBeenCalledWith(href)
    })
  })
})