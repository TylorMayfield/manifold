"use client";

import React, { useState, useEffect } from 'react';
import CellButton from '../ui/CellButton';
import CellCard from '../ui/CellCard';
import StatusBadge from '../ui/StatusBadge';
import {
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Calendar,
  Activity,
} from 'lucide-react';

interface DataSourceRefreshPanelProps {
  dataSourceId: string;
  dataSourceName: string;
}

interface FreshnessStatus {
  isFresh: boolean;
  lastRefresh: string | null;
  ageMinutes: number;
  status: 'fresh' | 'stale' | 'critical' | 'unknown';
}

interface Version {
  version: number;
  snapshotId: string;
  createdAt: string;
  recordCount: number;
  changes?: {
    added: number;
    modified: number;
    deleted: number;
  };
}

export default function DataSourceRefreshPanel({
  dataSourceId,
  dataSourceName,
}: DataSourceRefreshPanelProps) {
  const [freshness, setFreshness] = useState<FreshnessStatus | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRefreshInfo();
  }, [dataSourceId]);

  const loadRefreshInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/data-sources/${dataSourceId}/refresh`);
      if (response.ok) {
        const data = await response.json();
        setFreshness(data.freshness);
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error('Failed to load refresh info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/data-sources/${dataSourceId}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createSnapshot: true }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Refresh result:', result);
        // Reload refresh info
        await loadRefreshInfo();
        alert(`✅ Refreshed successfully!\n\n${result.recordCount} records\nVersion ${result.newVersion}\n${result.changes?.added || 0} added, ${result.changes?.modified || 0} modified, ${result.changes?.deleted || 0} deleted`);
      } else {
        throw new Error('Refresh failed');
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      alert('❌ Failed to refresh data source. Check console for details.');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fresh':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'stale':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fresh':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'stale':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatAge = (minutes: number): string => {
    if (minutes === Infinity) return 'Never refreshed';
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <CellCard className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </CellCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Freshness Status Card */}
      <CellCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-mono flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Data Freshness
          </h3>
          <CellButton
            variant="primary"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Now'}
          </CellButton>
        </div>

        {freshness && (
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              {getStatusIcon(freshness.status)}
              <div>
                <span className={`px-3 py-1 text-sm font-mono border ${getStatusColor(freshness.status)}`}>
                  {freshness.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Last Refresh */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded border border-gray-200">
                <p className="text-xs text-gray-600 font-bold mb-1">Last Refresh</p>
                <p className="font-mono text-sm">
                  {freshness.lastRefresh
                    ? new Date(freshness.lastRefresh).toLocaleString()
                    : 'Never'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded border border-gray-200">
                <p className="text-xs text-gray-600 font-bold mb-1">Data Age</p>
                <p className="font-mono text-sm">{formatAge(freshness.ageMinutes)}</p>
              </div>
            </div>

            {/* Status Message */}
            {freshness.status === 'critical' && (
              <div className="p-3 bg-red-50 border-l-4 border-l-red-500 rounded">
                <p className="text-sm text-red-800">
                  ⚠️ Data is critically stale ({Math.floor(freshness.ageMinutes / 1440)}+ days old). Consider refreshing.
                </p>
              </div>
            )}
            {freshness.status === 'stale' && (
              <div className="p-3 bg-yellow-50 border-l-4 border-l-yellow-500 rounded">
                <p className="text-sm text-yellow-800">
                  ⏰ Data is stale ({Math.floor(freshness.ageMinutes / 60)}+ hours old). Refresh recommended.
                </p>
              </div>
            )}
            {freshness.status === 'fresh' && (
              <div className="p-3 bg-green-50 border-l-4 border-l-green-500 rounded">
                <p className="text-sm text-green-800">
                  ✓ Data is fresh and up to date!
                </p>
              </div>
            )}
          </div>
        )}
      </CellCard>

      {/* Version History Card */}
      <CellCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-mono flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Version History
          </h3>
          <span className="text-sm text-gray-600">
            {versions.length} version{versions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {versions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No version history yet</p>
            <p className="text-xs mt-1">Refresh data to create first version</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {versions.slice(0, 10).map((version, index) => (
              <div
                key={version.snapshotId}
                className={`p-4 border rounded ${
                  index === 0
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">v{version.version}</span>
                    {index === 0 && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded border border-blue-200">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(version.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">Records:</span>
                    <span className="font-mono font-bold">
                      {version.recordCount.toLocaleString()}
                    </span>
                  </div>

                  {version.changes && (
                    <>
                      {version.changes.added > 0 && (
                        <div className="flex items-center gap-1 text-green-600">
                          <span>+{version.changes.added}</span>
                        </div>
                      )}
                      {version.changes.modified > 0 && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <span>~{version.changes.modified}</span>
                        </div>
                      )}
                      {version.changes.deleted > 0 && (
                        <div className="flex items-center gap-1 text-red-600">
                          <span>-{version.changes.deleted}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CellCard>
    </div>
  );
}

