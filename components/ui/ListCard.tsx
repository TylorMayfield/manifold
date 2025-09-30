"use client"

import React from "react";
import { cn } from "../../lib/utils/cn";
import CellCard from "./CellCard";

interface ListCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  metadata?: Array<{ label: string; value: React.ReactNode }>;
  children?: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  variant?: "default" | "elevated" | "flat" | "accent";
  className?: string;
}

const ListCard: React.FC<ListCardProps> = ({
  title,
  subtitle,
  icon,
  badge,
  actions,
  metadata,
  children,
  onClick,
  isActive = false,
  variant = "elevated",
  className,
}) => {
  return (
    <CellCard
      variant={isActive ? "accent" : variant}
      padding="md"
      className={cn(
        "transition-all",
        onClick && "cursor-pointer hover:shadow-cell-lg",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left side: Icon + Content */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {icon && (
            <div className="flex-shrink-0 mt-1">
              {icon}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-3 mb-1">
              {title && (
                <h3 className="text-lg font-bold text-gray-900 truncate">
                  {title}
                </h3>
              )}
              {badge && (
                <div className="flex-shrink-0">
                  {badge}
                </div>
              )}
            </div>
            
            {/* Subtitle */}
            {subtitle && (
              <p className="text-sm text-gray-600 mb-3">
                {subtitle}
              </p>
            )}
            
            {/* Metadata */}
            {metadata && metadata.length > 0 && (
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {metadata.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-gray-500 font-medium">{item.label}:</span>
                    <span className="text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Children content */}
            {children}
          </div>
        </div>
        
        {/* Right side: Actions */}
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </CellCard>
  );
};

export default ListCard;
