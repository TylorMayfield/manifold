import { DatabaseManager } from "../database/DatabaseManager";
import { DatabaseLogger } from "./DatabaseLogger";
import { logger } from "../utils/logger";

export interface JobExecutionOptions {
  projectId?: string;
  type: string;
  description?: string;
  config?: any;
  retryCount?: number;
  maxRetries?: number;
}

export interface JobExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
}

export class JobExecutionService {
  private static instance: JobExecutionService;
  private dbManager: DatabaseManager;
  private dbLogger: DatabaseLogger;
  private isInitialized: boolean = false;

  private constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.dbLogger = DatabaseLogger.getInstance();
  }

  static getInstance(): JobExecutionService {
    if (!JobExecutionService.instance) {
      JobExecutionService.instance = new JobExecutionService();
    }
    return JobExecutionService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.dbManager.initialize();
      await this.dbLogger.initialize();
      this.isInitialized = true;
      console.log("Job execution service initialized");
    } catch (error) {
      console.error("Failed to initialize job execution service:", error);
      throw error;
    }
  }

  // Create a new job
  async createJob(options: JobExecutionOptions): Promise<string> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const coreDb = this.dbManager.getCoreDatabase();
      const job = await coreDb.client.job.create({
        data: {
          projectId: options.projectId,
          type: options.type,
          description: options.description,
          config: options.config ? JSON.stringify(options.config) : null,
          status: "pending",
        },
      });

      await this.dbLogger.logAppEvent(
        "info",
        "job-management",
        `Job created: ${options.type}`,
        { jobId: job.id, type: options.type, projectId: options.projectId },
        "JobExecutionService"
      );

      return job.id;
    } catch (error) {
      console.error("Failed to create job:", error);
      throw error;
    }
  }

  // Start job execution
  async startJobExecution(jobId: string): Promise<string> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const coreDb = this.dbManager.getCoreDatabase();

      // Update job status to running
      await coreDb.client.job.update({
        where: { id: jobId },
        data: {
          status: "running",
          startedAt: new Date(),
        },
      });

      // Create execution record
      const execution = await coreDb.client.jobExecution.create({
        data: {
          jobId,
          status: "running",
          startedAt: new Date(),
        },
      });

      await this.dbLogger.logJobExecution(
        execution.id,
        "info",
        "Job execution started",
        { jobId, executionId: execution.id },
        "JobExecutionService"
      );

      return execution.id;
    } catch (error) {
      console.error("Failed to start job execution:", error);
      throw error;
    }
  }

  // Update job execution progress
  async updateJobProgress(
    executionId: string,
    progress: number,
    currentStep?: string
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const coreDb = this.dbManager.getCoreDatabase();

      await coreDb.client.jobExecution.update({
        where: { id: executionId },
        data: {
          progress,
          currentStep,
        },
      });

      // Also update the main job progress
      const execution = await coreDb.client.jobExecution.findUnique({
        where: { id: executionId },
        include: { job: true },
      });

      if (execution) {
        await coreDb.client.job.update({
          where: { id: execution.jobId },
          data: { progress },
        });
      }

      await this.dbLogger.logJobExecution(
        executionId,
        "info",
        `Progress: ${progress}%${currentStep ? ` - ${currentStep}` : ""}`,
        { progress, currentStep },
        "JobExecutionService"
      );
    } catch (error) {
      console.error("Failed to update job progress:", error);
    }
  }

  // Complete job execution
  async completeJobExecution(
    executionId: string,
    result: JobExecutionResult
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const coreDb = this.dbManager.getCoreDatabase();
      const now = new Date();

      // Get execution details
      const execution = await coreDb.client.jobExecution.findUnique({
        where: { id: executionId },
        include: { job: true },
      });

      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }

      const duration = execution.startedAt
        ? now.getTime() - execution.startedAt.getTime()
        : 0;

      // Update execution
      await coreDb.client.jobExecution.update({
        where: { id: executionId },
        data: {
          status: result.success ? "completed" : "failed",
          progress: result.success ? 100 : execution.progress,
          result: result.result ? JSON.stringify(result.result) : null,
          error: result.error,
          completedAt: now,
          duration,
        },
      });

      // Update main job
      await coreDb.client.job.update({
        where: { id: execution.jobId },
        data: {
          status: result.success ? "completed" : "failed",
          progress: result.success ? 100 : execution.progress,
          result: result.result ? JSON.stringify(result.result) : null,
          error: result.error,
          completedAt: now,
        },
      });

      await this.dbLogger.logJobExecution(
        executionId,
        result.success ? "success" : "error",
        result.success
          ? "Job execution completed successfully"
          : "Job execution failed",
        {
          jobId: execution.jobId,
          duration,
          result: result.result,
          error: result.error,
        },
        "JobExecutionService"
      );
    } catch (error) {
      console.error("Failed to complete job execution:", error);
      throw error;
    }
  }

  // Cancel job execution
  async cancelJobExecution(
    executionId: string,
    reason?: string
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const coreDb = this.dbManager.getCoreDatabase();
      const now = new Date();

      // Get execution details
      const execution = await coreDb.client.jobExecution.findUnique({
        where: { id: executionId },
        include: { job: true },
      });

      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }

      const duration = execution.startedAt
        ? now.getTime() - execution.startedAt.getTime()
        : 0;

      // Update execution
      await coreDb.client.jobExecution.update({
        where: { id: executionId },
        data: {
          status: "cancelled",
          completedAt: now,
          duration,
          error: reason,
        },
      });

      // Update main job
      await coreDb.client.job.update({
        where: { id: execution.jobId },
        data: {
          status: "cancelled",
          completedAt: now,
          error: reason,
        },
      });

      await this.dbLogger.logJobExecution(
        executionId,
        "warn",
        "Job execution cancelled",
        {
          jobId: execution.jobId,
          reason,
          duration,
        },
        "JobExecutionService"
      );
    } catch (error) {
      console.error("Failed to cancel job execution:", error);
      throw error;
    }
  }

  // Get job execution history
  async getJobHistory(
    jobId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<any[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      return await this.dbLogger.getJobExecutions(jobId, options);
    } catch (error) {
      console.error("Failed to get job history:", error);
      return [];
    }
  }

  // Get all jobs with history
  async getAllJobsWithHistory(
    projectId?: string,
    options: {
      type?: string;
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<any[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      return await this.dbLogger.getJobsWithHistory(projectId, options);
    } catch (error) {
      console.error("Failed to get all jobs with history:", error);
      return [];
    }
  }

  // Execute a job with proper tracking
  async executeJob<T>(
    options: JobExecutionOptions,
    jobFunction: (
      executionId: string,
      updateProgress: (progress: number, step?: string) => Promise<void>
    ) => Promise<T>
  ): Promise<{ jobId: string; executionId: string; result: T }> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Create job
      const jobId = await this.createJob(options);

      // Start execution
      const executionId = await this.startJobExecution(jobId);

      // Create progress update function
      const updateProgress = async (progress: number, step?: string) => {
        await this.updateJobProgress(executionId, progress, step);
      };

      try {
        // Execute the job function
        const result = await jobFunction(executionId, updateProgress);

        // Complete successfully
        await this.completeJobExecution(executionId, {
          success: true,
          result,
          duration: 0, // Will be calculated in completeJobExecution
        });

        return { jobId, executionId, result };
      } catch (error) {
        // Complete with error
        await this.completeJobExecution(executionId, {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration: 0, // Will be calculated in completeJobExecution
        });

        throw error;
      }
    } catch (error) {
      console.error("Failed to execute job:", error);
      throw error;
    }
  }

  // Get job statistics
  async getJobStats(projectId?: string): Promise<{
    totalJobs: number;
    jobsByStatus: Record<string, number>;
    jobsByType: Record<string, number>;
    averageDuration: number;
    successRate: number;
  }> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const coreDb = this.dbManager.getCoreDatabase();
      const whereClause = projectId ? { projectId } : {};

      const [totalJobs, jobsByStatus, jobsByType, completedJobs] =
        await Promise.all([
          coreDb.client.job.count({ where: whereClause }),
          coreDb.client.job.groupBy({
            by: ["status"],
            where: whereClause,
            _count: { status: true },
          }),
          coreDb.client.job.groupBy({
            by: ["type"],
            where: whereClause,
            _count: { type: true },
          }),
          coreDb.client.job.findMany({
            where: {
              ...whereClause,
              status: { in: ["completed", "failed"] },
              completedAt: { not: null },
            },
            include: {
              executions: {
                where: { status: { in: ["completed", "failed"] } },
                select: { duration: true },
              },
            },
          }),
        ]);

      const successfulJobs = completedJobs.filter(
        (job) => job.status === "completed"
      ).length;
      const totalCompletedJobs = completedJobs.length;
      const successRate =
        totalCompletedJobs > 0
          ? (successfulJobs / totalCompletedJobs) * 100
          : 0;

      const durations = completedJobs
        .flatMap((job) => job.executions.map((exec) => exec.duration))
        .filter((duration) => duration !== null) as number[];

      const averageDuration =
        durations.length > 0
          ? durations.reduce((sum, duration) => sum + duration, 0) /
            durations.length
          : 0;

      return {
        totalJobs,
        jobsByStatus: jobsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>),
        jobsByType: jobsByType.reduce((acc, item) => {
          acc[item.type] = item._count.type;
          return acc;
        }, {} as Record<string, number>),
        averageDuration,
        successRate,
      };
    } catch (error) {
      console.error("Failed to get job stats:", error);
      return {
        totalJobs: 0,
        jobsByStatus: {},
        jobsByType: {},
        averageDuration: 0,
        successRate: 0,
      };
    }
  }
}
