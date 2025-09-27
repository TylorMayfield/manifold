"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Play,
  Pause,
  Clock,
  GitBranch,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Activity,
  Database,
  Code,
  Filter,
  Search,
} from "lucide-react";
import Button from "../ui/Button";
import { ETLPipelineManager } from "../../lib/services/ETLPipelineManager";
import { ETLSchedulerService } from "../../lib/services/ETLSchedulerService";
import { clientLogger } from "../../lib/utils/ClientLogger";

interface ETLManagementPageProps {
  projectId: string;
}

export default function ETLManagementPage({
  projectId,
}: ETLManagementPageProps) {
  const [activeTab, setActiveTab] = useState<
    "pipelines" | "scheduler" | "versions"
  >("pipelines");
  const [loading, setLoading] = useState(true);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [scheduledJobs, setScheduledJobs] = useState<any[]>([]);
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "paused" | "failed"
  >("all");

  const etlManager = ETLPipelineManager.getInstance();
  const etlScheduler = ETLSchedulerService.getInstance();

  useEffect(() => {
    loadETLData();
  }, [projectId]);

  const loadETLData = async () => {
    try {
      setLoading(true);

      const [pipelinesData, jobsData, statusData] = await Promise.all([
        Promise.resolve(etlManager.getAllPipelines()),
        Promise.resolve(etlScheduler.getScheduledJobs()),
        Promise.resolve(etlScheduler.getSchedulerStatus()),
      ]);

      setPipelines(pipelinesData);
      setScheduledJobs(jobsData);
      setSchedulerStatus(statusData);

      // Load execution history for all jobs
      const historyPromises = jobsData.map((job) =>
        etlScheduler.getExecutionHistory(job.id)
      );
      const allHistory = await Promise.all(historyPromises);
      setExecutionHistory(allHistory.flat());

      clientLogger.info("ETL management data loaded", "data-processing", {
        projectId,
        pipelines: pipelinesData.length,
        scheduledJobs: jobsData.length,
        executions: allHistory.flat().length,
      });
    } catch (error) {
      clientLogger.error(
        "Failed to load ETL management data",
        "data-processing",
        {
          error,
          projectId,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePipeline = async () => {
    // In a real implementation, this would open a pipeline creation modal
    clientLogger.info("Create pipeline requested", "data-processing");
  };

  const handleCreateScheduledJob = async (pipelineId: string) => {
    try {
      const jobId = await etlScheduler.createScheduledJob(
        pipelineId,
        "0 */6 * * *", // Every 6 hours
        {
          timeout: 1800,
          retries: 3,
          notifications: {
            onSuccess: true,
            onFailure: true,
            onStart: false,
          },
        }
      );

      await loadETLData();
      clientLogger.success("Scheduled job created", "data-processing", {
        jobId,
      });
    } catch (error) {
      clientLogger.error("Failed to create scheduled job", "data-processing", {
        error,
      });
    }
  };

  const handleExecuteJob = async (jobId: string) => {
    try {
      await etlScheduler.executeScheduledJob(jobId);
      await loadETLData();
      clientLogger.success("Job executed manually", "data-processing", {
        jobId,
      });
    } catch (error) {
      clientLogger.error("Failed to execute job", "data-processing", { error });
    }
  };

  const handleToggleJob = async (jobId: string, enabled: boolean) => {
    try {
      await etlScheduler.updateScheduledJob(jobId, { enabled });
      await loadETLData();
      clientLogger.success("Job status updated", "data-processing", {
        jobId,
        enabled,
      });
    } catch (error) {
      clientLogger.error("Failed to update job status", "data-processing", {
        error,
      });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (
      !window.confirm("Are you sure you want to delete this scheduled job?")
    ) {
      return;
    }

    try {
      await etlScheduler.deleteScheduledJob(jobId);
      await loadETLData();
      clientLogger.success("Scheduled job deleted", "data-processing", {
        jobId,
      });
    } catch (error) {
      clientLogger.error("Failed to delete scheduled job", "data-processing", {
        error,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "success":
        return "text-green-400 bg-green-500/20";
      case "paused":
      case "running":
        return "text-yellow-400 bg-yellow-500/20";
      case "failed":
      case "error":
        return "text-red-400 bg-red-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "paused":
        return <Pause className="h-4 w-4" />;
      case "running":
        return <Activity className="h-4 w-4" />;
      case "failed":
      case "error":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const filteredPipelines = pipelines.filter((pipeline) => {
    const matchesSearch =
      pipeline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pipeline.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || pipeline.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredJobs = scheduledJobs.filter((job) => {
    const matchesSearch = job.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" ? job.enabled : !job.enabled);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/30 border-t-white/80 mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">Loading ETL Management...</p>
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
              <Settings className="h-5 w-5 text-tangerine-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ETL Management</h1>
              <p className="text-dark_cyan-400">
                Manage ETL pipelines, scheduled jobs, and versioning
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {schedulerStatus && (
            <div
              className={`px-3 py-2 rounded-lg ${getStatusColor(
                schedulerStatus.isRunning ? "active" : "paused"
              )}`}
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(schedulerStatus.isRunning ? "active" : "paused")}
                <span className="text-sm font-medium">
                  {schedulerStatus.isRunning ? "Running" : "Stopped"}
                </span>
              </div>
            </div>
          )}

          <Button
            onClick={loadETLData}
            variant="outline"
            size="sm"
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>

          <Button
            onClick={handleCreatePipeline}
            icon={<Plus className="h-4 w-4" />}
          >
            Create Pipeline
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-6 border-b border-dark_cyan-200 border-opacity-10">
        {[
          { id: "pipelines", label: "Pipelines", icon: Database },
          { id: "scheduler", label: "Scheduler", icon: Clock },
          { id: "versions", label: "Versions", icon: GitBranch },
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

      {/* Search and Filter */}
      <div className="p-6 border-b border-dark_cyan-200 border-opacity-10">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark_cyan-400" />
            <input
              type="text"
              placeholder="Search pipelines and jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-dark_cyan-400 focus:outline-none focus:ring-2 focus:ring-tangerine-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-tangerine-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "pipelines" && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-tangerine-400" />
                ETL Pipelines
              </h2>

              {filteredPipelines.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-dark_cyan-400 mx-auto mb-4" />
                  <p className="text-dark_cyan-400">No ETL pipelines found</p>
                  <p className="text-sm text-dark_cyan-500 mt-1">
                    Create your first ETL pipeline to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPipelines.map((pipeline) => (
                    <div
                      key={pipeline.id}
                      className="p-4 rounded-lg bg-white/5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${getStatusColor(
                              pipeline.status
                            )}`}
                          >
                            {getStatusIcon(pipeline.status)}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-white">
                              {pipeline.name}
                            </h3>
                            <p className="text-xs text-dark_cyan-400">
                              {pipeline.description} • Version{" "}
                              {pipeline.version || "1.0.0"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() =>
                              handleCreateScheduledJob(pipeline.id)
                            }
                            variant="outline"
                            size="sm"
                            icon={<Clock className="h-4 w-4" />}
                          >
                            Schedule
                          </Button>
                          <Button
                            onClick={() => {}}
                            variant="outline"
                            size="sm"
                            icon={<Edit className="h-4 w-4" />}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-blue-400">
                            {pipeline.transformations.length}
                          </div>
                          <div className="text-xs text-dark_cyan-400">
                            Transformations
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-green-400">
                            {pipeline.lastRun
                              ? new Date(pipeline.lastRun).toLocaleDateString()
                              : "Never"}
                          </div>
                          <div className="text-xs text-dark_cyan-400">
                            Last Run
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-purple-400">
                            {pipeline.versionHistory?.length || 1}
                          </div>
                          <div className="text-xs text-dark_cyan-400">
                            Versions
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "scheduler" && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-tangerine-400" />
                Scheduled Jobs
              </h2>

              {schedulerStatus && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-white/5">
                    <div className="text-sm text-dark_cyan-400 mb-1">
                      Total Jobs
                    </div>
                    <div className="text-white font-medium">
                      {schedulerStatus.totalJobs}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5">
                    <div className="text-sm text-dark_cyan-400 mb-1">
                      Active Jobs
                    </div>
                    <div className="text-white font-medium">
                      {schedulerStatus.activeJobs}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5">
                    <div className="text-sm text-dark_cyan-400 mb-1">
                      Total Executions
                    </div>
                    <div className="text-white font-medium">
                      {schedulerStatus.totalExecutions}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5">
                    <div className="text-sm text-dark_cyan-400 mb-1">
                      Success Rate
                    </div>
                    <div className="text-white font-medium">
                      {schedulerStatus.successRate}%
                    </div>
                  </div>
                </div>
              )}

              {filteredJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-dark_cyan-400 mx-auto mb-4" />
                  <p className="text-dark_cyan-400">No scheduled jobs found</p>
                  <p className="text-sm text-dark_cyan-500 mt-1">
                    Schedule ETL pipelines to run automatically
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredJobs.map((job) => (
                    <div key={job.id} className="p-4 rounded-lg bg-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${getStatusColor(
                              job.enabled ? "active" : "paused"
                            )}`}
                          >
                            {getStatusIcon(job.enabled ? "active" : "paused")}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-white">
                              {job.name}
                            </h3>
                            <p className="text-xs text-dark_cyan-400">
                              Schedule: {job.schedule} • Next run:{" "}
                              {job.nextRun
                                ? new Date(job.nextRun).toLocaleString()
                                : "Not scheduled"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleExecuteJob(job.id)}
                            variant="outline"
                            size="sm"
                            icon={<Play className="h-4 w-4" />}
                          >
                            Run Now
                          </Button>
                          <Button
                            onClick={() =>
                              handleToggleJob(job.id, !job.enabled)
                            }
                            variant="outline"
                            size="sm"
                            icon={
                              job.enabled ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )
                            }
                          >
                            {job.enabled ? "Pause" : "Resume"}
                          </Button>
                          <Button
                            onClick={() => handleDeleteJob(job.id)}
                            variant="outline"
                            size="sm"
                            icon={<Trash2 className="h-4 w-4" />}
                            className="text-red-400 hover:bg-red-500/10"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-blue-400">
                            {job.runCount}
                          </div>
                          <div className="text-xs text-dark_cyan-400">
                            Total Runs
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-green-400">
                            {job.successCount}
                          </div>
                          <div className="text-xs text-dark_cyan-400">
                            Successful
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-red-400">
                            {job.failureCount}
                          </div>
                          <div className="text-xs text-dark_cyan-400">
                            Failed
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-purple-400">
                            {job.runCount > 0
                              ? Math.round(
                                  (job.successCount / job.runCount) * 100
                                )
                              : 0}
                            %
                          </div>
                          <div className="text-xs text-dark_cyan-400">
                            Success Rate
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "versions" && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-tangerine-400" />
                Pipeline Versions
              </h2>

              <div className="text-center py-8">
                <GitBranch className="h-12 w-12 text-dark_cyan-400 mx-auto mb-4" />
                <p className="text-dark_cyan-400">Pipeline versioning</p>
                <p className="text-sm text-dark_cyan-500 mt-1">
                  Track and manage different versions of your ETL pipelines
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
