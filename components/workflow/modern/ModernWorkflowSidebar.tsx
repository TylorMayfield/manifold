"use client";

import React, { useState, useCallback } from "react";
import { useReactFlow } from "reactflow";
import {
  Database,
  FileText,
  Server,
  Cloud,
  Filter,
  RotateCcw,
  ArrowUpDown,
  Code2,
  GitMerge,
  GitCompare,
  BarChart3,
  Download,
  Webhook,
  Zap,
  Search,
  Folder,
  Play,
  Plus,
  Settings,
  Eye,
  Book,
} from "lucide-react";
import Input from "../../ui/Input";

interface NodeTemplate {
  type: string;
  category: "input" | "transform" | "output" | "utility";
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  defaultConfig: any;
}

const nodeTemplates: NodeTemplate[] = [
  // Data Sources (Input)
  {
    type: "dataSource",
    category: "input",
    name: "CSV File",
    description: "Import data from CSV files",
    icon: FileText,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    defaultConfig: {
      sourceType: "csv",
      filePath: "",
    },
  },
  {
    type: "dataSource",
    category: "input",
    name: "Database",
    description: "Connect to SQL databases",
    icon: Database,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    defaultConfig: {
      sourceType: "database",
      connectionString: "",
    },
  },
  {
    type: "dataSource",
    category: "input",
    name: "REST API",
    description: "Fetch data from REST APIs",
    icon: Server,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    defaultConfig: {
      sourceType: "api",
      apiUrl: "",
      method: "GET",
    },
  },
  {
    type: "dataSource",
    category: "input",
    name: "Cloud Storage",
    description: "Import from S3, GCS, etc.",
    icon: Cloud,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    defaultConfig: {
      sourceType: "cloud",
      provider: "s3",
    },
  },

  // Transformations
  {
    type: "transform",
    category: "transform",
    name: "Filter Data",
    description: "Filter rows based on conditions",
    icon: Filter,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/20",
    defaultConfig: {
      transformType: "filter",
      filters: [],
    },
  },
  {
    type: "transform",
    category: "transform",
    name: "Map Fields",
    description: "Transform and map field values",
    icon: RotateCcw,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/20",
    defaultConfig: {
      transformType: "map",
      fieldMappings: [],
    },
  },
  {
    type: "transform",
    category: "transform",
    name: "Sort Data",
    description: "Sort rows by field values",
    icon: ArrowUpDown,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/20",
    defaultConfig: {
      transformType: "sort",
      sortBy: { field: "", direction: "asc" },
    },
  },
  {
    type: "transform",
    category: "transform",
    name: "Aggregate",
    description: "Calculate summary statistics",
    icon: BarChart3,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/20",
    defaultConfig: {
      transformType: "aggregate",
      aggregations: [],
    },
  },
  {
    type: "transform",
    category: "transform",
    name: "Custom Script",
    description: "Run custom JavaScript code",
    icon: Code2,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/20",
    defaultConfig: {
      transformType: "custom",
      customScript: "// Transform data\nreturn data;",
    },
  },

  // Utility Nodes
  {
    type: "merge",
    category: "utility",
    name: "Merge Data",
    description: "Join multiple datasets",
    icon: GitMerge,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    defaultConfig: {
      mergeType: "inner",
      joinKey: "id",
      conflictResolution: "left",
    },
  },
  {
    type: "diff",
    category: "utility",
    name: "Compare Data",
    description: "Find differences between datasets",
    icon: GitCompare,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    defaultConfig: {
      compareKey: "id",
      compareMode: "full",
      ignoreCase: false,
      outputFormat: "diff",
    },
  },

  // Outputs
  {
    type: "output",
    category: "output",
    name: "Database Table",
    description: "Save to database table",
    icon: Database,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    defaultConfig: {
      outputType: "database",
      tableName: "",
      destination: "",
    },
  },
  {
    type: "output",
    category: "output",
    name: "File Export",
    description: "Export to CSV/JSON files",
    icon: Download,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    defaultConfig: {
      outputType: "file",
      format: "csv",
      destination: "",
    },
  },
  {
    type: "output",
    category: "output",
    name: "API Call",
    description: "Send data to external API",
    icon: Server,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    defaultConfig: {
      outputType: "api",
      apiEndpoint: "",
      method: "POST",
    },
  },
  {
    type: "output",
    category: "output",
    name: "Webhook",
    description: "Trigger webhooks with data",
    icon: Webhook,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    defaultConfig: {
      outputType: "webhook",
      webhookUrl: "",
    },
  },
];

const categoryConfig = {
  input: {
    name: "Data Sources",
    icon: Database,
    color: "text-blue-400",
  },
  transform: {
    name: "Transformations", 
    icon: Settings,
    color: "text-indigo-400",
  },
  utility: {
    name: "Utilities",
    icon: Zap,
    color: "text-purple-400",
  },
  output: {
    name: "Outputs",
    icon: Download,
    color: "text-emerald-400",
  },
};

interface ModernWorkflowSidebarProps {
  className?: string;
}

const ModernWorkflowSidebar: React.FC<ModernWorkflowSidebarProps> = ({
  className = "",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"nodes" | "templates">("nodes");
  const reactFlowInstance = useReactFlow();

  const onDragStart = (event: React.DragEvent, nodeTemplate: NodeTemplate) => {
    event.dataTransfer.setData("application/reactflow", nodeTemplate.type);
    event.dataTransfer.setData("application/nodetemplate", JSON.stringify(nodeTemplate));
    event.dataTransfer.effectAllowed = "move";
  };

  const addNode = useCallback(
    (nodeTemplate: NodeTemplate, position: { x: number; y: number }) => {
      const id = `${nodeTemplate.type}-${Date.now()}`;
      const newNode = {
        id,
        type: nodeTemplate.type,
        position,
        data: {
          id,
          label: nodeTemplate.name,
          type: nodeTemplate.type,
          category: nodeTemplate.category,
          config: { ...nodeTemplate.defaultConfig },
          status: "idle" as const,
          version: 1,
        },
      };

      reactFlowInstance.addNodes([newNode]);
    },
    [reactFlowInstance]
  );

  const filteredTemplates = nodeTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, NodeTemplate[]>);

  return (
    <div className={`w-80 h-full flex flex-col native-sidebar ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-tangerine-400" />
          <h2 className="text-lg font-semibold text-white">Node Palette</h2>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search nodes..."
            className="pl-10 bg-dark_cyan-300/10 border-dark_cyan-200/20 focus:ring-tangerine-400"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab("nodes")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === "nodes"
              ? "text-tangerine-400 border-b-2 border-tangerine-400 bg-tangerine-500/10"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Database className="w-4 h-4" />
          Nodes
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === "templates"
              ? "text-tangerine-400 border-b-2 border-tangerine-400 bg-tangerine-500/10"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Book className="w-4 h-4" />
          Templates
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "nodes" && (
          <div className="space-y-6">
            {Object.entries(groupedTemplates).map(([category, templates]) => {
              const config = categoryConfig[category as keyof typeof categoryConfig];
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <config.icon className={`w-4 h-4 ${config.color}`} />
                    <h3 className="text-sm font-semibold text-white">
                      {config.name}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div
                        key={`${template.type}-${template.name}`}
                        draggable
                        onDragStart={(e) => onDragStart(e, template)}
                        onClick={() =>
                          addNode(template, {
                            x: Math.random() * 300,
                            y: Math.random() * 300,
                          })
                        }
                        className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-white/20 transition-all cursor-grab active:cursor-grabbing group hover:bg-white/5"
                      >
                        <div className={`p-2 rounded-lg ${template.bgColor} border border-white/20`}>
                          <template.icon className={`w-4 h-4 ${template.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white group-hover:text-tangerine-400 transition-colors">
                            {template.name}
                          </h4>
                          <p className="text-xs text-white/60 truncate">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "templates" && (
          <div className="space-y-3">
            {[
              {
                name: "ETL Pipeline",
                description: "Extract, Transform, Load workflow",
                icon: Database,
                nodes: ["CSV File", "Filter", "Transform", "Database"],
              },
              {
                name: "Data Validation",
                description: "Validate and clean data",
                icon: Filter,
                nodes: ["API", "Validate", "Clean", "Export"],
              },
              {
                name: "Data Comparison",
                description: "Compare datasets over time",
                icon: GitCompare,
                nodes: ["Database", "Database", "Compare", "Report"],
              },
              {
                name: "Data Merge",
                description: "Combine multiple data sources",
                icon: GitMerge,
                nodes: ["CSV", "API", "Merge", "Database"],
              },
            ].map((template, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border border-white/10 hover:border-white/20 transition-all cursor-pointer group hover:bg-white/5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-tangerine-500/20 border border-tangerine-500/30">
                    <template.icon className="w-4 h-4 text-tangerine-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white group-hover:text-tangerine-400 transition-colors">
                      {template.name}
                    </h4>
                    <p className="text-xs text-white/60">
                      {template.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-white/40">
                  <span>Nodes:</span>
                  <span className="text-white/60">
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
        <div className="text-xs text-white/60 text-center">
          <p>Drag nodes to canvas or click to add</p>
          <p className="mt-1">⌘ + Click for multi-select</p>
        </div>
      </div>
    </div>
  );
};

export default ModernWorkflowSidebar;