"use client";

import { useState, useEffect } from "react";
import {
  Cloud,
  Download,
  Upload,
  Trash2,
  Settings,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Database,
  Calendar,
  HardDrive,
} from "lucide-react";
import Button from "../ui/Button";
import Textarea from "../ui/Textarea";
import { Project, DataSource } from "../../types";
import {
  ClientBackupService,
  BackupMetadata,
  RestoreResult,
} from "../../lib/services/ClientBackupService";
import { clientLogger } from "../../lib/utils/ClientLogger";
import { DataWarehouseIntegrationService } from "../../lib/services/DataWarehouseIntegrationService";

interface BackupRestorePageCleanProps {
  project?: Project | null;
  dataSources?: DataSource[];
  onRestore?: (result: RestoreResult) => void;
}

type TabType = "backup" | "restore" | "settings";

export default function BackupRestorePageClean({
  project,
  dataSources = [],
  onRestore,
}: BackupRestorePageCleanProps) {
  const [activeTab, setActiveTab] = useState<TabType>("backup");
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [backupDescription, setBackupDescription] = useState("");
  const dataWarehouseIntegration =
    DataWarehouseIntegrationService.getInstance();
  const [selectedBackupType, setSelectedBackupType] = useState<
    "csv" | "sqlite" | "full"
  >("full");
  const [includeData, setIncludeData] = useState(true);
  const [systemAvailable, setSystemAvailable] = useState(false);

  const backupService = ClientBackupService.getInstance();

  useEffect(() => {
    if (project) {
      loadBackups();
      checkSystemAvailability();
    }
  }, [project]);

  const checkSystemAvailability = async () => {
    try {
      const available = await backupService.isAvailable();
      setSystemAvailable(available);
    } catch (error) {
      clientLogger.error(
        "Failed to check backup system availability",
        "backup",
        { error },
        "BackupRestorePageClean"
      );
      setSystemAvailable(false);
    }
  };

  const loadBackups = async () => {
    if (!project) return;

    try {
      setLoading(true);
      const backupList = await backupService.getBackups(project.id);
      setBackups(backupList);
    } catch (error) {
      clientLogger.error(
        "Failed to load backups",
        "backup",
        { error },
        "BackupRestorePageClean"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!project) return;

    try {
      setLoading(true);
      const jobId = await backupService.createBackup(project, dataSources, {
        type: selectedBackupType,
        description: backupDescription,
        includeData,
      });

      setBackupDescription("");

      // Integrate with data warehouse services
      await dataWarehouseIntegration.onBackupCreated(
        jobId,
        project.id,
        dataSources
      );

      // Refresh backups after a short delay to allow job to complete
      setTimeout(() => {
        loadBackups();
      }, 2000);

      clientLogger.success(
        "Backup job created",
        "backup",
        { jobId, projectId: project.id },
        "BackupRestorePageClean"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to create backup",
        "backup",
        { error },
        "BackupRestorePageClean"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (backup: BackupMetadata) => {
    if (!project) return;

    if (
      !window.confirm(
        `Are you sure you want to restore from backup "${
          backup.description || backup.id
        }"? This will overwrite current project data.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const result = await backupService.restoreFromBackup(
        backup.id,
        project.id,
        {
          overwriteExisting: true,
          restoreSnapshots: true,
        }
      );

      // Integrate with data warehouse services
      await dataWarehouseIntegration.onBackupRestored(
        backup.id,
        project.id,
        dataSources
      );

      if (result.success && onRestore) {
        onRestore(result);
      }

      clientLogger.success(
        "Backup restored",
        "backup",
        { backupId: backup.id, projectId: project.id },
        "BackupRestorePageClean"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to restore backup",
        "backup",
        { error },
        "BackupRestorePageClean"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (backup: BackupMetadata) => {
    if (!project) return;

    if (
      !window.confirm(
        `Are you sure you want to delete backup "${
          backup.description || backup.id
        }"?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await backupService.deleteBackup(backup.id, project.id);
      await loadBackups();

      clientLogger.success(
        "Backup deleted",
        "backup",
        { backupId: backup.id },
        "BackupRestorePageClean"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to delete backup",
        "backup",
        { error },
        "BackupRestorePageClean"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-apricot-400" />;
      case "running":
        return <Loader2 className="h-4 w-4 text-tangerine-400 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-jasper-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-dark_cyan-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sqlite":
        return <Database className="h-4 w-4" />;
      case "csv":
        return <FileText className="h-4 w-4" />;
      case "full":
        return <HardDrive className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (!systemAvailable) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-jasper-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Backup System Unavailable
          </h3>
          <p className="text-dark_cyan-400 mb-6 max-w-md mx-auto">
            The backup system is not available. Please check your database
            connection and try again.
          </p>
          <Button onClick={checkSystemAvailability} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-dark_cyan-500 via-dark_cyan-400 to-dark_cyan-600">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-dark_cyan-200 border-opacity-20 bg-dark_cyan-300 bg-opacity-10 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Backup & Restore
          </h1>
          <p className="text-dark_cyan-300 text-sm">
            Manage your project backups and data recovery
          </p>
        </div>
        <Button
          onClick={loadBackups}
          variant="ghost"
          size="sm"
          icon={<RefreshCw className="h-4 w-4" />}
          disabled={loading}
          className="hover:bg-dark_cyan-300 hover:bg-opacity-20"
        >
          Refresh
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8 space-y-8">
          {/* Overview Section */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">
              Backup Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Local Backup Card */}
              <div className="glass-card p-6 hover:bg-dark_cyan-300 hover:bg-opacity-25 transition-all duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-apricot-500/20 backdrop-blur-sm">
                    <Database className="h-6 w-6 text-apricot-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Local Backup
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-apricot-400" />
                    <span className="text-sm text-dark_cyan-400">
                      Available
                    </span>
                  </div>
                  <div className="text-xs text-dark_cyan-500">
                    Stored in SQLite database
                  </div>
                </div>
              </div>

              {/* Recent Backups Card */}
              <div className="glass-card p-6 hover:bg-dark_cyan-300 hover:bg-opacity-25 transition-all duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-dark_cyan-500/20 backdrop-blur-sm">
                    <Download className="h-6 w-6 text-dark_cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Recent Backups
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-white">
                    {backups.length}
                  </div>
                  <div className="text-xs text-dark_cyan-500">
                    Available for restore
                  </div>
                </div>
              </div>

              {/* System Status Card */}
              <div className="glass-card p-6 hover:bg-dark_cyan-300 hover:bg-opacity-25 transition-all duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-tangerine-500/20 backdrop-blur-sm">
                    <Settings className="h-6 w-6 text-tangerine-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    System Status
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-apricot-400" />
                    <span className="text-sm text-dark_cyan-400">
                      Operational
                    </span>
                  </div>
                  <div className="text-xs text-dark_cyan-500">
                    Prisma SQLite system
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">
              Backup Operations
            </h2>
            <div className="flex items-center gap-1 bg-dark_cyan-300/10 rounded-xl p-1 backdrop-blur-sm">
              {[
                { id: "backup", label: "Create Backup", icon: Cloud },
                { id: "restore", label: "Restore Data", icon: Download },
                { id: "settings", label: "Settings", icon: Settings },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as TabType)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-200 rounded-lg ${
                    activeTab === id
                      ? "text-white bg-tangerine-500 shadow-lg backdrop-blur-sm"
                      : "text-dark_cyan-400 hover:text-white hover:bg-dark_cyan-300 hover:bg-opacity-20 hover:shadow-md"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-8 mt-8">
            {/* Backup Tab */}
            {activeTab === "backup" && (
              <div className="glass-card p-8 hover:bg-dark_cyan-300 hover:bg-opacity-25 transition-all duration-200">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-tangerine-500/20 backdrop-blur-sm">
                    <Cloud className="h-7 w-7 text-tangerine-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Create New Backup
                    </h3>
                    <p className="text-sm text-dark_cyan-400">
                      Create a backup of your project data
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Backup Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      Backup Type
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {backupService.getSupportedTypes().map((type) => (
                        <button
                          key={type.value}
                          onClick={() =>
                            setSelectedBackupType(type.value as any)
                          }
                          className={`p-4 rounded-xl border transition-all text-left ${
                            selectedBackupType === type.value
                              ? "border-tangerine-500/50 bg-tangerine-500/10"
                              : "border-dark_cyan-200/20 bg-dark_cyan-300/5 hover:bg-dark_cyan-300/10"
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            {getTypeIcon(type.value)}
                            <h4 className="text-white font-medium">
                              {type.label}
                            </h4>
                          </div>
                          <p className="text-xs text-dark_cyan-400">
                            {type.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={includeData}
                        onChange={(e) => setIncludeData(e.target.checked)}
                        className="w-4 h-4 text-tangerine-600 bg-dark_cyan-300/10 border-dark_cyan-200/20 rounded focus:ring-tangerine-500"
                      />
                      <span className="text-sm text-white">
                        Include snapshot data
                      </span>
                    </label>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Backup Description
                    </label>
                    <Textarea
                      value={backupDescription}
                      onChange={(e) => setBackupDescription(e.target.value)}
                      placeholder="e.g., Before major changes, Weekly backup..."
                      rows={3}
                      className="w-full"
                    />
                  </div>

                  {/* Create Button */}
                  <Button
                    onClick={handleCreateBackup}
                    disabled={loading || !project}
                    className="w-full"
                    icon={
                      loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Cloud className="h-4 w-4" />
                      )
                    }
                  >
                    {loading ? "Creating Backup..." : "Create Backup"}
                  </Button>
                </div>
              </div>
            )}

            {/* Restore Tab */}
            {activeTab === "restore" && (
              <div className="glass-card p-8 hover:bg-dark_cyan-300 hover:bg-opacity-25 transition-all duration-200">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-apricot-500/20 backdrop-blur-sm">
                    <Download className="h-7 w-7 text-apricot-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Restore from Backup
                    </h3>
                    <p className="text-sm text-dark_cyan-400">
                      Restore your project from a previous backup
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-12 w-12 text-tangerine-400 animate-spin mx-auto mb-4" />
                    <p className="text-dark_cyan-400">Loading backups...</p>
                  </div>
                ) : backups.length === 0 ? (
                  <div className="text-center py-12">
                    <Download className="h-16 w-16 text-dark_cyan-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-white mb-2">
                      No Backups Found
                    </h4>
                    <p className="text-dark_cyan-400 max-w-sm mx-auto">
                      No backups available for this project. Create a backup
                      first.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {backups.map((backup) => (
                      <div
                        key={backup.id}
                        className="flex items-center justify-between p-5 rounded-xl bg-dark_cyan-300 bg-opacity-10 border border-dark_cyan-200 border-opacity-20 hover:bg-dark_cyan-300 hover:bg-opacity-25 hover:shadow-lg transition-all duration-200 backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-apricot-500/20 backdrop-blur-sm">
                            {getTypeIcon(backup.type)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {backup.description ||
                                `Backup ${backup.id.slice(0, 8)}`}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-dark_cyan-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(backup.timestamp)}
                              </span>
                              <span>{formatFileSize(backup.size)}</span>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(backup.status)}
                                {backup.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={() => handleRestoreBackup(backup)}
                            disabled={loading || backup.status !== "completed"}
                            size="sm"
                            variant="outline"
                            icon={<Upload className="h-4 w-4" />}
                            className="hover:bg-tangerine-500 hover:bg-opacity-20 hover:border-tangerine-400"
                          >
                            Restore
                          </Button>
                          <Button
                            onClick={() => handleDeleteBackup(backup)}
                            disabled={loading}
                            size="sm"
                            variant="ghost"
                            icon={
                              <Trash2 className="h-4 w-4 text-jasper-400" />
                            }
                            className="hover:bg-jasper-500 hover:bg-opacity-20"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="glass-card p-8 hover:bg-dark_cyan-300 hover:bg-opacity-25 transition-all duration-200">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-tangerine-500/20 backdrop-blur-sm">
                    <Settings className="h-7 w-7 text-tangerine-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Backup Settings
                    </h3>
                    <p className="text-sm text-dark_cyan-400">
                      Configure backup preferences and options
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-apricot-500/10 rounded-lg border border-apricot-400/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-apricot-400" />
                      <span className="text-sm font-medium text-white">
                        SQLite Database System
                      </span>
                    </div>
                    <div className="text-xs text-dark_cyan-400">
                      Backups are stored in your SQLite database and persist
                      across application restarts.
                    </div>
                  </div>

                  <div className="text-sm text-dark_cyan-400">
                    <p className="mb-2">Supported backup formats:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>
                        <strong>Full Backup:</strong> Complete project backup
                        with all data and metadata
                      </li>
                      <li>
                        <strong>SQLite Export:</strong> Export project database
                        as SQLite file
                      </li>
                      <li>
                        <strong>CSV Export:</strong> Export project data as CSV
                        files
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
