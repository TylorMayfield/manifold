"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Settings,
  Code,
  Filter,
  BarChart3,
  Shuffle,
} from "lucide-react";
import CellButton from "../../ui/CellButton";
import CellCard from "../../ui/CellCard";
import { Pipeline, TransformType } from "../../../types";
import { clientLogger } from "../../../lib/utils/ClientLogger";

const transformIcons: Record<TransformType, React.ComponentType<any>> = {
    filter: Filter,
    map: Shuffle,
    aggregate: BarChart3,
    join: Shuffle,
    sort: BarChart3,
    deduplicate: Filter,
    custom_script: Code,
};

interface PipelineCardProps {
  pipeline: Pipeline;
}

const PipelineCard: React.FC<PipelineCardProps> = ({ pipeline }) => {
    const router = useRouter();

    const handleExecute = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await fetch(`/api/pipelines/${pipeline.id}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceIds: pipeline.inputSourceIds || [],
                }),
            });

            if (response.ok) {
                alert('Pipeline executed successfully!');
            } else {
                const error = await response.json();
                alert(`Execution failed: ${error.message || error.error}`);
            }
        } catch (error) {
            clientLogger.error("Failed to execute pipeline", "data-transformation", { error });
            alert('Failed to execute pipeline');
        }
    }

    return (
        <CellCard
            key={pipeline.id}
            className="p-6 hover:bg-gray-50 cursor-pointer"
            onClick={() => router.push(`/pipelines/${pipeline.id}`)}
        >
            <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
                <h3 className="font-mono font-bold text-lg mb-2">
                {pipeline.name}
                </h3>
                <p className="text-caption text-gray-600">
                {pipeline.description || "No description"}
                </p>
            </div>
            <div className="flex space-x-1">
                <CellButton
                    variant="ghost"
                    size="sm"
                    onClick={handleExecute}
                    title="Execute Pipeline"
                >
                    <Play className="w-4 h-4" />
                </CellButton>
                <CellButton variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                    <Settings className="w-4 h-4" />
                </CellButton>
            </div>
            </div>

            <div className="space-y-3">
            <div className="flex items-center space-x-2">
                <span className="text-caption font-bold">Steps:</span>
                <span className="font-mono">{pipeline.steps?.length || 0}</span>
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-caption font-bold">Sources:</span>
                <span className="font-mono">
                {pipeline.inputSourceIds?.length || 0}
                </span>
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-caption font-bold">Updated:</span>
                <span className="font-mono text-xs">
                {new Date(pipeline.updatedAt).toLocaleDateString()}
                </span>
            </div>
            </div>

            {pipeline.steps && pipeline.steps.length > 0 && (
            <div className="mt-4 pt-4 border-t-2 border-gray-100">
                <p className="text-caption font-bold mb-2">
                Transform Steps:
                </p>
                <div className="flex flex-wrap gap-1">
                {pipeline.steps.slice(0, 4).map((step, index) => {
                    const Icon = transformIcons[step.type];
                    return (
                    <div
                        key={step.id || `${pipeline.id || 'pipeline'}-step-${step.type}-${index}`}
                        className="status-info px-2 py-1 flex items-center"
                    >
                        {Icon && <Icon className="w-3 h-3 mr-1" />}
                        <span className="text-xs">{step.type}</span>
                    </div>
                    );
                })}
                {pipeline.steps.length > 4 && (
                    <span className="status-idle px-2 py-1 text-xs">
                    +{pipeline.steps.length - 4} more
                    </span>
                )}
                </div>
            </div>
            )}
        </CellCard>
    );
};

export default PipelineCard;
