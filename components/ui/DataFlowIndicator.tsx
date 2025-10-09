"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { cn } from "../../lib/utils/cn";
import {
  Database,
  Camera,
  Zap,
  Play,
  Layers,
  ArrowRight,
  CheckCircle,
  Circle,
  AlertCircle,
} from "lucide-react";

export interface DataFlowStep {
  id: string;
  type:
    | "data-source"
    | "snapshot"
    | "pipeline"
    | "job"
    | "data-lake"
    | "export";
  label: string;
  status?: "active" | "pending" | "completed" | "error";
  count?: number;
  href?: string;
}

export interface DataFlowIndicatorProps {
  steps: DataFlowStep[];
  currentStep?: string;
  className?: string;
  variant?: "horizontal" | "vertical" | "compact";
  interactive?: boolean;
}

/**
 * DataFlowIndicator - Visual representation of data flow through the system
 *
 * This component helps users:
 * 1. Understand how data flows through the system
 * 2. See the current stage of their data
 * 3. Navigate to related features
 */
export default function DataFlowIndicator({
  steps,
  currentStep,
  className,
  variant = "horizontal",
  interactive = true,
}: DataFlowIndicatorProps) {
  const router = useRouter();

  const getStepIcon = (type: string) => {
    switch (type) {
      case "data-source":
        return Database;
      case "snapshot":
        return Camera;
      case "pipeline":
        return Zap;
      case "job":
        return Play;
      case "data-lake":
        return Layers;
      default:
        return Circle;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "error":
        return AlertCircle;
      default:
        return Circle;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "text-blue-600 bg-blue-100 border-blue-600";
      case "completed":
        return "text-green-600 bg-green-100 border-green-600";
      case "error":
        return "text-red-600 bg-red-100 border-red-600";
      case "pending":
        return "text-gray-600 bg-gray-100 border-gray-400";
      default:
        return "text-gray-400 bg-gray-50 border-gray-300";
    }
  };

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        {steps.map((step, index) => {
          const Icon = getStepIcon(step.type);
          const isCurrent = step.id === currentStep;
          const isClickable = interactive && step.href;

          return (
            <React.Fragment key={step.id}>
              {index > 0 && (
                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
              <button
                onClick={() => isClickable && router.push(step.href!)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md border-2 transition-all",
                  isCurrent && "ring-2 ring-blue-500 ring-offset-2",
                  getStatusColor(step.status),
                  isClickable && "hover:scale-105 cursor-pointer",
                  !isClickable && "cursor-default"
                )}
                title={step.label}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-mono font-bold">
                  {step.label}
                </span>
                {step.count !== undefined && (
                  <span className="px-1.5 py-0.5 bg-white border rounded text-xs">
                    {step.count}
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  if (variant === "vertical") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {steps.map((step, index) => {
          const Icon = getStepIcon(step.type);
          const StatusIcon = getStatusIcon(step.status);
          const isCurrent = step.id === currentStep;
          const isClickable = interactive && step.href;

          return (
            <div key={step.id} className="flex items-start gap-2">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all",
                    isCurrent && "ring-2 ring-blue-500 ring-offset-2",
                    getStatusColor(step.status)
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {index < steps.length - 1 && (
                  <div className="w-0.5 h-8 bg-gray-300 my-1" />
                )}
              </div>

              {/* Step info */}
              <button
                onClick={() => isClickable && router.push(step.href!)}
                disabled={!isClickable}
                className={cn(
                  "flex-1 p-3 border-2 rounded-lg transition-all text-left",
                  isCurrent && "ring-2 ring-blue-500",
                  getStatusColor(step.status),
                  isClickable && "hover:shadow-md cursor-pointer",
                  !isClickable && "cursor-default"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold font-mono text-sm">{step.label}</p>
                  <StatusIcon className="w-4 h-4" />
                </div>
                {step.count !== undefined && (
                  <p className="text-xs font-mono">
                    {step.count} {step.count === 1 ? "item" : "items"}
                  </p>
                )}
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={cn("relative", className)}>
      {/* Progress line */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-300" />

      {/* Steps */}
      <div className="relative flex justify-between items-start">
        {steps.map((step, index) => {
          const Icon = getStepIcon(step.type);
          const StatusIcon = getStatusIcon(step.status);
          const isCurrent = step.id === currentStep;
          const isClickable = interactive && step.href;
          const currentIndex = steps.findIndex((s) => s.id === currentStep);
          const isCompleted = currentIndex !== -1 && index <= currentIndex;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center gap-2 flex-1"
            >
              {/* Step circle */}
              <button
                onClick={() => isClickable && router.push(step.href!)}
                disabled={!isClickable}
                className={cn(
                  "relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all",
                  isCurrent && "ring-4 ring-blue-500 ring-opacity-30",
                  isCompleted
                    ? getStatusColor(step.status)
                    : "bg-white border-gray-300 text-gray-400",
                  isClickable && "hover:scale-110 cursor-pointer",
                  !isClickable && "cursor-default"
                )}
                title={step.label}
              >
                <Icon className="w-5 h-5" />
              </button>

              {/* Step label */}
              <div className="text-center">
                <p
                  className={cn(
                    "text-xs font-mono font-bold",
                    isCurrent ? "text-gray-900" : "text-gray-600"
                  )}
                >
                  {step.label}
                </p>
                {step.count !== undefined && (
                  <p className="text-xs text-gray-500 mt-1">
                    {step.count} {step.type}s
                  </p>
                )}
              </div>

              {/* Status indicator */}
              {step.status && (
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono",
                    getStatusColor(step.status)
                  )}
                >
                  <StatusIcon className="w-3 h-3" />
                  <span>{step.status}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
