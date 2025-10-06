"use client";

import React, { useState } from 'react';
import {
  GitBranch,
  Plus,
  Minus,
  Edit3,
  Check,
  AlertCircle,
  Download,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import CellButton from '../ui/CellButton';
import CellCard from '../ui/CellCard';
import StatusBadge from '../ui/StatusBadge';

interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'removed' | 'modified';
  valueType: string;
  displayOldValue: string;
  displayNewValue: string;
}

interface RecordChange {
  key: string;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  before?: any;
  after?: any;
  fieldChanges?: FieldChange[];
}

interface SnapshotComparison {
  fromSnapshotId: string;
  toSnapshotId: string;
  fromVersion: number;
  toVersion: number;
  summary: {
    totalRecordsFrom: number;
    totalRecordsTo: number;
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
    changePercentage: number;
  };
  changes: RecordChange[];
  statistics: {
    totalFieldChanges: number;
    topChangedFields: Array<{ field: string; count: number }>;
    averageFieldChangesPerRecord: number;
  };
}

interface SnapshotDiffViewerProps {
  comparison: SnapshotComparison;
  fromSnapshotName?: string;
  toSnapshotName?: string;
  onClose?: () => void;
}

export default function SnapshotDiffViewer({
  comparison,
  fromSnapshotName,
  toSnapshotName,
  onClose,
}: SnapshotDiffViewerProps) {
  const [viewMode, setViewMode] = useState<'summary' | 'all' | 'added' | 'removed' | 'modified'>('summary');
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
  const [showUnchanged, setShowUnchanged] = useState(false);

  const toggleRecord = (key: string) => {
    setExpandedRecords(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getFilteredChanges = (): RecordChange[] => {
    let filtered = comparison.changes;

    switch (viewMode) {
      case 'added':
        filtered = filtered.filter(c => c.changeType === 'added');
        break;
      case 'removed':
        filtered = filtered.filter(c => c.changeType === 'removed');
        break;
      case 'modified':
        filtered = filtered.filter(c => c.changeType === 'modified');
        break;
      case 'all':
        if (!showUnchanged) {
          filtered = filtered.filter(c => c.changeType !== 'unchanged');
        }
        break;
      case 'summary':
        // Show only first 5 of each type
        const added = filtered.filter(c => c.changeType === 'added').slice(0, 5);
        const removed = filtered.filter(c => c.changeType === 'removed').slice(0, 5);
        const modified = filtered.filter(c => c.changeType === 'modified').slice(0, 5);
        filtered = [...added, ...modified, ...removed];
        break;
    }

    return filtered;
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return <Plus className="w-5 h-5 text-green-600" />;
      case 'removed':
        return <Minus className="w-5 h-5 text-red-600" />;
      case 'modified':
        return <Edit3 className="w-5 h-5 text-blue-600" />;
      case 'unchanged':
        return <Check className="w-5 h-5 text-gray-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return 'bg-green-50 border-green-300';
      case 'removed':
        return 'bg-red-50 border-red-300';
      case 'modified':
        return 'bg-blue-50 border-blue-300';
      case 'unchanged':
        return 'bg-gray-50 border-gray-300';
      default:
        return 'bg-gray-50 border-gray-300';
    }
  };

  const exportDiff = (format: 'json' | 'csv' | 'text') => {
    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'json':
        content = JSON.stringify(comparison, null, 2);
        filename = `snapshot-diff-v${comparison.fromVersion}-v${comparison.toVersion}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        // Generate CSV
        const lines = ['Key,Change Type,Field,Old Value,New Value'];
        comparison.changes.forEach(change => {
          if (change.fieldChanges) {
            change.fieldChanges.forEach(fc => {
              lines.push(`${change.key},${change.changeType},${fc.field},"${fc.displayOldValue}","${fc.displayNewValue}"`);
            });
          } else {
            lines.push(`${change.key},${change.changeType},,,`);
          }
        });
        content = lines.join('\n');
        filename = `snapshot-diff-v${comparison.fromVersion}-v${comparison.toVersion}.csv`;
        mimeType = 'text/csv';
        break;
      case 'text':
        // Generate text report
        content = `Snapshot Comparison: v${comparison.fromVersion} → v${comparison.toVersion}\n\n`;
        content += `Added: ${comparison.summary.added}\n`;
        content += `Removed: ${comparison.summary.removed}\n`;
        content += `Modified: ${comparison.summary.modified}\n`;
        content += `Unchanged: ${comparison.summary.unchanged}\n\n`;
        content += `Change Rate: ${comparison.summary.changePercentage.toFixed(1)}%\n`;
        filename = `snapshot-diff-v${comparison.fromVersion}-v${comparison.toVersion}.txt`;
        mimeType = 'text/plain';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredChanges = getFilteredChanges();

  return (
    <div className="space-y-6">
      {/* Header */}
      <CellCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <GitBranch className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-heading font-bold">Snapshot Comparison</h2>
              <p className="text-caption text-gray-600">
                Version {comparison.fromVersion} → {comparison.toVersion}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CellButton
              variant="ghost"
              size="sm"
              onClick={() => exportDiff('csv')}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </CellButton>
            <CellButton
              variant="ghost"
              size="sm"
              onClick={() => exportDiff('json')}
            >
              <Download className="w-4 h-4 mr-2" />
              JSON
            </CellButton>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-1">
              <Plus className="w-4 h-4 text-green-600" />
              <span className="text-xs font-bold text-gray-700">Added</span>
            </div>
            <p className="text-2xl font-mono font-bold text-green-700">
              {comparison.summary.added}
            </p>
            <p className="text-xs text-gray-600">new records</p>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center space-x-2 mb-1">
              <Minus className="w-4 h-4 text-red-600" />
              <span className="text-xs font-bold text-gray-700">Removed</span>
            </div>
            <p className="text-2xl font-mono font-bold text-red-700">
              {comparison.summary.removed}
            </p>
            <p className="text-xs text-gray-600">deleted records</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-1">
              <Edit3 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-gray-700">Modified</span>
            </div>
            <p className="text-2xl font-mono font-bold text-blue-700">
              {comparison.summary.modified}
            </p>
            <p className="text-xs text-gray-600">changed records</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-1">
              <Check className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-bold text-gray-700">Unchanged</span>
            </div>
            <p className="text-2xl font-mono font-bold text-gray-700">
              {comparison.summary.unchanged}
            </p>
            <p className="text-xs text-gray-600">same records</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center space-x-2 mb-1">
              <Activity className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-gray-700">Change Rate</span>
            </div>
            <p className="text-2xl font-mono font-bold text-purple-700">
              {comparison.summary.changePercentage.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-600">modified</p>
          </div>
        </div>

        {/* Field Change Statistics */}
        {comparison.statistics.totalFieldChanges > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-sm mb-3">Field Change Analysis</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-caption text-gray-600">Total Field Changes</p>
                <p className="text-lg font-mono font-bold">
                  {comparison.statistics.totalFieldChanges}
                </p>
              </div>
              <div>
                <p className="text-caption text-gray-600">Avg per Record</p>
                <p className="text-lg font-mono font-bold">
                  {comparison.statistics.averageFieldChangesPerRecord.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-caption text-gray-600">Fields Affected</p>
                <p className="text-lg font-mono font-bold">
                  {comparison.statistics.topChangedFields.length}
                </p>
              </div>
            </div>

            {/* Top Changed Fields */}
            {comparison.statistics.topChangedFields.length > 0 && (
              <div className="mt-4">
                <p className="text-caption font-bold mb-2">Most Changed Fields:</p>
                <div className="flex flex-wrap gap-2">
                  {comparison.statistics.topChangedFields.slice(0, 10).map(({ field, count }) => (
                    <span
                      key={field}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-mono"
                    >
                      {field}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CellCard>

      {/* View Mode Selector */}
      <CellCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold">View:</span>
            <div className="flex space-x-1">
              {[
                { value: 'summary', label: 'Summary', icon: Activity },
                { value: 'all', label: 'All Changes', icon: GitBranch },
                { value: 'added', label: `Added (${comparison.summary.added})`, icon: Plus },
                { value: 'removed', label: `Removed (${comparison.summary.removed})`, icon: Minus },
                { value: 'modified', label: `Modified (${comparison.summary.modified})`, icon: Edit3 },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setViewMode(value as any)}
                  className={`px-3 py-1.5 text-xs font-mono border rounded transition-all flex items-center space-x-1 ${
                    viewMode === value
                      ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {viewMode === 'all' && (
            <button
              onClick={() => setShowUnchanged(!showUnchanged)}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
            >
              {showUnchanged ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showUnchanged ? 'Hide' : 'Show'} Unchanged</span>
            </button>
          )}
        </div>
      </CellCard>

      {/* Changes List */}
      <div className="space-y-2">
        {filteredChanges.length === 0 ? (
          <CellCard className="p-12 text-center">
            <Check className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-subheading font-bold mb-2">No Changes</h3>
            <p className="text-body text-gray-600">
              {viewMode === 'summary' 
                ? 'Select a view mode to see changes'
                : 'No changes found in this category'}
            </p>
          </CellCard>
        ) : (
          filteredChanges.map((change) => (
            <CellCard
              key={change.key}
              className={`border-l-4 ${
                change.changeType === 'added' ? 'border-l-green-500' :
                change.changeType === 'removed' ? 'border-l-red-500' :
                change.changeType === 'modified' ? 'border-l-blue-500' :
                'border-l-gray-500'
              }`}
            >
              {/* Record Header */}
              <button
                onClick={() => toggleRecord(change.key)}
                className="w-full p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  {getChangeIcon(change.changeType)}
                  <div className="text-left">
                    <p className="font-bold font-mono">
                      {change.key}
                    </p>
                    <p className="text-caption text-gray-600">
                      {change.changeType.toUpperCase()}
                      {change.changeType === 'modified' && change.fieldChanges && (
                        <span> • {change.fieldChanges.length} field{change.fieldChanges.length !== 1 ? 's' : ''} changed</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <StatusBadge
                    status={
                      change.changeType === 'added' ? 'completed' :
                      change.changeType === 'removed' ? 'failed' :
                      change.changeType === 'modified' ? 'active' :
                      'paused'
                    }
                    label={change.changeType}
                  />
                  {expandedRecords.has(change.key) ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {expandedRecords.has(change.key) && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  {change.changeType === 'added' && change.after && (
                    <div>
                      <p className="text-sm font-bold mb-2 text-green-700">New Record Data:</p>
                      <div className="bg-white p-3 rounded border border-gray-200 font-mono text-sm">
                        <pre className="overflow-x-auto">{JSON.stringify(change.after, null, 2)}</pre>
                      </div>
                    </div>
                  )}

                  {change.changeType === 'removed' && change.before && (
                    <div>
                      <p className="text-sm font-bold mb-2 text-red-700">Deleted Record Data:</p>
                      <div className="bg-white p-3 rounded border border-gray-200 font-mono text-sm">
                        <pre className="overflow-x-auto">{JSON.stringify(change.before, null, 2)}</pre>
                      </div>
                    </div>
                  )}

                  {change.changeType === 'modified' && change.fieldChanges && (
                    <div>
                      <p className="text-sm font-bold mb-3 text-blue-700">
                        Field Changes ({change.fieldChanges.length}):
                      </p>
                      <div className="space-y-2">
                        {change.fieldChanges.map((fieldChange) => (
                          <div
                            key={fieldChange.field}
                            className="bg-white p-3 rounded border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono font-bold text-sm">
                                {fieldChange.field}
                              </span>
                              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {fieldChange.valueType}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Old Value:</p>
                                <div className="p-2 bg-red-50 border border-red-200 rounded">
                                  <p className="font-mono text-sm text-red-800">
                                    {fieldChange.displayOldValue || '(empty)'}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">New Value:</p>
                                <div className="p-2 bg-green-50 border border-green-200 rounded">
                                  <p className="font-mono text-sm text-green-800">
                                    {fieldChange.displayNewValue || '(empty)'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CellCard>
          ))
        )}

        {viewMode === 'summary' && filteredChanges.length > 0 && (
          <CellCard className="p-4 text-center bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-800">
              Showing preview of changes. Click <strong>"All Changes"</strong> to see complete diff.
            </p>
          </CellCard>
        )}
      </div>

      {/* Footer Actions */}
      {onClose && (
        <div className="flex justify-end space-x-3">
          <CellButton variant="ghost" onClick={onClose}>
            Close
          </CellButton>
          <CellButton
            variant="primary"
            onClick={() => exportDiff('csv')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Comparison
          </CellButton>
        </div>
      )}
    </div>
  );
}

