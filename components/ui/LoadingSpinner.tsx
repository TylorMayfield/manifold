"use client";

import React from 'react';
import { cn } from '../../lib/utils/cn';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  variant?: 'primary' | 'secondary' | 'accent';
}

export default function LoadingSpinner({
  className,
  size = 'md',
  text,
  variant = 'primary'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    primary: 'text-gray-600',
    secondary: 'text-gray-400',
    accent: 'text-accent'
  };

  if (text) {
    return (
      <div className={cn("flex items-center justify-center space-x-2", className)}>
        <Loader2 
          className={cn(
            "animate-spin",
            sizeClasses[size],
            colorClasses[variant]
          )} 
        />
        <span className="text-sm font-medium text-gray-600">{text}</span>
      </div>
    );
  }

  return (
    <Loader2 
      className={cn(
        "animate-spin",
        sizeClasses[size],
        colorClasses[variant],
        className
      )} 
    />
  );
}