-- Add job execution and logging tables
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
    CONSTRAINT "job_executions_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "job_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "executionId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_logs_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "job_executions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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

-- Create indexes for better performance
CREATE INDEX "job_executions_jobId_idx" ON "job_executions"("jobId");
CREATE INDEX "job_executions_status_idx" ON "job_executions"("status");
CREATE INDEX "job_executions_createdAt_idx" ON "job_executions"("createdAt");

CREATE INDEX "job_logs_executionId_idx" ON "job_logs"("executionId");
CREATE INDEX "job_logs_level_idx" ON "job_logs"("level");
CREATE INDEX "job_logs_createdAt_idx" ON "job_logs"("createdAt");

CREATE INDEX "app_logs_level_idx" ON "app_logs"("level");
CREATE INDEX "app_logs_category_idx" ON "app_logs"("category");
CREATE INDEX "app_logs_projectId_idx" ON "app_logs"("projectId");
CREATE INDEX "app_logs_createdAt_idx" ON "app_logs"("createdAt");
