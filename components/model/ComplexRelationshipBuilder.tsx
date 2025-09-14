"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Database,
  Link,
  Settings,
  Play,
  Save,
  Download,
  Upload,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Minus,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  GitBranch,
  Network,
  TreePine,
} from "lucide-react";
import { logger } from "../../lib/utils/logger";
import { DataSource } from "../../types";
import { ComplexRelationshipAnalyzer } from "../../lib/services/ComplexRelationshipAnalyzer";
import {
  ComplexRelationship,
  RelationshipSuggestion,
  DataSourceAnalysis,
  ComplexJoinPlan,
  TreeLayout,
  TreeNode,
  TreeEdge,
} from "../../types/relationships";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface ComplexRelationshipBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  dataSources: DataSource[];
  projectId: string;
}

interface ViewMode {
  mode: "tree" | "graph" | "table";
  zoom: number;
  panX: number;
  panY: number;
}

export default function ComplexRelationshipBuilder({
  isOpen,
  onClose,
  dataSources,
  projectId,
}: ComplexRelationshipBuilderProps) {
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);
  const [modelName, setModelName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "visual" | "relationships" | "plans" | "preview"
  >("visual");

  // Analysis results
  const [relationshipSuggestions, setRelationshipSuggestions] = useState<
    RelationshipSuggestion[]
  >([]);
  const [dataSourceAnalysis, setDataSourceAnalysis] = useState<
    DataSourceAnalysis[]
  >([]);
  const [joinPlans, setJoinPlans] = useState<ComplexJoinPlan[]>([]);
  const [treeLayout, setTreeLayout] = useState<TreeLayout | null>(null);
  const [selectedRelationships, setSelectedRelationships] = useState<string[]>(
    []
  );
  const [selectedJoinPlan, setSelectedJoinPlan] = useState<string | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>({
    mode: "tree",
    zoom: 1,
    panX: 0,
    panY: 0,
  });

  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  const analyzer = ComplexRelationshipAnalyzer.getInstance();
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && selectedDataSources.length >= 2) {
      analyzeComplexRelationships();
    }
  }, [isOpen, selectedDataSources]);

  const analyzeComplexRelationships = async () => {
    if (selectedDataSources.length < 2) return;

    setLoading(true);
    try {
      const analysis = await analyzer.analyzeComplexRelationships(
        projectId,
        selectedDataSources
      );

      setRelationshipSuggestions(analysis.relationships);
      setDataSourceAnalysis(analysis.dataSourceAnalysis);
      setJoinPlans(analysis.joinPlans);
      setTreeLayout(analysis.treeLayout);

      // Auto-select high-confidence relationships
      const autoSelectRelationships = analysis.relationships
        .filter((rel) => rel.confidence > 0.8)
        .map((rel) => rel.id);
      setSelectedRelationships(autoSelectRelationships);

      // Auto-select best join plan
      if (analysis.joinPlans.length > 0) {
        setSelectedJoinPlan(analysis.joinPlans[0].id);
      }

      logger.success(
        "Complex relationship analysis completed",
        "data-processing",
        {
          relationships: analysis.relationships.length,
          joinPlans: analysis.joinPlans.length,
          treeNodes: analysis.treeLayout.nodes.length,
        },
        "ComplexRelationshipBuilder"
      );
    } catch (error) {
      logger.error(
        "Complex relationship analysis failed",
        "data-processing",
        { error },
        "ComplexRelationshipBuilder"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleDataSource = (dataSourceId: string) => {
    setSelectedDataSources((prev) => {
      if (prev.includes(dataSourceId)) {
        return prev.filter((id) => id !== dataSourceId);
      } else {
        return [...prev, dataSourceId];
      }
    });
  };

  const toggleRelationship = (relationshipId: string) => {
    setSelectedRelationships((prev) => {
      if (prev.includes(relationshipId)) {
        return prev.filter((id) => id !== relationshipId);
      } else {
        return [...prev, relationshipId];
      }
    });
  };

  const renderTreeVisualization = () => {
    if (!treeLayout) return null;

    const { nodes, edges } = treeLayout;

    return (
      <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
        <div className="absolute inset-0 p-4">
          {/* Zoom and Pan Controls */}
          <div className="absolute top-4 right-4 flex space-x-2 z-10">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setViewMode((prev) => ({
                  ...prev,
                  zoom: Math.min(prev.zoom + 0.2, 2),
                }))
              }
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setViewMode((prev) => ({
                  ...prev,
                  zoom: Math.max(prev.zoom - 0.2, 0.5),
                }))
              }
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setViewMode((prev) => ({ ...prev, zoom: 1, panX: 0, panY: 0 }))
              }
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Tree Visualization */}
          <div
            ref={canvasRef}
            className="relative w-full h-full"
            style={{
              transform: `scale(${viewMode.zoom}) translate(${viewMode.panX}px, ${viewMode.panY}px)`,
              transformOrigin: "center center",
            }}
          >
            {/* Edges (Relationships) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {edges.map((edge) => {
                const sourceNode = nodes.find((n) => n.id === edge.source);
                const targetNode = nodes.find((n) => n.id === edge.target);

                if (!sourceNode || !targetNode) return null;

                const x1 = sourceNode.position.x + 100; // Center of node
                const y1 = sourceNode.position.y + 50;
                const x2 = targetNode.position.x + 100;
                const y2 = targetNode.position.y + 50;

                return (
                  <g key={edge.id}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={edge.isActive ? "#10b981" : "#6b7280"}
                      strokeWidth={edge.confidence * 4 + 1}
                      strokeDasharray={edge.isActive ? "none" : "5,5"}
                      opacity={edge.isActive ? 0.8 : 0.4}
                    />
                    {/* Relationship label */}
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 10}
                      textAnchor="middle"
                      className="text-xs fill-white"
                      fontSize="10"
                    >
                      {edge.relationship.sourceColumn} →{" "}
                      {edge.relationship.targetColumn}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Nodes (Data Sources) */}
            {nodes.map((node) => (
              <div
                key={node.id}
                className="absolute cursor-pointer transition-all duration-200"
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  transform: selectedNodes.has(node.id)
                    ? "scale(1.05)"
                    : "scale(1)",
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => {
                  const newSelected = new Set(selectedNodes);
                  if (newSelected.has(node.id)) {
                    newSelected.delete(node.id);
                  } else {
                    newSelected.add(node.id);
                  }
                  setSelectedNodes(newSelected);
                }}
              >
                <div
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedNodes.has(node.id)
                      ? "border-blue-500 bg-blue-500/20"
                      : hoveredNode === node.id
                      ? "border-blue-400 bg-blue-500/10"
                      : "border-white/20 bg-white/5"
                  }`}
                  style={{ width: 200 }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Database className="h-4 w-4 text-blue-400" />
                    <span className="text-white font-medium text-sm truncate">
                      {node.dataSourceName}
                    </span>
                  </div>
                  <div className="text-xs text-white/60 space-y-1">
                    <div>{node.recordCount.toLocaleString()} records</div>
                    <div className="flex items-center space-x-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          node.isSelected ? "bg-green-400" : "bg-gray-400"
                        }`}
                      />
                      <span>{node.isSelected ? "Selected" : "Available"}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderRelationshipTable = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium">Detected Relationships</h3>
          <span className="text-white/60 text-sm">
            {selectedRelationships.length} of {relationshipSuggestions.length}{" "}
            selected
          </span>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {relationshipSuggestions.map((relationship) => (
            <div
              key={relationship.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedRelationships.includes(relationship.id)
                  ? "border-blue-500/50 bg-blue-500/10"
                  : "border-white/20 bg-white/5 hover:bg-white/10"
              }`}
              onClick={() => toggleRelationship(relationship.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedRelationships.includes(relationship.id)}
                    onChange={() => toggleRelationship(relationship.id)}
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-blue-400" />
                    <span className="text-white font-medium">
                      {relationship.sourceTableName}
                    </span>
                    <ArrowRight className="h-4 w-4 text-white/60" />
                    <Database className="h-4 w-4 text-green-400" />
                    <span className="text-white font-medium">
                      {relationship.targetTableName}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      relationship.confidence > 0.8
                        ? "bg-green-500/20 text-green-400"
                        : relationship.confidence > 0.6
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {Math.round(relationship.confidence * 100)}%
                  </span>
                  <span className="text-white/60 text-xs">
                    {relationship.relationshipType.replace("_", " to ")}
                  </span>
                </div>
              </div>

              <div className="text-sm text-white/70 mb-2">
                <strong>
                  {relationship.sourceTableName}.{relationship.sourceColumn}
                </strong>{" "}
                →
                <strong>
                  {" "}
                  {relationship.targetTableName}.{relationship.targetColumn}
                </strong>
              </div>

              <p className="text-xs text-white/60">{relationship.reasoning}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderJoinPlans = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium">Join Execution Plans</h3>
          <span className="text-white/60 text-sm">
            {joinPlans.length} plans generated
          </span>
        </div>

        <div className="space-y-3">
          {joinPlans.map((plan) => (
            <div
              key={plan.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedJoinPlan === plan.id
                  ? "border-blue-500/50 bg-blue-500/10"
                  : "border-white/20 bg-white/5 hover:bg-white/10"
              }`}
              onClick={() => setSelectedJoinPlan(plan.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={selectedJoinPlan === plan.id}
                    onChange={() => setSelectedJoinPlan(plan.id)}
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 focus:ring-blue-500"
                  />
                  <h4 className="text-white font-medium">{plan.name}</h4>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      plan.performance === "fast"
                        ? "bg-green-500/20 text-green-400"
                        : plan.performance === "moderate"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {plan.performance}
                  </span>
                  <span className="text-white/60 text-xs">
                    ~{plan.estimatedRows.toLocaleString()} rows
                  </span>
                </div>
              </div>

              {plan.description && (
                <p className="text-sm text-white/70 mb-3">{plan.description}</p>
              )}

              <div className="space-y-2">
                <h5 className="text-white/80 text-sm font-medium">
                  Execution Steps:
                </h5>
                <div className="space-y-1">
                  {plan.executionOrder.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-center space-x-2 text-xs"
                    >
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-medium">
                        {step.stepNumber}
                      </span>
                      <span className="text-white/60">
                        {step.leftDataSourceId ? "JOIN" : "START"}:
                      </span>
                      <span className="text-white">
                        {step.relationship.joinCondition}
                      </span>
                      <span className="text-white/60">
                        ({step.estimatedRows.toLocaleString()} rows)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDataSourceSelector = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium">Select Data Sources</h3>
          <span className="text-white/60 text-sm">
            {selectedDataSources.length} of {dataSources.length} selected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {dataSources.map((dataSource) => (
            <div
              key={dataSource.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedDataSources.includes(dataSource.id)
                  ? "border-blue-500/50 bg-blue-500/10"
                  : "border-white/20 bg-white/5 hover:bg-white/10"
              }`}
              onClick={() => toggleDataSource(dataSource.id)}
            >
              <div className="flex items-center space-x-3 mb-3">
                <Database className="h-5 w-5 text-blue-400" />
                <div>
                  <h4 className="text-white font-medium text-sm">
                    {dataSource.name}
                  </h4>
                  <p className="text-white/60 text-xs">{dataSource.type}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-white/60 text-xs">
                  {dataSource.config.mockConfig?.schema?.columns?.length || 0}{" "}
                  columns •{" "}
                  {dataSource.config.mockConfig?.recordCount?.toLocaleString() ||
                    0}{" "}
                  records
                </p>
                <div className="flex items-center space-x-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      selectedDataSources.includes(dataSource.id)
                        ? "bg-green-400"
                        : "bg-gray-400"
                    }`}
                  />
                  <span className="text-xs text-white/60">
                    {selectedDataSources.includes(dataSource.id)
                      ? "Selected"
                      : "Available"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complex Relationship Builder"
      size="xl"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold">
              Multi-Tier Data Relationships
            </h2>
            <p className="text-white/60 text-sm">
              Build complex relationships between multiple data sources with
              tree visualization
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setViewMode((prev) => ({ ...prev, mode: "tree" }))}
              variant={viewMode.mode === "tree" ? "primary" : "outline"}
              size="sm"
            >
              <TreePine className="h-4 w-4 mr-2" />
              Tree View
            </Button>
            <Button
              onClick={() =>
                setViewMode((prev) => ({ ...prev, mode: "graph" }))
              }
              variant={viewMode.mode === "graph" ? "primary" : "outline"}
              size="sm"
            >
              <Network className="h-4 w-4 mr-2" />
              Graph View
            </Button>
          </div>
        </div>

        {/* Data Source Selection */}
        <div className="glass-card rounded-xl p-4">
          {renderDataSourceSelector()}
        </div>

        {/* Analysis Results */}
        {selectedDataSources.length >= 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Visualization */}
            <div className="lg:col-span-2">
              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium">
                    Relationship Visualization
                  </h3>
                  {loading && (
                    <div className="flex items-center space-x-2 text-blue-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Analyzing...</span>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
                      <p className="text-white/60">
                        Analyzing complex relationships...
                      </p>
                    </div>
                  </div>
                ) : (
                  renderTreeVisualization()
                )}
              </div>
            </div>

            {/* Right Panel - Tabs */}
            <div className="lg:col-span-1">
              <div className="glass-card rounded-xl p-4">
                <div className="flex space-x-1 border-b border-white/20 mb-4">
                  {[
                    { id: "relationships", label: "Relationships", icon: Link },
                    { id: "plans", label: "Join Plans", icon: GitBranch },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? "text-blue-400 border-b-2 border-blue-400"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {activeTab === "relationships" && renderRelationshipTable()}
                  {activeTab === "plans" && renderJoinPlans()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-white/60 text-sm">
            {selectedDataSources.length >= 2
              ? `Ready to build complex model with ${selectedDataSources.length} data sources`
              : "Select at least 2 data sources to begin"}
          </div>
          <div className="flex space-x-3">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={() => {
                /* TODO: Implement model generation */
              }}
              disabled={selectedDataSources.length < 2 || loading}
              loading={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              Generate Complex Model
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
