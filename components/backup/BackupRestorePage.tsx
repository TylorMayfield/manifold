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
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import { Project, DataSource } from "../../types";
import {
  ClientBackupService,
  BackupMetadata,
} from "../../lib/services/ClientBackupService";
import { clientDatabaseService } from "../../lib/database/ClientDatabaseService";
import { clientLogger } from "../../lib/utils/ClientLogger";

interface BackupRestorePageProps {
  project?: Project | null;
  dataSources?: DataSource[];
}

type TabType = "backup" | "restore" | "settings";

export default function BackupRestorePage({
  project,
  dataSources = [],
}: BackupRestorePageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("backup");
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [backupDescription, setBackupDescription] = useState("");
  const [systemAvailable, setSystemAvailable] = useState(false);
  const [s3Configured, setS3Configured] = useState(false);
  const [s3Config, setS3Config] = useState<any>(null);

  const backupService = ClientBackupService.getInstance();
  const dbService = clientDatabaseService;

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
        "BackupRestorePage"
      );
      setSystemAvailable(false);
    }
  };

  const loadBackups = async () => {
    if (!project || !s3Configured) return;

    try {
      setLoading(true);
      const backupList = await backupService.getBackups(project.id);
      setBackups(backupList);
    } catch (error) {
      clientLogger.error(
        "Failed to load backups",
        "backup",
        { error },
        "BackupRestorePage"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleS3Backup = async () => {
    if (!project || !s3Configured) return;

    try {
      setLoading(true);
      await backupService.createBackup(project, dataSources, {
        description: backupDescription,
      });
      setBackupDescription("");
      await loadBackups();

      clientLogger.success(
        "Project backed up to S3",
        "backup",
        { projectId: project.id },
        "BackupRestorePage"
      );
    } catch (error) {
      clientLogger.error(
        "S3 backup failed",
        "backup",
        { error },
        "BackupRestorePage"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleS3Restore = async (backup: BackupMetadata) => {
    if (!project) return;

    try {
      setLoading(true);
      const restoredData = await backupService.restoreFromBackup(
        backup.id,
        project.id,
        { overwriteExisting: true, restoreSnapshots: true }
      );

      // Update project and data sources
      if (restoredData.project) {
        await dbService.updateProject(
          restoredData.project.id,
          restoredData.project
        );
      }

      if (restoredData.dataSources && restoredData.dataSources.length > 0) {
        for (const dataSource of restoredData.dataSources) {
          await dbService.updateDataSource(
            project.id,
            dataSource.id,
            dataSource
          );
        }
      }

      clientLogger.success(
        "Project restored from S3",
        "backup",
        { projectId: project.id, backupId: backup.id },
        "BackupRestorePage"
      );
    } catch (error) {
      clientLogger.error(
        "S3 restore failed",
        "backup",
        { error },
        "BackupRestorePage"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (backup: BackupMetadata) => {
    if (!project) return;

    try {
      setLoading(true);
      await backupService.deleteBackup(backup.id, project.id);
      await loadBackups();

      clientLogger.success(
        "Backup deleted",
        "backup",
        { backupId: backup.id },
        "BackupRestorePage"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to delete backup",
        "backup",
        { error },
        "BackupRestorePage"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLocalBackup = async () => {
    if (!project) return;

    try {
      setLoading(true);
      await backupService.createBackup(project, dataSources, {
        description: backupDescription,
      });
      setBackupDescription("");

      clientLogger.success(
        "Project backed up locally",
        "backup",
        { projectId: project.id },
        "BackupRestorePage"
      );
    } catch (error) {
      clientLogger.error(
        "Local backup failed",
        "backup",
        { error },
        "BackupRestorePage"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLocalRestore = async () => {
    if (!project) return;

    if (
      !window.confirm(
        "Are you sure you want to restore from local backup? This will overwrite current project data."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      // For local backups, we'll use a simple approach - restore the latest backup
      const restoredData = await backupService.restoreFromBackup(
        "latest",
        project.id,
        { overwriteExisting: true, restoreSnapshots: true }
      );

      // Update project and data sources
      if (restoredData.project) {
        await dbService.updateProject(
          restoredData.project.id,
          restoredData.project
        );
      }

      if (restoredData.dataSources && restoredData.dataSources.length > 0) {
        for (const dataSource of restoredData.dataSources) {
          await dbService.updateDataSource(
            project.id,
            dataSource.id,
            dataSource
          );
        }
      }

      clientLogger.success(
        "Project restored from local backup",
        "backup",
        { projectId: project.id },
        "BackupRestorePage"
      );
    } catch (error) {
      clientLogger.error(
        "Local restore failed",
        "backup",
        { error },
        "BackupRestorePage"
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
              {/* Backup Status Card */}
              <div className="glass-card p-6 hover:bg-dark_cyan-300 hover:bg-opacity-25 transition-all duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-tangerine-500/20 backdrop-blur-sm">
                    <Cloud className="h-6 w-6 text-tangerine-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Cloud Backup
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {s3Configured ? (
                      <CheckCircle className="h-4 w-4 text-apricot-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-jasper-400" />
                    )}
                    <span className="text-sm text-dark_cyan-400">
                      {s3Configured ? "Configured" : "Not configured"}
                    </span>
                  </div>
                  {s3Configured && (
                    <div className="text-xs text-dark_cyan-500">
                      {s3Config?.bucket} • {s3Config?.region}
                    </div>
                  )}
                </div>
              </div>

              {/* Local Backup Card */}
              <div className="glass-card p-6 hover:bg-dark_cyan-300 hover:bg-opacity-25 transition-all duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-apricot-500/20 backdrop-blur-sm">
                    <FileText className="h-6 w-6 text-apricot-400" />
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
                { id: "settings", label: "Configuration", icon: Settings },
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Cloud Backup */}
                <div className="glass-card p-8 hover:bg-dark_cyan-300 hover:bg-opacity-25 transition-all duration-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-tangerine-500/20 backdrop-blur-sm">
                      <Cloud className="h-7 w-7 text-tangerine-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        Cloud Backup
                      </h3>
                      <p className="text-sm text-dark_cyan-400">
                        Store backups securely in AWS S3
                      </p>
                    </div>
                  </div>

                  {!s3Configured ? (
                    <div className="text-center py-12">
                      <Cloud className="h-16 w-16 text-dark_cyan-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-white mb-2">
                        S3 Not Configured
                      </h4>
                      <p className="text-dark_cyan-400 mb-6 max-w-sm mx-auto">
                        Configure your AWS S3 settings to enable cloud backups
                        for secure, off-site storage.
                      </p>
                      <Button
                        onClick={() => setActiveTab("settings")}
                        variant="outline"
                        icon={<Settings className="h-4 w-4" />}
                      >
                        Configure S3
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Backup Description
                        </label>
                        <Textarea
                          value={backupDescription}
                          onChange={(e) => setBackupDescription(e.target.value)}
                          placeholder="e.g., Before major data migration, Weekly backup..."
                          rows={3}
                          className="w-full"
                        />
                      </div>
                      <Button
                        onClick={handleS3Backup}
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
                        {loading
                          ? "Creating Cloud Backup..."
                          : "Create Cloud Backup"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Local Backup */}
                <div className="glass-card p-8 hover:bg-dark_cyan-300 hover:bg-opacity-25 transition-all duration-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-apricot-500/20 backdrop-blur-sm">
                      <FileText className="h-7 w-7 text-apricot-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        Local Backup
                      </h3>
                      <p className="text-sm text-dark_cyan-400">
                        Store backups in local SQLite database
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Backup Description
                      </label>
                      <Textarea
                        value={backupDescription}
                        onChange={(e) => setBackupDescription(e.target.value)}
                        placeholder="e.g., Quick snapshot, Before testing..."
                        rows={3}
                        className="w-full"
                      />
                    </div>
                    <Button
                      onClick={handleLocalBackup}
                      disabled={loading || !project}
                      variant="outline"
                      className="w-full"
                      icon={
                        loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )
                      }
                    >
                      {loading
                        ? "Creating Local Backup..."
                        : "Create Local Backup"}
                    </Button>
                  </div>

                  <div className="mt-6 p-4 bg-dark_cyan-500/10 rounded-lg border border-dark_cyan-200/20">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-tangerine-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-dark_cyan-400">
                        <strong>Note:</strong> Local backups are stored in your
                        SQLite database and persist across application restarts.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Restore Tab */}
            {activeTab === "restore" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Cloud Backups */}
                <div className="glass-card p-8 hover:bg-dark_cyan-300 hover:bg-opacity-25 transition-all duration-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-tangerine-500/20 backdrop-blur-sm">
                      <Cloud className="h-7 w-7 text-tangerine-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        Cloud Backups
                      </h3>
                      <p className="text-sm text-dark_cyan-400">
                        Restore from AWS S3 storage
                      </p>
                    </div>
                  </div>

                  {!s3Configured ? (
                    <div className="text-center py-12">
                      <Cloud className="h-16 w-16 text-dark_cyan-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-white mb-2">
                        S3 Not Configured
                      </h4>
                      <p className="text-dark_cyan-400 mb-6 max-w-sm mx-auto">
                        Configure S3 settings to access cloud backups.
                      </p>
                      <Button
                        onClick={() => setActiveTab("settings")}
                        variant="outline"
                        icon={<Settings className="h-4 w-4" />}
                      >
                        Configure S3
                      </Button>
                    </div>
                  ) : loading ? (
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
                        No cloud backups available for this project. Create a
                        backup first.
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
                            <div className="p-3 rounded-xl bg-tangerine-500/20 backdrop-blur-sm">
                              <Cloud className="h-5 w-5 text-tangerine-400" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">
                                {backup.description ||
                                  `Backup ${backup.id.slice(0, 8)}`}
                              </div>
                              <div className="text-xs text-dark_cyan-400">
                                {formatDate(backup.timestamp)} •{" "}
                                {formatFileSize(backup.size)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              onClick={() => handleS3Restore(backup)}
                              disabled={loading}
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

                {/* Local Restore */}
                <div className="glass-card p-8 hover:bg-dark_cyan-300 hover:bg-opacity-25 transition-all duration-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-apricot-500/20 backdrop-blur-sm">
                      <FileText className="h-7 w-7 text-apricot-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        Local Restore
                      </h3>
                      <p className="text-sm text-dark_cyan-400">
                        Restore from local SQLite database
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-apricot-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-white mb-2">
                        Local Database Backup
                      </h4>
                      <p className="text-dark_cyan-400 mb-6 max-w-sm mx-auto">
                        Restore the latest local backup stored in your SQLite
                        database.
                      </p>
                    </div>

                    <Button
                      onClick={handleLocalRestore}
                      disabled={loading}
                      variant="outline"
                      className="w-full"
                      icon={
                        loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )
                      }
                    >
                      {loading ? "Restoring..." : "Restore Local Backup"}
                    </Button>
                  </div>

                  <div className="mt-6 p-4 bg-dark_cyan-500/10 rounded-lg border border-dark_cyan-200/20">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-tangerine-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-dark_cyan-400">
                        <strong>Warning:</strong> Restoring will overwrite your
                        current project data. Make sure to create a backup
                        first.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-8">
                <div className="glass-card p-8 hover:bg-dark_cyan-300 hover:bg-opacity-25 transition-all duration-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="h-5 w-5 text-tangerine-400" />
                    <h3 className="text-lg font-semibold text-white">
                      S3 Configuration
                    </h3>
                  </div>

                  {s3Configured ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-apricot-500/10 border border-apricot-400/20">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-apricot-400" />
                          <span className="text-sm font-medium text-white">
                            S3 is configured
                          </span>
                        </div>
                        <div className="text-xs text-dark_cyan-400">
                          Bucket: {s3Config?.bucket}
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          // This would open a configuration modal or page
                          console.log("Configure S3 settings");
                        }}
                        variant="outline"
                        icon={<Settings className="h-4 w-4" />}
                      >
                        Update Configuration
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-jasper-500/10 border border-jasper-400/20">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-jasper-400" />
                          <span className="text-sm font-medium text-white">
                            S3 is not configured
                          </span>
                        </div>
                        <div className="text-xs text-dark_cyan-400">
                          Configure S3 to enable cloud backup functionality.
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          // This would open a configuration modal or page
                          console.log("Configure S3 settings");
                        }}
                        icon={<Settings className="h-4 w-4" />}
                      >
                        Configure S3
                      </Button>
                    </div>
                  )}
                </div>

                <div className="glass-card p-8 hover:bg-dark_cyan-300 hover:bg-opacity-25 transition-all duration-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-apricot-500/20 backdrop-blur-sm">
                      <FileText className="h-6 w-6 text-apricot-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      Local Backup Settings
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm text-dark_cyan-400">
                      Local backups are stored in your SQLite database and are
                      available offline with full persistence.
                    </div>
                    <div className="text-xs text-dark_cyan-500">
                      Note: Local backups are stored in the application's data
                      directory and persist across application restarts and
                      updates.
                    </div>
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
