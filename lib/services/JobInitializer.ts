import { DefaultJobsService } from "./DefaultJobsService";
import { logger } from "../utils/logger";

export class JobInitializer {
  private static instance: JobInitializer;
  private defaultJobsService: DefaultJobsService;
  private initialized = false;

  private constructor() {
    this.defaultJobsService = new DefaultJobsService();
  }

  static getInstance(): JobInitializer {
    if (!JobInitializer.instance) {
      JobInitializer.instance = new JobInitializer();
    }
    return JobInitializer.instance;
  }

  async initializeDefaultJobs(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Check if default jobs already exist
      const jobStatus = await this.defaultJobsService.getJobStatus();
      
      const needsBackupJob = !jobStatus.configBackupJob;
      const needsIntegrityJob = !jobStatus.integrityCheckJob;

      if (needsBackupJob || needsIntegrityJob) {
        logger.info(
          "Creating missing default jobs",
          "initialization",
          { needsBackupJob, needsIntegrityJob },
          "JobInitializer"
        );

        // Create only the missing jobs
        if (needsBackupJob) {
          await this.defaultJobsService.createConfigBackupJob();
          logger.success("Default backup job created", "initialization", {}, "JobInitializer");
        }

        if (needsIntegrityJob) {
          await this.defaultJobsService.createIntegrityCheckJob();
          logger.success("Default integrity check job created", "initialization", {}, "JobInitializer");
        }
      } else {
        logger.info("Default jobs already exist, skipping creation", "initialization", {}, "JobInitializer");
      }

      this.initialized = true;
    } catch (error) {
      logger.error(
        "Failed to initialize default jobs",
        "initialization",
        { error },
        "JobInitializer"
      );
      throw error;
    }
  }

  async runInitialIntegrityCheck(): Promise<void> {
    try {
      logger.info("Running initial integrity check", "initialization", {}, "JobInitializer");
      
      const result = await this.defaultJobsService.executeIntegrityCheck();
      
      if (!result.success) {
        logger.warn(
          "Initial integrity check found issues",
          "initialization",
          { issues: result.details?.issues },
          "JobInitializer"
        );
      } else {
        logger.success("Initial integrity check passed", "initialization", {}, "JobInitializer");
      }
    } catch (error) {
      logger.error(
        "Failed to run initial integrity check",
        "initialization",
        { error },
        "JobInitializer"
      );
      // Don't throw - this is not critical for app startup
    }
  }

  async runInitialBackup(): Promise<void> {
    try {
      logger.info("Running initial config backup", "initialization", {}, "JobInitializer");
      
      const result = await this.defaultJobsService.executeConfigBackup();
      
      if (result.success) {
        logger.success("Initial config backup completed", "initialization", {}, "JobInitializer");
      } else {
        logger.error(
          "Initial config backup failed",
          "initialization",
          { error: result.error },
          "JobInitializer"
        );
      }
    } catch (error) {
      logger.error(
        "Failed to run initial config backup",
        "initialization",
        { error },
        "JobInitializer"
      );
      // Don't throw - this is not critical for app startup
    }
  }

  async initialize(): Promise<void> {
    try {
      await this.initializeDefaultJobs();
      
      // Run initial checks in the background (don't wait for them)
      setTimeout(() => {
        this.runInitialIntegrityCheck();
        this.runInitialBackup();
      }, 5000); // Wait 5 seconds after startup
      
    } catch (error) {
      logger.error(
        "Failed to initialize job system",
        "initialization",
        { error },
        "JobInitializer"
      );
      throw error;
    }
  }
}
