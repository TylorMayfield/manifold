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
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Database,
  Filter,
  Settings,
  BarChart3,
  Code,
  Link,
  Play,
  Save,
  Plus,
  Zap,
  Eye,
  Trash2,
  Copy,
  Download,
} from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import { clientLogger } from "../../lib/utils/ClientLogger";

// Node Types
import DataSourceNode from "./nodes/DataSourceNode";
import TransformNode from "./nodes/TransformNode";
import OutputNode from "./nodes/OutputNode";
import CustomNode from "./nodes/CustomNode";

// Edge Types
import CustomEdge from "./edges/CustomEdge";

// Node Definitions
const nodeTypes: NodeTypes = {
  dataSource: DataSourceNode,
  transform: TransformNode,
  output: OutputNode,
  custom: CustomNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

export interface WorkflowNode extends Node {
  data: {
    label: string;
    type: string;
    config: any;
    status: "idle" | "running" | "success" | "error";
    lastRun?: Date;
    executionTime?: number;
  };
}

export type WorkflowEdge = Edge & {
  data?: {
    label?: string;
    dataType?: string;
    rowCount?: number;
  };
};

interface WorkflowCanvasProps {
  onWorkflowExecute?: (workflow: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  }) => void;
  onWorkflowSave?: (workflow: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  }) => void;
  initialNodes?: WorkflowNode[];
  initialEdges?: WorkflowEdge[];
}

const WorkflowCanvas = React.forwardRef<HTMLDivElement, WorkflowCanvasProps>(
  (
    { onWorkflowExecute, onWorkflowSave, initialNodes = [], initialEdges = [] },
    ref
  ) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [reactFlowInstance, setReactFlowInstance] =
      useState<ReactFlowInstance | null>(null);
    const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
    const [showNodeConfig, setShowNodeConfig] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResults, setExecutionResults] = useState<Map<string, any>>(
      new Map()
    );

    // Initialize nodes and edges to prevent flashing
    useEffect(() => {
      if (initialNodes.length > 0 || initialEdges.length > 0) {
        setNodes(initialNodes);
        setEdges(initialEdges);
      }
    }, [initialNodes, initialEdges]);

    // Handle node connections
    const onConnect = useCallback(
      (params: Connection) => {
        if (!params.source || !params.target) {
          return;
        }

        const newEdge: WorkflowEdge = {
          id: `edge-${Date.now()}`,
          source: params.source,
          target: params.target,
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle,
          type: "custom",
          data: {
            dataType: "data",
            rowCount: 0,
          },
          animated: false,
          style: {
            stroke: "#6366f1",
            strokeWidth: 2,
          },
        };
        setEdges((eds) => addEdge(newEdge, eds));

        clientLogger.info("Node connection created", "user-action", {
          source: params.source,
          target: params.target,
        });
      },
      [setEdges]
    );

    // Handle node selection
    const onNodeClick = useCallback(
      (event: React.MouseEvent, node: WorkflowNode) => {
        setSelectedNode(node);
        setShowNodeConfig(true);
      },
      []
    );

    // Add new node
    const addNode = useCallback(
      (type: string, position: { x: number; y: number }) => {
        const id = `node-${Date.now()}`;
        const newNode: WorkflowNode = {
          id,
          type,
          position,
          data: {
            label: getNodeLabel(type),
            type,
            config: getDefaultNodeConfig(type),
            status: "idle",
          },
        };

        setNodes((nds) => [...nds, newNode]);

        clientLogger.info("Node added to workflow", "user-action", {
          nodeId: id,
          nodeType: type,
        });
      },
      [setNodes]
    );

    // Delete selected node
    const deleteNode = useCallback(
      (nodeId: string) => {
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) =>
          eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
        );

        clientLogger.info("Node deleted from workflow", "user-action", { nodeId });
      },
      [setNodes, setEdges]
    );

    // Execute workflow
    const executeWorkflow = useCallback(async () => {
      setIsExecuting(true);
      setExecutionResults(new Map());

      try {
        // Update all nodes to running status
        setNodes((nds) =>
          nds.map((node) => ({
            ...node,
            data: { ...node.data, status: "running" as const },
          }))
        );

        // Simulate workflow execution
        const executionOrder = getExecutionOrder(nodes, edges);

        for (const nodeId of executionOrder) {
          const node = nodes.find((n) => n.id === nodeId);
          if (!node) continue;

          // Simulate node execution
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const result = {
            success: Math.random() > 0.1, // 90% success rate for demo
            data: generateSampleData(node.data.type),
            executionTime: Math.random() * 1000 + 500,
          };

          setExecutionResults((prev) => new Map(prev).set(nodeId, result));

          // Update node status
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      status: result.success ? "success" : "error",
                      lastRun: new Date(),
                      executionTime: result.executionTime,
                    },
                  }
                : n
            )
          );

          // Update edges with data flow
          setEdges((eds) =>
            eds.map((edge) =>
              edge.source === nodeId
                ? {
                    ...edge,
                    data: {
                      ...edge.data,
                      rowCount: result.data?.length || 0,
                    },
                    animated: true,
                  }
                : edge
            )
          );
        }

        if (onWorkflowExecute) {
          onWorkflowExecute({ nodes, edges });
        }

        clientLogger.success("Workflow executed successfully", "system", {
          nodeCount: nodes.length,
          edgeCount: edges.length,
        });
      } catch (error) {
        clientLogger.error("Workflow execution failed", "system", { error });
      } finally {
        setIsExecuting(false);
      }
    }, [nodes, edges, onWorkflowExecute, setNodes, setEdges]);

    // Save workflow
    const saveWorkflow = useCallback(() => {
      if (onWorkflowSave) {
        onWorkflowSave({ nodes, edges });
      }

      clientLogger.info("Workflow saved", "user-action", {
        nodeCount: nodes.length,
        edgeCount: edges.length,
      });
    }, [nodes, edges, onWorkflowSave]);

    // Get execution order (topological sort)
    const getExecutionOrder = (
      nodes: WorkflowNode[],
      edges: WorkflowEdge[]
    ): string[] => {
      const inDegree = new Map<string, number>();
      const graph = new Map<string, string[]>();

      // Initialize
      nodes.forEach((node) => {
        inDegree.set(node.id, 0);
        graph.set(node.id, []);
      });

      // Build graph
      edges.forEach((edge) => {
        const source = edge.source;
        const target = edge.target;
        inDegree.set(target, (inDegree.get(target) || 0) + 1);
        graph.get(source)?.push(target);
      });

      // Topological sort
      const queue: string[] = [];
      const result: string[] = [];

      inDegree.forEach((degree, nodeId) => {
        if (degree === 0) {
          queue.push(nodeId);
        }
      });

      while (queue.length > 0) {
        const current = queue.shift()!;
        result.push(current);

        graph.get(current)?.forEach((neighbor) => {
          inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
          if (inDegree.get(neighbor) === 0) {
            queue.push(neighbor);
          }
        });
      }

      return result;
    };

    // Generate sample data for demo
    const generateSampleData = (nodeType: string): any[] => {
      const baseData = [
        { id: 1, name: "John Doe", email: "john@example.com", age: 30 },
        { id: 2, name: "Jane Smith", email: "jane@example.com", age: 25 },
        { id: 3, name: "Bob Johnson", email: "bob@example.com", age: 35 },
      ];

      switch (nodeType) {
        case "dataSource":
          return baseData;
        case "transform":
          return baseData.map((item) => ({
            ...item,
            name: item.name.toUpperCase(),
            age: item.age + 1,
          }));
        case "output":
          return baseData.filter((item) => item.age > 25);
        default:
          return baseData;
      }
    };

    return (
      <div ref={ref} className="h-full w-full relative">
        <ReactFlowProvider>
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
            fitView
            fitViewOptions={{ padding: 0.2 }}
            className="workflow-canvas"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#374151"
              className="opacity-30"
            />
            <Controls className="workflow-controls" />
            <MiniMap
              className="workflow-minimap"
              nodeColor={(node) => {
                switch (node.data?.status) {
                  case "success":
                    return "#10b981";
                  case "error":
                    return "#ef4444";
                  case "running":
                    return "#f59e0b";
                  default:
                    return "#6b7280";
                }
              }}
            />
          </ReactFlow>

          {/* Workflow Toolbar */}
          <div className="absolute top-4 left-4 z-10">
            <div className="glass-card p-3 flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={executeWorkflow}
                disabled={isExecuting || nodes.length === 0}
                icon={
                  isExecuting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )
                }
              >
                {isExecuting ? "Executing..." : "Execute"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={saveWorkflow}
                icon={<Save className="w-4 h-4" />}
              >
                Save
              </Button>

              <div className="w-px h-6 bg-white/20" />

              <Button
                variant="outline"
                size="sm"
                onClick={() => addNode("dataSource", { x: 100, y: 100 })}
                icon={<Database className="w-4 h-4" />}
              >
                Data Source
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => addNode("transform", { x: 300, y: 100 })}
                icon={<Settings className="w-4 h-4" />}
              >
                Transform
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => addNode("output", { x: 500, y: 100 })}
                icon={<BarChart3 className="w-4 h-4" />}
              >
                Output
              </Button>
            </div>
          </div>

          {/* Node Configuration Modal */}
          <Modal
            isOpen={showNodeConfig}
            onClose={() => setShowNodeConfig(false)}
            title={`Configure ${selectedNode?.data.label || "Node"}`}
          >
            {selectedNode && (
              <NodeConfigurationPanel
                node={selectedNode}
                onUpdate={(updates) => {
                  setNodes((nds) =>
                    nds.map((n) =>
                      n.id === selectedNode.id
                        ? { ...n, data: { ...n.data, ...updates } }
                        : n
                    )
                  );
                  setShowNodeConfig(false);
                }}
                onDelete={() => {
                  deleteNode(selectedNode.id);
                  setShowNodeConfig(false);
                }}
                executionResult={executionResults.get(selectedNode.id)}
              />
            )}
          </Modal>
        </ReactFlowProvider>
      </div>
    );
  }
);

// Helper functions
const getNodeLabel = (type: string): string => {
  switch (type) {
    case "dataSource":
      return "Data Source";
    case "transform":
      return "Transform";
    case "output":
      return "Output";
    case "custom":
      return "Custom";
    default:
      return "Unknown";
  }
};

const getDefaultNodeConfig = (type: string): any => {
  switch (type) {
    case "dataSource":
      return {
        sourceType: "csv",
        filePath: "",
        connectionString: "",
      };
    case "transform":
      return {
        operations: [],
        filters: [],
      };
    case "output":
      return {
        destination: "database",
        tableName: "",
      };
    case "custom":
      return {
        script: "// Custom transformation script\nreturn data;",
      };
    default:
      return {};
  }
};

// Node Configuration Panel Component
interface NodeConfigurationPanelProps {
  node: WorkflowNode;
  onUpdate: (updates: Partial<WorkflowNode["data"]>) => void;
  onDelete: () => void;
  executionResult?: any;
}

const NodeConfigurationPanel: React.FC<NodeConfigurationPanelProps> = ({
  node,
  onUpdate,
  onDelete,
  executionResult,
}) => {
  const [config, setConfig] = useState(node.data.config);

  const handleSave = () => {
    onUpdate({ config });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{node.data.label}</h3>
          <p className="text-sm text-gray-400">Node ID: {node.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              node.data.status === "success"
                ? "bg-green-500/20 text-green-400"
                : node.data.status === "error"
                ? "bg-red-500/20 text-red-400"
                : node.data.status === "running"
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-gray-500/20 text-gray-400"
            }`}
          >
            {node.data.status}
          </span>
        </div>
      </div>

      {executionResult && (
        <div className="glass-card p-3">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Execution Result
          </h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span
                className={
                  executionResult.success ? "text-green-400" : "text-red-400"
                }
              >
                {executionResult.success ? "Success" : "Error"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Rows:</span>
              <span>{executionResult.data?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Time:</span>
              <span>{executionResult.executionTime?.toFixed(0)}ms</span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-2">Node Label</label>
          <input
            type="text"
            value={node.data.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
          />
        </div>

        {/* Node-specific configuration would go here */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Configuration
          </label>
          <textarea
            value={JSON.stringify(config, null, 2)}
            onChange={(e) => {
              try {
                setConfig(JSON.parse(e.target.value));
              } catch (error) {
                // Invalid JSON, keep the text for editing
              }
            }}
            className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white font-mono text-sm"
            rows={6}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          icon={<Trash2 className="w-4 h-4" />}
        >
          Delete Node
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onUpdate({})}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

WorkflowCanvas.displayName = "WorkflowCanvas";

export default WorkflowCanvas;
