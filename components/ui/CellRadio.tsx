"use client"

import React from 'react'
import { cn } from '../../lib/utils/cn'
import { Check } from 'lucide-react'

export interface CellRadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'error' | 'success'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  description?: string
}

const CellRadio = React.forwardRef<HTMLInputElement, CellRadioProps>(
  ({ className, variant = 'default', size = 'md', label, description, ...props }, ref) => {
    const baseStyles = "border-2 border-black bg-white transition-all duration-100 focus:outline-none focus:shadow-cell-inset"
    
    const variants = {
      default: "focus:border-black checked:bg-black checked:border-black",
      error: "border-error focus:border-error checked:bg-error checked:border-error",
      success: "border-success focus:border-success checked:bg-success checked:border-success"
    }

    const sizes = {
      sm: "w-3 h-3",
      md: "w-4 h-4",
      lg: "w-5 h-5"
    }

    const radio = (
      <div className="relative">
        <input
          type="radio"
          className={cn(
            baseStyles,
            variants[variant],
            sizes[size],
            "appearance-none cursor-pointer rounded-full",
            className
          )}
          ref={ref}
          {...props}
        />
        <div className={cn(
          "absolute inset-0 rounded-full bg-white pointer-events-none flex items-center justify-center",
          size === 'sm' && "w-1 h-1",
          size === 'md' && "w-1.5 h-1.5",
          size === 'lg' && "w-2 h-2"
        )} />
      </div>
    )

    if (label || description) {
      return (
        <div className="flex items-start space-x-2">
          {radio}
          <div className="flex-1 min-w-0">
            {label && (
              <label className="text-sm font-medium text-black cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-gray-500 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      )
    }

    return radio
  }
)

CellRadio.displayName = "CellRadio"

export default CellRadio
