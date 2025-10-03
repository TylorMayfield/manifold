"use client";

import React from 'react';
import { cn } from '../../lib/utils/cn';

export interface CellButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  isLoading?: boolean;
}

const CellButton = React.forwardRef<HTMLButtonElement, CellButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, isLoading, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium border shadow-sm hover:shadow transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded";
    
    const variants = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white border-blue-700",
      secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300",
      accent: "bg-blue-500 hover:bg-blue-600 text-white border-blue-600",
      danger: "bg-red-600 hover:bg-red-700 text-white border-red-700",
      ghost: "bg-transparent hover:bg-gray-100 text-gray-900 border-gray-300",
      success: "bg-green-600 hover:bg-green-700 text-white border-green-700"
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base"
    };

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          isLoading && "pointer-events-none",
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg 
              className="animate-spin h-4 w-4" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

CellButton.displayName = "CellButton";

export default CellButton;
