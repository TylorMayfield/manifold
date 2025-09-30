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
    const baseStyles = `
      font-medium font-mono relative overflow-hidden
      transition-all duration-200 ease-out
      border-2 border-black 
      shadow-cell
      hover:shadow-cell-lg hover:-translate-y-0.5
      active:shadow-cell-sm active:translate-x-[1px] active:translate-y-[1px]
      focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-black/20
      disabled:opacity-60 disabled:cursor-not-allowed 
      disabled:hover:translate-y-0 disabled:hover:shadow-cell
      disabled:active:translate-x-0 disabled:active:translate-y-0 
      disabled:active:shadow-cell
      group
    `;
    
    const variants = {
      primary: `
        bg-gradient-to-br from-gray-100 via-white to-gray-100
        hover:from-white hover:via-gray-50 hover:to-white
        text-black
        before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/40 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity
      `,
      secondary: `
        bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700
        hover:from-gray-600 hover:via-gray-500 hover:to-gray-600
        text-white border-gray-800
      `,
      accent: `
        bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700
        hover:from-blue-600 hover:via-blue-700 hover:to-blue-800
        text-white border-blue-900
        shadow-[4px_4px_0px_0px_rgba(30,58,138,1)]
        hover:shadow-[6px_6px_0px_0px_rgba(30,58,138,1)]
        active:shadow-[2px_2px_0px_0px_rgba(30,58,138,1)]
      `,
      danger: `
        bg-gradient-to-br from-red-500 via-red-600 to-red-700
        hover:from-red-600 hover:via-red-700 hover:to-red-800
        text-white border-red-900
        shadow-[4px_4px_0px_0px_rgba(127,29,29,1)]
        hover:shadow-[6px_6px_0px_0px_rgba(127,29,29,1)]
        active:shadow-[2px_2px_0px_0px_rgba(127,29,29,1)]
      `,
      success: `
        bg-gradient-to-br from-green-500 via-green-600 to-green-700
        hover:from-green-600 hover:via-green-700 hover:to-green-800
        text-white border-green-900
        shadow-[4px_4px_0px_0px_rgba(20,83,45,1)]
        hover:shadow-[6px_6px_0px_0px_rgba(20,83,45,1)]
        active:shadow-[2px_2px_0px_0px_rgba(20,83,45,1)]
      `,
      ghost: `
        bg-transparent hover:bg-gray-100/50
        text-black border-gray-300 hover:border-black
        backdrop-blur-sm
      `
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs rounded",
      md: "px-5 py-2.5 text-sm rounded-md",
      lg: "px-7 py-3.5 text-base rounded-lg"
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
          <span className="relative z-10 flex items-center justify-center gap-2">
            {children}
          </span>
        )}
      </button>
    );
  }
);

CellButton.displayName = "CellButton";

export default CellButton;