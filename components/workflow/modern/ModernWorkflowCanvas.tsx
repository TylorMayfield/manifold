"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  ReactFlowProvider,
  ReactFlowInstance,
  BackgroundVariant,
  useReactFlow,
  Panel,
} from "reactflow";
// Removed ReactFlow CSS import to use our custom styling
import ModernWorkflowSidebar from "./ModernWorkflowSidebar";
import {
  Play,
  Save,
  Pause,
  Square,
  Zap,
  Eye,
  Settings,
  Download,
  Upload,
  Maximize,
  Minimize,
  RotateCcw,
  Share,
  Clock,
  Activity,
} from "lucide-react";
import Button from "../../ui/Button";
import { clientLogger } from "../../../lib/utils/ClientLogger";

// Modern Node Components
import DataSourceNode from "./nodes/ModernDataSourceNode";
import TransformNode from "./nodes/ModernTransformNode";
import OutputNode from "./nodes/ModernOutputNode";
import MergeNode from "./nodes/ModernMergeNode";
import DiffNode from "./nodes/ModernDiffNode";

// Modern Edge Component
import ModernEdge from "./edges/ModernEdge";

// Workflow execution engine - using client-side mock for now
// import { WorkflowExecutor } from "../../../lib/services/WorkflowExecutor"; // Moved to server-side

const nodeTypes: NodeTypes = {
  dataSource: DataSourceNode,
  transform: TransformNode,
  output: OutputNode,
  merge: MergeNode,
  diff: DiffNode,
};

const edgeTypes: EdgeTypes = {
  modern: ModernEdge,
};

export interface ModernWorkflowNode extends Node {
  data: {
    id: string;
    label: string;
    type: string;
    category: "input" | "transform" | "output" | "utility";
    config: any;
    status: "idle" | "running" | "success" | "error" | "warning";
    lastRun?: Date;
    executionTime?: number;
    rowsProcessed?: number;
    outputSchema?: any;
    version: number;
    isLocked?: boolean;
    notes?: string;
  };
}

export interface ModernWorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: string;
  animated?: boolean;
  style?: any;
  data?: {
    label?: string;
    dataType?: string;
    rowCount?: number;
    schema?: any;
    isActive?: boolean;
    bandwidth?: "low" | "medium" | "high";
  };
}

export interface WorkflowExecution {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: "running" | "completed" | "failed" | "paused";
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  totalRows: number;
  executionTime?: number;
}

interface ModernWorkflowCanvasProps {
  onWorkflowExecute?: (workflow: {
    nodes: ModernWorkflowNode[];
    edges: ModernWorkflowEdge[];
  }) => void;
  onWorkflowSave?: (workflow: {
    nodes: ModernWorkflowNode[];
    edges: ModernWorkflowEdge[];
    name: string;
    description?: string;
  }) => void;
  initialNodes?: ModernWorkflowNode[];
  initialEdges?: ModernWorkflowEdge[];
  workflowName?: string;
  isReadonly?: boolean;
}

const ModernWorkflowCanvas: React.FC<ModernWorkflowCanvasProps> = ({
  onWorkflowExecute,
  onWorkflowSave,
  initialNodes = [],
  initialEdges = [],
  workflowName = "Untitled Workflow",
  isReadonly = false,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<ModernWorkflowNode | null>(
    null
  );
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<Map<string, any>>(
    new Map()
  );
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // const workflowExecutor = useRef(new WorkflowExecutor()); // Moved to server-side
  const workflowExecutor = useRef({
    // Mock workflow executor for client-side
    executeWorkflow: async (nodes: any, edges: any) => {
      clientLogger.info("Mock workflow execution", "job-management", {
        nodeCount: nodes.length,
        edgeCount: edges.length,
      });
      return { success: true, results: [] };
    },
  });

  // Handle drag and drop
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    // Handle node drop logic here
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Track changes for auto-save
  useEffect(() => {
    if (initialNodes.length > 0 || initialEdges.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [nodes, edges, initialNodes, initialEdges]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && hasUnsavedChanges && !isExecuting) {
      const timer = setTimeout(() => {
        handleSave();
      }, 3000); // Auto-save after 3 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [nodes, edges, autoSave, hasUnsavedChanges, isExecuting]);

  // Handle node connections with enhanced validation
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || isReadonly) {
        return;
      }

      // Validate connection rules
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (!sourceNode || !targetNode) return;

      // Prevent circular dependencies
      if (hasCircularDependency(params.source, params.target, edges)) {
        clientLogger.warn(
          "Circular dependency detected, connection blocked",
          "ui"
        );
        return;
      }

      const newEdge: ModernWorkflowEdge = {
        id: `edge-${Date.now()}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        type: "modern",
        data: {
          dataType: "tabular",
          rowCount: 0,
          isActive: false,
          bandwidth: "low",
        },
        animated: false,
        style: {
          stroke: "#6366f1",
          strokeWidth: 2,
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));
      setHasUnsavedChanges(true);

      clientLogger.info("Node connection created", "user-action", {
        source: params.source,
        target: params.target,
      });
    },
    [nodes, edges, isReadonly, setEdges]
  );

  // Enhanced node selection with keyboard support
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: ModernWorkflowNode) => {
      if (isReadonly) return;

      setSelectedNode(node);

      // Multi-select with Ctrl/Cmd key
      if (event.ctrlKey || event.metaKey) {
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            selected: n.id === node.id ? !n.selected : n.selected,
          }))
        );
      } else {
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            selected: n.id === node.id,
          }))
        );
      }
    },
    [isReadonly, setNodes]
  );

  // Enhanced workflow execution with real-time updates
  const executeWorkflow = useCallback(async () => {
    if (isExecuting || nodes.length === 0) return;

    setIsExecuting(true);
    const executionId = `exec-${Date.now()}`;
    const startTime = new Date();

    const newExecution: WorkflowExecution = {
      id: executionId,
      startTime,
      status: "running",
      totalNodes: nodes.length,
      completedNodes: 0,
      failedNodes: 0,
      totalRows: 0,
    };

    setExecution(newExecution);
    setExecutionResults(new Map());

    try {
      // Update all nodes to running status
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: { ...node.data, status: "running" as const },
        }))
      );

      // Execute workflow using the WorkflowExecutor
      const results = await workflowExecutor.current.executeWorkflow(
        nodes,
        edges
      );

      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      setExecution((prev) =>
        prev
          ? {
              ...prev,
              endTime,
              status: results.success ? "completed" : "failed",
              executionTime,
            }
          : null
      );

      if (onWorkflowExecute) {
        onWorkflowExecute({ nodes, edges });
      }

      clientLogger.success("Workflow executed successfully", "system", {
        executionId,
        executionTime,
        nodeCount: nodes.length,
        totalRows: 0,
      });
    } catch (error) {
      setExecution((prev) =>
        prev ? { ...prev, status: "failed", endTime: new Date() } : null
      );
      clientLogger.error("Workflow execution failed", "system", { error });
    } finally {
      setIsExecuting(false);
    }
  }, [nodes, edges, isExecuting, onWorkflowExecute, setNodes, setEdges]);

  // Stop execution
  const stopExecution = useCallback(() => {
    if (!isExecuting) return;

    // workflowExecutor.current.stopExecution(); // Not available in mock executor
    setIsExecuting(false);
    setExecution((prev) =>
      prev ? { ...prev, status: "failed", endTime: new Date() } : null
    );

    // Reset node statuses
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, status: "idle" as const },
      }))
    );

    clientLogger.info("Workflow execution stopped", "user-action");
  }, [isExecuting, setNodes]);

  // Save workflow
  const handleSave = useCallback(() => {
    if (onWorkflowSave) {
      onWorkflowSave({
        nodes,
        edges,
        name: workflowName,
        description: `Workflow with ${nodes.length} nodes`,
      });
    }

    setHasUnsavedChanges(false);
    setLastSaved(new Date());

    clientLogger.info("Workflow saved", "user-action", {
      nodeCount: nodes.length,
      edgeCount: edges.length,
    });
  }, [nodes, edges, workflowName, onWorkflowSave]);

  // Utility functions
  const hasCircularDependency = (
    sourceId: string,
    targetId: string,
    currentEdges: ModernWorkflowEdge[]
  ): boolean => {
    const visited = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      if (visited.has(nodeId)) return true;
      if (nodeId === sourceId) return true;

      visited.add(nodeId);

      const outgoingEdges = currentEdges.filter(
        (edge) => edge.source === nodeId
      );
      for (const edge of outgoingEdges) {
        if (dfs(edge.target)) return true;
      }

      return false;
    };

    return dfs(targetId);
  };

  const resetWorkflow = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          status: "idle" as const,
          lastRun: undefined,
          executionTime: undefined,
          rowsProcessed: undefined,
        },
      }))
    );
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          isActive: false,
          rowCount: 0,
        },
        animated: false,
      }))
    );
    setExecution(null);
    setExecutionResults(new Map());

    clientLogger.info("Workflow reset", "user-action");
  }, [setNodes, setEdges]);

  return (
    <div className="h-full w-full flex">
      <ReactFlowProvider>
        {/* Sidebar */}
        <ModernWorkflowSidebar />

        {/* Main Canvas */}
        <div className="flex-1 relative bg-transparent">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            fitViewOptions={{ padding: 0.1 }}
            className="modern-workflow-canvas"
            nodesDraggable={!isReadonly}
            nodesConnectable={!isReadonly}
            elementsSelectable={!isReadonly}
            selectNodesOnDrag={false}
            snapToGrid
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              type: "modern",
              animated: false,
              style: { strokeWidth: 2 },
            }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="rgba(255, 255, 255, 0.1)"
              className="opacity-20"
            />

            <Controls
              className="modern-controls"
              showZoom
              showFitView
              showInteractive={false}
            />

            {showMiniMap && (
              <MiniMap
                className="modern-minimap"
                nodeColor={(node) => {
                  const status = (node as ModernWorkflowNode).data?.status;
                  switch (status) {
                    case "success":
                      return "#10b981";
                    case "error":
                      return "#ef4444";
                    case "running":
                      return "#f59e0b";
                    case "warning":
                      return "#f97316";
                    default:
                      return "#6b7280";
                  }
                }}
                maskColor="rgba(15, 23, 42, 0.8)"
              />
            )}

            {/* Execution Panel */}
            <Panel position="top-left">
              <div className="glass-card p-4 min-w-[320px] border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-tangerine-400" />
                    <h3 className="font-semibold text-white">{workflowName}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-tangerine-400 rounded-full animate-pulse" />
                        <span className="text-xs text-white/60">Unsaved</span>
                      </div>
                    )}
                    {lastSaved && (
                      <span className="text-xs text-white/60">
                        Saved {lastSaved.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={executeWorkflow}
                    disabled={isExecuting || nodes.length === 0 || isReadonly}
                    icon={
                      isExecuting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )
                    }
                  >
                    {isExecuting ? "Running..." : "Execute"}
                  </Button>

                  {isExecuting && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={stopExecution}
                      icon={<Square className="w-4 h-4" />}
                    >
                      Stop
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    disabled={isReadonly || !hasUnsavedChanges}
                    icon={<Save className="w-4 h-4" />}
                  >
                    Save
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetWorkflow}
                    disabled={isExecuting || isReadonly}
                    icon={<RotateCcw className="w-4 h-4" />}
                  >
                    Reset
                  </Button>
                </div>

                {execution && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          execution.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : execution.status === "failed"
                            ? "bg-red-500/20 text-red-400"
                            : execution.status === "running"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {execution.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Progress:</span>
                      <span className="text-white">
                        {execution.completedNodes}/{execution.totalNodes} nodes
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Rows Processed:</span>
                      <span className="text-white">
                        {execution.totalRows.toLocaleString()}
                      </span>
                    </div>
                    {execution.executionTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Duration:</span>
                        <span className="text-white">
                          {(execution.executionTime / 1000).toFixed(2)}s
                        </span>
                      </div>
                    )}
                    {execution.failedNodes > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Failed:</span>
                        <span className="text-red-400">
                          {execution.failedNodes} nodes
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Panel>

            {/* Canvas Controls */}
            <Panel position="top-right">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMiniMap(!showMiniMap)}
                  icon={
                    showMiniMap ? (
                      <Minimize className="w-4 h-4" />
                    ) : (
                      <Maximize className="w-4 h-4" />
                    )
                  }
                >
                  {showMiniMap ? "Hide" : "Show"} Map
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoSave(!autoSave)}
                  icon={
                    <Save
                      className={`w-4 h-4 ${autoSave ? "text-green-400" : ""}`}
                    />
                  }
                >
                  Auto-save: {autoSave ? "On" : "Off"}
                </Button>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default ModernWorkflowCanvas;
