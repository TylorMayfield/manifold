"use client";

import React from 'react';
import { cn } from '../../lib/utils/cn';

export interface CellCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  variant?: 'default' | 'elevated' | 'flat' | 'accent';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const CellCard = React.forwardRef<HTMLDivElement, CellCardProps>(
  ({ className, title, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const baseStyles = "bg-white text-gray-900 transition-all duration-200 rounded-lg";
    
    const variants = {
      default: "border border-gray-300 shadow-sm hover:shadow-md",
      elevated: "border border-gray-200 shadow-md hover:shadow-lg",
      flat: "border border-gray-200 shadow-none",
      accent: "border border-blue-300 shadow-sm bg-blue-50"
    };

    const paddings = {
      none: "p-0",
      sm: "p-3",
      md: "p-4",
      lg: "p-6"
    };

    return (
      <div
        className={cn(
          baseStyles,
          variants[variant],
          paddings[padding],
          className
        )}
        ref={ref}
        {...props}
      >
        {title && (
          <h3 className="text-lg font-bold mb-3 pb-3 border-b border-gray-300 text-gray-900">
            {title}
          </h3>
        )}
        {children}
      </div>
    );
  }
);

CellCard.displayName = "CellCard";

export default CellCard;