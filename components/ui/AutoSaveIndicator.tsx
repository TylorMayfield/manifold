"use client";

import React, { useState, useEffect } from "react";
import { Save, Check, AlertCircle, Loader2 } from "lucide-react";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSaved?: Date;
  error?: string;
  className?: string;
}

export default function AutoSaveIndicator({
  status,
  lastSaved,
  error,
  className = "",
}: AutoSaveIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (status === "saved") {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const getStatusConfig = () => {
    switch (status) {
      case "idle":
        return {
          icon: <Save className="h-3 w-3" />,
          text: "All changes saved",
          color: "text-white/60",
          bg: "bg-white/5",
        };
      case "saving":
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          text: "Saving...",
          color: "text-blue-400",
          bg: "bg-blue-500/10",
        };
      case "saved":
        return {
          icon: <Check className="h-3 w-3" />,
          text: "Saved",
          color: "text-green-400",
          bg: "bg-green-500/10",
        };
      case "error":
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          text: "Save failed",
          color: "text-red-400",
          bg: "bg-red-500/10",
        };
      default:
        return {
          icon: <Save className="h-3 w-3" />,
          text: "All changes saved",
          color: "text-white/60",
          bg: "bg-white/5",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div
        className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs ${config.bg}`}
      >
        <div className={config.color}>{config.icon}</div>
        <span className={config.color}>{config.text}</span>
      </div>

      {lastSaved && status !== "saving" && (
        <span className="text-xs text-white/40">
          {formatLastSaved(lastSaved)}
        </span>
      )}

      {error && status === "error" && (
        <span className="text-xs text-red-400" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}

function formatLastSaved(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) {
    return "just now";
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Hook to manage auto-save status
export function useAutoSaveStatus() {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date>();
  const [error, setError] = useState<string>();

  const setSaving = () => {
    setStatus("saving");
    setError(undefined);
  };

  const setSaved = () => {
    setStatus("saved");
    setLastSaved(new Date());
    setError(undefined);
  };

  const setErrorState = (errorMessage: string) => {
    setStatus("error");
    setError(errorMessage);
  };

  const setIdle = () => {
    setStatus("idle");
    setError(undefined);
  };

  return {
    status,
    lastSaved,
    error,
    setSaving,
    setSaved,
    setError: setErrorState,
    setIdle,
  };
}
