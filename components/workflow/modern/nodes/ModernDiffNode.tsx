"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import {
  GitCompare,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Settings,
  Eye,
  TrendingUp,
  TrendingDown,
  Equal,
  Plus,
  Minus,
} from "lucide-react";

interface DiffNodeData {
  id: string;
  label: string;
  type: string;
  category: "input" | "transform" | "output" | "utility";
  config: {
    compareKey: string;
    compareMode: "full" | "schema" | "values" | "structure";
    ignoreCase?: boolean;
    ignoreWhitespace?: boolean;
    trackChanges?: boolean;
    outputFormat: "diff" | "summary" | "changes_only";
  };
  status: "idle" | "running" | "success" | "error" | "warning";
  lastRun?: Date;
  executionTime?: number;
  rowsProcessed?: number;
  outputSchema?: any;
  version: number;
  isLocked?: boolean;
  notes?: string;
  diffSummary?: {
    added: number;
    deleted: number;
    modified: number;
    unchanged: number;
  };
}

const ModernDiffNode: React.FC<NodeProps<DiffNodeData>> = memo(
  ({ data, selected, id }) => {
    const getStatusIcon = () => {
      switch (data.status) {
        case "success":
          return <CheckCircle className="w-4 h-4 text-green-400" />;
        case "error":
          return <XCircle className="w-4 h-4 text-red-400" />;
        case "running":
          return (
            <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
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
          return "border-orange-400/50 bg-orange-900/20 shadow-orange-500/20 shadow-lg";
        case "warning":
          return "border-yellow-400/50 bg-yellow-900/20 shadow-yellow-500/20";
        default:
          return "border-slate-600/50 bg-slate-800/80 hover:border-slate-500/70";
      }
    };

    const getModeDescription = () => {
      switch (data.config.compareMode) {
        case "full":
          return "Complete data comparison";
        case "schema":
          return "Structure comparison only";
        case "values":
          return "Value comparison only";
        case "structure":
          return "Schema and structure";
        default:
          return "Compare datasets";
      }
    };

    const getTotalChanges = () => {
      if (!data.diffSummary) return 0;
      return (
        data.diffSummary.added +
        data.diffSummary.deleted +
        data.diffSummary.modified
      );
    };

    return (
      <div
        className={`relative min-w-[300px] max-w-[340px] rounded-xl border-2 backdrop-blur-xl transition-all duration-300 ${getStatusColor()} ${
          selected
            ? "ring-2 ring-orange-400/50 ring-offset-2 ring-offset-slate-900"
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

        {/* Input Handles - Two inputs for comparison */}
        <Handle
          type="target"
          position={Position.Left}
          id="dataset-1"
          className="w-3 h-3 bg-orange-400 border-2 border-white shadow-lg"
          style={{
            background: "#fb923c",
            borderColor: "#ffffff",
            top: "30%",
          }}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="dataset-2"
          className="w-3 h-3 bg-orange-400 border-2 border-white shadow-lg"
          style={{
            background: "#fb923c",
            borderColor: "#ffffff",
            top: "70%",
          }}
        />

        {/* Output Handle */}
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-orange-400 border-2 border-white shadow-lg"
          style={{
            background: "#fb923c",
            borderColor: "#ffffff",
          }}
        />

        {/* Node Content */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <GitCompare className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm truncate">
                {data.label}
              </h3>
              <p className="text-xs text-slate-400">
                Diff • {data.config.compareMode.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Compare Configuration */}
          <div className="mb-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Mode</span>
              <span className="text-xs text-slate-200 capitalize">
                {data.config.compareMode}
              </span>
            </div>
            <div className="text-xs text-slate-300">
              {getModeDescription()}
            </div>
          </div>

          {/* Compare Key */}
          <div className="mb-3 p-2 rounded-lg bg-slate-700/30 border border-slate-600/50">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Compare Key:</span>
              <span className="text-slate-200 font-mono bg-slate-800/50 px-2 py-1 rounded">
                {data.config.compareKey}
              </span>
            </div>
          </div>

          {/* Diff Options */}
          <div className="mb-3 p-2 rounded-lg bg-slate-700/30 border border-slate-600/50">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    data.config.ignoreCase ? "bg-green-400" : "bg-gray-500"
                  }`}
                />
                <span className="text-slate-400">Case</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    data.config.ignoreWhitespace ? "bg-green-400" : "bg-gray-500"
                  }`}
                />
                <span className="text-slate-400">Space</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    data.config.trackChanges ? "bg-green-400" : "bg-gray-500"
                  }`}
                />
                <span className="text-slate-400">Track</span>
              </div>
            </div>
          </div>

          {/* Diff Summary */}
          {data.diffSummary && (
            <div className="mb-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
              <div className="text-xs text-slate-400 mb-2">
                Changes Summary
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Plus className="w-3 h-3 text-green-400" />
                  <span className="text-slate-300">
                    {data.diffSummary.added}
                  </span>
                  <span className="text-slate-500">added</span>
                </div>
                <div className="flex items-center gap-2">
                  <Minus className="w-3 h-3 text-red-400" />
                  <span className="text-slate-300">
                    {data.diffSummary.deleted}
                  </span>
                  <span className="text-slate-500">deleted</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-yellow-400" />
                  <span className="text-slate-300">
                    {data.diffSummary.modified}
                  </span>
                  <span className="text-slate-500">modified</span>
                </div>
                <div className="flex items-center gap-2">
                  <Equal className="w-3 h-3 text-gray-400" />
                  <span className="text-slate-300">
                    {data.diffSummary.unchanged}
                  </span>
                  <span className="text-slate-500">same</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-600/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Changes</span>
                  <span className="text-slate-200 font-medium">
                    {getTotalChanges()}
                  </span>
                </div>
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
                <div className="text-slate-400">Compared</div>
                <div className="text-slate-200 font-medium">
                  {data.rowsProcessed?.toLocaleString() || 0}
                </div>
              </div>
            </div>
          )}

          {data.executionTime && (
            <div className="mb-3 p-2 rounded bg-slate-700/30 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Compare Time</span>
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
                    ? "text-orange-400"
                    : data.status === "warning"
                    ? "text-yellow-400"
                    : "text-slate-400"
                }`}
              >
                {data.status === "running"
                  ? "Comparing..."
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
          <div className="absolute inset-0 rounded-xl border-2 border-orange-400/30 animate-pulse" />
        )}
      </div>
    );
  }
);

ModernDiffNode.displayName = "ModernDiffNode";

export default ModernDiffNode;