"use client";

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Database, FileText, Server, Cloud } from "lucide-react";

interface DataSourceNodeData {
  label: string;
  type: string;
  config: {
    sourceType: "csv" | "json" | "database" | "api";
    filePath?: string;
    connectionString?: string;
    apiUrl?: string;
  };
  status: "idle" | "running" | "success" | "error";
  lastRun?: Date;
  executionTime?: number;
}

const DataSourceNode: React.FC<NodeProps<DataSourceNodeData>> = ({
  data,
  selected,
}) => {
  const getIcon = () => {
    switch (data.config.sourceType) {
      case "csv":
      case "json":
        return <FileText className="w-5 h-5" />;
      case "database":
        return <Database className="w-5 h-5" />;
      case "api":
        return <Server className="w-5 h-5" />;
      default:
        return <Database className="w-5 h-5" />;
    }
  };

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

  return (
    <div
      className={`glass-card p-4 min-w-[200px] border-2 transition-all ${
        selected ? "ring-2 ring-blue-400 ring-opacity-50" : ""
      } ${getStatusColor()}`}
    >
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-400 border-2 border-white"
      />

      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white text-sm">{data.label}</h3>
          <p className="text-xs text-gray-400 capitalize">
            {data.config.sourceType} Source
          </p>
        </div>
        {getStatusIcon()}
      </div>

      <div className="space-y-2 text-xs">
        {data.config.filePath && (
          <div className="flex items-center gap-2 text-gray-300">
            <FileText className="w-3 h-3" />
            <span className="truncate">{data.config.filePath}</span>
          </div>
        )}

        {data.config.apiUrl && (
          <div className="flex items-center gap-2 text-gray-300">
            <Server className="w-3 h-3" />
            <span className="truncate">{data.config.apiUrl}</span>
          </div>
        )}

        {data.lastRun && (
          <div className="text-gray-400">
            Last run: {data.lastRun.toLocaleTimeString()}
          </div>
        )}

        {data.executionTime && (
          <div className="text-gray-400">
            Time: {data.executionTime.toFixed(0)}ms
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Data Source</span>
          <span className="text-blue-400 font-medium">Ready</span>
        </div>
      </div>
    </div>
  );
};

export default DataSourceNode;

