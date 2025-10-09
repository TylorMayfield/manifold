"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { cn } from "../../lib/utils/cn";
import {
  Plus,
  Play,
  Zap,
  ArrowRight,
  Lightbulb,
  ExternalLink,
} from "lucide-react";
import CellButton from "./CellButton";

export interface ContextualAction {
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "accent";
  disabled?: boolean;
  disabledReason?: string;
}

export interface ContextualActionBarProps {
  title?: string;
  subtitle?: string;
  actions: ContextualAction[];
  suggestion?: {
    text: string;
    action?: ContextualAction;
  };
  className?: string;
  variant?: "compact" | "full";
}

/**
 * ContextualActionBar - Suggests next steps based on current context
 *
 * This component helps users:
 * 1. Discover what they can do next
 * 2. Understand feature relationships
 * 3. Complete their workflow efficiently
 */
export default function ContextualActionBar({
  title = "What would you like to do?",
  subtitle,
  actions,
  suggestion,
  className,
  variant = "compact",
}: ContextualActionBarProps) {
  const router = useRouter();

  const handleAction = (action: ContextualAction) => {
    if (action.disabled) return;
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      router.push(action.href);
    }
  };

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-4 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm font-bold font-mono text-gray-900">{title}</p>
            {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {actions.slice(0, 3).map((action, index) => {
            const Icon = action.icon || ArrowRight;
            return (
              <button
                key={index}
                onClick={() => handleAction(action)}
                disabled={action.disabled}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md font-mono text-sm transition-all",
                  action.disabled
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white border-2 border-blue-400 text-blue-700 hover:bg-blue-600 hover:text-white hover:scale-105 shadow-[2px_2px_0px_0px_rgba(59,130,246,0.3)]"
                )}
                title={
                  action.disabled ? action.disabledReason : action.description
                }
              >
                <Icon className="w-4 h-4" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div
      className={cn(
        "p-6 bg-gradient-to-br from-white via-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg shadow-[4px_4px_0px_0px_rgba(59,130,246,0.2)]",
        className
      )}
    >
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-6 h-6 text-blue-600" />
          <h3 className="text-heading font-bold font-mono text-gray-900">
            {title}
          </h3>
        </div>
        {subtitle && <p className="text-sm text-gray-600 ml-8">{subtitle}</p>}
      </div>

      {/* Suggestion */}
      {suggestion && (
        <div className="mb-4 p-3 bg-yellow-50 border-2 border-yellow-400 rounded-md">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-2">
                {suggestion.text}
              </p>
              {suggestion.action && (
                <button
                  onClick={() => handleAction(suggestion.action!)}
                  disabled={suggestion.action.disabled}
                  className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500 text-white rounded-md font-mono text-sm hover:bg-yellow-600 transition-colors shadow-[2px_2px_0px_0px_rgba(234,179,8,0.3)]"
                >
                  {suggestion.action.icon && (
                    <suggestion.action.icon className="w-4 h-4" />
                  )}
                  <span>{suggestion.action.label}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon || ArrowRight;
          return (
            <button
              key={index}
              onClick={() => handleAction(action)}
              disabled={action.disabled}
              className={cn(
                "flex items-start gap-3 p-4 border-2 rounded-lg transition-all text-left group",
                action.disabled
                  ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                  : action.variant === "primary"
                  ? "bg-blue-500 border-blue-600 text-white hover:bg-blue-600 hover:scale-105 shadow-[2px_2px_0px_0px_rgba(37,99,235,0.3)]"
                  : action.variant === "accent"
                  ? "bg-purple-500 border-purple-600 text-white hover:bg-purple-600 hover:scale-105 shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]"
                  : "bg-white border-gray-300 text-gray-900 hover:border-blue-400 hover:shadow-md"
              )}
              title={action.disabled ? action.disabledReason : undefined}
            >
              <Icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform",
                  action.disabled ? "" : "group-hover:scale-110"
                )}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-bold font-mono text-sm mb-1",
                    action.disabled ? "text-gray-400" : ""
                  )}
                >
                  {action.label}
                </p>
                {action.description && (
                  <p
                    className={cn(
                      "text-xs",
                      action.disabled
                        ? "text-gray-400"
                        : action.variant
                        ? "text-white/90"
                        : "text-gray-600"
                    )}
                  >
                    {action.description}
                  </p>
                )}
                {action.disabled && action.disabledReason && (
                  <p className="text-xs text-gray-400 mt-1 italic">
                    {action.disabledReason}
                  </p>
                )}
              </div>
              {!action.disabled && (
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
