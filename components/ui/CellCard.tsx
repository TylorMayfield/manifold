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
    const baseStyles = "bg-white border-2 border-black";
    
    const variants = {
      default: "shadow-cell",
      elevated: "shadow-cell-lg",
      flat: "shadow-none",
      accent: "shadow-cell bg-accent border-black"
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
          <h3 className="text-lg font-bold mb-3 pb-3 border-b-2 border-black">
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