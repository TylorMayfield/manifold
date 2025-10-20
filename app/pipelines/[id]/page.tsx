"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageLayout from "../../../components/layout/PageLayout";
import CellCard from "../../../components/ui/CellCard";
import CellButton from "../../../components/ui/CellButton";
import LoadingState from "../../../components/ui/LoadingState";
import { Zap, ArrowLeft, Play, Settings, Trash, Save, Plus, X } from "lucide-react";
import CellInput from "../../../components/ui/CellInput";
import CellSelect from "../../../components/ui/CellSelect";

export default function PipelineDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const pipelineId = params.id as string;

  const [pipeline, setPipeline] = useState<any | null>(null);
  const [editedPipeline, setEditedPipeline] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<'simple' | 'visual'>('simple');

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
        setEditedPipeline(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    if (pipelineId) load();
  }, [pipelineId]);

  const handleSave = async () => {
    if (!editedPipeline) return;
    try {
      const resp = await fetch(`/api/pipelines/${pipelineId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedPipeline),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed to save pipeline");
      }
      const data = await resp.json();
      setPipeline(data);
      setEditedPipeline(data);
      setIsEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this pipeline?")) {
      try {
        await fetch(`/api/pipelines/${pipelineId}`, { method: "DELETE" });
        router.push("/pipelines");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    }
  };

  const handleAddStep = () => {
    setEditedPipeline({
      ...editedPipeline,
      steps: [
        ...(editedPipeline.steps || []),
        { type: "filter", config: { condition: "" } },
      ],
    });
  };

  const handleDeleteStep = (index: number) => {
    const newSteps = [...(editedPipeline.steps || [])];
    newSteps.splice(index, 1);
    setEditedPipeline({ ...editedPipeline, steps: newSteps });
  };

  const handleStepChange = (index: number, field: string, value: any) => {
    const newSteps = [...(editedPipeline.steps || [])];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setEditedPipeline({ ...editedPipeline, steps: newSteps });
  };

  const handleUpdateStepConfig = (index: number, config: string) => {
    try {
      const parsedConfig = JSON.parse(config);
      handleStepChange(index, "config", parsedConfig);
    } catch (error) {
      // TODO: Show an error to the user
    }
  };

  return (
    <PageLayout
      title={pipeline ? pipeline.name : "Pipeline"}
      subtitle={
        pipeline ? pipeline.description || "Pipeline details" : "Loading pipeline..."
      }
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
          <CellButton
            className="mt-3"
            variant="secondary"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Retry
          </CellButton>
        </CellCard>
      ) : pipeline ? (
        <div className="space-y-6">
          <CellCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-mono font-bold text-lg">Overview</h3>
                <p className="text-caption text-gray-600">
                  Pipeline ID: {pipeline.id}
                </p>
              </div>
              <div className="flex space-x-2">
                <CellButton
                  variant="accent"
                  size="sm"
                  onClick={async () => {
                    try {
                      const resp = await fetch(
                        `/api/pipelines/${pipeline.id}/execute`,
                        { method: "POST" }
                      );
                      if (resp.ok) alert("Execution started");
                      else alert("Execution failed");
                    } catch {
                      alert("Execution failed");
                    }
                  }}
                >
                  <Play className="w-4 h-4 mr-1" /> Run
                </CellButton>
                {!isEditing && (
                  <CellButton
                    variant="primary"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Pipeline
                  </CellButton>
                )}
              </div>
            </div>
            
            {!isEditing && (pipeline.steps || []).length === 0 && (
              <div className="mt-4 p-4 bg-blue-50 border-l-4 border-l-blue-500 rounded">
                <p className="text-sm text-blue-800">
                  <strong>This pipeline has no transformation steps yet.</strong>
                  <br />
                  Click "Edit Pipeline" above to add steps like filter, map, aggregate, or join.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-caption font-bold">Steps</div>
                <div className="font-mono">{pipeline.steps?.length || 0}</div>
              </div>
              <div>
                <div className="text-caption font-bold">Sources</div>
                <div className="font-mono">
                  {pipeline.inputSourceIds?.length || 0}
                </div>
              </div>
              <div>
                <div className="text-caption font-bold">Updated</div>
                <div className="font-mono text-xs">
                  {pipeline.updatedAt
                    ? new Date(pipeline.updatedAt).toLocaleString()
                    : "-"}
                </div>
              </div>
            </div>
          </CellCard>

          {isEditing ? (
            // Edit mode
            <>
              <CellCard className="p-6">
                <h3 className="font-mono font-bold text-lg mb-4">
                  Pipeline Details
                </h3>
                <div className="space-y-4">
                  <CellInput
                    label="Pipeline Name"
                    placeholder="Enter pipeline name"
                    value={editedPipeline.name || ''}
                    onChange={(e) => setEditedPipeline({ ...editedPipeline, name: e.target.value })}
                  />
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      className="w-full border-2 border-black bg-white font-mono px-3 py-2 text-base transition-all duration-100 focus:outline-none focus:shadow-cell-inset placeholder:text-gray-400"
                      placeholder="Enter pipeline description"
                      value={editedPipeline.description || ''}
                      onChange={(e) => setEditedPipeline({ ...editedPipeline, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              </CellCard>

              <CellCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-mono font-bold text-lg">
                    Transform Steps
                  </h3>
                  <CellButton
                    variant="primary"
                    size="sm"
                    onClick={handleAddStep}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Step
                  </CellButton>
                </div>
                
                {(editedPipeline.steps || []).length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <Zap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h4 className="text-lg font-bold text-gray-700 mb-2">
                      No Transform Steps Yet
                    </h4>
                    <p className="text-gray-600 mb-4 max-w-md mx-auto">
                      Transform steps define how to process your data. Add steps like filter, map, or aggregate to build your data transformation pipeline.
                    </p>
                    <CellButton
                      variant="primary"
                      onClick={handleAddStep}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Your First Step
                    </CellButton>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(editedPipeline.steps || []).map((step: any, index: number) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 bg-white rounded"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2">
                        <label className="text-caption font-bold">Type</label>
                        <CellSelect
                          value={step.type}
                          onChange={(e) =>
                            handleStepChange(index, "type", e.target.value)
                          }
                        >
                          <option value="filter">filter</option>
                          <option value="map">map</option>
                          <option value="aggregate">aggregate</option>
                        </CellSelect>
                      </div>
                      <CellButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStep(index)}
                      >
                        <X className="w-4 h-4" />
                      </CellButton>
                    </div>
                    <textarea
                      className="w-full h-24 p-2 border border-gray-300 rounded"
                      value={JSON.stringify(step.config, null, 2)}
                      onChange={(e) =>
                        handleUpdateStepConfig(index, e.target.value)
                      }
                    />
                  </div>
                    ))}
                    <CellButton
                      variant="secondary"
                      size="sm"
                      onClick={handleAddStep}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Another Step
                    </CellButton>
                  </div>
                )}
                <div className="flex justify-end space-x-2 mt-6">
                  <CellButton
                    variant="secondary"
                    onClick={() => {
                      setEditedPipeline(pipeline);
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </CellButton>
                  <CellButton variant="primary" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" /> Save
                  </CellButton>
                </div>
              </CellCard>
            </>
          ) : (
            // View mode
            pipeline.steps &&
            pipeline.steps.length > 0 && (
              <CellCard className="p-6">
                <h3 className="font-mono font-bold text-lg mb-3">
                  Transform Steps
                </h3>
                <div className="space-y-2">
                  {pipeline.steps.map((s: any, i: number) => (
                    <div
                      key={s.id || i}
                      className="p-3 border border-gray-200 bg-white rounded"
                    >
                      <div className="font-mono font-bold">{s.type}</div>
                      {s.config && (
                        <pre className="text-xs text-gray-700 mt-1 bg-gray-50 p-2 overflow-x-auto">
                          {JSON.stringify(s.config, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </CellCard>
            )
          )}

          <CellCard className="p-6 border-l-4 border-l-red-500 bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono font-bold text-lg">
                  Delete Pipeline
                </h3>
                <p className="text-caption text-red-800">
                  This action is irreversible.
                </p>
              </div>
              <CellButton variant="danger" size="sm" onClick={handleDelete}>
                <Trash className="w-4 h-4 mr-1" /> Delete
              </CellButton>
            </div>
          </CellCard>
        </div>
      ) : null}
    </PageLayout>
  );
}


