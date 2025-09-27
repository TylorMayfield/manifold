import { DatabaseManager } from "../database/DatabaseManager";
import { LogEntry, LogLevel, LogCategory } from "../../../types/logs";
import { logger } from "../utils/logger";

export interface DatabaseLogEntry {
  id: string;
  level: string;
  category: string;
  message: string;
  details?: string;
  source?: string;
  projectId?: string;
  dataSourceId?: string;
  createdAt: Date;
}

export interface JobExecutionLog {
  id: string;
  executionId: string;
  level: string;
  message: string;
  details?: string;
  source?: string;
  createdAt: Date;
}

export class DatabaseLogger {
  private static instance: DatabaseLogger;
  private dbManager: DatabaseManager;
  private isInitialized: boolean = false;

  private constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  static getInstance(): DatabaseLogger {
    if (!DatabaseLogger.instance) {
      DatabaseLogger.instance = new DatabaseLogger();
    }
    return DatabaseLogger.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.dbManager.initialize();
      this.isInitialized = true;
      console.log("Database logger initialized");
    } catch (error) {
      console.error("Failed to initialize database logger:", error);
      throw error;
    }
  }

  // Log application-wide events
  async logAppEvent(
    level: LogLevel,
    category: LogCategory,
    message: string,
    details?: any,
    source?: string,
    projectId?: string,
    dataSourceId?: string
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const coreDb = this.dbManager.getCoreDatabase();
      await coreDb.client.appLog.create({
        data: {
          level,
          category,
          message,
          details: details ? JSON.stringify(details) : null,
          source,
          projectId,
          dataSourceId,
        },
      });
    } catch (error) {
      // Fallback to console logging if database logging fails
      console.error("Failed to log to database:", error);
      console.log(`[${level.toUpperCase()}] [${category}] ${message}`, details);
    }
  }

  // Log job execution events
  async logJobExecution(
    executionId: string,
    level: LogLevel,
    message: string,
    details?: any,
    source?: string
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const coreDb = this.dbManager.getCoreDatabase();
      await coreDb.client.jobLog.create({
        data: {
          executionId,
          level,
          message,
          details: details ? JSON.stringify(details) : null,
          source,
        },
      });
    } catch (error) {
      // Fallback to console logging if database logging fails
      console.error("Failed to log job execution to database:", error);
      console.log(
        `[JOB-${executionId}] [${level.toUpperCase()}] ${message}`,
        details
      );
    }
  }

  // Get application logs with filtering
  async getAppLogs(
    options: {
      level?: LogLevel;
      category?: LogCategory;
      projectId?: string;
      dataSourceId?: string;
      source?: string;
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<DatabaseLogEntry[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const coreDb = this.dbManager.getCoreDatabase();
      const logs = await coreDb.client.appLog.findMany({
        where: {
          ...(options.level && { level: options.level }),
          ...(options.category && { category: options.category }),
          ...(options.projectId && { projectId: options.projectId }),
          ...(options.dataSourceId && { dataSourceId: options.dataSourceId }),
          ...(options.source && { source: options.source }),
          ...(options.startDate && { createdAt: { gte: options.startDate } }),
          ...(options.endDate && { createdAt: { lte: options.endDate } }),
        },
        orderBy: { createdAt: "desc" },
        take: options.limit || 100,
        skip: options.offset || 0,
      });

      return logs.map((log) => ({
        id: log.id,
        level: log.level,
        category: log.category,
        message: log.message,
        details: log.details || undefined,
        source: log.source || undefined,
        projectId: log.projectId || undefined,
        dataSourceId: log.dataSourceId || undefined,
        createdAt: log.createdAt,
      }));
    } catch (error) {
      console.error("Failed to get app logs:", error);
      return [];
    }
  }

  // Get job execution logs
  async getJobExecutionLogs(
    executionId: string,
    options: {
      level?: LogLevel;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<JobExecutionLog[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const coreDb = this.dbManager.getCoreDatabase();
      const logs = await coreDb.client.jobLog.findMany({
        where: {
          executionId,
          ...(options.level && { level: options.level }),
        },
        orderBy: { createdAt: "asc" },
        take: options.limit || 1000,
        skip: options.offset || 0,
      });

      return logs.map((log) => ({
        id: log.id,
        executionId: log.executionId,
        level: log.level,
        message: log.message,
        details: log.details || undefined,
        source: log.source || undefined,
        createdAt: log.createdAt,
      }));
    } catch (error) {
      console.error("Failed to get job execution logs:", error);
      return [];
    }
  }

  // Get job execution history
  async getJobExecutions(
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

      const coreDb = this.dbManager.getCoreDatabase();
      const executions = await coreDb.client.jobExecution.findMany({
        where: { jobId },
        orderBy: { createdAt: "desc" },
        take: options.limit || 50,
        skip: options.offset || 0,
        include: {
          logs: {
            orderBy: { createdAt: "asc" },
            take: 100, // Limit logs per execution
          },
        },
      });

      return executions;
    } catch (error) {
      console.error("Failed to get job executions:", error);
      return [];
    }
  }

  // Get all jobs with their execution history
  async getJobsWithHistory(
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

      const coreDb = this.dbManager.getCoreDatabase();
      const jobs = await coreDb.client.job.findMany({
        where: {
          ...(projectId && { projectId }),
          ...(options.type && { type: options.type }),
          ...(options.status && { status: options.status }),
        },
        orderBy: { createdAt: "desc" },
        take: options.limit || 50,
        skip: options.offset || 0,
        include: {
          executions: {
            orderBy: { createdAt: "desc" },
            take: 10, // Limit executions per job
            include: {
              logs: {
                orderBy: { createdAt: "asc" },
                take: 50, // Limit logs per execution
              },
            },
          },
        },
      });

      return jobs;
    } catch (error) {
      console.error("Failed to get jobs with history:", error);
      return [];
    }
  }

  // Clean up old logs (retention policy)
  async cleanupOldLogs(retentionDays: number = 30): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const coreDb = this.dbManager.getCoreDatabase();

      // Delete old app logs
      await coreDb.client.appLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      // Delete old job logs (keep job executions for longer)
      await coreDb.client.jobLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      console.log(`Cleaned up logs older than ${retentionDays} days`);
    } catch (error) {
      console.error("Failed to cleanup old logs:", error);
    }
  }

  // Get log statistics
  async getLogStats(projectId?: string): Promise<{
    totalLogs: number;
    logsByLevel: Record<string, number>;
    logsByCategory: Record<string, number>;
    recentErrors: number;
  }> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const coreDb = this.dbManager.getCoreDatabase();

      const whereClause = projectId ? { projectId } : {};

      const [totalLogs, logsByLevel, logsByCategory, recentErrors] =
        await Promise.all([
          coreDb.client.appLog.count({ where: whereClause }),
          coreDb.client.appLog.groupBy({
            by: ["level"],
            where: whereClause,
            _count: { level: true },
          }),
          coreDb.client.appLog.groupBy({
            by: ["category"],
            where: whereClause,
            _count: { category: true },
          }),
          coreDb.client.appLog.count({
            where: {
              ...whereClause,
              level: "error",
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              },
            },
          }),
        ]);

      return {
        totalLogs,
        logsByLevel: logsByLevel.reduce((acc, item) => {
          acc[item.level] = item._count.level;
          return acc;
        }, {} as Record<string, number>),
        logsByCategory: logsByCategory.reduce((acc, item) => {
          acc[item.category] = item._count.category;
          return acc;
        }, {} as Record<string, number>),
        recentErrors,
      };
    } catch (error) {
      console.error("Failed to get log stats:", error);
      return {
        totalLogs: 0,
        logsByLevel: {},
        logsByCategory: {},
        recentErrors: 0,
      };
    }
  }
}
