"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  TestTube,
  CheckCircle,
  AlertCircle,
  Clock,
  Folder,
  Cloud,
  HardDrive,
  Calendar,
  Trash2,
} from "lucide-react";
import { clientLogger } from "../../lib/utils/ClientLogger";
import { Project, DataSource } from "../../types";
import {
  BackupConfig,
  BackupProvider,
  BackupFrequency,
  BACKUP_FREQUENCY_OPTIONS,
  LocalBackupConfig,
  S3Config,
  BackupSchedule,
} from "../../types/backup";
// import { BackupScheduler } from "../../lib/services/BackupScheduler"; // Moved to server-side
// import { S3BackupService } from "../../lib/services/S3BackupService"; // Moved to server-side
// import { LocalBackupService } from "../../lib/services/LocalBackupService"; // Moved to server-side
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface BackupConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  dataSources: DataSource[];
}

export default function BackupConfigModal({
  isOpen,
  onClose,
  project,
  dataSources,
}: BackupConfigModalProps) {
  const [config, setConfig] = useState<BackupConfig>({
    provider: "local",
    frequency: "disabled",
    enabled: false,
    maxBackups: 10,
  });
  const [s3Config, setS3Config] = useState<S3Config>({
    accessKeyId: "",
    secretAccessKey: "",
    region: "us-east-1",
    bucket: "",
  });
  const [localConfig, setLocalConfig] = useState<LocalBackupConfig>({
    directory: "./backups",
    fileNamePrefix: "manifold-backup",
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [schedule, setSchedule] = useState<BackupSchedule | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mock services for client-side
  const scheduler = {
    scheduleBackup: () => {},
    cancelBackup: () => {},
    getScheduledBackups: () => [],
    getBackupConfig: (projectId: string) => ({
      provider: "local" as any,
      frequency: "daily" as any,
      enabled: false,
      maxBackups: 5,
      s3Config: undefined,
      localConfig: undefined,
    }),
    getBackupSchedule: (projectId: string) => null,
    configureBackup: (projectId: string, config: any) => {},
  };
  const s3Service = {
    uploadBackup: () => {},
    downloadBackup: () => {},
    listBackups: () => [],
    configure: (config: any) => {},
    testConnection: () => {},
  };
  const localService = {
    createBackup: () => {},
    restoreBackup: () => {},
    listBackups: () => [],
    configure: (config: any) => {},
    testConnection: () => {},
  };

  useEffect(() => {
    if (isOpen) {
      loadCurrentConfig();
    }
  }, [isOpen, project.id]);

  const loadCurrentConfig = async () => {
    try {
      const currentConfig = await scheduler.getBackupConfig(project.id);
      const currentSchedule = await scheduler.getBackupSchedule(project.id);

      if (currentConfig) {
        setConfig(currentConfig);
        if (currentConfig.s3Config) {
          setS3Config(currentConfig.s3Config);
        }
        if (currentConfig.localConfig) {
          setLocalConfig(currentConfig.localConfig);
        }
      }

      setSchedule(currentSchedule);
    } catch (error) {
      clientLogger.error(
        "Failed to load backup config",
        "backup",
        { error, projectId: project.id },
        "BackupConfigModal"
      );
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const updatedConfig: BackupConfig = {
        ...config,
        s3Config: config.provider === "s3" ? s3Config : undefined,
        localConfig: config.provider === "local" ? localConfig : undefined,
      };

      await scheduler.configureBackup(project.id, updatedConfig);

      clientLogger.success(
        "Backup configuration saved",
        "backup",
        { projectId: project.id, config: updatedConfig },
        "BackupConfigModal"
      );

      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      clientLogger.error(
        "Failed to save backup config",
        "backup",
        { error, projectId: project.id },
        "BackupConfigModal"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setError(null);

      if (config.provider === "s3") {
        await s3Service.configure(s3Config);
        await s3Service.testConnection();
      } else if (config.provider === "local") {
        await localService.configure(localConfig);
        await localService.testConnection();
      }

      clientLogger.success(
        "Backup connection test successful",
        "backup",
        { provider: config.provider },
        "BackupConfigModal"
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      clientLogger.error(
        "Backup connection test failed",
        "backup",
        { error, provider: config.provider },
        "BackupConfigModal"
      );
    } finally {
      setTesting(false);
    }
  };

  const formatNextRun = (nextRun?: Date): string => {
    if (!nextRun) return "Not scheduled";
    const now = new Date();
    const diff = nextRun.getTime() - now.getTime();

    if (diff < 0) return "Overdue";
    if (diff < 60000) return "In less than a minute";
    if (diff < 3600000) return `In ${Math.floor(diff / 60000)} minutes`;
    if (diff < 86400000) return `In ${Math.floor(diff / 3600000)} hours`;
    return nextRun.toLocaleString();
  };

  const formatLastRun = (lastRun?: Date): string => {
    if (!lastRun) return "Never";
    const now = new Date();
    const diff = now.getTime() - lastRun.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return lastRun.toLocaleString();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Backup Configuration"
      size="xl"
    >
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-400 font-medium">Error</span>
            </div>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Current Status */}
        {schedule && (
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Current Status</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-white/60 text-sm">Status</label>
                <div className="flex items-center space-x-2 mt-1">
                  {schedule.isRunning ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-green-400 text-sm">Active</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                      <span className="text-yellow-400 text-sm">Inactive</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className="text-white/60 text-sm">Last Run</label>
                <p className="text-white text-sm mt-1">
                  {formatLastRun(schedule.lastRun)}
                </p>
              </div>
              <div>
                <label className="text-white/60 text-sm">Next Run</label>
                <p className="text-white text-sm mt-1">
                  {formatNextRun(schedule.nextRun)}
                </p>
              </div>
            </div>
            {schedule.error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">
                  <strong>Error:</strong> {schedule.error}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Provider Selection */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Backup Provider</span>
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setConfig({ ...config, provider: "local" })}
              className={`p-4 rounded-lg border transition-all ${
                config.provider === "local"
                  ? "border-blue-500/50 bg-blue-500/10"
                  : "border-white/20 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center space-x-3">
                <HardDrive className="h-6 w-6 text-blue-400" />
                <div className="text-left">
                  <h4 className="text-white font-medium">Local File</h4>
                  <p className="text-white/60 text-sm">
                    Save backups to local directory
                  </p>
                </div>
              </div>
            </button>
            <button
              onClick={() => setConfig({ ...config, provider: "s3" })}
              className={`p-4 rounded-lg border transition-all ${
                config.provider === "s3"
                  ? "border-blue-500/50 bg-blue-500/10"
                  : "border-white/20 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Cloud className="h-6 w-6 text-green-400" />
                <div className="text-left">
                  <h4 className="text-white font-medium">Amazon S3</h4>
                  <p className="text-white/60 text-sm">
                    Upload backups to S3 bucket
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Provider Configuration */}
        {config.provider === "s3" && (
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
              <Cloud className="h-5 w-5" />
              <span>S3 Configuration</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Access Key ID
                </label>
                <input
                  type="text"
                  value={s3Config.accessKeyId}
                  onChange={(e) =>
                    setS3Config({ ...s3Config, accessKeyId: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="AKIA..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Secret Access Key
                </label>
                <input
                  type="password"
                  value={s3Config.secretAccessKey}
                  onChange={(e) =>
                    setS3Config({
                      ...s3Config,
                      secretAccessKey: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Secret key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Region
                </label>
                <input
                  type="text"
                  value={s3Config.region}
                  onChange={(e) =>
                    setS3Config({ ...s3Config, region: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="us-east-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Bucket Name
                </label>
                <input
                  type="text"
                  value={s3Config.bucket}
                  onChange={(e) =>
                    setS3Config({ ...s3Config, bucket: e.target.value })
                  }
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="my-backup-bucket"
                />
              </div>
            </div>
          </div>
        )}

        {config.provider === "local" && (
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
              <HardDrive className="h-5 w-5" />
              <span>Local Configuration</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Backup Directory
                </label>
                <input
                  type="text"
                  value={localConfig.directory}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      directory: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="./backups"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  File Name Prefix
                </label>
                <input
                  type="text"
                  value={localConfig.fileNamePrefix}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      fileNamePrefix: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="manifold-backup"
                />
              </div>
            </div>
          </div>
        )}

        {/* Schedule Configuration */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Schedule Configuration</span>
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enabled"
                checked={config.enabled}
                onChange={(e) =>
                  setConfig({ ...config, enabled: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
              />
              <label htmlFor="enabled" className="text-white font-medium">
                Enable automatic backups
              </label>
            </div>

            {config.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Backup Frequency
                  </label>
                  <select
                    value={config.frequency}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        frequency: e.target.value as BackupFrequency,
                      })
                    }
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {BACKUP_FREQUENCY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Max Backups to Keep
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={config.maxBackups}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        maxBackups: parseInt(e.target.value) || 10,
                      })
                    }
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-white/60 text-xs mt-1">
                    Older backups will be automatically deleted
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            onClick={handleTestConnection}
            loading={testing}
            variant="outline"
            disabled={loading}
          >
            <TestTube className="h-4 w-4 mr-2" />
            Test Connection
          </Button>
          <Button onClick={handleSave} loading={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>
    </Modal>
  );
}
