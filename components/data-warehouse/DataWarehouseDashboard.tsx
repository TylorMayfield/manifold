"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  BarChart3,
  GitBranch,
  Shield,
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  Filter,
  Search,
  RefreshCw,
} from "lucide-react";
import Button from "../ui/Button";
import { DataWarehouseIntegrationService } from "../../lib/services/DataWarehouseIntegrationService";
import { DataQualityFramework } from "../../lib/services/DataQualityFramework";
import { DataLineageTracker } from "../../lib/services/DataLineageTracker";
import { DataCatalogService } from "../../lib/services/DataCatalogService";
import { ETLPipelineManager } from "../../lib/services/ETLPipelineManager";
import { ETLSchedulerService } from "../../lib/services/ETLSchedulerService";
import { SchemaEvolutionManager } from "../../lib/services/SchemaEvolutionManager";
import { clientLogger } from "../../lib/utils/ClientLogger";

interface DataWarehouseDashboardProps {
  projectId: string;
}

export default function DataWarehouseDashboard({
  projectId,
}: DataWarehouseDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "quality" | "lineage" | "catalog" | "etl" | "schema"
  >("overview");
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [qualityProfiles, setQualityProfiles] = useState<any[]>([]);
  const [lineageNodes, setLineageNodes] = useState<any[]>([]);
  const [catalogEntries, setCatalogEntries] = useState<any[]>([]);
  const [etlPipelines, setEtlPipelines] = useState<any[]>([]);
  const [schemaVersions, setSchemaVersions] = useState<any[]>([]);

  const integrationService = DataWarehouseIntegrationService.getInstance();
  const qualityFramework = DataQualityFramework.getInstance();
  const lineageTracker = DataLineageTracker.getInstance();
  const catalogService = DataCatalogService.getInstance();
  const etlManager = ETLPipelineManager.getInstance();
  const etlScheduler = ETLSchedulerService.getInstance();
  const schemaManager = SchemaEvolutionManager.getInstance();

  useEffect(() => {
    loadDashboardData();
  }, [projectId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [health, quality, lineage, catalog, etl, scheduledJobs, schema] =
        await Promise.all([
          integrationService.getHealthStatus(),
          Promise.resolve(qualityFramework.getAllProfiles()),
          Promise.resolve(lineageTracker.getAllNodes()),
          Promise.resolve(catalogService.getAllEntries()),
          Promise.resolve(etlManager.getAllPipelines()),
          Promise.resolve(etlScheduler.getScheduledJobs()),
          Promise.resolve([]), // Schema versions would need project-specific filtering
        ]);

      setHealthStatus(health);
      setQualityProfiles(quality);
      setLineageNodes(lineage);
      setCatalogEntries(catalog);
      setEtlPipelines(etl);
      setSchemaVersions(schema);

      clientLogger.info("Data warehouse dashboard data loaded", "database", {
        projectId,
        healthStatus: health.status,
        qualityProfiles: quality.length,
        lineageNodes: lineage.length,
        catalogEntries: catalog.length,
        etlPipelines: etl.length,
        scheduledJobs: scheduledJobs.length,
      });
    } catch (error) {
      clientLogger.error(
        "Failed to load data warehouse dashboard",
        "database",
        {
          error,
          projectId,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-400 bg-green-500/20";
      case "degraded":
        return "text-yellow-400 bg-yellow-500/20";
      case "unhealthy":
        return "text-red-400 bg-red-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/30 border-t-white/80 mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">
            Loading Data Warehouse Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-dark_cyan-200 border-opacity-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-tangerine-500/20">
              <Database className="h-5 w-5 text-tangerine-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Data Warehouse</h1>
              <p className="text-dark_cyan-400">
                Comprehensive data management and analytics platform
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-2 rounded-lg ${getStatusColor(
              healthStatus?.status || "unknown"
            )}`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  healthStatus?.status === "healthy"
                    ? "bg-green-400"
                    : healthStatus?.status === "degraded"
                    ? "bg-yellow-400"
                    : "bg-red-400"
                }`}
              />
              <span className="text-sm font-medium">
                {healthStatus?.status || "Unknown"}
              </span>
            </div>
          </div>

          <Button
            onClick={loadDashboardData}
            variant="outline"
            size="sm"
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-6 border-b border-dark_cyan-200 border-opacity-10">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "quality", label: "Data Quality", icon: Shield },
          { id: "lineage", label: "Lineage", icon: GitBranch },
          { id: "catalog", label: "Catalog", icon: Database },
          { id: "etl", label: "ETL Pipelines", icon: Settings },
          { id: "schema", label: "Schema", icon: Activity },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id
                ? "bg-tangerine-500/20 text-tangerine-400"
                : "text-dark_cyan-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Health Status */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-tangerine-400" />
                System Health
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthStatus?.components &&
                  Object.entries(healthStatus.components).map(
                    ([component, status]: [string, any]) => (
                      <div
                        key={component}
                        className="p-4 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white capitalize">
                            {component.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          <div
                            className={`w-2 h-2 rounded-full ${
                              status.status === "healthy"
                                ? "bg-green-400"
                                : status.status === "degraded"
                                ? "bg-yellow-400"
                                : "bg-red-400"
                            }`}
                          />
                        </div>
                        <p className="text-xs text-dark_cyan-400">
                          {status.message}
                        </p>
                      </div>
                    )
                  )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Shield className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      Data Quality
                    </h3>
                    <p className="text-xs text-dark_cyan-400">
                      Monitored Sources
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">
                  {qualityProfiles.length}
                </div>
                <div className="text-xs text-dark_cyan-400 mt-1">
                  Avg Score:{" "}
                  {qualityProfiles.length > 0
                    ? Math.round(
                        qualityProfiles.reduce(
                          (sum, p) => sum + p.qualityScore,
                          0
                        ) / qualityProfiles.length
                      )
                    : 0}
                  %
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <GitBranch className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      Data Lineage
                    </h3>
                    <p className="text-xs text-dark_cyan-400">Tracked Nodes</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">
                  {lineageNodes.length}
                </div>
                <div className="text-xs text-dark_cyan-400 mt-1">
                  {lineageNodes.filter((n) => n.type === "data_source").length}{" "}
                  sources
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Database className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      Data Catalog
                    </h3>
                    <p className="text-xs text-dark_cyan-400">
                      Cataloged Assets
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">
                  {catalogEntries.length}
                </div>
                <div className="text-xs text-dark_cyan-400 mt-1">
                  {catalogEntries.filter((e) => e.type === "table").length}{" "}
                  tables
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Settings className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      ETL Pipelines
                    </h3>
                    <p className="text-xs text-dark_cyan-400">
                      Active Pipelines
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">
                  {etlPipelines.length}
                </div>
                <div className="text-xs text-dark_cyan-400 mt-1">
                  {etlPipelines.filter((p) => p.status === "active").length}{" "}
                  active • 0 scheduled
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "quality" && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-tangerine-400" />
                Data Quality Profiles
              </h2>

              {qualityProfiles.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-dark_cyan-400 mx-auto mb-4" />
                  <p className="text-dark_cyan-400">
                    No data quality profiles found
                  </p>
                  <p className="text-sm text-dark_cyan-500 mt-1">
                    Quality checks will be created automatically when data
                    sources are imported
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {qualityProfiles.map((profile) => (
                    <div
                      key={profile.dataSourceId}
                      className="p-4 rounded-lg bg-white/5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-medium text-white">
                            Data Source: {profile.dataSourceId}
                          </h3>
                          <p className="text-xs text-dark_cyan-400">
                            {profile.totalRecords} records • Last checked:{" "}
                            {new Date(profile.lastChecked).toLocaleString()}
                          </p>
                        </div>
                        <div
                          className={`text-2xl font-bold ${getQualityScoreColor(
                            profile.qualityScore
                          )}`}
                        >
                          {profile.qualityScore}%
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-red-400">
                            {profile.summary.errors}
                          </div>
                          <div className="text-xs text-dark_cyan-400">
                            Errors
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-yellow-400">
                            {profile.summary.warnings}
                          </div>
                          <div className="text-xs text-dark_cyan-400">
                            Warnings
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-blue-400">
                            {profile.summary.info}
                          </div>
                          <div className="text-xs text-dark_cyan-400">Info</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "lineage" && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-tangerine-400" />
                Data Lineage
              </h2>

              {lineageNodes.length === 0 ? (
                <div className="text-center py-8">
                  <GitBranch className="h-12 w-12 text-dark_cyan-400 mx-auto mb-4" />
                  <p className="text-dark_cyan-400">No lineage data found</p>
                  <p className="text-sm text-dark_cyan-500 mt-1">
                    Lineage tracking will be created automatically when data
                    sources are connected
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lineageNodes.map((node) => (
                    <div key={node.id} className="p-4 rounded-lg bg-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              node.type === "data_source"
                                ? "bg-blue-500/20"
                                : node.type === "transformation"
                                ? "bg-green-500/20"
                                : node.type === "consolidated_model"
                                ? "bg-purple-500/20"
                                : "bg-gray-500/20"
                            }`}
                          >
                            <Database className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-white">
                              {node.name}
                            </h3>
                            <p className="text-xs text-dark_cyan-400 capitalize">
                              {node.type.replace("_", " ")} •{" "}
                              {node.metadata?.recordCount || 0} records
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-dark_cyan-400">
                          {new Date(node.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "catalog" && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-tangerine-400" />
                Data Catalog
              </h2>

              {catalogEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-dark_cyan-400 mx-auto mb-4" />
                  <p className="text-dark_cyan-400">No catalog entries found</p>
                  <p className="text-sm text-dark_cyan-500 mt-1">
                    Catalog entries will be created automatically when data
                    sources are imported
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {catalogEntries.map((entry) => (
                    <div key={entry.id} className="p-4 rounded-lg bg-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-medium text-white">
                            {entry.name}
                          </h3>
                          <p className="text-xs text-dark_cyan-400">
                            {entry.type} • {entry.schema.statistics.totalRows}{" "}
                            rows • {entry.schema.statistics.totalColumns}{" "}
                            columns
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-dark_cyan-400">
                            Quality: {entry.quality.score}%
                          </span>
                          <div
                            className={`w-2 h-2 rounded-full ${
                              entry.quality.score >= 90
                                ? "bg-green-400"
                                : entry.quality.score >= 70
                                ? "bg-yellow-400"
                                : "bg-red-400"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {entry.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-white/10 rounded text-dark_cyan-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "etl" && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-tangerine-400" />
                ETL Pipelines
              </h2>

              {etlPipelines.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-dark_cyan-400 mx-auto mb-4" />
                  <p className="text-dark_cyan-400">No ETL pipelines found</p>
                  <p className="text-sm text-dark_cyan-500 mt-1">
                    ETL pipelines can be created to automate data
                    transformations
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {etlPipelines.map((pipeline) => (
                    <div
                      key={pipeline.id}
                      className="p-4 rounded-lg bg-white/5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-medium text-white">
                            {pipeline.name}
                          </h3>
                          <p className="text-xs text-dark_cyan-400">
                            {pipeline.description} •{" "}
                            {pipeline.transformations.length} transformations
                          </p>
                        </div>
                        <div
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            pipeline.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : pipeline.status === "paused"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {pipeline.status}
                        </div>
                      </div>

                      <div className="text-xs text-dark_cyan-400">
                        Schedule: {pipeline.schedule || "Manual"} • Last run:{" "}
                        {pipeline.lastRun
                          ? new Date(pipeline.lastRun).toLocaleString()
                          : "Never"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "schema" && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-tangerine-400" />
                Schema Evolution
              </h2>

              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-dark_cyan-400 mx-auto mb-4" />
                <p className="text-dark_cyan-400">Schema evolution tracking</p>
                <p className="text-sm text-dark_cyan-500 mt-1">
                  Schema versions and migrations will be tracked automatically
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
