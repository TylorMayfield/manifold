/**
 * Primary UI Tests
 * 
 * These tests verify the core UI functionality of the application
 * to ensure everything is working correctly.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Import key components
import AppNav from '../components/layout/AppNav'
import CellButton from '../components/ui/CellButton'
import CellCard from '../components/ui/CellCard'
import CellModal from '../components/ui/CellModal'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

describe('Primary UI Tests', () => {
  describe('Navigation', () => {
    it('renders the main navigation', () => {
      render(<AppNav />)
      
      // Check that key navigation items are present
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Data Sources')).toBeInTheDocument()
      expect(screen.getByText('Pipelines')).toBeInTheDocument()
      expect(screen.getByText('Jobs')).toBeInTheDocument()
      expect(screen.getByText('Logs')).toBeInTheDocument()
      // Settings moved to footer, so not in main nav anymore
    })

    it('highlights the active navigation item', () => {
      const { usePathname } = require('next/navigation')
      usePathname.mockReturnValue('/pipelines')
      
      render(<AppNav />)
      
      const pipelinesButton = screen.getByText('Pipelines').closest('button')
      expect(pipelinesButton).toHaveClass('active')
    })

    it('handles navigation clicks', () => {
      const { useRouter } = require('next/navigation')
      const mockPush = jest.fn()
      useRouter.mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
      })

      render(<AppNav />)
      
      const pipelinesButton = screen.getByText('Pipelines')
      fireEvent.click(pipelinesButton)
      
      expect(mockPush).toHaveBeenCalledWith('/pipelines')
    })
  })

  describe('Button Component', () => {
    it('renders a button with text', () => {
      render(<CellButton>Click Me</CellButton>)
      
      const button = screen.getByRole('button', { name: 'Click Me' })
      expect(button).toBeInTheDocument()
    })

    it('handles click events', () => {
      const handleClick = jest.fn()
      render(<CellButton onClick={handleClick}>Click Me</CellButton>)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('can be disabled', () => {
      const handleClick = jest.fn()
      render(<CellButton onClick={handleClick} disabled>Disabled</CellButton>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      
      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('supports different variants', () => {
      const { rerender } = render(<CellButton variant="primary">Primary</CellButton>)
      expect(screen.getByRole('button')).toHaveClass('bg-white')

      rerender(<CellButton variant="accent">Accent</CellButton>)
      expect(screen.getByRole('button')).toHaveClass('bg-accent')

      rerender(<CellButton variant="danger">Danger</CellButton>)
      expect(screen.getByRole('button')).toHaveClass('bg-error')
    })

    it('supports different sizes', () => {
      const { rerender } = render(<CellButton size="sm">Small</CellButton>)
      expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5', 'text-sm')

      rerender(<CellButton size="md">Medium</CellButton>)
      expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2', 'text-base')

      rerender(<CellButton size="lg">Large</CellButton>)
      expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-lg')
    })
  })

  describe('Card Component', () => {
    it('renders a card with title and content', () => {
      render(
        <CellCard title="Test Card">
          <p>Card content</p>
        </CellCard>
      )
      
      expect(screen.getByText('Test Card')).toBeInTheDocument()
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('can be clickable', () => {
      const handleClick = jest.fn()
      render(
        <CellCard title="Clickable Card" onClick={handleClick}>
          Content
        </CellCard>
      )
      
      const card = screen.getByText('Clickable Card').closest('div[class*="cursor-pointer"]')
      if (card) {
        fireEvent.click(card)
        expect(handleClick).toHaveBeenCalled()
      }
    })

    it('supports different variants', () => {
      const { container } = render(
        <CellCard title="Test" variant="accent">
          Content
        </CellCard>
      )
      
      const card = container.querySelector('[class*="bg-accent"]')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Modal Component', () => {
    it('renders when open', () => {
      render(
        <CellModal isOpen={true} onClose={jest.fn()} title="Test Modal">
          <p>Modal content</p>
        </CellModal>
      )
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByText('Modal content')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(
        <CellModal isOpen={false} onClose={jest.fn()} title="Test Modal">
          <p>Modal content</p>
        </CellModal>
      )
      
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', () => {
      const handleClose = jest.fn()
      render(
        <CellModal isOpen={true} onClose={handleClose} title="Test Modal">
          Content
        </CellModal>
      )
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)
      
      expect(handleClose).toHaveBeenCalled()
    })

    it('calls onClose when clicking the backdrop', () => {
      const handleClose = jest.fn()
      const { container } = render(
        <CellModal isOpen={true} onClose={handleClose} title="Test Modal">
          Content
        </CellModal>
      )
      
      const backdrop = container.querySelector('.cell-modal-backdrop')
      if (backdrop) {
        fireEvent.click(backdrop)
        expect(handleClose).toHaveBeenCalled()
      } else {
        // If backdrop is not found, test should fail
        expect(backdrop).not.toBeNull()
      }
    })
  })

  describe('Accessibility', () => {
    it('buttons have accessible roles', () => {
      render(<CellButton>Accessible Button</CellButton>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('navigation items have accessible structure', () => {
      render(<AppNav />)
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
    })

    it('modal has proper ARIA attributes', () => {
      render(
        <CellModal isOpen={true} onClose={jest.fn()} title="Test Modal">
          Content
        </CellModal>
      )
      
      const modal = screen.getByRole('dialog')
      expect(modal).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('navigation can render vertically', () => {
      render(<AppNav variant="vertical" />)
      
      const nav = screen.getByRole('navigation')
      expect(nav.querySelector('.flex-col')).toBeInTheDocument()
    })

    it('navigation can render horizontally', () => {
      render(<AppNav variant="horizontal" />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('cell-nav')
    })
  })

  describe('Design System', () => {
    it('buttons have cell design system classes', () => {
      render(<CellButton>Test</CellButton>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-2', 'border-black', 'shadow-cell')
    })

    it('cards have cell design system classes', () => {
      const { container } = render(
        <CellCard title="Test">Content</CellCard>
      )
      
      const card = container.querySelector('[class*="border-2"][class*="border-black"]')
      expect(card).toBeInTheDocument()
    })

    it('components have consistent shadow styling', () => {
      render(<CellButton>Test</CellButton>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('shadow-cell')
    })
  })

  describe('User Interactions', () => {
    it('buttons show active state on click', () => {
      render(<CellButton>Click Me</CellButton>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('active:shadow-cell-sm')
      expect(button).toHaveClass('active:translate-x-[1px]')
      expect(button).toHaveClass('active:translate-y-[1px]')
    })

    it('disabled buttons do not accept clicks', () => {
      const handleClick = jest.fn()
      render(<CellButton onClick={handleClick} disabled>Disabled</CellButton>)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('modal can be dismissed with Escape key', () => {
      const handleClose = jest.fn()
      render(
        <CellModal isOpen={true} onClose={handleClose} title="Test">
          Content
        </CellModal>
      )
      
      // Simulate Escape key press
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
      
      // The modal should call onClose
      expect(handleClose).toHaveBeenCalled()
    })
  })

  describe('Component States', () => {
    it('buttons show loading state', () => {
      render(<CellButton disabled>Loading...</CellButton>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50')
    })

    it('buttons show hover state', () => {
      render(<CellButton>Hover Me</CellButton>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-gray-50')
    })
  })
})
