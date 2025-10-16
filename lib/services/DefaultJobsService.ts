import { MongoDatabase } from "../server/database/MongoDatabase";
import { logger } from "../utils/logger";
import fs from "fs";
import path from "path";

export interface JobResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

export class DefaultJobsService {
  private db: MongoDatabase;

  constructor() {
    this.db = MongoDatabase.getInstance();
  }

  async ensureInitialized(): Promise<void> {
    if (!this.db.isHealthy()) {
      await this.db.initialize();
    }
  }

  async createDefaultJobs(): Promise<void> {
    try {
      await this.ensureInitialized();
      
      // Create backup job
      await this.createConfigBackupJob();
      
      // Create integrity check job
      await this.createIntegrityCheckJob();
      
      logger.success(
        "Default jobs created successfully",
        "jobs",
        {},
        "DefaultJobsService"
      );
    } catch (error) {
      logger.error(
        "Failed to create default jobs",
        "jobs",
        { error },
        "DefaultJobsService"
      );
      throw error;
    }
  }

  public async createConfigBackupJob(): Promise<void> {
    await this.ensureInitialized();
    
    const jobData = {
      projectId: "default",
      name: "Core Config Backup",
      type: "backup",
      schedule: "0 2 * * *", // Daily at 2 AM
      config: {
        backupType: "core_config",
        retentionDays: 30,
        compression: true
      }
    };

    await this.db.createJob(jobData);
    
    logger.info(
      "Core config backup job created",
      "jobs",
      { jobName: jobData.name },
      "DefaultJobsService"
    );
  }

  public async createIntegrityCheckJob(): Promise<void> {
    await this.ensureInitialized();
    
    const jobData = {
      projectId: "default",
      name: "Data Source Integrity Check",
      type: "integrity_check",
      schedule: "0 3 * * 0", // Weekly on Sunday at 3 AM
      config: {
        checkType: "metadata_integrity",
        checkAllProjects: true,
        autoRepair: false
      }
    };

    await this.db.createJob(jobData);
    
    logger.info(
      "Integrity check job created",
      "jobs",
      { jobName: jobData.name },
      "DefaultJobsService"
    );
  }

  async executeConfigBackup(): Promise<JobResult> {
    const startTime = Date.now();
    
    try {
      await this.ensureInitialized();
      
      // Get backup directory path - use process.cwd() data folder for web context
      const backupDir = path.join(process.cwd(), "data", "backups", "core");
      
      // Ensure backup directory exists
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Generate backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFileName = `mongodb-backup-${timestamp}.json`;
      const backupPath = path.join(backupDir, backupFileName);

      // Export MongoDB data to JSON
      const projects = await this.db.getProjects();
      const dataSources = await this.db.getDataSources();
      const jobs = await this.db.getJobs();
      const pipelines = await this.db.getPipelines();
      
      const backupData = {
        timestamp: new Date().toISOString(),
        projects,
        dataSources,
        jobs,
        pipelines,
      };

      // Write backup to file
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

      // Get file stats
      const stats = fs.statSync(backupPath);
      const backupSize = stats.size;

      const duration = Date.now() - startTime;

      // Clean up old backups (keep last 30 days)
      await this.cleanupOldBackups(backupDir, 30);

      const result: JobResult = {
        success: true,
        message: `MongoDB backup completed successfully`,
        details: {
          backupPath,
          backupSize,
          duration,
          timestamp: new Date().toISOString(),
          projectsCount: projects.length,
          dataSourcesCount: dataSources.length,
        }
      };

      logger.success(
        "MongoDB backup completed",
        "backup",
        {
          backupPath,
          size: backupSize,
          duration
        },
        "DefaultJobsService"
      );

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error(
        "MongoDB backup failed",
        "backup",
        { error: errorMessage, duration },
        "DefaultJobsService"
      );

      return {
        success: false,
        message: "MongoDB backup failed",
        error: errorMessage,
        details: { duration }
      };
    }
  }

  async executeIntegrityCheck(): Promise<JobResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const repairs: string[] = [];

    try {
      await this.ensureInitialized();
      
      // Get all projects
      const projects = await this.db.getProjects();
      
      let totalDataSources = 0;
      
      for (const project of projects) {
        // Get all data sources for this project
        const projectId = (project as any)._id || (project as any).id;
        const dataSources = await this.db.getDataSources(projectId);
        totalDataSources += dataSources.length;
        
        for (const dataSource of dataSources) {
          const integrityResult = await this.checkDataSourceIntegrity(projectId, dataSource);
          
          if (integrityResult.issues.length > 0) {
            issues.push(...integrityResult.issues.map(issue => 
              `Project ${(project as any).name} > ${(dataSource as any).name}: ${issue}`
            ));
          }
          
          if (integrityResult.repairs.length > 0) {
            repairs.push(...integrityResult.repairs.map(repair => 
              `Project ${(project as any).name} > ${(dataSource as any).name}: ${repair}`
            ));
          }
        }
      }

      const duration = Date.now() - startTime;
      const hasIssues = issues.length > 0;

      const result: JobResult = {
        success: !hasIssues,
        message: hasIssues 
          ? `Integrity check completed with ${issues.length} issues found`
          : "Integrity check completed successfully - no issues found",
        details: {
          projectsChecked: projects.length,
          totalDataSources,
          issuesFound: issues.length,
          repairsMade: repairs.length,
          duration,
          timestamp: new Date().toISOString(),
          issues: hasIssues ? issues : undefined,
          repairs: repairs.length > 0 ? repairs : undefined
        }
      };

      if (hasIssues) {
        logger.warn(
          "Integrity check found issues",
          "integrity",
          {
            issuesCount: issues.length,
            repairsCount: repairs.length,
            duration
          },
          "DefaultJobsService"
        );
      } else {
        logger.success(
          "Integrity check completed successfully",
          "integrity",
          {
            projectsChecked: projects.length,
            duration
          },
          "DefaultJobsService"
        );
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error(
        "Integrity check failed",
        "integrity",
        { error: errorMessage, duration },
        "DefaultJobsService"
      );

      return {
        success: false,
        message: "Integrity check failed",
        error: errorMessage,
        details: { duration }
      };
    }
  }

  private async checkDataSourceIntegrity(projectId: string, dataSource: any): Promise<{
    issues: string[];
    repairs: string[];
  }> {
    const issues: string[] = [];
    const repairs: string[] = [];

    try {
      // Check if data source has snapshots
      try {
        const snapshots = await this.db.getSnapshots(dataSource.id || dataSource._id);
        if (snapshots.length === 0 && dataSource.lastSyncAt) {
          issues.push(`Data source has no snapshots despite last sync: ${dataSource.lastSyncAt}`);
        }
      } catch (error) {
        issues.push(`Failed to get snapshots: ${error}`);
      }

      // Check if lastSyncAt is reasonable (not too old for active data sources)
      if (dataSource.lastSyncAt) {
        const lastSync = new Date(dataSource.lastSyncAt);
        const now = new Date();
        const daysSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceSync > 7 && dataSource.enabled) {
          issues.push(`Data source hasn't been synced for ${Math.round(daysSinceSync)} days`);
        }
      }

    } catch (error) {
      issues.push(`Error checking data source integrity: ${error}`);
    }

    return { issues, repairs };
  }

  private async cleanupOldBackups(backupDir: string, retentionDays: number): Promise<void> {
    try {
      const files = fs.readdirSync(backupDir);
      const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
      
      let deletedCount = 0;
      
      for (const file of files) {
        if (file.startsWith('mongodb-backup-') && file.endsWith('.json')) {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime.getTime() < cutoffTime) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
      }
      
      if (deletedCount > 0) {
        logger.info(
          `Cleaned up ${deletedCount} old backup files`,
          "backup",
          { backupDir, retentionDays },
          "DefaultJobsService"
        );
      }
    } catch (error) {
      logger.error(
        "Failed to cleanup old backups",
        "backup",
        { backupDir, error },
        "DefaultJobsService"
      );
    }
  }

  async getJobStatus(): Promise<{
    configBackupJob: any;
    integrityCheckJob: any;
  }> {
    try {
      await this.ensureInitialized();
      
      const jobs = await this.db.getJobs();
      
      const configBackupJob = jobs.find((job: any) => job.type === "backup");
      const integrityCheckJob = jobs.find((job: any) => job.type === "integrity_check");

      return {
        configBackupJob: configBackupJob || null,
        integrityCheckJob: integrityCheckJob || null
      };
    } catch (error) {
      logger.error(
        "Failed to get job status",
        "jobs",
        { error },
        "DefaultJobsService"
      );
      return {
        configBackupJob: null,
        integrityCheckJob: null
      };
    }
  }

  async runJobManually(jobType: "backup" | "integrity_check"): Promise<JobResult> {
    await this.ensureInitialized();
    
    try {
      // Find the job in the database
      const jobs = await this.db.getJobs();
      const job = jobs.find((j: any) => j.type === jobType);
      
      if (!job) {
        logger.warn(
          `Job of type ${jobType} not found, creating it first`,
          "jobs",
          {},
          "DefaultJobsService"
        );
        
        // Create the job if it doesn't exist
        if (jobType === "backup") {
          await this.createConfigBackupJob();
        } else {
          await this.createIntegrityCheckJob();
        }
        
        // Fetch the newly created job
        const updatedJobs = await this.db.getJobs();
        const newJob = updatedJobs.find((j: any) => j.type === jobType);
        
        if (!newJob) {
          throw new Error(`Failed to create job of type ${jobType}`);
        }
      }
      
      // Get the job again to ensure we have the latest version
      const allJobs = await this.db.getJobs();
      const targetJob = allJobs.find((j: any) => j.type === jobType);
      
      if (targetJob) {
        // Update job status to running
        const jobId = (targetJob as any)._id || (targetJob as any).id;
        await this.db.updateJob(jobId, {
          status: 'running',
          lastRun: new Date()
        });
      }
      
      // Execute the job
      let result: JobResult;
      switch (jobType) {
        case "backup":
          result = await this.executeConfigBackup();
          break;
        case "integrity_check":
          result = await this.executeIntegrityCheck();
          break;
        default:
          throw new Error(`Unknown job type: ${jobType}`);
      }
      
      // Update job with result
      if (targetJob) {
        const jobId = (targetJob as any)._id || (targetJob as any).id;
        await this.db.updateJob(jobId, {
          status: result.success ? 'completed' : 'failed',
          lastRun: new Date()
        });
      }
      
      return result;
    } catch (error) {
      logger.error(
        `Failed to run ${jobType} job`,
        "jobs",
        { error },
        "DefaultJobsService"
      );
      throw error;
    }
  }
}
