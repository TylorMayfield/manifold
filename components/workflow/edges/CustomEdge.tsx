"use client";

import React from "react";
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from "reactflow";
import { ArrowRight, Database } from "lucide-react";

const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getEdgeColor = () => {
    if (selected) return "#8b5cf6";
    if (data?.rowCount && data.rowCount > 0) return "#10b981";
    return "#6366f1";
  };

  const getEdgeWidth = () => {
    if (data?.rowCount && data.rowCount > 1000) return 3;
    if (data?.rowCount && data.rowCount > 100) return 2;
    return 1;
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: getEdgeColor(),
          strokeWidth: getEdgeWidth(),
          strokeDasharray: data?.animated ? "5,5" : "none",
        }}
        markerEnd="url(#arrowhead)"
      />

      <EdgeLabelRenderer>
        {data?.rowCount !== undefined && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: "rgba(0, 0, 0, 0.8)",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 500,
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(4px)",
            }}
            className="nodrag nopan"
          >
            <div className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              <span>{data.rowCount.toLocaleString()} rows</span>
            </div>
          </div>
        )}
      </EdgeLabelRenderer>

      {/* Arrow marker definition */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={getEdgeColor()} />
        </marker>
      </defs>
    </>
  );
};

export default CustomEdge;

