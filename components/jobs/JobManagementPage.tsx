"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Play,
  Pause,
  Square,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Zap,
  Database,
  Code,
  Cloud,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Search,
  ArrowLeft,
} from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
// import {
//   JobScheduler,
//   CronJob,
//   JobExecution,
// } from "../../lib/services/JobScheduler"; // Moved to server-side
import { clientLogger } from "../../lib/utils/ClientLogger";
import { DataWarehouseIntegrationService } from "../../lib/services/DataWarehouseIntegrationService";

// Mock types for client-side
interface CronJob {
  id: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  type?: string;
  status?: string;
  lastRun?: Date;
  nextRun?: Date;
  config?: any;
  projectId?: string;
  dataSourceId?: string;
  workflowId?: string;
  createdBy?: string;
}

interface JobExecution {
  id: string;
  jobId: string;
  status: string;
  startTime: Date;
  endTime?: Date;
  result?: any;
  duration?: number;
  progress?: number;
  currentStep?: string;
  error?: string | null;
  logs?: any[];
}

export default function JobManagementPage() {
  // const [scheduler] = useState(() => JobScheduler.getInstance()); // Moved to server-side
  const dataWarehouseIntegration =
    DataWarehouseIntegrationService.getInstance();
  const [scheduler] = useState(() => ({
    // Mock scheduler for client-side
    start: async () => {},
    stop: async () => {},
    scheduleJob: () => {},
    cancelJob: () => {},
    getJobs: () => [],
    getExecutions: () => [],
    getAllJobs: () => {
      // Return built-in system jobs
      return [
        {
          id: "system_auto_backup",
          name: "Auto Backup",
          description: "Automatically backup all projects and data sources",
          schedule: "0 2 * * *", // Daily at 2 AM
          enabled: true,
          type: "backup",
          config: {
            timeout: 1800, // 30 minutes
            retries: 2,
            notifications: {
              onSuccess: true,
              onFailure: true,
              onStart: false,
            },
            backupType: "full",
            retentionDays: 30,
          },
          status: "active",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          updatedAt: new Date(),
          nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        },
        {
          id: "system_log_purge",
          name: "Log Purging",
          description: "Clean up old log files and execution history",
          schedule: "0 3 * * 0", // Weekly on Sunday at 3 AM
          enabled: true,
          type: "cleanup",
          config: {
            timeout: 600, // 10 minutes
            retries: 1,
            notifications: {
              onSuccess: false,
              onFailure: true,
              onStart: false,
            },
            retentionDays: 90,
            purgeTypes: ["logs", "execution_history", "temp_files"],
          },
          status: "active",
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
          updatedAt: new Date(),
          nextRun: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        },
        {
          id: "system_data_validation",
          name: "Data Validation",
          description: "Validate data integrity across all projects",
          schedule: "0 1 * * 1", // Weekly on Monday at 1 AM
          enabled: true,
          type: "data_sync",
          config: {
            timeout: 1200, // 20 minutes
            retries: 2,
            notifications: {
              onSuccess: true,
              onFailure: true,
              onStart: false,
            },
            validationChecks: ["integrity", "consistency", "orphaned_records"],
          },
          status: "active",
          createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
          updatedAt: new Date(),
          nextRun: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        },
        {
          id: "system_performance_cleanup",
          name: "Performance Cleanup",
          description:
            "Clean up temporary files and optimize database performance",
          schedule: "0 4 * * 0", // Weekly on Sunday at 4 AM
          enabled: true,
          type: "cleanup",
          config: {
            timeout: 900, // 15 minutes
            retries: 1,
            notifications: {
              onSuccess: false,
              onFailure: true,
              onStart: false,
            },
            cleanupTypes: ["temp_files", "cache", "database_vacuum"],
          },
          status: "active",
          createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), // 28 days ago
          updatedAt: new Date(),
          nextRun: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        },
      ];
    },
    getJobExecutions: () => {
      // Return mock execution history
      return [
        {
          id: "exec_1",
          jobId: "system_auto_backup",
          status: "completed",
          startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          endTime: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000
          ),
          duration: 25 * 60 * 1000,
          recordsProcessed: 0,
          recordsFailed: 0,
          error: null,
          metrics: { backupSize: "2.1GB", filesBackedUp: 156 },
        },
        {
          id: "exec_2",
          jobId: "system_log_purge",
          status: "completed",
          startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endTime: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000
          ),
          duration: 8 * 60 * 1000,
          recordsProcessed: 0,
          recordsFailed: 0,
          error: null,
          metrics: { logsPurged: 1247, spaceFreed: "156MB" },
        },
        {
          id: "exec_3",
          jobId: "system_data_validation",
          status: "completed",
          startTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          endTime: new Date(
            Date.now() - 14 * 24 * 60 * 60 * 1000 + 18 * 60 * 1000
          ),
          duration: 18 * 60 * 1000,
          recordsProcessed: 0,
          recordsFailed: 0,
          error: null,
          metrics: { validationsRun: 23, issuesFound: 0 },
        },
      ];
    },
    getStatus: () => ({
      isRunning: true,
      activeJobs: 4,
      runningExecutions: 0,
    }),
    createJob: async () => `job_${Date.now()}`,
    updateJob: async () => {},
    deleteJob: async () => {},
    executeJob: async () => ({ success: true }),
  }));
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);
  const [selectedExecution, setSelectedExecution] =
    useState<JobExecution | null>(null);
  const [filter, setFilter] = useState<
    "all" | "active" | "paused" | "disabled"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [schedulerStatus, setSchedulerStatus] = useState({
    isRunning: false,
    activeJobs: 0,
    runningExecutions: 0,
  });

  // Load data on mount
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Start scheduler if not running
      if (!schedulerStatus.isRunning) {
        await scheduler.start();
      }

      const [jobsData, executionsData] = await Promise.all([
        scheduler.getAllJobs(),
        scheduler.getJobExecutions(),
      ]);

      setJobs(jobsData);
      setExecutions(executionsData);
      setSchedulerStatus(scheduler.getStatus());
    } catch (error) {
      clientLogger.error("Failed to load job data", "job-management", {
        error,
      });
    } finally {
      setLoading(false);
    }
  }, [scheduler, schedulerStatus.isRunning]);

  const handleCreateJob = async (
    jobData: Omit<CronJob, "id" | "createdAt" | "updatedAt" | "nextRun">
  ) => {
    try {
      const jobId = await scheduler.createJob();

      // Integrate with data warehouse services
      await dataWarehouseIntegration.onJobCreated(jobId, "etl", jobData);

      await loadData();
      setShowCreateModal(false);
      clientLogger.info("Job created successfully", "job-management");
    } catch (error) {
      clientLogger.error("Failed to create job", "job-management", { error });
    }
  };

  const handleUpdateJob = async (jobId: string, updates: Partial<CronJob>) => {
    try {
      await scheduler.updateJob();
      await loadData();
      setShowEditModal(false);
      setSelectedJob(null);
      clientLogger.info("Job updated successfully", "job-management");
    } catch (error) {
      clientLogger.error("Failed to update job", "job-management", { error });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await scheduler.deleteJob();
      await loadData();
      clientLogger.info("Job deleted successfully", "job-management");
    } catch (error) {
      clientLogger.error("Failed to delete job", "job-management", { error });
    }
  };

  const handleExecuteJob = async (jobId: string) => {
    try {
      const result = await scheduler.executeJob();

      // Find the job to get its type
      const job = jobs.find((j) => j.id === jobId);
      if (job) {
        // Integrate with data warehouse services
        await dataWarehouseIntegration.onJobExecuted(jobId, "etl", result);
      }

      await loadData();
      clientLogger.info("Job executed successfully", "job-management");
    } catch (error) {
      clientLogger.error("Failed to execute job", "job-management", { error });
    }
  };

  const getJobTypeIcon = (type: string) => {
    switch (type) {
      case "data_sync":
        return <Database className="w-4 h-4" />;
      case "backup":
        return <Cloud className="w-4 h-4" />;
      case "cleanup":
        return <Settings className="w-4 h-4" />;
      case "custom_script":
        return <Code className="w-4 h-4" />;
      case "api_poll":
        return <Zap className="w-4 h-4" />;
      case "workflow":
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case "data_sync":
        return "text-blue-400 bg-blue-500/20";
      case "backup":
        return "text-green-400 bg-green-500/20";
      case "cleanup":
        return "text-orange-400 bg-orange-500/20";
      case "custom_script":
        return "text-purple-400 bg-purple-500/20";
      case "api_poll":
        return "text-cyan-400 bg-cyan-500/20";
      case "workflow":
        return "text-pink-400 bg-pink-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "paused":
        return <Pause className="w-4 h-4 text-yellow-400" />;
      case "disabled":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesFilter =
      filter === "all" || (filter === "active" ? job.enabled : !job.enabled);
    const matchesSearch =
      job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading && jobs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/30 border-t-white/80 mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">Loading Job Manager...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Status Bar */}
      <div className="flex items-center justify-between p-4 border-b border-dark_cyan-200 border-opacity-10">
        <div className="flex items-center gap-4">
          {loading && (
            <div className="flex items-center gap-2 text-yellow-400">
              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Loading...</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
            <div
              className={`w-2 h-2 rounded-full ${
                schedulerStatus.isRunning ? "bg-green-400" : "bg-red-400"
              }`}
            />
            <span className="text-sm text-dark_cyan-300">
              {schedulerStatus.isRunning ? "Running" : "Stopped"}
            </span>
          </div>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="h-4 w-4" />}
        >
          Create Job
        </Button>
      </div>

      {/* Stats */}
      <div className="p-6 border-b border-dark_cyan-200 border-opacity-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{jobs.length}</p>
                <p className="text-sm text-gray-400">Total Jobs</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {jobs.filter((j) => j.status === "active").length}
                </p>
                <p className="text-sm text-gray-400">Active Jobs</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <RefreshCw className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {schedulerStatus.runningExecutions}
                </p>
                <p className="text-sm text-gray-400">Running</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {executions.length}
                </p>
                <p className="text-sm text-gray-400">Executions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
            >
              <option value="all">All Jobs</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search jobs..."
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                No Jobs Found
              </h3>
              <p className="text-gray-400 mb-4">
                {searchTerm
                  ? "No jobs match your search criteria"
                  : "Create your first scheduled job"}
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Job
              </Button>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div key={job.id} className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-lg ${getJobTypeColor(
                        job.type || "data_sync"
                      )}`}
                    >
                      {getJobTypeIcon(job.type || "data_sync")}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {job.name}
                      </h3>
                      {job.description && (
                        <p className="text-gray-400 text-sm">
                          {job.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {job.schedule}
                        </span>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(job.status || "active")}
                          {job.status || "active"}
                        </span>
                        {job.lastRun && (
                          <span>Last run: {job.lastRun.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExecuteJob(job.id)}
                      icon={<Play className="w-4 h-4" />}
                    >
                      Run Now
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedJob(job);
                        setShowEditModal(true);
                      }}
                      icon={<Edit className="w-4 h-4" />}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedJob(job);
                        setShowExecutionModal(true);
                      }}
                      icon={<Eye className="w-4 h-4" />}
                    >
                      History
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteJob(job.id)}
                      icon={<Trash2 className="w-4 h-4" />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Job Modal */}
      <CreateJobModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateJob}
      />

      {/* Edit Job Modal */}
      {selectedJob && (
        <EditJobModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
          onSubmit={(updates) => handleUpdateJob(selectedJob.id, updates)}
        />
      )}

      {/* Execution History Modal */}
      {selectedJob && (
        <ExecutionHistoryModal
          isOpen={showExecutionModal}
          onClose={() => {
            setShowExecutionModal(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
          executions={executions.filter((e) => e.jobId === selectedJob.id)}
        />
      )}
    </div>
  );
}

// Create Job Modal Component
interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    job: Omit<CronJob, "id" | "createdAt" | "updatedAt" | "nextRun">
  ) => void;
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    schedule: "0 */5 * * * *", // Every 5 minutes
    type: "data_sync",
    projectId: "",
    dataSourceId: "",
    workflowId: "",
    config: {
      enabled: true,
      timeout: 300,
      retryCount: 3,
      retryDelay: 60,
      notifications: {
        onSuccess: true,
        onFailure: true,
        onStart: false,
      },
    },
    status: "active",
    createdBy: "system",
    enabled: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Job" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Job Name</label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter job name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Job Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value,
                })
              }
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
            >
              <option value="data_sync">Data Sync</option>
              <option value="backup">Backup</option>
              <option value="cleanup">Cleanup</option>
              <option value="custom_script">Custom Script</option>
              <option value="api_poll">API Poll</option>
              <option value="workflow">Workflow</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe what this job does"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Cron Schedule
          </label>
          <Input
            value={formData.schedule}
            onChange={(e) =>
              setFormData({ ...formData, schedule: e.target.value })
            }
            placeholder="0 */5 * * * * (every 5 minutes)"
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            Format: second minute hour day month dayOfWeek
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Timeout (seconds)
            </label>
            <Input
              type="number"
              value={formData.config.timeout}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: {
                    ...formData.config,
                    timeout: parseInt(e.target.value),
                  },
                })
              }
              min="1"
              max="3600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Retry Count
            </label>
            <Input
              type="number"
              value={formData.config.retryCount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: {
                    ...formData.config,
                    retryCount: parseInt(e.target.value),
                  },
                })
              }
              min="0"
              max="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value,
                })
              }
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create Job</Button>
        </div>
      </form>
    </Modal>
  );
};

// Edit Job Modal Component
interface EditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: CronJob;
  onSubmit: (updates: Partial<CronJob>) => void;
}

const EditJobModal: React.FC<EditJobModalProps> = ({
  isOpen,
  onClose,
  job,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: job.name,
    description: job.description || "",
    schedule: job.schedule,
    type: job.type || "data_sync",
    status: job.status || "active",
    config: job.config,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Job" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Job Name</label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Job Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value,
                })
              }
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
            >
              <option value="data_sync">Data Sync</option>
              <option value="backup">Backup</option>
              <option value="cleanup">Cleanup</option>
              <option value="custom_script">Custom Script</option>
              <option value="api_poll">API Poll</option>
              <option value="workflow">Workflow</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Cron Schedule
          </label>
          <Input
            value={formData.schedule}
            onChange={(e) =>
              setFormData({ ...formData, schedule: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value,
              })
            }
            className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Update Job</Button>
        </div>
      </form>
    </Modal>
  );
};

// Execution History Modal Component
interface ExecutionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: CronJob;
  executions: JobExecution[];
}

const ExecutionHistoryModal: React.FC<ExecutionHistoryModalProps> = ({
  isOpen,
  onClose,
  job,
  executions,
}) => {
  const getStatusIcon = (status: JobExecution["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "running":
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case "cancelled":
        return <Square className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Execution History - ${job.name}`}
      size="lg"
    >
      <div className="space-y-4">
        {executions.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400">No executions found for this job</p>
          </div>
        ) : (
          executions.map((execution) => (
            <div key={execution.id} className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(execution.status)}
                  <div>
                    <h4 className="font-semibold text-white">
                      {execution.status.charAt(0).toUpperCase() +
                        execution.status.slice(1)}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {execution.startTime.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="text-right text-sm text-gray-400">
                  {execution.duration && (
                    <p>Duration: {execution.duration}ms</p>
                  )}
                  <p>Progress: {execution.progress}%</p>
                </div>
              </div>

              {execution.currentStep && (
                <p className="text-sm text-gray-300 mb-2">
                  Step: {execution.currentStep}
                </p>
              )}

              {execution.error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{execution.error}</p>
                </div>
              )}

              {execution.logs && execution.logs.length > 0 && (
                <div className="mt-3">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-400 hover:text-white">
                      View Logs ({execution.logs?.length || 0})
                    </summary>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {execution.logs?.map((log: any) => (
                        <div key={log.id} className="text-xs text-gray-400">
                          <span className="text-gray-500">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                          <span
                            className={`ml-2 ${
                              log.level === "error"
                                ? "text-red-400"
                                : log.level === "warn"
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          >
                            [{log.level.toUpperCase()}]
                          </span>
                          <span className="ml-2">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};
