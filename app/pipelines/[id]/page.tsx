"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageLayout from "../../../components/layout/PageLayout";
import CellCard from "../../../components/ui/CellCard";
import CellButton from "../../../components/ui/CellButton";
import LoadingState from "../../../components/ui/LoadingState";
import { Zap, ArrowLeft, Play, Settings } from "lucide-react";

export default function PipelineDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const pipelineId = params.id as string;

  const [pipeline, setPipeline] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await fetch(`/api/pipelines/${pipelineId}`);
        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err.error || "Failed to load pipeline");
        }
        const data = await resp.json();
        setPipeline(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    if (pipelineId) load();
  }, [pipelineId]);

  return (
    <PageLayout
      title={pipeline ? pipeline.name : "Pipeline"}
      subtitle={pipeline ? (pipeline.description || "Pipeline details") : "Loading pipeline..."}
      icon={Zap}
      showBackButton={true}
      backButtonText="Back to Pipelines"
      backButtonHref="/pipelines"
    >
      {loading ? (
        <LoadingState variant="card" message="Loading pipeline..." />
      ) : error ? (
        <CellCard className="p-6 border-l-4 border-l-red-500 bg-red-50">
          <div className="text-red-800">Error: {error}</div>
          <CellButton className="mt-3" variant="secondary" size="sm" onClick={() => window.location.reload()}>
            Retry
          </CellButton>
        </CellCard>
      ) : pipeline ? (
        <div className="space-y-6">
          <CellCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-mono font-bold text-lg">Overview</h3>
                <p className="text-caption text-gray-600">Pipeline ID: {pipeline.id}</p>
              </div>
              <div className="flex space-x-2">
                <CellButton variant="accent" size="sm" onClick={async () => {
                  try {
                    const resp = await fetch(`/api/pipelines/${pipeline.id}/execute`, { method: 'POST' });
                    if (resp.ok) alert('Execution started'); else alert('Execution failed');
                  } catch {
                    alert('Execution failed');
                  }
                }}>
                  <Play className="w-4 h-4 mr-1" /> Run
                </CellButton>
                <CellButton variant="secondary" size="sm">
                  <Settings className="w-4 h-4" />
                </CellButton>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-caption font-bold">Steps</div>
                <div className="font-mono">{pipeline.steps?.length || 0}</div>
              </div>
              <div>
                <div className="text-caption font-bold">Sources</div>
                <div className="font-mono">{pipeline.inputSourceIds?.length || 0}</div>
              </div>
              <div>
                <div className="text-caption font-bold">Updated</div>
                <div className="font-mono text-xs">{pipeline.updatedAt ? new Date(pipeline.updatedAt).toLocaleString() : '-'}</div>
              </div>
            </div>
          </CellCard>

          {pipeline.steps && pipeline.steps.length > 0 && (
            <CellCard className="p-6">
              <h3 className="font-mono font-bold text-lg mb-3">Transform Steps</h3>
              <div className="space-y-2">
                {pipeline.steps.map((s: any, i: number) => (
                  <div key={s.id || i} className="p-3 border border-gray-200 bg-white rounded">
                    <div className="font-mono font-bold">{s.type}</div>
                    {s.config && (
                      <pre className="text-xs text-gray-700 mt-1 bg-gray-50 p-2 overflow-x-auto">{JSON.stringify(s.config, null, 2)}</pre>
                    )}
                  </div>
                ))}
              </div>
            </CellCard>
          )}
        </div>
      ) : null}
    </PageLayout>
  );
}


