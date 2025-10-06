"use client";

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
} from 'lucide-react';
import CellCard from '../ui/CellCard';

interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  unit?: string;
}

interface MetricsChartProps {
  metricName: string;
  title: string;
  unit?: string;
  thresholds?: {
    warning?: number;
    critical?: number;
  };
}

export default function MetricsChart({ metricName, title, unit, thresholds }: MetricsChartProps) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMetrics();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadMetrics, 5000);
    return () => clearInterval(interval);
  }, [metricName]);

  const loadMetrics = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/monitoring/metrics?name=${metricName}&limit=50`);
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const latestValue = metrics.length > 0 ? metrics[metrics.length - 1].value : 0;
  const previousValue = metrics.length > 1 ? metrics[metrics.length - 2].value : latestValue;
  const change = latestValue - previousValue;
  const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;

  const getTrendIcon = () => {
    if (Math.abs(changePercent) < 1) return <Minus className="w-4 h-4 text-gray-600" />;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getValueColor = () => {
    if (thresholds?.critical && latestValue >= thresholds.critical) return 'text-red-600';
    if (thresholds?.warning && latestValue >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <CellCard className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-caption font-bold text-gray-600">{title}</span>
        <BarChart3 className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="flex items-baseline space-x-2 mb-1">
        <p className={`text-heading font-mono font-bold ${getValueColor()}`}>
          {latestValue.toFixed(unit === '%' ? 1 : 0)}
        </p>
        {unit && <span className="text-sm text-gray-600">{unit}</span>}
      </div>

      <div className="flex items-center space-x-1 text-xs">
        {getTrendIcon()}
        <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
          {change >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
        </span>
        <span className="text-gray-600">vs. previous</span>
      </div>

      {/* Mini chart */}
      {metrics.length > 1 && (
        <div className="mt-3 flex items-end space-x-1 h-12">
          {metrics.slice(-20).map((metric, index) => {
            const maxValue = Math.max(...metrics.slice(-20).map(m => m.value));
            const height = maxValue > 0 ? (metric.value / maxValue) * 100 : 0;
            
            return (
              <div
                key={index}
                className={`flex-1 rounded-t ${
                  thresholds?.critical && metric.value >= thresholds.critical ? 'bg-red-500' :
                  thresholds?.warning && metric.value >= thresholds.warning ? 'bg-yellow-500' :
                  'bg-blue-500'
                } opacity-70 hover:opacity-100 transition-opacity`}
                style={{ height: `${height}%` }}
                title={`${metric.value.toFixed(2)} ${unit || ''}`}
              />
            );
          })}
        </div>
      )}
    </CellCard>
  );
}

