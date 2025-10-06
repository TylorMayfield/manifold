"use client";

import React, { useState, useEffect } from 'react';
import {
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Zap,
  Database,
  Filter,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import CellButton from '../ui/CellButton';
import CellCard from '../ui/CellCard';
import StatusBadge from '../ui/StatusBadge';

interface StepPreview {
  stepId: string;
  stepName: string;
  stepType: string;
  stepOrder: number;
  inputRecords: number;
  outputRecords: number;
  sampleOutput: any[];
  dataProfile: {
    recordCount: number;
    fieldCount: number;
    fields: Array<{
      name: string;
      type: string;
      nullable: boolean;
      uniqueValues: number;
      sampleValues: any[];
    }>;
  };
  warnings: string[];
  errors: string[];
  executionTime: number;
  status: string;
}

interface LiveDataPreviewProps {
  pipelineId: string;
  currentStepIndex?: number;
  onRefresh?: () => void;
}

export default function LiveDataPreview({ pipelineId, currentStepIndex, onRefresh }: LiveDataPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [selectedStep, setSelectedStep] = useState<number>(0);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (pipelineId) {
      loadPreview();
    }
  }, [pipelineId, currentStepIndex]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadPreview, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadPreview = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/pipelines/${pipelineId}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepIndex: currentStepIndex,
          sampleSize: 100,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreview(data.preview);
        
        // Auto-select current step
        if (currentStepIndex != null && currentStepIndex < data.preview.previewSteps.length) {
          setSelectedStep(currentStepIndex);
        }
      }
    } catch (error) {
      console.error('Failed to load preview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!preview && !loading) {
    return (
      <CellCard className="p-6 text-center">
        <Eye className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <h3 className="font-bold mb-2">Live Data Preview</h3>
        <p className="text-sm text-gray-600 mb-4">
          See sample output at each transformation step
        </p>
        <CellButton variant="accent" onClick={loadPreview}>
          <Eye className="w-4 h-4 mr-2" />
          Generate Preview
        </CellButton>
      </CellCard>
    );
  }

  if (loading && !preview) {
    return (
      <CellCard className="p-12 text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-3 text-blue-600 animate-spin" />
        <p className="text-sm text-gray-600">Generating preview...</p>
      </CellCard>
    );
  }

  const currentPreview = preview?.previewSteps[selectedStep];

  return (
    <div className="space-y-4">
      {/* Header */}
      <CellCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Eye className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold">Live Data Preview</h3>
              <p className="text-xs text-gray-600">
                Sample size: 100 records • {preview?.previewSteps.length} steps
              </p>
            </div>
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
              onClick={loadPreview}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </CellButton>
          </div>
        </div>
      </CellCard>

      {/* Step Navigator */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {preview?.previewSteps.map((step: StepPreview, index: number) => (
          <React.Fragment key={step.stepId}>
            <button
              onClick={() => setSelectedStep(index)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all ${
                selectedStep === index
                  ? 'bg-blue-50 border-blue-500 shadow-md'
                  : 'bg-white border-gray-300 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-gray-500">
                  Step {index + 1}
                </span>
                {step.status === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                ) : step.status === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>
              <p className="text-sm font-bold mt-1">{step.stepName}</p>
              <p className="text-xs text-gray-600 uppercase">{step.stepType}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs">
                  {step.inputRecords} → {step.outputRecords}
                </span>
                {step.outputRecords < step.inputRecords ? (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                ) : step.outputRecords > step.inputRecords ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : null}
              </div>
            </button>
            {index < preview.previewSteps.length - 1 && (
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Current Step Details */}
      {currentPreview && (
        <div className="space-y-4">
          {/* Step Info */}
          <CellCard className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg mb-1">{currentPreview.stepName}</h3>
                <p className="text-sm text-gray-600 uppercase">{currentPreview.stepType}</p>
              </div>
              <StatusBadge
                status={
                  currentPreview.status === 'error' ? 'failed' :
                  currentPreview.status === 'warning' ? 'paused' :
                  'active'
                }
                label={currentPreview.status.toUpperCase()}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Input Records</span>
                  <Database className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-mono font-bold text-blue-600">
                  {currentPreview.inputRecords.toLocaleString()}
                </p>
              </div>

              <div className="bg-green-50 p-3 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Output Records</span>
                  <Filter className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-2xl font-mono font-bold text-green-600">
                  {currentPreview.outputRecords.toLocaleString()}
                </p>
              </div>

              <div className="bg-purple-50 p-3 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Execution Time</span>
                  <Zap className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-2xl font-mono font-bold text-purple-600">
                  {currentPreview.executionTime}ms
                </p>
              </div>
            </div>

            {/* Warnings & Errors */}
            {currentPreview.warnings.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-yellow-900 mb-1">Warnings</p>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {currentPreview.warnings.map((warning: string, i: number) => (
                        <li key={i}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {currentPreview.errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-900 mb-1">Errors</p>
                    <ul className="text-sm text-red-800 space-y-1">
                      {currentPreview.errors.map((error: string, i: number) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CellCard>

          {/* Data Profile */}
          <CellCard className="p-4">
            <h4 className="font-bold mb-3">Output Schema ({currentPreview.dataProfile.fieldCount} fields)</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {currentPreview.dataProfile.fields.map((field: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-mono font-bold">{field.name}</span>
                    <span className="ml-2 text-xs text-gray-600 uppercase">{field.type}</span>
                    {field.nullable && (
                      <span className="ml-2 text-xs text-yellow-600">nullable</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    {field.uniqueValues} unique values
                  </div>
                </div>
              ))}
            </div>
          </CellCard>

          {/* Sample Output Data */}
          <CellCard className="p-4">
            <h4 className="font-bold mb-3">Sample Output (first 10 records)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    {currentPreview.sampleOutput.length > 0 &&
                      Object.keys(currentPreview.sampleOutput[0]).map((field: string) => (
                        <th key={field} className="text-left p-2 font-mono text-xs">
                          {field}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {currentPreview.sampleOutput.map((row: any, index: number) => (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                      {Object.values(row).map((value: any, cellIndex: number) => (
                        <td key={cellIndex} className="p-2 font-mono text-xs">
                          {value == null ? (
                            <span className="text-gray-400 italic">null</span>
                          ) : typeof value === 'object' ? (
                            <span className="text-purple-600">
                              {JSON.stringify(value).substring(0, 30)}...
                            </span>
                          ) : (
                            String(value)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CellCard>
        </div>
      )}
    </div>
  );
}

