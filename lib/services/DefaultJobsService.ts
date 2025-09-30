import { SeparatedDatabaseManager } from "../server/database/SeparatedDatabaseManager";
import { DataSourceDatabase } from "../server/database/DataSourceDatabase";
import { CoreDatabase } from "../server/database/CoreDatabase";
import { logger } from "../utils/logger";
import fs from "fs";
import path from "path";
import { app } from "electron";

export interface JobResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

export class DefaultJobsService {
  private dbManager: SeparatedDatabaseManager;
  private coreDb: CoreDatabase;

  constructor() {
    this.dbManager = SeparatedDatabaseManager.getInstance();
    this.coreDb = CoreDatabase.getInstance();
  }

  async createDefaultJobs(): Promise<void> {
    try {
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
    const jobData = {
      name: "Core Config Backup",
      type: "backup",
      description: "Automatically backup the core configuration database",
      config: {
        backupType: "core_config",
        schedule: "0 2 * * *", // Daily at 2 AM
        retentionDays: 30,
        compression: true
      }
    };

    await this.coreDb.createJob(jobData);
    
    logger.info(
      "Core config backup job created",
      "jobs",
      { jobName: jobData.name },
      "DefaultJobsService"
    );
  }

  public async createIntegrityCheckJob(): Promise<void> {
    const jobData = {
      name: "Data Source Integrity Check",
      type: "integrity_check",
      description: "Verify metadata matches actual files on disk",
      config: {
        checkType: "metadata_integrity",
        schedule: "0 3 * * 0", // Weekly on Sunday at 3 AM
        checkAllProjects: true,
        autoRepair: false
      }
    };

    await this.coreDb.createJob(jobData);
    
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
      const coreDbPath = this.coreDb.getDbPath();
      const backupDir = path.join(app.getPath("userData"), "backups", "core");
      
      // Ensure backup directory exists
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Generate backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFileName = `core-config-backup-${timestamp}.db`;
      const backupPath = path.join(backupDir, backupFileName);

      // Copy core database file
      fs.copyFileSync(coreDbPath, backupPath);

      // Get file stats
      const stats = fs.statSync(backupPath);
      const originalStats = fs.statSync(coreDbPath);

      // Verify backup integrity
      const backupSize = stats.size;
      const originalSize = originalStats.size;
      
      if (backupSize !== originalSize) {
        throw new Error(`Backup size mismatch: original ${originalSize}, backup ${backupSize}`);
      }

      const duration = Date.now() - startTime;

      // Clean up old backups (keep last 30 days)
      await this.cleanupOldBackups(backupDir, 30);

      const result: JobResult = {
        success: true,
        message: `Core config backup completed successfully`,
        details: {
          backupPath,
          backupSize,
          duration,
          timestamp: new Date().toISOString()
        }
      };

      logger.success(
        "Core config backup completed",
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
        "Core config backup failed",
        "backup",
        { error: errorMessage, duration },
        "DefaultJobsService"
      );

      return {
        success: false,
        message: "Core config backup failed",
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
      // Get all projects
      const projects = await this.coreDb.getProjects();
      
      for (const project of projects) {
        // Get all data sources for this project
        const dataSources = await this.dbManager.getDataSources(project.id);
        
        for (const dataSource of dataSources) {
          const integrityResult = await this.checkDataSourceIntegrity(project.id, dataSource);
          
          if (integrityResult.issues.length > 0) {
            issues.push(...integrityResult.issues.map(issue => 
              `Project ${project.name} > ${dataSource.name}: ${issue}`
            ));
          }
          
          if (integrityResult.repairs.length > 0) {
            repairs.push(...integrityResult.repairs.map(repair => 
              `Project ${project.name} > ${dataSource.name}: ${repair}`
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
          totalDataSources: projects.reduce((sum, p) => sum + ((p as any).dataSources?.length || 0), 0),
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
      // Check if data source database file exists
      if (dataSource.dataPath) {
        if (!fs.existsSync(dataSource.dataPath)) {
          issues.push(`Data source database file missing: ${dataSource.dataPath}`);
          
          // Attempt to recreate if it's a JavaScript data source
          if (dataSource.type === 'javascript') {
            try {
              const dataSourceDb = await this.dbManager.getDataSourceDb(projectId, dataSource.id);
              if (!dataSourceDb) {
                // Recreate the database
                const newDataPath = this.dbManager['getDataSourceDbPath'](projectId, dataSource.id);
                const newDataSourceDb = DataSourceDatabase.getInstance(projectId, dataSource.id, newDataPath);
                await newDataSourceDb.initialize();
                
                repairs.push(`Recreated missing database file: ${newDataPath}`);
              }
            } catch (error) {
              issues.push(`Failed to recreate database: ${error}`);
            }
          }
        } else {
          // Check if database is accessible
          try {
            const dataSourceDb = await this.dbManager.getDataSourceDb(projectId, dataSource.id);
            if (dataSourceDb) {
              // Check if database has data
              const stats = await this.dbManager.getDataSourceStats(projectId, dataSource.id);
              if (stats && stats.totalVersions === 0 && dataSource.lastSyncAt) {
                issues.push(`Database exists but has no data versions despite last sync: ${dataSource.lastSyncAt}`);
              }
            }
          } catch (error) {
            issues.push(`Database file exists but is not accessible: ${error}`);
          }
        }
      } else {
        issues.push("Data source missing dataPath in configuration");
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
        if (file.startsWith('core-config-backup-') && file.endsWith('.db')) {
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
      const jobs = await this.coreDb.getJobs();
      
      const configBackupJob = jobs.find(job => job.type === "backup" && 
        job.config && JSON.parse(job.config).backupType === "core_config");
      
      const integrityCheckJob = jobs.find(job => job.type === "integrity_check");

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
    switch (jobType) {
      case "backup":
        return await this.executeConfigBackup();
      case "integrity_check":
        return await this.executeIntegrityCheck();
      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }
  }
}
