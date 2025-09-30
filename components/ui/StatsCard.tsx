"use client"

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

/**
 * StatsCard Component
 * 
 * Displays a metric with optional trend and icon.
 * 
 * Usage:
 *   <StatsCard 
 *     title="Total Jobs" 
 *     value={150}
 *     icon={Play}
 *     trend={{ value: 12, label: 'vs last week', direction: 'up' }}
 *   />
 */
const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  className
}) => {
  const variantStyles = {
    default: 'bg-white/10 border-black',
    success: 'bg-success/20 border-success',
    warning: 'bg-warning/20 border-warning',
    error: 'bg-error/20 border-error',
    info: 'bg-info/20 border-info'
  };

  const trendColors = {
    up: 'text-success',
    down: 'text-error',
    neutral: 'text-white/70'
  };

  return (
    <div
      className={cn(
        'p-6 border-2 shadow-cell rounded-lg',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium text-white/70">{title}</p>
        {Icon && (
          <Icon className="w-5 h-5 text-white/50" />
        )}
      </div>
      
      <p className="text-3xl font-bold text-white mb-2">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      
      {trend && (
        <div className="flex items-center gap-1 text-sm">
          <span className={cn('font-medium', trendColors[trend.direction])}>
            {trend.direction === 'up' && '+'}
            {trend.value}
            {typeof trend.value === 'number' && '%'}
          </span>
          <span className="text-white/50">{trend.label}</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
