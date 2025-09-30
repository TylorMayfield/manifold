"use client"

import React from "react";
import { CheckCircle, XCircle, Clock, Pause, AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils/cn";

export type StatusType = 
  | "success" | "active" | "completed" | "healthy"
  | "error" | "failed" | "critical"
  | "warning" | "pending" | "paused"
  | "info" | "running" | "processing"
  | "idle" | "disabled" | "inactive";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  // Success states
  success: { color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle },
  active: { color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle },
  completed: { color: "bg-blue-100 text-blue-800 border-blue-300", icon: CheckCircle },
  healthy: { color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle },
  
  // Error states
  error: { color: "bg-red-100 text-red-800 border-red-300", icon: XCircle },
  failed: { color: "bg-red-100 text-red-800 border-red-300", icon: XCircle },
  critical: { color: "bg-red-100 text-red-800 border-red-300", icon: AlertCircle },
  
  // Warning states
  warning: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: AlertTriangle },
  pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
  paused: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Pause },
  
  // Info states
  info: { color: "bg-blue-100 text-blue-800 border-blue-300", icon: AlertCircle },
  running: { color: "bg-blue-100 text-blue-800 border-blue-300", icon: Clock },
  processing: { color: "bg-blue-100 text-blue-800 border-blue-300", icon: Clock },
  
  // Inactive states
  idle: { color: "bg-gray-100 text-gray-800 border-gray-300", icon: Clock },
  disabled: { color: "bg-gray-100 text-gray-800 border-gray-300", icon: XCircle },
  inactive: { color: "bg-gray-100 text-gray-800 border-gray-300", icon: XCircle },
};

const sizeClasses = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
  lg: "text-base px-4 py-1.5",
};

const iconSizes = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = "md",
  showIcon = true,
  className,
}) => {
  const config = statusConfig[status] || statusConfig.info;
  const Icon = config.icon;
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        config.color,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
