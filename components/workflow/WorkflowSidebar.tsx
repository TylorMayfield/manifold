"use client";

import React, { useState } from "react";
import {
  Database,
  Settings,
  BarChart3,
  Code,
  Filter,
  ArrowRight,
  SortAsc,
  Link,
  FileText,
  Server,
  Cloud,
  Download,
  Eye,
  Play,
  Save,
  Folder,
  Zap,
  Plus,
  Search,
} from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";

interface WorkflowSidebarProps {
  onAddNode: (type: string, position: { x: number; y: number }) => void;
  onSaveWorkflow: () => void;
  onExecuteWorkflow: () => void;
  onLoadWorkflow: (workflow: any) => void;
  isExecuting?: boolean;
  workflows?: Array<{
    id: string;
    name: string;
    description?: string;
    lastModified: Date;
    nodeCount: number;
  }>;
}

const WorkflowSidebar: React.FC<WorkflowSidebarProps> = React.memo(
  ({
    onAddNode,
    onSaveWorkflow,
    onExecuteWorkflow,
    onLoadWorkflow,
    isExecuting = false,
    workflows = [],
  }) => {
    const [activeTab, setActiveTab] = useState<
      "nodes" | "workflows" | "templates"
    >("nodes");
    const [searchTerm, setSearchTerm] = useState("");

    const nodeCategories = [
      {
        name: "Data Sources",
        icon: Database,
        nodes: [
          {
            type: "dataSource",
            name: "CSV File",
            description: "Import data from CSV files",
            icon: FileText,
            color: "text-dark_cyan-400",
            bgColor: "bg-dark_cyan-500/20",
          },
          {
            type: "dataSource",
            name: "Database",
            description: "Connect to SQL databases",
            icon: Database,
            color: "text-apricot-400",
            bgColor: "bg-apricot-500/20",
          },
          {
            type: "dataSource",
            name: "API Endpoint",
            description: "Fetch data from REST APIs",
            icon: Server,
            color: "text-tangerine-400",
            bgColor: "bg-tangerine-500/20",
          },
          {
            type: "dataSource",
            name: "Cloud Storage",
            description: "Import from cloud storage",
            icon: Cloud,
            color: "text-jasper-400",
            bgColor: "bg-jasper-500/20",
          },
        ],
      },
      {
        name: "Transformations",
        icon: Settings,
        nodes: [
          {
            type: "transform",
            name: "Filter Data",
            description: "Filter rows based on conditions",
            icon: Filter,
            color: "text-orange-400",
            bgColor: "bg-orange-500/20",
          },
          {
            type: "transform",
            name: "Map Fields",
            description: "Transform and map field values",
            icon: ArrowRight,
            color: "text-yellow-400",
            bgColor: "bg-yellow-500/20",
          },
          {
            type: "transform",
            name: "Sort Data",
            description: "Sort rows by field values",
            icon: SortAsc,
            color: "text-pink-400",
            bgColor: "bg-pink-500/20",
          },
          {
            type: "transform",
            name: "Join Data",
            description: "Join with other data sources",
            icon: Link,
            color: "text-indigo-400",
            bgColor: "bg-indigo-500/20",
          },
          {
            type: "transform",
            name: "Aggregate",
            description: "Calculate summary statistics",
            icon: BarChart3,
            color: "text-emerald-400",
            bgColor: "bg-emerald-500/20",
          },
        ],
      },
      {
        name: "Outputs",
        icon: BarChart3,
        nodes: [
          {
            type: "output",
            name: "Database Table",
            description: "Save to database table",
            icon: Database,
            color: "text-green-400",
            bgColor: "bg-green-500/20",
          },
          {
            type: "output",
            name: "File Export",
            description: "Export to CSV/JSON files",
            icon: Download,
            color: "text-blue-400",
            bgColor: "bg-blue-500/20",
          },
          {
            type: "output",
            name: "API Call",
            description: "Send data to external API",
            icon: Server,
            color: "text-purple-400",
            bgColor: "bg-purple-500/20",
          },
          {
            type: "output",
            name: "Visualization",
            description: "Create charts and dashboards",
            icon: Eye,
            color: "text-cyan-400",
            bgColor: "bg-cyan-500/20",
          },
        ],
      },
      {
        name: "Custom",
        icon: Code,
        nodes: [
          {
            type: "custom",
            name: "JavaScript",
            description: "Run custom JavaScript code",
            icon: Code,
            color: "text-yellow-400",
            bgColor: "bg-yellow-500/20",
          },
          {
            type: "custom",
            name: "Python Script",
            description: "Execute Python scripts",
            icon: Zap,
            color: "text-green-400",
            bgColor: "bg-green-500/20",
          },
        ],
      },
    ];

    const handleNodeDrag = (nodeType: string, event: React.DragEvent) => {
      event.dataTransfer.setData("application/reactflow", nodeType);
      event.dataTransfer.effectAllowed = "move";
    };

    const filteredCategories = nodeCategories
      .map((category) => ({
        ...category,
        nodes: category.nodes.filter(
          (node) =>
            node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            node.description.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      }))
      .filter((category) => category.nodes.length > 0);

    return (
      <div className="w-80 h-full flex flex-col glass-card">
        {/* Header */}
        <div className="p-4 border-b border-dark_cyan-200 border-opacity-10">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-tangerine-400" />
            <h2 className="text-lg font-semibold text-white">Nodes</h2>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark_cyan-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search nodes..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark_cyan-200 border-opacity-10">
          {[
            { id: "nodes", label: "Nodes", icon: Database },
            { id: "workflows", label: "Workflows", icon: Folder },
            { id: "templates", label: "Templates", icon: Zap },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === id
                  ? "text-tangerine-400 border-b-2 border-tangerine-400 bg-tangerine-500/10"
                  : "text-dark_cyan-400 hover:text-white hover:bg-dark_cyan-300 hover:bg-opacity-10"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "nodes" && (
            <div className="space-y-6">
              {filteredCategories.map((category) => (
                <div key={category.name}>
                  <div className="flex items-center gap-2 mb-3">
                    <category.icon className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-300">
                      {category.name}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {category.nodes.map((node, index) => (
                      <div
                        key={`${node.type}-${index}`}
                        draggable
                        onDragStart={(e) => handleNodeDrag(node.type, e)}
                        className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-white/20 transition-colors cursor-grab active:cursor-grabbing group"
                      >
                        <div className={`p-2 rounded-lg ${node.bgColor}`}>
                          <node.icon className={`w-4 h-4 ${node.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                            {node.name}
                          </h4>
                          <p className="text-xs text-gray-400 truncate">
                            {node.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "workflows" && (
            <div className="space-y-3">
              {workflows.length === 0 ? (
                <div className="text-center py-8">
                  <Folder className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No workflows saved</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Create and save your first workflow
                  </p>
                </div>
              ) : (
                workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="p-3 rounded-lg border border-white/10 hover:border-white/20 transition-colors cursor-pointer group"
                    onClick={() => onLoadWorkflow(workflow)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                        {workflow.name}
                      </h4>
                      <span className="text-xs text-gray-400">
                        {workflow.nodeCount} nodes
                      </span>
                    </div>
                    {workflow.description && (
                      <p className="text-xs text-gray-400 mb-2">
                        {workflow.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Modified: {workflow.lastModified.toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "templates" && (
            <div className="space-y-3">
              {[
                {
                  name: "ETL Pipeline",
                  description: "Extract, Transform, Load workflow",
                  icon: ArrowRight,
                  nodes: ["CSV File", "Filter", "Transform", "Database"],
                },
                {
                  name: "Data Validation",
                  description: "Validate and clean data",
                  icon: Filter,
                  nodes: ["API", "Validate", "Clean", "Export"],
                },
                {
                  name: "Real-time Sync",
                  description: "Sync data in real-time",
                  icon: Zap,
                  nodes: ["Database", "Webhook", "Transform", "API"],
                },
              ].map((template, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-white/10 hover:border-white/20 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <template.icon className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                        {template.name}
                      </h4>
                      <p className="text-xs text-gray-400">
                        {template.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span>Nodes:</span>
                    <span className="text-gray-400">
                      {template.nodes.join(" → ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-gray-400 text-center">
            <p>Drag nodes to canvas to build workflows</p>
            <p className="mt-1">Inspired by n8n workflow automation</p>
          </div>
        </div>
      </div>
    );
  }
);

WorkflowSidebar.displayName = "WorkflowSidebar";

export default WorkflowSidebar;
