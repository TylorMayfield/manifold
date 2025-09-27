"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import {
  Database,
  FileText,
  Server,
  Cloud,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Play,
  Settings,
  Eye,
} from "lucide-react";

interface DataSourceNodeData {
  id: string;
  label: string;
  type: string;
  category: "input" | "transform" | "output" | "utility";
  config: {
    sourceType: "csv" | "json" | "database" | "api" | "cloud";
    filePath?: string;
    connectionString?: string;
    apiUrl?: string;
    tableName?: string;
    query?: string;
  };
  status: "idle" | "running" | "success" | "error" | "warning";
  lastRun?: Date;
  executionTime?: number;
  rowsProcessed?: number;
  outputSchema?: any;
  version: number;
  isLocked?: boolean;
  notes?: string;
}

const ModernDataSourceNode: React.FC<NodeProps<DataSourceNodeData>> = memo(
  ({ data, selected, id }) => {
    const getIcon = () => {
      switch (data.config.sourceType) {
        case "csv":
        case "json":
          return <FileText className="w-5 h-5" />;
        case "database":
          return <Database className="w-5 h-5" />;
        case "api":
          return <Server className="w-5 h-5" />;
        case "cloud":
          return <Cloud className="w-5 h-5" />;
        default:
          return <Database className="w-5 h-5" />;
      }
    };

    const getStatusIcon = () => {
      switch (data.status) {
        case "success":
          return <CheckCircle className="w-4 h-4 text-green-400" />;
        case "error":
          return <XCircle className="w-4 h-4 text-red-400" />;
        case "running":
          return (
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          );
        case "warning":
          return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
        default:
          return <Clock className="w-4 h-4 text-gray-400" />;
      }
    };

    const getStatusColor = () => {
      switch (data.status) {
        case "success":
          return "border-green-400/50 bg-green-900/20 shadow-green-500/20";
        case "error":
          return "border-red-400/50 bg-red-900/20 shadow-red-500/20";
        case "running":
          return "border-blue-400/50 bg-blue-900/20 shadow-blue-500/20 shadow-lg";
        case "warning":
          return "border-yellow-400/50 bg-yellow-900/20 shadow-yellow-500/20";
        default:
          return "border-slate-600/50 bg-slate-800/80 hover:border-slate-500/70";
      }
    };

    const getConnectionInfo = () => {
      const { config } = data;
      if (config.filePath) {
        return config.filePath.split("/").pop() || config.filePath;
      }
      if (config.apiUrl) {
        return new URL(config.apiUrl).hostname;
      }
      if (config.tableName) {
        return config.tableName;
      }
      return config.sourceType.toUpperCase();
    };

    return (
      <div
        className={`relative min-w-[280px] max-w-[320px] rounded-xl border-2 backdrop-blur-xl transition-all duration-300 ${getStatusColor()} ${
          selected
            ? "ring-2 ring-blue-400/50 ring-offset-2 ring-offset-slate-900"
            : ""
        } ${data.isLocked ? "opacity-60" : ""}`}
      >
        {/* Status Indicator */}
        <div className="absolute -top-2 -right-2 z-10">
          <div className="p-1.5 rounded-full bg-slate-800 border border-slate-600">
            {getStatusIcon()}
          </div>
        </div>

        {/* Lock Indicator */}
        {data.isLocked && (
          <div className="absolute -top-2 -left-2 z-10">
            <div className="p-1.5 rounded-full bg-slate-800 border border-slate-600">
              <Settings className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        )}

        {/* Output Handle */}
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-blue-400 border-2 border-white shadow-lg"
          style={{
            background: "#60a5fa",
            borderColor: "#ffffff",
          }}
        />

        {/* Node Content */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm truncate">
                {data.label}
              </h3>
              <p className="text-xs text-slate-400 capitalize">
                {data.config.sourceType} • Data Source
              </p>
            </div>
          </div>

          {/* Connection Info */}
          <div className="mb-3 p-2 rounded-lg bg-slate-700/30 border border-slate-600/50">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Source:</span>
              <span className="text-slate-200 truncate font-mono">
                {getConnectionInfo()}
              </span>
            </div>
          </div>

          {/* Execution Stats */}
          {data.lastRun && (
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div className="p-2 rounded bg-slate-700/30">
                <div className="text-slate-400">Last Run</div>
                <div className="text-slate-200 font-medium">
                  {data.lastRun.toLocaleTimeString()}
                </div>
              </div>
              <div className="p-2 rounded bg-slate-700/30">
                <div className="text-slate-400">Rows</div>
                <div className="text-slate-200 font-medium">
                  {data.rowsProcessed?.toLocaleString() || 0}
                </div>
              </div>
            </div>
          )}

          {data.executionTime && (
            <div className="mb-3 p-2 rounded bg-slate-700/30 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Execution Time</span>
                <span className="text-slate-200 font-medium">
                  {data.executionTime.toFixed(0)}ms
                </span>
              </div>
            </div>
          )}

          {/* Status Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-600/50">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium ${
                  data.status === "success"
                    ? "text-green-400"
                    : data.status === "error"
                    ? "text-red-400"
                    : data.status === "running"
                    ? "text-blue-400"
                    : data.status === "warning"
                    ? "text-yellow-400"
                    : "text-slate-400"
                }`}
              >
                {data.status === "running"
                  ? "Running..."
                  : data.status === "success"
                  ? "Ready"
                  : data.status === "error"
                  ? "Error"
                  : data.status === "warning"
                  ? "Warning"
                  : "Idle"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {data.outputSchema && (
                <div className="w-6 h-6 rounded bg-slate-600/50 flex items-center justify-center">
                  <Eye className="w-3 h-3 text-slate-400" />
                </div>
              )}
              <div className="text-xs text-slate-500">v{data.version}</div>
            </div>
          </div>

          {/* Notes */}
          {data.notes && (
            <div className="mt-3 p-2 rounded bg-slate-700/20 border border-slate-600/30">
              <div className="text-xs text-slate-300">{data.notes}</div>
            </div>
          )}
        </div>

        {/* Animated Border for Running State */}
        {data.status === "running" && (
          <div className="absolute inset-0 rounded-xl border-2 border-blue-400/30 animate-pulse" />
        )}
      </div>
    );
  }
);

ModernDataSourceNode.displayName = "ModernDataSourceNode";

export default ModernDataSourceNode;