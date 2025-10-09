"use client";

import React, { useState } from "react";
import { Plus, Zap } from "lucide-react";
import PageLayout from "../../components/layout/PageLayout";
import CellButton from "../../components/ui/CellButton";
import CellCard from "../../components/ui/CellCard";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import { PipelineProvider, usePipelines } from "../../contexts/PipelineContext";
import { clientLogger } from "../../lib/utils/ClientLogger";
import NewPipelineButton from "../../components/pipelines/list/NewPipelineButton";
import CreatePipelineModal from "../../components/pipelines/list/CreatePipelineModal";
import PipelineCard from "../../components/pipelines/list/PipelineCard";

function PipelinesPageContent() {
  const { pipelines, loading, error, createPipeline } = usePipelines();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreatePipeline = async (name: string) => {
    try {
      await createPipeline({ name });
    } catch (error) {
      clientLogger.error("Failed to create pipeline", "data-transformation", { error });
      alert('Failed to create pipeline. Check Observability logs for details.');
      // Re-throw error to be caught in the modal
      throw error;
    }
  };

  return (
    <PageLayout
      title="Data Pipelines"
      subtitle="Define HOW to transform your data • Run manually or schedule with Jobs"
      icon={Zap}
      showNavigation={true}
      showBackButton={true}
      backButtonText="Back to Home"
      backButtonHref="/"
      headerActions={
        <NewPipelineButton onClick={() => setShowCreateModal(true)} />
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
        <LoadingState variant="card" message="Loading pipelines..." />
      ) : pipelines.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No Pipelines Created"
          description="Pipelines define HOW to transform your data. They contain transformation steps (filter, map, aggregate, join) and can be executed manually or automated with Jobs. Think of pipelines as recipes - they define what to do with your data."
          action={{
            label: "Create Your First Pipeline",
            onClick: () => setShowCreateModal(true),
            icon: Plus,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {pipelines.map((pipeline) => (
            <PipelineCard key={pipeline.id} pipeline={pipeline} />
          ))}
        </div>
      )}

      <CreatePipelineModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreatePipeline}
      />
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
