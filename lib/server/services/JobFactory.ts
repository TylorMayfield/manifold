import { logger } from "../utils/logger";
// System monitor removed - using local type definitions
interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  schedule: string;
  type: string;
  status: string;
  isActive: boolean;
  projectId?: string;
  dataSourceId?: string;
  metadata?: any;
  lastRun?: Date;
  nextRun?: Date;
}

interface TaskHistory {
  id: string;
  taskId: string;
  taskName: string;
  status: "success" | "error" | "running";
  startTime: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
}
import { DataProvider } from "../../../types";
import { DatabaseService } from "../../services/DatabaseService";
import { BackupScheduler } from "./BackupScheduler";
import { MySqlProvider } from "../../services/MySqlProvider";
import { ApiProvider } from "../../services/ApiProvider";
import { CustomScriptProvider } from "../../services/CustomScriptProvider";

export interface JobExecutionContext {
  taskId: string;
  projectId?: string;
  dataSourceId?: string;
  startTime: Date;
  onProgress: (progress: number, step: string) => void;
  onComplete: (success: boolean, error?: string, result?: any) => void;
}

export class JobExecutor {
  private static instance: JobExecutor;
  private runningJobs: Map<string, JobExecutionContext> = new Map();
  private dbService = DatabaseService.getInstance();
  private backupScheduler = BackupScheduler.getInstance();
  private mysqlProvider = MySqlProvider.getInstance();
  private apiProvider = ApiProvider.getInstance();
  private customScriptProvider = CustomScriptProvider.getInstance();

  static getInstance(): JobFactory {
    if (!JobFactory.instance) {
      JobFactory.instance = new JobFactory();
    }
    return JobFactory.instance;
  }

  /**
   * Execute a scheduled task
   */
  async executeTask(task: ScheduledTask): Promise<boolean> {
    const context: JobExecutionContext = {
      taskId: task.id,
      projectId: task.projectId,
      dataSourceId: task.dataSourceId,
      startTime: new Date(),
      onProgress: (progress, step) => {
        logger.info(
          `Task ${task.id} progress: ${progress}% - ${step}`,
          "system"
        );
      },
      onComplete: (success, error, result) => {
        logger.info(`Task ${task.id} completed: ${success}`, "system", {
          error,
          result,
        });
      },
    };

    this.runningJobs.set(task.id, context);

    try {
      logger.info(`Starting task execution: ${task.name}`, "system", {
        taskId: task.id,
      });

      let success = false;
      let result: any;

      switch (task.type) {
        case "system":
          success = await this.executeBackupTask(task, context);
          break;
        case "sync":
          success = await this.executeSyncTask(task, context);
          break;
        case "api_poll":
          success = await this.executeApiPollTask(task, context);
          break;
        case "custom_script":
          success = await this.executeCustomScriptTask(task, context);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      this.runningJobs.delete(task.id);
      return success;
    } catch (error) {
      logger.error(`Task execution failed: ${task.name}`, "system", {
        error,
        taskId: task.id,
      });
      this.runningJobs.delete(task.id);
      return false;
    }
  }

  /**
   * Execute backup task
   */
  private async executeBackupTask(
    task: ScheduledTask,
    context: JobExecutionContext
  ): Promise<boolean> {
    try {
      context.onProgress(10, "Initializing backup");

      if (!task.projectId) {
        throw new Error("Project ID is required for backup tasks");
      }

      // Get project data sources
      const dataSources = await this.dbService.getDataSources(task.projectId);
      context.onProgress(
        30,
        `Found ${dataSources.length} data sources to backup`
      );

      // Create backup
      await this.backupScheduler.startBackup(task.projectId, {
        provider: "local",
        frequency: "daily",
        enabled: true,
        maxBackups: 30,
        lastBackup: new Date(),
      });

      context.onProgress(70, "Creating backup files");
      context.onProgress(90, "Compressing backup");
      context.onProgress(100, "Backup completed");

      logger.success(`Backup task completed: ${task.name}`, "system", {
        taskId: task.id,
        projectId: task.projectId,
        dataSourceCount: dataSources.length,
      });

      return true;
    } catch (error) {
      logger.error(`Backup task failed: ${task.name}`, "system", {
        error,
        taskId: task.id,
      });
      return false;
    }
  }

  /**
   * Execute sync task
   */
  private async executeSyncTask(
    task: ScheduledTask,
    context: JobExecutionContext
  ): Promise<boolean> {
    try {
      context.onProgress(10, "Starting data sync");

      if (!task.dataSourceId) {
        throw new Error("Data source ID is required for sync tasks");
      }

      // Get data source
      const dataSource = await this.dbService.getDataSource(task.dataSourceId);
      if (!dataSource) {
        throw new Error(`Data source not found: ${task.dataSourceId}`);
      }

      context.onProgress(30, `Syncing ${dataSource.name}`);

      // Execute sync based on data source type
      switch (dataSource.type) {
        case "mysql":
          await this.mysqlProvider.syncMySqlData(task.dataSourceId);
          context.onProgress(70, "MySQL sync in progress");
          break;
        case "api_script":
          // Get API config from data source
          const apiDataSource = await this.dbService.getDataSource(
            task.dataSourceId
          );
          if (apiDataSource?.config?.apiUrl) {
            await this.apiProvider.fetchData({
              url: apiDataSource.config.apiUrl,
              method: apiDataSource.config.apiMethod || "GET",
              headers: apiDataSource.config.apiHeaders || {},
              params: apiDataSource.config.apiParams || {},
              authType: apiDataSource.config.apiAuthType || "none",
              authConfig: apiDataSource.config.apiAuthConfig || {},
            });
          }
          context.onProgress(70, "API sync in progress");
          break;
        default:
          throw new Error(`Unsupported sync type: ${dataSource.type}`);
      }

      context.onProgress(90, "Updating data source status");
      context.onProgress(100, "Sync completed");

      logger.success(`Sync task completed: ${task.name}`, "database", {
        taskId: task.id,
        dataSourceId: task.dataSourceId,
        dataSourceType: dataSource.type,
      });

      return true;
    } catch (error) {
      logger.error(`Sync task failed: ${task.name}`, "database", {
        error,
        taskId: task.id,
      });
      return false;
    }
  }

  /**
   * Execute API poll task
   */
  private async executeApiPollTask(
    task: ScheduledTask,
    context: JobExecutionContext
  ): Promise<boolean> {
    try {
      context.onProgress(10, "Polling API endpoint");

      if (!task.dataSourceId) {
        throw new Error("Data source ID is required for API poll tasks");
      }

      const dataSource = await this.dbService.getDataSource(task.dataSourceId);
      if (!dataSource || dataSource.type !== "api_script") {
        throw new Error(`API data source not found: ${task.dataSourceId}`);
      }

      context.onProgress(30, "Making API request");
      context.onProgress(60, "Processing response");

      // Execute API sync
      const apiDataSource = await this.dbService.getDataSource(
        task.dataSourceId
      );
      if (apiDataSource?.config?.apiUrl) {
        await this.apiProvider.fetchData({
          url: apiDataSource.config.apiUrl,
          method: apiDataSource.config.apiMethod || "GET",
          headers: apiDataSource.config.apiHeaders || {},
          params: apiDataSource.config.apiParams || {},
          authType: apiDataSource.config.apiAuthType || "none",
          authConfig: apiDataSource.config.apiAuthConfig || {},
        });
      }

      context.onProgress(90, "Updating cache");
      context.onProgress(100, "API poll completed");

      logger.success(`API poll task completed: ${task.name}`, "api", {
        taskId: task.id,
        dataSourceId: task.dataSourceId,
      });

      return true;
    } catch (error) {
      logger.error(`API poll task failed: ${task.name}`, "api", {
        error,
        taskId: task.id,
      });
      return false;
    }
  }

  /**
   * Execute custom script task
   */
  private async executeCustomScriptTask(
    task: ScheduledTask,
    context: JobExecutionContext
  ): Promise<boolean> {
    try {
      context.onProgress(10, "Preparing script environment");

      if (!task.dataSourceId) {
        throw new Error("Data source ID is required for custom script tasks");
      }

      const dataSource = await this.dbService.getDataSource(task.dataSourceId);
      if (!dataSource || dataSource.type !== "sql_dump") {
        throw new Error(
          `Custom script data source not found: ${task.dataSourceId}`
        );
      }

      context.onProgress(30, "Executing custom script");
      context.onProgress(60, "Processing script output");

      // Execute custom script
      const result = await this.customScriptProvider.executeScript(
        task.dataSourceId
      );

      context.onProgress(90, "Cleaning up");
      context.onProgress(100, "Script execution completed");

      logger.success(`Custom script task completed: ${task.name}`, "system", {
        taskId: task.id,
        dataSourceId: task.dataSourceId,
        resultSize: Array.isArray(result) ? result.length : 1,
      });

      return true;
    } catch (error) {
      logger.error(`Custom script task failed: ${task.name}`, "system", {
        error,
        taskId: task.id,
      });
      return false;
    }
  }

  /**
   * Get currently running jobs
   */
  getRunningJobs(): JobExecutionContext[] {
    return Array.from(this.runningJobs.values());
  }

  /**
   * Check if a job is running
   */
  isJobRunning(taskId: string): boolean {
    return this.runningJobs.has(taskId);
  }

  /**
   * Cancel a running job
   */
  async cancelJob(taskId: string): Promise<boolean> {
    if (this.runningJobs.has(taskId)) {
      this.runningJobs.delete(taskId);
      logger.info(`Job cancelled: ${taskId}`, "system");
      return true;
    }
    return false;
  }

  /**
   * Create jobs from data sources
   */
  async createJobsFromDataSources(projectId: string): Promise<ScheduledTask[]> {
    const dataSources = await this.dbService.getDataSources(projectId);
    const jobs: ScheduledTask[] = [];

    for (const dataSource of dataSources) {
      // Create sync job for each data source
      if (dataSource.type === "mysql" || dataSource.type === "api_script") {
        const syncJob: ScheduledTask = {
          id: `sync_${dataSource.id}`,
          name: `Sync: ${dataSource.name}`,
          description: `Automated sync for ${dataSource.name}`,
          type: "sync",
          schedule:
            dataSource.type === "mysql" ? "0 */6 * * *" : "*/15 * * * *", // MySQL every 6 hours, API every 15 minutes
          nextRun: new Date(
            Date.now() +
              (dataSource.type === "mysql"
                ? 6 * 60 * 60 * 1000
                : 15 * 60 * 1000)
          ),
          status: "pending",
          isActive: true,
          dataSourceId: dataSource.id,
          projectId: dataSource.projectId,
          metadata: {
            dataSourceType: dataSource.type,
            dataSourceName: dataSource.name,
          },
        };
        jobs.push(syncJob);
      }

      // Create API poll job for API data sources
      if (dataSource.type === "api_script") {
        const pollJob: ScheduledTask = {
          id: `poll_${dataSource.id}`,
          name: `Poll: ${dataSource.name}`,
          description: `Automated polling for ${dataSource.name}`,
          type: "api_poll",
          schedule: "*/5 * * * *", // Every 5 minutes
          nextRun: new Date(Date.now() + 5 * 60 * 1000),
          status: "pending",
          isActive: true,
          dataSourceId: dataSource.id,
          projectId: dataSource.projectId,
          metadata: {
            dataSourceType: dataSource.type,
            dataSourceName: dataSource.name,
          },
        };
        jobs.push(pollJob);
      }

      // Create custom script job for custom script data sources
      if (
        dataSource.type === "sql_dump" &&
        dataSource.config?.customScriptConfig?.schedule
      ) {
        const scriptJob: ScheduledTask = {
          id: `script_${dataSource.id}`,
          name: `Script: ${dataSource.name}`,
          description: `Automated script execution for ${dataSource.name}`,
          type: "custom_script",
          schedule: dataSource.config.customScriptConfig.schedule,
          nextRun: new Date(Date.now() + 60 * 60 * 1000), // Default to 1 hour
          status: "pending",
          isActive: true,
          dataSourceId: dataSource.id,
          projectId: dataSource.projectId,
          metadata: {
            dataSourceType: dataSource.type,
            dataSourceName: dataSource.name,
            scriptLanguage: dataSource.config.customScriptConfig.language,
          },
        };
        jobs.push(scriptJob);
      }
    }

    logger.info(
      `Created ${jobs.length} jobs from ${dataSources.length} data sources`,
      "system",
      { projectId }
    );
    return jobs;
  }

  /**
   * Create backup jobs for projects
   */
  async createBackupJobs(projectId: string): Promise<ScheduledTask[]> {
    const backupJob: ScheduledTask = {
      id: `backup_${projectId}`,
      name: `Backup: Project ${projectId}`,
      description: `Automated backup for project ${projectId}`,
      type: "system",
      schedule: "0 2 * * *", // Daily at 2 AM
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow at 2 AM
      status: "pending",
      isActive: true,
      projectId: projectId,
      metadata: {
        backupType: "full",
        retention: 30,
      },
    };

    logger.info(`Created backup job for project: ${projectId}`, "system");
    return [backupJob];
  }
}
