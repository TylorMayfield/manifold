"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Project, DataSource } from "../../../../../types";
import { clientDatabaseService } from "../../../../../lib/database/ClientDatabaseService";
import { clientLogger } from "../../../../../lib/utils/ClientLogger";
import Button from "../../../../../components/ui/Button";
import {
  ArrowLeft,
  ArrowRight,
  Database,
  Link,
  Settings,
  Play,
  Save,
  Download,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  X,
  Search,
} from "lucide-react";

interface DataSourcePreview {
  id: string;
  name: string;
  type: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    unique: boolean;
  }>;
  recordCount: number;
  selected: boolean;
}

interface RelationshipSuggestion {
  id: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
  confidence: number;
  description: string;
}

interface ConsolidatedModel {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  dataSourceIds: string[];
  relationshipIds: string[];
  modelData?: any;
  metadata?: any;
  recordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function BuildModelPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const dbService = clientDatabaseService;

  const [project, setProject] = useState<Project | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [dataSourcePreviews, setDataSourcePreviews] = useState<
    DataSourcePreview[]
  >([]);
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);
  const [relationships, setRelationships] = useState<RelationshipSuggestion[]>(
    []
  );
  const [selectedRelationships, setSelectedRelationships] = useState<string[]>(
    []
  );
  const [modelName, setModelName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatedModel, setGeneratedModel] =
    useState<ConsolidatedModel | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [joinStrategy, setJoinStrategy] = useState("inner");
  const [aggregation, setAggregation] = useState("none");
  const [recordLimit, setRecordLimit] = useState<number | null>(null);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [customSqlQuery, setCustomSqlQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentStep, setCurrentStep] = useState(1); // 1: Data Sources, 2: Relationships, 3: Configuration, 4: Review

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const projectData = await dbService.getProject(projectId);
      const dataSourcesData = await dbService.getDataSources(projectId);

      setProject(projectData);
      setDataSources(dataSourcesData);

      if (dataSourcesData.length > 0) {
        loadDataSourcePreviews();
      }
    } catch (error) {
      clientLogger.error(
        "Failed to load project data",
        "ui",
        { error, projectId },
        "BuildModelPage"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadDataSourcePreviews = async () => {
    try {
      const previews: DataSourcePreview[] = dataSources.map((ds) => ({
        id: ds.id,
        name: ds.name,
        type: ds.type,
        columns: [],
        recordCount: 0,
        selected: false,
      }));
      setDataSourcePreviews(previews);
    } catch (error) {
      clientLogger.error(
        "Failed to load data source previews",
        "data-processing",
        { error },
        "BuildModelPage"
      );
    }
  };

  const toggleDataSourceSelection = (id: string) => {
    setSelectedDataSources((prev) =>
      prev.includes(id) ? prev.filter((dsId) => dsId !== id) : [...prev, id]
    );
  };

  const analyzeRelationships = async () => {
    if (selectedDataSources.length < 2) return;

    setLoading(true);
    try {
      // Simulate relationship analysis
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const selectedPreviews = dataSourcePreviews.filter((p) =>
        selectedDataSources.includes(p.id)
      );

      const suggestions: RelationshipSuggestion[] = [];

      // Generate relationship suggestions based on column names and types
      for (let i = 0; i < selectedPreviews.length; i++) {
        for (let j = i + 1; j < selectedPreviews.length; j++) {
          const source = selectedPreviews[i];
          const target = selectedPreviews[j];

          // Look for common column patterns
          source.columns.forEach((sourceCol) => {
            target.columns.forEach((targetCol) => {
              if (
                sourceCol.name.toLowerCase() === targetCol.name.toLowerCase() ||
                (sourceCol.name.toLowerCase().includes("id") &&
                  targetCol.name.toLowerCase().includes("id")) ||
                (sourceCol.name.toLowerCase().includes("key") &&
                  targetCol.name.toLowerCase().includes("key"))
              ) {
                suggestions.push({
                  id: `rel_${Date.now()}_${Math.random()}`,
                  sourceTable: source.name,
                  sourceColumn: sourceCol.name,
                  targetTable: target.name,
                  targetColumn: targetCol.name,
                  type: "one-to-many",
                  confidence: 0.8,
                  description: `Link ${source.name}.${sourceCol.name} to ${target.name}.${targetCol.name}`,
                });
              }
            });
          });
        }
      }

      setRelationships(suggestions);
      setCurrentStep(2);

      clientLogger.success(
        "Relationships analyzed successfully",
        "data-processing",
        { relationshipCount: suggestions.length },
        "BuildModelPage"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to analyze relationships",
        "data-processing",
        { error },
        "BuildModelPage"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleRelationshipSelection = (relationshipId: string) => {
    setSelectedRelationships((prev) =>
      prev.includes(relationshipId)
        ? prev.filter((id) => id !== relationshipId)
        : [...prev, relationshipId]
    );
  };

  const generateConsolidatedModel = async () => {
    if (selectedDataSources.length === 0 || !modelName.trim()) return;

    setLoading(true);
    try {
      // Simulate model generation
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const selectedPreviews = dataSourcePreviews.filter((p) =>
        selectedDataSources.includes(p.id)
      );
      const selectedRels = relationships.filter((r) =>
        selectedRelationships.includes(r.id)
      );

      const model: ConsolidatedModel = {
        id: `model_${Date.now()}`,
        projectId,
        name: modelName,
        description: `Consolidated model combining ${selectedPreviews.length} data sources with ${selectedRels.length} relationships`,
        dataSourceIds: selectedDataSources,
        relationshipIds: selectedRelationships,
        recordCount: selectedPreviews.reduce(
          (sum, ds) => sum + ds.recordCount,
          0
        ),
        modelData: {
          dataSources: selectedPreviews,
          relationships: selectedRels,
          generatedAt: new Date().toISOString(),
        },
        metadata: {
          totalColumns: selectedPreviews.reduce(
            (sum, ds) => sum + ds.columns.length,
            0
          ),
          relationshipCount: selectedRels.length,
          dataSourceCount: selectedPreviews.length,
          joinStrategy,
          aggregation,
          recordLimit,
          includeMetadata,
          customSqlQuery: customSqlQuery.trim() || undefined,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setGeneratedModel(model);
      setCurrentStep(4);

      clientLogger.success(
        "Model generated successfully",
        "data-processing",
        { modelId: model.id, modelName: model.name },
        "BuildModelPage"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to generate model",
        "data-processing",
        { error },
        "BuildModelPage"
      );
    } finally {
      setLoading(false);
    }
  };

  const saveModel = async () => {
    if (!generatedModel) return;

    setSaving(true);
    try {
      // Import the correct database service
      const { DatabaseService } = await import(
        "../../../../../lib/services/DatabaseService"
      );
      const dbService = DatabaseService.getInstance();

      await dbService.createConsolidatedModel(generatedModel);

      clientLogger.success(
        "Model saved to database",
        "data-processing",
        { modelId: generatedModel.id, modelName: generatedModel.name },
        "BuildModelPage"
      );

      // Navigate back to models page
      router.push(`/project/${projectId}/models`);
    } catch (error) {
      clientLogger.error(
        "Failed to save model",
        "data-processing",
        { error, modelId: generatedModel.id },
        "BuildModelPage"
      );
    } finally {
      setSaving(false);
    }
  };

  const exportModel = async () => {
    if (!generatedModel) return;

    try {
      const modelData = {
        model: generatedModel,
        dataSources: dataSourcePreviews.filter((p) =>
          selectedDataSources.includes(p.id)
        ),
        relationships: relationships.filter((r) =>
          selectedRelationships.includes(r.id)
        ),
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(modelData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${generatedModel.name.replace(/\s+/g, "_")}_model.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      clientLogger.success(
        "Model exported successfully",
        "data-processing",
        { modelId: generatedModel.id },
        "BuildModelPage"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to export model",
        "data-processing",
        { error },
        "BuildModelPage"
      );
    }
  };

  const filteredDataSources = dataSourcePreviews.filter(
    (ds) =>
      ds.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ds.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !dataSourcePreviews.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark_cyan-900 via-dark_cyan-800 to-dark_cyan-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-tangerine-400" />
            <span className="ml-2 text-white">Loading project data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark_cyan-900 via-dark_cyan-800 to-dark_cyan-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push(`/project/${projectId}/models`)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Models
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Build Consolidated Model
              </h1>
              <p className="text-dark_cyan-300">
                {project?.name} - Create a unified model from multiple data
                sources
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between">
            {[
              { step: 1, title: "Select Data Sources", icon: Database },
              { step: 2, title: "Define Relationships", icon: Link },
              { step: 3, title: "Configure Model", icon: Settings },
              { step: 4, title: "Review & Save", icon: CheckCircle },
            ].map(({ step, title, icon: Icon }, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    currentStep >= step
                      ? "border-tangerine-400 bg-tangerine-500/20 text-tangerine-400"
                      : "border-dark_cyan-300 text-dark_cyan-300"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    currentStep >= step ? "text-white" : "text-dark_cyan-300"
                  }`}
                >
                  {title}
                </span>
                {index < 3 && (
                  <div
                    className={`w-16 h-0.5 mx-4 ${
                      currentStep > step
                        ? "bg-tangerine-400"
                        : "bg-dark_cyan-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Data Source Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Select Data Sources
              </h2>
              <p className="text-dark_cyan-300 mb-6">
                Choose the data sources you want to include in your consolidated
                model. You can select multiple sources to create relationships
                between them.
              </p>

              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark_cyan-400" />
                <input
                  type="text"
                  placeholder="Search data sources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-tangerine-500"
                />
              </div>

              {/* Data Sources Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {filteredDataSources.map((ds) => (
                  <div
                    key={ds.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedDataSources.includes(ds.id)
                        ? "border-tangerine-400 bg-tangerine-500/10"
                        : "border-dark_cyan-200 border-opacity-20 hover:border-opacity-40"
                    }`}
                    onClick={() => toggleDataSourceSelection(ds.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-white">{ds.name}</h3>
                      {selectedDataSources.includes(ds.id) && (
                        <CheckCircle className="h-5 w-5 text-tangerine-400" />
                      )}
                    </div>
                    <p className="text-sm text-dark_cyan-300 mb-2">{ds.type}</p>
                    <div className="flex items-center justify-between text-xs text-dark_cyan-400">
                      <span>{ds.columns.length} columns</span>
                      <span>{ds.recordCount.toLocaleString()} records</span>
                    </div>
                  </div>
                ))}
              </div>

              {selectedDataSources.length === 0 && (
                <div className="text-center py-8 text-dark_cyan-300">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select at least one data source to continue</p>
                </div>
              )}

              {selectedDataSources.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-white">
                    {selectedDataSources.length} data source
                    {selectedDataSources.length !== 1 ? "s" : ""} selected
                  </p>
                  <Button
                    onClick={analyzeRelationships}
                    disabled={selectedDataSources.length < 2}
                    className="flex items-center gap-2"
                  >
                    <Link className="h-4 w-4" />
                    Analyze Relationships
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Relationship Definition */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Define Relationships
              </h2>
              <p className="text-dark_cyan-300 mb-6">
                Review and select the relationships between your data sources.
                These will determine how the data is joined in your consolidated
                model.
              </p>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-tangerine-400 mr-2" />
                  <span className="text-white">Analyzing relationships...</span>
                </div>
              ) : (
                <>
                  {relationships.length === 0 ? (
                    <div className="text-center py-8 text-dark_cyan-300">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>
                        No relationships found between the selected data sources
                      </p>
                      <p className="text-sm mt-2">
                        You can still create a model without relationships
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 mb-6">
                      {relationships.map((rel) => (
                        <div
                          key={rel.id}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedRelationships.includes(rel.id)
                              ? "border-tangerine-400 bg-tangerine-500/10"
                              : "border-dark_cyan-200 border-opacity-20 hover:border-opacity-40"
                          }`}
                          onClick={() => toggleRelationshipSelection(rel.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-white">
                                {rel.sourceTable} → {rel.targetTable}
                              </h3>
                              {selectedRelationships.includes(rel.id) && (
                                <CheckCircle className="h-4 w-4 text-tangerine-400" />
                              )}
                            </div>
                            <span className="text-xs px-2 py-1 rounded bg-dark_cyan-500/20 text-dark_cyan-300">
                              {rel.type}
                            </span>
                          </div>
                          <p className="text-sm text-dark_cyan-300 mb-2">
                            {rel.sourceColumn} → {rel.targetColumn}
                          </p>
                          <p className="text-xs text-dark_cyan-400">
                            {rel.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => setCurrentStep(1)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Data Sources
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(3)}
                      className="flex items-center gap-2"
                    >
                      Configure Model
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Model Configuration */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Configure Model
              </h2>
              <p className="text-dark_cyan-300 mb-6">
                Set up your model configuration and advanced options.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Model Name
                  </label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="e.g., Customer Analytics Model"
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-tangerine-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Join Strategy
                  </label>
                  <select
                    value={joinStrategy}
                    onChange={(e) => setJoinStrategy(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-tangerine-500"
                  >
                    <option value="inner">Inner Join</option>
                    <option value="left">Left Join</option>
                    <option value="right">Right Join</option>
                    <option value="full">Full Outer Join</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Aggregation
                  </label>
                  <select
                    value={aggregation}
                    onChange={(e) => setAggregation(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-tangerine-500"
                  >
                    <option value="none">No Aggregation</option>
                    <option value="sum">Sum</option>
                    <option value="avg">Average</option>
                    <option value="count">Count</option>
                    <option value="max">Maximum</option>
                    <option value="min">Minimum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Record Limit (optional)
                  </label>
                  <input
                    type="number"
                    value={recordLimit || ""}
                    onChange={(e) =>
                      setRecordLimit(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    placeholder="No limit"
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-tangerine-500"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="flex items-center gap-2 text-white/70">
                  <input
                    type="checkbox"
                    checked={includeMetadata}
                    onChange={(e) => setIncludeMetadata(e.target.checked)}
                    className="rounded border-white/20 bg-white/10 text-tangerine-500 focus:ring-tangerine-500"
                  />
                  Include metadata columns
                </label>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Custom SQL Query (optional)
                </label>
                <textarea
                  value={customSqlQuery}
                  onChange={(e) => setCustomSqlQuery(e.target.value)}
                  placeholder="Enter custom SQL for advanced transformations..."
                  rows={4}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-tangerine-500"
                />
              </div>

              <div className="flex items-center justify-between mt-8">
                <Button
                  onClick={() => setCurrentStep(2)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Relationships
                </Button>
                <Button
                  onClick={generateConsolidatedModel}
                  disabled={!modelName.trim()}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Generate Model
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Save */}
        {currentStep === 4 && generatedModel && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Review & Save Model
              </h2>
              <p className="text-dark_cyan-300 mb-6">
                Review your consolidated model and save it to your project.
              </p>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-tangerine-400 mr-2" />
                  <span className="text-white">Generating model...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="font-medium text-white mb-2">
                        Model Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-dark_cyan-300">Name:</span>
                          <span className="text-white">
                            {generatedModel.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark_cyan-300">
                            Data Sources:
                          </span>
                          <span className="text-white">
                            {generatedModel.dataSourceIds.length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark_cyan-300">
                            Relationships:
                          </span>
                          <span className="text-white">
                            {generatedModel.relationshipIds.length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark_cyan-300">
                            Total Records:
                          </span>
                          <span className="text-white">
                            {generatedModel.recordCount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark_cyan-300">
                            Total Columns:
                          </span>
                          <span className="text-white">
                            {generatedModel.metadata?.totalColumns || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-white mb-2">
                        Configuration
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-dark_cyan-300">
                            Join Strategy:
                          </span>
                          <span className="text-white capitalize">
                            {joinStrategy}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark_cyan-300">
                            Aggregation:
                          </span>
                          <span className="text-white capitalize">
                            {aggregation}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark_cyan-300">
                            Record Limit:
                          </span>
                          <span className="text-white">
                            {recordLimit || "None"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark_cyan-300">
                            Include Metadata:
                          </span>
                          <span className="text-white">
                            {includeMetadata ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => setCurrentStep(3)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Configuration
                    </Button>
                    <div className="flex gap-3">
                      <Button
                        onClick={exportModel}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export
                      </Button>
                      <Button
                        onClick={saveModel}
                        disabled={saving}
                        className="flex items-center gap-2"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {saving ? "Saving..." : "Save Model"}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
