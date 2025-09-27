"use client";

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Code, Zap, AlertCircle, Database } from "lucide-react";

interface CustomNodeData {
  label: string;
  type: string;
  config: {
    script: string;
    language: "javascript" | "python" | "sql";
    timeout?: number;
  };
  status: "idle" | "running" | "success" | "error";
  lastRun?: Date;
  executionTime?: number;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({
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
        return "border-gray-500 bg-gray-500/10";
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
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  const getLanguageIcon = () => {
    switch (data.config.language) {
      case "javascript":
        return <Code className="w-5 h-5" />;
      case "python":
        return <Zap className="w-5 h-5" />;
      case "sql":
        return <Database className="w-5 h-5" />;
      default:
        return <Code className="w-5 h-5" />;
    }
  };

  const getScriptPreview = () => {
    const lines = data.config.script.split("\n");
    if (lines.length <= 3) {
      return data.config.script;
    }
    return lines.slice(0, 2).join("\n") + "\n...";
  };

  return (
    <div
      className={`glass-card p-4 min-w-[200px] border-2 transition-all ${
        selected ? "ring-2 ring-gray-400 ring-opacity-50" : ""
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
        <div className="p-2 rounded-lg bg-gray-500/20 text-gray-400">
          {getLanguageIcon()}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white text-sm">{data.label}</h3>
          <p className="text-xs text-gray-400 capitalize">
            {data.config.language} Script
          </p>
        </div>
        {getStatusIcon()}
      </div>

      <div className="space-y-2">
        <div className="bg-black/20 rounded p-2 text-xs font-mono text-gray-300 max-h-20 overflow-hidden">
          <pre className="whitespace-pre-wrap">{getScriptPreview()}</pre>
        </div>

        {data.config.timeout && (
          <div className="text-xs text-gray-400">
            Timeout: {data.config.timeout}s
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
          <span className="text-gray-400">Custom Script</span>
          <span className="text-gray-400 font-medium">
            {data.status === "idle" ? "Ready" : data.status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CustomNode;
