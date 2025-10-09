/**
 * Unit Tests for JobFactory (renamed from JobExecutor)
 *
 * Tests job creation/factory functionality - NOT scheduling.
 * JobFactory is responsible for auto-creating jobs from data sources.
 *
 * Tests include:
 * - Creating jobs from data sources
 * - Auto-generating sync jobs
 * - Creating API poll jobs
 * - Job templates
 */

import { JobFactory } from "../../lib/server/services/JobFactory";

// Mock dependencies
jest.mock("../../lib/server/services/DatabaseService", () => ({
  ensureDatabase: jest.fn().mockResolvedValue({
    query: jest.fn().mockResolvedValue([]),
    run: jest.fn().mockResolvedValue({}),
    getDataSources: jest.fn().mockResolvedValue([]),
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

describe("JobFactory (renamed from JobExecutor)", () => {
  let factory: JobFactory;

  beforeEach(() => {
    factory = JobFactory.getInstance();
    jest.clearAllMocks();
  });

  describe("Initialization", () => {
    test("should be a singleton", () => {
      const instance1 = JobFactory.getInstance();
      const instance2 = JobFactory.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe("Job Creation from Data Sources", () => {
    test("should create sync jobs for MySQL data sources", async () => {
      const {
        ensureDatabase,
      } = require("../../lib/server/services/DatabaseService");
      const mockDb = await ensureDatabase();

      mockDb.getDataSources.mockResolvedValue([
        {
          id: "mysql-1",
          name: "MySQL Database",
          type: "mysql",
          projectId: "test-project",
        },
      ]);

      const jobs = await factory.createJobsFromDataSources("test-project");

      expect(jobs.length).toBeGreaterThan(0);
      const syncJob = jobs.find((j) => j.type === "sync");
      expect(syncJob).toBeDefined();
      expect(syncJob!.dataSourceId).toBe("mysql-1");
    });

    test("should create poll jobs for API data sources", async () => {
      const {
        ensureDatabase,
      } = require("../../lib/server/services/DatabaseService");
      const mockDb = await ensureDatabase();

      mockDb.getDataSources.mockResolvedValue([
        {
          id: "api-1",
          name: "API Source",
          type: "api_script",
          projectId: "test-project",
        },
      ]);

      const jobs = await factory.createJobsFromDataSources("test-project");

      expect(jobs.length).toBeGreaterThan(0);
      const pollJob = jobs.find((j) => j.type === "api_poll");
      expect(pollJob).toBeDefined();
      expect(pollJob!.dataSourceId).toBe("api-1");
    });

    test("should set appropriate schedules based on data source type", async () => {
      const {
        ensureDatabase,
      } = require("../../lib/server/services/DatabaseService");
      const mockDb = await ensureDatabase();

      mockDb.getDataSources.mockResolvedValue([
        {
          id: "mysql-1",
          name: "MySQL",
          type: "mysql",
          projectId: "test-project",
        },
        {
          id: "api-1",
          name: "API",
          type: "api_script",
          projectId: "test-project",
        },
      ]);

      const jobs = await factory.createJobsFromDataSources("test-project");

      // MySQL should sync less frequently (every 6 hours)
      const mysqlJob = jobs.find(
        (j) => j.dataSourceId === "mysql-1" && j.type === "sync"
      );
      expect(mysqlJob!.schedule).toContain("*/6"); // Every 6 hours

      // API should poll more frequently (every 15 minutes)
      const apiJob = jobs.find(
        (j) => j.dataSourceId === "api-1" && j.type === "sync"
      );
      expect(apiJob!.schedule).toContain("*/15"); // Every 15 minutes
    });

    test("should handle empty data source list", async () => {
      const {
        ensureDatabase,
      } = require("../../lib/server/services/DatabaseService");
      const mockDb = await ensureDatabase();

      mockDb.getDataSources.mockResolvedValue([]);

      const jobs = await factory.createJobsFromDataSources("test-project");

      expect(jobs).toEqual([]);
    });

    test("should create multiple job types for appropriate sources", async () => {
      const {
        ensureDatabase,
      } = require("../../lib/server/services/DatabaseService");
      const mockDb = await ensureDatabase();

      mockDb.getDataSources.mockResolvedValue([
        {
          id: "api-1",
          name: "API Source",
          type: "api_script",
          projectId: "test-project",
        },
      ]);

      const jobs = await factory.createJobsFromDataSources("test-project");

      // API sources should get both sync and poll jobs
      const syncJob = jobs.find((j) => j.type === "sync");
      const pollJob = jobs.find((j) => j.type === "api_poll");

      expect(syncJob).toBeDefined();
      expect(pollJob).toBeDefined();
    });
  });

  describe("Job Templates", () => {
    test("should generate meaningful job names", async () => {
      const {
        ensureDatabase,
      } = require("../../lib/server/services/DatabaseService");
      const mockDb = await ensureDatabase();

      mockDb.getDataSources.mockResolvedValue([
        {
          id: "mysql-1",
          name: "Production DB",
          type: "mysql",
          projectId: "test-project",
        },
      ]);

      const jobs = await factory.createJobsFromDataSources("test-project");

      const syncJob = jobs.find((j) => j.type === "sync");
      expect(syncJob!.name).toContain("Production DB");
      expect(syncJob!.name).toContain("Sync");
    });

    test("should include metadata in created jobs", async () => {
      const {
        ensureDatabase,
      } = require("../../lib/server/services/DatabaseService");
      const mockDb = await ensureDatabase();

      mockDb.getDataSources.mockResolvedValue([
        {
          id: "mysql-1",
          name: "MySQL DB",
          type: "mysql",
          projectId: "test-project",
        },
      ]);

      const jobs = await factory.createJobsFromDataSources("test-project");

      const job = jobs[0];
      expect(job.metadata).toBeDefined();
      expect(job.metadata.dataSourceType).toBe("mysql");
      expect(job.metadata.dataSourceName).toBe("MySQL DB");
    });
  });

  describe("Job Configuration", () => {
    test("should set jobs as active by default", async () => {
      const {
        ensureDatabase,
      } = require("../../lib/server/services/DatabaseService");
      const mockDb = await ensureDatabase();

      mockDb.getDataSources.mockResolvedValue([
        {
          id: "mysql-1",
          name: "MySQL",
          type: "mysql",
          projectId: "test-project",
        },
      ]);

      const jobs = await factory.createJobsFromDataSources("test-project");

      expect(jobs.every((j) => j.isActive === true)).toBe(true);
    });

    test("should set appropriate nextRun times", async () => {
      const {
        ensureDatabase,
      } = require("../../lib/server/services/DatabaseService");
      const mockDb = await ensureDatabase();

      mockDb.getDataSources.mockResolvedValue([
        {
          id: "api-1",
          name: "API",
          type: "api_script",
          projectId: "test-project",
        },
      ]);

      const jobs = await factory.createJobsFromDataSources("test-project");

      // All jobs should have a future nextRun time
      const now = new Date();
      expect(jobs.every((j) => j.nextRun > now)).toBe(true);
    });
  });

  describe("Error Handling", () => {
    test("should handle database errors gracefully", async () => {
      const {
        ensureDatabase,
      } = require("../../lib/server/services/DatabaseService");
      const mockDb = await ensureDatabase();

      mockDb.getDataSources.mockRejectedValue(new Error("Database error"));

      await expect(
        factory.createJobsFromDataSources("test-project")
      ).rejects.toThrow("Database error");
    });

    test("should skip invalid data sources", async () => {
      const {
        ensureDatabase,
      } = require("../../lib/server/services/DatabaseService");
      const mockDb = await ensureDatabase();

      mockDb.getDataSources.mockResolvedValue([
        {
          id: "invalid-1",
          name: "Invalid Source",
          type: "unknown_type",
          projectId: "test-project",
        },
      ]);

      const jobs = await factory.createJobsFromDataSources("test-project");

      // Should not create jobs for unknown types
      expect(jobs.length).toBe(0);
    });
  });

  describe("Integration with JobScheduler", () => {
    test("should create jobs compatible with JobScheduler", async () => {
      const {
        ensureDatabase,
      } = require("../../lib/server/services/DatabaseService");
      const mockDb = await ensureDatabase();

      mockDb.getDataSources.mockResolvedValue([
        {
          id: "mysql-1",
          name: "MySQL",
          type: "mysql",
          projectId: "test-project",
        },
      ]);

      const jobs = await factory.createJobsFromDataSources("test-project");

      // Verify job structure is compatible
      jobs.forEach((job) => {
        expect(job.id).toBeDefined();
        expect(job.name).toBeDefined();
        expect(job.type).toBeDefined();
        expect(job.schedule).toBeDefined();
        expect(job.projectId).toBe("test-project");
      });
    });
  });

  describe("Consolidation Verification", () => {
    test("should clarify it is NOT a scheduler", () => {
      // This test documents the role change from JobExecutor to JobFactory
      expect(factory.constructor.name).toBe("JobFactory");

      // Factory creates jobs, doesn't execute them
      // Execution is JobScheduler's responsibility
    });
  });
});
