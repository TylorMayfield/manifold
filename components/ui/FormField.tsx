"use client"

import React from 'react'
import { cn } from '../../lib/utils/cn'

export interface FormFieldProps {
  label?: string
  error?: string
  helper?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, helper, required, children, className }, ref) => {
    return (
      <div ref={ref} className={cn("w-full space-y-1", className)}>
        {label && (
          <label className="block text-sm font-medium text-black">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        {children}
        {error && (
          <p className="text-sm text-error font-medium">
            {error}
          </p>
        )}
        {helper && !error && (
          <p className="text-sm text-gray-500">
            {helper}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = "FormField"

export default FormField
