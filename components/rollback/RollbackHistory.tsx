"use client";

import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import CellCard from '../ui/CellCard';
import StatusBadge from '../ui/StatusBadge';
import LoadingSpinner from '../ui/LoadingSpinner';

interface RollbackOperation {
  id: string;
  rollbackPointId: string;
  startedAt: string;
  completedAt?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'partial';
  restored: {
    dataSources: string[];
    snapshots: string[];
    recordsRestored: number;
  };
  duration?: number;
  errors?: Array<{
    dataSourceId: string;
    error: string;
  }>;
  initiatedBy?: string;
  reason?: string;
}

interface RollbackHistoryProps {
  rollbackPointId?: string;
  limit?: number;
}

export default function RollbackHistory({
  rollbackPointId,
  limit = 20,
}: RollbackHistoryProps) {
  const [history, setHistory] = useState<RollbackOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadHistory();
  }, [rollbackPointId, limit]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (rollbackPointId) {
        params.append('rollbackPointId', rollbackPointId);
      }

      const response = await fetch(`/api/rollback/history?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to load rollback history:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'in-progress':
      case 'pending':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string): 'success' | 'error' | 'warning' | 'info' => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'partial': return 'warning';
      default: return 'info';
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
    <CellCard>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600" />
          Rollback History
        </h3>

        {history.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No rollback operations yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((operation) => {
              const isExpanded = expandedIds.has(operation.id);
              
              return (
                <div
                  key={operation.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpanded(operation.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(operation.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              Rollback Operation
                            </span>
                            <StatusBadge
                              status={getStatusVariant(operation.status)}
                              label={operation.status}
                            />
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Started: {formatDate(operation.startedAt)}</div>
                            {operation.completedAt && (
                              <div>
                                Completed: {formatDate(operation.completedAt)}
                                {operation.duration && (
                                  <span className="ml-2 text-gray-500">
                                    ({formatDuration(operation.duration)})
                                  </span>
                                )}
                              </div>
                            )}
                            {operation.reason && (
                              <div className="italic">Reason: {operation.reason}</div>
                            )}
                          </div>

                          <div className="flex gap-4 mt-2 text-sm">
                            <div>
                              <span className="text-gray-600">Data Sources: </span>
                              <span className="font-medium text-gray-900">
                                {operation.restored.dataSources.length}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Records: </span>
                              <span className="font-medium text-gray-900">
                                {operation.restored.recordsRestored.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <div className="space-y-4">
                        {/* Restored Items */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Restored Data Sources
                          </h4>
                          <div className="bg-white rounded border border-gray-200 p-3">
                            {operation.restored.dataSources.length === 0 ? (
                              <p className="text-sm text-gray-600">No data sources restored</p>
                            ) : (
                              <ul className="space-y-1">
                                {operation.restored.dataSources.map((dsId, idx) => (
                                  <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                    {dsId}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>

                        {/* Errors */}
                        {operation.errors && operation.errors.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">
                              Errors
                            </h4>
                            <div className="bg-red-50 rounded border border-red-200 p-3">
                              <ul className="space-y-2">
                                {operation.errors.map((error, idx) => (
                                  <li key={idx} className="text-sm">
                                    <div className="font-medium text-red-900">
                                      {error.dataSourceId}
                                    </div>
                                    <div className="text-red-700">{error.error}</div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Operation Details
                          </h4>
                          <div className="bg-white rounded border border-gray-200 p-3 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <span className="text-gray-600">Operation ID:</span>
                                <div className="font-mono text-xs text-gray-900 mt-1">
                                  {operation.id}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600">Rollback Point:</span>
                                <div className="font-mono text-xs text-gray-900 mt-1">
                                  {operation.rollbackPointId}
                                </div>
                              </div>
                              {operation.initiatedBy && (
                                <div>
                                  <span className="text-gray-600">Initiated By:</span>
                                  <div className="text-gray-900 mt-1">
                                    {operation.initiatedBy}
                                  </div>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-600">Snapshots:</span>
                                <div className="text-gray-900 mt-1">
                                  {operation.restored.snapshots.length}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CellCard>
  );
}

