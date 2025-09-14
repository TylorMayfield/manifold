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
} from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Project, DataSource } from "../../types";
import {
  S3BackupService,
  BackupMetadata,
  S3Config,
} from "../../lib/services/S3BackupService";
import { LocalBackupService } from "../../lib/services/LocalBackupService";
import { BackupScheduler } from "../../lib/services/BackupScheduler";
import { DatabaseService } from "../../lib/services/DatabaseService";
import { logger } from "../../lib/utils/logger";

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  dataSources?: DataSource[];
}

type TabType = "backup" | "restore" | "settings";

export default function BackupRestoreModal({
  isOpen,
  onClose,
  project,
  dataSources = [],
}: BackupRestoreModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("backup");
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [s3Config, setS3Config] = useState<S3Config | null>(null);
  const [s3Configured, setS3Configured] = useState(false);
  const [backupDescription, setBackupDescription] = useState("");

  const s3Service = S3BackupService.getInstance();
  const dbService = DatabaseService.getInstance();

  useEffect(() => {
    if (isOpen && project) {
      loadBackups();
      checkS3Configuration();
    }
  }, [isOpen, project]);

  const checkS3Configuration = () => {
    const configured = s3Service.isConfigured();
    setS3Configured(configured);
    if (configured) {
      setS3Config(s3Service.getConfig());
    }
  };

  const loadBackups = async () => {
    if (!project || !s3Configured) return;

    try {
      setLoading(true);
      const backupList = await s3Service.listBackups(project.id);
      setBackups(backupList);
    } catch (error) {
      logger.error(
        "Failed to load backups",
        "backup",
        { error },
        "BackupRestoreModal"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleS3Backup = async () => {
    if (!project || !s3Configured) return;

    try {
      setLoading(true);
      await s3Service.backupProject(project, dataSources, backupDescription);
      setBackupDescription("");
      await loadBackups();

      logger.success(
        "Project backed up to S3",
        "backup",
        { projectId: project.id },
        "BackupRestoreModal"
      );
    } catch (error) {
      logger.error(
        "S3 backup failed",
        "backup",
        { error },
        "BackupRestoreModal"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleS3Restore = async (backup: BackupMetadata) => {
    if (!project) return;

    try {
      setLoading(true);
      const {
        project: restoredProject,
        dataSources: restoredDataSources,
        snapshots,
      } = await s3Service.restoreProject(backup.id, project.id);

      // Update database with restored data
      await dbService.updateProject(project.id, restoredProject);

      // Restore data sources
      for (const dataSource of restoredDataSources) {
        await dbService.updateDataSource(dataSource.id, dataSource);
      }

      // Restore snapshots (data) if they exist
      if (snapshots && snapshots.length > 0) {
        logger.info(
          "Restoring snapshots from S3 backup",
          "backup",
          { snapshotCount: snapshots.length, backupId: backup.id },
          "BackupRestoreModal"
        );

        for (const snapshot of snapshots) {
          try {
            await dbService.createSnapshot(snapshot);
            logger.info(
              "Snapshot restored from S3 backup",
              "backup",
              { snapshotId: snapshot.id, dataSourceId: snapshot.dataSourceId },
              "BackupRestoreModal"
            );
          } catch (snapshotError) {
            logger.error(
              "Failed to restore snapshot from S3 backup",
              "backup",
              { error: snapshotError, snapshotId: snapshot.id },
              "BackupRestoreModal"
            );
          }
        }
      }

      logger.success(
        "Project restored from S3",
        "backup",
        {
          projectId: project.id,
          backupId: backup.id,
          snapshotCount: snapshots?.length || 0,
        },
        "BackupRestoreModal"
      );

      onClose();
    } catch (error) {
      logger.error(
        "S3 restore failed",
        "backup",
        { error },
        "BackupRestoreModal"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileExport = async () => {
    if (!project) return;

    try {
      setLoading(true);

      const exportData = {
        project,
        dataSources,
        metadata: {
          exportedAt: new Date().toISOString(),
          version: "1.0.0",
          dataSourceCount: dataSources.length,
        },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `manifold-${project.name}-${
        new Date().toISOString().split("T")[0]
      }.json`;
      a.click();
      URL.revokeObjectURL(url);

      logger.success(
        "Project exported to file",
        "backup",
        { projectId: project.id },
        "BackupRestoreModal"
      );
    } catch (error) {
      logger.error(
        "File export failed",
        "backup",
        { error },
        "BackupRestoreModal"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !project) return;

    try {
      setLoading(true);

      const text = await file.text();
      const importData = JSON.parse(text);

      if (importData.project && importData.dataSources) {
        // Update project
        await dbService.updateProject(project.id, importData.project);

        // Note: In a real implementation, you'd also import data sources
        logger.success(
          "Project imported from file",
          "backup",
          { projectId: project.id },
          "BackupRestoreModal"
        );

        onClose();
      } else {
        throw new Error("Invalid backup file format");
      }
    } catch (error) {
      logger.error(
        "File import failed",
        "backup",
        { error },
        "BackupRestoreModal"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleS3Configure = async (config: S3Config) => {
    try {
      setLoading(true);
      await s3Service.configure(config);
      setS3Configured(true);
      setS3Config(config);
      await loadBackups();

      logger.success(
        "S3 configured successfully",
        "backup",
        {},
        "BackupRestoreModal"
      );
    } catch (error) {
      logger.error(
        "S3 configuration failed",
        "backup",
        { error },
        "BackupRestoreModal"
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
    <Modal isOpen={isOpen} onClose={onClose} title="Backup & Restore" size="lg">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex space-x-1 bg-white bg-opacity-5 rounded-lg p-1">
          {[
            { id: "backup", label: "Backup", icon: Cloud },
            { id: "restore", label: "Restore", icon: Download },
            { id: "settings", label: "Settings", icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as TabType)}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === id
                  ? "bg-white bg-opacity-10 text-white"
                  : "text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-5"
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </div>

        {/* Backup Tab */}
        {activeTab === "backup" && (
          <div className="space-y-4">
            <div className="card p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Cloud Backup (S3)
              </h3>
              {s3Configured ? (
                <div className="space-y-4">
                  <div className="flex items-center text-green-400">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span className="text-sm">S3 configured and ready</span>
                  </div>
                  {s3Config?.endpoint && (
                    <div className="text-xs text-white text-opacity-60 bg-white bg-opacity-5 rounded px-2 py-1">
                      Using custom endpoint: {s3Config.endpoint}
                    </div>
                  )}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-white text-opacity-80 mb-2">
                        Backup Description (Optional)
                      </label>
                      <input
                        type="text"
                        value={backupDescription}
                        onChange={(e) => setBackupDescription(e.target.value)}
                        placeholder="Describe this backup..."
                        className="input w-full"
                      />
                    </div>
                    <Button
                      onClick={handleS3Backup}
                      disabled={loading}
                      className="w-full"
                      icon={
                        loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Cloud className="h-4 w-4" />
                        )
                      }
                    >
                      {loading ? "Backing up..." : "Backup to S3"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                  <p className="text-white text-opacity-70 mb-4">
                    S3 backup not configured. Go to Settings to set up cloud
                    backup.
                  </p>
                  <Button
                    onClick={() => setActiveTab("settings")}
                    variant="outline"
                    icon={<Settings className="h-4 w-4" />}
                  >
                    Configure S3
                  </Button>
                </div>
              )}
            </div>

            <div className="card p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                File Export
              </h3>
              <p className="text-white text-opacity-70 mb-4">
                Export your project data to a local file for backup or sharing.
              </p>
              <Button
                onClick={handleFileExport}
                disabled={loading}
                className="w-full"
                icon={
                  loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )
                }
              >
                {loading ? "Exporting..." : "Export to File"}
              </Button>
            </div>
          </div>
        )}

        {/* Restore Tab */}
        {activeTab === "restore" && (
          <div className="space-y-4">
            {s3Configured ? (
              <div className="card p-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Restore from S3
                </h3>
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
                    <p className="text-white text-opacity-70">
                      Loading backups...
                    </p>
                  </div>
                ) : backups.length > 0 ? (
                  <div className="space-y-3">
                    {backups.map((backup) => (
                      <div
                        key={backup.id}
                        className="flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Cloud className="h-4 w-4 text-blue-400" />
                            <span className="text-sm font-medium text-white">
                              {backup.description || "Backup"}
                            </span>
                          </div>
                          <div className="text-xs text-white text-opacity-60 mt-1">
                            {formatDate(backup.timestamp)} •{" "}
                            {formatFileSize(backup.size)} •{" "}
                            {backup.dataSourceCount} data sources
                            {backup.snapshotCount &&
                              backup.snapshotCount > 0 && (
                                <>
                                  {" "}
                                  • {backup.snapshotCount} snapshots (
                                  {backup.totalRecords?.toLocaleString() || 0}{" "}
                                  records)
                                </>
                              )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleS3Restore(backup)}
                          size="sm"
                          variant="outline"
                          icon={<Download className="h-4 w-4" />}
                        >
                          Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-white text-opacity-40 mx-auto mb-4" />
                    <p className="text-white text-opacity-70">
                      No backups found
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-4">
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                  <p className="text-white text-opacity-70 mb-4">
                    S3 backup not configured. Configure S3 to restore from cloud
                    backups.
                  </p>
                  <Button
                    onClick={() => setActiveTab("settings")}
                    variant="outline"
                    icon={<Settings className="h-4 w-4" />}
                  >
                    Configure S3
                  </Button>
                </div>
              </div>
            )}

            <div className="card p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Import from File
              </h3>
              <p className="text-white text-opacity-70 mb-4">
                Import project data from a previously exported file.
              </p>
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
                <div className="w-full">
                  <Button
                    className="w-full cursor-pointer"
                    icon={<Upload className="h-4 w-4" />}
                  >
                    Choose File to Import
                  </Button>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            <div className="card p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                S3 Configuration
              </h3>
              <div className="mb-4 p-3 bg-blue-500 bg-opacity-10 border border-blue-400 border-opacity-30 rounded-lg">
                <h4 className="text-sm font-medium text-blue-400 mb-2">
                  Supported Services
                </h4>
                <div className="text-xs text-white text-opacity-80 space-y-1">
                  <div>
                    • <strong>AWS S3:</strong> Leave endpoint empty
                  </div>
                  <div>
                    • <strong>MinIO:</strong> https://your-minio-server.com
                  </div>
                  <div>
                    • <strong>DigitalOcean Spaces:</strong>{" "}
                    https://nyc3.digitaloceanspaces.com
                  </div>
                  <div>
                    • <strong>Wasabi:</strong> https://s3.wasabisys.com
                  </div>
                  <div>
                    • <strong>Backblaze B2:</strong>{" "}
                    https://s3.us-west-000.backblazeb2.com
                  </div>
                </div>
              </div>
              <S3ConfigForm
                initialConfig={s3Config}
                onConfigure={handleS3Configure}
                loading={loading}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// S3 Configuration Form Component
function S3ConfigForm({
  initialConfig,
  onConfigure,
  loading,
}: {
  initialConfig: S3Config | null;
  onConfigure: (config: S3Config) => void;
  loading: boolean;
}) {
  const [config, setConfig] = useState<S3Config>({
    accessKeyId: initialConfig?.accessKeyId || "",
    secretAccessKey: initialConfig?.secretAccessKey || "",
    region: initialConfig?.region || "us-east-1",
    bucket: initialConfig?.bucket || "",
    endpoint: initialConfig?.endpoint || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate endpoint URL if provided
    if (config.endpoint && config.endpoint.trim()) {
      try {
        const url = new URL(config.endpoint);
        if (!url.protocol.startsWith("http")) {
          alert("Endpoint URL must use HTTP or HTTPS protocol");
          return;
        }
      } catch (error) {
        alert("Please enter a valid URL for the endpoint");
        return;
      }
    }

    onConfigure(config);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white text-opacity-80 mb-2">
          Access Key ID
        </label>
        <input
          type="text"
          value={config.accessKeyId}
          onChange={(e) =>
            setConfig({ ...config, accessKeyId: e.target.value })
          }
          className="input w-full"
          placeholder="AKIA..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white text-opacity-80 mb-2">
          Secret Access Key
        </label>
        <input
          type="password"
          value={config.secretAccessKey}
          onChange={(e) =>
            setConfig({ ...config, secretAccessKey: e.target.value })
          }
          className="input w-full"
          placeholder="Your secret key"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white text-opacity-80 mb-2">
          Region
        </label>
        <input
          type="text"
          value={config.region}
          onChange={(e) => setConfig({ ...config, region: e.target.value })}
          className="input w-full"
          placeholder="us-east-1"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white text-opacity-80 mb-2">
          Bucket Name
        </label>
        <input
          type="text"
          value={config.bucket}
          onChange={(e) => setConfig({ ...config, bucket: e.target.value })}
          className="input w-full"
          placeholder="my-backup-bucket"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white text-opacity-80 mb-2">
          Endpoint URL (Optional)
        </label>
        <input
          type="url"
          value={config.endpoint || ""}
          onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
          className="input w-full"
          placeholder="https://your-s3-compatible-endpoint.com"
        />
        <p className="text-xs text-white text-opacity-60 mt-1">
          Leave empty for AWS S3. Include protocol (https://) for custom
          endpoints.
        </p>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
        icon={
          loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Settings className="h-4 w-4" />
          )
        }
      >
        {loading ? "Configuring..." : "Configure S3"}
      </Button>
    </form>
  );
}
