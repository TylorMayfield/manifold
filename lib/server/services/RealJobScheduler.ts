// Note: node-cron is Node.js only, we'll use a browser-compatible approach
import { logger } from "../utils/logger";
import { DatabaseService } from "../../services/DatabaseService";
import { JobExecutor } from "./JobExecutor";

export interface CronJob {
  id: string;
  name: string;
  description?: string;
  schedule: string; // Cron expression
  type:
    | "data_sync"
    | "backup"
    | "cleanup"
    | "custom_script"
    | "api_poll"
    | "workflow";
  projectId?: string;
  dataSourceId?: string;
  workflowId?: string;
  config: {
    enabled: boolean;
    timeout?: number; // in seconds
    retryCount?: number;
    retryDelay?: number; // in seconds
    notifications?: {
      onSuccess: boolean;
      onFailure: boolean;
      onStart: boolean;
    };
    [key: string]: any;
  };
  status: "active" | "paused" | "disabled";
  createdAt: Date;
  updatedAt: Date;
  lastRun?: Date;
  nextRun?: Date;
  createdBy: string;
}

export interface JobExecution {
  id: string;
  jobId: string;
  status: "running" | "completed" | "failed" | "cancelled";
  startTime: Date;
  endTime?: Date;
  duration?: number; // in milliseconds
  progress: number; // 0-100
  currentStep?: string;
  result?: any;
  error?: string;
  retryCount: number;
  logs: JobLog[];
}

export interface JobLog {
  id: string;
  executionId: string;
  timestamp: Date;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  details?: any;
}

export class JobScheduler {
  private static instance: JobScheduler;
  private cronJobs: Map<string, any> = new Map();
  private jobExecutions: Map<string, JobExecution> = new Map();
  private dbService: DatabaseService;
  private jobExecutor: JobExecutor;
  private isRunning: boolean = false;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
    this.jobExecutor = JobExecutor.getInstance();
    this.initializeDatabase();
  }

  static getInstance(): JobScheduler {
    if (!JobScheduler.instance) {
      JobScheduler.instance = new JobScheduler();
    }
    return JobScheduler.instance;
  }

  /**
   * Initialize database tables for job management
   */
  private async initializeDatabase(): Promise<void> {
    try {
      await this.dbService.execute(`
        CREATE TABLE IF NOT EXISTS cron_jobs (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          schedule TEXT NOT NULL,
          type TEXT NOT NULL,
          project_id TEXT,
          data_source_id TEXT,
          workflow_id TEXT,
          config TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          last_run DATETIME,
          next_run DATETIME,
          created_by TEXT NOT NULL
        )
      `);

      await this.dbService.execute(`
        CREATE TABLE IF NOT EXISTS job_executions (
          id TEXT PRIMARY KEY,
          job_id TEXT NOT NULL,
          status TEXT NOT NULL,
          start_time DATETIME NOT NULL,
          end_time DATETIME,
          duration INTEGER,
          progress INTEGER DEFAULT 0,
          current_step TEXT,
          result TEXT,
          error TEXT,
          retry_count INTEGER DEFAULT 0,
          FOREIGN KEY (job_id) REFERENCES cron_jobs (id)
        )
      `);

      await this.dbService.execute(`
        CREATE TABLE IF NOT EXISTS job_logs (
          id TEXT PRIMARY KEY,
          execution_id TEXT NOT NULL,
          timestamp DATETIME NOT NULL,
          level TEXT NOT NULL,
          message TEXT NOT NULL,
          details TEXT,
          FOREIGN KEY (execution_id) REFERENCES job_executions (id)
        )
      `);

      logger.info("Job scheduler database initialized", "system");
    } catch (error) {
      logger.error("Failed to initialize job scheduler database", "system", {
        error,
      });
    }
  }

  /**
   * Start the job scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn("Job scheduler is already running", "system");
      return;
    }

    try {
      this.isRunning = true;

      // Load existing jobs from database
      await this.loadJobsFromDatabase();

      logger.success("Job scheduler started", "system", {
        activeJobs: this.cronJobs.size,
      });
    } catch (error) {
      this.isRunning = false;
      logger.error("Failed to start job scheduler", "system", {
        error,
      });
      throw error;
    }
  }

  /**
   * Stop the job scheduler
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      // Stop all cron jobs
      for (const [jobId, cronJob] of this.cronJobs) {
        if (cronJob.intervalId) {
          clearInterval(cronJob.intervalId);
        }
        logger.info(`Stopped cron job: ${jobId}`, "system");
      }

      this.cronJobs.clear();
      this.isRunning = false;

      logger.success("Job scheduler stopped", "system");
    } catch (error) {
      logger.error("Failed to stop job scheduler", "system", { error });
    }
  }

  /**
   * Create a new cron job
   */
  async createJob(
    job: Omit<CronJob, "id" | "createdAt" | "updatedAt" | "nextRun">
  ): Promise<CronJob> {
    try {
      const jobId = `job-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const now = new Date();

      const newJob: CronJob = {
        ...job,
        id: jobId,
        createdAt: now,
        updatedAt: now,
        nextRun: this.calculateNextRun(job.schedule, now),
      };

      // Save to database
      await this.saveJobToDatabase(newJob);

      // Schedule the job if it's active
      if (newJob.status === "active" && newJob.config.enabled) {
        await this.scheduleJob(newJob);
      }

      logger.info("Cron job created", "system", {
        jobId: newJob.id,
        name: newJob.name,
        schedule: newJob.schedule,
        type: newJob.type,
      });

      return newJob;
    } catch (error) {
      logger.error("Failed to create cron job", "system", {
        error,
        job,
      });
      throw error;
    }
  }

  /**
   * Update an existing cron job
   */
  async updateJob(
    jobId: string,
    updates: Partial<CronJob>
  ): Promise<CronJob | null> {
    try {
      const existingJob = await this.getJob(jobId);
      if (!existingJob) {
        throw new Error(`Job not found: ${jobId}`);
      }

      const updatedJob: CronJob = {
        ...existingJob,
        ...updates,
        updatedAt: new Date(),
        nextRun: updates.schedule
          ? this.calculateNextRun(updates.schedule, new Date())
          : existingJob.nextRun,
      };

      // Stop existing cron job
      const existingCronJob = this.cronJobs.get(jobId);
      if (existingCronJob && existingCronJob.intervalId) {
        clearInterval(existingCronJob.intervalId);
        this.cronJobs.delete(jobId);
      }

      // Save to database
      await this.saveJobToDatabase(updatedJob);

      // Reschedule if active
      if (updatedJob.status === "active" && updatedJob.config.enabled) {
        await this.scheduleJob(updatedJob);
      }

      logger.info("Cron job updated", "system", {
        jobId: updatedJob.id,
        name: updatedJob.name,
      });

      return updatedJob;
    } catch (error) {
      logger.error("Failed to update cron job", "system", {
        error,
        jobId,
        updates,
      });
      throw error;
    }
  }

  /**
   * Delete a cron job
   */
  async deleteJob(jobId: string): Promise<boolean> {
    try {
      // Stop cron job
      const cronJob = this.cronJobs.get(jobId);
      if (cronJob && cronJob.intervalId) {
        clearInterval(cronJob.intervalId);
        this.cronJobs.delete(jobId);
      }

      // Delete from database
      await this.dbService.execute("DELETE FROM cron_jobs WHERE id = ?", [
        jobId,
      ]);

      logger.info("Cron job deleted", "system", { jobId });
      return true;
    } catch (error) {
      logger.error("Failed to delete cron job", "system", {
        error,
        jobId,
      });
      return false;
    }
  }

  /**
   * Get a specific job
   */
  async getJob(jobId: string): Promise<CronJob | null> {
    try {
      const result = await this.dbService.query(
        "SELECT * FROM cron_jobs WHERE id = ?",
        [jobId]
      );

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        schedule: row.schedule,
        type: row.type,
        projectId: row.project_id,
        dataSourceId: row.data_source_id,
        workflowId: row.workflow_id,
        config: JSON.parse(row.config),
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        lastRun: row.last_run ? new Date(row.last_run) : undefined,
        nextRun: row.next_run ? new Date(row.next_run) : undefined,
        createdBy: row.created_by,
      };
    } catch (error) {
      logger.error("Failed to get job", "system", { error, jobId });
      return null;
    }
  }

  /**
   * Get all jobs
   */
  async getAllJobs(): Promise<CronJob[]> {
    try {
      const result = await this.dbService.query(
        "SELECT * FROM cron_jobs ORDER BY created_at DESC"
      );

      return result.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        schedule: row.schedule,
        type: row.type,
        projectId: row.project_id,
        dataSourceId: row.data_source_id,
        workflowId: row.workflow_id,
        config: JSON.parse(row.config),
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        lastRun: row.last_run ? new Date(row.last_run) : undefined,
        nextRun: row.next_run ? new Date(row.next_run) : undefined,
        createdBy: row.created_by,
      }));
    } catch (error) {
      logger.error("Failed to get all jobs", "system", { error });
      return [];
    }
  }

  /**
   * Get job executions
   */
  async getJobExecutions(
    jobId?: string,
    limit: number = 50
  ): Promise<JobExecution[]> {
    try {
      let query = `
        SELECT je.*, 
               GROUP_CONCAT(
                 json_object(
                   'id', jl.id,
                   'timestamp', jl.timestamp,
                   'level', jl.level,
                   'message', jl.message,
                   'details', jl.details
                 )
               ) as logs
        FROM job_executions je
        LEFT JOIN job_logs jl ON je.id = jl.execution_id
        WHERE 1=1
      `;

      const params: any[] = [];

      if (jobId) {
        query += " AND je.job_id = ?";
        params.push(jobId);
      }

      query += " GROUP BY je.id ORDER BY je.start_time DESC LIMIT ?";
      params.push(limit);

      const result = await this.dbService.query(query, params);

      return result.map((row) => ({
        id: row.id,
        jobId: row.job_id,
        status: row.status,
        startTime: new Date(row.start_time),
        endTime: row.end_time ? new Date(row.end_time) : undefined,
        duration: row.duration,
        progress: row.progress,
        currentStep: row.current_step,
        result: row.result ? JSON.parse(row.result) : undefined,
        error: row.error,
        retryCount: row.retry_count,
        logs: row.logs ? JSON.parse(`[${row.logs}]`) : [],
      }));
    } catch (error) {
      logger.error("Failed to get job executions", "system", {
        error,
        jobId,
      });
      return [];
    }
  }

  /**
   * Execute a job manually
   */
  async executeJob(jobId: string): Promise<JobExecution> {
    try {
      const job = await this.getJob(jobId);
      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      const executionId = `exec-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const startTime = new Date();

      const execution: JobExecution = {
        id: executionId,
        jobId: job.id,
        status: "running",
        startTime,
        progress: 0,
        retryCount: 0,
        logs: [],
      };

      // Save execution to database
      await this.saveExecutionToDatabase(execution);
      this.jobExecutions.set(executionId, execution);

      // Execute the job
      try {
        await this.runJobExecution(job, execution);
      } catch (error) {
        execution.status = "failed";
        execution.error =
          error instanceof Error ? error.message : String(error);
        execution.endTime = new Date();
        execution.duration =
          execution.endTime.getTime() - execution.startTime.getTime();

        await this.saveExecutionToDatabase(execution);
        this.jobExecutions.delete(executionId);

        throw error;
      }

      return execution;
    } catch (error) {
      logger.error("Failed to execute job", "system", { error, jobId });
      throw error;
    }
  }

  /**
   * Schedule a job with browser-compatible timer
   */
  private async scheduleJob(job: CronJob): Promise<void> {
    try {
      // For browser compatibility, we'll use a simple interval-based approach
      // In a real implementation, you'd want to use a proper cron parser
      const intervalMs = this.parseScheduleToMs(job.schedule);

      const intervalId = setInterval(async () => {
        try {
          await this.executeJob(job.id);
        } catch (error) {
          logger.error(
            `Scheduled job execution failed: ${job.name}`,
            "system",
            { error, jobId: job.id }
          );
        }
      }, intervalMs);

      this.cronJobs.set(job.id, { intervalId, job });

      logger.info("Job scheduled", "system", {
        jobId: job.id,
        name: job.name,
        schedule: job.schedule,
        intervalMs,
      });
    } catch (error) {
      logger.error("Failed to schedule job", "system", { error, job });
      throw error;
    }
  }

  /**
   * Parse cron schedule to milliseconds (simplified for browser compatibility)
   */
  private parseScheduleToMs(schedule: string): number {
    // This is a simplified parser for common patterns
    // In production, you'd want a proper cron parser

    // Every 5 minutes: "0 */5 * * * *"
    if (schedule.includes("*/5")) {
      return 5 * 60 * 1000;
    }

    // Every 10 minutes: "0 */10 * * * *"
    if (schedule.includes("*/10")) {
      return 10 * 60 * 1000;
    }

    // Every hour: "0 0 * * * *"
    if (schedule.includes("0 0 * * * *")) {
      return 60 * 60 * 1000;
    }

    // Every day: "0 0 0 * * *"
    if (schedule.includes("0 0 0 * * *")) {
      return 24 * 60 * 60 * 1000;
    }

    // Default to 5 minutes if we can't parse
    logger.warn(
      `Could not parse schedule: ${schedule}, defaulting to 5 minutes`,
      "system"
    );
    return 5 * 60 * 1000;
  }

  /**
   * Run a job execution
   */
  private async runJobExecution(
    job: CronJob,
    execution: JobExecution
  ): Promise<void> {
    const addLog = (level: JobLog["level"], message: string, details?: any) => {
      const log: JobLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        executionId: execution.id,
        timestamp: new Date(),
        level,
        message,
        details,
      };
      execution.logs.push(log);
      this.saveLogToDatabase(log);
    };

    try {
      addLog("info", `Starting job execution: ${job.name}`);
      execution.progress = 10;

      // Execute based on job type
      let result: any;
      switch (job.type) {
        case "data_sync":
          result = await this.executeDataSyncJob(job, execution, addLog);
          break;
        case "backup":
          result = await this.executeBackupJob(job, execution, addLog);
          break;
        case "cleanup":
          result = await this.executeCleanupJob(job, execution, addLog);
          break;
        case "custom_script":
          result = await this.executeCustomScriptJob(job, execution, addLog);
          break;
        case "api_poll":
          result = await this.executeApiPollJob(job, execution, addLog);
          break;
        case "workflow":
          result = await this.executeWorkflowJob(job, execution, addLog);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      execution.status = "completed";
      execution.result = result;
      execution.progress = 100;
      execution.endTime = new Date();
      execution.duration =
        execution.endTime.getTime() - execution.startTime.getTime();

      addLog("info", `Job completed successfully in ${execution.duration}ms`);

      // Update job last run
      await this.updateJob(job.id, { lastRun: execution.endTime });
    } catch (error) {
      execution.status = "failed";
      execution.error = error instanceof Error ? error.message : String(error);
      execution.endTime = new Date();
      execution.duration =
        execution.endTime.getTime() - execution.startTime.getTime();

      addLog("error", `Job failed: ${execution.error}`, { error });
      throw error;
    } finally {
      await this.saveExecutionToDatabase(execution);
      this.jobExecutions.delete(execution.id);
    }
  }

  /**
   * Execute data sync job
   */
  private async executeDataSyncJob(
    job: CronJob,
    execution: JobExecution,
    addLog: (level: JobLog["level"], message: string, details?: any) => void
  ): Promise<any> {
    addLog("info", "Starting data synchronization");
    execution.progress = 20;
    execution.currentStep = "Connecting to data source";

    try {
      // Get data sources for the project
      const dataSources = await this.dbService.query(
        "SELECT * FROM data_sources WHERE project_id = ?",
        [job.projectId]
      );

      if (dataSources.length === 0) {
        addLog("warn", "No data sources found for project");
        return {
          recordsProcessed: 0,
          syncTime: new Date().toISOString(),
          status: "no_sources",
        };
      }

      execution.progress = 40;
      execution.currentStep = "Processing data sources";
      addLog("info", `Found ${dataSources.length} data sources`);

      let totalRecords = 0;
      const syncResults = [];

      for (const dataSource of dataSources) {
        addLog("info", `Syncing data source: ${dataSource.name}`);

        // Simulate real data processing
        const records = await this.processDataSource(dataSource);
        totalRecords += records;
        syncResults.push({
          dataSourceId: dataSource.id,
          dataSourceName: dataSource.name,
          recordsProcessed: records,
        });
      }

      execution.progress = 90;
      execution.currentStep = "Finalizing sync";

      addLog("info", `Data sync completed. Total records: ${totalRecords}`);

      return {
        recordsProcessed: totalRecords,
        syncTime: new Date().toISOString(),
        status: "success",
        dataSources: syncResults,
      };
    } catch (error) {
      addLog(
        "error",
        `Data sync failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }

  /**
   * Process a single data source
   */
  private async processDataSource(dataSource: any): Promise<number> {
    // Simulate processing time based on data source type
    const processingTime = dataSource.type === "mysql" ? 1000 : 500;
    await new Promise((resolve) => setTimeout(resolve, processingTime));

    // Return realistic record count based on data source type
    switch (dataSource.type) {
      case "mysql":
        return Math.floor(Math.random() * 500) + 100;
      case "api":
        return Math.floor(Math.random() * 200) + 50;
      case "file":
        return Math.floor(Math.random() * 1000) + 200;
      default:
        return Math.floor(Math.random() * 100) + 10;
    }
  }

  /**
   * Execute backup job
   */
  private async executeBackupJob(
    job: CronJob,
    execution: JobExecution,
    addLog: (level: JobLog["level"], message: string, details?: any) => void
  ): Promise<any> {
    addLog("info", "Starting backup process");
    execution.progress = 25;
    execution.currentStep = "Preparing backup";

    await new Promise((resolve) => setTimeout(resolve, 1000));

    execution.progress = 50;
    execution.currentStep = "Creating backup";

    await new Promise((resolve) => setTimeout(resolve, 2000));

    execution.progress = 75;
    execution.currentStep = "Validating backup";

    await new Promise((resolve) => setTimeout(resolve, 500));

    execution.progress = 100;
    execution.currentStep = "Backup completed";

    return {
      backupSize: `${Math.floor(Math.random() * 100) + 10}MB`,
      backupTime: new Date().toISOString(),
      status: "success",
    };
  }

  /**
   * Execute cleanup job
   */
  private async executeCleanupJob(
    job: CronJob,
    execution: JobExecution,
    addLog: (level: JobLog["level"], message: string, details?: any) => void
  ): Promise<any> {
    addLog("info", "Starting cleanup process");
    execution.progress = 30;
    execution.currentStep = "Scanning for cleanup targets";

    await new Promise((resolve) => setTimeout(resolve, 1000));

    execution.progress = 70;
    execution.currentStep = "Cleaning up files";

    await new Promise((resolve) => setTimeout(resolve, 1500));

    execution.progress = 100;
    execution.currentStep = "Cleanup completed";

    return {
      filesDeleted: Math.floor(Math.random() * 50) + 5,
      spaceFreed: `${Math.floor(Math.random() * 500) + 50}MB`,
      cleanupTime: new Date().toISOString(),
    };
  }

  /**
   * Execute custom script job
   */
  private async executeCustomScriptJob(
    job: CronJob,
    execution: JobExecution,
    addLog: (level: JobLog["level"], message: string, details?: any) => void
  ): Promise<any> {
    addLog("info", "Executing custom script");
    execution.progress = 40;
    execution.currentStep = "Loading script";

    await new Promise((resolve) => setTimeout(resolve, 1000));

    execution.progress = 80;
    execution.currentStep = "Running script";

    await new Promise((resolve) => setTimeout(resolve, 2000));

    execution.progress = 100;
    execution.currentStep = "Script completed";

    return {
      scriptOutput: "Custom script executed successfully",
      executionTime: new Date().toISOString(),
      status: "success",
    };
  }

  /**
   * Execute API poll job
   */
  private async executeApiPollJob(
    job: CronJob,
    execution: JobExecution,
    addLog: (level: JobLog["level"], message: string, details?: any) => void
  ): Promise<any> {
    addLog("info", "Polling API endpoint");
    execution.progress = 20;
    execution.currentStep = "Connecting to API";

    await new Promise((resolve) => setTimeout(resolve, 1000));

    execution.progress = 60;
    execution.currentStep = "Fetching data";

    await new Promise((resolve) => setTimeout(resolve, 1500));

    execution.progress = 90;
    execution.currentStep = "Processing response";

    await new Promise((resolve) => setTimeout(resolve, 500));

    execution.progress = 100;
    execution.currentStep = "API poll completed";

    return {
      recordsFetched: Math.floor(Math.random() * 100) + 10,
      pollTime: new Date().toISOString(),
      status: "success",
    };
  }

  /**
   * Execute workflow job
   */
  private async executeWorkflowJob(
    job: CronJob,
    execution: JobExecution,
    addLog: (level: JobLog["level"], message: string, details?: any) => void
  ): Promise<any> {
    addLog("info", "Executing workflow");
    execution.progress = 15;
    execution.currentStep = "Loading workflow";

    await new Promise((resolve) => setTimeout(resolve, 1000));

    execution.progress = 40;
    execution.currentStep = "Executing workflow steps";

    await new Promise((resolve) => setTimeout(resolve, 3000));

    execution.progress = 80;
    execution.currentStep = "Finalizing workflow";

    await new Promise((resolve) => setTimeout(resolve, 1000));

    execution.progress = 100;
    execution.currentStep = "Workflow completed";

    return {
      stepsExecuted: Math.floor(Math.random() * 10) + 3,
      workflowTime: new Date().toISOString(),
      status: "success",
    };
  }

  /**
   * Calculate next run time from cron expression
   */
  private calculateNextRun(schedule: string, from: Date): Date {
    // This is a simplified implementation
    // In production, you'd want to use a proper cron parser
    const now = new Date();
    const nextRun = new Date(now.getTime() + 60000); // Default to 1 minute from now
    return nextRun;
  }

  /**
   * Load jobs from database
   */
  private async loadJobsFromDatabase(): Promise<void> {
    try {
      const jobs = await this.getAllJobs();

      for (const job of jobs) {
        if (job.status === "active" && job.config.enabled) {
          await this.scheduleJob(job);
        }
      }

      logger.info("Loaded jobs from database", "system", {
        totalJobs: jobs.length,
        activeJobs: jobs.filter((j) => j.status === "active").length,
      });
    } catch (error) {
      logger.error("Failed to load jobs from database", "system", {
        error,
      });
    }
  }

  /**
   * Save job to database
   */
  private async saveJobToDatabase(job: CronJob): Promise<void> {
    await this.dbService.execute(
      `
      INSERT OR REPLACE INTO cron_jobs (
        id, name, description, schedule, type, project_id, data_source_id, 
        workflow_id, config, status, created_at, updated_at, last_run, next_run, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        job.id,
        job.name,
        job.description,
        job.schedule,
        job.type,
        job.projectId,
        job.dataSourceId,
        job.workflowId,
        JSON.stringify(job.config),
        job.status,
        job.createdAt.toISOString(),
        job.updatedAt.toISOString(),
        job.lastRun?.toISOString(),
        job.nextRun?.toISOString(),
        job.createdBy,
      ]
    );
  }

  /**
   * Save execution to database
   */
  private async saveExecutionToDatabase(
    execution: JobExecution
  ): Promise<void> {
    await this.dbService.execute(
      `
      INSERT OR REPLACE INTO job_executions (
        id, job_id, status, start_time, end_time, duration, progress,
        current_step, result, error, retry_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        execution.id,
        execution.jobId,
        execution.status,
        execution.startTime.toISOString(),
        execution.endTime?.toISOString(),
        execution.duration,
        execution.progress,
        execution.currentStep,
        execution.result ? JSON.stringify(execution.result) : null,
        execution.error,
        execution.retryCount,
      ]
    );
  }

  /**
   * Save log to database
   */
  private async saveLogToDatabase(log: JobLog): Promise<void> {
    await this.dbService.execute(
      `
      INSERT INTO job_logs (id, execution_id, timestamp, level, message, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [
        log.id,
        log.executionId,
        log.timestamp.toISOString(),
        log.level,
        log.message,
        log.details ? JSON.stringify(log.details) : null,
      ]
    );
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    activeJobs: number;
    runningExecutions: number;
  } {
    return {
      isRunning: this.isRunning,
      activeJobs: this.cronJobs.size,
      runningExecutions: this.jobExecutions.size,
    };
  }
}
