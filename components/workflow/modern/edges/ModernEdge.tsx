"use client";

import React from "react";
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from "reactflow";

interface ModernEdgeData {
  label?: string;
  dataType?: string;
  rowCount?: number;
  schema?: any;
  isActive?: boolean;
  bandwidth?: "low" | "medium" | "high";
}

const ModernEdge: React.FC<EdgeProps<ModernEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
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

  const getBandwidthColor = () => {
    if (!data?.isActive) return "#64748b"; // slate-500
    
    switch (data?.bandwidth) {
      case "high":
        return "#ef4444"; // red-500
      case "medium":
        return "#f59e0b"; // amber-500
      case "low":
        return "#10b981"; // emerald-500
      default:
        return "#6366f1"; // indigo-500
    }
  };

  const getBandwidthWidth = () => {
    if (!data?.isActive) return 2;
    
    switch (data?.bandwidth) {
      case "high":
        return 4;
      case "medium":
        return 3;
      case "low":
        return 2;
      default:
        return 2;
    }
  };

  const getBandwidthOpacity = () => {
    return data?.isActive ? 0.8 : 0.4;
  };

  const edgeStyle = {
    ...style,
    stroke: getBandwidthColor(),
    strokeWidth: getBandwidthWidth(),
    opacity: getBandwidthOpacity(),
    filter: data?.isActive ? "drop-shadow(0 0 6px rgba(99, 102, 241, 0.3))" : undefined,
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
      />
      
      {/* Enhanced Edge Label */}
      {(data?.label || data?.rowCount !== undefined) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <div
              className={`px-2 py-1 rounded-md text-xs font-medium backdrop-blur-sm border transition-all duration-200 ${
                selected
                  ? "bg-slate-700/90 border-slate-400/50 text-white shadow-lg"
                  : "bg-slate-800/80 border-slate-600/50 text-slate-300"
              } ${
                data?.isActive
                  ? "shadow-md"
                  : "opacity-70"
              }`}
            >
              {/* Row Count Display */}
              {data?.rowCount !== undefined && (
                <div className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      data?.isActive ? "bg-green-400" : "bg-slate-500"
                    }`}
                  />
                  <span className="font-mono">
                    {data.rowCount.toLocaleString()}
                  </span>
                  <span className="text-slate-400">rows</span>
                </div>
              )}
              
              {/* Custom Label */}
              {data?.label && (
                <div className="text-slate-300">
                  {data.label}
                </div>
              )}
              
              {/* Data Type */}
              {data?.dataType && (
                <div className="text-slate-400 text-xs">
                  {data.dataType}
                </div>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Animated Data Flow Particles */}
      {data?.isActive && (
        <EdgeLabelRenderer>
          {[...Array(3)].map((_, index) => (
            <div
              key={`particle-${index}`}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "4px",
                height: "4px",
                background: getBandwidthColor(),
                borderRadius: "50%",
                opacity: 0.8,
                animation: `flow-animation-${index} 2s linear infinite`,
                pointerEvents: "none",
              }}
            />
          ))}
          <style jsx>{`
            @keyframes flow-animation-0 {
              0% {
                offset-distance: 0%;
                opacity: 0;
              }
              10% {
                opacity: 0.8;
              }
              90% {
                opacity: 0.8;
              }
              100% {
                offset-distance: 100%;
                opacity: 0;
              }
            }
            @keyframes flow-animation-1 {
              0% {
                offset-distance: 0%;
                opacity: 0;
              }
              33% {
                offset-distance: 0%;
                opacity: 0;
              }
              43% {
                opacity: 0.8;
              }
              90% {
                opacity: 0.8;
              }
              100% {
                offset-distance: 100%;
                opacity: 0;
              }
            }
            @keyframes flow-animation-2 {
              0% {
                offset-distance: 0%;
                opacity: 0;
              }
              66% {
                offset-distance: 0%;
                opacity: 0;
              }
              76% {
                opacity: 0.8;
              }
              90% {
                opacity: 0.8;
              }
              100% {
                offset-distance: 100%;
                opacity: 0;
              }
            }
          `}</style>
        </EdgeLabelRenderer>
      )}

      {/* Bandwidth Indicator */}
      {data?.isActive && data?.bandwidth && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX + 40}px, ${labelY - 20}px)`,
              pointerEvents: "none",
            }}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                data.bandwidth === "high"
                  ? "bg-red-500/20 border-red-400 text-red-300"
                  : data.bandwidth === "medium"
                  ? "bg-amber-500/20 border-amber-400 text-amber-300"
                  : "bg-emerald-500/20 border-emerald-400 text-emerald-300"
              }`}
            >
              {data.bandwidth === "high"
                ? "H"
                : data.bandwidth === "medium"
                ? "M"
                : "L"}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default ModernEdge;