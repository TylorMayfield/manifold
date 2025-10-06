"use client";

import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle, 
  XCircle,
  Clock,
  Activity,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import CellButton from '../ui/CellButton';
import CellCard from '../ui/CellCard';
import StatusBadge from '../ui/StatusBadge';

interface StepResult {
  stepId: string;
  stepName: string;
  stepType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  inputRecords: number;
  outputRecords: number;
  error?: string;
}

interface ExecutionResult {
  executionId: string;
  pipelineId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  inputRecords: number;
  outputRecords: number;
  recordsProcessed: number;
  steps: StepResult[];
  error?: string;
}

interface PipelineExecutionViewerProps {
  execution: ExecutionResult;
  onClose?: () => void;
}

export default function PipelineExecutionViewer({ execution, onClose }: PipelineExecutionViewerProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'skipped':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const statusMap: Record<string, 'active' | 'completed' | 'failed' | 'paused' | 'pending'> = {
    running: 'active',
    completed: 'completed',
    failed: 'failed',
    cancelled: 'paused',
  };

  return (
    <CellCard className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {getStatusIcon(execution.status)}
          <div>
            <h2 className="text-subheading font-bold">Pipeline Execution</h2>
            <p className="text-caption text-gray-600">
              ID: {execution.executionId.slice(0, 8)}...
            </p>
          </div>
        </div>
        <StatusBadge 
          status={statusMap[execution.status] || 'pending'} 
          label={execution.status.toUpperCase()}
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-caption font-bold text-gray-600">Input Records</p>
          <p className="text-heading font-mono">{execution.inputRecords.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-caption font-bold text-gray-600">Output Records</p>
          <p className="text-heading font-mono">{execution.outputRecords.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-caption font-bold text-gray-600">Duration</p>
          <p className="text-heading font-mono">{formatDuration(execution.duration)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-caption font-bold text-gray-600">Steps</p>
          <p className="text-heading font-mono">{execution.steps.length}</p>
        </div>
      </div>

      {/* Error Message */}
      {execution.error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-start">
            <XCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
            <div>
              <p className="font-bold text-red-800">Execution Failed</p>
              <p className="text-sm text-red-700 mt-1">{execution.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Execution Steps */}
      <div className="space-y-2">
        <h3 className="font-bold text-sm mb-3">Transformation Steps</h3>
        {execution.steps.map((step, index) => (
          <div key={step.stepId} className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Step Header */}
            <button
              onClick={() => toggleStep(step.stepId)}
              className="w-full p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                {getStepStatusIcon(step.status)}
                <div className="text-left">
                  <p className="font-bold font-mono">
                    {index + 1}. {step.stepName}
                  </p>
                  <p className="text-caption text-gray-600">
                    {step.stepType} • {step.inputRecords} → {step.outputRecords} records
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {step.duration && (
                  <span className="text-sm text-gray-600 font-mono">
                    {formatDuration(step.duration)}
                  </span>
                )}
                {expandedSteps.has(step.stepId) ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </div>
            </button>

            {/* Step Details */}
            {expandedSteps.has(step.stepId) && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-caption font-bold text-gray-700">Status</p>
                    <p className="text-sm font-mono">{step.status}</p>
                  </div>
                  <div>
                    <p className="text-caption font-bold text-gray-700">Type</p>
                    <p className="text-sm font-mono">{step.stepType}</p>
                  </div>
                  <div>
                    <p className="text-caption font-bold text-gray-700">Input Records</p>
                    <p className="text-sm font-mono">{step.inputRecords.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-caption font-bold text-gray-700">Output Records</p>
                    <p className="text-sm font-mono">{step.outputRecords.toLocaleString()}</p>
                  </div>
                  {step.startTime && (
                    <div>
                      <p className="text-caption font-bold text-gray-700">Started</p>
                      <p className="text-sm font-mono">{new Date(step.startTime).toLocaleTimeString()}</p>
                    </div>
                  )}
                  {step.endTime && (
                    <div>
                      <p className="text-caption font-bold text-gray-700">Ended</p>
                      <p className="text-sm font-mono">{new Date(step.endTime).toLocaleTimeString()}</p>
                    </div>
                  )}
                </div>
                {step.error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-700 font-mono">{step.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      {onClose && (
        <div className="mt-6 flex justify-end">
          <CellButton onClick={onClose}>
            Close
          </CellButton>
        </div>
      )}
    </CellCard>
  );
}

