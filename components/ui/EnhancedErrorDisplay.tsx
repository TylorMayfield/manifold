"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Info,
  AlertCircle,
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import Button from "./Button";
import {
  EnhancedError,
  getErrorColor,
  getErrorIcon,
} from "../../lib/utils/errorMessages";

interface EnhancedErrorDisplayProps {
  error: EnhancedError;
  onDismiss?: () => void;
  onRetry?: () => void;
  showTechnicalDetails?: boolean;
  className?: string;
}

export default function EnhancedErrorDisplay({
  error,
  onDismiss,
  onRetry,
  showTechnicalDetails = false,
  className = "",
}: EnhancedErrorDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const color = getErrorColor(error.severity);
  const icon = getErrorIcon(error.severity);

  const getSeverityIcon = () => {
    switch (error.severity) {
      case "low":
        return <Info className="h-5 w-5 text-blue-400" />;
      case "medium":
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case "high":
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
          text: "text-blue-400",
          icon: "text-blue-400",
        };
      case "yellow":
        return {
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/20",
          text: "text-yellow-400",
          icon: "text-yellow-400",
        };
      case "red":
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/20",
          text: "text-red-400",
          icon: "text-red-400",
        };
      default:
        return {
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/20",
          text: "text-yellow-400",
          icon: "text-yellow-400",
        };
    }
  };

  const colors = getColorClasses();

  const copyErrorDetails = async () => {
    const errorText = `
Error Code: ${error.code}
Message: ${error.message}
Severity: ${error.severity}
Category: ${error.category}
Timestamp: ${error.timestamp.toISOString()}
${
  error.technicalDetails
    ? `\nTechnical Details:\n${error.technicalDetails}`
    : ""
}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy error details:", err);
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 ${colors.bg} ${colors.border} ${className}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">{getSeverityIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className={`text-sm font-medium ${colors.text}`}>
                {error.message}
              </h3>
              <p className="text-xs text-white/60 mt-1">
                {error.code} • {error.category} •{" "}
                {error.timestamp.toLocaleString()}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  variant="ghost"
                  size="sm"
                  icon={<RefreshCw className="h-4 w-4" />}
                >
                  Retry
                </Button>
              )}

              <Button
                onClick={copyErrorDetails}
                variant="ghost"
                size="sm"
                icon={
                  copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )
                }
              >
                {copied ? "Copied" : "Copy"}
              </Button>

              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Suggestions */}
          {error.suggestions.length > 0 && (
            <div className="mb-3">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center space-x-2 text-sm text-white/80 hover:text-white transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span>Suggested solutions ({error.suggestions.length})</span>
              </button>

              {expanded && (
                <div className="mt-3 space-y-2">
                  {error.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <h4 className="text-sm font-medium text-white mb-1">
                        {suggestion.title}
                      </h4>
                      <p className="text-sm text-white/70 mb-2">
                        {suggestion.description}
                      </p>

                      <div className="flex items-center space-x-3">
                        {suggestion.action && (
                          <Button
                            onClick={suggestion.action.handler}
                            variant="outline"
                            size="sm"
                          >
                            {suggestion.action.label}
                          </Button>
                        )}

                        {suggestion.links &&
                          suggestion.links.map((link, linkIndex) => (
                            <a
                              key={linkIndex}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <span>{link.label}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Technical Details */}
          {showTechnicalDetails && error.technicalDetails && (
            <div className="mt-3">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center space-x-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span>Technical Details</span>
              </button>

              {expanded && (
                <div className="mt-2 p-3 bg-black/20 rounded-lg border border-white/10">
                  <pre className="text-xs text-white/70 whitespace-pre-wrap font-mono overflow-x-auto">
                    {error.technicalDetails}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
