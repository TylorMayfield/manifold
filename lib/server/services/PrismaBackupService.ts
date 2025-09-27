import { BackupJobService, BackupJobConfig } from "./BackupJobService";
import { DatabaseManager } from "../database/DatabaseManager";
import { Project, DataSource } from "../../../types";
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
}

export class PrismaBackupService {
  private static instance: PrismaBackupService;
  private backupJobService: BackupJobService;
  private dbManager: DatabaseManager;

  private constructor() {
    this.backupJobService = BackupJobService.getInstance();
    this.dbManager = DatabaseManager.getInstance();
  }

  static getInstance(): PrismaBackupService {
    if (!PrismaBackupService.instance) {
      PrismaBackupService.instance = new PrismaBackupService();
    }
    return PrismaBackupService.instance;
  }

  async initialize(): Promise<void> {
    await this.dbManager.initialize();
  }

  // Create a backup job
  async createBackupJob(
    project: Project,
    dataSources: DataSource[],
    description?: string,
    type: "csv" | "sqlite" | "full" = "full"
  ): Promise<string> {
    try {
      const config: BackupJobConfig = {
        projectId: project.id,
        type,
        includeData: true,
        compression: false,
      };

      const jobId = await this.backupJobService.createBackupJob(config);

      logger.success(
        "Backup job created",
        "system",
        {
          jobId,
          projectId: project.id,
          type,
          description,
        },
        "PrismaBackupService"
      );

      return jobId;
    } catch (error) {
      logger.error(
        "Failed to create backup job",
        "system",
        {
          error,
          projectId: project.id,
          type,
        },
        "PrismaBackupService"
      );
      throw error;
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
        "PrismaBackupService"
      );
      return [];
    }
  }

  // Get all backups (completed jobs)
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
      }));
    } catch (error) {
      logger.error(
        "Failed to get backups",
        "system",
        { error, projectId },
        "PrismaBackupService"
      );
      return [];
    }
  }

  // Get a specific backup
  async getBackup(backupId: string, projectId: string) {
    try {
      const backups = await this.dbManager.getBackups(projectId);
      const backup = backups.find((b) => b.id === backupId);

      if (!backup) {
        throw new Error(`Backup ${backupId} not found`);
      }

      return {
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
      };
    } catch (error) {
      logger.error(
        "Failed to get backup",
        "system",
        { error, backupId, projectId },
        "PrismaBackupService"
      );
      throw error;
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
        "PrismaBackupService"
      );
    } catch (error) {
      logger.error(
        "Failed to delete backup",
        "system",
        { error, backupId, projectId },
        "PrismaBackupService"
      );
      throw error;
    }
  }

  // Restore from backup (this would need to be implemented based on backup type)
  async restoreFromBackup(
    backupId: string,
    projectId: string
  ): Promise<{
    project: Project;
    dataSources: DataSource[];
    snapshots?: any[];
  }> {
    try {
      const backup = await this.getBackup(backupId, projectId);

      // This is a simplified restore - in a real implementation, you'd need to
      // handle different backup types (CSV, SQLite, full JSON)
      throw new Error("Restore functionality not yet implemented");
    } catch (error) {
      logger.error(
        "Failed to restore from backup",
        "system",
        { error, backupId, projectId },
        "PrismaBackupService"
      );
      throw error;
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
        "PrismaBackupService"
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
        "PrismaBackupService"
      );
      return false;
    }
  }

  // Get backup statistics
  async getBackupStats(projectId: string) {
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
        "PrismaBackupService"
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
}
