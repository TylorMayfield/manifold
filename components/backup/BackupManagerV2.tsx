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
  Loader2,
} from "lucide-react";
import { Project, DataSource } from "../../types";
import {
  ClientBackupService,
  BackupMetadata,
} from "../../lib/services/ClientBackupService";
import { clientLogger } from "../../lib/utils/ClientLogger";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface BackupManagerV2Props {
  project: Project;
  dataSources: DataSource[];
  onRestore?: (result: any) => void;
}

export const BackupManagerV2: React.FC<BackupManagerV2Props> = ({
  project,
  dataSources,
  onRestore,
}) => {
  const [showBackupsModal, setShowBackupsModal] = useState(false);
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [systemAvailable, setSystemAvailable] = useState(false);

  const backupService = ClientBackupService.getInstance();

  useEffect(() => {
    checkSystemAvailability();
    if (showBackupsModal) {
      loadBackups();
    }
  }, [project.id, showBackupsModal]);

  const checkSystemAvailability = async () => {
    try {
      const available = await backupService.isAvailable();
      setSystemAvailable(available);
    } catch (error) {
      clientLogger.error(
        "Failed to check backup system availability",
        "backup",
        { error },
        "BackupManagerV2"
      );
      setSystemAvailable(false);
    }
  };

  const loadBackups = async () => {
    try {
      setLoading(true);
      const backupList = await backupService.getBackups(project.id);
      setBackups(backupList);
      clientLogger.success(
        "Backups loaded",
        "backup",
        { count: backupList.length },
        "BackupManagerV2"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to load backups",
        "backup",
        { error },
        "BackupManagerV2"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      const jobId = await backupService.createBackup(project, dataSources, {
        type: "full",
        description: "Manual backup",
        includeData: true,
      });

      // Refresh backups after a short delay
      setTimeout(() => {
        loadBackups();
      }, 2000);

      clientLogger.success(
        "Backup job created",
        "backup",
        { jobId },
        "BackupManagerV2"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to create backup",
        "backup",
        { error },
        "BackupManagerV2"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (backup: BackupMetadata) => {
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

      if (result.success && onRestore) {
        onRestore(result);
      }

      clientLogger.success(
        "Backup restored",
        "backup",
        { backupId: backup.id },
        "BackupManagerV2"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to restore backup",
        "backup",
        { error },
        "BackupManagerV2"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (backup: BackupMetadata) => {
    try {
      setLoading(true);
      await backupService.deleteBackup(backup.id, project.id);
      await loadBackups();

      clientLogger.success(
        "Backup deleted",
        "backup",
        { backupId: backup.id },
        "BackupManagerV2"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to delete backup",
        "backup",
        { error },
        "BackupManagerV2"
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  if (!systemAvailable) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <p className="text-white/70 mb-4">Backup system is not available</p>
          <Button onClick={checkSystemAvailability} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Backup & Restore</h3>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowBackupsModal(true)}
            >
              <Database className="h-4 w-4 mr-2" />
              View Backups
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 glass-button rounded-xl">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
              <div>
                <p className="text-white font-medium">SQLite Backup System</p>
                <p className="text-white/60 text-sm">
                  {backups.length} backups available
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white/60 text-sm">
                {backups.filter((b) => b.status === "completed").length}{" "}
                completed
              </span>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleCreateBackup}
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
      </div>

      {/* Backups Modal */}
      <Modal
        isOpen={showBackupsModal}
        onClose={() => setShowBackupsModal(false)}
        title="Project Backups"
        size="lg"
      >
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="mx-auto h-12 w-12 text-blue-400 animate-spin mb-4" />
              <p className="text-white/70">Loading backups...</p>
            </div>
          ) : backups.length === 0 ? (
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
                        {backup.description ||
                          `Backup ${backup.id.split("-").pop()}`}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-white/60">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(backup.timestamp)}
                        </span>
                        <span>{formatFileSize(backup.size)}</span>
                        <span className="flex items-center">
                          {getStatusIcon(backup.status)}
                          <span className="ml-1">{backup.status}</span>
                        </span>
                        <span>
                          {backup.dataSourceCount} sources
                          {backup.snapshotCount && backup.snapshotCount > 0 && (
                            <> • {backup.snapshotCount} snapshots</>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(backup)}
                      loading={loading}
                      disabled={backup.status !== "completed"}
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

export default BackupManagerV2;
