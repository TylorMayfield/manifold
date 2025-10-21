"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageLayout from "../../../components/layout/PageLayout";
import CellCard from "../../../components/ui/CellCard";
import CellButton from "../../../components/ui/CellButton";
import LoadingState from "../../../components/ui/LoadingState";
import { Zap, ArrowLeft, ArrowRight, Play, Settings, Trash, Save, Plus, X } from "lucide-react";
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
  const [availableDataSources, setAvailableDataSources] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load pipeline and data sources in parallel
        const [pipelineResp, sourcesResp] = await Promise.all([
          fetch(`/api/pipelines/${pipelineId}`),
          fetch('/api/data-sources?projectId=default')
        ]);
        
        if (!pipelineResp.ok) {
          const err = await pipelineResp.json();
          throw new Error(err.error || "Failed to load pipeline");
        }
        
        const pipelineData = await pipelineResp.json();
        setPipeline(pipelineData);
        setEditedPipeline(pipelineData);
        
        if (sourcesResp.ok) {
          const sources = await sourcesResp.json();
          setAvailableDataSources(sources);
        }
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
      console.log('[Pipeline] Saving pipeline:', editedPipeline);
      console.log('[Pipeline] Input source IDs:', editedPipeline.inputSourceIds);
      
      // Store in localStorage for debugging (won't be cleared on reload)
      localStorage.setItem('pipeline_save_debug', JSON.stringify({
        timestamp: new Date().toISOString(),
        saving: editedPipeline,
        inputSourceIds: editedPipeline.inputSourceIds
      }));
      
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
      console.log('[Pipeline] Save response:', data);
      console.log('[Pipeline] Saved input source IDs:', data.inputSourceIds);
      
      // Store save response in localStorage for debugging
      localStorage.setItem('pipeline_save_response', JSON.stringify({
        timestamp: new Date().toISOString(),
        response: data,
        inputSourceIds: data.inputSourceIds
      }));
      
      // Show success message with data before reload
      const successMsg = `✅ Pipeline saved successfully!\n\nSources: ${data.inputSourceIds?.length || 0}\nSteps: ${data.steps?.length || 0}\n\nSaved inputSourceIds: ${JSON.stringify(data.inputSourceIds)}\n\nClick OK to reload page and see changes.`;
      
      // Use setTimeout to ensure logs are visible before reload
      setTimeout(() => {
        if (window.confirm(successMsg)) {
          window.location.reload();
        }
      }, 100);
    } catch (e) {
      console.error('[Pipeline] Save error:', e);
      setError(e instanceof Error ? e.message : String(e));
      alert(`❌ Failed to save pipeline\n\n${e instanceof Error ? e.message : String(e)}`);
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
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs font-bold text-gray-600 mb-1">Transform Steps</div>
                <div className="font-mono text-2xl font-bold">{pipeline.steps?.length || 0}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs font-bold text-gray-600 mb-1">Input Sources</div>
                <div className="font-mono text-2xl font-bold">
                  {pipeline.inputSourceIds?.length || 0}
                </div>
                {pipeline.inputSourceIds && pipeline.inputSourceIds.length > 0 && (
                  <div className="text-xs text-gray-600 mt-1">
                    {pipeline.inputSourceIds.map((sourceId: string) => {
                      const source = availableDataSources.find(s => s.id === sourceId);
                      return source ? source.name : sourceId;
                    }).join(', ')}
                  </div>
                )}
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs font-bold text-gray-600 mb-1">Last Updated</div>
                <div className="font-mono text-sm">
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
            
            {/* Debug section - remove after testing */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="text-sm font-bold text-yellow-800 mb-2">🐛 Debug Info</h4>
                <div className="text-xs text-yellow-700 space-y-1">
                  <div>Pipeline ID: {pipelineId}</div>
                  <div>Current Sources: {pipeline?.inputSourceIds?.length || 0}</div>
                  <div>Available Sources: {availableDataSources.length}</div>
                  <div>Current Steps: {pipeline?.steps?.length || 0}</div>
                  <div>Save Debug Stored: {localStorage.getItem('pipeline_save_debug') ? '✅' : '❌'}</div>
                </div>
                <div className="flex space-x-2 mt-2">
                  <button 
                    onClick={() => {
                      console.log('Save Debug:', localStorage.getItem('pipeline_save_debug'));
                      console.log('Save Response:', localStorage.getItem('pipeline_save_response'));
                    }}
                    className="text-xs bg-yellow-200 px-2 py-1 rounded hover:bg-yellow-300"
                  >
                    Log to Console
                  </button>
                  <button 
                    onClick={() => {
                      localStorage.removeItem('pipeline_save_debug');
                      localStorage.removeItem('pipeline_save_response');
                      window.location.reload();
                    }}
                    className="text-xs bg-red-200 px-2 py-1 rounded hover:bg-red-300"
                  >
                    Clear Debug & Reload
                  </button>
                </div>
              </div>
            )}
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
                  
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Input Data Sources
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded p-3">
                      {availableDataSources.length === 0 ? (
                        <p className="text-sm text-gray-500">No data sources available. Create data sources first.</p>
                      ) : (
                        availableDataSources.map((source) => (
                          <label key={source.id} className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(editedPipeline.inputSourceIds || []).includes(source.id)}
                              onChange={(e) => {
                                const currentSources = editedPipeline.inputSourceIds || [];
                                const newSources = e.target.checked
                                  ? [...currentSources, source.id]
                                  : currentSources.filter((id: string) => id !== source.id);
                                setEditedPipeline({ ...editedPipeline, inputSourceIds: newSources });
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm flex-1">{source.name}</span>
                            <span className="text-xs text-gray-500 uppercase">{source.type}</span>
                          </label>
                        ))
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Select which data sources to use as input for this pipeline
                    </p>
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
                        className="p-4 border-2 border-gray-300 bg-white rounded-lg"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-bold text-gray-500">Step {index + 1}</span>
                            <CellSelect
                              value={step.type}
                              onChange={(e) => {
                                handleStepChange(index, "type", e.target.value);
                                // Reset config when type changes
                                if (e.target.value === 'filter') {
                                  handleStepChange(index, "config", { condition: "" });
                                } else if (e.target.value === 'map') {
                                  handleStepChange(index, "config", { fieldMappings: [] });
                                } else if (e.target.value === 'aggregate') {
                                  handleStepChange(index, "config", { groupBy: [], aggregations: [] });
                                }
                              }}
                              inputSize="sm"
                            >
                              <option value="filter">Filter (Remove rows)</option>
                              <option value="map">Map (Transform fields)</option>
                              <option value="aggregate">Aggregate (Group & summarize)</option>
                            </CellSelect>
                          </div>
                          <CellButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStep(index)}
                            title="Delete this step"
                          >
                            <X className="w-4 h-4" />
                          </CellButton>
                        </div>

                        {/* User-friendly configuration based on type */}
                        {step.type === 'filter' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Filter Condition (JavaScript expression)
                            </label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
                              placeholder="e.g., row.age > 18 || row.status === 'active'"
                              value={step.config?.condition || step.config?.filterExpression || ''}
                              onChange={(e) => 
                                handleStepChange(index, "config", { 
                                  ...step.config,
                                  condition: e.target.value,
                                  filterExpression: e.target.value 
                                })
                              }
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Use <code className="bg-gray-100 px-1">row.fieldName</code> to access fields. Returns <code className="bg-gray-100 px-1">true</code> to keep row.
                            </p>
                          </div>
                        )}

                        {step.type === 'map' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Field Transformations
                            </label>
                            <div className="space-y-2">
                              {(step.config?.fieldMappings || []).map((mapping: any, mIndex: number) => (
                                <div key={mIndex} className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    placeholder="From field"
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                    value={mapping.from || ''}
                                    onChange={(e) => {
                                      const newMappings = [...(step.config?.fieldMappings || [])];
                                      newMappings[mIndex] = { ...mapping, from: e.target.value };
                                      handleStepChange(index, "config", { ...step.config, fieldMappings: newMappings });
                                    }}
                                  />
                                  <ArrowRight className="w-4 h-4 text-gray-400" />
                                  <input
                                    type="text"
                                    placeholder="To field"
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                    value={mapping.to || ''}
                                    onChange={(e) => {
                                      const newMappings = [...(step.config?.fieldMappings || [])];
                                      newMappings[mIndex] = { ...mapping, to: e.target.value };
                                      handleStepChange(index, "config", { ...step.config, fieldMappings: newMappings });
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      const newMappings = (step.config?.fieldMappings || []).filter((_: any, i: number) => i !== mIndex);
                                      handleStepChange(index, "config", { ...step.config, fieldMappings: newMappings });
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded"
                                  >
                                    <X className="w-4 h-4 text-gray-500" />
                                  </button>
                                </div>
                              ))}
                              <CellButton
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newMappings = [...(step.config?.fieldMappings || []), { from: '', to: '', transform: '' }];
                                  handleStepChange(index, "config", { ...step.config, fieldMappings: newMappings });
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" /> Add Field Mapping
                              </CellButton>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Map field names from source to target (e.g., "first_name" → "firstName")
                            </p>
                          </div>
                        )}

                        {step.type === 'aggregate' && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Group By Fields (comma-separated)
                              </label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
                                placeholder="e.g., category, region"
                                value={(step.config?.groupBy || []).join(', ')}
                                onChange={(e) => 
                                  handleStepChange(index, "config", { 
                                    ...step.config,
                                    groupBy: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Aggregation Expression
                              </label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
                                placeholder="e.g., SUM(sales), COUNT(*), AVG(price)"
                                value={step.config?.expression || ''}
                                onChange={(e) => 
                                  handleStepChange(index, "config", { 
                                    ...step.config,
                                    expression: e.target.value
                                  })
                                }
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Use functions like SUM, COUNT, AVG, MIN, MAX
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Advanced: Show raw JSON for those who want it */}
                        <details className="mt-3">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            Advanced: Edit Raw JSON
                          </summary>
                          <textarea
                            className="w-full h-24 p-2 border border-gray-300 rounded font-mono text-xs mt-2"
                            value={JSON.stringify(step.config, null, 2)}
                            onChange={(e) => handleUpdateStepConfig(index, e.target.value)}
                          />
                        </details>
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


