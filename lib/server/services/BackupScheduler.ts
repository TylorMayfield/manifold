import { logger } from "../utils/logger";
import { Project, DataSource } from "../../../types";
import {
  BackupConfig,
  BackupSchedule,
  BackupFrequency,
  BACKUP_FREQUENCY_INTERVALS,
} from "../../../types/backup";
import { S3BackupService } from "./S3BackupService";
import { LocalBackupService } from "./LocalBackupService";
import { DatabaseService } from "../../services/DatabaseService";

export class BackupScheduler {
  private static instance: BackupScheduler;
  private schedules: Map<string, NodeJS.Timeout> = new Map();
  private dbService = DatabaseService.getInstance();
  private s3Service = S3BackupService.getInstance();
  private localService = LocalBackupService.getInstance();

  static getInstance(): BackupScheduler {
    if (!BackupScheduler.instance) {
      BackupScheduler.instance = new BackupScheduler();
    }
    return BackupScheduler.instance;
  }

  async configureBackup(
    projectId: string,
    config: BackupConfig
  ): Promise<void> {
    try {
      logger.info(
        "Configuring backup schedule",
        "system",
        { projectId, provider: config.provider, frequency: config.frequency },
        "BackupScheduler"
      );

      // Stop existing schedule if any
      await this.stopBackup(projectId);

      // Store the configuration
      await this.saveBackupConfig(projectId, config);

      // Start new schedule if enabled
      if (config.enabled && config.frequency !== "disabled") {
        await this.startBackup(projectId, config);
      }

      logger.success(
        "Backup schedule configured",
        "system",
        { projectId },
        "BackupScheduler"
      );
    } catch (error) {
      logger.error(
        "Failed to configure backup schedule",
        "system",
        { error, projectId },
        "BackupScheduler"
      );
      throw error;
    }
  }

  async startBackup(projectId: string, config: BackupConfig): Promise<void> {
    try {
      const interval = BACKUP_FREQUENCY_INTERVALS[config.frequency];

      if (interval === 0) {
        throw new Error("Cannot start backup with disabled frequency");
      }

      // Create the backup schedule
      const schedule: BackupSchedule = {
        id: `schedule_${projectId}`,
        projectId,
        config,
        isRunning: true,
        lastRun: config.lastBackup,
        nextRun: this.calculateNextRun(config),
      };

      // Set up the interval
      const timeout = setInterval(async () => {
        try {
          await this.executeBackup(projectId);
        } catch (error) {
          logger.error(
            "Scheduled backup failed",
            "system",
            { error, projectId },
            "BackupScheduler"
          );
        }
      }, interval);

      this.schedules.set(projectId, timeout);

      // Store the schedule
      await this.saveBackupSchedule(schedule);

      logger.success(
        "Backup schedule started",
        "system",
        {
          projectId,
          frequency: config.frequency,
          nextRun: schedule.nextRun,
        },
        "BackupScheduler"
      );
    } catch (error) {
      logger.error(
        "Failed to start backup schedule",
        "system",
        { error, projectId },
        "BackupScheduler"
      );
      throw error;
    }
  }

  async stopBackup(projectId: string): Promise<void> {
    try {
      const timeout = this.schedules.get(projectId);
      if (timeout) {
        clearInterval(timeout);
        this.schedules.delete(projectId);
      }

      // Update schedule status
      await this.updateBackupScheduleStatus(projectId, false);

      logger.info(
        "Backup schedule stopped",
        "system",
        { projectId },
        "BackupScheduler"
      );
    } catch (error) {
      logger.error(
        "Failed to stop backup schedule",
        "system",
        { error, projectId },
        "BackupScheduler"
      );
      throw error;
    }
  }

  async executeBackup(projectId: string): Promise<void> {
    try {
      logger.info(
        "Executing scheduled backup",
        "system",
        { projectId },
        "BackupScheduler"
      );

      // Get project and data sources
      const project = await this.dbService.getProject(projectId);
      const dataSources = await this.dbService.getDataSources(projectId);

      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      // Get backup configuration
      const config = await this.getBackupConfig(projectId);
      if (!config || !config.enabled) {
        throw new Error("Backup not configured or disabled");
      }

      // Execute backup based on provider
      let metadata;
      if (config.provider === "s3") {
        if (!this.s3Service.isConfigured()) {
          throw new Error("S3 backup not configured");
        }
        metadata = await this.s3Service.backupProject(
          project,
          dataSources,
          `Scheduled backup - ${new Date().toLocaleString()}`
        );
      } else if (config.provider === "local") {
        if (!this.localService.isConfigured()) {
          throw new Error("Local backup not configured");
        }
        metadata = await this.localService.backupProject(
          project,
          dataSources,
          `Scheduled backup - ${new Date().toLocaleString()}`
        );
      } else {
        throw new Error(`Unknown backup provider: ${config.provider}`);
      }

      // Update configuration with last backup time
      config.lastBackup = new Date();
      config.nextBackup = this.calculateNextRun(config);
      await this.saveBackupConfig(projectId, config);

      // Update schedule status
      await this.updateBackupScheduleStatus(projectId, true, new Date());

      logger.success(
        "Scheduled backup completed",
        "system",
        {
          projectId,
          backupId: metadata.id,
          provider: config.provider,
        },
        "BackupScheduler"
      );
    } catch (error) {
      logger.error(
        "Scheduled backup failed",
        "system",
        { error, projectId },
        "BackupScheduler"
      );

      // Update schedule with error
      await this.updateBackupScheduleStatus(
        projectId,
        true,
        undefined,
        error instanceof Error ? error.message : String(error)
      );

      throw error;
    }
  }

  async getBackupConfig(projectId: string): Promise<BackupConfig | null> {
    try {
      const configKey = `backup_config_${projectId}`;
      const configJson = localStorage.getItem(configKey);
      return configJson ? JSON.parse(configJson) : null;
    } catch (error) {
      logger.error(
        "Failed to get backup config",
        "system",
        { error, projectId },
        "BackupScheduler"
      );
      return null;
    }
  }

  async getBackupSchedule(projectId: string): Promise<BackupSchedule | null> {
    try {
      const scheduleKey = `backup_schedule_${projectId}`;
      const scheduleJson = localStorage.getItem(scheduleKey);
      return scheduleJson ? JSON.parse(scheduleJson) : null;
    } catch (error) {
      logger.error(
        "Failed to get backup schedule",
        "system",
        { error, projectId },
        "BackupScheduler"
      );
      return null;
    }
  }

  private calculateNextRun(config: BackupConfig): Date {
    const interval = BACKUP_FREQUENCY_INTERVALS[config.frequency];
    const now = new Date();
    return new Date(now.getTime() + interval);
  }

  private async saveBackupConfig(
    projectId: string,
    config: BackupConfig
  ): Promise<void> {
    try {
      const configKey = `backup_config_${projectId}`;
      localStorage.setItem(configKey, JSON.stringify(config));
    } catch (error) {
      logger.error(
        "Failed to save backup config",
        "system",
        { error, projectId },
        "BackupScheduler"
      );
      throw error;
    }
  }

  private async saveBackupSchedule(schedule: BackupSchedule): Promise<void> {
    try {
      const scheduleKey = `backup_schedule_${schedule.projectId}`;
      localStorage.setItem(scheduleKey, JSON.stringify(schedule));
    } catch (error) {
      logger.error(
        "Failed to save backup schedule",
        "system",
        { error, projectId: schedule.projectId },
        "BackupScheduler"
      );
      throw error;
    }
  }

  private async updateBackupScheduleStatus(
    projectId: string,
    isRunning: boolean,
    lastRun?: Date,
    error?: string
  ): Promise<void> {
    try {
      const schedule = await this.getBackupSchedule(projectId);
      if (schedule) {
        schedule.isRunning = isRunning;
        if (lastRun) schedule.lastRun = lastRun;
        if (error) schedule.error = error;
        else delete schedule.error;

        await this.saveBackupSchedule(schedule);
      }
    } catch (error) {
      logger.error(
        "Failed to update backup schedule status",
        "system",
        { error, projectId },
        "BackupScheduler"
      );
    }
  }

  // Clean up old backups based on maxBackups setting
  async cleanupOldBackups(projectId: string): Promise<void> {
    try {
      const config = await this.getBackupConfig(projectId);
      if (!config || !config.maxBackups) return;

      const provider = config.provider;
      let backups;

      if (provider === "s3") {
        backups = await this.s3Service.listBackups(projectId);
      } else if (provider === "local") {
        backups = await this.localService.listBackups(projectId);
      } else {
        return;
      }

      if (backups.length > config.maxBackups) {
        const backupsToDelete = backups.slice(config.maxBackups);

        for (const backup of backupsToDelete) {
          try {
            if (provider === "s3") {
              await this.s3Service.deleteBackup(backup.id, projectId);
            } else if (provider === "local") {
              await this.localService.deleteBackup(backup.id, projectId);
            }
          } catch (error) {
            logger.error(
              "Failed to delete old backup",
              "system",
              { error, backupId: backup.id, projectId },
              "BackupScheduler"
            );
          }
        }

        logger.info(
          "Cleaned up old backups",
          "system",
          {
            projectId,
            deletedCount: backupsToDelete.length,
            remainingCount: config.maxBackups,
          },
          "BackupScheduler"
        );
      }
    } catch (error) {
      logger.error(
        "Failed to cleanup old backups",
        "system",
        { error, projectId },
        "BackupScheduler"
      );
    }
  }

  // Initialize all backup schedules on app startup
  async initializeAllSchedules(): Promise<void> {
    try {
      logger.info(
        "Initializing backup schedules",
        "system",
        undefined,
        "BackupScheduler"
      );

      // Get all projects
      const projects = await this.dbService.getProjects();

      for (const project of projects) {
        try {
          const config = await this.getBackupConfig(project.id);
          if (config && config.enabled && config.frequency !== "disabled") {
            await this.startBackup(project.id, config);
          }
        } catch (error) {
          logger.error(
            "Failed to initialize backup schedule for project",
            "system",
            { error, projectId: project.id },
            "BackupScheduler"
          );
        }
      }

      logger.success(
        "Backup schedules initialized",
        "system",
        { projectCount: projects.length },
        "BackupScheduler"
      );
    } catch (error) {
      logger.error(
        "Failed to initialize backup schedules",
        "system",
        { error },
        "BackupScheduler"
      );
    }
  }

  // Stop all backup schedules
  async stopAllSchedules(): Promise<void> {
    try {
      const projectIds = Array.from(this.schedules.keys());

      for (const projectId of projectIds) {
        await this.stopBackup(projectId);
      }

      logger.info(
        "All backup schedules stopped",
        "system",
        { scheduleCount: projectIds.length },
        "BackupScheduler"
      );
    } catch (error) {
      logger.error(
        "Failed to stop all backup schedules",
        "system",
        { error },
        "BackupScheduler"
      );
    }
  }

  /**
   * Get all scheduled backups
   */
  async getScheduledBackups(): Promise<
    Array<{
      id: string;
      projectId: string;
      projectName?: string;
      schedule: string;
      nextRun: number;
      lastRun?: number;
      status: string;
      type: string;
      config: any;
    }>
  > {
    try {
      const projects = await this.dbService.getProjects();
      const scheduledBackups = [];

      for (const project of projects) {
        const schedule = await this.getBackupSchedule(project.id);
        if (schedule && schedule.isRunning && schedule.config.enabled) {
          // Convert frequency to cron expression
          const cronExpression = this.frequencyToCron(
            schedule.config.frequency
          );

          scheduledBackups.push({
            id: `backup_${project.id}`,
            projectId: project.id,
            projectName: project.name,
            schedule: cronExpression,
            nextRun: schedule.nextRun?.getTime() || Date.now(),
            lastRun: schedule.lastRun?.getTime(),
            status: schedule.isRunning ? "active" : "paused",
            type: "system",
            config: schedule,
          });
        }
      }

      return scheduledBackups;
    } catch (error) {
      logger.error(
        "Failed to get scheduled backups",
        "system",
        { error },
        "BackupScheduler"
      );
      return [];
    }
  }

  /**
   * Get backup history
   */
  async getBackupHistory(): Promise<
    Array<{
      id: string;
      projectId: string;
      projectName?: string;
      startedAt: number;
      completedAt?: number;
      status: string;
      duration?: number;
      error?: string;
      type: string;
      size?: number;
    }>
  > {
    try {
      // This would typically come from a backup history table
      // For now, return empty array as backup history tracking isn't fully implemented
      return [];
    } catch (error) {
      logger.error(
        "Failed to get backup history",
        "system",
        { error },
        "BackupScheduler"
      );
      return [];
    }
  }

  /**
   * Convert backup frequency to cron expression
   */
  private frequencyToCron(frequency: BackupFrequency): string {
    switch (frequency) {
      case "every_15_minutes":
        return "*/15 * * * *";
      case "hourly":
        return "0 * * * *";
      case "every_6_hours":
        return "0 */6 * * *";
      case "daily":
        return "0 2 * * *"; // 2 AM daily
      case "weekly":
        return "0 2 * * 0"; // 2 AM every Sunday
      case "monthly":
        return "0 2 1 * *"; // 2 AM on the 1st of every month
      default:
        return "0 2 * * *"; // Default to daily
    }
  }
}
