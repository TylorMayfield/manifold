"use client"

import React from 'react';
import { Loader2, LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export interface LoadingStateProps {
  variant?: 'page' | 'inline' | 'card' | 'spinner';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  submessage?: string;
  className?: string;
}

/**
 * LoadingState Component
 * 
 * Standardized loading animations for consistent user experience.
 * 
 * Variants:
 * - page: Full-page loading (for route transitions)
 * - inline: Inline loading for sections
 * - card: Loading within a card
 * - spinner: Just the spinner icon
 * 
 * Usage:
 *   <LoadingState variant="page" message="Loading data..." />
 *   <LoadingState variant="inline" size="sm" />
 *   <LoadingState variant="card" />
 */
const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'inline',
  size = 'md',
  message = 'Loading...',
  submessage,
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const spinnerSizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-16 h-16'
  };

  // Page-level loading (full screen)
  if (variant === 'page') {
    return (
      <div className={cn('min-h-screen flex items-center justify-center bg-black', className)}>
        <div className="text-center">
          <div className="mx-auto w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-6">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{message}</h2>
          {submessage && (
            <p className="text-white/70">{submessage}</p>
          )}
        </div>
      </div>
    );
  }

  // Card loading (centered in card)
  if (variant === 'card') {
    return (
      <div className={cn('p-12 text-center', className)}>
        <Loader2 className={cn(spinnerSizes[size], 'mx-auto mb-4 animate-spin text-white/50')} />
        <p className="text-white/70">{message}</p>
        {submessage && (
          <p className="text-sm text-white/50 mt-2">{submessage}</p>
        )}
      </div>
    );
  }

  // Spinner only (no text)
  if (variant === 'spinner') {
    return (
      <Loader2 className={cn(sizeClasses[size], 'animate-spin text-white', className)} />
    );
  }

  // Inline loading (default)
  return (
    <div className={cn('flex items-center gap-3 text-white', className)}>
      <Loader2 className={cn(sizeClasses[size], 'animate-spin')} />
      {message && <span className="text-white/70">{message}</span>}
    </div>
  );
};

export default LoadingState;

/**
 * SkeletonLoader Component
 * 
 * Loading placeholder that matches content shape
 */
export interface SkeletonLoaderProps {
  type?: 'text' | 'title' | 'card' | 'list' | 'table';
  count?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'text',
  count = 1,
  className
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'title':
        return <div className="h-8 bg-white/10 rounded animate-pulse w-1/3" />;
      
      case 'text':
        return <div className="h-4 bg-white/10 rounded animate-pulse" />;
      
      case 'card':
        return (
          <div className="p-6 border-2 border-black bg-white/5 rounded animate-pulse">
            <div className="h-6 bg-white/10 rounded mb-4 w-1/2" />
            <div className="space-y-2">
              <div className="h-4 bg-white/10 rounded" />
              <div className="h-4 bg-white/10 rounded w-3/4" />
            </div>
          </div>
        );
      
      case 'list':
        return (
          <div className="flex items-center gap-4 p-4 border-2 border-black bg-white/5 rounded animate-pulse">
            <div className="w-12 h-12 bg-white/10 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-1/3" />
              <div className="h-3 bg-white/10 rounded w-1/2" />
            </div>
          </div>
        );
      
      case 'table':
        return (
          <div className="space-y-2">
            <div className="h-10 bg-white/10 rounded" />
            <div className="h-8 bg-white/10 rounded" />
            <div className="h-8 bg-white/10 rounded" />
          </div>
        );
      
      default:
        return <div className="h-4 bg-white/10 rounded animate-pulse" />;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </div>
  );
};
