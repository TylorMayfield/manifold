"use client"

import React from 'react'
import { cn } from '../../lib/utils/cn'
import { ChevronDown } from 'lucide-react'

export interface CellSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'error' | 'success'
  inputSize?: 'sm' | 'md' | 'lg'
  placeholder?: string
}

const CellSelect = React.forwardRef<HTMLSelectElement, CellSelectProps>(
  ({ className, variant = 'default', inputSize = 'md', placeholder, children, ...props }, ref) => {
    const baseStyles = "w-full border-2 border-black bg-white font-mono transition-all duration-100 focus:outline-none focus:shadow-cell-inset appearance-none cursor-pointer"
    
    const variants = {
      default: "focus:border-black",
      error: "border-error focus:border-error",
      success: "border-success focus:border-success"
    }

    const sizes = {
      sm: "px-2 py-1 text-sm pr-8",
      md: "px-3 py-2 text-base pr-10",
      lg: "px-4 py-3 text-lg pr-12"
    }

    return (
      <div className="relative">
        <select
          className={cn(
            baseStyles,
            variants[variant],
            sizes[inputSize],
            className
          )}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
      </div>
    )
  }
)

CellSelect.displayName = "CellSelect"

export default CellSelect
