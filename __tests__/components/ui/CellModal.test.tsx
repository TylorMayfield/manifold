import React from 'react'
import { render, screen, fireEvent } from '../../utils/simple-test-utils'
import CellModal from '../../../components/ui/CellModal'

describe('CellModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders when isOpen is true', () => {
    render(
      <CellModal {...defaultProps}>
        <p>Modal content</p>
      </CellModal>
    )
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(
      <CellModal {...defaultProps} isOpen={false}>
        <p>Modal content</p>
      </CellModal>
    )
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn()
    render(
      <CellModal {...defaultProps} onClose={onClose}>
        <p>Modal content</p>
      </CellModal>
    )
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = jest.fn()
    render(
      <CellModal {...defaultProps} onClose={onClose}>
        <p>Modal content</p>
      </CellModal>
    )
    
    const backdrop = screen.getByTestId('modal-backdrop')
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when modal content is clicked', () => {
    const onClose = jest.fn()
    render(
      <CellModal {...defaultProps} onClose={onClose}>
        <p>Modal content</p>
      </CellModal>
    )
    
    const content = screen.getByText('Modal content')
    fireEvent.click(content)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders with different sizes', () => {
    const { rerender } = render(
      <CellModal {...defaultProps} size="sm">
        <p>Small modal</p>
      </CellModal>
    )
    expect(screen.getByTestId('modal-content')).toHaveClass('max-w-md')

    rerender(
      <CellModal {...defaultProps} size="md">
        <p>Medium modal</p>
      </CellModal>
    )
    expect(screen.getByTestId('modal-content')).toHaveClass('max-w-lg')

    rerender(
      <CellModal {...defaultProps} size="lg">
        <p>Large modal</p>
      </CellModal>
    )
    expect(screen.getByTestId('modal-content')).toHaveClass('max-w-2xl')

    rerender(
      <CellModal {...defaultProps} size="xl">
        <p>Extra large modal</p>
      </CellModal>
    )
    expect(screen.getByTestId('modal-content')).toHaveClass('max-w-4xl')
  })

  it('renders without title when not provided', () => {
    render(
      <CellModal isOpen={true} onClose={jest.fn()}>
        <p>Modal without title</p>
      </CellModal>
    )
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    expect(screen.getByText('Modal without title')).toBeInTheDocument()
  })

  it('renders with custom className', () => {
    render(
      <CellModal {...defaultProps} className="custom-modal">
        <p>Custom modal</p>
      </CellModal>
    )
    
    expect(screen.getByTestId('modal-content')).toHaveClass('custom-modal')
  })

  it('handles keyboard events', () => {
    const onClose = jest.fn()
    render(
      <CellModal {...defaultProps} onClose={onClose}>
        <p>Modal content</p>
      </CellModal>
    )
    
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('focuses on modal when opened', () => {
    render(
      <CellModal {...defaultProps}>
        <input data-testid="modal-input" />
      </CellModal>
    )
    
    const modal = screen.getByTestId('modal-content')
    expect(modal).toHaveFocus()
  })
})
