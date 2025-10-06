"use client";

import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  animated?: boolean;
  className?: string;
}

export default function ProgressBar({
  progress,
  label,
  showPercentage = true,
  size = 'md',
  color = 'blue',
  animated = true,
  className = '',
}: ProgressBarProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600',
    red: 'bg-red-600',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-600">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

// Indeterminate progress bar (for unknown duration)
export function IndeterminateProgressBar({
  label,
  color = 'blue',
  className = '',
}: {
  label?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  className?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600',
    red: 'bg-red-600',
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
      )}
      
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-2 ${colorClasses[color]} rounded-full animate-indeterminate-progress`}
          style={{ width: '40%' }}
        />
      </div>
    </div>
  );
}

// Segmented progress (for multi-step operations)
export function SegmentedProgressBar({
  segments,
  currentSegment,
  className = '',
}: {
  segments: string[];
  currentSegment: number;
  className?: string;
}) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex gap-2 mb-2">
        {segments.map((segment, index) => (
          <div
            key={index}
            className={`flex-1 text-xs text-center py-1 px-2 rounded ${
              index < currentSegment
                ? 'bg-green-100 text-green-700 font-medium'
                : index === currentSegment
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {segment}
          </div>
        ))}
      </div>
      
      <div className="flex gap-1">
        {segments.map((_, index) => (
          <div
            key={index}
            className={`flex-1 h-2 rounded-full transition-all duration-300 ${
              index < currentSegment
                ? 'bg-green-600'
                : index === currentSegment
                ? 'bg-blue-600 animate-pulse'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

