"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { Project } from "../../../../../types";
import { clientDatabaseService } from "../../../../../lib/database/ClientDatabaseService";
import { clientLogger } from "../../../../../lib/utils/ClientLogger";
import Button from "../../../../../components/ui/Button";
import {
  ArrowLeft,
  Save,
  Play,
  Settings,
  Plus,
  Database,
  Filter,
  BarChart3,
  Code,
  Download,
  Trash2,
  Copy,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
} from "lucide-react";

interface WorkflowNode {
  id: string;
  type: "data-source" | "transform" | "output" | "filter" | "join";
  name: string;
  description: string;
  config: any;
  position: { x: number; y: number };
  status: "idle" | "running" | "success" | "error";
  inputs: string[];
  outputs: string[];
}

interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
  fromPort: string;
  toPort: string;
}

export default function NewWorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const dbService = clientDatabaseService;

  const [project, setProject] = useState<Project | null>(null);
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const loadedProject = await dbService.getProject(projectId);
      if (loadedProject) {
        setProject(loadedProject);
      }
      setLoading(false);
    } catch (error) {
      clientLogger.error("Failed to load project", "database", {
        projectId,
        error,
      });
      setLoading(false);
    }
  };

  const addNode = (
    type: WorkflowNode["type"],
    position: { x: number; y: number }
  ) => {
    const nodeId = `node_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const newNode: WorkflowNode = {
      id: nodeId,
      type,
      name: getNodeDefaultName(type),
      description: getNodeDefaultDescription(type),
      config: getNodeDefaultConfig(type),
      position,
      status: "idle",
      inputs: getNodeInputs(type),
      outputs: getNodeOutputs(type),
    };

    setNodes((prev) => [...prev, newNode]);
    setHasUnsavedChanges(true);
  };

  const getNodeDefaultName = (type: WorkflowNode["type"]): string => {
    const names = {
      "data-source": "Data Source",
      transform: "Transform",
      output: "Output",
      filter: "Filter",
      join: "Join",
    };
    return names[type];
  };

  const getNodeDefaultDescription = (type: WorkflowNode["type"]): string => {
    const descriptions = {
      "data-source": "Connect to a data source",
      transform: "Transform data using SQL or functions",
      output: "Export or save processed data",
      filter: "Filter data based on conditions",
      join: "Join multiple data sources",
    };
    return descriptions[type];
  };

  const getNodeDefaultConfig = (type: WorkflowNode["type"]): any => {
    const configs = {
      "data-source": { sourceType: "table", tableName: "" },
      transform: { sql: "", function: "select" },
      output: { outputType: "table", tableName: "" },
      filter: { conditions: [] },
      join: { joinType: "inner", conditions: [] },
    };
    return configs[type];
  };

  const getNodeInputs = (type: WorkflowNode["type"]): string[] => {
    const inputs = {
      "data-source": [],
      transform: ["data"],
      output: ["data"],
      filter: ["data"],
      join: ["data1", "data2"],
    };
    return inputs[type];
  };

  const getNodeOutputs = (type: WorkflowNode["type"]): string[] => {
    const outputs = {
      "data-source": ["data"],
      transform: ["data"],
      output: [],
      filter: ["data"],
      join: ["data"],
    };
    return outputs[type];
  };

  const getNodeIcon = (type: WorkflowNode["type"]) => {
    const icons = {
      "data-source": Database,
      transform: Code,
      output: Download,
      filter: Filter,
      join: BarChart3,
    };
    return icons[type];
  };

  const getNodeColor = (type: WorkflowNode["type"]): string => {
    const colors = {
      "data-source":
        "bg-tangerine-500/20 text-tangerine-400 border-tangerine-500/30",
      transform: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      output: "bg-green-500/20 text-green-400 border-green-500/30",
      filter: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      join: "bg-apricot-500/20 text-apricot-400 border-apricot-500/30",
    };
    return colors[type];
  };

  const getStatusColor = (status: WorkflowNode["status"]): string => {
    const colors = {
      idle: "bg-dark_cyan-300/20 text-dark_cyan-400",
      running: "bg-yellow-500/20 text-yellow-400",
      success: "bg-green-500/20 text-green-400",
      error: "bg-red-500/20 text-red-400",
    };
    return colors[status];
  };

  const getStatusIcon = (status: WorkflowNode["status"]) => {
    const icons = {
      idle: Clock,
      running: Zap,
      success: CheckCircle,
      error: AlertCircle,
    };
    return icons[status];
  };

  const updateNode = (nodeId: string, updates: Partial<WorkflowNode>) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === nodeId ? { ...node, ...updates } : node))
    );
    setHasUnsavedChanges(true);
  };

  const deleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
    setConnections((prev) =>
      prev.filter((conn) => conn.from !== nodeId && conn.to !== nodeId)
    );
    setHasUnsavedChanges(true);
  };

  const addConnection = (
    from: string,
    to: string,
    fromPort: string,
    toPort: string
  ) => {
    const connectionId = `conn_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const newConnection: WorkflowConnection = {
      id: connectionId,
      from,
      to,
      fromPort,
      toPort,
    };

    setConnections((prev) => [...prev, newConnection]);
    setHasUnsavedChanges(true);
  };

  const deleteConnection = (connectionId: string) => {
    setConnections((prev) => prev.filter((conn) => conn.id !== connectionId));
    setHasUnsavedChanges(true);
  };

  const executeWorkflow = async () => {
    setIsExecuting(true);
    try {
      // Simulate workflow execution
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update node statuses
      setNodes((prev) =>
        prev.map((node) => ({
          ...node,
          status: "success" as const,
        }))
      );

      clientLogger.success(
        "Workflow executed successfully",
        "job-management",
        { nodeCount: nodes.length, connectionCount: connections.length },
        "NewWorkflowPage"
      );
    } catch (error) {
      clientLogger.error(
        "Workflow execution failed",
        "job-management",
        { error },
        "NewWorkflowPage"
      );
    } finally {
      setIsExecuting(false);
    }
  };

  const saveWorkflow = async () => {
    try {
      const workflow = {
        name: workflowName,
        description: workflowDescription,
        nodes,
        connections,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save workflow logic here
      clientLogger.success(
        "Workflow saved successfully",
        "job-management",
        { workflowName, nodeCount: nodes.length },
        "NewWorkflowPage"
      );

      setHasUnsavedChanges(false);
    } catch (error) {
      clientLogger.error(
        "Failed to save workflow",
        "job-management",
        { error },
        "NewWorkflowPage"
      );
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-dark_cyan-900 via-dark_cyan-800 to-dark_cyan-900">
        <div className="text-white">Loading workflow builder...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-dark_cyan-900 via-dark_cyan-800 to-dark_cyan-900">
        <div className="text-white">Project not found</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-dark_cyan-900 via-dark_cyan-800 to-dark_cyan-900">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-dark_cyan-200 border-opacity-10">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push(`/project/${projectId}/workflows`)}
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Workflows
          </Button>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-tangerine-500/20">
              <Zap className="h-5 w-5 text-tangerine-400" />
            </div>
            <div>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => {
                  setWorkflowName(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="text-xl font-bold text-white bg-transparent border-none outline-none"
                placeholder="Untitled Workflow"
              />
              <p className="text-sm text-dark_cyan-400">
                {project.name} - Workflow Builder
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <div className="text-sm text-yellow-400">Unsaved changes</div>
          )}

          <Button
            onClick={executeWorkflow}
            disabled={isExecuting || nodes.length === 0}
            variant="outline"
            icon={
              isExecuting ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )
            }
          >
            {isExecuting ? "Executing..." : "Execute"}
          </Button>

          <Button
            onClick={saveWorkflow}
            disabled={!hasUnsavedChanges}
            icon={<Save className="h-4 w-4" />}
          >
            Save Workflow
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-dark_cyan-100 bg-opacity-20 border-r border-dark_cyan-200 border-opacity-10 flex flex-col">
          {/* Node Library */}
          <div className="p-4 border-b border-dark_cyan-200 border-opacity-10">
            <h3 className="text-lg font-semibold text-white mb-4">
              Node Library
            </h3>
            <div className="space-y-2">
              {(
                [
                  "data-source",
                  "transform",
                  "filter",
                  "join",
                  "output",
                ] as const
              ).map((type) => {
                const Icon = getNodeIcon(type);
                const colorClass = getNodeColor(type);

                return (
                  <button
                    key={type}
                    onClick={() => addNode(type, { x: 100, y: 100 })}
                    className={`w-full p-3 rounded-lg border transition-all hover:bg-white/5 ${colorClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium text-white capitalize">
                          {type.replace("-", " ")}
                        </div>
                        <div className="text-xs text-dark_cyan-400">
                          {getNodeDefaultDescription(type)}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Workflow Info */}
          <div className="p-4 border-b border-dark_cyan-200 border-opacity-10">
            <h3 className="text-lg font-semibold text-white mb-4">
              Workflow Info
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-dark_cyan-400 mb-1">
                  Description
                </label>
                <textarea
                  value={workflowDescription}
                  onChange={(e) => {
                    setWorkflowDescription(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Describe your workflow..."
                  className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-tangerine-500 text-sm"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 rounded-lg bg-white/5">
                  <div className="text-dark_cyan-400">Nodes</div>
                  <div className="text-white font-medium">{nodes.length}</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <div className="text-dark_cyan-400">Connections</div>
                  <div className="text-white font-medium">
                    {connections.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Node Properties */}
          {selectedNode && (
            <div className="flex-1 p-4 overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-4">
                Node Properties
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-dark_cyan-400 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={selectedNode.name}
                    onChange={(e) =>
                      updateNode(selectedNode.id, { name: e.target.value })
                    }
                    className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-tangerine-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-dark_cyan-400 mb-1">
                    Description
                  </label>
                  <textarea
                    value={selectedNode.description}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        description: e.target.value,
                      })
                    }
                    className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-tangerine-500 text-sm"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => deleteNode(selectedNode.id)}
                    variant="outline"
                    size="sm"
                    icon={<Trash2 className="h-4 w-4" />}
                    className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                  >
                    Delete
                  </Button>

                  <Button
                    onClick={() => setSelectedNode(null)}
                    variant="outline"
                    size="sm"
                    icon={<Eye className="h-4 w-4" />}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-dark_cyan-100 bg-opacity-5">
          {nodes.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-tangerine-500/20 flex items-center justify-center mb-4 mx-auto">
                  <Zap className="w-8 h-8 text-tangerine-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Start Building Your Workflow
                </h3>
                <p className="text-dark_cyan-400 mb-6">
                  Add nodes from the sidebar to create your data processing
                  workflow
                </p>
                <Button
                  onClick={() => addNode("data-source", { x: 200, y: 200 })}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Add First Node
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full relative">
              {/* Render Nodes */}
              {nodes.map((node) => {
                const Icon = getNodeIcon(node.type);
                const colorClass = getNodeColor(node.type);
                const statusClass = getStatusColor(node.status);
                const StatusIcon = getStatusIcon(node.status);

                return (
                  <div
                    key={node.id}
                    className={`absolute p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${colorClass} ${
                      selectedNode?.id === node.id
                        ? "ring-2 ring-tangerine-400"
                        : ""
                    }`}
                    style={{
                      left: node.position.x,
                      top: node.position.y,
                      minWidth: "200px",
                    }}
                    onClick={() => setSelectedNode(node)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium text-white">
                          {node.name}
                        </span>
                      </div>
                      <StatusIcon className="h-4 w-4" />
                    </div>

                    <div className="text-xs text-dark_cyan-400 mb-2">
                      {node.description}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-dark_cyan-400 capitalize">
                        {node.type.replace("-", " ")}
                      </span>
                      <span className={`px-2 py-1 rounded ${statusClass}`}>
                        {node.status}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Render Connections */}
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 1 }}
              >
                {connections.map((connection) => {
                  const fromNode = nodes.find((n) => n.id === connection.from);
                  const toNode = nodes.find((n) => n.id === connection.to);

                  if (!fromNode || !toNode) return null;

                  const fromX = fromNode.position.x + 100; // Center of node
                  const fromY = fromNode.position.y + 50;
                  const toX = toNode.position.x + 100;
                  const toY = toNode.position.y + 50;

                  return (
                    <line
                      key={connection.id}
                      x1={fromX}
                      y1={fromY}
                      x2={toX}
                      y2={toY}
                      stroke="rgba(255, 255, 255, 0.3)"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                  );
                })}

                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="rgba(255, 255, 255, 0.3)"
                    />
                  </marker>
                </defs>
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
