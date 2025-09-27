"use client";

import React, { useState, useEffect } from "react";
import {
  Cloud,
  Download,
  Upload,
  Trash2,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  RefreshCw,
} from "lucide-react";
import { S3Config, BackupMetadata } from "../../types/backup";

// Mock s3BackupService for client-side
const s3BackupService = {
  isConfigured: () => false,
  listBackups: (projectId: string) => [],
  configure: (config: any) => {},
  backupProject: (project: any, dataSources: any[], description: string) => ({
    id: "mock-backup-id",
    projectId: project.id,
    timestamp: new Date(),
    version: "1.0.0",
    description,
    size: 0,
    dataSourceCount: dataSources.length,
    snapshotCount: 0,
    totalRecords: 0,
    provider: "s3" as any,
    location: "mock-location",
  }),
  restoreProject: (backupId: string, projectId: string) => ({
    project: {
      id: projectId,
      name: "Restored Project",
      description: "Restored from backup",
      createdAt: new Date(),
      updatedAt: new Date(),
      dataPath: "/mock/path",
    },
    dataSources: [],
    snapshots: [],
  }),
  deleteBackup: (backupId: string, projectId: string) => {},
};
import { clientDatabaseService } from "../../lib/database/ClientDatabaseService";
import { clientLogger } from "../../lib/utils/ClientLogger";
import { Project, DataSource } from "../../types";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Input from "../ui/Input";

interface BackupManagerProps {
  project: Project;
  dataSources: DataSource[];
  onRestore?: (project: Project, dataSources: DataSource[]) => void;
}

const BackupManager: React.FC<BackupManagerProps> = ({
  project,
  dataSources,
  onRestore,
}) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showBackupsModal, setShowBackupsModal] = useState(false);
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<S3Config>({
    accessKeyId: "",
    secretAccessKey: "",
    region: "us-east-1",
    bucket: "",
    endpoint: "",
  });

  useEffect(() => {
    setIsConfigured(s3BackupService.isConfigured());
    if (s3BackupService.isConfigured()) {
      loadBackups();
    }
  }, [project.id]);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const backupList = await s3BackupService.listBackups(project.id);
      setBackups(backupList);
      clientLogger.success(
        "Backups loaded",
        "api",
        { count: backupList.length },
        "BackupManager"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to load backups",
        "api",
        { error },
        "BackupManager"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = async () => {
    try {
      setLoading(true);
      await s3BackupService.configure(config);
      setIsConfigured(true);
      setShowConfigModal(false);
      await loadBackups();
      clientLogger.success(
        "S3 backup configured",
        "api",
        { region: config.region, bucket: config.bucket },
        "BackupManager"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to configure S3 backup",
        "api",
        { error },
        "BackupManager"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      setLoading(true);
      const backup = await s3BackupService.backupProject(
        project,
        dataSources,
        "Manual backup"
      );
      setBackups((prev) => [backup, ...prev]);
      clientLogger.success(
        "Project backed up",
        "api",
        { backupId: backup.id },
        "BackupManager"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to backup project",
        "api",
        { error },
        "BackupManager"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (backup: BackupMetadata) => {
    try {
      setLoading(true);
      const {
        project: restoredProject,
        dataSources: restoredDataSources,
        snapshots,
      } = await s3BackupService.restoreProject(backup.id, project.id);

      // Restore snapshots if they exist
      if (snapshots && snapshots.length > 0) {
        clientLogger.info(
          "Restoring snapshots",
          "backup",
          { snapshotCount: snapshots.length, backupId: backup.id },
          "BackupManager"
        );

        const dbService = clientDatabaseService;
        for (const snapshot of snapshots as any[]) {
          try {
            await dbService.createSnapshot(project.id, snapshot);
            clientLogger.info(
              "Snapshot restored",
              "backup",
              { snapshotId: snapshot.id, dataSourceId: snapshot.dataSourceId },
              "BackupManager"
            );
          } catch (snapshotError) {
            clientLogger.error(
              "Failed to restore snapshot",
              "backup",
              { error: snapshotError, snapshotId: snapshot.id },
              "BackupManager"
            );
          }
        }
      }

      if (onRestore) {
        onRestore(restoredProject, restoredDataSources);
      }

      clientLogger.success(
        "Project restored",
        "api",
        { backupId: backup.id, snapshotCount: snapshots?.length || 0 },
        "BackupManager"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to restore project",
        "api",
        { error },
        "BackupManager"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (backup: BackupMetadata) => {
    try {
      setLoading(true);
      await s3BackupService.deleteBackup(backup.id, project.id);
      setBackups((prev) => prev.filter((b) => b.id !== backup.id));
      clientLogger.success(
        "Backup deleted",
        "api",
        { backupId: backup.id },
        "BackupManager"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to delete backup",
        "api",
        { error },
        "BackupManager"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <>
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Backup & Sync</h3>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfigModal(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
            {isConfigured && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBackupsModal(true)}
              >
                <Database className="h-4 w-4 mr-2" />
                View Backups
              </Button>
            )}
          </div>
        </div>

        {!isConfigured ? (
          <div className="text-center py-8">
            <Cloud className="mx-auto h-12 w-12 text-white/60 mb-4" />
            <p className="text-white/70 mb-4">
              Configure S3 backup to automatically sync your projects to the
              cloud
            </p>
            <Button onClick={() => setShowConfigModal(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Configure S3 Backup
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 glass-button rounded-xl">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                <div>
                  <p className="text-white font-medium">S3 Backup Configured</p>
                  <p className="text-white/60 text-sm">
                    {config.region} • {config.bucket}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white/60 text-sm">
                  {backups.length} backups
                </span>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleBackup}
                loading={loading}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Create Backup
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBackupsModal(true)}
                className="flex-1"
              >
                <Database className="h-4 w-4 mr-2" />
                Manage Backups
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Configure S3 Backup"
        size="md"
      >
        <div className="space-y-4">
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

          <Input
            label="Access Key ID"
            value={config.accessKeyId}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, accessKeyId: e.target.value }))
            }
            placeholder="AKIA..."
            type="password"
          />

          <Input
            label="Secret Access Key"
            value={config.secretAccessKey}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                secretAccessKey: e.target.value,
              }))
            }
            placeholder="Secret access key"
            type="password"
          />

          <Input
            label="Region"
            value={config.region}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, region: e.target.value }))
            }
            placeholder="us-east-1"
          />

          <Input
            label="Bucket Name"
            value={config.bucket}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, bucket: e.target.value }))
            }
            placeholder="my-backup-bucket"
          />

          <Input
            label="Endpoint URL (Optional)"
            value={config.endpoint || ""}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, endpoint: e.target.value }))
            }
            placeholder="https://s3.amazonaws.com (leave empty for AWS S3)"
          />

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={() => setShowConfigModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfigure} loading={loading}>
              Configure
            </Button>
          </div>
        </div>
      </Modal>

      {/* Backups Modal */}
      <Modal
        isOpen={showBackupsModal}
        onClose={() => setShowBackupsModal(false)}
        title="Project Backups"
        size="lg"
      >
        <div className="space-y-4">
          {backups.length === 0 ? (
            <div className="text-center py-8">
              <Database className="mx-auto h-12 w-12 text-white/60 mb-4" />
              <p className="text-white/70">No backups found</p>
            </div>
          ) : (
            backups.map((backup) => (
              <div key={backup.id} className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg glass-button-primary">
                      <Database className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        Backup {backup.id.split("-").pop()}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-white/60">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(backup.timestamp)}
                        </span>
                        <span>{formatFileSize(backup.size)}</span>
                        <span>
                          {backup.dataSourceCount} sources
                          {backup.snapshotCount && backup.snapshotCount > 0 && (
                            <> • {backup.snapshotCount} snapshots</>
                          )}
                        </span>
                      </div>
                      {backup.description && (
                        <p className="text-white/50 text-sm mt-1">
                          {backup.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(backup)}
                      loading={loading}
                    >
                      Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteBackup(backup)}
                      loading={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  );
};

export default BackupManager;
