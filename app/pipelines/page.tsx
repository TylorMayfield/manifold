"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Zap,
  Play,
  Settings,
  Code,
  Filter,
  BarChart3,
  Shuffle,
  Loader2,
} from "lucide-react";
import PageLayout from "../../components/layout/PageLayout";
import Button from "../../components/ui/Button";
import CellButton from "../../components/ui/CellButton";
import CellCard from "../../components/ui/CellCard";
import CellInput from "../../components/ui/CellInput";
import CellModal from "../../components/ui/CellModal";
import { PipelineProvider, usePipelines } from "../../contexts/PipelineContext";
import { Pipeline, TransformType } from "../../types";

const transformIcons: Record<TransformType, React.ComponentType<any>> = {
  filter: Filter,
  map: Shuffle,
  aggregate: BarChart3,
  join: Shuffle,
  sort: BarChart3,
  deduplicate: Filter,
  custom_script: Code,
};

function PipelinesPageContent() {
  const router = useRouter();
  const { pipelines, loading, error, createPipeline } = usePipelines();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePipeline = async () => {
    if (!newPipelineName.trim()) return;

    try {
      setIsCreating(true);
      await createPipeline({ name: newPipelineName.trim() });
      setNewPipelineName("");
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create pipeline:", error);
      // You could show a toast notification here
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <PageLayout
      title="Data Pipelines"
      subtitle="Transform and process your data"
      icon={Zap}
      showNavigation={true}
      showBackButton={true}
      backButtonText="Back to Home"
      backButtonHref="/"
      headerActions={
        <CellButton
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Pipeline
        </CellButton>
      }
    >
        {error && (
          <div className="mb-6">
            <CellCard className="p-4 border-l-4 border-l-red-500 bg-red-50">
              <p className="text-red-800">Error: {error}</p>
              <CellButton
                variant="secondary"
                size="sm"
                onClick={() => window.location.reload()}
                className="mt-2"
              >
                Retry
              </CellButton>
            </CellCard>
          </div>
        )}

        {loading ? (
          <CellCard className="p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-gray-400" />
            <p className="text-body text-gray-600">Loading pipelines...</p>
          </CellCard>
        ) : pipelines.length === 0 ? (
          // Empty State
          <CellCard className="p-12 text-center">
              <Zap className="w-20 h-20 mx-auto mb-6 text-gray-300" />
              <h2 className="text-heading mb-4">No Pipelines Created</h2>
              <p className="text-body text-gray-600 mb-8 max-w-2xl mx-auto">
                Pipelines let you transform, filter, and combine data from
                multiple sources. Create your first pipeline to start processing
                data.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <CellCard className="p-4">
                  <Filter className="w-8 h-8 mx-auto mb-3 text-blue-500" />
                  <h3 className="font-mono font-bold mb-2">Filter</h3>
                  <p className="text-caption">
                    Remove unwanted rows based on conditions
                  </p>
                </CellCard>

                <CellCard className="p-4">
                  <Shuffle className="w-8 h-8 mx-auto mb-3 text-green-500" />
                  <h3 className="font-mono font-bold mb-2">Transform</h3>
                  <p className="text-caption">Map and modify column values</p>
                </CellCard>

                <CellCard className="p-4">
                  <BarChart3 className="w-8 h-8 mx-auto mb-3 text-purple-500" />
                  <h3 className="font-mono font-bold mb-2">Aggregate</h3>
                  <p className="text-caption">Group and summarize data</p>
                </CellCard>

                <CellCard className="p-4">
                  <Code className="w-8 h-8 mx-auto mb-3 text-orange-500" />
                  <h3 className="font-mono font-bold mb-2">Custom</h3>
                  <p className="text-caption">
                    Write JavaScript transformations
                  </p>
                </CellCard>
              </div>

              <CellButton
                variant="primary"
                size="lg"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Pipeline
              </CellButton>
            </CellCard>
        ) : (
          // Pipeline List
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pipelines.map((pipeline) => (
              <CellCard
                key={pipeline.id}
                className="p-6 hover:bg-gray-50 cursor-pointer"
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
                    <CellButton variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </CellButton>
                    <CellButton variant="ghost" size="sm">
                      <Play className="w-4 h-4" />
                    </CellButton>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-caption font-bold">Steps:</span>
                    <span className="font-mono">{pipeline.steps.length}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-caption font-bold">Sources:</span>
                    <span className="font-mono">
                      {pipeline.inputSourceIds.length}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-caption font-bold">Updated:</span>
                    <span className="font-mono text-xs">
                      {pipeline.updatedAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {pipeline.steps.length > 0 && (
                  <div className="mt-4 pt-4 border-t-2 border-gray-100">
                    <p className="text-caption font-bold mb-2">
                      Transform Steps:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {pipeline.steps.slice(0, 4).map((step, index) => {
                        const Icon = transformIcons[step.type];
                        return (
                          <div
                            key={index}
                            className="status-info px-2 py-1 flex items-center"
                          >
                            <Icon className="w-3 h-3 mr-1" />
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
            ))}
          </div>
        )}

        {/* Create Pipeline Modal */}
        <CellModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setNewPipelineName("");
          }}
          title="Create New Pipeline"
          size="md"
        >
          <div className="space-y-6">
            <CellInput
              label="Pipeline Name"
              placeholder="e.g., Customer Data Processing"
              value={newPipelineName}
              onChange={(e) => setNewPipelineName(e.target.value)}
              autoFocus
            />

            <div className="flex justify-end space-x-3">
              <CellButton
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </CellButton>
              <CellButton
                variant="primary"
                onClick={handleCreatePipeline}
                disabled={!newPipelineName.trim() || isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Pipeline"
                )}
              </CellButton>
            </div>
          </div>
        </CellModal>
    </PageLayout>
  );
}

export default function PipelinesPage() {
  return (
    <PipelineProvider>
      <PipelinesPageContent />
    </PipelineProvider>
  );
}
