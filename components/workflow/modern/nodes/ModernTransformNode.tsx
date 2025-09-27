"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import {
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Settings,
  Eye,
  Filter,
  RotateCw,
  ArrowUpDown,
  Code2,
} from "lucide-react";

interface TransformNodeData {
  id: string;
  label: string;
  type: string;
  category: "input" | "transform" | "output" | "utility";
  config: {
    transformType: "filter" | "map" | "sort" | "aggregate" | "custom";
    filters?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    fieldMappings?: Array<{
      sourceField: string;
      targetField: string;
      transform?: string;
    }>;
    sortBy?: {
      field: string;
      direction: "asc" | "desc";
    };
    aggregations?: Array<{
      field: string;
      function: "sum" | "avg" | "count" | "min" | "max";
    }>;
    customScript?: string;
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

const ModernTransformNode: React.FC<NodeProps<TransformNodeData>> = memo(
  ({ data, selected, id }) => {
    const getStatusIcon = () => {
      switch (data.status) {
        case "success":
          return <CheckCircle className="w-4 h-4 text-green-400" />;
        case "error":
          return <XCircle className="w-4 h-4 text-red-400" />;
        case "running":
          return (
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
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
          return "border-indigo-400/50 bg-indigo-900/20 shadow-indigo-500/20 shadow-lg";
        case "warning":
          return "border-yellow-400/50 bg-yellow-900/20 shadow-yellow-500/20";
        default:
          return "border-slate-600/50 bg-slate-800/80 hover:border-slate-500/70";
      }
    };

    const getTransformIcon = () => {
      switch (data.config.transformType) {
        case "filter":
          return <Filter className="w-5 h-5" />;
        case "map":
          return <RotateCw className="w-5 h-5" />;
        case "sort":
          return <ArrowUpDown className="w-5 h-5" />;
        case "aggregate":
          return <Zap className="w-5 h-5" />;
        case "custom":
          return <Code2 className="w-5 h-5" />;
        default:
          return <Zap className="w-5 h-5" />;
      }
    };

    const getTransformDescription = () => {
      switch (data.config.transformType) {
        case "filter":
          return `Filter with ${data.config.filters?.length || 0} conditions`;
        case "map":
          return `Map ${data.config.fieldMappings?.length || 0} fields`;
        case "sort":
          return `Sort by ${data.config.sortBy?.field || "field"}`;
        case "aggregate":
          return `Aggregate ${data.config.aggregations?.length || 0} functions`;
        case "custom":
          return "Custom transformation script";
        default:
          return "Transform data";
      }
    };

    const getTransformDetails = () => {
      switch (data.config.transformType) {
        case "filter":
          return data.config.filters?.map((filter, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="text-slate-200 font-mono bg-slate-800/50 px-2 py-1 rounded">
                {filter.field}
              </span>
              <span className="text-slate-400">{filter.operator}</span>
              <span className="text-slate-200 truncate">
                {String(filter.value)}
              </span>
            </div>
          ));
        case "map":
          return data.config.fieldMappings?.slice(0, 2).map((mapping, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="text-slate-200 font-mono bg-slate-800/50 px-1.5 py-0.5 rounded">
                {mapping.sourceField}
              </span>
              <span className="text-slate-400">→</span>
              <span className="text-slate-200 font-mono bg-slate-800/50 px-1.5 py-0.5 rounded">
                {mapping.targetField}
              </span>
            </div>
          ));
        case "sort":
          return (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-200 font-mono bg-slate-800/50 px-2 py-1 rounded">
                {data.config.sortBy?.field}
              </span>
              <span className="text-slate-400 capitalize">
                {data.config.sortBy?.direction}
              </span>
            </div>
          );
        case "aggregate":
          return data.config.aggregations?.slice(0, 2).map((agg, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 uppercase">{agg.function}</span>
              <span className="text-slate-200 font-mono bg-slate-800/50 px-2 py-1 rounded">
                {agg.field}
              </span>
            </div>
          ));
        default:
          return null;
      }
    };

    return (
      <div
        className={`relative min-w-[300px] max-w-[340px] rounded-xl border-2 backdrop-blur-xl transition-all duration-300 ${getStatusColor()} ${
          selected
            ? "ring-2 ring-indigo-400/50 ring-offset-2 ring-offset-slate-900"
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
          className="w-3 h-3 bg-indigo-400 border-2 border-white shadow-lg"
          style={{
            background: "#6366f1",
            borderColor: "#ffffff",
          }}
        />

        {/* Output Handle */}
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-indigo-400 border-2 border-white shadow-lg"
          style={{
            background: "#6366f1",
            borderColor: "#ffffff",
          }}
        />

        {/* Node Content */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {getTransformIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm truncate">
                {data.label}
              </h3>
              <p className="text-xs text-slate-400 capitalize">
                {data.config.transformType} • Transform
              </p>
            </div>
          </div>

          {/* Transform Configuration */}
          <div className="mb-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
            <div className="text-xs text-slate-300 mb-2">
              {getTransformDescription()}
            </div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {getTransformDetails()}
              {((data.config.transformType === "filter" &&
                (data.config.filters?.length || 0) > 2) ||
                (data.config.transformType === "map" &&
                  (data.config.fieldMappings?.length || 0) > 2) ||
                (data.config.transformType === "aggregate" &&
                  (data.config.aggregations?.length || 0) > 2)) && (
                <div className="text-xs text-slate-500 italic">
                  ... and more
                </div>
              )}
            </div>
          </div>

          {/* Custom Script Preview */}
          {data.config.transformType === "custom" &&
            data.config.customScript && (
              <div className="mb-3 p-2 rounded-lg bg-slate-700/30 border border-slate-600/50">
                <div className="text-xs text-slate-400 mb-1">Script</div>
                <div className="text-xs text-slate-300 font-mono bg-slate-800/50 p-2 rounded max-h-16 overflow-hidden">
                  {data.config.customScript.split("\n")[0]}
                  {data.config.customScript.includes("\n") && "..."}
                </div>
              </div>
            )}

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
                <div className="text-slate-400">Processed</div>
                <div className="text-slate-200 font-medium">
                  {data.rowsProcessed?.toLocaleString() || 0}
                </div>
              </div>
            </div>
          )}

          {data.executionTime && (
            <div className="mb-3 p-2 rounded bg-slate-700/30 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Transform Time</span>
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
                    ? "text-indigo-400"
                    : data.status === "warning"
                    ? "text-yellow-400"
                    : "text-slate-400"
                }`}
              >
                {data.status === "running"
                  ? "Transforming..."
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
          <div className="absolute inset-0 rounded-xl border-2 border-indigo-400/30 animate-pulse" />
        )}
      </div>
    );
  }
);

ModernTransformNode.displayName = "ModernTransformNode";

export default ModernTransformNode;