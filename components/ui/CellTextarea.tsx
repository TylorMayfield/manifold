"use client"

import React from 'react'
import { cn } from '../../lib/utils/cn'

export interface CellTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'error' | 'success'
  inputSize?: 'sm' | 'md' | 'lg'
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

const CellTextarea = React.forwardRef<HTMLTextAreaElement, CellTextareaProps>(
  ({ className, variant = 'default', inputSize = 'md', resize = 'vertical', ...props }, ref) => {
    const baseStyles = "w-full border-2 border-black bg-white font-mono transition-all duration-100 focus:outline-none focus:shadow-cell-inset placeholder:text-gray-400"
    
    const variants = {
      default: "focus:border-black",
      error: "border-error focus:border-error",
      success: "border-success focus:border-success"
    }

    const sizes = {
      sm: "px-2 py-1 text-sm",
      md: "px-3 py-2 text-base",
      lg: "px-4 py-3 text-lg"
    }

    const resizeStyles = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize"
    }

    return (
      <textarea
        className={cn(
          baseStyles,
          variants[variant],
          sizes[inputSize],
          resizeStyles[resize],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

CellTextarea.displayName = "CellTextarea"

export default CellTextarea
