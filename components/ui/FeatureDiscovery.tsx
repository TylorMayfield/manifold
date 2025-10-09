"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "../../lib/utils/cn";
import {
  Database,
  Layers,
  Zap,
  Play,
  Webhook,
  FileText,
  ChevronRight,
  X,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export interface Feature {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  benefits: string[];
  nextSteps: {
    label: string;
    href: string;
  }[];
  relatedFeatures: string[];
}

export interface FeatureDiscoveryProps {
  onClose?: () => void;
  startFeatureId?: string;
  className?: string;
}

const features: Feature[] = [
  {
    id: "data-sources",
    name: "Data Sources",
    description:
      "Connect to databases, APIs, files, and more. Import and manage all your data in one place.",
    icon: Database,
    color: "blue",
    benefits: [
      "Support for CSV, JSON, MySQL, PostgreSQL",
      "Real-time data sync",
      "Version control with snapshots",
      "Automatic schema detection",
    ],
    nextSteps: [
      { label: "Add Your First Data Source", href: "/add-data-source" },
      { label: "View Data Browser", href: "/data" },
    ],
    relatedFeatures: ["snapshots", "pipelines"],
  },
  {
    id: "data-lakes",
    name: "Data Lakes",
    description:
      "Consolidate multiple data sources into unified data lakes for comprehensive analysis.",
    icon: Layers,
    color: "purple",
    benefits: [
      "Combine multiple sources seamlessly",
      "Automatic deduplication",
      "Advanced querying capabilities",
      "Real-time consolidation",
    ],
    nextSteps: [
      { label: "Create a Data Lake", href: "/data-lakes" },
      { label: "Learn About Data Lakes", href: "/data-lakes" },
    ],
    relatedFeatures: ["data-sources", "pipelines"],
  },
  {
    id: "pipelines",
    name: "Pipelines",
    description: "Transform and process your data with powerful ETL pipelines.",
    icon: Zap,
    color: "yellow",
    benefits: [
      "Visual pipeline builder",
      "Filter, map, aggregate, join operations",
      "Real-time data transformation",
      "Automatic lineage tracking",
    ],
    nextSteps: [
      { label: "Build Your First Pipeline", href: "/pipelines" },
      { label: "View Pipeline Templates", href: "/pipelines" },
    ],
    relatedFeatures: ["data-sources", "jobs", "data-lakes"],
  },
  {
    id: "jobs",
    name: "Scheduled Jobs",
    description:
      "Automate your data workflows with scheduled jobs and cron expressions.",
    icon: Play,
    color: "green",
    benefits: [
      "Flexible cron scheduling",
      "Automatic execution",
      "Job history and monitoring",
      "Error notifications",
    ],
    nextSteps: [
      { label: "Schedule Your First Job", href: "/jobs" },
      { label: "View Job History", href: "/jobs" },
    ],
    relatedFeatures: ["pipelines", "webhooks"],
  },
  {
    id: "webhooks",
    name: "Webhooks",
    description:
      "Integrate with external services and receive real-time notifications.",
    icon: Webhook,
    color: "orange",
    benefits: [
      "Real-time event notifications",
      "Custom payload formatting",
      "Retry logic and error handling",
      "Integration with popular services",
    ],
    nextSteps: [
      { label: "Configure Webhooks", href: "/webhooks" },
      { label: "View Webhook Logs", href: "/webhooks" },
    ],
    relatedFeatures: ["jobs", "observability"],
  },
  {
    id: "observability",
    name: "Observability",
    description:
      "Monitor your data workflows with comprehensive logging and metrics.",
    icon: FileText,
    color: "red",
    benefits: [
      "Real-time log streaming",
      "Advanced filtering and search",
      "Performance metrics",
      "Error tracking and debugging",
    ],
    nextSteps: [
      { label: "View Logs", href: "/observability" },
      { label: "Check System Health", href: "/monitoring" },
    ],
    relatedFeatures: ["jobs", "webhooks", "pipelines"],
  },
];

/**
 * FeatureDiscovery - Interactive guide to all application features
 *
 * Helps users:
 * 1. Understand what each feature does
 * 2. See how features work together
 * 3. Get started with specific features
 */
export default function FeatureDiscovery({
  onClose,
  startFeatureId,
  className,
}: FeatureDiscoveryProps) {
  const router = useRouter();
  const [selectedFeatureId, setSelectedFeatureId] = useState(
    startFeatureId || "data-sources"
  );

  const selectedFeature =
    features.find((f) => f.id === selectedFeatureId) || features[0];

  const getColorClasses = (color: string) => {
    const colors: Record<
      string,
      { bg: string; border: string; text: string; icon: string }
    > = {
      blue: {
        bg: "bg-blue-50",
        border: "border-blue-400",
        text: "text-blue-900",
        icon: "text-blue-600",
      },
      purple: {
        bg: "bg-purple-50",
        border: "border-purple-400",
        text: "text-purple-900",
        icon: "text-purple-600",
      },
      yellow: {
        bg: "bg-yellow-50",
        border: "border-yellow-400",
        text: "text-yellow-900",
        icon: "text-yellow-600",
      },
      green: {
        bg: "bg-green-50",
        border: "border-green-400",
        text: "text-green-900",
        icon: "text-green-600",
      },
      orange: {
        bg: "bg-orange-50",
        border: "border-orange-400",
        text: "text-orange-900",
        icon: "text-orange-600",
      },
      red: {
        bg: "bg-red-50",
        border: "border-red-400",
        text: "text-red-900",
        icon: "text-red-600",
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div
      className={cn(
        "bg-white border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-500 border-b-2 border-gray-900">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-white" />
          <h2 className="text-lg font-bold font-mono text-white">
            Feature Discovery
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 divide-x-2 divide-gray-900">
        {/* Feature List */}
        <div className="col-span-1 bg-gray-50 overflow-y-auto max-h-[60vh]">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isSelected = feature.id === selectedFeatureId;
            const colors = getColorClasses(feature.color);

            return (
              <button
                key={feature.id}
                onClick={() => setSelectedFeatureId(feature.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 border-b-2 border-gray-900 transition-all text-left",
                  isSelected
                    ? `${colors.bg} ${colors.text} font-bold`
                    : "bg-white text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isSelected ? colors.icon : "text-gray-600"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm truncate">{feature.name}</p>
                </div>
                {isSelected && (
                  <ChevronRight className={cn("w-4 h-4", colors.icon)} />
                )}
              </button>
            );
          })}
        </div>

        {/* Feature Details */}
        <div className="col-span-2 p-6 overflow-y-auto max-h-[60vh]">
          {selectedFeature &&
            (() => {
              const Icon = selectedFeature.icon;
              const colors = getColorClasses(selectedFeature.color);

              return (
                <div>
                  {/* Feature Header */}
                  <div
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-lg border-2 mb-6",
                      colors.bg,
                      colors.border
                    )}
                  >
                    <div
                      className={cn(
                        "p-3 rounded-lg bg-white border-2",
                        colors.border
                      )}
                    >
                      <Icon className={cn("w-8 h-8", colors.icon)} />
                    </div>
                    <div className="flex-1">
                      <h3
                        className={cn(
                          "text-xl font-bold font-mono mb-2",
                          colors.text
                        )}
                      >
                        {selectedFeature.name}
                      </h3>
                      <p className="text-sm text-gray-700">
                        {selectedFeature.description}
                      </p>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold font-mono text-gray-900 uppercase tracking-wide mb-3">
                      Key Benefits
                    </h4>
                    <div className="space-y-2">
                      {selectedFeature.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{benefit}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold font-mono text-gray-900 uppercase tracking-wide mb-3">
                      Get Started
                    </h4>
                    <div className="space-y-2">
                      {selectedFeature.nextSteps.map((step, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            router.push(step.href);
                            onClose?.();
                          }}
                          className={cn(
                            "w-full flex items-center justify-between p-3 border-2 rounded-lg transition-all group",
                            "bg-white hover:bg-gray-50",
                            colors.border,
                            "hover:shadow-md"
                          )}
                        >
                          <span className="font-mono text-sm font-bold">
                            {step.label}
                          </span>
                          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Related Features */}
                  <div>
                    <h4 className="text-sm font-bold font-mono text-gray-900 uppercase tracking-wide mb-3">
                      Works Great With
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedFeature.relatedFeatures.map((relatedId) => {
                        const relatedFeature = features.find(
                          (f) => f.id === relatedId
                        );
                        if (!relatedFeature) return null;

                        const RelatedIcon = relatedFeature.icon;
                        const relatedColors = getColorClasses(
                          relatedFeature.color
                        );

                        return (
                          <button
                            key={relatedId}
                            onClick={() => setSelectedFeatureId(relatedId)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-md border-2 transition-all",
                              relatedColors.bg,
                              relatedColors.border,
                              "hover:scale-105"
                            )}
                          >
                            <RelatedIcon
                              className={cn("w-4 h-4", relatedColors.icon)}
                            />
                            <span
                              className={cn(
                                "text-xs font-mono font-bold",
                                relatedColors.text
                              )}
                            >
                              {relatedFeature.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
        </div>
      </div>
    </div>
  );
}
