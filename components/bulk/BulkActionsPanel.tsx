"use client";

import React, { useState } from 'react';
import {
  CheckSquare,
  Trash2,
  Power,
  PowerOff,
  Download,
  Copy,
  Tag,
  Calendar,
  Play,
  X,
  AlertCircle,
} from 'lucide-react';
import CellButton from '../ui/CellButton';
import CellModal from '../ui/CellModal';
import CellInput from '../ui/CellInput';

interface BulkActionsPanelProps {
  entityType: 'data_source' | 'pipeline' | 'job' | 'snapshot';
  selectedIds: string[];
  onClearSelection: () => void;
  onActionComplete?: () => void;
}

export default function BulkActionsPanel({
  entityType,
  selectedIds,
  onClearSelection,
  onActionComplete,
}: BulkActionsPanelProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  if (selectedIds.length === 0) {
    return null;
  }

  const handleAction = async (action: string) => {
    setSelectedAction(action);
    
    // Actions that need confirmation
    if (['delete', 'disable'].includes(action)) {
      setShowConfirm(true);
      return;
    }

    await executeAction(action);
  };

  const executeAction = async (action: string) => {
    setIsExecuting(true);

    try {
      // Create bulk operation
      const response = await fetch('/api/bulk/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Bulk ${action} ${entityType}`,
          entityType,
          operationType: action,
          entityIds: selectedIds,
          options: {
            continueOnError: true,
            maxConcurrent: 5,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const operationId = data.operation.id;

        // Execute the operation
        const execResponse = await fetch(`/api/bulk/operations/${operationId}/execute`, {
          method: 'POST',
        });

        if (execResponse.ok) {
          const result = await execResponse.json();
          
          alert(`Bulk operation completed:\n- Successful: ${result.summary.successful}\n- Failed: ${result.summary.failed}`);
          
          onClearSelection();
          onActionComplete?.();
        } else {
          const error = await execResponse.json();
          alert(`Execution failed: ${error.message || error.error}`);
        }
      } else {
        const error = await response.json();
        alert(`Failed to create operation: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('Bulk operation error:', error);
      alert('Failed to perform bulk operation');
    } finally {
      setIsExecuting(false);
      setShowConfirm(false);
      setSelectedAction(null);
    }
  };

  const actions = [
    { id: 'delete', label: 'Delete', icon: Trash2, color: 'text-red-600', dangerous: true },
    { id: 'enable', label: 'Enable', icon: Power, color: 'text-green-600' },
    { id: 'disable', label: 'Disable', icon: PowerOff, color: 'text-gray-600' },
    { id: 'export', label: 'Export', icon: Download, color: 'text-blue-600' },
    { id: 'duplicate', label: 'Duplicate', icon: Copy, color: 'text-purple-600' },
    { id: 'tag', label: 'Add Tags', icon: Tag, color: 'text-yellow-600' },
  ];

  // Add entity-specific actions
  if (entityType === 'pipeline' || entityType === 'job') {
    actions.push({ id: 'execute', label: 'Execute', icon: Play, color: 'text-green-600' });
    actions.push({ id: 'schedule', label: 'Schedule', icon: Calendar, color: 'text-indigo-600' });
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white rounded-lg shadow-2xl border-2 border-blue-500 p-4 min-w-[600px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <span className="font-bold">
                {selectedIds.length} {entityType.replace('_', ' ')}(s) selected
              </span>
            </div>
            <button
              onClick={onClearSelection}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <CellButton
                  key={action.id}
                  variant={action.dangerous ? 'danger' : 'secondary'}
                  size="sm"
                  onClick={() => handleAction(action.id)}
                  disabled={isExecuting}
                >
                  <Icon className={`w-4 h-4 mr-2 ${action.color}`} />
                  {action.label}
                </CellButton>
              );
            })}
          </div>

          {isExecuting && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                Processing {selectedIds.length} items...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <CellModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Bulk Operation"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-yellow-900 mb-1">
                Are you sure?
              </h4>
              <p className="text-sm text-yellow-800">
                You are about to <strong>{selectedAction}</strong> {selectedIds.length} {entityType.replace('_', ' ')}(s).
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm font-bold mb-2">Selected items:</p>
            <p className="text-xs text-gray-600">
              {selectedIds.length} {entityType.replace('_', ' ')}(s) will be affected
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <CellButton
              variant="ghost"
              onClick={() => setShowConfirm(false)}
              disabled={isExecuting}
            >
              Cancel
            </CellButton>
            <CellButton
              variant="danger"
              onClick={() => executeAction(selectedAction!)}
              disabled={isExecuting}
            >
              {isExecuting ? 'Processing...' : `Confirm ${selectedAction}`}
            </CellButton>
          </div>
        </div>
      </CellModal>
    </>
  );
}

