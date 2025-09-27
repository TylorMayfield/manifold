"use client";

import React from 'react';
import { cn } from '../../lib/utils/cn';

export interface CellInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'error' | 'success';
  inputSize?: 'sm' | 'md' | 'lg';
  label?: string;
  error?: string;
  helper?: string;
}

const CellInput = React.forwardRef<HTMLInputElement, CellInputProps>(
  ({ className, variant = 'default', inputSize = 'md', label, error, helper, ...props }, ref) => {
    const baseStyles = "w-full border-2 border-black bg-white font-mono transition-all duration-100 focus:outline-none focus:shadow-cell-inset placeholder:text-gray-400";
    
    const variants = {
      default: "focus:border-black",
      error: "border-error focus:border-error",
      success: "border-success focus:border-success"
    };

    const sizes = {
      sm: "px-2 py-1 text-sm",
      md: "px-3 py-2 text-base",
      lg: "px-4 py-3 text-lg"
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-black mb-1">
            {label}
          </label>
        )}
        <input
          className={cn(
            baseStyles,
            variants[variant],
            sizes[inputSize],
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-error font-medium">
            {error}
          </p>
        )}
        {helper && !error && (
          <p className="mt-1 text-sm text-gray-500">
            {helper}
          </p>
        )}
      </div>
    );
  }
);

CellInput.displayName = "CellInput";

export default CellInput;