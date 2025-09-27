import { DatabaseManager } from "../database/DatabaseManager";
import { JobExecutionService } from "./JobExecutionService";
import { logger } from "../utils/logger";
import fs from "fs";
import path from "path";
import { app } from "electron";

export interface BackupJobConfig {
  projectId: string;
  type: "csv" | "sqlite" | "full";
  tables?: string[]; // For CSV export, specify which tables to export
  includeData?: boolean; // Whether to include snapshot data
  compression?: boolean; // Whether to compress the backup
}

export interface BackupJobResult {
  jobId: string;
  status: "completed" | "failed";
  filePath?: string;
  size?: number;
  error?: string;
  metadata?: {
    dataSourceCount: number;
    snapshotCount: number;
    totalRecords: number;
    tablesExported?: string[];
  };
}

export class BackupJobService {
  private static instance: BackupJobService;
  private dbManager: DatabaseManager;
  private jobExecutionService: JobExecutionService;

  private constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.jobExecutionService = JobExecutionService.getInstance();
  }

  static getInstance(): BackupJobService {
    if (!BackupJobService.instance) {
      BackupJobService.instance = new BackupJobService();
    }
    return BackupJobService.instance;
  }

  async createBackupJob(config: BackupJobConfig): Promise<string> {
    try {
      // Use the job execution service to create and execute the job
      const result = await this.jobExecutionService.executeJob(
        {
          projectId: config.projectId,
          type: "system",
          description: `Backup project ${config.projectId} as ${config.type}`,
          config: {
            ...config,
          },
        },
        async (executionId, updateProgress) => {
          return await this.executeBackupJobWithProgress(
            executionId,
            config,
            updateProgress
          );
        }
      );

      return result.jobId;
    } catch (error) {
      logger.error(
        "Failed to create backup job",
        "system",
        { error, config },
        "BackupJobService"
      );
      throw error;
    }
  }

  private async executeBackupJobWithProgress(
    executionId: string,
    config: BackupJobConfig,
    updateProgress: (progress: number, step?: string) => Promise<void>
  ): Promise<BackupJobResult> {
    try {
      await updateProgress(10, "Initializing backup");

      // Get project info
      const project = await this.dbManager.getProject(config.projectId);
      if (!project) {
        throw new Error(`Project ${config.projectId} not found`);
      }

      await updateProgress(20, "Creating backup directory");

      // Create backup directory
      const backupDir = path.join(
        app.getPath("userData"),
        "backups",
        config.projectId
      );
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      await updateProgress(30, `Starting ${config.type} backup`);

      let result: BackupJobResult;

      switch (config.type) {
        case "csv":
          result = await this.exportToCSV(
            executionId,
            config,
            backupDir,
            updateProgress
          );
          break;
        case "sqlite":
          result = await this.exportToSQLite(executionId, config, backupDir);
          break;
        case "full":
          result = await this.exportFullBackup(executionId, config, backupDir);
          break;
        default:
          throw new Error(`Unsupported backup type: ${config.type}`);
      }

      await updateProgress(90, "Creating backup record");

      // Create backup record
      if (result.status === "completed" && result.filePath) {
        await this.dbManager.createBackup(config.projectId, {
          type: config.type,
          description: `Backup job ${executionId}`,
          filePath: result.filePath,
          size: result.size,
          dataSourceCount: result.metadata?.dataSourceCount || 0,
          snapshotCount: result.metadata?.snapshotCount || 0,
          totalRecords: result.metadata?.totalRecords || 0,
        });
      }

      await updateProgress(100, "Backup completed");

      logger.success(
        "Backup job completed",
        "system",
        { executionId, result },
        "BackupJobService"
      );

      return result;
    } catch (error) {
      logger.error(
        "Backup job failed",
        "system",
        { executionId, error },
        "BackupJobService"
      );
      throw error;
    }
  }

  private async exportToCSV(
    executionId: string,
    config: BackupJobConfig,
    backupDir: string,
    updateProgress: (progress: number, step?: string) => Promise<void>
  ): Promise<BackupJobResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup_${config.projectId}_${timestamp}.csv`;
    const filePath = path.join(backupDir, fileName);

    try {
      await updateProgress(40, "Fetching project data");

      // Get project data
      const dataSources = await this.dbManager.getDataSources(config.projectId);
      const snapshots = await this.dbManager.getSnapshots(config.projectId);
      const relationships = await this.dbManager.getRelationships(
        config.projectId
      );
      const models = await this.dbManager.getConsolidatedModels(
        config.projectId
      );

      await updateProgress(60, "Creating CSV content");

      // Create CSV content
      const csvContent = this.createCSVContent({
        dataSources,
        snapshots: config.includeData ? snapshots : [],
        relationships,
        models,
      });

      await updateProgress(80, "Writing CSV file");

      // Write CSV file
      fs.writeFileSync(filePath, csvContent, "utf8");
      const stats = fs.statSync(filePath);

      return {
        jobId: executionId,
        status: "completed",
        filePath,
        size: stats.size,
        metadata: {
          dataSourceCount: dataSources.length,
          snapshotCount: snapshots.length,
          totalRecords: snapshots.reduce(
            (sum, s) => sum + (s.recordCount || 0),
            0
          ),
          tablesExported: [
            "data_sources",
            "snapshots",
            "relationships",
            "consolidated_models",
          ],
        },
      };
    } catch (error) {
      return {
        jobId: executionId,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async exportToSQLite(
    jobId: string,
    config: BackupJobConfig,
    backupDir: string
  ): Promise<BackupJobResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup_${config.projectId}_${timestamp}.db`;
    const filePath = path.join(backupDir, fileName);

    try {
      // Copy the project database file
      const project = await this.dbManager.getProject(config.projectId);
      if (!project) {
        throw new Error(`Project ${config.projectId} not found`);
      }

      // Copy database file
      fs.copyFileSync(project.dataPath, filePath);
      const stats = fs.statSync(filePath);

      // Get metadata
      const stats_data = await this.dbManager.getProjectStats(config.projectId);

      return {
        jobId,
        status: "completed",
        filePath,
        size: stats.size,
        metadata: {
          dataSourceCount: stats_data.dataSourceCount,
          snapshotCount: stats_data.snapshotCount,
          totalRecords: stats_data.totalRecords,
        },
      };
    } catch (error) {
      return {
        jobId,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async exportFullBackup(
    jobId: string,
    config: BackupJobConfig,
    backupDir: string
  ): Promise<BackupJobResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `full_backup_${config.projectId}_${timestamp}.json`;
    const filePath = path.join(backupDir, fileName);

    try {
      // Get all project data
      const project = await this.dbManager.getProject(config.projectId);
      const dataSources = await this.dbManager.getDataSources(config.projectId);
      const snapshots = await this.dbManager.getSnapshots(config.projectId);
      const relationships = await this.dbManager.getRelationships(
        config.projectId
      );
      const models = await this.dbManager.getConsolidatedModels(
        config.projectId
      );

      // Create full backup object
      const backupData = {
        project,
        dataSources,
        snapshots: config.includeData ? snapshots : [],
        relationships,
        models,
        metadata: {
          version: "1.0.0",
          timestamp: new Date().toISOString(),
          type: "full",
          dataSourceCount: dataSources.length,
          snapshotCount: snapshots.length,
          totalRecords: snapshots.reduce(
            (sum, s) => sum + (s.recordCount || 0),
            0
          ),
        },
      };

      // Write JSON file
      fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), "utf8");
      const stats = fs.statSync(filePath);

      return {
        jobId,
        status: "completed",
        filePath,
        size: stats.size,
        metadata: {
          dataSourceCount: dataSources.length,
          snapshotCount: snapshots.length,
          totalRecords: backupData.metadata.totalRecords,
        },
      };
    } catch (error) {
      return {
        jobId,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private createCSVContent(data: {
    dataSources: any[];
    snapshots: any[];
    relationships: any[];
    models: any[];
  }): string {
    const lines: string[] = [];

    // CSV header
    lines.push("Table,ID,Data");

    // Data sources
    data.dataSources.forEach((ds) => {
      lines.push(
        `data_sources,${ds.id},"${JSON.stringify(ds).replace(/"/g, '""')}"`
      );
    });

    // Snapshots (if included)
    data.snapshots.forEach((snapshot) => {
      lines.push(
        `snapshots,${snapshot.id},"${JSON.stringify(snapshot).replace(
          /"/g,
          '""'
        )}"`
      );
    });

    // Relationships
    data.relationships.forEach((rel) => {
      lines.push(
        `relationships,${rel.id},"${JSON.stringify(rel).replace(/"/g, '""')}"`
      );
    });

    // Models
    data.models.forEach((model) => {
      lines.push(
        `consolidated_models,${model.id},"${JSON.stringify(model).replace(
          /"/g,
          '""'
        )}"`
      );
    });

    return lines.join("\n");
  }

  async getBackupJobs(projectId?: string) {
    return await this.dbManager.getJobs(projectId);
  }

  async getBackupJob(jobId: string) {
    const jobs = await this.dbManager.getJobs();
    return jobs.find((job) => job.id === jobId);
  }

  async cancelBackupJob(jobId: string) {
    const job = await this.getBackupJob(jobId);
    if (job && job.status === "running") {
      await this.dbManager.updateJob(jobId, {
        status: "cancelled",
      });
      return true;
    }
    return false;
  }

  async deleteBackupJob(jobId: string) {
    return await this.dbManager.deleteJob(jobId);
  }
}
