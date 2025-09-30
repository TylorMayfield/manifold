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
    const baseStyles = "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 text-white transition-all duration-200";
    
    const variants = {
      default: "border-gray-700 shadow-cell hover:border-gray-600",
      elevated: "border-gray-600 shadow-cell-lg hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)]",
      flat: "border-gray-700 shadow-none",
      accent: "border-blue-600 shadow-[4px_4px_0px_0px_rgba(37,99,235,0.3)] bg-gradient-to-br from-blue-900/30 via-blue-800/20 to-blue-900/30"
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
          <h3 className="text-lg font-bold font-mono mb-3 pb-3 border-b-2 border-gray-700 text-white">
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