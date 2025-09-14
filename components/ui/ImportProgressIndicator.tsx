"use client";

import React from "react";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Database,
  Zap,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { ImportProgress } from "../../types";

interface ImportProgressIndicatorProps {
  progress: ImportProgress;
  fileName?: string;
  fileSize?: number;
  showDetails?: boolean;
  className?: string;
}

export default function ImportProgressIndicator({
  progress,
  fileName,
  fileSize,
  showDetails = true,
  className = "",
}: ImportProgressIndicatorProps) {
  const getStageIcon = (stage: ImportProgress["stage"]) => {
    switch (stage) {
      case "reading":
        return <FileText className="h-5 w-5 text-blue-400" />;
      case "parsing":
        return <Database className="h-5 w-5 text-yellow-400" />;
      case "storing":
        return <Database className="h-5 w-5 text-purple-400" />;
      case "indexing":
        return <Zap className="h-5 w-5 text-indigo-400" />;
      case "complete":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStageLabel = (stage: ImportProgress["stage"]) => {
    switch (stage) {
      case "reading":
        return "Reading File";
      case "parsing":
        return "Parsing Data";
      case "storing":
        return "Storing Records";
      case "indexing":
        return "Creating Indexes";
      case "complete":
        return "Complete";
      case "error":
        return "Error";
      default:
        return "Processing";
    }
  };

  const getProgressColor = (stage: ImportProgress["stage"]) => {
    switch (stage) {
      case "reading":
        return "from-blue-500 to-blue-600";
      case "parsing":
        return "from-yellow-500 to-orange-500";
      case "storing":
        return "from-purple-500 to-purple-600";
      case "indexing":
        return "from-indigo-500 to-indigo-600";
      case "complete":
        return "from-green-500 to-green-600";
      case "error":
        return "from-red-500 to-red-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getEstimatedTime = (
    progress: number,
    stage: ImportProgress["stage"]
  ) => {
    if (stage === "complete" || stage === "error") return null;

    // Rough estimates based on typical import stages
    const stageDurations = {
      reading: 10,
      parsing: 30,
      storing: 40,
      indexing: 20,
    };

    const currentStageDuration = stageDurations[stage] || 30;
    const remainingProgress = 100 - progress;
    const estimatedSeconds = Math.round(
      (remainingProgress / 100) * currentStageDuration
    );

    if (estimatedSeconds < 60) {
      return `${estimatedSeconds}s`;
    } else {
      const minutes = Math.round(estimatedSeconds / 60);
      return `${minutes}m`;
    }
  };

  const isActive = progress.stage !== "complete" && progress.stage !== "error";

  return (
    <div className={`glass-card rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {isActive ? (
              <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
            ) : (
              getStageIcon(progress.stage)
            )}
            {isActive && (
              <div className="absolute inset-0">
                <div className="h-5 w-5 border-2 border-blue-400/30 rounded-full animate-ping"></div>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold">
              {getStageLabel(progress.stage)}
            </h3>
            <p className="text-white/70 text-sm">{progress.message}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {Math.round(progress.progress)}%
          </div>
          {isActive && (
            <div className="text-xs text-white/60">
              ~{getEstimatedTime(progress.progress, progress.stage)} remaining
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
          <div
            className={`bg-gradient-to-r ${getProgressColor(
              progress.stage
            )} h-3 rounded-full transition-all duration-500 ease-out relative`}
            style={{ width: `${progress.progress}%` }}
          >
            {isActive && (
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
            )}
          </div>
        </div>

        {/* Progress markers */}
        <div className="flex justify-between mt-2 text-xs text-white/60">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Stage Progress */}
      {showDetails && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white/70">Import Stages</span>
            <span className="text-white/70">
              Stage{" "}
              {[
                "reading",
                "parsing",
                "storing",
                "indexing",
                "complete",
              ].indexOf(progress.stage) + 1}{" "}
              of 5
            </span>
          </div>

          <div className="flex space-x-2">
            {["reading", "parsing", "storing", "indexing", "complete"].map(
              (stage, index) => {
                const isCompleted =
                  index <
                  [
                    "reading",
                    "parsing",
                    "storing",
                    "indexing",
                    "complete",
                  ].indexOf(progress.stage);
                const isCurrent = stage === progress.stage;
                const isError =
                  progress.stage === "error" &&
                  index >=
                    [
                      "reading",
                      "parsing",
                      "storing",
                      "indexing",
                      "complete",
                    ].indexOf("storing");

                return (
                  <div
                    key={stage}
                    className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                      isCompleted
                        ? "bg-green-500"
                        : isCurrent
                        ? "bg-blue-500"
                        : isError && index >= 2
                        ? "bg-red-500"
                        : "bg-white/10"
                    }`}
                  />
                );
              }
            )}
          </div>

          <div className="flex justify-between mt-1 text-xs text-white/50">
            <span>Read</span>
            <span>Parse</span>
            <span>Store</span>
            <span>Index</span>
            <span>Done</span>
          </div>
        </div>
      )}

      {/* File Details */}
      {showDetails && fileName && (
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-white/60" />
            <span className="text-sm text-white/80 truncate max-w-48">
              {fileName}
            </span>
            {fileSize && (
              <span className="text-xs text-white/50">
                ({formatFileSize(fileSize)})
              </span>
            )}
          </div>

          {progress.stage === "complete" && (
            <div className="flex items-center space-x-1 text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Success</span>
            </div>
          )}

          {progress.stage === "error" && (
            <div className="flex items-center space-x-1 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Failed</span>
            </div>
          )}
        </div>
      )}

      {/* Error Details */}
      {progress.stage === "error" && progress.error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-400 font-medium text-sm">Import Failed</p>
              <p className="text-red-300/80 text-xs mt-1">{progress.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Details */}
      {progress.stage === "complete" && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <div>
              <p className="text-green-400 font-medium text-sm">
                Import Complete
              </p>
              <p className="text-green-300/80 text-xs mt-1">
                Your data has been successfully imported and is ready to use.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
