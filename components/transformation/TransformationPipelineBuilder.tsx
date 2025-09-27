"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Play,
  Save,
  Trash2,
  Settings,
  Eye,
  Copy,
  Move,
  Filter,
  ArrowRight,
  Database,
  Code,
  BarChart3,
  SortAsc,
  Link,
  Zap,
} from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import {
  DataTransformationEngine,
  TransformationPipeline,
  TransformationStep,
} from "../../lib/server/services/DataTransformationEngine";
import { clientLogger } from "../../lib/utils/ClientLogger";

interface TransformationPipelineBuilderProps {
  onPipelineExecute?: (result: any) => void;
}

export const TransformationPipelineBuilder: React.FC<
  TransformationPipelineBuilderProps
> = ({ onPipelineExecute }) => {
  const [engine] = useState(() => new DataTransformationEngine());
  const [pipelines, setPipelines] = useState<TransformationPipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] =
    useState<TransformationPipeline | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [selectedStepType, setSelectedStepType] = useState<
    TransformationStep["type"] | null
  >(null);
  const [draggedStep, setDraggedStep] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    loadPipelines();
  }, []);

  const loadPipelines = () => {
    const allPipelines = engine.getAllPipelines();
    setPipelines(allPipelines);

    if (allPipelines.length > 0 && !selectedPipeline) {
      setSelectedPipeline(allPipelines[0]);
    }
  };

  const handleCreatePipeline = (name: string, description: string) => {
    const newPipeline = engine.createPipeline({
      name,
      description,
      steps: [],
      inputSource: "sample-data",
      enabled: true,
    });

    setPipelines((prev) => [newPipeline, ...prev]);
    setSelectedPipeline(newPipeline);
    setShowCreateModal(false);

    clientLogger.info("Pipeline created", "data-transformation", {
      pipelineId: newPipeline.id,
    });
  };

  const handleAddStep = (stepType: TransformationStep["type"]) => {
    if (!selectedPipeline) return;

    const stepConfig = getDefaultStepConfig(stepType);
    const newStep = engine.addStep(selectedPipeline.id, {
      type: stepType,
      name: getStepDisplayName(stepType),
      config: stepConfig,
      enabled: true,
    });

    if (newStep) {
      loadPipelines();
      setShowStepModal(false);
      setSelectedStepType(null);
    }
  };

  const handleRemoveStep = (stepId: string) => {
    if (!selectedPipeline) return;

    engine.removeStep(selectedPipeline.id, stepId);
    loadPipelines();
  };

  const handleToggleStep = (stepId: string) => {
    if (!selectedPipeline) return;

    const step = selectedPipeline.steps.find((s) => s.id === stepId);
    if (step) {
      engine.updateStep(selectedPipeline.id, stepId, {
        enabled: !step.enabled,
      });
      loadPipelines();
    }
  };

  const handleReorderSteps = (fromIndex: number, toIndex: number) => {
    if (!selectedPipeline) return;

    const steps = [...selectedPipeline.steps];
    const [movedStep] = steps.splice(fromIndex, 1);
    steps.splice(toIndex, 0, movedStep);

    const stepIds = steps.map((s) => s.id);
    engine.reorderSteps(selectedPipeline.id, stepIds);
    loadPipelines();
  };

  const handleExecutePipeline = async () => {
    if (!selectedPipeline) return;

    setIsExecuting(true);
    try {
      const result = await engine.executePipeline(selectedPipeline.id);
      setExecutionResult(result);

      if (result.success && onPipelineExecute) {
        onPipelineExecute(result.data);
      }

      clientLogger.info("Pipeline executed", "data-transformation", {
        pipelineId: selectedPipeline.id,
        success: result.success,
        rowCount: result.metadata?.rowCount || 0,
      });
    } catch (error) {
      clientLogger.error("Pipeline execution failed", "data-transformation", {
        error: (error as Error).message,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getStepDisplayName = (type: TransformationStep["type"]): string => {
    switch (type) {
      case "filter":
        return "Filter Data";
      case "map":
        return "Transform Fields";
      case "group":
        return "Group & Aggregate";
      case "sort":
        return "Sort Data";
      case "aggregate":
        return "Calculate Totals";
      case "join":
        return "Join Data";
      case "custom":
        return "Custom Script";
      default:
        return "Unknown Step";
    }
  };

  const getStepIcon = (type: TransformationStep["type"]) => {
    switch (type) {
      case "filter":
        return Filter;
      case "map":
        return Settings;
      case "group":
        return BarChart3;
      case "sort":
        return SortAsc;
      case "aggregate":
        return BarChart3;
      case "join":
        return Link;
      case "custom":
        return Code;
      default:
        return Database;
    }
  };

  const getDefaultStepConfig = (type: TransformationStep["type"]): any => {
    switch (type) {
      case "filter":
        return {
          field: "",
          operator: "equals",
          value: "",
        };
      case "map":
        return {
          mappings: [{ sourceField: "", targetField: "", transform: "" }],
        };
      case "group":
        return {
          groupBy: [""],
          aggregations: [{ field: "", type: "count" }],
        };
      case "sort":
        return {
          sortBy: [{ field: "", direction: "asc" }],
        };
      case "aggregate":
        return {
          aggregations: [{ field: "", type: "sum" }],
        };
      case "join":
        return {
          joinType: "inner",
          joinField: "",
          otherData: [],
        };
      case "custom":
        return {
          script:
            '// Custom transformation script\n// Access data via "data" variable\nreturn data;',
        };
      default:
        return {};
    }
  };

  const getStepTypeColor = (type: TransformationStep["type"]): string => {
    switch (type) {
      case "filter":
        return "bg-blue-500";
      case "map":
        return "bg-green-500";
      case "group":
        return "bg-purple-500";
      case "sort":
        return "bg-orange-500";
      case "aggregate":
        return "bg-pink-500";
      case "join":
        return "bg-cyan-500";
      case "custom":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleDragStart = (stepId: string) => {
    setDraggedStep(stepId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();

    if (!draggedStep || !selectedPipeline) return;

    const sourceIndex = selectedPipeline.steps.findIndex(
      (s) => s.id === draggedStep
    );
    if (sourceIndex !== -1) {
      handleReorderSteps(sourceIndex, targetIndex);
    }

    setDraggedStep(null);
  };

  return (
    <div className="h-full flex flex-col glass-card">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              Data Transformation Pipeline
            </h3>
            <p className="text-sm text-gray-400">
              Build visual data transformation workflows
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4" />
              New Pipeline
            </Button>

            {selectedPipeline && (
              <Button
                variant="default"
                size="sm"
                onClick={handleExecutePipeline}
                disabled={isExecuting || selectedPipeline.steps.length === 0}
              >
                {isExecuting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Execute
              </Button>
            )}
          </div>
        </div>

        {/* Pipeline Selector */}
        {pipelines.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedPipeline?.id || ""}
              onChange={(e) => {
                const pipeline = pipelines.find((p) => p.id === e.target.value);
                setSelectedPipeline(pipeline || null);
              }}
              className="flex-1 p-2 rounded-lg bg-white/10 border border-white/20 text-white"
            >
              {pipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStepModal(true)}
              disabled={!selectedPipeline}
            >
              <Plus className="w-4 h-4" />
              Add Step
            </Button>
          </div>
        )}
      </div>

      {/* Pipeline Canvas */}
      <div className="flex-1 p-4 overflow-y-auto">
        {!selectedPipeline ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Pipeline Selected
              </h3>
              <p className="text-gray-400 mb-4">
                Create a new pipeline to get started
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Pipeline
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pipeline Info */}
            <div className="glass-card p-4">
              <h4 className="font-semibold mb-2">{selectedPipeline.name}</h4>
              {selectedPipeline.description && (
                <p className="text-sm text-gray-400">
                  {selectedPipeline.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                <span>Steps: {selectedPipeline.steps.length}</span>
                <span>
                  Status: {selectedPipeline.enabled ? "Enabled" : "Disabled"}
                </span>
                <span>
                  Last Updated:{" "}
                  {selectedPipeline.updatedAt.toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Transformation Steps */}
            <div className="space-y-3">
              {selectedPipeline.steps.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ArrowRight className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No transformation steps added</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowStepModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Step
                  </Button>
                </div>
              ) : (
                selectedPipeline.steps.map((step, index) => {
                  const Icon = getStepIcon(step.type);
                  return (
                    <div
                      key={step.id}
                      draggable
                      onDragStart={() => handleDragStart(step.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`glass-card p-4 border border-white/10 transition-all ${
                        draggedStep === step.id
                          ? "opacity-50"
                          : "hover:border-white/20"
                      } ${!step.enabled ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg ${getStepTypeColor(
                              step.type
                            )} flex items-center justify-center`}
                          >
                            <Icon className="w-5 h-5 text-white" />
                          </div>

                          <div>
                            <h5 className="font-medium">{step.name}</h5>
                            <p className="text-sm text-gray-400 capitalize">
                              {step.type.replace("_", " ")} • Step {index + 1}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStep(step.id)}
                          >
                            {step.enabled ? "Enabled" : "Disabled"}
                          </Button>

                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveStep(step.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {index < selectedPipeline.steps.length - 1 && (
                        <div className="flex justify-center mt-3">
                          <ArrowRight className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Execution Result */}
            {executionResult && (
              <div className="glass-card p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Execution Result
                </h4>

                {executionResult.success ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-green-400">Success</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rows Processed:</span>
                      <span>{executionResult.metadata?.rowCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fields:</span>
                      <span>{executionResult.metadata?.fieldCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Processing Time:</span>
                      <span>
                        {executionResult.metadata?.processingTime || 0}ms
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-400 text-sm">
                    Error: {executionResult.error}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Pipeline Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Pipeline"
      >
        <CreatePipelineForm
          onSubmit={handleCreatePipeline}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Add Step Modal */}
      <Modal
        isOpen={showStepModal}
        onClose={() => setShowStepModal(false)}
        title="Add Transformation Step"
      >
        <AddStepForm
          onStepTypeSelect={handleAddStep}
          onCancel={() => setShowStepModal(false)}
        />
      </Modal>
    </div>
  );
};

// Create Pipeline Form Component
interface CreatePipelineFormProps {
  onSubmit: (name: string, description: string) => void;
  onCancel: () => void;
}

const CreatePipelineForm: React.FC<CreatePipelineFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), description.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Pipeline Name</label>
        <Input
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
          placeholder="Enter pipeline name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <Textarea
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setDescription(e.target.value)
          }
          placeholder="Describe what this pipeline does"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim()}>
          Create Pipeline
        </Button>
      </div>
    </form>
  );
};

// Add Step Form Component
interface AddStepFormProps {
  onStepTypeSelect: (type: TransformationStep["type"]) => void;
  onCancel: () => void;
}

const AddStepForm: React.FC<AddStepFormProps> = ({
  onStepTypeSelect,
  onCancel,
}) => {
  const stepTypes: {
    type: TransformationStep["type"];
    name: string;
    description: string;
    icon: any;
  }[] = [
    {
      type: "filter",
      name: "Filter Data",
      description: "Filter rows based on conditions",
      icon: Filter,
    },
    {
      type: "map",
      name: "Transform Fields",
      description: "Transform and map field values",
      icon: Settings,
    },
    {
      type: "group",
      name: "Group & Aggregate",
      description: "Group data and calculate aggregations",
      icon: BarChart3,
    },
    {
      type: "sort",
      name: "Sort Data",
      description: "Sort rows by field values",
      icon: SortAsc,
    },
    {
      type: "aggregate",
      name: "Calculate Totals",
      description: "Calculate summary statistics",
      icon: BarChart3,
    },
    {
      type: "join",
      name: "Join Data",
      description: "Join with other data sources",
      icon: Link,
    },
    {
      type: "custom",
      name: "Custom Script",
      description: "Run custom JavaScript code",
      icon: Code,
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400 mb-4">
        Select a transformation step to add to your pipeline:
      </p>

      <div className="grid grid-cols-1 gap-3">
        {stepTypes.map(({ type, name, description, icon: Icon }) => (
          <button
            key={type}
            onClick={() => onStepTypeSelect(type)}
            className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-white/20 transition-colors text-left"
          >
            <Icon className="w-5 h-5 text-blue-400" />
            <div>
              <h4 className="font-medium">{name}</h4>
              <p className="text-sm text-gray-400">{description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
