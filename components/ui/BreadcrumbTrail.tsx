"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { cn } from "../../lib/utils/cn";
import {
  Home,
  Database,
  Layers,
  Zap,
  Play,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  type?: "data-source" | "pipeline" | "job" | "data-lake" | "snapshot";
}

export interface BreadcrumbTrailProps {
  items: BreadcrumbItem[];
  showDataFlow?: boolean;
  className?: string;
}

/**
 * BreadcrumbTrail - Shows navigation path and optionally data flow relationships
 *
 * This component helps users understand:
 * 1. Where they are in the app
 * 2. How their current view relates to other features
 * 3. The flow of data through the system
 */
export default function BreadcrumbTrail({
  items,
  showDataFlow = false,
  className,
}: BreadcrumbTrailProps) {
  const router = useRouter();

  // Get icon based on type
  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "data-source":
        return Database;
      case "data-lake":
        return Layers;
      case "pipeline":
        return Zap;
      case "job":
        return Play;
      default:
        return null;
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Main Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Home className="w-4 h-4" />
        </button>

        {items.map((item, index) => {
          const Icon = item.icon || getTypeIcon(item.type);
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={index}>
              <ChevronRight className="w-4 h-4 text-gray-400" />

              {item.href && !isLast ? (
                <button
                  onClick={() => router.push(item.href!)}
                  className="flex items-center gap-1.5 font-mono text-gray-600 hover:text-blue-600 hover:underline transition-colors group"
                >
                  {Icon && (
                    <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  )}
                  <span>{item.label}</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 font-mono text-gray-900 font-bold">
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Data Flow Indicator */}
      {showDataFlow && items.length > 1 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-1 text-xs font-mono text-blue-700">
            <span className="font-bold">Data Flow:</span>
            {items.map((item, index) => {
              const Icon = getTypeIcon(item.type);
              return (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <ArrowRight className="w-3 h-3 text-blue-500 mx-1" />
                  )}
                  <div className="flex items-center gap-1 px-2 py-1 bg-white border border-blue-300 rounded">
                    {Icon && <Icon className="w-3 h-3" />}
                    <span>{item.label}</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
