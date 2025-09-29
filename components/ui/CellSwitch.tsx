"use client"

import React from 'react'
import { cn } from '../../lib/utils/cn'

export interface CellSwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'error' | 'success'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  description?: string
}

const CellSwitch = React.forwardRef<HTMLInputElement, CellSwitchProps>(
  ({ className, variant = 'default', size = 'md', label, description, ...props }, ref) => {
    const baseStyles = "border-2 border-black bg-white transition-all duration-100 focus:outline-none focus:shadow-cell-inset"
    
    const variants = {
      default: "focus:border-black checked:bg-black checked:border-black",
      error: "border-error focus:border-error checked:bg-error checked:border-error",
      success: "border-success focus:border-success checked:bg-success checked:border-success"
    }

    const sizes = {
      sm: "w-8 h-4",
      md: "w-11 h-6",
      lg: "w-14 h-8"
    }

    const switchElement = (
      <div className="relative">
        <input
          type="checkbox"
          className={cn(
            baseStyles,
            variants[variant],
            sizes[size],
            "appearance-none cursor-pointer rounded-full",
            "checked:before:translate-x-full",
            "before:absolute before:top-0.5 before:left-0.5 before:bg-white before:rounded-full before:transition-transform before:duration-100",
            size === 'sm' && "before:w-3 before:h-3",
            size === 'md' && "before:w-5 before:h-5",
            size === 'lg' && "before:w-6 before:h-6",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )

    if (label || description) {
      return (
        <div className="flex items-start space-x-2">
          {switchElement}
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

    return switchElement
  }
)

CellSwitch.displayName = "CellSwitch"

export default CellSwitch
