"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import {
  Merge,
  GitMerge,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Settings,
  Eye,
  Users,
  ArrowRightLeft,
} from "lucide-react";

interface MergeNodeData {
  id: string;
  label: string;
  type: string;
  category: "input" | "transform" | "output" | "utility";
  config: {
    mergeType: "inner" | "left" | "right" | "outer" | "union";
    joinKey: string;
    conflictResolution: "left" | "right" | "merge" | "error";
    includeMetadata?: boolean;
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

const ModernMergeNode: React.FC<NodeProps<MergeNodeData>> = memo(
  ({ data, selected, id }) => {
    const getStatusIcon = () => {
      switch (data.status) {
        case "success":
          return <CheckCircle className="w-4 h-4 text-green-400" />;
        case "error":
          return <XCircle className="w-4 h-4 text-red-400" />;
        case "running":
          return (
            <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
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
          return "border-purple-400/50 bg-purple-900/20 shadow-purple-500/20 shadow-lg";
        case "warning":
          return "border-yellow-400/50 bg-yellow-900/20 shadow-yellow-500/20";
        default:
          return "border-slate-600/50 bg-slate-800/80 hover:border-slate-500/70";
      }
    };

    const getMergeTypeIcon = () => {
      switch (data.config.mergeType) {
        case "inner":
          return "⋂";
        case "left":
          return "⟵";
        case "right":
          return "⟶";
        case "outer":
          return "⋃";
        case "union":
          return "∪";
        default:
          return "⋈";
      }
    };

    const getMergeTypeDescription = () => {
      switch (data.config.mergeType) {
        case "inner":
          return "Keep only matching records";
        case "left":
          return "Keep all from left dataset";
        case "right":
          return "Keep all from right dataset";
        case "outer":
          return "Keep all records from both";
        case "union":
          return "Combine all records";
        default:
          return "Join datasets";
      }
    };

    return (
      <div
        className={`relative min-w-[300px] max-w-[340px] rounded-xl border-2 backdrop-blur-xl transition-all duration-300 ${getStatusColor()} ${
          selected
            ? "ring-2 ring-purple-400/50 ring-offset-2 ring-offset-slate-900"
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

        {/* Input Handles - Multiple inputs */}
        <Handle
          type="target"
          position={Position.Left}
          id="input-1"
          className="w-3 h-3 bg-purple-400 border-2 border-white shadow-lg"
          style={{
            background: "#a855f7",
            borderColor: "#ffffff",
            top: "30%",
          }}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="input-2"
          className="w-3 h-3 bg-purple-400 border-2 border-white shadow-lg"
          style={{
            background: "#a855f7",
            borderColor: "#ffffff",
            top: "70%",
          }}
        />

        {/* Output Handle */}
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-purple-400 border-2 border-white shadow-lg"
          style={{
            background: "#a855f7",
            borderColor: "#ffffff",
          }}
        />

        {/* Node Content */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <GitMerge className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm truncate">
                {data.label}
              </h3>
              <p className="text-xs text-slate-400">
                Merge • {data.config.mergeType.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Merge Configuration */}
          <div className="mb-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Join Type</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono text-purple-400">
                  {getMergeTypeIcon()}
                </span>
                <span className="text-xs text-slate-200 capitalize">
                  {data.config.mergeType}
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-300">
              {getMergeTypeDescription()}
            </div>
          </div>

          {/* Join Key */}
          <div className="mb-3 p-2 rounded-lg bg-slate-700/30 border border-slate-600/50">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Join Key:</span>
              <span className="text-slate-200 font-mono bg-slate-800/50 px-2 py-1 rounded">
                {data.config.joinKey}
              </span>
            </div>
          </div>

          {/* Conflict Resolution */}
          <div className="mb-3 p-2 rounded-lg bg-slate-700/30 border border-slate-600/50">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Conflicts:</span>
              <span className="text-slate-200 capitalize">
                {data.config.conflictResolution} priority
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
                <div className="text-slate-400">Merged Rows</div>
                <div className="text-slate-200 font-medium">
                  {data.rowsProcessed?.toLocaleString() || 0}
                </div>
              </div>
            </div>
          )}

          {data.executionTime && (
            <div className="mb-3 p-2 rounded bg-slate-700/30 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Merge Time</span>
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
                    ? "text-purple-400"
                    : data.status === "warning"
                    ? "text-yellow-400"
                    : "text-slate-400"
                }`}
              >
                {data.status === "running"
                  ? "Merging..."
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
              {data.config.includeMetadata && (
                <div className="w-6 h-6 rounded bg-slate-600/50 flex items-center justify-center">
                  <Users className="w-3 h-3 text-slate-400" />
                </div>
              )}
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
          <div className="absolute inset-0 rounded-xl border-2 border-purple-400/30 animate-pulse" />
        )}

        {/* Visual Merge Indicator */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 -translate-x-1/2">
          <div className="flex items-center">
            <ArrowRightLeft className="w-4 h-4 text-purple-400/60" />
          </div>
        </div>
      </div>
    );
  }
);

ModernMergeNode.displayName = "ModernMergeNode";

export default ModernMergeNode;