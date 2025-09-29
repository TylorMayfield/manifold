"use client"

import React from 'react'
import { cn } from '../../lib/utils/cn'

export interface CellBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  rounded?: boolean
}

const CellBadge = React.forwardRef<HTMLDivElement, CellBadgeProps>(
  ({ className, variant = 'default', size = 'md', rounded = false, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center font-medium border-2 border-black"
    
    const variants = {
      default: "bg-white text-black",
      success: "bg-success text-white border-success",
      warning: "bg-warning text-white border-warning",
      error: "bg-error text-white border-error",
      info: "bg-info text-white border-info",
      accent: "bg-accent text-white border-accent"
    }

    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-sm",
      lg: "px-3 py-1.5 text-base"
    }

    const roundedStyles = rounded ? "rounded-full" : "rounded-sm"

    return (
      <div
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          roundedStyles,
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

CellBadge.displayName = "CellBadge"

export default CellBadge
