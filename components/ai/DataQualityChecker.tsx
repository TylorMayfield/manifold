"use client";

import React, { useState } from 'react';
import {
  Shield,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
  TrendingUp,
  CheckCircle,
  Wrench,
} from 'lucide-react';
import CellButton from '../ui/CellButton';
import CellCard from '../ui/CellCard';
import StatusBadge from '../ui/StatusBadge';

interface DataQualityIssue {
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  column?: string;
  description: string;
  affectedRecords: number;
  suggestion?: string;
  autoFixAvailable: boolean;
}

interface DataQualityCheckerProps {
  dataSourceId: string;
  dataSourceName: string;
  onAutoFix?: (issues: DataQualityIssue[]) => void;
}

export default function DataQualityChecker({
  dataSourceId,
  dataSourceName,
  onAutoFix,
}: DataQualityCheckerProps) {
  const [checking, setChecking] = useState(false);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [issues, setIssues] = useState<DataQualityIssue[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    try {
      setChecking(true);
      setError(null);

      const response = await fetch('/api/ai/detect-quality-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataSourceId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQualityScore(data.qualityScore);
        setIssues(data.issues);
        setSummary(data.summary);
      } else {
        const error = await response.json();
        setError(error.message || error.error);
      }
    } catch (err) {
      setError('Failed to check data quality');
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-300';
      case 'error':
        return 'bg-orange-50 border-orange-300';
      case 'warning':
        return 'bg-yellow-50 border-yellow-300';
      case 'info':
        return 'bg-blue-50 border-blue-300';
      default:
        return 'bg-gray-50 border-gray-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    if (score >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="space-y-4">
      {/* Quality Checker Card */}
      <CellCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-bold text-lg">AI Data Quality Checker</h3>
              <p className="text-caption text-gray-600">
                Detect quality issues in {dataSourceName}
              </p>
            </div>
          </div>
          <CellButton
            variant="primary"
            onClick={handleCheck}
            disabled={checking}
            isLoading={checking}
          >
            {checking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Check Quality
              </>
            )}
          </CellButton>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div>
                <p className="font-bold text-red-800">Check Failed</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quality Score */}
        {qualityScore !== null && (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-caption font-bold text-gray-600 mb-2">DATA QUALITY SCORE</p>
            <div className={`inline-block px-6 py-3 rounded-lg ${getScoreColor(qualityScore)}`}>
              <p className="text-5xl font-mono font-bold mb-1">{qualityScore}</p>
              <p className="text-sm font-bold">{getScoreLabel(qualityScore)}</p>
            </div>
            
            {summary && (
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div>
                  <p className="text-caption text-gray-600">Critical</p>
                  <p className="text-2xl font-mono font-bold text-red-600">{summary.critical}</p>
                </div>
                <div>
                  <p className="text-caption text-gray-600">Errors</p>
                  <p className="text-2xl font-mono font-bold text-orange-600">{summary.errors}</p>
                </div>
                <div>
                  <p className="text-caption text-gray-600">Warnings</p>
                  <p className="text-2xl font-mono font-bold text-yellow-600">{summary.warnings}</p>
                </div>
                <div>
                  <p className="text-caption text-gray-600">Info</p>
                  <p className="text-2xl font-mono font-bold text-blue-600">{summary.info}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CellCard>

      {/* Issues List */}
      {issues.length > 0 && (
        <CellCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-lg">
              Detected Issues ({issues.length})
            </h4>
            {issues.some(i => i.autoFixAvailable) && (
              <CellButton
                variant="accent"
                size="sm"
                onClick={() => {
                  const fixable = issues.filter(i => i.autoFixAvailable);
                  if (onAutoFix) {
                    onAutoFix(fixable);
                  }
                  alert(`${fixable.length} issues can be auto-fixed`);
                }}
              >
                <Wrench className="w-4 h-4 mr-2" />
                Auto-fix ({issues.filter(i => i.autoFixAvailable).length})
              </CellButton>
            )}
          </div>

          <div className="space-y-2">
            {issues.map((issue, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}
              >
                <div className="flex items-start space-x-3">
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-sm">
                        {issue.column && <span className="font-mono">{issue.column}: </span>}
                        {issue.description}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600">
                          {issue.affectedRecords} records
                        </span>
                        {issue.autoFixAvailable && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">
                            AUTO-FIX
                          </span>
                        )}
                      </div>
                    </div>

                    {issue.suggestion && (
                      <div className="bg-white bg-opacity-50 p-3 rounded mt-2">
                        <p className="text-sm">
                          <strong>Suggestion:</strong> {issue.suggestion}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CellCard>
      )}

      {!checking && issues.length === 0 && qualityScore === null && (
        <CellCard className="p-8 text-center bg-blue-50 border-blue-200">
          <Shield className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <p className="text-body text-blue-800 mb-2">
            Click "Check Quality" to analyze your data
          </p>
          <p className="text-caption text-blue-700">
            AI will detect missing values, format issues, duplicates, outliers, and more
          </p>
        </CellCard>
      )}
    </div>
  );
}

