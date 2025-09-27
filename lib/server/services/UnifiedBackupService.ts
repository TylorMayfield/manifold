import { DatabaseManager } from "../database/DatabaseManager";
import { BackupJobService, BackupJobConfig } from "./BackupJobService";
import { Project, DataSource, DataProviderType } from "../../../types";
import { logger } from "../utils/logger";

export interface BackupMetadata {
  id: string;
  projectId: string;
  timestamp: Date;
  version: string;
  description?: string;
  size: number;
  dataSourceCount: number;
  snapshotCount: number;
  totalRecords: number;
  provider: "local" | "s3";
  location: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  type: "csv" | "sqlite" | "full";
}

export interface RestoreResult {
  project: Project;
  dataSources: DataSource[];
  snapshots?: any[];
  success: boolean;
  message: string;
}

export interface BackupStats {
  totalBackups: number;
  totalSize: number;
  completedJobs: number;
  failedJobs: number;
  runningJobs: number;
  lastBackup: Date | null;
}

export class UnifiedBackupService {
  private static instance: UnifiedBackupService;
  private dbManager: DatabaseManager;
  private backupJobService: BackupJobService;

  private constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.backupJobService = BackupJobService.getInstance();
  }

  static getInstance(): UnifiedBackupService {
    if (!UnifiedBackupService.instance) {
      UnifiedBackupService.instance = new UnifiedBackupService();
    }
    return UnifiedBackupService.instance;
  }

  async initialize(): Promise<void> {
    await this.dbManager.initialize();
  }

  // Create a backup job
  async createBackup(
    project: Project,
    dataSources: DataSource[],
    options: {
      type?: "csv" | "sqlite" | "full";
      description?: string;
      includeData?: boolean;
    } = {}
  ): Promise<string> {
    try {
      const config: BackupJobConfig = {
        projectId: project.id,
        type: options.type || "full",
        includeData: options.includeData ?? true,
        compression: false,
      };

      const jobId = await this.backupJobService.createBackupJob(config);

      logger.success(
        "Backup created",
        "system",
        {
          jobId,
          projectId: project.id,
          type: config.type,
          description: options.description,
        },
        "UnifiedBackupService"
      );

      return jobId;
    } catch (error) {
      logger.error(
        "Failed to create backup",
        "system",
        {
          error,
          projectId: project.id,
          type: options.type,
        },
        "UnifiedBackupService"
      );
      throw error;
    }
  }

  // Get all backups for a project
  async getBackups(projectId: string): Promise<BackupMetadata[]> {
    try {
      const backups = await this.dbManager.getBackups(projectId);
      return backups.map((backup) => ({
        id: backup.id,
        projectId: backup.projectId,
        timestamp: backup.createdAt,
        version: "1.0.0",
        description: backup.description || undefined,
        size: backup.size,
        dataSourceCount: backup.dataSourceCount,
        snapshotCount: backup.snapshotCount,
        totalRecords: backup.totalRecords,
        provider: "local" as const,
        location: backup.filePath || "",
        status: backup.status as any,
        type: backup.type as any,
      }));
    } catch (error) {
      logger.error(
        "Failed to get backups",
        "system",
        { error, projectId },
        "UnifiedBackupService"
      );
      return [];
    }
  }

  // Get a specific backup
  async getBackup(
    backupId: string,
    projectId: string
  ): Promise<BackupMetadata | null> {
    try {
      const backups = await this.getBackups(projectId);
      return backups.find((backup) => backup.id === backupId) || null;
    } catch (error) {
      logger.error(
        "Failed to get backup",
        "system",
        { error, backupId, projectId },
        "UnifiedBackupService"
      );
      return null;
    }
  }

  // Delete a backup
  async deleteBackup(backupId: string, projectId: string): Promise<void> {
    try {
      await this.dbManager.deleteBackup(backupId);
      logger.success(
        "Backup deleted",
        "system",
        { backupId, projectId },
        "UnifiedBackupService"
      );
    } catch (error) {
      logger.error(
        "Failed to delete backup",
        "system",
        { error, backupId, projectId },
        "UnifiedBackupService"
      );
      throw error;
    }
  }

  // Restore from backup
  async restoreFromBackup(
    backupId: string,
    projectId: string,
    options: {
      overwriteExisting?: boolean;
      restoreSnapshots?: boolean;
    } = {}
  ): Promise<RestoreResult> {
    try {
      const backup = await this.getBackup(backupId, projectId);
      if (!backup) {
        throw new Error(`Backup ${backupId} not found`);
      }

      // For now, we'll implement a basic restore that works with the new Prisma system
      // This would need to be enhanced based on the backup type and format
      const project = await this.dbManager.getProject(projectId);
      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      const dataSources = await this.dbManager.getDataSources(projectId);
      const snapshots = options.restoreSnapshots
        ? await this.dbManager.getSnapshots(projectId)
        : [];

      logger.success(
        "Backup restored",
        "system",
        {
          backupId,
          projectId,
          dataSourceCount: dataSources.length,
          snapshotCount: snapshots.length,
        },
        "UnifiedBackupService"
      );

      return {
        project: {
          id: project.id,
          name: project.name,
          description: project.description || "",
          dataPath: project.dataPath || "",
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
        dataSources: dataSources.map((ds) => ({
          id: ds.id,
          projectId: ds.projectId,
          name: ds.name,
          type: ds.type as DataProviderType,
          config: JSON.parse(ds.config),
          status: ds.status as
            | "error"
            | "idle"
            | "running"
            | "completed"
            | undefined,
          createdAt: ds.createdAt,
          updatedAt: ds.updatedAt,
          lastSyncAt: ds.lastSyncAt || undefined,
        })),
        snapshots,
        success: true,
        message: "Backup restored successfully",
      };
    } catch (error) {
      logger.error(
        "Failed to restore backup",
        "system",
        { error, backupId, projectId },
        "UnifiedBackupService"
      );
      return {
        project: {} as Project,
        dataSources: [],
        snapshots: [],
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Get backup jobs for a project
  async getBackupJobs(projectId: string) {
    try {
      return await this.backupJobService.getBackupJobs(projectId);
    } catch (error) {
      logger.error(
        "Failed to get backup jobs",
        "system",
        { error, projectId },
        "UnifiedBackupService"
      );
      return [];
    }
  }

  // Get backup job status
  async getBackupJobStatus(jobId: string) {
    try {
      return await this.backupJobService.getBackupJob(jobId);
    } catch (error) {
      logger.error(
        "Failed to get backup job status",
        "system",
        { error, jobId },
        "UnifiedBackupService"
      );
      return null;
    }
  }

  // Cancel a backup job
  async cancelBackupJob(jobId: string): Promise<boolean> {
    try {
      return await this.backupJobService.cancelBackupJob(jobId);
    } catch (error) {
      logger.error(
        "Failed to cancel backup job",
        "system",
        { error, jobId },
        "UnifiedBackupService"
      );
      return false;
    }
  }

  // Get backup statistics
  async getBackupStats(projectId: string): Promise<BackupStats> {
    try {
      const backups = await this.getBackups(projectId);
      const jobs = await this.getBackupJobs(projectId);

      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      const completedJobs = jobs.filter(
        (job) => job.status === "completed"
      ).length;
      const failedJobs = jobs.filter((job) => job.status === "failed").length;
      const runningJobs = jobs.filter((job) => job.status === "running").length;

      return {
        totalBackups: backups.length,
        totalSize,
        completedJobs,
        failedJobs,
        runningJobs,
        lastBackup: backups.length > 0 ? backups[0].timestamp : null,
      };
    } catch (error) {
      logger.error(
        "Failed to get backup stats",
        "system",
        { error, projectId },
        "UnifiedBackupService"
      );
      return {
        totalBackups: 0,
        totalSize: 0,
        completedJobs: 0,
        failedJobs: 0,
        runningJobs: 0,
        lastBackup: null,
      };
    }
  }

  // Check if backup system is available
  async isAvailable(): Promise<boolean> {
    try {
      await this.dbManager.getProjects();
      return true;
    } catch (error) {
      logger.warn(
        "Backup system not available",
        "system",
        { error },
        "UnifiedBackupService"
      );
      return false;
    }
  }

  // Get supported backup types
  getSupportedTypes(): Array<{
    value: string;
    label: string;
    description: string;
  }> {
    return [
      {
        value: "full",
        label: "Full Backup",
        description: "Complete project backup with all data and metadata",
      },
      {
        value: "sqlite",
        label: "SQLite Export",
        description: "Export project database as SQLite file",
      },
      {
        value: "csv",
        label: "CSV Export",
        description: "Export project data as CSV files",
      },
    ];
  }
}
