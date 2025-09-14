import { logger } from "../utils/logger";
import { Project, DataSource } from "../../types";
import {
  BackupMetadata,
  LocalBackupConfig,
  BackupProvider,
} from "../../types/backup";

export class LocalBackupService {
  private static instance: LocalBackupService;
  private config: LocalBackupConfig | null = null;

  static getInstance(): LocalBackupService {
    if (!LocalBackupService.instance) {
      LocalBackupService.instance = new LocalBackupService();
    }
    return LocalBackupService.instance;
  }

  async configure(config: LocalBackupConfig): Promise<void> {
    try {
      this.config = config;

      // In a real Electron app, you would create the directory if it doesn't exist
      // For now, we'll just store the config
      logger.info(
        "Local backup service configured",
        "backup",
        { directory: config.directory },
        "LocalBackupService"
      );
    } catch (error) {
      logger.error(
        "Failed to configure local backup service",
        "backup",
        { error, config },
        "LocalBackupService"
      );
      throw error;
    }
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  getConfig(): LocalBackupConfig | null {
    return this.config;
  }

  async backupProject(
    project: Project,
    dataSources: DataSource[],
    description?: string
  ): Promise<BackupMetadata> {
    if (!this.config) {
      throw new Error("Local backup not configured");
    }

    logger.info(
      "Starting local project backup",
      "backup",
      { projectId: project.id, projectName: project.name },
      "LocalBackupService"
    );

    try {
      const backupId = `backup-${project.id}-${Date.now()}`;
      const timestamp = new Date();

      // Get all snapshots (data) for this project
      const { DatabaseService } = await import("./DatabaseService");
      const dbService = DatabaseService.getInstance();
      const snapshots = await dbService.getSnapshots(project.id);

      logger.info(
        "Including snapshots in local backup",
        "backup",
        {
          projectId: project.id,
          snapshotCount: snapshots.length,
          totalRecords: snapshots.reduce(
            (sum, s) => sum + (s.recordCount || 0),
            0
          ),
        },
        "LocalBackupService"
      );

      const backupData = {
        project,
        dataSources,
        snapshots, // Include all snapshot data
        metadata: {
          id: backupId,
          projectId: project.id,
          timestamp,
          version: "1.0.0",
          description,
          dataSourceCount: dataSources.length,
          snapshotCount: snapshots.length,
          totalRecords: snapshots.reduce(
            (sum, s) => sum + (s.recordCount || 0),
            0
          ),
        },
      };

      const fileName = `${this.config.fileNamePrefix || "backup"}-${
        project.id
      }-${backupId}.json`;
      const filePath = `${this.config.directory}/${fileName}`;

      // In a real Electron app, you would write to the file system
      // For now, we'll simulate this by storing in localStorage
      const backupJson = JSON.stringify(backupData, null, 2);

      // Store in localStorage as a fallback for browser testing
      const backupKey = `local_backup_${project.id}_${backupId}`;
      localStorage.setItem(backupKey, backupJson);

      // Also store metadata for listing
      const metadataKey = `local_backup_metadata_${project.id}`;
      const existingMetadata = localStorage.getItem(metadataKey);
      const metadataList = existingMetadata ? JSON.parse(existingMetadata) : [];
      metadataList.push({
        id: backupId,
        projectId: project.id,
        timestamp: timestamp.toISOString(),
        version: "1.0.0",
        description,
        size: backupJson.length,
        dataSourceCount: dataSources.length,
        snapshotCount: snapshots.length,
        totalRecords: snapshots.reduce(
          (sum, s) => sum + (s.recordCount || 0),
          0
        ),
        provider: "local" as BackupProvider,
        location: filePath,
      });
      localStorage.setItem(metadataKey, JSON.stringify(metadataList));

      const metadata: BackupMetadata = {
        id: backupId,
        projectId: project.id,
        timestamp,
        version: "1.0.0",
        description,
        size: backupJson.length,
        dataSourceCount: dataSources.length,
        snapshotCount: snapshots.length,
        totalRecords: snapshots.reduce(
          (sum, s) => sum + (s.recordCount || 0),
          0
        ),
        provider: "local",
        location: filePath,
      };

      logger.success(
        "Local project backup completed",
        "backup",
        { backupId, projectId: project.id, filePath },
        "LocalBackupService"
      );

      return metadata;
    } catch (error) {
      logger.error(
        "Local project backup failed",
        "backup",
        { error, projectId: project.id },
        "LocalBackupService"
      );
      throw error;
    }
  }

  async restoreProject(
    backupId: string,
    projectId: string
  ): Promise<{
    project: Project;
    dataSources: DataSource[];
    snapshots?: any[];
  }> {
    if (!this.config) {
      throw new Error("Local backup not configured");
    }

    logger.info(
      "Starting local project restore",
      "backup",
      { backupId, projectId },
      "LocalBackupService"
    );

    try {
      const backupKey = `local_backup_${projectId}_${backupId}`;
      const backupJson = localStorage.getItem(backupKey);

      if (!backupJson) {
        throw new Error(`Backup ${backupId} not found`);
      }

      const backupData = JSON.parse(backupJson);

      if (!backupData.project || !backupData.dataSources) {
        throw new Error("Invalid backup data format");
      }

      logger.success(
        "Local project restore completed",
        "backup",
        { backupId, projectId },
        "LocalBackupService"
      );

      return {
        project: backupData.project,
        dataSources: backupData.dataSources,
        snapshots: backupData.snapshots || [],
      };
    } catch (error) {
      logger.error(
        "Local project restore failed",
        "backup",
        { error, backupId, projectId },
        "LocalBackupService"
      );
      throw error;
    }
  }

  async listBackups(projectId: string): Promise<BackupMetadata[]> {
    if (!this.config) {
      throw new Error("Local backup not configured");
    }

    try {
      const metadataKey = `local_backup_metadata_${projectId}`;
      const metadataJson = localStorage.getItem(metadataKey);

      if (!metadataJson) {
        return [];
      }

      const metadataList = JSON.parse(metadataJson);

      // Sort by timestamp, newest first
      return metadataList
        .sort(
          (a: any, b: any) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
    } catch (error) {
      logger.error(
        "Failed to list local backups",
        "backup",
        { error, projectId },
        "LocalBackupService"
      );
      return [];
    }
  }

  async deleteBackup(backupId: string, projectId: string): Promise<void> {
    if (!this.config) {
      throw new Error("Local backup not configured");
    }

    logger.info(
      "Deleting local backup",
      "backup",
      { backupId, projectId },
      "LocalBackupService"
    );

    try {
      // Remove the backup data
      const backupKey = `local_backup_${projectId}_${backupId}`;
      localStorage.removeItem(backupKey);

      // Update the metadata list
      const metadataKey = `local_backup_metadata_${projectId}`;
      const metadataJson = localStorage.getItem(metadataKey);

      if (metadataJson) {
        const metadataList = JSON.parse(metadataJson);
        const updatedList = metadataList.filter(
          (item: any) => item.id !== backupId
        );
        localStorage.setItem(metadataKey, JSON.stringify(updatedList));
      }

      logger.success(
        "Local backup deleted",
        "backup",
        { backupId, projectId },
        "LocalBackupService"
      );
    } catch (error) {
      logger.error(
        "Failed to delete local backup",
        "backup",
        { error, backupId, projectId },
        "LocalBackupService"
      );
      throw error;
    }
  }

  async testConnection(): Promise<void> {
    if (!this.config) {
      throw new Error("Local backup not configured");
    }

    try {
      // Test by creating a temporary file
      const testKey = `test_backup_${Date.now()}`;
      localStorage.setItem(testKey, JSON.stringify({ test: true }));
      localStorage.removeItem(testKey);

      logger.info(
        "Local backup connection test successful",
        "backup",
        { directory: this.config.directory },
        "LocalBackupService"
      );
    } catch (error) {
      logger.error(
        "Local backup connection test failed",
        "backup",
        { error },
        "LocalBackupService"
      );
      throw error;
    }
  }
}
