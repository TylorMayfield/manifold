"use client"

import React from 'react'
import { cn } from '../../lib/utils/cn'

export interface CellStackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical'
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
  children: React.ReactNode
}

const CellStack = React.forwardRef<HTMLDivElement, CellStackProps>(
  ({ 
    className, 
    direction = 'vertical', 
    spacing = 'md', 
    align = 'stretch', 
    justify = 'start', 
    wrap = false,
    children, 
    ...props 
  }, ref) => {
    const baseStyles = "flex"
    
    const directions = {
      horizontal: "flex-row",
      vertical: "flex-col"
    }

    const spacings = {
      xs: direction === 'horizontal' ? "space-x-1" : "space-y-1",
      sm: direction === 'horizontal' ? "space-x-2" : "space-y-2",
      md: direction === 'horizontal' ? "space-x-4" : "space-y-4",
      lg: direction === 'horizontal' ? "space-x-6" : "space-y-6",
      xl: direction === 'horizontal' ? "space-x-8" : "space-y-8"
    }

    const alignments = {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch"
    }

    const justifications = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly"
    }

    return (
      <div
        className={cn(
          baseStyles,
          directions[direction],
          spacings[spacing],
          alignments[align],
          justifications[justify],
          wrap && "flex-wrap",
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

CellStack.displayName = "CellStack"

export default CellStack
