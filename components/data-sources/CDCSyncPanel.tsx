"use client";

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Database,
  Zap,
  Settings,
  RotateCcw,
} from 'lucide-react';
import CellButton from '../ui/CellButton';
import CellCard from '../ui/CellCard';
import StatusBadge from '../ui/StatusBadge';
import ProgressBar from '../ui/ProgressBar';
import LoadingOverlay from '../ui/LoadingOverlay';

interface CDCWatermark {
  dataSourceId: string;
  lastSyncTimestamp: Date;
  lastSyncVersion?: number;
  recordsProcessed: number;
}

interface CDCSyncPanelProps {
  dataSourceId: string;
  dataSourceName: string;
  onSyncComplete?: () => void;
}

export default function CDCSyncPanel({
  dataSourceId,
  dataSourceName,
  onSyncComplete,
}: CDCSyncPanelProps) {
  const [watermark, setWatermark] = useState<CDCWatermark | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);
  const [showConfig, setShowConfig] = useState(false);

  // CDC Configuration
  const [cdcConfig, setCdcConfig] = useState({
    trackingMode: 'hash' as 'timestamp' | 'hash' | 'version',
    primaryKey: 'id',
    timestampColumn: 'updated_at',
    enableDeletes: true,
  });

  useEffect(() => {
    loadWatermark();
  }, [dataSourceId]);

  const loadWatermark = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/data-sources/${dataSourceId}/sync-incremental`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.hasWatermark) {
          setWatermark(data.watermark);
        }
      }
    } catch (error) {
      console.error('Failed to load watermark:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIncrementalSync = async () => {
    try {
      setSyncing(true);
      
      // This would normally fetch new data from the source
      // For demo, we'll use mock data
      const newData = await fetchNewDataFromSource();

      const response = await fetch(`/api/data-sources/${dataSourceId}/sync-incremental`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newData,
          cdcConfig,
          mergeStrategy: {
            onConflict: 'source-wins',
            softDelete: false,
            auditChanges: true,
          },
        }),
      });

      setSyncProgress(70);

      if (response.ok) {
        const result = await response.json();
        setSyncProgress(100);
        setLastSyncResult(result.syncResult);
        setWatermark(result.syncResult.watermark);
        
        if (onSyncComplete) {
          onSyncComplete();
        }

        alert(`Incremental sync completed!\n\n` +
          `✓ ${result.syncResult.changeSet.inserts} inserts\n` +
          `↻ ${result.syncResult.changeSet.updates} updates\n` +
          `✗ ${result.syncResult.changeSet.deletes} deletes\n` +
          `→ ${result.syncResult.changeSet.unchanged} unchanged\n\n` +
          `Total records: ${result.syncResult.totalRecords}`
        );
      } else {
        const error = await response.json();
        alert(`Sync failed: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('Incremental sync error:', error);
      alert('Failed to perform incremental sync');
    } finally {
      setSyncing(false);
      setSyncProgress(0);
    }
  };

  const handleResetWatermark = async () => {
    if (!confirm('Reset watermark? This will force a full reload on the next sync.')) {
      return;
    }

    try {
      const response = await fetch(`/api/data-sources/${dataSourceId}/sync-incremental`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWatermark(null);
        setLastSyncResult(null);
        alert('Watermark reset successfully');
      }
    } catch (error) {
      console.error('Failed to reset watermark:', error);
      alert('Failed to reset watermark');
    }
  };

  // Mock function to simulate fetching new data
  const fetchNewDataFromSource = async (): Promise<any[]> => {
    // In a real implementation, this would fetch from the actual data source
    // with filters based on the watermark
    return [];
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <LoadingOverlay
        isLoading={syncing}
        message="Syncing data..."
        progress={syncProgress}
        showProgress={true}
      >
        {/* CDC Status Card */}
        <CellCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-bold text-lg">Incremental Sync (CDC)</h3>
              <p className="text-caption text-gray-600">
                Change Data Capture for {dataSourceName}
              </p>
            </div>
          </div>
          <CellButton
            variant="ghost"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings className="w-4 h-4" />
          </CellButton>
        </div>

        {/* Configuration Panel */}
        {showConfig && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <h4 className="font-bold text-sm">CDC Configuration</h4>
            
            <div>
              <label className="block text-sm font-bold mb-2">Tracking Mode</label>
              <select
                value={cdcConfig.trackingMode}
                onChange={(e) => setCdcConfig(prev => ({
                  ...prev,
                  trackingMode: e.target.value as any
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="hash">Hash-based (Compare all fields)</option>
                <option value="timestamp">Timestamp-based (Use timestamp column)</option>
                <option value="version">Version-based (Use version number)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">Primary Key</label>
                <input
                  type="text"
                  value={cdcConfig.primaryKey}
                  onChange={(e) => setCdcConfig(prev => ({
                    ...prev,
                    primaryKey: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="id"
                />
              </div>

              {cdcConfig.trackingMode === 'timestamp' && (
                <div>
                  <label className="block text-sm font-bold mb-2">Timestamp Column</label>
                  <input
                    type="text"
                    value={cdcConfig.timestampColumn}
                    onChange={(e) => setCdcConfig(prev => ({
                      ...prev,
                      timestampColumn: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="updated_at"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableDeletes"
                checked={cdcConfig.enableDeletes}
                onChange={(e) => setCdcConfig(prev => ({
                  ...prev,
                  enableDeletes: e.target.checked
                }))}
                className="mr-2"
              />
              <label htmlFor="enableDeletes" className="text-sm">
                Enable delete detection
              </label>
            </div>
          </div>
        )}

        {/* Watermark Info */}
        {watermark ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-green-600" />
                <StatusBadge status="active" label="ACTIVE" />
              </div>
              <p className="text-caption font-bold text-gray-700">Last Sync</p>
              <p className="text-sm font-mono text-gray-900">
                {formatDate(watermark.lastSyncTimestamp)}
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <Database className="w-5 h-5 text-blue-600 mb-2" />
              <p className="text-caption font-bold text-gray-700">Records Processed</p>
              <p className="text-heading font-mono text-gray-900">
                {watermark.recordsProcessed.toLocaleString()}
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <Zap className="w-5 h-5 text-purple-600 mb-2" />
              <p className="text-caption font-bold text-gray-700">Sync Mode</p>
              <p className="text-sm font-mono font-bold text-gray-900">
                INCREMENTAL
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <p className="font-bold text-yellow-800">No Watermark Found</p>
                <p className="text-sm text-yellow-700 mt-1">
                  The next sync will be a full load. After the first sync, incremental mode will be enabled.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Last Sync Result */}
        {lastSyncResult && (
          <div className="mb-6">
            <h4 className="font-bold text-sm mb-3">Last Sync Results</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-bold text-gray-700">Inserts</span>
                </div>
                <p className="text-lg font-mono font-bold text-green-700">
                  {lastSyncResult.changeSet.inserts}
                </p>
                <p className="text-xs text-gray-600">
                  {lastSyncResult.statistics.insertRate.toFixed(1)}%
                </p>
              </div>

              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <div className="flex items-center space-x-2 mb-1">
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-gray-700">Updates</span>
                </div>
                <p className="text-lg font-mono font-bold text-blue-700">
                  {lastSyncResult.changeSet.updates}
                </p>
                <p className="text-xs text-gray-600">
                  {lastSyncResult.statistics.updateRate.toFixed(1)}%
                </p>
              </div>

              <div className="bg-red-50 p-3 rounded border border-red-200">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-bold text-gray-700">Deletes</span>
                </div>
                <p className="text-lg font-mono font-bold text-red-700">
                  {lastSyncResult.changeSet.deletes}
                </p>
                <p className="text-xs text-gray-600">
                  {lastSyncResult.statistics.deleteRate.toFixed(1)}%
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-gray-600" />
                  <span className="text-xs font-bold text-gray-700">Unchanged</span>
                </div>
                <p className="text-lg font-mono font-bold text-gray-700">
                  {lastSyncResult.changeSet.unchanged}
                </p>
                <p className="text-xs text-gray-600">
                  {lastSyncResult.statistics.unchangedRate.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="mt-3 text-sm text-gray-600">
              <p>
                <strong>Duration:</strong> {lastSyncResult.duration}ms •{' '}
                <strong>Total Records:</strong> {lastSyncResult.totalRecords.toLocaleString()} •{' '}
                <strong>Version:</strong> {lastSyncResult.version}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <CellButton
            variant="primary"
            onClick={handleIncrementalSync}
            disabled={syncing || loading}
            isLoading={syncing}
          >
            {syncing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 mr-2" />
                Run Incremental Sync
              </>
            )}
          </CellButton>

          {watermark && (
            <CellButton
              variant="secondary"
              onClick={handleResetWatermark}
              disabled={syncing || loading}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Watermark
            </CellButton>
          )}

          <CellButton
            variant="ghost"
            onClick={loadWatermark}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </CellButton>
        </div>
      </CellCard>

      {/* Info Card */}
      <CellCard className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-bold mb-1">About Incremental Sync (CDC)</p>
            <p>
              Change Data Capture synchronizes only new, modified, or deleted records instead of reloading all data.
              This dramatically improves sync performance for large datasets.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Hash-based:</strong> Compares record hashes to detect changes</li>
              <li><strong>Timestamp-based:</strong> Uses timestamp column for change detection</li>
              <li><strong>Version-based:</strong> Uses version numbers to track changes</li>
            </ul>
          </div>
        </div>
      </CellCard>
      </LoadingOverlay>
    </div>
  );
}

