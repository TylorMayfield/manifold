"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import {
  Download,
  Database,
  Server,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Settings,
  Eye,
  FileText,
  Cloud,
  Webhook,
} from "lucide-react";

interface OutputNodeData {
  id: string;
  label: string;
  type: string;
  category: "input" | "transform" | "output" | "utility";
  config: {
    outputType: "database" | "file" | "api" | "visualization" | "webhook";
    destination: string;
    format?: "csv" | "json" | "parquet" | "xlsx";
    tableName?: string;
    apiEndpoint?: string;
    visualizationType?: "chart" | "dashboard" | "report";
    compression?: boolean;
    batchSize?: number;
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

const ModernOutputNode: React.FC<NodeProps<OutputNodeData>> = memo(
  ({ data, selected, id }) => {
    const getStatusIcon = () => {
      switch (data.status) {
        case "success":
          return <CheckCircle className="w-4 h-4 text-green-400" />;
        case "error":
          return <XCircle className="w-4 h-4 text-red-400" />;
        case "running":
          return (
            <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
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
          return "border-emerald-400/50 bg-emerald-900/20 shadow-emerald-500/20 shadow-lg";
        case "warning":
          return "border-yellow-400/50 bg-yellow-900/20 shadow-yellow-500/20";
        default:
          return "border-slate-600/50 bg-slate-800/80 hover:border-slate-500/70";
      }
    };

    const getOutputIcon = () => {
      switch (data.config.outputType) {
        case "database":
          return <Database className="w-5 h-5" />;
        case "file":
          return <FileText className="w-5 h-5" />;
        case "api":
          return <Server className="w-5 h-5" />;
        case "visualization":
          return <BarChart3 className="w-5 h-5" />;
        case "webhook":
          return <Webhook className="w-5 h-5" />;
        default:
          return <Download className="w-5 h-5" />;
      }
    };

    const getOutputDescription = () => {
      switch (data.config.outputType) {
        case "database":
          return `Save to ${data.config.tableName || "table"}`;
        case "file":
          return `Export as ${data.config.format?.toUpperCase() || "FILE"}`;
        case "api":
          return "Send to API endpoint";
        case "visualization":
          return `Create ${data.config.visualizationType || "chart"}`;
        case "webhook":
          return "Trigger webhook";
        default:
          return "Output data";
      }
    };

    const getDestinationInfo = () => {
      switch (data.config.outputType) {
        case "database":
          return data.config.tableName || "table";
        case "file":
          return data.config.destination.split("/").pop() || data.config.destination;
        case "api":
          return data.config.apiEndpoint ? new URL(data.config.apiEndpoint).hostname : "API";
        case "webhook":
          return "webhook";
        default:
          return data.config.destination;
      }
    };

    return (
      <div
        className={`relative min-w-[280px] max-w-[320px] rounded-xl border-2 backdrop-blur-xl transition-all duration-300 ${getStatusColor()} ${
          selected
            ? "ring-2 ring-emerald-400/50 ring-offset-2 ring-offset-slate-900"
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

        {/* Input Handle */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-emerald-400 border-2 border-white shadow-lg"
          style={{
            background: "#10b981",
            borderColor: "#ffffff",
          }}
        />

        {/* Node Content */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {getOutputIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm truncate">
                {data.label}
              </h3>
              <p className="text-xs text-slate-400 capitalize">
                {data.config.outputType} • Output
              </p>
            </div>
          </div>

          {/* Output Configuration */}
          <div className="mb-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
            <div className="text-xs text-slate-300 mb-2">
              {getOutputDescription()}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Destination:</span>
              <span className="text-slate-200 font-mono bg-slate-800/50 px-2 py-1 rounded truncate">
                {getDestinationInfo()}
              </span>
            </div>
          </div>

          {/* Format & Options */}
          <div className="mb-3 p-2 rounded-lg bg-slate-700/30 border border-slate-600/50">
            <div className="flex items-center justify-between text-xs">
              {data.config.format && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Format:</span>
                  <span className="text-slate-200 uppercase font-medium">
                    {data.config.format}
                  </span>
                </div>
              )}
              {data.config.batchSize && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Batch:</span>
                  <span className="text-slate-200">
                    {data.config.batchSize.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            {data.config.compression && (
              <div className="flex items-center gap-2 text-xs mt-1">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-slate-400">Compression enabled</span>
              </div>
            )}
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
                <div className="text-slate-400">Exported</div>
                <div className="text-slate-200 font-medium">
                  {data.rowsProcessed?.toLocaleString() || 0}
                </div>
              </div>
            </div>
          )}

          {data.executionTime && (
            <div className="mb-3 p-2 rounded bg-slate-700/30 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Export Time</span>
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
                    ? "text-emerald-400"
                    : data.status === "warning"
                    ? "text-yellow-400"
                    : "text-slate-400"
                }`}
              >
                {data.status === "running"
                  ? "Exporting..."
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
          <div className="absolute inset-0 rounded-xl border-2 border-emerald-400/30 animate-pulse" />
        )}
      </div>
    );
  }
);

ModernOutputNode.displayName = "ModernOutputNode";

export default ModernOutputNode;