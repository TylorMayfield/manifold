"use client";

import React, { useState, useEffect } from "react";
import {
  Monitor,
  Cpu,
  MemoryStick,
  HardDrive,
  Clock,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  Activity,
  Zap,
  Shield,
  Database,
} from "lucide-react";
import {
  SystemMonitor,
  SystemMetrics,
  ScheduledTask,
  TaskHistory,
} from "../../lib/services/SystemMonitor";
import { RealSystemMonitor } from "../../lib/services/RealSystemMonitor";
import { logger } from "../../lib/utils/logger";
import { RealTimeSyncPanel } from "./RealTimeSyncPanel";
import { DataQualityDashboard } from "../quality/DataQualityDashboard";

interface SystemTabProps {
  isActive: boolean;
  projectId?: string;
}

export default function SystemTab({ isActive, projectId }: SystemTabProps) {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "tasks" | "history" | "realtime" | "quality"
  >("overview");

  const systemMonitor = RealSystemMonitor.getInstance();

  useEffect(() => {
    if (isActive) {
      loadSystemData();

      // Start monitoring if not already started
      systemMonitor.startMonitoring(5000);

      // Set up interval to update data
      const interval = setInterval(() => {
        loadSystemData();
      }, 5000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [isActive]);

  const loadSystemData = async () => {
    try {
      setMetrics(systemMonitor.getMetrics());
      setScheduledTasks(systemMonitor.getScheduledTasks());
      setTaskHistory(systemMonitor.getTaskHistory(20));
      setLoading(false);
    } catch (error) {
      console.error("Failed to load system data:", error);
      logger.error(
        "Failed to load system data",
        "system",
        { error },
        "SystemTab"
      );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400";
      case "failed":
        return "text-red-400";
      case "running":
        return "text-blue-400";
      case "pending":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case "backup":
        return <HardDrive className="h-4 w-4" />;
      case "sync":
        return <RefreshCw className="h-4 w-4" />;
      case "custom_script":
        return <Zap className="h-4 w-4" />;
      case "api_poll":
        return <Activity className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatNextRun = (date: Date): string => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) return "Overdue";
    if (diff < 60000) return "In < 1m";
    if (diff < 3600000) return `In ${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `In ${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
  };

  if (!isActive) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading system data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 p-4 border-b border-white/10">
        <Monitor className="h-5 w-5 text-blue-400" />
        <h3 className="text-white font-semibold">System Monitor</h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {[
          { id: "overview", label: "Overview", icon: Activity },
          { id: "tasks", label: "Tasks", icon: Calendar },
          { id: "history", label: "History", icon: Clock },
          { id: "realtime", label: "Real-Time", icon: RefreshCw },
          { id: "quality", label: "Quality", icon: Shield },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-blue-400 border-b-2 border-blue-400 bg-blue-400/10"
                : "text-white/60 hover:text-white/80"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "overview" && (
          <div className="p-4 space-y-6">
            {/* System Metrics */}
            {metrics && (
              <div className="space-y-4">
                <h4 className="text-white font-medium flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-400" />
                  System Metrics
                </h4>

                {/* CPU Usage */}
                <div className="card rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Cpu className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">CPU Usage</h4>
                        <p className="text-sm text-white/60">
                          Processor utilization
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {metrics.cpu.usage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-white/60">
                        {metrics.cpu.cores} cores
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 mb-3">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(metrics.cpu.usage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-white/60">
                    <span>
                      Load Average: {metrics.cpu.loadAverage[0].toFixed(2)}
                    </span>
                    <span>Current Usage</span>
                  </div>
                </div>

                {/* Memory Usage */}
                <div className="card rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <MemoryStick className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">
                          Memory Usage
                        </h4>
                        <p className="text-sm text-white/60">RAM utilization</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {metrics.memory.usage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-white/60">
                        {SystemMonitor.formatBytes(metrics.memory.used)}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 mb-3">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.min(metrics.memory.usage, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-white/60">
                    <span>
                      {SystemMonitor.formatBytes(metrics.memory.free)} free
                    </span>
                    <span>
                      {SystemMonitor.formatBytes(metrics.memory.total)} total
                    </span>
                  </div>
                </div>

                {/* Disk Usage */}
                <div className="card rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-orange-500/20">
                        <HardDrive className="h-5 w-5 text-orange-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">
                          Storage Usage
                        </h4>
                        <p className="text-sm text-white/60">
                          Disk utilization
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {metrics.disk.usage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-white/60">
                        {SystemMonitor.formatBytes(metrics.disk.used)}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 mb-3">
                    <div
                      className="bg-gradient-to-r from-orange-400 to-orange-500 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(metrics.disk.usage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-white/60">
                    <span>
                      {SystemMonitor.formatBytes(metrics.disk.free)} free
                    </span>
                    <span>
                      {SystemMonitor.formatBytes(metrics.disk.total)} total
                    </span>
                  </div>
                </div>

                {/* Uptime */}
                <div className="card rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Clock className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">
                          System Uptime
                        </h4>
                        <p className="text-sm text-white/60">
                          Time since last restart
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {formatUptime(metrics.uptime)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="card rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {scheduledTasks.length}
                </div>
                <div className="text-sm text-white/60">Total Tasks</div>
                <div className="text-xs text-white/40 mt-1">Scheduled</div>
              </div>
              <div className="card rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {scheduledTasks.filter((t) => t.status === "pending").length}
                </div>
                <div className="text-sm text-white/60">Pending</div>
                <div className="text-xs text-white/40 mt-1">Waiting to run</div>
              </div>
              <div className="card rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {taskHistory.filter((t) => t.status === "completed").length}
                </div>
                <div className="text-sm text-white/60">Completed</div>
                <div className="text-xs text-white/40 mt-1">Last 24h</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="p-4 space-y-4">
            <h4 className="text-white font-medium flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-400" />
              Scheduled Tasks
            </h4>

            {scheduledTasks.length === 0 ? (
              <div className="card rounded-xl p-12 text-center">
                <Calendar className="h-16 w-16 text-white/40 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No Scheduled Tasks
                </h3>
                <p className="text-white/60">
                  Create backup schedules or data source syncs to see them here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledTasks.map((task) => (
                  <div key={task.id} className="card rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-lg bg-blue-500/20">
                          {getTaskTypeIcon(task.type)}
                        </div>
                        <div className="flex-1">
                          <h5 className="text-white font-semibold text-lg mb-1">
                            {task.name}
                          </h5>
                          <p className="text-sm text-white/60 mb-2">
                            {task.type.replace("_", " ")} • {task.schedule}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-white/60">
                            <span>Next: {formatNextRun(task.nextRun)}</span>
                            {task.lastRun && (
                              <span>
                                Last: {task.lastRun.toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${getStatusColor(
                          task.status
                        )} bg-white/5`}
                      >
                        {getStatusIcon(task.status)}
                        <span className="text-sm font-medium capitalize">
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="p-4 space-y-4">
            <h4 className="text-white font-medium flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-400" />
              Recent Tasks
            </h4>

            {taskHistory.length === 0 ? (
              <div className="card rounded-xl p-12 text-center">
                <Clock className="h-16 w-16 text-white/40 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No Task History
                </h3>
                <p className="text-white/60">
                  Task execution history will appear here once tasks start
                  running
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {taskHistory.map((task) => (
                  <div key={task.id} className="card rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-lg bg-blue-500/20">
                          {getTaskTypeIcon(task.type)}
                        </div>
                        <div className="flex-1">
                          <h5 className="text-white font-semibold text-lg mb-1">
                            {task.taskName}
                          </h5>
                          <p className="text-sm text-white/60 mb-2">
                            {task.type.replace("_", " ")} •{" "}
                            {task.startedAt.toLocaleString()}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-white/60">
                            {task.duration && (
                              <span>
                                Duration:{" "}
                                {SystemMonitor.formatDuration(task.duration)}
                              </span>
                            )}
                            {task.completedAt && (
                              <span>
                                Completed: {task.completedAt.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${getStatusColor(
                          task.status
                        )} bg-white/5`}
                      >
                        {getStatusIcon(task.status)}
                        <span className="text-sm font-medium capitalize">
                          {task.status}
                        </span>
                      </div>
                    </div>

                    {task.error && (
                      <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <h6 className="text-red-400 font-medium mb-1">
                              Error Details
                            </h6>
                            <p className="text-red-300 text-sm">{task.error}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "realtime" && (
          <div className="p-4">
            {projectId ? (
              <RealTimeSyncPanel projectId={projectId} />
            ) : (
              <div className="glass-card p-8 text-center">
                <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No Project Selected
                </h3>
                <p className="text-gray-400 mb-4">
                  Real-time sync requires a project to manage data sources.
                </p>
                <p className="text-sm text-gray-500">
                  Open a project to configure real-time data synchronization.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "quality" && (
          <div className="p-4">
            <DataQualityDashboard />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-between text-sm text-white/60">
          <span>Last updated: {metrics?.timestamp.toLocaleTimeString()}</span>
          <button
            onClick={loadSystemData}
            className="flex items-center space-x-1 hover:text-white/80 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
