"use client";

import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  X,
} from 'lucide-react';
import CellCard from '../ui/CellCard';
import CellButton from '../ui/CellButton';
import StatusBadge from '../ui/StatusBadge';

interface BulkOperation {
  id: string;
  name: string;
  entityType: string;
  operationType: string;
  status: string;
  progress: {
    total: number;
    completed: number;
    failed: number;
    percentage: number;
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
}

export default function BulkOperationMonitor() {
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [showMonitor, setShowMonitor] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadOperations();
    
    // Refresh every 2 seconds while there are active operations
    const interval = setInterval(() => {
      if (operations.some(op => op.status === 'running')) {
        loadOperations();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [operations]);

  const loadOperations = async () => {
    try {
      const response = await fetch('/api/bulk/operations');
      
      if (response.ok) {
        const data = await response.json();
        setOperations(data.operations);
        setStatistics(data.statistics);
        
        // Show monitor if there are active operations
        if (data.operations.some((op: BulkOperation) => op.status === 'running' || op.status === 'pending')) {
          setShowMonitor(true);
        }
      }
    } catch (error) {
      console.error('Failed to load operations:', error);
    }
  };

  const handleCancel = async (operationId: string) => {
    try {
      const response = await fetch(`/api/bulk/operations/${operationId}/cancel`, {
        method: 'POST',
      });

      if (response.ok) {
        loadOperations();
      }
    } catch (error) {
      console.error('Failed to cancel operation:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'partial':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const activeOperations = operations.filter(op => op.status === 'running' || op.status === 'pending');
  const completedOperations = operations.filter(op => op.status !== 'running' && op.status !== 'pending');

  if (!showMonitor && activeOperations.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-md">
      <CellCard className="p-4 shadow-2xl border-2 border-blue-500">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold">Bulk Operations</h3>
          </div>
          <button
            onClick={() => setShowMonitor(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-blue-50 p-2 rounded text-center">
              <p className="text-xs text-gray-600">Running</p>
              <p className="text-xl font-mono font-bold text-blue-600">
                {statistics.running}
              </p>
            </div>
            <div className="bg-green-50 p-2 rounded text-center">
              <p className="text-xs text-gray-600">Completed</p>
              <p className="text-xl font-mono font-bold text-green-600">
                {statistics.completed}
              </p>
            </div>
            <div className="bg-red-50 p-2 rounded text-center">
              <p className="text-xs text-gray-600">Failed</p>
              <p className="text-xl font-mono font-bold text-red-600">
                {statistics.failed}
              </p>
            </div>
          </div>
        )}

        {/* Active Operations */}
        {activeOperations.length > 0 && (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activeOperations.map((operation) => (
              <div
                key={operation.id}
                className="bg-white border rounded p-3 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2">
                    {getStatusIcon(operation.status)}
                    <div>
                      <p className="font-bold text-sm">{operation.name}</p>
                      <p className="text-xs text-gray-600">
                        {operation.operationType} • {operation.entityType}
                      </p>
                    </div>
                  </div>
                  <StatusBadge
                    status={operation.status === 'running' ? 'active' : 'paused'}
                    label={operation.status.toUpperCase()}
                  />
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>
                      {operation.progress.completed} / {operation.progress.total}
                    </span>
                    <span className="font-bold">{operation.progress.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${operation.progress.percentage}%` }}
                    />
                  </div>
                  {operation.progress.failed > 0 && (
                    <p className="text-xs text-red-600">
                      {operation.progress.failed} failed
                    </p>
                  )}
                </div>

                {operation.status === 'running' && (
                  <CellButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancel(operation.id)}
                  >
                    Cancel
                  </CellButton>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Recent Completed */}
        {completedOperations.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-bold text-gray-600 mb-2">
              Recent Completed
            </p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {completedOperations.slice(0, 3).map((operation) => (
                <div
                  key={operation.id}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(operation.status)}
                    <span className="truncate">{operation.name}</span>
                  </div>
                  <span className="text-gray-500">
                    {operation.progress.completed}/{operation.progress.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <CellButton
            variant="ghost"
            size="sm"
            onClick={loadOperations}
            className="w-full"
          >
            Refresh
          </CellButton>
        </div>
      </CellCard>
    </div>
  );
}

