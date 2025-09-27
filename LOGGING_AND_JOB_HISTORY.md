# Logging and Job History Implementation

## Overview

We've implemented a comprehensive logging and job history system that integrates with the Prisma SQLite database. This system provides detailed tracking of all application events, job executions, and their associated logs.

## Database Schema

### New Tables Added

#### 1. `job_executions`

Tracks individual executions of jobs with detailed progress and status information.

```sql
CREATE TABLE "job_executions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentStep" TEXT,
    "result" TEXT,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "duration" INTEGER,
    FOREIGN KEY ("jobId") REFERENCES "jobs" ("id") ON DELETE CASCADE
);
```

#### 2. `job_logs`

Stores detailed logs for each job execution.

```sql
CREATE TABLE "job_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "executionId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("executionId") REFERENCES "job_executions" ("id") ON DELETE CASCADE
);
```

#### 3. `app_logs`

Application-wide logging for all events and operations.

```sql
CREATE TABLE "app_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "source" TEXT,
    "projectId" TEXT,
    "dataSourceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Services Implemented

### 1. `DatabaseLogger`

Handles all database logging operations.

```typescript
class DatabaseLogger {
  // Log application-wide events
  async logAppEvent(
    level,
    category,
    message,
    details?,
    source?,
    projectId?,
    dataSourceId?
  ): Promise<void>;

  // Log job execution events
  async logJobExecution(
    executionId,
    level,
    message,
    details?,
    source?
  ): Promise<void>;

  // Get application logs with filtering
  async getAppLogs(options): Promise<DatabaseLogEntry[]>;

  // Get job execution logs
  async getJobExecutionLogs(executionId, options): Promise<JobExecutionLog[]>;

  // Get job execution history
  async getJobExecutions(jobId, options): Promise<any[]>;

  // Get all jobs with their execution history
  async getJobsWithHistory(projectId?, options): Promise<any[]>;

  // Clean up old logs (retention policy)
  async cleanupOldLogs(retentionDays): Promise<void>;

  // Get log statistics
  async getLogStats(projectId?): Promise<LogStats>;
}
```

### 2. `JobExecutionService`

Manages job execution with proper tracking and logging.

```typescript
class JobExecutionService {
  // Create a new job
  async createJob(options): Promise<string>;

  // Start job execution
  async startJobExecution(jobId): Promise<string>;

  // Update job execution progress
  async updateJobProgress(executionId, progress, currentStep?): Promise<void>;

  // Complete job execution
  async completeJobExecution(executionId, result): Promise<void>;

  // Cancel job execution
  async cancelJobExecution(executionId, reason?): Promise<void>;

  // Get job execution history
  async getJobHistory(jobId, options): Promise<any[]>;

  // Get all jobs with history
  async getAllJobsWithHistory(projectId?, options): Promise<any[]>;

  // Execute a job with proper tracking
  async executeJob<T>(
    options,
    jobFunction
  ): Promise<{ jobId; executionId; result }>;

  // Get job statistics
  async getJobStats(projectId?): Promise<JobStats>;
}
```

### 3. `EnhancedLogger`

Enhanced logger that integrates with database logging.

```typescript
class EnhancedLogger {
  // Initialize database logging
  async initializeDatabaseLogging(): Promise<void>;

  // Async logging methods
  async debug(
    message,
    details?,
    source?,
    projectId?,
    dataSourceId?
  ): Promise<void>;
  async info(
    message,
    category?,
    details?,
    source?,
    projectId?,
    dataSourceId?
  ): Promise<void>;
  async warn(
    message,
    category?,
    details?,
    source?,
    projectId?,
    dataSourceId?
  ): Promise<void>;
  async error(
    message,
    category?,
    details?,
    source?,
    projectId?,
    dataSourceId?
  ): Promise<void>;
  async success(
    message,
    category?,
    details?,
    source?,
    projectId?,
    dataSourceId?
  ): Promise<void>;

  // Sync versions for backward compatibility
  debugSync(message, details?, source?, projectId?, dataSourceId?): void;
  infoSync(
    message,
    category?,
    details?,
    source?,
    projectId?,
    dataSourceId?
  ): void;
  warnSync(
    message,
    category?,
    details?,
    source?,
    projectId?,
    dataSourceId?
  ): void;
  errorSync(
    message,
    category?,
    details?,
    source?,
    projectId?,
    dataSourceId?
  ): void;
  successSync(
    message,
    category?,
    details?,
    source?,
    projectId?,
    dataSourceId?
  ): void;

  // Event listener methods
  addListener(listener): void;
  removeListener(listener): void;

  // Utility methods
  getDatabaseLogger(): DatabaseLogger | null;
  getQueuedLogsCount(): number;
  clearQueuedLogs(): void;
}
```

## Updated Services

### `BackupJobService`

Now uses the new job execution service for proper tracking.

```typescript
// Before
async createBackupJob(config): Promise<string> {
  // Simple job creation without detailed tracking
}

// After
async createBackupJob(config): Promise<string> {
  const result = await this.jobExecutionService.executeJob(
    {
      projectId: config.projectId,
      type: "backup",
      description: `Backup project ${config.projectId} as ${config.type}`,
      config: { ...config },
    },
    async (executionId, updateProgress) => {
      return await this.executeBackupJobWithProgress(executionId, config, updateProgress);
    }
  );
  return result.jobId;
}
```

## Key Features

### 1. **Comprehensive Logging**

- Application-wide event logging
- Job execution logging
- Progress tracking with detailed steps
- Error tracking and debugging information

### 2. **Job History Tracking**

- Complete job execution history
- Progress tracking with timestamps
- Retry count and error handling
- Duration tracking

### 3. **Performance Monitoring**

- Job statistics and success rates
- Average execution times
- Log statistics by level and category
- Recent error tracking

### 4. **Data Retention**

- Configurable log retention policies
- Automatic cleanup of old logs
- Efficient storage with proper indexing

### 5. **Backward Compatibility**

- Sync logging methods for existing code
- Async methods for new implementations
- Fallback to console logging if database unavailable

## Usage Examples

### Basic Logging

```typescript
import { enhancedLogger } from "./lib/utils/EnhancedLogger";

// Initialize database logging
await enhancedLogger.initializeDatabaseLogging();

// Log application events
await enhancedLogger.info("User logged in", "auth", { userId: "123" });
await enhancedLogger.error("Database connection failed", "database", {
  error: "Connection timeout",
});
```

### Job Execution with Tracking

```typescript
import { JobExecutionService } from "./lib/services/JobExecutionService";

const jobService = JobExecutionService.getInstance();

const result = await jobService.executeJob(
  {
    projectId: "proj_123",
    type: "backup",
    description: "Daily backup",
  },
  async (executionId, updateProgress) => {
    await updateProgress(25, "Fetching data");
    // ... do work ...
    await updateProgress(50, "Processing data");
    // ... do work ...
    await updateProgress(100, "Complete");
    return { success: true, recordsProcessed: 1000 };
  }
);
```

### Querying Logs and History

```typescript
import { DatabaseLogger } from "./lib/services/DatabaseLogger";

const dbLogger = DatabaseLogger.getInstance();

// Get recent application logs
const appLogs = await dbLogger.getAppLogs({
  level: "error",
  projectId: "proj_123",
  limit: 50,
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
});

// Get job execution history
const jobHistory = await dbLogger.getJobExecutions("job_123", {
  limit: 10,
});

// Get job statistics
const stats = await jobService.getJobStats("proj_123");
console.log(`Success rate: ${stats.successRate}%`);
console.log(`Average duration: ${stats.averageDuration}ms`);
```

## Benefits

### 1. **Complete Audit Trail**

- Every operation is logged with timestamps
- Job execution history with progress tracking
- Error tracking and debugging information

### 2. **Performance Monitoring**

- Job success rates and execution times
- System performance metrics
- Resource usage tracking

### 3. **Debugging and Troubleshooting**

- Detailed error logs with context
- Job execution traces
- System event tracking

### 4. **Compliance and Reporting**

- Complete operation history
- Audit trail for all actions
- Performance and reliability metrics

### 5. **Scalability**

- Efficient database storage with indexing
- Configurable retention policies
- Asynchronous logging to prevent blocking

## Migration

To use the new logging system:

1. **Initialize the enhanced logger:**

```typescript
import { enhancedLogger } from "./lib/utils/EnhancedLogger";
await enhancedLogger.initializeDatabaseLogging();
```

2. **Update existing logging calls:**

```typescript
// Old
logger.info("Message", "category", details, "source");

// New (async)
await enhancedLogger.info("Message", "category", details, "source");

// Or use sync version for backward compatibility
enhancedLogger.infoSync("Message", "category", details, "source");
```

3. **Use job execution service for new jobs:**

```typescript
import { JobExecutionService } from "./lib/services/JobExecutionService";
const jobService = JobExecutionService.getInstance();
```

This implementation provides a robust foundation for logging and job history tracking in the Manifold application, ensuring complete visibility into all operations and system behavior.
