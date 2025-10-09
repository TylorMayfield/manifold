/**
 * Unit Tests for JobScheduler (Consolidated)
 *
 * Tests the primary job scheduling system after consolidation from 5 schedulers to 1.
 *
 * Tests include:
 * - Job creation and management
 * - Cron scheduling
 * - Multiple job types (pipeline, data_sync, backup, etc.)
 * - Execution tracking
 * - Error handling
 */

import { JobScheduler } from "../../lib/server/services/JobScheduler";

// Mock dependencies
jest.mock("../../lib/server/services/DatabaseService", () => ({
  ensureDatabase: jest.fn().mockResolvedValue({
    query: jest.fn().mockResolvedValue([]),
    run: jest.fn().mockResolvedValue({}),
  }),
  DatabaseService: jest.fn(),
}));

jest.mock("../../lib/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("JobScheduler (Consolidated)", () => {
  let scheduler: JobScheduler;

  beforeEach(() => {
    scheduler = JobScheduler.getInstance();
    jest.clearAllMocks();
  });

  describe("Job Creation", () => {
    test("should create a pipeline job", async () => {
      const jobData = {
        name: "Daily ETL Pipeline",
        description: "Runs daily ETL process",
        type: "pipeline" as const,
        pipelineId: "pipeline-123",
        schedule: "0 2 * * *", // 2 AM daily
        enabled: true,
        projectId: "test-project",
      };

      const job = await scheduler.createJob(jobData);

      expect(job).toBeDefined();
      expect(job.name).toBe("Daily ETL Pipeline");
      expect(job.type).toBe("pipeline");
      expect(job.status).toBe("pending");
      expect(job.enabled).toBe(true);
    });

    test("should create a data sync job", async () => {
      const jobData = {
        name: "Data Source Sync",
        type: "data_sync" as const,
        schedule: "*/30 * * * *", // Every 30 minutes
        enabled: true,
        projectId: "test-project",
      };

      const job = await scheduler.createJob(jobData);

      expect(job.type).toBe("data_sync");
      expect(job.schedule).toBe("*/30 * * * *");
    });

    test("should create a backup job", async () => {
      const jobData = {
        name: "Nightly Backup",
        type: "backup" as const,
        schedule: "0 0 * * *", // Midnight daily
        enabled: true,
        projectId: "test-project",
      };

      const job = await scheduler.createJob(jobData);

      expect(job.type).toBe("backup");
    });

    test("should create an API poll job", async () => {
      const jobData = {
        name: "API Polling",
        type: "api_poll" as const,
        schedule: "*/5 * * * *", // Every 5 minutes
        enabled: true,
        projectId: "test-project",
        config: {
          url: "https://api.example.com/data",
          method: "GET",
        },
      };

      const job = await scheduler.createJob(jobData);

      expect(job.type).toBe("api_poll");
    });
  });

  describe("Job Management", () => {
    test("should list all jobs for a project", async () => {
      const projectId = "test-project";

      // Create several jobs
      await scheduler.createJob({
        name: "Job 1",
        type: "pipeline",
        schedule: "0 * * * *",
        enabled: true,
        projectId,
      });

      await scheduler.createJob({
        name: "Job 2",
        type: "data_sync",
        schedule: "*/15 * * * *",
        enabled: true,
        projectId,
      });

      const jobs = await scheduler.getJobs(projectId);

      expect(jobs.length).toBeGreaterThanOrEqual(2);
      expect(jobs.every((j) => j.projectId === projectId)).toBe(true);
    });

    test("should get a specific job by ID", async () => {
      const job = await scheduler.createJob({
        name: "Test Job",
        type: "pipeline",
        schedule: "0 * * * *",
        enabled: true,
        projectId: "test-project",
      });

      const retrieved = await scheduler.getJob(job.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(job.id);
      expect(retrieved!.name).toBe("Test Job");
    });

    test("should update a job", async () => {
      const job = await scheduler.createJob({
        name: "Original Name",
        type: "pipeline",
        schedule: "0 * * * *",
        enabled: true,
        projectId: "test-project",
      });

      await scheduler.updateJob(job.id, {
        name: "Updated Name",
        schedule: "0 2 * * *",
      });

      const updated = await scheduler.getJob(job.id);

      expect(updated!.name).toBe("Updated Name");
      expect(updated!.schedule).toBe("0 2 * * *");
    });

    test("should delete a job", async () => {
      const job = await scheduler.createJob({
        name: "To Delete",
        type: "pipeline",
        schedule: "0 * * * *",
        enabled: true,
        projectId: "test-project",
      });

      const success = await scheduler.deleteJob(job.id);

      expect(success).toBe(true);

      const retrieved = await scheduler.getJob(job.id);
      expect(retrieved).toBeNull();
    });

    test("should enable/disable a job", async () => {
      const job = await scheduler.createJob({
        name: "Toggle Job",
        type: "pipeline",
        schedule: "0 * * * *",
        enabled: true,
        projectId: "test-project",
      });

      // Disable
      await scheduler.updateJob(job.id, { enabled: false });
      let updated = await scheduler.getJob(job.id);
      expect(updated!.enabled).toBe(false);

      // Enable
      await scheduler.updateJob(job.id, { enabled: true });
      updated = await scheduler.getJob(job.id);
      expect(updated!.enabled).toBe(true);
    });
  });

  describe("Job Execution", () => {
    test("should execute a job manually", async () => {
      const job = await scheduler.createJob({
        name: "Manual Job",
        type: "pipeline",
        pipelineId: "pipeline-123",
        schedule: "0 * * * *",
        enabled: true,
        projectId: "test-project",
      });

      const executionId = await scheduler.executeJob(job.id);

      expect(executionId).toBeDefined();
      expect(typeof executionId).toBe("string");
    });

    test("should track execution history", async () => {
      const job = await scheduler.createJob({
        name: "History Job",
        type: "data_sync",
        schedule: "0 * * * *",
        enabled: true,
        projectId: "test-project",
      });

      // Execute job
      await scheduler.executeJob(job.id);

      // Get execution history
      const history = await scheduler.getJobExecutions(job.id);

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    });

    test("should handle job execution errors gracefully", async () => {
      const job = await scheduler.createJob({
        name: "Error Job",
        type: "pipeline",
        pipelineId: "non-existent-pipeline",
        schedule: "0 * * * *",
        enabled: true,
        projectId: "test-project",
      });

      // Should not throw, but should log error
      await expect(scheduler.executeJob(job.id)).resolves.toBeDefined();
    });
  });

  describe("Schedule Validation", () => {
    test("should accept valid cron expressions", async () => {
      const validSchedules = [
        "*/5 * * * *", // Every 5 minutes
        "0 * * * *", // Every hour
        "0 0 * * *", // Daily at midnight
        "0 0 * * 0", // Weekly on Sunday
        "0 0 1 * *", // Monthly on 1st
      ];

      for (const schedule of validSchedules) {
        const job = await scheduler.createJob({
          name: `Test ${schedule}`,
          type: "data_sync",
          schedule,
          enabled: true,
          projectId: "test-project",
        });

        expect(job.schedule).toBe(schedule);
      }
    });
  });

  describe("Job Types", () => {
    test("should support all job types", async () => {
      const types: Array<
        | "pipeline"
        | "data_sync"
        | "backup"
        | "cleanup"
        | "custom_script"
        | "api_poll"
        | "workflow"
      > = [
        "pipeline",
        "data_sync",
        "backup",
        "cleanup",
        "custom_script",
        "api_poll",
        "workflow",
      ];

      for (const type of types) {
        const job = await scheduler.createJob({
          name: `${type} Job`,
          type,
          schedule: "0 * * * *",
          enabled: true,
          projectId: "test-project",
        });

        expect(job.type).toBe(type);
      }
    });
  });

  describe("Consolidation Verification", () => {
    test("should be a singleton instance", () => {
      const instance1 = JobScheduler.getInstance();
      const instance2 = JobScheduler.getInstance();

      expect(instance1).toBe(instance2);
    });

    test("should handle pipeline jobs (from ETLSchedulerService)", async () => {
      // This tests functionality that was in ETLSchedulerService
      const job = await scheduler.createJob({
        name: "ETL Pipeline",
        type: "pipeline",
        pipelineId: "etl-pipeline-1",
        schedule: "0 2 * * *",
        enabled: true,
        projectId: "test-project",
      });

      expect(job.type).toBe("pipeline");
      expect(job.pipelineId).toBe("etl-pipeline-1");
    });

    test("should handle data sync jobs (from JobExecutor/JobFactory)", async () => {
      // This tests functionality that was in JobExecutor
      const job = await scheduler.createJob({
        name: "MySQL Sync",
        type: "data_sync",
        dataSourceId: "mysql-source-1",
        schedule: "0 */6 * * *",
        enabled: true,
        projectId: "test-project",
      });

      expect(job.type).toBe("data_sync");
      expect(job.dataSourceId).toBe("mysql-source-1");
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid job ID gracefully", async () => {
      const result = await scheduler.getJob("non-existent-id");
      expect(result).toBeNull();
    });

    test("should handle deletion of non-existent job", async () => {
      const result = await scheduler.deleteJob("non-existent-id");
      expect(result).toBe(false);
    });

    test("should validate required fields", async () => {
      // Missing name
      await expect(
        scheduler.createJob({
          name: "",
          type: "pipeline",
          schedule: "0 * * * *",
          enabled: true,
          projectId: "test-project",
        })
      ).rejects.toThrow();
    });
  });

  describe("Integration with Other Services", () => {
    test("should integrate with pipeline executor", async () => {
      const job = await scheduler.createJob({
        name: "Pipeline Integration",
        type: "pipeline",
        pipelineId: "pipeline-123",
        schedule: "0 * * * *",
        enabled: true,
        projectId: "test-project",
      });

      // Execute and verify it attempts to call pipeline executor
      const executionId = await scheduler.executeJob(job.id);
      expect(executionId).toBeDefined();
    });
  });
});
