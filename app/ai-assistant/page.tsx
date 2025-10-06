"use client";

import React, { useState } from 'react';
import { useDataSources } from '../../contexts/DataSourceContext';
import PageLayout from '../../components/layout/PageLayout';
import CellCard from '../../components/ui/CellCard';
import RelationshipDetector from '../../components/ai/RelationshipDetector';
import TransformationSuggester from '../../components/ai/TransformationSuggester';
import DataQualityChecker from '../../components/ai/DataQualityChecker';
import { Sparkles, Database, Wand2, Shield, GitBranch } from 'lucide-react';

export default function AIAssistantPage() {
  const { dataSources } = useDataSources();
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'relationships' | 'transformations' | 'quality'>('relationships');

  return (
    <PageLayout
      title="AI Assistant"
      subtitle="Intelligent data analysis and suggestions"
      icon={Sparkles}
      showBackButton={true}
      showNavigation={true}
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <CellCard className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <div className="flex items-start space-x-4">
            <Sparkles className="w-8 h-8 text-purple-600 mt-1" />
            <div>
              <h3 className="font-bold text-lg text-purple-900 mb-2">
                AI-Powered Data Intelligence
              </h3>
              <p className="text-body text-purple-800 mb-3">
                Our AI assistant uses advanced pattern matching and statistical analysis to help you:
              </p>
              <ul className="space-y-1 text-sm text-purple-700">
                <li>• <strong>Detect Relationships</strong> - Find connections between tables automatically</li>
                <li>• <strong>Suggest Transformations</strong> - Get smart transformation recommendations</li>
                <li>• <strong>Check Data Quality</strong> - Identify issues and get auto-fix suggestions</li>
                <li>• <strong>Map Columns</strong> - Automatically map fields between datasets</li>
              </ul>
            </div>
          </div>
        </CellCard>

        {/* Data Source Selector */}
        <CellCard className="p-6">
          <h3 className="font-bold text-lg mb-4">Select Data Sources</h3>
          
          {dataSources.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-body text-gray-600">
                No data sources available. Add data sources to use AI features.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dataSources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => {
                    setSelectedSourceIds(prev =>
                      prev.includes(source.id)
                        ? prev.filter(id => id !== source.id)
                        : [...prev, source.id]
                    );
                  }}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    selectedSourceIds.includes(source.id)
                      ? 'bg-blue-50 border-blue-500 shadow-md'
                      : 'bg-white border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    {selectedSourceIds.includes(source.id) && (
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-sm mb-1">{source.name}</p>
                  <p className="text-xs text-gray-600">{source.type.toUpperCase()}</p>
                </button>
              ))}
            </div>
          )}

          {selectedSourceIds.length > 0 && (
            <div className="mt-4 text-sm text-gray-700">
              <strong>{selectedSourceIds.length}</strong> data source{selectedSourceIds.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </CellCard>

        {/* Tab Navigation */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('relationships')}
            className={`flex-1 py-3 px-4 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'relationships'
                ? 'border-purple-600 text-purple-600'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <GitBranch className="w-4 h-4" />
              <span>Detect Relationships</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('transformations')}
            className={`flex-1 py-3 px-4 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'transformations'
                ? 'border-purple-600 text-purple-600'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Wand2 className="w-4 h-4" />
              <span>Suggest Transformations</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('quality')}
            className={`flex-1 py-3 px-4 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'quality'
                ? 'border-purple-600 text-purple-600'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Check Quality</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'relationships' && (
          <RelationshipDetector
            dataSourceIds={selectedSourceIds}
            onRelationshipAccepted={(rel) => {
              console.log('Relationship accepted:', rel);
            }}
          />
        )}

        {activeTab === 'transformations' && selectedSourceIds.length > 0 && (
          <TransformationSuggester
            dataSourceId={selectedSourceIds[0]}
            dataSourceName={dataSources.find(d => d.id === selectedSourceIds[0])?.name || 'Unknown'}
            onTransformationAccepted={(column, code) => {
              console.log('Transformation accepted:', column, code);
            }}
          />
        )}

        {activeTab === 'quality' && selectedSourceIds.length > 0 && (
          <DataQualityChecker
            dataSourceId={selectedSourceIds[0]}
            dataSourceName={dataSources.find(d => d.id === selectedSourceIds[0])?.name || 'Unknown'}
            onAutoFix={(issues) => {
              console.log('Auto-fixing issues:', issues);
            }}
          />
        )}

        {activeTab !== 'relationships' && selectedSourceIds.length === 0 && (
          <CellCard className="p-12 text-center">
            <Wand2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-body text-gray-600">
              Select a data source above to use this AI feature
            </p>
          </CellCard>
        )}
      </div>
    </PageLayout>
  );
}

