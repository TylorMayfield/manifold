"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  Link,
  Settings,
  Play,
  Save,
  Download,
  Upload,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { clientLogger } from "../../lib/utils/ClientLogger";
import { DataSource, Relationship, ConsolidatedModel } from "../../types";
import { DatabaseService } from "../../lib/services/DatabaseService";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface ConsolidatedModelBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  dataSources: DataSource[];
  projectId: string;
}

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
  confidence: number;
  type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
}

export default function ConsolidatedModelBuilder({
  isOpen,
  onClose,
  dataSources,
  projectId,
}: ConsolidatedModelBuilderProps) {
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedModel, setGeneratedModel] =
    useState<ConsolidatedModel | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [joinStrategy, setJoinStrategy] = useState("inner");
  const [aggregation, setAggregation] = useState("none");
  const [recordLimit, setRecordLimit] = useState<number | null>(null);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [customSqlQuery, setCustomSqlQuery] = useState("");

  const dbService = DatabaseService.getInstance();

  useEffect(() => {
    if (isOpen && dataSources.length > 0) {
      loadDataSourcePreviews();
    }
  }, [isOpen, dataSources]);

  const loadDataSourcePreviews = async () => {
    setLoading(true);
    try {
      const previews: DataSourcePreview[] = dataSources.map((ds) => ({
        id: ds.id,
        name: ds.name,
        type: ds.type,
        columns: (ds.config.mockConfig?.schema?.columns || []).map((col) => ({
          ...col,
          unique: col.unique ?? false,
        })),
        recordCount: ds.config.mockConfig?.recordCount || 0,
        selected: false,
      }));
      setDataSourcePreviews(previews);

      // Auto-select all data sources
      setSelectedDataSources(previews.map((p) => p.id));

      clientLogger.info(
        "Data source previews loaded",
        "data-processing",
        {
          count: previews.length,
          projectId,
        },
        "ConsolidatedModelBuilder"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to load data source previews",
        "data-processing",
        { error },
        "ConsolidatedModelBuilder"
      );
    } finally {
      setLoading(false);
    }
  };

  const analyzeRelationships = async () => {
    if (selectedDataSources.length < 2) return;

    setLoading(true);
    try {
      // Simulate relationship analysis
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const suggestions: RelationshipSuggestion[] = [];
      const selectedPreviews = dataSourcePreviews.filter((p) =>
        selectedDataSources.includes(p.id)
      );

      // Generate relationship suggestions based on column names and types
      for (let i = 0; i < selectedPreviews.length; i++) {
        for (let j = i + 1; j < selectedPreviews.length; j++) {
          const source = selectedPreviews[i];
          const target = selectedPreviews[j];

          // Look for common column patterns
          source.columns.forEach((sourceCol) => {
            target.columns.forEach((targetCol) => {
              if (sourceCol.type === targetCol.type) {
                // Check for ID patterns
                if (
                  sourceCol.name.toLowerCase().includes("id") &&
                  targetCol.name.toLowerCase().includes("id") &&
                  sourceCol.name !== targetCol.name
                ) {
                  suggestions.push({
                    id: `rel_${source.id}_${target.id}_${sourceCol.name}_${targetCol.name}`,
                    sourceTable: source.name,
                    sourceColumn: sourceCol.name,
                    targetTable: target.name,
                    targetColumn: targetCol.name,
                    confidence: 0.85,
                    type: "many-to-one",
                  });
                }
                // Check for name patterns
                else if (
                  sourceCol.name.toLowerCase() ===
                    targetCol.name.toLowerCase() &&
                  sourceCol.type === targetCol.type
                ) {
                  suggestions.push({
                    id: `rel_${source.id}_${target.id}_${sourceCol.name}_${targetCol.name}`,
                    sourceTable: source.name,
                    sourceColumn: sourceCol.name,
                    targetTable: target.name,
                    targetColumn: targetCol.name,
                    confidence: 0.75,
                    type: "one-to-one",
                  });
                }
              }
            });
          });
        }
      }

      setRelationships(suggestions);
      setSelectedRelationships(suggestions.map((r) => r.id)); // Auto-select all

      clientLogger.success(
        "Relationship analysis completed",
        "data-processing",
        {
          suggestionsCount: suggestions.length,
          selectedSources: selectedDataSources.length,
        },
        "ConsolidatedModelBuilder"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to analyze relationships",
        "data-processing",
        { error },
        "ConsolidatedModelBuilder"
      );
    } finally {
      setLoading(false);
    }
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
          // Advanced options
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

      clientLogger.success(
        "Consolidated model generated",
        "data-processing",
        {
          modelId: model.id,
          modelName: model.name,
          dataSources: selectedDataSources.length,
          relationships: selectedRels.length,
        },
        "ConsolidatedModelBuilder"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to generate consolidated model",
        "data-processing",
        { error },
        "ConsolidatedModelBuilder"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleDataSource = (dataSourceId: string) => {
    setSelectedDataSources((prev) =>
      prev.includes(dataSourceId)
        ? prev.filter((id) => id !== dataSourceId)
        : [...prev, dataSourceId]
    );
  };

  const toggleRelationship = (relationshipId: string) => {
    setSelectedRelationships((prev) =>
      prev.includes(relationshipId)
        ? prev.filter((id) => id !== relationshipId)
        : [...prev, relationshipId]
    );
  };

  const saveModel = async () => {
    if (!generatedModel) return;

    setSaving(true);
    try {
      await dbService.createConsolidatedModel(generatedModel);

      clientLogger.success(
        "Model saved to database",
        "data-processing",
        { modelId: generatedModel.id, modelName: generatedModel.name },
        "ConsolidatedModelBuilder"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to save model",
        "data-processing",
        { error, modelId: generatedModel.id },
        "ConsolidatedModelBuilder"
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
      };

      const blob = new Blob([JSON.stringify(modelData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${modelName || "consolidated_model"}_${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      clientLogger.success(
        "Model exported",
        "data-processing",
        { modelId: generatedModel.id },
        "ConsolidatedModelBuilder"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to export model",
        "data-processing",
        { error },
        "ConsolidatedModelBuilder"
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Build Consolidated Model"
      size="xl"
    >
      <div className="space-y-6">
        {/* Model Configuration */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-white font-medium mb-4">Model Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Model Name
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g., Customer Analytics Model"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => setShowAdvanced(!showAdvanced)}
                variant="outline"
                className="w-full"
              >
                <Settings className="h-4 w-4 mr-2" />
                {showAdvanced ? "Hide" : "Show"} Advanced Options
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-white font-medium mb-4">Advanced Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Join Strategy
                </label>
                <select
                  value={joinStrategy}
                  onChange={(e) => setJoinStrategy(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="inner">Inner Join</option>
                  <option value="left">Left Join</option>
                  <option value="right">Right Join</option>
                  <option value="full">Full Outer Join</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Data Aggregation
                </label>
                <select
                  value={aggregation}
                  onChange={(e) => setAggregation(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  Record Limit
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
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Include Metadata
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={includeMetadata}
                    onChange={(e) => setIncludeMetadata(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <span className="text-white/70 text-sm">
                    Include creation timestamps
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-white/70 mb-2">
                Custom SQL Query (Optional)
              </label>
              <textarea
                value={customSqlQuery}
                onChange={(e) => setCustomSqlQuery(e.target.value)}
                placeholder="-- Enter custom SQL query for data transformation&#10;-- Example: SELECT * FROM source1 s1&#10;-- INNER JOIN source2 s2 ON s1.id = s2.source_id"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Data Sources Selection */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">Select Data Sources</h3>
            <span className="text-white/60 text-sm">
              {selectedDataSources.length} of {dataSourcePreviews.length}{" "}
              selected
            </span>
          </div>

          {loading && dataSourcePreviews.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400 mr-2" />
              <span className="text-white/60">Loading data sources...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dataSourcePreviews.map((preview) => (
                <div
                  key={preview.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedDataSources.includes(preview.id)
                      ? "border-blue-500/50 bg-blue-500/10"
                      : "border-white/20 bg-white/5 hover:bg-white/10"
                  }`}
                  onClick={() => toggleDataSource(preview.id)}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <Database className="h-5 w-5 text-blue-400" />
                    <div>
                      <h4 className="text-white font-medium text-sm">
                        {preview.name}
                      </h4>
                      <p className="text-white/60 text-xs">{preview.type}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-white/60 text-xs">
                      {preview.columns.length} columns •{" "}
                      {preview.recordCount.toLocaleString()} records
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {preview.columns.slice(0, 3).map((col, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 rounded text-xs bg-white/10 text-white/70"
                        >
                          {col.name}
                        </span>
                      ))}
                      {preview.columns.length > 3 && (
                        <span className="px-2 py-1 rounded text-xs bg-white/10 text-white/50">
                          +{preview.columns.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Relationship Analysis */}
        {selectedDataSources.length >= 2 && (
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Relationship Analysis</h3>
              <Button
                onClick={analyzeRelationships}
                loading={loading}
                disabled={selectedDataSources.length < 2}
              >
                <Link className="h-4 w-4 mr-2" />
                Analyze Relationships
              </Button>
            </div>

            {relationships.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">
                    {selectedRelationships.length} of {relationships.length}{" "}
                    relationships selected
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setSelectedRelationships(relationships.map((r) => r.id))
                      }
                    >
                      Select All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedRelationships([])}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {relationships.map((rel) => (
                    <div
                      key={rel.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedRelationships.includes(rel.id)
                          ? "border-green-500/50 bg-green-500/10"
                          : "border-white/20 bg-white/5 hover:bg-white/10"
                      }`}
                      onClick={() => toggleRelationship(rel.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <ArrowRight className="h-4 w-4 text-white/60" />
                          <div>
                            <p className="text-white text-sm">
                              {rel.sourceTable}.{rel.sourceColumn} →{" "}
                              {rel.targetTable}.{rel.targetColumn}
                            </p>
                            <p className="text-white/60 text-xs">
                              {rel.type} • {Math.round(rel.confidence * 100)}%
                              confidence
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              rel.confidence > 0.8
                                ? "bg-green-400"
                                : rel.confidence > 0.6
                                ? "bg-yellow-400"
                                : "bg-red-400"
                            }`}
                          />
                          {selectedRelationships.includes(rel.id) ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <div className="w-4 h-4 border border-white/30 rounded" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generate Model */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-medium">
                Generate Consolidated Model
              </h3>
              <p className="text-white/60 text-sm">
                Combine selected data sources and relationships into a unified
                model
              </p>
            </div>
            <Button
              onClick={generateConsolidatedModel}
              loading={loading}
              disabled={selectedDataSources.length === 0 || !modelName.trim()}
            >
              <Play className="h-4 w-4 mr-2" />
              Generate Model
            </Button>
          </div>

          {generatedModel && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <h4 className="text-white font-medium">
                  Model Generated Successfully!
                </h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-white/60">Model Name</p>
                  <p className="text-white">{generatedModel.name}</p>
                </div>
                <div>
                  <p className="text-white/60">Data Sources</p>
                  <p className="text-white">
                    {generatedModel.dataSourceIds.length}
                  </p>
                </div>
                <div>
                  <p className="text-white/60">Relationships</p>
                  <p className="text-white">
                    {generatedModel.relationshipIds.length}
                  </p>
                </div>
                <div>
                  <p className="text-white/60">Total Records</p>
                  <p className="text-white">
                    {generatedModel.recordCount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Advanced Options Summary */}
              {generatedModel.metadata && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h5 className="text-blue-400 font-medium text-sm mb-2">
                    Advanced Options Applied
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-white/60">Join Strategy:</span>
                      <span className="text-white ml-1 capitalize">
                        {generatedModel.metadata.joinStrategy || "inner"}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/60">Aggregation:</span>
                      <span className="text-white ml-1 capitalize">
                        {generatedModel.metadata.aggregation || "none"}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/60">Record Limit:</span>
                      <span className="text-white ml-1">
                        {generatedModel.metadata.recordLimit || "No limit"}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/60">Metadata:</span>
                      <span className="text-white ml-1">
                        {generatedModel.metadata.includeMetadata
                          ? "Included"
                          : "Excluded"}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-white/60">Custom SQL:</span>
                      <span className="text-white ml-1">
                        {generatedModel.metadata.customSqlQuery
                          ? "Applied"
                          : "None"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 mt-4">
                <Button onClick={exportModel} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Model
                </Button>
                <Button onClick={saveModel} loading={saving} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Model
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
