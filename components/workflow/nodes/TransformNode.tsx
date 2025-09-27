"use client";

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Settings, Filter, ArrowRight, Code, BarChart3 } from "lucide-react";

interface TransformNodeData {
  label: string;
  type: string;
  config: {
    operations: Array<{
      type: "filter" | "map" | "group" | "sort" | "aggregate";
      config: any;
    }>;
    filters: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  };
  status: "idle" | "running" | "success" | "error";
  lastRun?: Date;
  executionTime?: number;
}

const TransformNode: React.FC<NodeProps<TransformNodeData>> = ({
  data,
  selected,
}) => {
  const getStatusColor = () => {
    switch (data.status) {
      case "success":
        return "border-green-500 bg-green-500/10";
      case "error":
        return "border-red-500 bg-red-500/10";
      case "running":
        return "border-yellow-500 bg-yellow-500/10";
      default:
        return "border-purple-500 bg-purple-500/10";
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case "success":
        return <div className="w-2 h-2 bg-green-400 rounded-full" />;
      case "error":
        return <div className="w-2 h-2 bg-red-400 rounded-full" />;
      case "running":
        return (
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        );
      default:
        return <div className="w-2 h-2 bg-purple-400 rounded-full" />;
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case "filter":
        return <Filter className="w-3 h-3" />;
      case "map":
        return <ArrowRight className="w-3 h-3" />;
      case "group":
      case "aggregate":
        return <BarChart3 className="w-3 h-3" />;
      default:
        return <Settings className="w-3 h-3" />;
    }
  };

  return (
    <div
      className={`glass-card p-4 min-w-[200px] border-2 transition-all ${
        selected ? "ring-2 ring-purple-400 ring-opacity-50" : ""
      } ${getStatusColor()}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-400 border-2 border-white"
      />

      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
          <Settings className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white text-sm">{data.label}</h3>
          <p className="text-xs text-gray-400">
            {data.config.operations.length} operations
          </p>
        </div>
        {getStatusIcon()}
      </div>

      <div className="space-y-2">
        {data.config.operations.length > 0 ? (
          <div className="space-y-1">
            {data.config.operations.slice(0, 3).map((op, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs text-gray-300"
              >
                {getOperationIcon(op.type)}
                <span className="capitalize">{op.type}</span>
              </div>
            ))}
            {data.config.operations.length > 3 && (
              <div className="text-xs text-gray-400">
                +{data.config.operations.length - 3} more
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic">
            No operations configured
          </div>
        )}

        {data.config.filters.length > 0 && (
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <Filter className="w-3 h-3" />
              <span>{data.config.filters.length} filter(s)</span>
            </div>
          </div>
        )}

        {data.lastRun && (
          <div className="text-xs text-gray-400">
            Last run: {data.lastRun.toLocaleTimeString()}
          </div>
        )}

        {data.executionTime && (
          <div className="text-xs text-gray-400">
            Time: {data.executionTime.toFixed(0)}ms
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Transform</span>
          <span className="text-purple-400 font-medium">
            {data.status === "idle" ? "Ready" : data.status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TransformNode;

