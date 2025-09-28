import React from 'react'
import { render, screen, fireEvent } from '../../utils/simple-test-utils'
import CellButton from '../../../components/ui/CellButton'

describe('CellButton', () => {
  it('renders with default props', () => {
    render(<CellButton>Click me</CellButton>)
    
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-white', 'hover:bg-gray-50', 'text-black')
  })

  it('applies different variants correctly', () => {
    const { rerender } = render(<CellButton variant="primary">Primary</CellButton>)
    expect(screen.getByRole('button')).toHaveClass('bg-white')

    rerender(<CellButton variant="accent">Accent</CellButton>)
    expect(screen.getByRole('button')).toHaveClass('bg-accent')

    rerender(<CellButton variant="danger">Danger</CellButton>)
    expect(screen.getByRole('button')).toHaveClass('bg-error')

    rerender(<CellButton variant="ghost">Ghost</CellButton>)
    expect(screen.getByRole('button')).toHaveClass('bg-transparent')
  })

  it('applies different sizes correctly', () => {
    const { rerender } = render(<CellButton size="sm">Small</CellButton>)
    expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5', 'text-sm')

    rerender(<CellButton size="md">Medium</CellButton>)
    expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2', 'text-base')

    rerender(<CellButton size="lg">Large</CellButton>)
    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-lg')
  })

  it('handles disabled state correctly', () => {
    render(<CellButton disabled>Disabled</CellButton>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<CellButton onClick={handleClick}>Click me</CellButton>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn()
    render(<CellButton onClick={handleClick} disabled>Click me</CellButton>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<CellButton className="custom-class">Custom</CellButton>)
    
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<CellButton ref={ref}>With ref</CellButton>)
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('renders with icons and complex content', () => {
    render(
      <CellButton>
        <span data-testid="icon">📱</span>
        Button with icon
      </CellButton>
    )
    
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByText('Button with icon')).toBeInTheDocument()
  })

  it('has cell-specific styling classes', () => {
    render(<CellButton>Cell Button</CellButton>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass(
      'border-2',
      'border-black', 
      'shadow-cell',
      'active:shadow-cell-sm',
      'active:translate-x-[1px]',
      'active:translate-y-[1px]'
    )
  })
})