"use client";

import React, { useState, useEffect } from "react";
import PageLayout from "../../components/layout/PageLayout";
import CellButton from "../../components/ui/CellButton";
import CellCard from "../../components/ui/CellCard";
import CellInput from "../../components/ui/CellInput";
import SystemHealthDashboard from "../../components/monitoring/SystemHealthDashboard";
import MetricsChart from "../../components/monitoring/MetricsChart";
import {
  Activity,
  FileText,
  Download,
  RefreshCw,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Eye,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Zap,
  Server,
  Database,
} from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: Date;
  level: "debug" | "info" | "warn" | "error" | "success";
  category: string;
  message: string;
  source?: string;
  details?: any;
  projectId?: string;
  dataSourceId?: string;
}

export default function ObservabilityPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "metrics" | "alerts">("overview");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch logs from API
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterLevel !== "all") params.append("level", filterLevel);
      if (filterCategory !== "all") params.append("category", filterCategory);
      params.append("limit", "100");

      const response = await fetch(`/api/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(
          data.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp),
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterLevel, filterCategory]);

  // Auto-refresh logs every 10 seconds
  useEffect(() => {
    if (autoRefresh && activeTab === "logs") {
      const interval = setInterval(fetchLogs, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, activeTab]);

  const filteredLogs = logs
    .filter(
      (log) =>
        searchTerm === "" ||
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.source?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 50);

  const getLevelIcon = (level: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "warn":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-600" />;
      case "debug":
        return <Clock className="w-4 h-4 text-gray-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "warn":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "debug":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getLogCounts = () => {
    const counts = logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return counts;
  };

  const logCounts = getLogCounts();
  const recentErrors = logs.filter(log => log.level === 'error').slice(0, 5);
  const recentWarnings = logs.filter(log => log.level === 'warn').slice(0, 5);

  const handleExportLogs = () => {
    const csv = [
      ["Timestamp", "Level", "Category", "Source", "Message"],
      ...filteredLogs.map((log) => [
        log.timestamp.toISOString(),
        log.level,
        log.category,
        log.source || "",
        log.message,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `observability-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <PageLayout
      title="System Observability"
      subtitle="Monitor system health, logs, and performance"
      icon={Activity}
      showNavigation={true}
      showBackButton={true}
      backButtonText="Back to Home"
      backButtonHref="/"
      headerActions={
        <div className="flex items-center space-x-2">
          <CellButton
            variant={autoRefresh ? "primary" : "secondary"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </CellButton>
          {activeTab === "logs" && (
            <CellButton variant="secondary" onClick={handleExportLogs} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </CellButton>
          )}
          <CellButton variant="secondary" size="sm" onClick={fetchLogs}>
            <RefreshCw className="w-4 h-4" />
          </CellButton>
        </div>
      }
    >
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        <button
          className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          <TrendingUp className="w-4 h-4" />
          Overview
        </button>
        <button
          className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('logs')}
        >
          <FileText className="w-4 h-4" />
          Logs
          {logCounts.error > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {logCounts.error}
            </span>
          )}
        </button>
        <button
          className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'metrics'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('metrics')}
        >
          <BarChart3 className="w-4 h-4" />
          Metrics
        </button>
        <button
          className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'alerts'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('alerts')}
        >
          <AlertCircle className="w-4 h-4" />
          Alerts
          {(logCounts.error + logCounts.warn) > 0 && (
            <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
              {logCounts.error + logCounts.warn}
            </span>
          )}
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* System Health */}
          <SystemHealthDashboard />

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <CellCard className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-600">Total Logs</h3>
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-3xl font-mono font-bold">{logs.length}</p>
              <p className="text-xs text-gray-500 mt-1">Last hour</p>
            </CellCard>

            <CellCard className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-600">Errors</h3>
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-3xl font-mono font-bold text-red-600">
                {logCounts.error || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {logCounts.error > 0 ? 'Needs attention' : 'All clear'}
              </p>
            </CellCard>

            <CellCard className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-600">Warnings</h3>
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-3xl font-mono font-bold text-yellow-600">
                {logCounts.warn || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {logCounts.warn > 0 ? 'Review recommended' : 'All clear'}
              </p>
            </CellCard>

            <CellCard className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-600">Success Rate</h3>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-mono font-bold text-green-600">
                {logs.length > 0
                  ? Math.round(((logs.length - (logCounts.error || 0)) / logs.length) * 100)
                  : 100}
                %
              </p>
              <p className="text-xs text-gray-500 mt-1">Overall health</p>
            </CellCard>
          </div>

          {/* Recent Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Errors */}
            <CellCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold font-mono flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  Recent Errors
                </h3>
                {recentErrors.length > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-mono">
                    {recentErrors.length}
                  </span>
                )}
              </div>
              
              {recentErrors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
                  <p className="text-sm">No errors</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentErrors.map((log) => (
                    <div key={log.id} className="p-3 bg-red-50 border-l-4 border-l-red-500 rounded">
                      <p className="font-mono text-sm text-gray-900">{log.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{getTimeAgo(log.timestamp)}</p>
                    </div>
                  ))}
                  <CellButton
                    variant="secondary"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      setActiveTab('logs');
                      setFilterLevel('error');
                    }}
                  >
                    View All Errors
                  </CellButton>
                </div>
              )}
            </CellCard>

            {/* Recent Warnings */}
            <CellCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold font-mono flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Recent Warnings
                </h3>
                {recentWarnings.length > 0 && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-mono">
                    {recentWarnings.length}
                  </span>
                )}
              </div>
              
              {recentWarnings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
                  <p className="text-sm">No warnings</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentWarnings.map((log) => (
                    <div key={log.id} className="p-3 bg-yellow-50 border-l-4 border-l-yellow-500 rounded">
                      <p className="font-mono text-sm text-gray-900">{log.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{getTimeAgo(log.timestamp)}</p>
                    </div>
                  ))}
                  <CellButton
                    variant="secondary"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      setActiveTab('logs');
                      setFilterLevel('warn');
                    }}
                  >
                    View All Warnings
                  </CellButton>
                </div>
              )}
            </CellCard>
          </div>

          {/* Mini Metrics Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricsChart
              metricName="system.cpu_usage"
              title="CPU Usage"
              unit="%"
              thresholds={{ warning: 70, critical: 90 }}
            />
            <MetricsChart
              metricName="system.memory_usage"
              title="Memory Usage"
              unit="%"
              thresholds={{ warning: 70, critical: 85 }}
            />
            <MetricsChart
              metricName="pipelines.execution_time"
              title="Pipeline Execution"
              unit="ms"
            />
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <CellCard className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex items-center space-x-4 flex-1">
                <Search className="w-4 h-4 text-gray-500" />
                <CellInput
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              <div className="flex items-center space-x-4">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="px-3 py-2 bg-white border-2 border-black font-mono text-sm"
                >
                  <option value="all">All Levels</option>
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="debug">Debug</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 bg-white border-2 border-black font-mono text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="system">System</option>
                  <option value="database">Database</option>
                  <option value="data-processing">Data Processing</option>
                  <option value="api">API</option>
                  <option value="pipeline">Pipeline</option>
                  <option value="job">Job</option>
                </select>
              </div>
            </div>
          </CellCard>

          {/* Log Entries */}
          {loading ? (
            <CellCard className="p-12">
              <div className="text-center">
                <RefreshCw className="w-16 h-16 mx-auto mb-4 text-gray-300 animate-spin" />
                <h2 className="text-heading mb-2">Loading logs...</h2>
              </div>
            </CellCard>
          ) : filteredLogs.length === 0 ? (
            <CellCard className="p-12">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h2 className="text-heading mb-2">No logs match your filters</h2>
                <CellButton
                  variant="primary"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterLevel("all");
                    setFilterCategory("all");
                  }}
                >
                  Clear Filters
                </CellButton>
              </div>
            </CellCard>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <CellCard
                  key={log.id}
                  className={`p-4 border-l-4 ${
                    log.level === "error"
                      ? "border-l-red-500"
                      : log.level === "warn"
                      ? "border-l-yellow-500"
                      : log.level === "success"
                      ? "border-l-green-500"
                      : log.level === "info"
                      ? "border-l-blue-500"
                      : "border-l-gray-500"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex items-center space-x-2">
                        {getLevelIcon(log.level)}
                        <span
                          className={`px-2 py-1 text-xs font-mono border ${getLevelColor(
                            log.level
                          )}`}
                        >
                          {log.level.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex-1">
                        <p className="font-mono text-sm font-bold">{log.message}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {getTimeAgo(log.timestamp)} • {log.timestamp.toLocaleTimeString()}
                          </span>
                          {log.category && <span className="px-2 py-0.5 bg-gray-100 rounded">{log.category}</span>}
                          {log.source && <span>Source: {log.source}</span>}
                        </div>
                      </div>
                    </div>

                    {log.details && (
                      <Eye className="w-4 h-4 text-gray-400 ml-4" />
                    )}
                  </div>

                  {log.details && (
                    <details className="mt-3 pt-3 border-t border-gray-200">
                      <summary className="text-xs font-mono font-bold cursor-pointer hover:text-blue-500">
                        Show Details
                      </summary>
                      <div className="mt-2 p-2 bg-gray-100 border border-gray-200 font-mono text-xs overflow-auto max-h-64">
                        <pre>{JSON.stringify(log.details, null, 2)}</pre>
                      </div>
                    </details>
                  )}
                </CellCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* System Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MetricsChart
              metricName="system.cpu_usage"
              title="CPU Usage"
              unit="%"
              thresholds={{ warning: 70, critical: 90 }}
            />
            <MetricsChart
              metricName="system.memory_usage"
              title="Memory Usage"
              unit="%"
              thresholds={{ warning: 70, critical: 85 }}
            />
          </div>

          {/* Pipeline & Data Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <MetricsChart
              metricName="pipelines.execution_time"
              title="Pipeline Execution Time"
              unit="ms"
            />
            <MetricsChart
              metricName="pipelines.success_rate"
              title="Pipeline Success Rate"
              unit="%"
            />
            <MetricsChart
              metricName="data.processed_records"
              title="Records Processed"
              unit="records"
            />
          </div>

          {/* Database Metrics */}
          <CellCard className="p-6">
            <h3 className="text-lg font-bold font-mono mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricsChart
                metricName="database.query_time"
                title="Query Time"
                unit="ms"
              />
              <MetricsChart
                metricName="database.connections"
                title="Active Connections"
                unit="connections"
              />
              <MetricsChart
                metricName="database.operations"
                title="Operations/sec"
                unit="ops"
              />
            </div>
          </CellCard>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Errors */}
            <CellCard className="p-6">
              <h3 className="text-lg font-bold font-mono mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Active Errors
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded ml-auto">
                  {logCounts.error || 0}
                </span>
              </h3>
              
              {recentErrors.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                  <p className="text-gray-600">No active errors</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentErrors.map((log) => (
                    <div key={log.id} className="p-4 bg-red-50 border-l-4 border-l-red-600 rounded">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-mono text-sm font-bold text-gray-900">{log.message}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {log.category} • {getTimeAgo(log.timestamp)}
                          </p>
                        </div>
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 ml-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CellCard>

            {/* Active Warnings */}
            <CellCard className="p-6">
              <h3 className="text-lg font-bold font-mono mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Active Warnings
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded ml-auto">
                  {logCounts.warn || 0}
                </span>
              </h3>
              
              {recentWarnings.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                  <p className="text-gray-600">No active warnings</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentWarnings.map((log) => (
                    <div key={log.id} className="p-4 bg-yellow-50 border-l-4 border-l-yellow-600 rounded">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-mono text-sm font-bold text-gray-900">{log.message}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {log.category} • {getTimeAgo(log.timestamp)}
                          </p>
                        </div>
                        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 ml-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CellCard>
          </div>

          {/* System Health Summary */}
          <SystemHealthDashboard />
        </div>
      )}
    </PageLayout>
  );
}

