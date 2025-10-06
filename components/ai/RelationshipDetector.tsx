"use client";

import React, { useState } from 'react';
import {
  GitBranch,
  Zap,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Database,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import CellButton from '../ui/CellButton';
import CellCard from '../ui/CellCard';
import StatusBadge from '../ui/StatusBadge';

interface RelationshipSuggestion {
  sourceTable: string;
  targetTable: string;
  sourceColumn: string;
  targetColumn: string;
  confidence: number;
  relationshipType: string;
  reasoning: string;
  evidence: {
    nameSimilarity: number;
    dataTypeSimilarity: number;
    valueOverlap: number;
    foreignKeyPattern: boolean;
  };
}

interface RelationshipDetectorProps {
  dataSourceIds: string[];
  onRelationshipAccepted?: (relationship: RelationshipSuggestion) => void;
}

export default function RelationshipDetector({
  dataSourceIds,
  onRelationshipAccepted,
}: RelationshipDetectorProps) {
  const [detecting, setDetecting] = useState(false);
  const [relationships, setRelationships] = useState<RelationshipSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDetect = async () => {
    try {
      setDetecting(true);
      setError(null);

      const response = await fetch('/api/ai/detect-relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataSourceIds,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRelationships(data.relationships);
      } else {
        const error = await response.json();
        setError(error.message || error.error);
      }
    } catch (err) {
      setError('Failed to detect relationships');
      console.error(err);
    } finally {
      setDetecting(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-300';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-300';
    return 'text-gray-600 bg-gray-50 border-gray-300';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'one_to_one':
        return '1:1';
      case 'one_to_many':
        return '1:N';
      case 'many_to_many':
        return 'N:N';
      default:
        return '?';
    }
  };

  return (
    <div className="space-y-4">
      {/* Detector Card */}
      <CellCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Zap className="w-6 h-6 text-purple-600" />
            <div>
              <h3 className="font-bold text-lg">AI Relationship Detector</h3>
              <p className="text-caption text-gray-600">
                Automatically detect relationships between {dataSourceIds.length} data sources
              </p>
            </div>
          </div>
          <CellButton
            variant="primary"
            onClick={handleDetect}
            disabled={detecting || dataSourceIds.length < 2}
            isLoading={detecting}
          >
            {detecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Detect Relationships
              </>
            )}
          </CellButton>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div>
                <p className="font-bold text-red-800">Detection Failed</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {dataSourceIds.length < 2 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800">
                  Select at least 2 data sources to detect relationships
                </p>
              </div>
            </div>
          </div>
        )}
      </CellCard>

      {/* Results */}
      {relationships.length > 0 && (
        <CellCard className="p-6">
          <div className="mb-4">
            <h4 className="font-bold text-lg mb-2">
              Detected Relationships ({relationships.length})
            </h4>
            <p className="text-caption text-gray-600">
              Review and accept suggested relationships
            </p>
          </div>

          <div className="space-y-3">
            {relationships.map((rel, index) => (
              <div
                key={index}
                className="border border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <GitBranch className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-mono font-bold">{rel.sourceTable}</span>
                        <ArrowRight className="w-4 h-4 text-gray-600" />
                        <span className="font-mono font-bold">{rel.targetTable}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {rel.sourceColumn} ↔ {rel.targetColumn}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded">
                      {getRelationshipIcon(rel.relationshipType)}
                    </span>
                    <span className={`px-3 py-1 text-xs font-bold rounded border ${getConfidenceColor(rel.confidence)}`}>
                      {(rel.confidence * 100).toFixed(0)}% {getConfidenceLabel(rel.confidence)}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Reasoning:</strong> {rel.reasoning}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Name Match:</span>{' '}
                      <span className="font-mono">{(rel.evidence.nameSimilarity * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Type Match:</span>{' '}
                      <span className="font-mono">{(rel.evidence.dataTypeSimilarity * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Value Overlap:</span>{' '}
                      <span className="font-mono">{(rel.evidence.valueOverlap * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">FK Pattern:</span>{' '}
                      <span className="font-mono">{rel.evidence.foreignKeyPattern ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <CellButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Dismiss suggestion
                      setRelationships(prev => prev.filter((_, i) => i !== index));
                    }}
                  >
                    Dismiss
                  </CellButton>
                  <CellButton
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      if (onRelationshipAccepted) {
                        onRelationshipAccepted(rel);
                      }
                      alert('Relationship accepted! This would create a join configuration.');
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Accept
                  </CellButton>
                </div>
              </div>
            ))}
          </div>
        </CellCard>
      )}

      {!detecting && relationships.length === 0 && dataSourceIds.length >= 2 && (
        <CellCard className="p-8 text-center">
          <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-body text-gray-600">
            Click "Detect Relationships" to analyze your data sources
          </p>
        </CellCard>
      )}
    </div>
  );
}

