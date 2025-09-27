"use client";

import React, { useState, useCallback, useRef } from "react";
import { ArrowLeft, Save, Play, Folder, Zap } from "lucide-react";
import Button from "../ui/Button";
import WorkflowCanvas from "./WorkflowCanvas";
import WorkflowSidebar from "./WorkflowSidebar";
import { WorkflowNode, WorkflowEdge } from "./WorkflowCanvas";
import { clientLogger } from "../../lib/utils/ClientLogger";

interface WorkflowPageProps {
  projectId?: string;
}

interface SavedWorkflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  lastModified: Date;
  nodeCount: number;
}

const WorkflowPage: React.FC<WorkflowPageProps> = ({ projectId }) => {
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<{
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  }>({ nodes: [], edges: [] });
  const [isExecuting, setIsExecuting] = useState(false);
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const canvasRef = useRef<any>(null);

  // Handle adding nodes from sidebar
  const handleAddNode = useCallback(
    (type: string, position: { x: number; y: number }) => {
      if (canvasRef.current) {
        canvasRef.current.addNode(type, position);
      }
    },
    []
  );

  // Handle workflow execution
  const handleExecuteWorkflow = useCallback(async () => {
    setIsExecuting(true);
    try {
      // The execution logic is handled in the WorkflowCanvas component
      clientLogger.info("Workflow execution started", "user-action", {
        projectId,
        nodeCount: currentWorkflow.nodes.length,
      });
    } catch (error) {
      clientLogger.error("Workflow execution failed", "system", { error });
    } finally {
      setIsExecuting(false);
    }
  }, [currentWorkflow, projectId]);

  // Handle saving workflow
  const handleSaveWorkflow = useCallback(() => {
    const newWorkflow: SavedWorkflow = {
      id: `workflow-${Date.now()}`,
      name: workflowName,
      description: "Workflow created in Manifold",
      nodes: currentWorkflow.nodes,
      edges: currentWorkflow.edges,
      lastModified: new Date(),
      nodeCount: currentWorkflow.nodes.length,
    };

    setWorkflows((prev) => {
      const existingIndex = prev.findIndex((w) => w.name === workflowName);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newWorkflow;
        return updated;
      }
      return [newWorkflow, ...prev];
    });

    clientLogger.info("Workflow saved", "user-action", {
      workflowId: newWorkflow.id,
      workflowName: newWorkflow.name,
      nodeCount: newWorkflow.nodeCount,
    });
  }, [workflowName, currentWorkflow]);

  // Handle loading workflow
  const handleLoadWorkflow = useCallback((workflow: SavedWorkflow) => {
    setCurrentWorkflow({
      nodes: workflow.nodes,
      edges: workflow.edges,
    });
    setWorkflowName(workflow.name);

    clientLogger.info("Workflow loaded", "system", {
      workflowId: workflow.id,
      workflowName: workflow.name,
    });
  }, []);

  // Handle workflow updates from canvas
  const handleWorkflowUpdate = useCallback(
    (workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => {
      setCurrentWorkflow(workflow);
    },
    []
  );

  // Handle workflow execution results
  const handleWorkflowExecute = useCallback(
    (result: any) => {
      clientLogger.success("Workflow executed successfully", "system", {
        projectId,
        result,
      });
    },
    [projectId]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark_cyan-200 border-opacity-10">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-tangerine-400" />
          <h1 className="text-lg font-semibold text-white">Workflow Builder</h1>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-dark_cyan-300 bg-opacity-10 border border-dark_cyan-200 border-opacity-20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tangerine-400"
            placeholder="Workflow name"
          />
          <Button
            onClick={handleSaveWorkflow}
            variant="outline"
            size="sm"
            icon={<Save className="w-4 h-4" />}
            disabled={currentWorkflow.nodes.length === 0}
          >
            Save
          </Button>
          <Button
            onClick={handleExecuteWorkflow}
            variant="default"
            size="sm"
            icon={<Play className="w-4 h-4" />}
            disabled={isExecuting || currentWorkflow.nodes.length === 0}
          >
            {isExecuting ? "Executing..." : "Execute"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <WorkflowSidebar
          onAddNode={handleAddNode}
          onSaveWorkflow={handleSaveWorkflow}
          onExecuteWorkflow={handleExecuteWorkflow}
          onLoadWorkflow={handleLoadWorkflow}
          isExecuting={isExecuting}
          workflows={workflows}
        />

        {/* Canvas */}
        <div className="flex-1 relative">
          <WorkflowCanvas
            ref={canvasRef}
            onWorkflowExecute={handleWorkflowExecute}
            onWorkflowSave={handleWorkflowUpdate}
            initialNodes={currentWorkflow.nodes}
            initialEdges={currentWorkflow.edges}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-dark_cyan-200 border-opacity-10 bg-dark_cyan-100 bg-opacity-5">
        <div className="flex items-center gap-4 text-sm text-dark_cyan-400">
          <span>Nodes: {currentWorkflow.nodes.length}</span>
          <span>Connections: {currentWorkflow.edges.length}</span>
          <span>Status: {isExecuting ? "Executing" : "Ready"}</span>
        </div>
      </div>
    </div>
  );
};

export default WorkflowPage;
