import React from 'react'
import { render, screen } from '../../utils/simple-test-utils'
import CellCard from '../../../components/ui/CellCard'

describe('CellCard', () => {
  it('renders with default props', () => {
    render(<CellCard>Card content</CellCard>)
    
    const card = screen.getByText('Card content')
    expect(card).toBeInTheDocument()
    expect(card.parentElement).toHaveClass('bg-white', 'border-2', 'border-black', 'shadow-cell')
  })

  it('applies custom className', () => {
    render(<CellCard className="custom-class">Custom card</CellCard>)
    
    const card = screen.getByText('Custom card').parentElement
    expect(card).toHaveClass('custom-class')
  })

  it('renders with different padding variants', () => {
    const { rerender } = render(<CellCard padding="sm">Small padding</CellCard>)
    expect(screen.getByText('Small padding').parentElement).toHaveClass('p-2')

    rerender(<CellCard padding="md">Medium padding</CellCard>)
    expect(screen.getByText('Medium padding').parentElement).toHaveClass('p-4')

    rerender(<CellCard padding="lg">Large padding</CellCard>)
    expect(screen.getByText('Large padding').parentElement).toHaveClass('p-6')
  })

  it('renders with hover effects', () => {
    render(<CellCard hoverable>Hoverable card</CellCard>)
    
    const card = screen.getByText('Hoverable card').parentElement
    expect(card).toHaveClass('hover:bg-gray-50', 'transition-colors', 'duration-200')
  })

  it('renders as different HTML elements', () => {
    const { rerender } = render(<CellCard as="section">Section card</CellCard>)
    expect(screen.getByText('Section card').parentElement?.tagName).toBe('SECTION')

    rerender(<CellCard as="article">Article card</CellCard>)
    expect(screen.getByText('Article card').parentElement?.tagName).toBe('ARTICLE')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<CellCard ref={ref}>Card with ref</CellCard>)
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('renders complex content', () => {
    render(
      <CellCard>
        <h2>Card Title</h2>
        <p>Card description</p>
        <button>Action</button>
      </CellCard>
    )
    
    expect(screen.getByText('Card Title')).toBeInTheDocument()
    expect(screen.getByText('Card description')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
