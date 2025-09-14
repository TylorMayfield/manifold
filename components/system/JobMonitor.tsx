"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Clock,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Calendar,
  Zap,
  Database,
  Code,
  Globe,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  SystemMonitor,
  ScheduledTask,
  TaskHistory,
} from "../../lib/services/SystemMonitor";
import { RealSystemMonitor } from "../../lib/services/RealSystemMonitor";
import { logger } from "../../lib/utils/logger";

interface JobMonitorProps {
  className?: string;
  compact?: boolean;
}

interface JobStatus {
  running: number;
  pending: number;
  completed: number;
  failed: number;
  paused: number;
}

const JobMonitor = React.memo(function JobMonitor({
  className = "",
  compact = false,
}: JobMonitorProps) {
  const [systemMonitor] = useState<SystemMonitor>(() =>
    RealSystemMonitor.getInstance()
  );
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>([]);
  const [jobStatus, setJobStatus] = useState<JobStatus>({
    running: 0,
    pending: 0,
    completed: 0,
    failed: 0,
    paused: 0,
  });
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "running"
  );
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadJobData = useCallback(async () => {
    try {
      const tasks = systemMonitor.getScheduledTasks();
      const history = systemMonitor.getTaskHistory(20); // Get last 20 tasks

      setScheduledTasks(tasks);
      setTaskHistory(history);

      // Calculate job status counts
      const status: JobStatus = {
        running: tasks.filter((t) => t.status === "running").length,
        pending: tasks.filter((t) => t.status === "pending").length,
        completed: history.filter((h) => h.status === "completed").length,
        failed: history.filter((h) => h.status === "failed").length,
        paused: tasks.filter((t) => t.status === "paused").length,
      };

      setJobStatus(status);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      logger.error(
        "Failed to load job data",
        "system",
        { error },
        "JobMonitor"
      );
      setLoading(false);
    }
  }, [systemMonitor]);

  // Load initial data
  useEffect(() => {
    loadJobData();
    const interval = setInterval(loadJobData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [loadJobData]);

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "backup":
        return <Database className="h-4 w-4" />;
      case "sync":
        return <RefreshCw className="h-4 w-4" />;
      case "custom_script":
        return <Code className="h-4 w-4" />;
      case "api_poll":
        return <Globe className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "paused":
        return <Pause className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "pending":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "completed":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "failed":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      case "paused":
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  // Memoize color classes to avoid recalculation
  const statusColorClasses = {
    running: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    completed: "text-green-400 bg-green-400/10 border-green-400/20",
    failed: "text-red-400 bg-red-400/10 border-red-400/20",
    paused: "text-gray-400 bg-gray-400/10 border-gray-400/20",
  };

  const getStatusColorClass = (status: string) => {
    return (
      statusColorClasses[status as keyof typeof statusColorClasses] ||
      statusColorClasses.paused
    );
  };

  const formatNextRun = (nextRun: Date) => {
    const now = new Date();
    const diff = nextRun.getTime() - now.getTime();

    if (diff < 0) return "Overdue";
    if (diff < 60000) return "Now"; // Less than 1 minute
    if (diff < 3600000) return `${Math.round(diff / 60000)}m`; // Less than 1 hour
    if (diff < 86400000) return `${Math.round(diff / 3600000)}h`; // Less than 1 day
    return nextRun.toLocaleDateString();
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return "N/A";
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.round(duration / 60)}m`;
    return `${Math.round(duration / 3600)}h`;
  };

  const toggleSection = useCallback(
    (section: string) => {
      setExpandedSection(expandedSection === section ? null : section);
    },
    [expandedSection]
  );

  // Memoize status overview data to prevent recalculation
  const statusOverviewData = useMemo(
    () => [
      {
        key: "running",
        label: "Running",
        count: jobStatus.running,
        activeClass: "bg-blue-400/20 border-blue-400/40",
        textClass: "text-blue-400",
        defaultClass: "bg-white/5 border-white/10",
      },
      {
        key: "pending",
        label: "Pending",
        count: jobStatus.pending,
        activeClass: "bg-yellow-400/20 border-yellow-400/40",
        textClass: "text-yellow-400",
        defaultClass: "bg-white/5 border-white/10",
      },
      {
        key: "completed",
        label: "Completed",
        count: jobStatus.completed,
        activeClass: "bg-green-400/20 border-green-400/40",
        textClass: "text-green-400",
        defaultClass: "bg-white/5 border-white/10",
      },
      {
        key: "failed",
        label: "Failed",
        count: jobStatus.failed,
        activeClass: "bg-red-400/20 border-red-400/40",
        textClass: "text-red-400",
        defaultClass: "bg-white/5 border-white/10",
      },
      {
        key: "paused",
        label: "Paused",
        count: jobStatus.paused,
        activeClass: "bg-gray-400/20 border-gray-400/40",
        textClass: "text-gray-400",
        defaultClass: "bg-white/5 border-white/10",
      },
    ],
    [jobStatus]
  );

  // Memoize filtered task lists to prevent recalculation
  const runningTasks = useMemo(
    () => scheduledTasks.filter((task) => task.status === "running"),
    [scheduledTasks]
  );

  const pendingTasks = useMemo(
    () =>
      scheduledTasks
        .filter((task) => task.status === "pending")
        .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime()),
    [scheduledTasks]
  );

  const recentHistory = useMemo(() => taskHistory.slice(0, 10), [taskHistory]);

  if (compact) {
    return (
      <div className={`glass-card rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white">Jobs</h3>
          <div className="flex items-center space-x-1">
            {jobStatus.running > 0 && (
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            )}
            <span className="text-xs text-white/60">
              {jobStatus.running + jobStatus.pending}
            </span>
          </div>
        </div>

        <div className="flex space-x-2 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            <span className="text-white/60">{jobStatus.running}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
            <span className="text-white/60">{jobStatus.pending}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
            <span className="text-white/60">{jobStatus.failed}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-card rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Job Monitor</h3>
        </div>
        <button
          onClick={loadJobData}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {statusOverviewData.map(
          ({ key, label, count, activeClass, textClass, defaultClass }) => (
            <div
              key={key}
              className={`p-2 rounded-lg border text-center transition-colors duration-200 ${
                expandedSection === key ? activeClass : defaultClass
              }`}
            >
              <div className={`text-lg font-bold ${textClass}`}>{count}</div>
              <div className="text-xs text-white/60">{label}</div>
            </div>
          )
        )}
      </div>

      {/* Running Jobs */}
      {jobStatus.running > 0 && (
        <div className="mb-4">
          <button
            onClick={() => toggleSection("running")}
            className="w-full flex items-center justify-between p-2 text-left hover:bg-white/5 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
              <span className="text-white font-medium">Running Jobs</span>
              <span className="text-xs text-blue-400 bg-blue-400/20 px-1.5 py-0.5 rounded">
                {jobStatus.running}
              </span>
            </div>
            {expandedSection === "running" ? (
              <ChevronDown className="h-4 w-4 text-white/60" />
            ) : (
              <ChevronRight className="h-4 w-4 text-white/60" />
            )}
          </button>

          {expandedSection === "running" && (
            <div className="mt-2 space-y-2">
              {runningTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg"
                >
                  {getTaskIcon(task.type)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {task.name}
                    </div>
                    <div className="text-xs text-white/60">
                      {task.type} • Started {task.lastRun?.toLocaleTimeString()}
                    </div>
                  </div>
                  {getStatusIcon(task.status)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending Jobs */}
      {jobStatus.pending > 0 && (
        <div className="mb-4">
          <button
            onClick={() => toggleSection("pending")}
            className="w-full flex items-center justify-between p-2 text-left hover:bg-white/5 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-white font-medium">Pending Jobs</span>
              <span className="text-xs text-yellow-400 bg-yellow-400/20 px-1.5 py-0.5 rounded">
                {jobStatus.pending}
              </span>
            </div>
            {expandedSection === "pending" ? (
              <ChevronDown className="h-4 w-4 text-white/60" />
            ) : (
              <ChevronRight className="h-4 w-4 text-white/60" />
            )}
          </button>

          {expandedSection === "pending" && (
            <div className="mt-2 space-y-2">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg"
                >
                  {getTaskIcon(task.type)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {task.name}
                    </div>
                    <div className="text-xs text-white/60">
                      {task.type} • Next: {formatNextRun(task.nextRun)}
                    </div>
                  </div>
                  <div className="text-xs text-yellow-400">
                    {formatNextRun(task.nextRun)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent History */}
      {taskHistory.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => toggleSection("history")}
            className="w-full flex items-center justify-between p-2 text-left hover:bg-white/5 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-white/60" />
              <span className="text-white font-medium">Recent History</span>
              <span className="text-xs text-white/60 bg-white/10 px-1.5 py-0.5 rounded">
                {taskHistory.length}
              </span>
            </div>
            {expandedSection === "history" ? (
              <ChevronDown className="h-4 w-4 text-white/60" />
            ) : (
              <ChevronRight className="h-4 w-4 text-white/60" />
            )}
          </button>

          {expandedSection === "history" && (
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {recentHistory.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg"
                >
                  {getTaskIcon(task.type)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {task.taskName}
                    </div>
                    <div className="text-xs text-white/60">
                      {task.type} • {task.startedAt.toLocaleString()}
                      {task.duration && ` • ${formatDuration(task.duration)}`}
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs border ${getStatusColorClass(
                      task.status
                    )}`}
                  >
                    {task.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Last Update */}
      <div className="text-xs text-white/40 text-center pt-2 border-t border-white/10">
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  );
});

export default JobMonitor;
