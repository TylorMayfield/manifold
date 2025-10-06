"use client";

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Cpu,
  HardDrive,
  Zap,
  TrendingUp,
  Clock,
  Bell,
  RefreshCw,
  Server,
} from 'lucide-react';
import CellButton from '../ui/CellButton';
import CellCard from '../ui/CellCard';
import StatusBadge from '../ui/StatusBadge';

interface SystemHealth {
  status: string;
  uptime: number;
  services: Array<{
    name: string;
    status: string;
    lastCheck: Date;
    responseTime?: number;
    message?: string;
  }>;
  metrics: {
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
    errorRate?: number;
    avgPipelineExecutionTime?: number;
    failedPipelines?: number;
  };
  activeAlerts: number;
  recentAlerts: any[];
}

export default function SystemHealthDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadHealth();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadHealth, 10000); // Every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadHealth = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/monitoring/health');
      
      if (response.ok) {
        const data = await response.json();
        setHealth(data.health);
      }
    } catch (error) {
      console.error('Failed to load health:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'unhealthy':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Activity className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'unhealthy':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!health) {
    return (
      <CellCard className="p-12 text-center">
        <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="font-bold text-lg mb-2">System Health Monitor</h3>
        <p className="text-gray-600 mb-6">
          Real-time monitoring of all platform services
        </p>
        <CellButton variant="accent" onClick={loadHealth} disabled={loading}>
          {loading ? 'Loading...' : 'Load Health Status'}
        </CellButton>
      </CellCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading font-bold mb-2">System Health Monitor</h2>
          <p className="text-body text-gray-600">
            Real-time performance metrics and health checks
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span>Auto-refresh</span>
          </label>
          <CellButton
            variant="ghost"
            size="sm"
            onClick={loadHealth}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </CellButton>
        </div>
      </div>

      {/* Overall Status */}
      <CellCard className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {getStatusIcon(health.status)}
            <div>
              <h3 className="text-xl font-bold mb-1">
                System Status: <span className={getStatusColor(health.status)}>{health.status.toUpperCase()}</span>
              </h3>
              <p className="text-sm text-gray-600">
                Uptime: {formatUptime(health.uptime)} • {health.services.length} services monitored
              </p>
            </div>
          </div>
          {health.activeAlerts > 0 && (
            <div className="flex items-center space-x-2 bg-red-50 px-4 py-2 rounded">
              <Bell className="w-5 h-5 text-red-600" />
              <span className="font-bold text-red-600">{health.activeAlerts} Active Alerts</span>
            </div>
          )}
        </div>
      </CellCard>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CellCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-caption font-bold text-gray-600">CPU Usage</span>
            <Cpu className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-heading font-mono font-bold">
            {health.metrics.cpuUsage?.toFixed(1) || 0}%
          </p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                (health.metrics.cpuUsage || 0) > 80 ? 'bg-red-500' :
                (health.metrics.cpuUsage || 0) > 60 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${health.metrics.cpuUsage || 0}%` }}
            />
          </div>
        </CellCard>

        <CellCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-caption font-bold text-gray-600">Memory</span>
            <HardDrive className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-heading font-mono font-bold">
            {health.metrics.memoryUsage?.toFixed(1) || 0}%
          </p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                (health.metrics.memoryUsage || 0) > 80 ? 'bg-red-500' :
                (health.metrics.memoryUsage || 0) > 60 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${health.metrics.memoryUsage || 0}%` }}
            />
          </div>
        </CellCard>

        <CellCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-caption font-bold text-gray-600">Avg Exec Time</span>
            <Clock className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-heading font-mono font-bold">
            {health.metrics.avgPipelineExecutionTime?.toFixed(0) || 0}ms
          </p>
          <p className="text-xs text-gray-600 mt-1">Per pipeline</p>
        </CellCard>

        <CellCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-caption font-bold text-gray-600">Error Rate</span>
            <Zap className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-heading font-mono font-bold">
            {health.metrics.errorRate?.toFixed(2) || 0}%
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {health.metrics.failedPipelines || 0} failures
          </p>
        </CellCard>
      </div>

      {/* Service Health */}
      <CellCard className="p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center">
          <Server className="w-5 h-5 mr-2" />
          Service Health
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {health.services.map((service) => (
            <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                {service.status === 'healthy' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : service.status === 'degraded' ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <p className="font-bold capitalize">{service.name.replace(/-/g, ' ')}</p>
                  <p className="text-xs text-gray-600">{service.message}</p>
                </div>
              </div>
              <div className="text-right">
                <StatusBadge
                  status={
                    service.status === 'healthy' ? 'active' :
                    service.status === 'degraded' ? 'paused' :
                    'failed'
                  }
                  label={service.status.toUpperCase()}
                />
                {service.responseTime && (
                  <p className="text-xs text-gray-600 mt-1">{service.responseTime}ms</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CellCard>

      {/* Recent Alerts */}
      {health.recentAlerts.length > 0 && (
        <CellCard className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Recent Alerts
          </h3>
          <div className="space-y-2">
            {health.recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded border-l-4 ${
                  alert.severity === 'critical' ? 'bg-red-50 border-red-500' :
                  alert.severity === 'error' ? 'bg-orange-50 border-orange-500' :
                  alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold">{alert.ruleName}</p>
                    <p className="text-sm text-gray-700">{alert.message}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {!alert.acknowledged && (
                    <CellButton
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const response = await fetch(`/api/monitoring/alerts/${alert.id}/acknowledge`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: 'current-user' }),
                        });
                        if (response.ok) {
                          loadHealth();
                        }
                      }}
                    >
                      Acknowledge
                    </CellButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CellCard>
      )}
    </div>
  );
}

