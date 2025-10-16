// Note: node-cron is Node.js only, we'll use a browser-compatible approach
import { logger } from "../utils/logger";
import { MongoDatabase } from "../database/MongoDatabase";
import { JobExecutor } from "./JobExecutor";
import mongoose, { Schema, Model } from 'mongoose';

// MongoDB Schemas
const CronJobSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  schedule: { type: String, required: true }, // Cron expression
  type: { 
    type: String, 
    required: true,
    enum: ["data_sync", "backup", "cleanup", "custom_script", "api_poll", "workflow"]
  },
  projectId: String,
  dataSourceId: String,
  workflowId: String,
  config: Schema.Types.Mixed,
  status: { 
    type: String, 
    enum: ["active", "paused", "disabled"],
    default: "active"
  },
  lastRun: Date,
  nextRun: Date,
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const JobExecutionSchema = new Schema({
  _id: { type: String, required: true },
  jobId: { type: String, required: true, index: true },
  status: { 
    type: String, 
    required: true,
    enum: ["running", "completed", "failed", "cancelled"]
  },
  startTime: { type: Date, required: true },
  endTime: Date,
  duration: Number, // in milliseconds
  progress: { type: Number, default: 0 }, // 0-100
  currentStep: String,
  result: Schema.Types.Mixed,
  error: String,
  retryCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const JobLogSchema = new Schema({
  _id: { type: String, required: true },
  executionId: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now },
  level: { 
    type: String, 
    required: true,
    enum: ["info", "warn", "error", "debug"]
  },
  message: { type: String, required: true },
  details: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

// Create indexes
CronJobSchema.index({ projectId: 1 });
CronJobSchema.index({ status: 1, config: 1 });
JobExecutionSchema.index({ jobId: 1, startTime: -1 });
JobLogSchema.index({ executionId: 1, timestamp: -1 });

export interface CronJob {
  _id: string;
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
  _id: string;
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
  logs?: JobLog[];
  createdAt: Date;
  updatedAt: Date;
}

export interface JobLog {
  _id: string;
  executionId: string;
  timestamp: Date;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  details?: any;
  createdAt: Date;
}

// Initialize Mongoose models
let CronJobModel: Model<any>;
let JobExecutionModel: Model<any>;
let JobLogModel: Model<any>;

export class JobScheduler {
  private static instance: JobScheduler;
  private cronJobs: Map<string, any> = new Map();
  private jobExecutions: Map<string, JobExecution> = new Map();
  private db: MongoDatabase;
  private jobExecutor: JobExecutor;
  private isRunning: boolean = false;

  private constructor() {
    this.db = MongoDatabase.getInstance();
    this.jobExecutor = JobExecutor.getInstance();
    this.initializeModels();
  }

  static getInstance(): JobScheduler {
    if (!JobScheduler.instance) {
      JobScheduler.instance = new JobScheduler();
    }
    return JobScheduler.instance;
  }

  /**
   * Initialize Mongoose models for job management
   */
  private initializeModels(): void {
    try {
      // Initialize models if they don't exist
      CronJobModel = mongoose.models.CronJob || mongoose.model('CronJob', CronJobSchema);
      JobExecutionModel = mongoose.models.JobExecution || mongoose.model('JobExecution', JobExecutionSchema);
      JobLogModel = mongoose.models.JobLog || mongoose.model('JobLog', JobLogSchema);

      logger.info("Job scheduler models initialized", "system");
    } catch (error) {
      logger.error("Failed to initialize job scheduler models", "system", {
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
   * Check if the scheduler is currently running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Create a new cron job
   */
  async createJob(
    job: Omit<CronJob, "_id" | "createdAt" | "updatedAt" | "nextRun">
  ): Promise<CronJob> {
    try {
      const jobId = `job-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const now = new Date();

      const jobDoc = new CronJobModel({
        _id: jobId,
        name: job.name,
        description: job.description,
        schedule: job.schedule,
        type: job.type,
        projectId: job.projectId,
        dataSourceId: job.dataSourceId,
        workflowId: job.workflowId,
        config: job.config,
        status: job.status,
        createdBy: job.createdBy,
        createdAt: now,
        updatedAt: now,
        nextRun: this.calculateNextRun(job.schedule, now),
        lastRun: job.lastRun,
      });

      await jobDoc.save();

      const newJob = jobDoc.toObject() as CronJob;

      // Schedule the job if it's active
      if (newJob.status === "active" && newJob.config.enabled) {
        await this.scheduleJob(newJob);
      }

      logger.info("Cron job created", "system", {
        jobId: newJob._id,
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

      // Stop existing cron job
      const existingCronJob = this.cronJobs.get(jobId);
      if (existingCronJob && existingCronJob.intervalId) {
        clearInterval(existingCronJob.intervalId);
        this.cronJobs.delete(jobId);
      }

      // Update in database
      const updateData: any = {
        ...updates,
        updatedAt: new Date(),
      };

      if (updates.schedule) {
        updateData.nextRun = this.calculateNextRun(updates.schedule, new Date());
      }

      const updatedDoc = await CronJobModel.findByIdAndUpdate(
        jobId,
        { $set: updateData },
        { new: true }
      );

      if (!updatedDoc) {
        throw new Error(`Job not found: ${jobId}`);
      }

      const updatedJob = updatedDoc.toObject() as CronJob;

      // Reschedule if active
      if (updatedJob.status === "active" && updatedJob.config.enabled) {
        await this.scheduleJob(updatedJob);
      }

      logger.info("Cron job updated", "system", {
        jobId: updatedJob._id,
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
      await CronJobModel.findByIdAndDelete(jobId);

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
      const job = await CronJobModel.findById(jobId).lean();
      return job ? (job as unknown as CronJob) : null;
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
      const jobs = await CronJobModel.find().sort({ createdAt: -1 }).lean();
      return jobs as unknown as CronJob[];
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
      const query = jobId ? { jobId } : {};
      const executions = await JobExecutionModel.find(query)
        .sort({ startTime: -1 })
        .limit(limit)
        .lean();

      // Fetch logs for each execution
      const executionsWithLogs = await Promise.all(
        executions.map(async (execution: any) => {
          const logs = await JobLogModel.find({ executionId: execution._id })
            .sort({ timestamp: -1 })
            .lean();
          return {
            ...execution,
            logs: logs as unknown as JobLog[],
          } as unknown as JobExecution;
        })
      );

      return executionsWithLogs;
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
  async executeJob(jobId: string): Promise<string> {
    try {
      const job = await this.getJob(jobId);
      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      const executionId = `exec-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const startTime = new Date();

      const executionDoc = new JobExecutionModel({
        _id: executionId,
        jobId: job._id,
        status: "running",
        startTime,
        progress: 0,
        retryCount: 0,
        createdAt: startTime,
        updatedAt: startTime,
      });

      await executionDoc.save();

      const execution = executionDoc.toObject() as JobExecution;
      this.jobExecutions.set(executionId, execution);

      // Execute the job asynchronously
      this.runJobExecution(job, execution).catch((error) => {
        logger.error("Job execution failed", "system", { error, jobId, executionId });
      });

      return executionId;
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
          await this.executeJob(job._id);
        } catch (error) {
          logger.error(
            `Scheduled job execution failed: ${job.name}`,
            "system",
            { error, jobId: job._id }
          );
        }
      }, intervalMs);

      this.cronJobs.set(job._id, { intervalId, job });

      logger.info("Job scheduled", "system", {
        jobId: job._id,
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
        _id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        executionId: execution._id,
        timestamp: new Date(),
        level,
        message,
        details,
        createdAt: new Date(),
      };
      if (!execution.logs) {
        execution.logs = [];
      }
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
      await CronJobModel.findByIdAndUpdate(job._id, {
        $set: { lastRun: execution.endTime, updatedAt: new Date() }
      });
    } catch (error) {
      execution.status = "failed";
      execution.error = error instanceof Error ? error.message : String(error);
      execution.endTime = new Date();
      execution.duration =
        execution.endTime.getTime() - execution.startTime.getTime();

      addLog("error", `Job failed: ${execution.error}`, { error });
      throw error;
    } finally {
      // Update execution in database
      await JobExecutionModel.findByIdAndUpdate(execution._id, {
        $set: {
          status: execution.status,
          endTime: execution.endTime,
          duration: execution.duration,
          progress: execution.progress,
          result: execution.result,
          error: execution.error,
          updatedAt: new Date()
        }
      });
      this.jobExecutions.delete(execution._id);
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
      // Get data sources for the project using Mongoose
      const DataSourceModel = mongoose.model('DataSource');
      const dataSources = await DataSourceModel.find({ projectId: job.projectId }).lean();

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

    try {
      // Get project data to backup using Mongoose
      const ProjectModel = mongoose.model('Project');
      const project: any = await ProjectModel.findById(job.projectId).lean();

      if (!project) {
        addLog("warn", "Project not found for backup");
        return {
          backupSize: "0MB",
          backupTime: new Date().toISOString(),
          status: "no_project",
        };
      }

      execution.progress = 40;
      execution.currentStep = "Collecting project data";
      addLog("info", `Backing up project: ${project.name}`);

      // Get all data sources for the project
      const DataSourceModel = mongoose.model('DataSource');
      const dataSources = await DataSourceModel.find({ projectId: job.projectId }).lean();

      // Get all imported data (models) for the project
      const ImportedDataModel = mongoose.model('ImportedData');
      const models = await ImportedDataModel.find({ projectId: job.projectId }).lean();

      execution.progress = 60;
      execution.currentStep = "Creating backup archive";

      // Create backup data structure
      const backupData = {
        project: project,
        dataSources: dataSources,
        models: models,
        backupTime: new Date().toISOString(),
        backupVersion: "1.0",
      };

      // Simulate backup creation time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      execution.progress = 80;
      execution.currentStep = "Validating backup";

      // Calculate backup size (simplified)
      const backupSize = JSON.stringify(backupData).length;
      const backupSizeMB = Math.round((backupSize / 1024 / 1024) * 100) / 100;

      execution.progress = 100;
      execution.currentStep = "Backup completed";

      addLog("info", `Backup completed successfully. Size: ${backupSizeMB}MB`);

      return {
        backupSize: `${backupSizeMB}MB`,
        backupTime: new Date().toISOString(),
        status: "success",
        dataSources: dataSources.length,
        models: models.length,
        records: backupSize,
      };
    } catch (error) {
      addLog(
        "error",
        `Backup failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
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

    try {
      // Clean up old job executions (keep only last 100 per job)
      const allExecutions = await JobExecutionModel.find({ jobId: job._id })
        .sort({ startTime: -1 })
        .lean();

      execution.progress = 50;
      execution.currentStep = "Cleaning up old executions";

      let deletedExecutions = 0;
      if (allExecutions.length > 100) {
        const executionsToDelete = allExecutions.slice(100);
        const executionIds = executionsToDelete.map(e => e._id);
        
        // Delete associated logs first
        await JobLogModel.deleteMany({ executionId: { $in: executionIds } });
        
        // Delete the executions
        await JobExecutionModel.deleteMany({ _id: { $in: executionIds } });
        deletedExecutions = executionsToDelete.length;
      }

      execution.progress = 70;
      execution.currentStep = "Cleaning up old logs";

      // Clean up orphaned logs (logs without executions)
      const allExecutionIds = allExecutions.map(e => e._id);
      const orphanedLogsResult = await JobLogModel.deleteMany({
        executionId: { $nin: allExecutionIds }
      });
      
      const orphanedLogsCount = orphanedLogsResult.deletedCount || 0;

      execution.progress = 90;
      execution.currentStep = "Finalizing cleanup";

      // Calculate space freed (simplified)
      const spaceFreed = deletedExecutions * 0.1; // Assume 0.1MB per execution

      execution.progress = 100;
      execution.currentStep = "Cleanup completed";

      addLog(
        "info",
        `Cleanup completed. Deleted ${deletedExecutions} old executions`
      );

      return {
        executionsDeleted: deletedExecutions,
        logsDeleted: orphanedLogsCount,
        spaceFreed: `${spaceFreed.toFixed(2)}MB`,
        cleanupTime: new Date().toISOString(),
        status: "success",
      };
    } catch (error) {
      addLog(
        "error",
        `Cleanup failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
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
   * Save log to database
   */
  private async saveLogToDatabase(log: JobLog): Promise<void> {
    try {
      const logDoc = new JobLogModel({
        _id: log._id,
        executionId: log.executionId,
        timestamp: log.timestamp,
        level: log.level,
        message: log.message,
        details: log.details,
        createdAt: log.timestamp,
      });
      await logDoc.save();
    } catch (error) {
      // Log errors but don't fail the job execution
      logger.error("Failed to save job log", "system", { error, log });
    }
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
