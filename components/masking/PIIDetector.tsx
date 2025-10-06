"use client";

import React, { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Download,
  Loader2,
} from 'lucide-react';
import CellButton from '../ui/CellButton';
import CellCard from '../ui/CellCard';
import StatusBadge from '../ui/StatusBadge';

interface PIIDetectionResult {
  field: string;
  piiType: string;
  confidence: number;
  sampleValues: string[];
  affectedRecords: number;
  recommendations: string[];
}

interface PIIDetectorProps {
  data: any[];
  onDetectionComplete?: (results: PIIDetectionResult[]) => void;
}

export default function PIIDetector({ data, onDetectionComplete }: PIIDetectorProps) {
  const [detecting, setDetecting] = useState(false);
  const [results, setResults] = useState<PIIDetectionResult[]>([]);
  const [showSamples, setShowSamples] = useState<Record<string, boolean>>({});

  const handleDetect = async () => {
    setDetecting(true);

    try {
      const response = await fetch('/api/masking/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          options: {
            sampleSize: 100,
            minConfidence: 0.5,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setResults(result.results);
        onDetectionComplete?.(result.results);
      } else {
        const error = await response.json();
        alert(`Detection failed: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('PII detection error:', error);
      alert('Failed to detect PII');
    } finally {
      setDetecting(false);
    }
  };

  const getPIIIcon = (piiType: string) => {
    return <Shield className="w-5 h-5" />;
  };

  const getPIIColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-red-600';
    if (confidence >= 0.7) return 'text-orange-600';
    return 'text-yellow-600';
  };

  const getSeverityBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return <StatusBadge status="failed" label="HIGH RISK" />;
    } else if (confidence >= 0.7) {
      return <StatusBadge status="paused" label="MEDIUM RISK" />;
    } else {
      return <StatusBadge status="active" label="LOW RISK" />;
    }
  };

  if (results.length === 0) {
    return (
      <CellCard className="p-6 text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-subheading font-bold mb-2">PII Detection</h3>
        <p className="text-body text-gray-600 mb-6">
          Scan your data for sensitive information like emails, phone numbers, SSNs, and more
        </p>
        <CellButton
          variant="accent"
          onClick={handleDetect}
          disabled={detecting || data.length === 0}
        >
          {detecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Scan for PII
            </>
          )}
        </CellButton>
      </CellCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <CellCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <div>
              <h3 className="font-bold text-lg">PII Detected</h3>
              <p className="text-sm text-gray-600">
                Found {results.length} fields with sensitive data
              </p>
            </div>
          </div>
          <CellButton
            variant="secondary"
            size="sm"
            onClick={handleDetect}
            disabled={detecting}
          >
            {detecting ? 'Scanning...' : 'Rescan'}
          </CellButton>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-50 p-3 rounded">
            <p className="text-xs text-gray-600 mb-1">High Risk</p>
            <p className="text-2xl font-mono font-bold text-red-600">
              {results.filter(r => r.confidence >= 0.9).length}
            </p>
          </div>
          <div className="bg-orange-50 p-3 rounded">
            <p className="text-xs text-gray-600 mb-1">Medium Risk</p>
            <p className="text-2xl font-mono font-bold text-orange-600">
              {results.filter(r => r.confidence >= 0.7 && r.confidence < 0.9).length}
            </p>
          </div>
          <div className="bg-yellow-50 p-3 rounded">
            <p className="text-xs text-gray-600 mb-1">Low Risk</p>
            <p className="text-2xl font-mono font-bold text-yellow-600">
              {results.filter(r => r.confidence < 0.7).length}
            </p>
          </div>
        </div>
      </CellCard>

      {/* Results */}
      <div className="space-y-3">
        {results.map((result, index) => (
          <CellCard key={index} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3">
                <div className={getPIIColor(result.confidence)}>
                  {getPIIIcon(result.piiType)}
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-bold">{result.field}</h4>
                    {getSeverityBadge(result.confidence)}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Type: <span className="font-mono uppercase">{result.piiType}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Confidence: <span className="font-mono">{Math.round(result.confidence * 100)}%</span>
                    {' • '}
                    Affected: <span className="font-mono">{result.affectedRecords.toLocaleString()} records</span>
                  </p>
                </div>
              </div>
              <CellButton
                variant="ghost"
                size="sm"
                onClick={() => setShowSamples(prev => ({
                  ...prev,
                  [result.field]: !prev[result.field],
                }))}
              >
                {showSamples[result.field] ? (
                  <><EyeOff className="w-4 h-4 mr-2" /> Hide</>
                ) : (
                  <><Eye className="w-4 h-4 mr-2" /> Show</>
                )}
              </CellButton>
            </div>

            {showSamples[result.field] && (
              <div className="space-y-3 mt-4 pt-4 border-t">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs font-bold text-gray-600 mb-2">Sample Values (Masked):</p>
                  <div className="space-y-1">
                    {result.sampleValues.map((sample, i) => (
                      <p key={i} className="text-sm font-mono">{sample}</p>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs font-bold text-blue-800 mb-2">Recommendations:</p>
                  <ul className="space-y-1">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-blue-800 flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CellCard>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <CellButton
          variant="ghost"
          onClick={() => {
            const csv = results.map(r =>
              `${r.field},${r.piiType},${r.confidence},${r.affectedRecords}`
            ).join('\n');
            const blob = new Blob([`Field,Type,Confidence,Affected Records\n${csv}`], {
              type: 'text/csv',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pii-detection-report.csv';
            a.click();
          }}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </CellButton>
        <CellButton variant="primary">
          Create Masking Rules
        </CellButton>
      </div>
    </div>
  );
}

