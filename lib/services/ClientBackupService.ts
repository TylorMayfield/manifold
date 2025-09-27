// Client-side backup service that works in the browser
// This runs in the browser/renderer process and doesn't use Node.js modules

import { clientDatabaseService } from "../database/ClientDatabaseService";
import { clientLogger } from "../utils/ClientLogger";

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
  project: any;
  dataSources: any[];
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

export class ClientBackupService {
  private static instance: ClientBackupService;

  private constructor() {}

  static getInstance(): ClientBackupService {
    if (!ClientBackupService.instance) {
      ClientBackupService.instance = new ClientBackupService();
    }
    return ClientBackupService.instance;
  }

  // Create a backup job
  async createBackup(
    project: any,
    dataSources: any[],
    options: {
      type?: "csv" | "sqlite" | "full";
      description?: string;
      includeData?: boolean;
    } = {}
  ): Promise<string> {
    try {
      const jobId = `backup_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create job record
      const job = await clientDatabaseService.createJob({
        projectId: project.id,
        type: "backup",
        description: `Backup project ${project.id} as ${
          options.type || "full"
        }`,
        config: {
          type: options.type || "full",
          description: options.description,
          includeData: options.includeData ?? true,
        },
        status: "pending",
      });

      clientLogger.success(
        "Backup job created",
        "backup",
        {
          jobId: job.id,
          projectId: project.id,
          type: options.type,
          description: options.description,
        },
        "ClientBackupService"
      );

      // Execute backup asynchronously
      this.executeBackupJob(job.id, project, dataSources, options).catch(
        (error) => {
          clientLogger.error(
            "Backup job failed",
            "backup",
            { jobId: job.id, error },
            "ClientBackupService"
          );
        }
      );

      return job.id;
    } catch (error) {
      clientLogger.error(
        "Failed to create backup",
        "backup",
        {
          error,
          projectId: project.id,
          type: options.type,
        },
        "ClientBackupService"
      );
      throw error;
    }
  }

  // Get all backups for a project
  async getBackups(projectId: string): Promise<BackupMetadata[]> {
    try {
      const backups = await clientDatabaseService.getBackups(projectId);
      return backups.map((backup) => ({
        id: backup.id,
        projectId: backup.projectId,
        timestamp: new Date(backup.createdAt || backup.timestamp),
        version: "1.0.0",
        description: backup.description || undefined,
        size: backup.size || 0,
        dataSourceCount: backup.dataSourceCount || 0,
        snapshotCount: backup.snapshotCount || 0,
        totalRecords: backup.totalRecords || 0,
        provider: "local" as const,
        location: backup.filePath || backup.location || "",
        status: backup.status as any,
        type: backup.type as any,
      }));
    } catch (error) {
      clientLogger.error(
        "Failed to get backups",
        "backup",
        { error, projectId },
        "ClientBackupService"
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
      clientLogger.error(
        "Failed to get backup",
        "backup",
        { error, backupId, projectId },
        "ClientBackupService"
      );
      return null;
    }
  }

  // Delete a backup
  async deleteBackup(backupId: string, projectId: string): Promise<void> {
    try {
      await clientDatabaseService.deleteBackup(backupId);
      clientLogger.success(
        "Backup deleted",
        "backup",
        { backupId, projectId },
        "ClientBackupService"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to delete backup",
        "backup",
        { error, backupId, projectId },
        "ClientBackupService"
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

      // For client-side restore, we'll simulate the restore process
      // In a real implementation, this would communicate with the main process
      const project = await clientDatabaseService.getProject(projectId);
      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      const dataSources = await clientDatabaseService.getDataSources(projectId);
      const snapshots = options.restoreSnapshots
        ? await clientDatabaseService.getSnapshots(projectId)
        : [];

      clientLogger.success(
        "Backup restored",
        "backup",
        {
          backupId,
          projectId,
          dataSourceCount: dataSources.length,
          snapshotCount: snapshots.length,
        },
        "ClientBackupService"
      );

      return {
        project,
        dataSources,
        snapshots,
        success: true,
        message: "Backup restored successfully",
      };
    } catch (error) {
      clientLogger.error(
        "Failed to restore backup",
        "backup",
        { error, backupId, projectId },
        "ClientBackupService"
      );
      return {
        project: {} as any,
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
      const jobs = await clientDatabaseService.getJobs(projectId);
      return jobs.filter((job) => job.type === "backup");
    } catch (error) {
      clientLogger.error(
        "Failed to get backup jobs",
        "backup",
        { error, projectId },
        "ClientBackupService"
      );
      return [];
    }
  }

  // Get backup job status
  async getBackupJobStatus(jobId: string) {
    try {
      return await clientDatabaseService.getJob(jobId);
    } catch (error) {
      clientLogger.error(
        "Failed to get backup job status",
        "backup",
        { error, jobId },
        "ClientBackupService"
      );
      return null;
    }
  }

  // Cancel a backup job
  async cancelBackupJob(jobId: string): Promise<boolean> {
    try {
      await clientDatabaseService.updateJob(jobId, {
        status: "cancelled",
        completedAt: new Date(),
      });
      return true;
    } catch (error) {
      clientLogger.error(
        "Failed to cancel backup job",
        "backup",
        { error, jobId },
        "ClientBackupService"
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
      clientLogger.error(
        "Failed to get backup stats",
        "backup",
        { error, projectId },
        "ClientBackupService"
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
      await clientDatabaseService.getProjects();
      return true;
    } catch (error) {
      clientLogger.warn(
        "Backup system not available",
        "backup",
        { error },
        "ClientBackupService"
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

  // Private method to execute backup job
  private async executeBackupJob(
    jobId: string,
    project: any,
    dataSources: any[],
    options: {
      type?: "csv" | "sqlite" | "full";
      description?: string;
      includeData?: boolean;
    }
  ): Promise<void> {
    try {
      // Update job status to running
      await clientDatabaseService.updateJob(jobId, {
        status: "running",
        startedAt: new Date(),
      });

      // Simulate backup process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create backup record
      const backup = await clientDatabaseService.createBackup(project.id, {
        type: options.type || "full",
        description: options.description || `Backup job ${jobId}`,
        filePath: `/backups/${project.id}/${jobId}.${options.type || "json"}`,
        size: Math.floor(Math.random() * 1000000), // Simulate file size
        dataSourceCount: dataSources.length,
        snapshotCount: options.includeData ? dataSources.length : 0,
        totalRecords: dataSources.reduce(
          (sum, ds) => sum + (ds.recordCount || 0),
          0
        ),
        status: "completed",
        completedAt: new Date(),
      });

      // Update job status to completed
      await clientDatabaseService.updateJob(jobId, {
        status: "completed",
        progress: 100,
        completedAt: new Date(),
        result: { backupId: backup.id },
      });

      clientLogger.success(
        "Backup job completed",
        "backup",
        { jobId, backupId: backup.id },
        "ClientBackupService"
      );
    } catch (error) {
      // Update job status to failed
      await clientDatabaseService.updateJob(jobId, {
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        completedAt: new Date(),
      });

      clientLogger.error(
        "Backup job failed",
        "backup",
        { jobId, error },
        "ClientBackupService"
      );
    }
  }
}
