"use client";

import React from 'react';
import { cn } from '../../lib/utils/cn';

export interface CellButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const CellButton = React.forwardRef<HTMLButtonElement, CellButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    const baseStyles = "font-medium transition-all duration-100 border-2 border-black shadow-cell active:shadow-cell-sm active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-cell";
    
    const variants = {
      primary: "bg-white hover:bg-gray-50 text-black",
      secondary: "bg-gray-100 hover:bg-gray-200 text-black",
      accent: "bg-accent hover:bg-accent-600 text-white border-accent-700",
      danger: "bg-error hover:bg-red-600 text-white border-red-700",
      ghost: "bg-transparent hover:bg-gray-50 text-black border-transparent hover:border-black"
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg"
    };

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

CellButton.displayName = "CellButton";

export default CellButton;