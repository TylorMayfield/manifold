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
  ChevronDown,
  ChevronRight,
  Loader2,
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
// System monitor removed - using mock data for now

// Mock types for client-side
interface CronJob {
  id: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
}

interface JobExecution {
  id: string;
  jobId: string;
  status: string;
  startTime: Date;
  endTime?: Date;
  result?: any;
}

interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  schedule: string;
  isActive: boolean;
  status: "running" | "pending" | "completed" | "failed" | "paused";
  lastRun?: Date;
  nextRun?: Date;
}

interface TaskHistory {
  id: string;
  taskId: string;
  taskName: string;
  status: "success" | "error" | "running" | "completed" | "failed";
  startTime: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
}
import { clientLogger } from "../../lib/utils/ClientLogger";

interface UnifiedJobPageProps {}

interface JobStatus {
  running: number;
  pending: number;
  completed: number;
  failed: number;
  paused: number;
}

const UnifiedJobPage: React.FC<UnifiedJobPageProps> = () => {
  // const [scheduler] = useState(() => JobScheduler.getInstance()); // Moved to server-side
  const [scheduler] = useState(() => ({
    // Mock scheduler for client-side
    start: async () => {},
    stop: async () => {},
    scheduleJob: () => {},
    cancelJob: () => {},
    getJobs: () => [],
    getExecutions: () => [],
    getAllJobs: () => [],
    getJobExecutions: () => [],
    getStatus: () => ({
      isRunning: true,
      activeJobs: 0,
      runningExecutions: 0,
    }),
    createJob: async () => {},
    updateJob: async () => {},
    deleteJob: async () => {},
    executeJob: async () => {},
  }));
  // System monitor removed - using mock data

  // Job Management State
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);
  const [selectedExecution, setSelectedExecution] =
    useState<JobExecution | null>(null);

  // Job Monitoring State
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>([]);
  const [jobStatus, setJobStatus] = useState<JobStatus>({
    running: 0,
    pending: 0,
    completed: 0,
    failed: 0,
    paused: 0,
  });

  // UI State
  const [activeTab, setActiveTab] = useState<
    "overview" | "jobs" | "monitor" | "history"
  >("overview");
  const [filter, setFilter] = useState<
    "all" | "active" | "paused" | "disabled"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [schedulerStatus, setSchedulerStatus] = useState({
    isRunning: false,
    activeJobs: 0,
    runningExecutions: 0,
  });

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Start scheduler if not running
      if (!schedulerStatus.isRunning) {
        await scheduler.start();
      }

      // Load job management data
      const [jobsData, executionsData] = await Promise.all([
        scheduler.getAllJobs(),
        scheduler.getJobExecutions(),
      ]);

      // Load monitoring data
      // Mock data since system monitor was removed
      const tasks: ScheduledTask[] = [];
      const history: TaskHistory[] = [];

      setJobs(jobsData);
      setExecutions(executionsData);
      setScheduledTasks(tasks);
      setTaskHistory(history);
      setSchedulerStatus(scheduler.getStatus());

      // Calculate job status counts
      const status: JobStatus = {
        running: tasks.filter((t) => t.status === "running").length,
        pending: tasks.filter((t) => t.status === "pending").length,
        completed: history.filter((h) => h.status === "completed").length,
        failed: history.filter((h) => h.status === "failed").length,
        paused: tasks.filter((t) => t.status === "paused").length,
      };

      setJobStatus(status);
    } catch (error) {
      clientLogger.error("Failed to load job data", "job-management", {
        error,
      });
    } finally {
      setLoading(false);
    }
  }, [scheduler, schedulerStatus.isRunning]);

  // Load data on mount and refresh every 5 seconds
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Job Management Functions
  const handleCreateJob = async (jobData: Partial<CronJob>) => {
    try {
      await scheduler.createJob();
      await loadData();
      setShowCreateModal(false);
      clientLogger.success("Job created successfully", "job-management");
    } catch (error) {
      clientLogger.error("Failed to create job", "job-management", { error });
    }
  };

  const handleUpdateJob = async (jobData: Partial<CronJob>) => {
    if (!selectedJob) return;
    try {
      await scheduler.updateJob();
      await loadData();
      setShowEditModal(false);
      setSelectedJob(null);
      clientLogger.success("Job updated successfully", "job-management");
    } catch (error) {
      clientLogger.error("Failed to update job", "job-management", { error });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await scheduler.deleteJob();
      await loadData();
      clientLogger.success("Job deleted successfully", "job-management");
    } catch (error) {
      clientLogger.error("Failed to delete job", "job-management", { error });
    }
  };

  // Toggle job functionality removed - system monitor was removed

  const handleExecuteJob = async (jobId: string) => {
    try {
      await scheduler.executeJob();
      await loadData();
      clientLogger.success("Job executed successfully", "job-management");
    } catch (error) {
      clientLogger.error("Failed to execute job", "job-management", { error });
    }
  };

  // Filter jobs based on current filter and search
  const filteredJobs = jobs.filter((job) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && job.enabled) ||
      (filter === "paused" && !job.enabled) ||
      (filter === "disabled" && !job.enabled);

    const matchesSearch =
      job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Loader2 className="h-4 w-4 text-tangerine-400 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-apricot-400" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-jasper-400" />;
      case "pending":
        return <Clock className="h-4 w-4 text-dark_cyan-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-dark_cyan-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-tangerine-400 bg-tangerine-500/20";
      case "completed":
        return "text-apricot-400 bg-apricot-500/20";
      case "failed":
        return "text-jasper-400 bg-jasper-500/20";
      case "pending":
        return "text-dark_cyan-400 bg-dark_cyan-500/20";
      default:
        return "text-dark_cyan-400 bg-dark_cyan-500/20";
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 p-4 border-b border-dark_cyan-200 border-opacity-10">
        <Button
          onClick={loadData}
          variant="ghost"
          size="sm"
          icon={<RefreshCw className="h-4 w-4" />}
          disabled={loading}
        >
          Refresh
        </Button>
        <Button
          onClick={() => setShowCreateModal(true)}
          variant="default"
          size="sm"
          icon={<Plus className="h-4 w-4" />}
        >
          New Job
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-dark_cyan-200 border-opacity-10">
        <div className="flex items-center gap-1 px-6">
          {[
            { id: "overview", label: "Overview", icon: Database },
            { id: "jobs", label: "Jobs", icon: Clock },
            { id: "monitor", label: "Monitor", icon: Eye },
            { id: "history", label: "History", icon: Calendar },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === id
                  ? "text-tangerine-400 border-tangerine-400 bg-tangerine-500/10"
                  : "text-dark_cyan-400 border-transparent hover:text-white hover:bg-dark_cyan-300 hover:bg-opacity-10"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "overview" && (
          <div className="p-6 space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-tangerine-400">
                  {jobStatus.running}
                </div>
                <div className="text-sm text-dark_cyan-400">Running</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-dark_cyan-400">
                  {jobStatus.pending}
                </div>
                <div className="text-sm text-dark_cyan-400">Pending</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-apricot-400">
                  {jobStatus.completed}
                </div>
                <div className="text-sm text-dark_cyan-400">Completed</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-jasper-400">
                  {jobStatus.failed}
                </div>
                <div className="text-sm text-dark_cyan-400">Failed</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-dark_cyan-400">
                  {jobStatus.paused}
                </div>
                <div className="text-sm text-dark_cyan-400">Paused</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {taskHistory.slice(0, 5).map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-dark_cyan-300 bg-opacity-10"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(task.status)}
                      <div>
                        <div className="text-sm font-medium text-white">
                          {task.taskName}
                        </div>
                        <div className="text-xs text-dark_cyan-400">
                          {task.status}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-dark_cyan-400">
                      {new Date(task.startTime).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "jobs" && (
          <div className="p-6 space-y-6">
            {/* Filters and Search */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-dark_cyan-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-lg bg-dark_cyan-300 bg-opacity-10 border border-dark_cyan-200 border-opacity-20 text-white text-sm"
                >
                  <option value="all">All Jobs</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark_cyan-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search jobs..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Jobs List */}
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <div key={job.id} className="glass-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-dark_cyan-500/20">
                        <Clock className="h-4 w-4 text-dark_cyan-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {job.name}
                        </div>
                        <div className="text-xs text-dark_cyan-400">
                          {job.description}
                        </div>
                        <div className="text-xs text-dark_cyan-500">
                          Cron: {job.schedule}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          job.enabled
                            ? "text-apricot-400 bg-apricot-500/20"
                            : "text-dark_cyan-400 bg-dark_cyan-500/20"
                        }`}
                      >
                        {job.enabled ? "Active" : "Paused"}
                      </span>
                      <Button
                        onClick={() => handleExecuteJob(job.id)}
                        variant="ghost"
                        size="sm"
                        icon={<Play className="h-4 w-4" />}
                      >
                        Run
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedJob(job);
                          setShowEditModal(true);
                        }}
                        variant="ghost"
                        size="sm"
                        icon={<Edit className="h-4 w-4" />}
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteJob(job.id)}
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="h-4 w-4" />}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "monitor" && (
          <div className="p-6 space-y-6">
            {/* Running Jobs */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Running Jobs
              </h3>
              <div className="space-y-3">
                {scheduledTasks
                  .filter((task) => task.status === "running")
                  .map((task, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-tangerine-500/10 border border-tangerine-400/20"
                    >
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-4 w-4 text-tangerine-400 animate-spin" />
                        <div>
                          <div className="text-sm font-medium text-white">
                            {task.name}
                          </div>
                          <div className="text-xs text-dark_cyan-400">
                            {task.status}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-dark_cyan-400">
                        Started:{" "}
                        {new Date(
                          task.lastRun || Date.now()
                        ).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                {scheduledTasks.filter((task) => task.status === "running")
                  .length === 0 && (
                  <div className="text-center py-8 text-dark_cyan-400">
                    No jobs currently running
                  </div>
                )}
              </div>
            </div>

            {/* Scheduled Tasks */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Scheduled Tasks
              </h3>
              <div className="space-y-3">
                {scheduledTasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-dark_cyan-300 bg-opacity-10"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {getStatusIcon(task.status)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {task.name}
                        </div>
                        <div className="text-xs text-dark_cyan-400">
                          {task.status}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-dark_cyan-400">
                      Next:{" "}
                      {task.nextRun
                        ? new Date(task.nextRun).toLocaleTimeString()
                        : "N/A"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="p-6 space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Execution History
              </h3>
              <div className="space-y-3">
                {taskHistory.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-dark_cyan-300 bg-opacity-10"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(task.status)}
                      <div>
                        <div className="text-sm font-medium text-white">
                          {task.taskName}
                        </div>
                        <div className="text-xs text-dark_cyan-400">
                          {task.status}
                        </div>
                        {task.error && (
                          <div className="text-xs text-jasper-400">
                            {task.error}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-dark_cyan-400">
                      {new Date(task.startTime).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Job Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Job"
        size="lg"
      >
        <CreateJobForm
          onSubmit={handleCreateJob}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Job Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedJob(null);
        }}
        title="Edit Job"
        size="lg"
      >
        {selectedJob && (
          <EditJobForm
            job={selectedJob}
            onSubmit={handleUpdateJob}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedJob(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

// Create Job Form Component
const CreateJobForm: React.FC<{
  onSubmit: (jobData: Partial<CronJob>) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cronExpression: "0 0 * * *", // Daily at midnight
    script: "",
    enabled: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Job Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <Input
        label="Description"
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
      />
      <Input
        label="Cron Expression"
        value={formData.cronExpression}
        onChange={(e) =>
          setFormData({ ...formData, cronExpression: e.target.value })
        }
        placeholder="0 0 * * *"
        required
      />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="enabled"
          checked={formData.enabled}
          onChange={(e) =>
            setFormData({ ...formData, enabled: e.target.checked })
          }
          className="rounded"
        />
        <label htmlFor="enabled" className="text-sm text-white">
          Enable job
        </label>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Job</Button>
      </div>
    </form>
  );
};

// Edit Job Form Component
const EditJobForm: React.FC<{
  job: CronJob;
  onSubmit: (jobData: Partial<CronJob>) => void;
  onCancel: () => void;
}> = ({ job, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: job.name,
    description: job.description || "",
    cronExpression: job.schedule,
    enabled: job.enabled,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Job Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <Input
        label="Description"
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
      />
      <Input
        label="Cron Expression"
        value={formData.cronExpression}
        onChange={(e) =>
          setFormData({ ...formData, cronExpression: e.target.value })
        }
        required
      />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="enabled"
          checked={formData.enabled}
          onChange={(e) =>
            setFormData({ ...formData, enabled: e.target.checked })
          }
          className="rounded"
        />
        <label htmlFor="enabled" className="text-sm text-white">
          Enable job
        </label>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Update Job</Button>
      </div>
    </form>
  );
};

export default UnifiedJobPage;
