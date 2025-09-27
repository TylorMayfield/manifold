"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "../../components/ui/Button";
import {
  FileText,
  Download,
  Settings,
  RefreshCw,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Calendar,
  Database,
  Zap,
  Play,
  User,
  ArrowLeft,
} from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: Date;
  level: "debug" | "info" | "warn" | "error" | "success";
  category:
    | "system"
    | "database"
    | "file-import"
    | "data-processing"
    | "user-action"
    | "api"
    | "electron"
    | "ui"
    | "backup"
    | "realtime-sync"
    | "data-transformation"
    | "data-quality"
    | "websocket"
    | "job-management";
  message: string;
  source?: string;
  details?: any;
  projectId?: string;
  dataSourceId?: string;
}

export default function LogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("today");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch logs from API
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterLevel !== "all") params.append("level", filterLevel);
      if (filterCategory !== "all") params.append("category", filterCategory);
      params.append("limit", "1000");

      const response = await fetch(`/api/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(
          data.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp),
          }))
        );
      } else {
        console.error("Failed to fetch logs");
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

  const filteredLogs = logs
    .filter(
      (log) =>
        searchTerm === "" ||
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.source?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((log) => {
      const now = new Date();
      const logDate = log.timestamp;
      switch (dateRange) {
        case "today":
          return logDate.toDateString() === now.toDateString();
        case "yesterday":
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          return logDate.toDateString() === yesterday.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return logDate >= weekAgo;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return logDate >= monthAgo;
        default:
          return true;
      }
    })
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

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

  const getCategoryIcon = (category: LogEntry["category"]) => {
    switch (category) {
      case "system":
        return <Settings className="w-4 h-4" />;
      case "database":
        return <Database className="w-4 h-4" />;
      case "file-import":
        return <FileText className="w-4 h-4" />;
      case "data-processing":
        return <Zap className="w-4 h-4" />;
      case "data-transformation":
        return <Zap className="w-4 h-4" />;
      case "job-management":
        return <Play className="w-4 h-4" />;
      case "user-action":
        return <User className="w-4 h-4" />;
      case "api":
        return <FileText className="w-4 h-4" />;
      case "electron":
        return <Settings className="w-4 h-4" />;
      case "ui":
        return <Eye className="w-4 h-4" />;
      case "backup":
        return <Database className="w-4 h-4" />;
      case "realtime-sync":
        return <RefreshCw className="w-4 h-4" />;
      case "data-quality":
        return <CheckCircle className="w-4 h-4" />;
      case "websocket":
        return <Database className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const handleExportLogs = () => {
    const csv = [
      ["Timestamp", "Level", "Category", "Source", "Message", "Details"],
      ...filteredLogs.map((log) => [
        log.timestamp.toISOString(),
        log.level,
        log.category,
        log.source || "",
        log.message,
        JSON.stringify(log.details || {}),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `manifold-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
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

  return (
    <div className="min-h-screen gradient-bg p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              size="sm"
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Home
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center">
                <FileText className="w-6 h-6 mr-3" />
                System Logs
              </h1>
              <span className="text-dark_cyan-400">
                Monitor application activity and errors
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleExportLogs}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-dark_cyan-100 bg-opacity-20 border border-dark_cyan-200 border-opacity-10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Total</p>
              <p className="text-2xl font-mono text-gray-900">{logs.length}</p>
            </div>
            <FileText className="w-6 h-6 text-dark_cyan-400" />
          </div>
        </div>
        <div className="bg-dark_cyan-100 bg-opacity-20 border border-dark_cyan-200 border-opacity-10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Errors</p>
              <p className="text-2xl font-mono text-red-400">
                {logCounts.error || 0}
              </p>
            </div>
            <XCircle className="w-6 h-6 text-red-400" />
          </div>
        </div>
        <div className="bg-dark_cyan-100 bg-opacity-20 border border-dark_cyan-200 border-opacity-10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Warnings</p>
              <p className="text-2xl font-mono text-yellow-400">
                {logCounts.warn || 0}
              </p>
            </div>
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
          </div>
        </div>
        <div className="bg-dark_cyan-100 bg-opacity-20 border border-dark_cyan-200 border-opacity-10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Info</p>
              <p className="text-2xl font-mono text-blue-400">
                {logCounts.info || 0}
              </p>
            </div>
            <Info className="w-6 h-6 text-blue-400" />
          </div>
        </div>
        <div className="bg-dark_cyan-100 bg-opacity-20 border border-dark_cyan-200 border-opacity-10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Debug</p>
              <p className="text-2xl font-mono text-gray-400">
                {logCounts.debug || 0}
              </p>
            </div>
            <Clock className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="bg-dark_cyan-100 bg-opacity-20 border border-dark_cyan-200 border-opacity-10 rounded-lg p-4">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex items-center space-x-4 flex-1">
              <Search className="w-4 h-4 text-dark_cyan-400" />
              <input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-dark_cyan-200 rounded-md text-black placeholder-gray-500"
              />
            </div>

            <div className="flex items-center space-x-4">
              <Filter className="w-4 h-4 text-dark_cyan-400" />

              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-3 py-2 bg-white border border-dark_cyan-200 rounded-md text-black"
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
                className="px-3 py-2 bg-white border border-dark_cyan-200 rounded-md text-black"
              >
                <option value="all">All Categories</option>
                <option value="system">System</option>
                <option value="database">Database</option>
                <option value="file-import">File Import</option>
                <option value="data-processing">Data Processing</option>
                <option value="user-action">User Action</option>
                <option value="api">API</option>
                <option value="electron">Electron</option>
                <option value="ui">UI</option>
                <option value="backup">Backup</option>
                <option value="realtime-sync">Real-time Sync</option>
                <option value="data-transformation">Data Transformation</option>
                <option value="data-quality">Data Quality</option>
                <option value="websocket">WebSocket</option>
                <option value="job-management">Job Management</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 bg-white border border-dark_cyan-200 rounded-md text-black"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Log Entries */}
      {loading ? (
        <div className="bg-dark_cyan-100 bg-opacity-20 border border-dark_cyan-200 border-opacity-10 rounded-lg p-12">
          <div className="text-center">
            <RefreshCw className="w-16 h-16 mx-auto mb-4 text-dark_cyan-400 animate-spin" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Loading logs...
            </h2>
            <p className="text-dark_cyan-400">
              Fetching log entries from the system
            </p>
          </div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-dark_cyan-100 bg-opacity-20 border border-dark_cyan-200 border-opacity-10 rounded-lg p-12">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-dark_cyan-400" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {searchTerm ||
              filterLevel !== "all" ||
              filterCategory !== "all" ||
              dateRange !== "all"
                ? "No logs match your filters"
                : "No logs available"}
            </h2>
            <p className="text-dark_cyan-400 mb-8 max-w-md mx-auto">
              {searchTerm ||
              filterLevel !== "all" ||
              filterCategory !== "all" ||
              dateRange !== "all"
                ? "Try adjusting your search criteria or filters."
                : "Log entries will appear here as your application processes data and executes jobs."}
            </p>
            {(searchTerm ||
              filterLevel !== "all" ||
              filterCategory !== "all" ||
              dateRange !== "all") && (
              <Button
                variant="primary"
                onClick={() => {
                  setSearchTerm("");
                  setFilterLevel("all");
                  setFilterCategory("all");
                  setDateRange("all");
                }}
              >
                Clear All Filters
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`bg-dark_cyan-100 bg-opacity-20 border border-dark_cyan-200 border-opacity-10 rounded-lg p-4 border-l-4 ${
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
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
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

                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(log.category)}
                    <span className="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-800 border border-gray-200">
                      {log.category}
                    </span>
                  </div>

                  <div className="flex-1">
                    <p className="font-mono text-sm font-bold text-gray-900">
                      {log.message}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-dark_cyan-400">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {getTimeAgo(log.timestamp)} •{" "}
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      {log.source && <span>Source: {log.source}</span>}
                      {log.projectId && <span>Project: {log.projectId}</span>}
                      {log.dataSourceId && (
                        <span>DataSource: {log.dataSourceId}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-1">
                  {log.details && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDetails(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {log.details && (
                <div className="mt-3 pt-3 border-t border-dark_cyan-200 border-opacity-20">
                  <details className="text-xs">
                    <summary className="font-mono font-bold cursor-pointer hover:text-blue-400 text-gray-900">
                      Show Details
                    </summary>
                    <div className="mt-2 p-2 bg-dark_cyan-900 bg-opacity-50 border border-dark_cyan-200 border-opacity-20 rounded font-mono text-xs overflow-auto text-gray-900">
                      <pre>{JSON.stringify(log.details, null, 2)}</pre>
                    </div>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination or Load More could go here */}
      {filteredLogs.length > 0 && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Logs
          </Button>
        </div>
      )}
    </div>
  );
}
