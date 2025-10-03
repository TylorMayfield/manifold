"use client"

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className
}) => {
  return (
    <div className="bg-white border border-gray-300 shadow-sm rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">
          {title}
        </div>
        {Icon && <Icon className="w-5 h-5 text-blue-600" />}
      </div>
      <div className="text-2xl font-bold text-gray-900 font-mono mb-1">
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-gray-600">{subtitle}</div>
      )}
    </div>
  );
};

export default StatsCard;
