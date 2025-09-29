"use client"

import React from 'react'
import { cn } from '../../lib/utils/cn'

export interface CellGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
}

const CellGrid = React.forwardRef<HTMLDivElement, CellGridProps>(
  ({ className, cols = 1, gap = 'md', children, ...props }, ref) => {
    const baseStyles = "grid"
    
    const columnStyles = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
      6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
      12: "grid-cols-12"
    }

    const gaps = {
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8"
    }

    return (
      <div
        className={cn(
          baseStyles,
          columnStyles[cols],
          gaps[gap],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CellGrid.displayName = "CellGrid"

export default CellGrid
