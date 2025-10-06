"use client";

import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Database,
  Workflow,
  FileText,
  Download,
  Upload,
  Radio,
  Filter,
  Loader2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import CellButton from '../ui/CellButton';
import CellCard from '../ui/CellCard';

interface LineageNode {
  id: string;
  type: string;
  name: string;
}

interface LineageEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  metadata?: any;
}

interface LineageVisualizationProps {
  nodeId: string;
  direction?: 'upstream' | 'downstream' | 'both';
  depth?: number;
}

export default function LineageVisualization({ 
  nodeId, 
  direction = 'both', 
  depth = 5 
}: LineageVisualizationProps) {
  const [lineage, setLineage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    loadLineage();
  }, [nodeId, direction, depth]);

  const loadLineage = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/lineage?nodeId=${nodeId}&direction=${direction}&depth=${depth}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setLineage(data.lineage);
      }
    } catch (error) {
      console.error('Failed to load lineage:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'data_source':
        return <Database className="w-5 h-5" />;
      case 'pipeline':
        return <Workflow className="w-5 h-5" />;
      case 'transformation':
        return <Filter className="w-5 h-5" />;
      case 'snapshot':
        return <FileText className="w-5 h-5" />;
      case 'export':
        return <Upload className="w-5 h-5" />;
      case 'stream':
        return <Radio className="w-5 h-5" />;
      default:
        return <GitBranch className="w-5 h-5" />;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'data_source':
        return 'bg-blue-50 border-blue-500 text-blue-700';
      case 'pipeline':
        return 'bg-green-50 border-green-500 text-green-700';
      case 'transformation':
        return 'bg-orange-50 border-orange-500 text-orange-700';
      case 'snapshot':
        return 'bg-purple-50 border-purple-500 text-purple-700';
      case 'export':
        return 'bg-red-50 border-red-500 text-red-700';
      case 'stream':
        return 'bg-teal-50 border-teal-500 text-teal-700';
      default:
        return 'bg-gray-50 border-gray-500 text-gray-700';
    }
  };

  if (loading && !lineage) {
    return (
      <CellCard className="p-12 text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-3 text-blue-600 animate-spin" />
        <p className="text-sm text-gray-600">Loading lineage graph...</p>
      </CellCard>
    );
  }

  if (!lineage) {
    return (
      <CellCard className="p-6 text-center">
        <GitBranch className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600">No lineage data available</p>
      </CellCard>
    );
  }

  // Group nodes by level for visual layout
  const nodesByLevel: Record<number, LineageNode[]> = {};
  lineage.nodes.forEach((node: LineageNode) => {
    const level = (node as any).level || 0;
    if (!nodesByLevel[level]) {
      nodesByLevel[level] = [];
    }
    nodesByLevel[level].push(node);
  });

  const levels = Object.keys(nodesByLevel).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className="space-y-4">
      {/* Header */}
      <CellCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GitBranch className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold">Data Lineage Graph</h3>
              <p className="text-xs text-gray-600">
                {lineage.metadata.totalNodes} nodes • {lineage.metadata.totalEdges} connections • Depth: {lineage.metadata.depth}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CellButton variant="ghost" size="sm">
              <ZoomIn className="w-4 h-4" />
            </CellButton>
            <CellButton variant="ghost" size="sm">
              <ZoomOut className="w-4 h-4" />
            </CellButton>
            <CellButton
              variant="ghost"
              size="sm"
              onClick={() => {
                const json = JSON.stringify(lineage, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'lineage-graph.json';
                a.click();
              }}
            >
              <Download className="w-4 h-4" />
            </CellButton>
          </div>
        </div>
      </CellCard>

      {/* Lineage Graph (Simplified Visual) */}
      <CellCard className="p-6">
        <div className="space-y-8 overflow-x-auto">
          {levels.map((level) => (
            <div key={level} className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase">
                Level {level}
              </p>
              <div className="flex flex-wrap gap-4">
                {nodesByLevel[parseInt(level)].map((node: LineageNode) => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node.id)}
                    className={`px-4 py-3 border-2 rounded-lg transition-all ${getNodeColor(node.type)} ${
                      selectedNode === node.id ? 'shadow-lg scale-105' : 'hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {getNodeIcon(node.type)}
                      <div className="text-left">
                        <p className="font-bold text-sm">{node.name}</p>
                        <p className="text-xs opacity-75 uppercase">{node.type}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-xs font-bold text-gray-600 mb-3">Legend</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { type: 'data_source', label: 'Data Source' },
              { type: 'pipeline', label: 'Pipeline' },
              { type: 'transformation', label: 'Transformation' },
              { type: 'snapshot', label: 'Snapshot' },
              { type: 'stream', label: 'Stream' },
              { type: 'export', label: 'Export' },
            ].map(({ type, label }) => (
              <div key={type} className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded border-2 ${getNodeColor(type)}`} />
                <span className="text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </CellCard>

      {/* Node Details */}
      {selectedNode && (
        <CellCard className="p-4">
          <h4 className="font-bold mb-3">Node Details: {selectedNode}</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-xs text-gray-600 mb-1">Upstream Dependencies</p>
              <p className="text-xl font-mono font-bold">
                {lineage.edges.filter((e: LineageEdge) => e.target === selectedNode).length}
              </p>
            </div>

            <div className="bg-green-50 p-3 rounded">
              <p className="text-xs text-gray-600 mb-1">Downstream Dependents</p>
              <p className="text-xl font-mono font-bold">
                {lineage.edges.filter((e: LineageEdge) => e.source === selectedNode).length}
              </p>
            </div>
          </div>
        </CellCard>
      )}

      {/* Statistics */}
      <CellCard className="p-4">
        <h4 className="font-bold mb-3">Lineage Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total Nodes</p>
            <p className="font-mono font-bold">{lineage.metadata.totalNodes}</p>
          </div>
          <div>
            <p className="text-gray-600">Total Edges</p>
            <p className="font-mono font-bold">{lineage.metadata.totalEdges}</p>
          </div>
          <div>
            <p className="text-gray-600">Graph Depth</p>
            <p className="font-mono font-bold">{lineage.metadata.depth}</p>
          </div>
          <div>
            <p className="text-gray-600">Root Nodes</p>
            <p className="font-mono font-bold">{lineage.metadata.rootNodes.length}</p>
          </div>
        </div>
      </CellCard>
    </div>
  );
}

