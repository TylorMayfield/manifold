"use client"

import React from 'react'
import { cn } from '../../lib/utils/cn'

export interface CellProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
  showLabel?: boolean
  label?: string
  animated?: boolean
}

const CellProgress = React.forwardRef<HTMLDivElement, CellProgressProps>(
  ({ 
    className, 
    value, 
    max = 100, 
    size = 'md', 
    variant = 'default', 
    showLabel = false, 
    label, 
    animated = false,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    const baseStyles = "border-2 border-black bg-white overflow-hidden"
    
    const variants = {
      default: "bg-black",
      success: "bg-success",
      warning: "bg-warning",
      error: "bg-error"
    }

    const sizes = {
      sm: "h-2",
      md: "h-3",
      lg: "h-4"
    }

    const progressBarStyles = {
      default: "bg-black",
      success: "bg-success",
      warning: "bg-warning",
      error: "bg-error"
    }

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {showLabel && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-black">
              {label || 'Progress'}
            </span>
            <span className="text-sm text-gray-600 font-mono">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div
          className={cn(
            baseStyles,
            sizes[size],
            "rounded-sm"
          )}
        >
          <div
            className={cn(
              progressBarStyles[variant],
              "h-full transition-all duration-300 ease-out",
              animated && "animate-pulse"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {!showLabel && (
          <div className="text-xs text-gray-500 mt-1 text-center font-mono">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    )
  }
)

CellProgress.displayName = "CellProgress"

export default CellProgress
