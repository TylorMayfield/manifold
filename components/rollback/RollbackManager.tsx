"use client";

import React, { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  Info,
  Shield,
  Database,
  History,
  Play,
} from 'lucide-react';
import CellButton from '../ui/CellButton';
import CellCard from '../ui/CellCard';
import CellModal from '../ui/CellModal';
import StatusBadge from '../ui/StatusBadge';
import LoadingSpinner from '../ui/LoadingSpinner';

interface RollbackPoint {
  id: string;
  name: string;
  description?: string;
  type: 'manual' | 'auto' | 'pre-pipeline' | 'scheduled';
  createdAt: string;
  createdBy?: string;
  scope: {
    dataSourceIds?: string[];
    pipelineIds?: string[];
    projectId: string;
  };
  state: {
    snapshots: Array<{
      dataSourceId: string;
      snapshotId: string;
      version: number;
      recordCount: number;
    }>;
  };
  metadata: {
    dataSize: number;
    itemsCaptured: number;
    captureTime: number;
  };
  expiresAt?: string;
  status: 'active' | 'expired' | 'used' | 'deleted';
}

interface RollbackManagerProps {
  projectId: string;
  dataSourceIds?: string[];
  onRollbackComplete?: () => void;
}

export default function RollbackManager({
  projectId,
  dataSourceIds,
  onRollbackComplete,
}: RollbackManagerProps) {
  const [rollbackPoints, setRollbackPoints] = useState<RollbackPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<RollbackPoint | null>(null);
  
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    expiresInDays: 30,
  });

  useEffect(() => {
    loadRollbackPoints();
  }, [projectId]);

  const loadRollbackPoints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ projectId, status: 'active' });
      const response = await fetch(`/api/rollback/points?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setRollbackPoints(data.rollbackPoints || []);
      }
    } catch (error) {
      console.error('Failed to load rollback points:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRollbackPoint = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/rollback/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          description: createForm.description,
          type: 'manual',
          scope: {
            projectId,
            dataSourceIds,
          },
          expiresInDays: createForm.expiresInDays,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowCreateModal(false);
        setCreateForm({ name: '', description: '', expiresInDays: 30 });
        await loadRollbackPoints();
      } else {
        alert(`Failed to create rollback point: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to create rollback point:', error);
      alert('Failed to create rollback point');
    } finally {
      setCreating(false);
    }
  };

  const restoreFromPoint = async (dryRun: boolean = false) => {
    if (!selectedPoint) return;

    setRestoring(true);
    try {
      const response = await fetch('/api/rollback/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollbackPointId: selectedPoint.id,
          reason: 'Manual restore',
          dryRun,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (dryRun) {
          alert(`Dry run successful! Would restore ${data.operation.restored.recordsRestored} records`);
        } else {
          setShowRestoreModal(false);
          setSelectedPoint(null);
          await loadRollbackPoints();
          if (onRollbackComplete) {
            onRollbackComplete();
          }
        }
      } else {
        alert(`Failed to restore: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to restore:', error);
      alert('Failed to restore from rollback point');
    } finally {
      setRestoring(false);
    }
  };

  const deletePoint = async (pointId: string) => {
    if (!confirm('Are you sure you want to delete this rollback point?')) {
      return;
    }

    try {
      const response = await fetch(`/api/rollback/points/${pointId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadRollbackPoints();
      }
    } catch (error) {
      console.error('Failed to delete rollback point:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'manual': return <Save className="w-4 h-4" />;
      case 'auto': return <Clock className="w-4 h-4" />;
      case 'pre-pipeline': return <Shield className="w-4 h-4" />;
      case 'scheduled': return <Database className="w-4 h-4" />;
      default: return <Save className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'manual': return 'text-blue-600';
      case 'auto': return 'text-green-600';
      case 'pre-pipeline': return 'text-purple-600';
      case 'scheduled': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <CellCard>
        <div className="flex items-center justify-center p-12">
          <LoadingSpinner size="lg" />
        </div>
      </CellCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-blue-600" />
            Rollback & Recovery
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Create rollback points and restore previous data states
          </p>
        </div>
        <CellButton
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Save className="w-4 h-4 mr-2" />
          Create Rollback Point
        </CellButton>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CellCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {rollbackPoints.length}
              </div>
              <div className="text-xs text-gray-600">Active Points</div>
            </div>
          </div>
        </CellCard>

        <CellCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {rollbackPoints.filter(p => p.type === 'pre-pipeline').length}
              </div>
              <div className="text-xs text-gray-600">Auto-Protected</div>
            </div>
          </div>
        </CellCard>

        <CellCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <History className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {rollbackPoints.reduce((sum, p) => sum + p.state.snapshots.length, 0)}
              </div>
              <div className="text-xs text-gray-600">Snapshots</div>
            </div>
          </div>
        </CellCard>

        <CellCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Database className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatFileSize(rollbackPoints.reduce((sum, p) => sum + p.metadata.dataSize, 0))}
              </div>
              <div className="text-xs text-gray-600">Total Size</div>
            </div>
          </div>
        </CellCard>
      </div>

      {/* Rollback Points List */}
      <CellCard>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Available Rollback Points
          </h3>

          {rollbackPoints.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No rollback points available</p>
              <CellButton
                variant="secondary"
                onClick={() => setShowCreateModal(true)}
              >
                Create Your First Rollback Point
              </CellButton>
            </div>
          ) : (
            <div className="space-y-4">
              {rollbackPoints.map((point) => (
                <div
                  key={point.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={getTypeColor(point.type)}>
                          {getTypeIcon(point.type)}
                        </div>
                        <h4 className="font-semibold text-gray-900">{point.name}</h4>
                        <StatusBadge
                          status={point.status === 'active' ? 'success' : 'warning'}
                          label={point.status}
                        />
                      </div>

                      {point.description && (
                        <p className="text-sm text-gray-600 mb-3">{point.description}</p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Created:</span>
                          <div className="font-medium text-gray-900">
                            {formatDate(point.createdAt)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Snapshots:</span>
                          <div className="font-medium text-gray-900">
                            {point.state.snapshots.length}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Records:</span>
                          <div className="font-medium text-gray-900">
                            {point.state.snapshots.reduce((sum, s) => sum + s.recordCount, 0).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Size:</span>
                          <div className="font-medium text-gray-900">
                            {formatFileSize(point.metadata.dataSize)}
                          </div>
                        </div>
                      </div>

                      {point.expiresAt && (
                        <div className="mt-2 text-xs text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires: {formatDate(point.expiresAt)}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <CellButton
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedPoint(point);
                          setShowRestoreModal(true);
                        }}
                        disabled={point.status !== 'active'}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Restore
                      </CellButton>
                      <CellButton
                        variant="danger"
                        size="sm"
                        onClick={() => deletePoint(point.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </CellButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CellCard>

      {/* Create Rollback Point Modal */}
      <CellModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Rollback Point"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Before major update"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Optional description of this rollback point"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expires In (days)
            </label>
            <input
              type="number"
              value={createForm.expiresInDays}
              onChange={(e) => setCreateForm({ ...createForm, expiresInDays: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="365"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">What will be captured:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Current data snapshots</li>
                  <li>Pipeline states</li>
                  <li>Schema versions</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <CellButton
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              disabled={creating}
              className="flex-1"
            >
              Cancel
            </CellButton>
            <CellButton
              variant="primary"
              onClick={createRollbackPoint}
              disabled={creating || !createForm.name}
              className="flex-1"
            >
              {creating ? 'Creating...' : 'Create Rollback Point'}
            </CellButton>
          </div>
        </div>
      </CellModal>

      {/* Restore Modal */}
      <CellModal
        isOpen={showRestoreModal}
        onClose={() => {
          setShowRestoreModal(false);
          setSelectedPoint(null);
        }}
        title="Restore from Rollback Point"
      >
        {selectedPoint && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-900">
                  <p className="font-medium mb-1">Warning: This action will:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Replace current data with the rollback point data</li>
                    <li>Restore {selectedPoint.state.snapshots.length} data sources</li>
                    <li>This operation cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Rollback Point Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">{selectedPoint.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">{formatDate(selectedPoint.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Records:</span>
                  <span className="font-medium text-gray-900">
                    {selectedPoint.state.snapshots.reduce((sum, s) => sum + s.recordCount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <CellButton
                variant="secondary"
                onClick={() => {
                  setShowRestoreModal(false);
                  setSelectedPoint(null);
                }}
                disabled={restoring}
                className="flex-1"
              >
                Cancel
              </CellButton>
              <CellButton
                variant="secondary"
                onClick={() => restoreFromPoint(true)}
                disabled={restoring}
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-1" />
                Dry Run
              </CellButton>
              <CellButton
                variant="danger"
                onClick={() => restoreFromPoint(false)}
                disabled={restoring}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                {restoring ? 'Restoring...' : 'Restore Now'}
              </CellButton>
            </div>
          </div>
        )}
      </CellModal>
    </div>
  );
}

