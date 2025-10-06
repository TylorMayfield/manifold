"use client";

import React, { useState } from 'react';
import {
  Wand2,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Code,
  Lightbulb,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import CellButton from '../ui/CellButton';
import CellCard from '../ui/CellCard';

interface TransformationSuggestion {
  column: string;
  currentType: string;
  transformations: Array<{
    type: string;
    description: string;
    code: string;
    confidence: number;
    examples: Array<{ input: any; output: any }>;
  }>;
}

interface TransformationSuggesterProps {
  dataSourceId: string;
  dataSourceName: string;
  onTransformationAccepted?: (column: string, code: string) => void;
}

export default function TransformationSuggester({
  dataSourceId,
  dataSourceName,
  onTransformationAccepted,
}: TransformationSuggesterProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<TransformationSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      setError(null);

      const response = await fetch('/api/ai/suggest-transformations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataSourceId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
      } else {
        const error = await response.json();
        setError(error.message || error.error);
      }
    } catch (err) {
      setError('Failed to analyze data');
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getTransformTypeColor = (type: string) => {
    switch (type) {
      case 'clean': return 'bg-blue-100 text-blue-800';
      case 'format': return 'bg-green-100 text-green-800';
      case 'extract': return 'bg-purple-100 text-purple-800';
      case 'split': return 'bg-orange-100 text-orange-800';
      case 'merge': return 'bg-pink-100 text-pink-800';
      case 'calculate': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Analyzer Card */}
      <CellCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Wand2 className="w-6 h-6 text-purple-600" />
            <div>
              <h3 className="font-bold text-lg">AI Transformation Suggester</h3>
              <p className="text-caption text-gray-600">
                Get intelligent transformation suggestions for {dataSourceName}
              </p>
            </div>
          </div>
          <CellButton
            variant="primary"
            onClick={handleAnalyze}
            disabled={analyzing}
            isLoading={analyzing}
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Analyze Data
              </>
            )}
          </CellButton>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div>
                <p className="font-bold text-red-800">Analysis Failed</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </CellCard>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <CellCard className="p-6">
          <div className="mb-4">
            <h4 className="font-bold text-lg mb-2">
              Transformation Suggestions ({suggestions.length} columns)
            </h4>
            <p className="text-caption text-gray-600">
              AI-detected transformations based on data patterns
            </p>
          </div>

          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.column} className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="font-mono font-bold text-md">{suggestion.column}</h5>
                    <p className="text-caption text-gray-600">
                      Type: {suggestion.currentType} • {suggestion.transformations.length} suggestion{suggestion.transformations.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {suggestion.transformations.map((transform, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Lightbulb className="w-4 h-4 text-yellow-600" />
                          <span className={`px-2 py-1 text-xs font-bold rounded ${getTransformTypeColor(transform.type)}`}>
                            {transform.type.toUpperCase()}
                          </span>
                          <span className="text-sm font-bold">{transform.description}</span>
                        </div>
                        <span className="text-xs text-gray-600">
                          {(transform.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>

                      {/* Code */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-gray-700">Transformation Code:</label>
                          <button
                            onClick={() => copyToClipboard(transform.code)}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          >
                            {copiedCode === transform.code ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
                          {transform.code}
                        </div>
                      </div>

                      {/* Examples */}
                      {transform.examples.length > 0 && (
                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-1 block">
                            Examples:
                          </label>
                          <div className="space-y-1">
                            {transform.examples.map((example, exIndex) => (
                              <div
                                key={exIndex}
                                className="flex items-center space-x-2 text-sm"
                              >
                                <span className="text-gray-600 font-mono">"{example.input}"</span>
                                <ArrowRight className="w-3 h-3 text-gray-600" />
                                <span className="text-gray-900 font-mono font-bold">"{example.output}"</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end mt-3 space-x-2">
                        <CellButton
                          variant="ghost"
                          size="sm"
                        >
                          Preview
                        </CellButton>
                        <CellButton
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            if (onTransformationAccepted) {
                              onTransformationAccepted(suggestion.column, transform.code);
                            }
                            alert('Transformation accepted! This would add to your pipeline.');
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Apply
                        </CellButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CellCard>
      )}

      {!analyzing && suggestions.length === 0 && (
        <CellCard className="p-8 text-center bg-purple-50 border-purple-200">
          <Wand2 className="w-12 h-12 mx-auto mb-4 text-purple-600" />
          <p className="text-body text-purple-800 mb-2">
            Click "Analyze Data" to get AI-powered transformation suggestions
          </p>
          <p className="text-caption text-purple-700">
            The AI will detect patterns like emails, phone numbers, dates, and suggest appropriate transformations
          </p>
        </CellCard>
      )}
    </div>
  );
}

