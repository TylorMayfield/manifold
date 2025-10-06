"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDataSources } from "../../contexts/DataSourceContext";
import PageLayout from "../../components/layout/PageLayout";
import Button from "../../components/ui/Button";
import CellButton from "../../components/ui/CellButton";
import CellCard from "../../components/ui/CellCard";
import CellModal from "../../components/ui/CellModal";
import CellInput from "../../components/ui/CellInput";
import StatusBadge from "../../components/ui/StatusBadge";
import DefaultJobsManager from "../../components/jobs/DefaultJobsManager";
import { clientLogger } from "../../lib/utils/ClientLogger";
import {
  Play,
  Plus,
  Pause,
  Settings,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  ArrowLeft,
} from "lucide-react";

interface Job {
  id: string;
  name: string;
  description: string;
  type: "pipeline" | "script" | "sync" | "backup";
  status: "active" | "paused" | "failed" | "completed";
  schedule?: string; // cron expression
  lastRun?: Date;
  nextRun?: Date;
  duration?: number; // in milliseconds
  createdAt: Date;
  pipelineId?: string;
  dataSourceId?: string;
}

interface JobExecution {
  id: string;
  jobId: string;
  status: "running" | "completed" | "failed";
  startTime: Date;
  endTime?: Date;
  duration?: number;
  logs?: string[];
  error?: string;
}

export default function JobsPage() {
  const router = useRouter();
  const { dataSources } = useDataSources();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [selectedExecution, setSelectedExecution] =
    useState<JobExecution | null>(null);

  const filteredJobs =
    filterStatus === "all"
      ? jobs
      : jobs.filter((job) => job.status === filterStatus);

  const getStatusIcon = (status: Job["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "paused":
        return <Pause className="w-4 h-4 text-yellow-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: Job["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: Job["type"]) => {
    switch (type) {
      case "pipeline":
        return "⚡";
      case "script":
        return "📜";
      case "sync":
        return "🔄";
      case "backup":
        return "💾";
      default:
        return "⚙️";
    }
  };

  const handleRunJob = (jobId: string) => {
    clientLogger.info("Manual job execution triggered", "job-management", { jobId });
    // Implementation would trigger job execution
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  const parseCronExpression = (cron: string) => {
    // Simple cron parser for display
    if (cron === "0 2 * * *") return "Daily at 2:00 AM";
    if (cron === "0 9 * * 1") return "Weekly on Monday at 9:00 AM";
    if (cron === "0 */6 * * *") return "Every 6 hours";
    return cron;
  };

  return (
    <PageLayout
      title="Scheduled Jobs"
      subtitle="Define WHEN to execute • Automate pipelines, syncs, and backups with schedules"
      icon={Play}
      showNavigation={true}
      showBackButton={true}
      backButtonHref="/"
      headerActions={
        <div className="flex items-center space-x-2">
          <CellButton
            variant="accent"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Job
          </CellButton>
          <CellButton variant="secondary" size="sm">
            <Settings className="w-4 h-4" />
          </CellButton>
        </div>
      }
    >

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <CellCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-bold text-gray-600">Total Jobs</p>
              <p className="text-heading font-mono text-gray-900">{jobs.length}</p>
            </div>
            <Play className="w-8 h-8 text-blue-500" />
          </div>
        </CellCard>
        <CellCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-bold text-gray-400">Active</p>
              <p className="text-heading font-mono text-green-400">
                {jobs.filter((j) => j.status === "active").length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </CellCard>
        <CellCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-bold text-gray-400">Failed</p>
              <p className="text-heading font-mono text-red-400">
                {jobs.filter((j) => j.status === "failed").length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </CellCard>
        <CellCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-bold text-gray-600">Last 24h Runs</p>
              <p className="text-heading font-mono text-gray-900">{executions.length}</p>
            </div>
            <RefreshCw className="w-8 h-8 text-blue-500" />
          </div>
        </CellCard>
      </div>

      {/* System Jobs */}
      <div className="mb-6">
        <DefaultJobsManager />
      </div>

      {/* Filters */}
      <div className="mb-6">
        <CellCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Filter className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-mono font-bold text-gray-900">
                Filter by status:
              </span>
              <div className="flex space-x-2">
                {["all", "active", "paused", "failed", "completed"].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1 text-xs font-mono border-2 rounded transition-all ${
                        filterStatus === status
                          ? "bg-blue-500 text-white border-blue-600 shadow-[2px_2px_0px_0px_rgba(59,130,246,0.3)]"
                          : "bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      {status === "all"
                        ? "All"
                        : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  )
                )}
              </div>
            </div>
            <div className="text-sm text-gray-400 font-mono">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""}
            </div>
          </div>
        </CellCard>
      </div>

      {/* Job List */}
      {filteredJobs.length === 0 ? (
        <CellCard className="p-12">
          <div className="text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h2 className="text-subheading mb-2 text-gray-900 font-mono">
              {filterStatus === "all"
                ? "No jobs scheduled"
                : `No ${filterStatus} jobs`}
            </h2>
            <p className="text-caption text-gray-600 mb-4 max-w-2xl mx-auto">
              Jobs define WHEN to execute automation tasks. Schedule pipelines to run automatically, 
              sync data sources on intervals, or trigger backups. Think of jobs as your automation 
              calendar - they handle the scheduling while pipelines handle the transformation logic.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
              <p className="text-sm text-blue-900 font-mono">
                💡 <strong>Tip:</strong> Create a Pipeline first (define HOW), then create a Job to automate it (define WHEN).
              </p>
            </div>
            <CellButton
              variant="accent"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Your First Job
            </CellButton>
          </div>
        </CellCard>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <CellCard key={job.id} className="p-6 hover:border-blue-500 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="p-2 border-2 border-gray-700 bg-gray-800 rounded">
                    <span className="text-lg">{getTypeIcon(job.type)}</span>
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-lg text-white">{job.name}</h3>
                    <p className="text-caption text-gray-400">
                      {job.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <StatusBadge status={job.status} label={job.status} />
                  <div className="flex space-x-1">
                    <CellButton
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRunJob(job.id)}
                    >
                      <Play className="w-4 h-4" />
                    </CellButton>
                    <CellButton
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const execution = executions.find(
                          (e) => e.jobId === job.id
                        );
                        if (execution) {
                          setSelectedExecution(execution);
                          setShowExecutionModal(true);
                        }
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </CellButton>
                    <CellButton size="sm" variant="secondary">
                      <Settings className="w-4 h-4" />
                    </CellButton>
                    <CellButton size="sm" variant="danger">
                      <Trash2 className="w-4 h-4" />
                    </CellButton>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div>
                  <h4 className="font-mono font-bold text-sm mb-2 text-white">Schedule</h4>
                  <div className="p-3 border-2 border-gray-700 bg-gray-800 rounded">
                    <div className="flex items-center mb-1">
                      <Calendar className="w-4 h-4 mr-2 text-blue-400" />
                      <span className="text-sm font-mono text-gray-300">
                        {job.schedule
                          ? parseCronExpression(job.schedule)
                          : "Manual only"}
                      </span>
                    </div>
                    {job.nextRun && (
                      <p className="text-xs text-gray-500">
                        Next: {job.nextRun.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-mono font-bold text-sm mb-2 text-white">
                    Last Execution
                  </h4>
                  <div className="p-3 border-2 border-gray-700 bg-gray-800 rounded">
                    {job.lastRun ? (
                      <>
                        <p className="text-sm font-mono text-gray-300">
                          {job.lastRun.toLocaleString()}
                        </p>
                        {job.duration && (
                          <p className="text-xs text-gray-500">
                            Duration: {formatDuration(job.duration)}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">Never run</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-mono font-bold text-sm mb-2 text-white">
                    Type & Target
                  </h4>
                  <div className="p-3 border-2 border-gray-700 bg-gray-800 rounded">
                    <p className="text-sm font-mono capitalize text-gray-300">{job.type}</p>
                    <p className="text-xs text-gray-500">
                      {job.pipelineId && "Pipeline ID: " + job.pipelineId}
                      {job.dataSourceId &&
                        "Data Source ID: " + job.dataSourceId}
                      {!job.pipelineId && !job.dataSourceId && "Custom script"}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-mono font-bold text-sm mb-2 text-white">
                    Performance
                  </h4>
                  <div className="p-3 border-2 border-gray-700 bg-gray-800 rounded">
                    <StatusBadge 
                      status={job.status} 
                      label={
                        job.status === "active"
                          ? "Healthy"
                          : job.status === "failed"
                          ? "Requires attention"
                          : "Monitor"
                      }
                    />
                  </div>
                </div>
              </div>
            </CellCard>
          ))}
        </div>
      )}

      {/* Create Job Modal */}
      <CellModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Schedule New Job"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <CellInput
              label="Job Name"
              placeholder="e.g., Daily Customer Sync"
            />
          </div>
          <div>
            <CellInput
              label="Description"
              placeholder="What does this job do?"
            />
          </div>
          <div>
            <label className="block text-sm font-mono font-bold mb-2">
              Job Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["pipeline", "script", "sync", "backup"].map((type) => (
                <label
                  key={type}
                  className="flex items-center p-3 border border-gray-200 cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="jobType"
                    value={type}
                    className="mr-3"
                  />
                  <span className="text-lg mr-2">
                    {getTypeIcon(type as Job["type"])}
                  </span>
                  <span className="font-mono text-sm capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <CellInput
              label="Schedule (Cron Expression)"
              placeholder="0 2 * * * (Daily at 2 AM)"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <CellButton
              variant="ghost"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </CellButton>
            <CellButton variant="primary">Schedule Job</CellButton>
          </div>
        </div>
      </CellModal>

      {/* Execution Details Modal */}
      <CellModal
        isOpen={showExecutionModal}
        onClose={() => setShowExecutionModal(false)}
        title="Job Execution Details"
        size="lg"
      >
        {selectedExecution && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-mono font-bold mb-1">
                  Status
                </label>
                <div
                  className={`px-3 py-2 text-sm font-mono ${getStatusColor(
                    selectedExecution.status as any
                  )}`}
                >
                  {selectedExecution.status}
                </div>
              </div>
              <div>
                <label className="block text-sm font-mono font-bold mb-1">
                  Duration
                </label>
                <div className="px-3 py-2 bg-gray-100 text-sm font-mono">
                  {selectedExecution.duration
                    ? formatDuration(selectedExecution.duration)
                    : "N/A"}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-mono font-bold mb-2">
                Execution Timeline
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200">
                <p className="text-sm">
                  <strong>Started:</strong>{" "}
                  {selectedExecution.startTime.toLocaleString()}
                </p>
                {selectedExecution.endTime && (
                  <p className="text-sm">
                    <strong>Finished:</strong>{" "}
                    {selectedExecution.endTime.toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {selectedExecution.error && (
              <div>
                <label className="block text-sm font-mono font-bold mb-2 text-red-600">
                  Error
                </label>
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 font-mono text-sm">
                  {selectedExecution.error}
                </div>
              </div>
            )}

            {selectedExecution.logs && (
              <div>
                <label className="block text-sm font-mono font-bold mb-2">
                  Execution Logs
                </label>
                <div className="p-3 bg-black text-green-400 font-mono text-sm max-h-60 overflow-y-auto">
                  {selectedExecution.logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      <span className="text-gray-500">
                        [{selectedExecution.startTime.toLocaleTimeString()}]
                      </span>{" "}
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <CellButton
                variant="ghost"
                onClick={() => setShowExecutionModal(false)}
              >
                Close
              </CellButton>
            </div>
          </div>
        )}
      </CellModal>
    </PageLayout>
  );
}
