"use client"

import React from 'react'
import { cn } from '../../lib/utils/cn'
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react'

export interface CellAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  dismissible?: boolean
  onDismiss?: () => void
  icon?: React.ReactNode
  title?: string
  children: React.ReactNode
}

const CellAlert = React.forwardRef<HTMLDivElement, CellAlertProps>(
  ({ 
    className, 
    variant = 'info', 
    size = 'md', 
    dismissible = false, 
    onDismiss, 
    icon, 
    title, 
    children, 
    ...props 
  }, ref) => {
    const baseStyles = "border-2 border-black shadow-cell"
    
    const variants = {
      success: "bg-green-50 border-success text-success-800",
      warning: "bg-yellow-50 border-warning text-warning-800",
      error: "bg-red-50 border-error text-error-800",
      info: "bg-blue-50 border-info text-info-800"
    }

    const sizes = {
      sm: "p-3",
      md: "p-4",
      lg: "p-6"
    }

    const defaultIcons = {
      success: <CheckCircle className="w-5 h-5" />,
      warning: <AlertTriangle className="w-5 h-5" />,
      error: <AlertTriangle className="w-5 h-5" />,
      info: <Info className="w-5 h-5" />
    }

    const iconToUse = icon || defaultIcons[variant]

    return (
      <div
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          "rounded-lg",
          className
        )}
        ref={ref}
        {...props}
      >
        <div className="flex items-start">
          {iconToUse && (
            <div className="flex-shrink-0 mr-3">
              {iconToUse}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-sm font-semibold mb-1">
                {title}
              </h3>
            )}
            <div className="text-sm">
              {children}
            </div>
          </div>
          {dismissible && onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 ml-3 p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    )
  }
)

CellAlert.displayName = "CellAlert"

export default CellAlert
