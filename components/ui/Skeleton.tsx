"use client";

import React from 'react';
import { cn } from '../../lib/utils/cn';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  animate?: boolean;
}

export function Skeleton({
  className,
  width = '100%',
  height = '1rem',
  variant = 'rectangular',
  animate = true
}: SkeletonProps) {
  const baseClasses = cn(
    "bg-gray-200 border-2 border-gray-300",
    animate && "animate-pulse",
    variant === 'circular' && "rounded-full",
    variant === 'text' && "h-4 rounded-none",
    variant === 'rectangular' && ""
  );

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  return (
    <div 
      className={cn(baseClasses, className)}
      style={style}
    />
  );
}

export interface SkeletonCardProps {
  className?: string;
  lines?: number;
  showTitle?: boolean;
  showAvatar?: boolean;
}

export function SkeletonCard({
  className,
  lines = 3,
  showTitle = true,
  showAvatar = false
}: SkeletonCardProps) {
  return (
    <div className={cn("cell-card p-4 space-y-3", className)}>
      <div className="flex items-center space-x-3">
        {showAvatar && (
          <Skeleton variant="circular" width={40} height={40} />
        )}
        <div className="flex-1 space-y-2">
          {showTitle && (
            <Skeleton height="1.25rem" width="60%" />
          )}
          <Skeleton height="0.875rem" width="40%" />
        </div>
      </div>
      
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            height="0.875rem"
            width={index === lines - 1 ? "75%" : "100%"}
          />
        ))}
      </div>
    </div>
  );
}

export interface SkeletonTableProps {
  className?: string;
  rows?: number;
  columns?: number;
}

export function SkeletonTable({
  className,
  rows = 5,
  columns = 4
}: SkeletonTableProps) {
  return (
    <div className={cn("cell-table", className)}>
      {/* Header */}
      <div className="flex border-b-2 border-black">
        {Array.from({ length: columns }).map((_, index) => (
          <div 
            key={index} 
            className="flex-1 p-4 border-r-2 border-black last:border-r-0"
          >
            <Skeleton height="1rem" width="80%" />
          </div>
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex border-b-2 border-black last:border-b-0">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={colIndex} 
              className="flex-1 p-4 border-r-2 border-black last:border-r-0"
            >
              <Skeleton height="0.875rem" width={`${Math.random() * 40 + 60}%`} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Skeleton;