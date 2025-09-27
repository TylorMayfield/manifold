import { clientLogger } from "../utils/ClientLogger";
import { ETLPipelineManager, ETLPipeline } from "./ETLPipelineManager";
import { DataWarehouseIntegrationService } from "./DataWarehouseIntegrationService";

export interface ScheduledETLJob {
  id: string;
  pipelineId: string;
  name: string;
  schedule: string; // Cron expression
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
  config: {
    timeout?: number;
    retries?: number;
    notifications?: {
      onSuccess: boolean;
      onFailure: boolean;
      onStart: boolean;
    };
    environment?: string;
    tags?: string[];
  };
}

export interface ETLExecutionResult {
  executionId: string;
  jobId: string;
  pipelineId: string;
  status: "success" | "failure" | "timeout";
  startTime: Date;
  endTime: Date;
  duration: number;
  recordsProcessed: number;
  recordsFailed: number;
  error?: string;
  metrics: Record<string, any>;
}

export interface ETLVersionInfo {
  pipelineId: string;
  version: string;
  description?: string;
  changes: string[];
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
  rollbackTo?: string;
}

export class ETLSchedulerService {
  private static instance: ETLSchedulerService;
  private etlManager: ETLPipelineManager;
  private integrationService: DataWarehouseIntegrationService;
  private scheduledJobs: Map<string, ScheduledETLJob> = new Map();
  private executionHistory: Map<string, ETLExecutionResult[]> = new Map();
  private pipelineVersions: Map<string, ETLVersionInfo[]> = new Map();
  private cronIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  static getInstance(): ETLSchedulerService {
    if (!ETLSchedulerService.instance) {
      ETLSchedulerService.instance = new ETLSchedulerService();
    }
    return ETLSchedulerService.instance;
  }

  constructor() {
    this.etlManager = ETLPipelineManager.getInstance();
    this.integrationService = DataWarehouseIntegrationService.getInstance();
  }

  // Scheduler Management
  async startScheduler(): Promise<void> {
    if (this.isRunning) {
      clientLogger.warn("ETL scheduler is already running", "job-management");
      return;
    }

    this.isRunning = true;
    clientLogger.info("ETL scheduler started", "job-management");

    // Start all enabled scheduled jobs
    for (const [jobId, job] of this.scheduledJobs) {
      if (job.enabled) {
        await this.scheduleJob(job);
      }
    }
  }

  async stopScheduler(): Promise<void> {
    if (!this.isRunning) {
      clientLogger.warn("ETL scheduler is not running", "job-management");
      return;
    }

    this.isRunning = false;

    // Stop all cron intervals
    for (const [jobId, interval] of this.cronIntervals) {
      clearInterval(interval);
    }
    this.cronIntervals.clear();

    clientLogger.info("ETL scheduler stopped", "job-management");
  }

  // Job Management
  async createScheduledJob(
    pipelineId: string,
    schedule: string,
    config: Partial<ScheduledETLJob["config"]> = {}
  ): Promise<string> {
    const pipeline = this.etlManager.getPipeline(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    const jobId = `etl_job_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const now = new Date();

    const job: ScheduledETLJob = {
      id: jobId,
      pipelineId,
      name: `Scheduled: ${pipeline.name}`,
      schedule,
      enabled: true,
      runCount: 0,
      successCount: 0,
      failureCount: 0,
      createdAt: now,
      updatedAt: now,
      config: {
        timeout: 1800, // 30 minutes default
        retries: 3,
        notifications: {
          onSuccess: true,
          onFailure: true,
          onStart: false,
        },
        environment: "production",
        tags: [],
        ...config,
      },
    };

    // Calculate next run time
    job.nextRun = this.calculateNextRun(schedule);

    this.scheduledJobs.set(jobId, job);
    this.executionHistory.set(jobId, []);

    // Schedule the job if scheduler is running
    if (this.isRunning) {
      await this.scheduleJob(job);
    }

    // Create version info for the pipeline
    await this.createPipelineVersion(
      pipelineId,
      "1.0.0",
      "Initial version",
      []
    );

    clientLogger.info("Scheduled ETL job created", "job-management", {
      jobId,
      pipelineId,
      schedule,
      nextRun: job.nextRun,
    });

    return jobId;
  }

  async updateScheduledJob(
    jobId: string,
    updates: Partial<ScheduledETLJob>
  ): Promise<boolean> {
    const job = this.scheduledJobs.get(jobId);
    if (!job) return false;

    const updatedJob = { ...job, ...updates, updatedAt: new Date() };

    // Recalculate next run if schedule changed
    if (updates.schedule) {
      updatedJob.nextRun = this.calculateNextRun(updates.schedule);
    }

    this.scheduledJobs.set(jobId, updatedJob);

    // Reschedule if scheduler is running
    if (this.isRunning) {
      await this.unscheduleJob(jobId);
      if (updatedJob.enabled) {
        await this.scheduleJob(updatedJob);
      }
    }

    clientLogger.info("Scheduled ETL job updated", "job-management", {
      jobId,
      updates: Object.keys(updates),
    });

    return true;
  }

  async deleteScheduledJob(jobId: string): Promise<boolean> {
    const job = this.scheduledJobs.get(jobId);
    if (!job) return false;

    await this.unscheduleJob(jobId);
    this.scheduledJobs.delete(jobId);
    this.executionHistory.delete(jobId);

    clientLogger.info("Scheduled ETL job deleted", "job-management", {
      jobId,
      pipelineId: job.pipelineId,
    });

    return true;
  }

  // Job Scheduling
  private async scheduleJob(job: ScheduledETLJob): Promise<void> {
    if (!this.isRunning) return;

    // Parse cron expression and set up interval
    const intervalMs = this.parseCronExpression(job.schedule);

    const interval = setInterval(async () => {
      try {
        await this.executeScheduledJob(job.id);
      } catch (error) {
        clientLogger.error(
          "Scheduled ETL job execution failed",
          "job-management",
          {
            jobId: job.id,
            error,
          }
        );
      }
    }, intervalMs);

    this.cronIntervals.set(job.id, interval);

    clientLogger.info("ETL job scheduled", "job-management", {
      jobId: job.id,
      schedule: job.schedule,
      nextRun: job.nextRun,
    });
  }

  private async unscheduleJob(jobId: string): Promise<void> {
    const interval = this.cronIntervals.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.cronIntervals.delete(jobId);
    }
  }

  // Job Execution
  async executeScheduledJob(jobId: string): Promise<ETLExecutionResult> {
    const job = this.scheduledJobs.get(jobId);
    if (!job) {
      throw new Error(`Scheduled job ${jobId} not found`);
    }

    const startTime = new Date();
    let executionResult: ETLExecutionResult;

    try {
      clientLogger.info("Executing scheduled ETL job", "job-management", {
        jobId,
        pipelineId: job.pipelineId,
        runCount: job.runCount + 1,
      });

      // Execute the pipeline
      const executionId = await this.etlManager.executePipeline(
        job.pipelineId,
        {
          dryRun: false,
        }
      );

      // Wait for execution to complete (in a real implementation, this would poll or use callbacks)
      await this.waitForExecution(executionId, job.config.timeout || 1800);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      executionResult = {
        executionId,
        jobId,
        pipelineId: job.pipelineId,
        status: "success",
        startTime,
        endTime,
        duration,
        recordsProcessed: 0, // Would be populated from execution details
        recordsFailed: 0,
        metrics: {},
      };

      // Update job statistics
      job.runCount++;
      job.successCount++;
      job.lastRun = startTime;
      job.nextRun = this.calculateNextRun(job.schedule);

      // Store execution result
      const history = this.executionHistory.get(jobId) || [];
      history.push(executionResult);
      this.executionHistory.set(jobId, history);

      // Integrate with data warehouse services
      await this.integrationService.onJobExecuted(jobId, "etl_pipeline", {
        success: true,
        executionId,
        duration,
      });

      clientLogger.success(
        "Scheduled ETL job completed successfully",
        "job-management",
        {
          jobId,
          executionId,
          duration,
        }
      );
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      executionResult = {
        executionId: `failed_${Date.now()}`,
        jobId,
        pipelineId: job.pipelineId,
        status: "failure",
        startTime,
        endTime,
        duration,
        recordsProcessed: 0,
        recordsFailed: 0,
        error: error instanceof Error ? error.message : "Unknown error",
        metrics: {},
      };

      // Update job statistics
      job.runCount++;
      job.failureCount++;
      job.lastRun = startTime;
      job.nextRun = this.calculateNextRun(job.schedule);

      // Store execution result
      const history = this.executionHistory.get(jobId) || [];
      history.push(executionResult);
      this.executionHistory.set(jobId, history);

      // Integrate with data warehouse services
      await this.integrationService.onJobExecuted(jobId, "etl_pipeline", {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
      });

      clientLogger.error("Scheduled ETL job failed", "job-management", {
        jobId,
        error,
        duration,
      });
    }

    return executionResult;
  }

  // Pipeline Versioning
  async createPipelineVersion(
    pipelineId: string,
    version: string,
    description?: string,
    changes: string[] = [],
    createdBy: string = "system"
  ): Promise<string> {
    const versions = this.pipelineVersions.get(pipelineId) || [];

    const versionInfo: ETLVersionInfo = {
      pipelineId,
      version,
      description,
      changes,
      createdAt: new Date(),
      createdBy,
      isActive: versions.length === 0, // First version is active by default
    };

    versions.push(versionInfo);
    this.pipelineVersions.set(pipelineId, versions);

    clientLogger.info("ETL pipeline version created", "job-management", {
      pipelineId,
      version,
      createdBy,
      changes: changes.length,
    });

    return version;
  }

  async activatePipelineVersion(
    pipelineId: string,
    version: string
  ): Promise<boolean> {
    const versions = this.pipelineVersions.get(pipelineId);
    if (!versions) return false;

    const versionIndex = versions.findIndex((v) => v.version === version);
    if (versionIndex === -1) return false;

    // Deactivate all versions
    versions.forEach((v) => (v.isActive = false));

    // Activate the specified version
    versions[versionIndex].isActive = true;

    clientLogger.info("ETL pipeline version activated", "job-management", {
      pipelineId,
      version,
    });

    return true;
  }

  async rollbackPipelineVersion(
    pipelineId: string,
    targetVersion: string
  ): Promise<boolean> {
    const versions = this.pipelineVersions.get(pipelineId);
    if (!versions) return false;

    const targetVersionInfo = versions.find((v) => v.version === targetVersion);
    if (!targetVersionInfo) return false;

    // Create a new version for the rollback
    const rollbackVersion = this.generateNextVersion(versions);
    await this.createPipelineVersion(
      pipelineId,
      rollbackVersion,
      `Rollback to version ${targetVersion}`,
      [`Rolled back from current version to ${targetVersion}`],
      "system"
    );

    // Activate the rollback version
    await this.activatePipelineVersion(pipelineId, rollbackVersion);

    clientLogger.info("ETL pipeline version rolled back", "job-management", {
      pipelineId,
      fromVersion: versions.find((v) => v.isActive)?.version,
      toVersion: targetVersion,
      rollbackVersion,
    });

    return true;
  }

  // Utility Methods
  private calculateNextRun(schedule: string): Date {
    // Simple cron parser - in a real implementation, use a proper cron library
    const now = new Date();
    const [minute, hour, day, month, dayOfWeek] = schedule.split(" ");

    // For demo purposes, assume it's a simple interval
    if (schedule.includes("*/")) {
      const interval = parseInt(schedule.split("*/")[1]);
      return new Date(now.getTime() + interval * 60 * 1000);
    }

    // Default to next hour
    return new Date(now.getTime() + 60 * 60 * 1000);
  }

  private parseCronExpression(schedule: string): number {
    // Simple cron parser - in a real implementation, use a proper cron library
    if (schedule.includes("*/")) {
      const interval = parseInt(schedule.split("*/")[1]);
      return interval * 60 * 1000; // Convert minutes to milliseconds
    }

    // Default to 1 hour
    return 60 * 60 * 1000;
  }

  private async waitForExecution(
    executionId: string,
    timeoutMs: number
  ): Promise<void> {
    // In a real implementation, this would poll the execution status
    // For demo purposes, just wait a short time
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  private generateNextVersion(versions: ETLVersionInfo[]): string {
    if (versions.length === 0) return "1.0.0";

    const latestVersion = versions[versions.length - 1];
    const [major, minor, patch] = latestVersion.version.split(".").map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  // Getters
  getScheduledJobs(): ScheduledETLJob[] {
    return Array.from(this.scheduledJobs.values());
  }

  getScheduledJob(jobId: string): ScheduledETLJob | undefined {
    return this.scheduledJobs.get(jobId);
  }

  getExecutionHistory(jobId: string): ETLExecutionResult[] {
    return this.executionHistory.get(jobId) || [];
  }

  getPipelineVersions(pipelineId: string): ETLVersionInfo[] {
    return this.pipelineVersions.get(pipelineId) || [];
  }

  getActivePipelineVersion(pipelineId: string): ETLVersionInfo | undefined {
    const versions = this.pipelineVersions.get(pipelineId);
    return versions?.find((v) => v.isActive);
  }

  getSchedulerStatus(): {
    isRunning: boolean;
    totalJobs: number;
    activeJobs: number;
    totalExecutions: number;
    successRate: number;
  } {
    const totalJobs = this.scheduledJobs.size;
    const activeJobs = Array.from(this.scheduledJobs.values()).filter(
      (job) => job.enabled
    ).length;
    const totalExecutions = Array.from(this.executionHistory.values()).reduce(
      (sum, history) => sum + history.length,
      0
    );
    const successfulExecutions = Array.from(this.scheduledJobs.values()).reduce(
      (sum, job) => sum + job.successCount,
      0
    );
    const successRate =
      totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

    return {
      isRunning: this.isRunning,
      totalJobs,
      activeJobs,
      totalExecutions,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  // Health Check
  async getHealthStatus(): Promise<{
    status: string;
    message: string;
    details: {
      schedulerRunning: boolean;
      totalJobs: number;
      activeJobs: number;
      failedJobs: number;
      lastExecution?: Date;
    };
  }> {
    const status = this.getSchedulerStatus();
    const failedJobs = Array.from(this.scheduledJobs.values()).filter(
      (job) => job.failureCount > 0
    ).length;

    const lastExecution = Array.from(this.scheduledJobs.values())
      .filter((job) => job.lastRun)
      .sort(
        (a, b) => (b.lastRun?.getTime() || 0) - (a.lastRun?.getTime() || 0)
      )[0]?.lastRun;

    const overallStatus =
      status.isRunning && status.successRate >= 80
        ? "healthy"
        : status.isRunning && status.successRate >= 60
        ? "degraded"
        : "unhealthy";

    return {
      status: overallStatus,
      message: `ETL Scheduler: ${status.totalJobs} jobs, ${status.successRate}% success rate`,
      details: {
        schedulerRunning: status.isRunning,
        totalJobs: status.totalJobs,
        activeJobs: status.activeJobs,
        failedJobs,
        lastExecution,
      },
    };
  }
}
