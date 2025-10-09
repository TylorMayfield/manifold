/**
 * System Integration Tests
 *
 * Tests end-to-end flows across consolidated systems:
 * - Data Sources → Pipelines → Jobs → Data Lakes
 * - Integration Hub coordination
 * - Cross-system data flow
 *
 * These tests verify that our consolidation work didn't break integrations.
 */

import { DataLakeService } from "../../lib/services/DataLakeService";
import { JobScheduler } from "../../lib/server/services/JobScheduler";
import { JobFactory } from "../../lib/server/services/JobFactory";

// Mock MongoDB
jest.mock("../../lib/server/database/MongoDatabase", () => ({
  MongoDatabase: {
    getInstance: jest.fn(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      getSnapshots: jest.fn().mockResolvedValue([{ id: "snap-1", version: 1 }]),
      getImportedData: jest.fn().mockResolvedValue({
        data: [
          { data: { id: 1, name: "Alice", email: "alice@test.com" } },
          { data: { id: 2, name: "Bob", email: "bob@test.com" } },
        ],
      }),
      getPipeline: jest.fn(),
    })),
  },
}));

// Mock Database Service
jest.mock("../../lib/server/services/DatabaseService", () => ({
  ensureDatabase: jest.fn().mockResolvedValue({
    query: jest.fn().mockResolvedValue([]),
    run: jest.fn().mockResolvedValue({}),
    getDataSources: jest.fn().mockResolvedValue([
      {
        id: "source-1",
        name: "Test Source",
        type: "mysql",
        projectId: "test-project",
      },
    ]),
  }),
  DatabaseService: jest.fn(),
}));

// Mock loggers
jest.mock("../../lib/utils/ClientLogger", () => ({
  clientLogger: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock("../../lib/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("System Integration Tests", () => {
  let dataLakeService: DataLakeService;
  let jobScheduler: JobScheduler;
  let jobFactory: JobFactory;

  beforeEach(() => {
    dataLakeService = DataLakeService.getInstance();
    jobScheduler = JobScheduler.getInstance();
    jobFactory = JobFactory.getInstance();
    jest.clearAllMocks();
  });

  describe("Data Source → Data Lake Flow", () => {
    test("should build data lake from data sources with snapshots", async () => {
      // Step 1: Create data lake referencing data sources
      const lake = await dataLakeService.createDataLake({
        projectId: "test-project",
        name: "Integration Test Lake",
        description: "Testing full flow",
        config: {
          dataSourceIds: ["source-1", "source-2"],
          settings: {
            storageType: "sqlite",
            compression: true,
            partitioning: "data_source",
            deduplication: true,
            deduplicationKey: "id",
            dataValidation: true,
            schemaEvolution: "auto",
            indexing: true,
            caching: true,
            autoRefresh: false,
          },
        },
      });

      expect(lake.status).toBe("draft");

      // Step 2: Build the lake (loads data from snapshots)
      const buildResult = await dataLakeService.buildDataLake(lake.id);

      expect(buildResult.success).toBe(true);
      expect(buildResult.status).toBe("ready");
      expect(buildResult.recordsProcessed).toBeGreaterThan(0);

      // Step 3: Query the built lake
      const queryResult = await dataLakeService.queryDataLake(lake.id, {
        limit: 10,
      });

      expect(queryResult.rows.length).toBeGreaterThan(0);
      expect(queryResult.columns).toContain("id");
      expect(queryResult.columns).toContain("name");
    });

    test("should consolidate data from multiple sources", async () => {
      // Create lake with multiple sources
      const lake = await dataLakeService.createDataLake({
        projectId: "test-project",
        name: "Multi-Source Lake",
        config: {
          dataSourceIds: ["source-1", "source-2", "source-3"],
          settings: {
            storageType: "sqlite",
            compression: true,
            partitioning: "data_source",
            deduplication: false,
            dataValidation: true,
            schemaEvolution: "auto",
            indexing: false,
            caching: false,
            autoRefresh: false,
          },
        },
      });

      // Build
      const result = await dataLakeService.buildDataLake(lake.id);

      // Verify all sources were processed
      expect(result.metadata.sources.length).toBe(3);
      expect(result.success).toBe(true);
    });
  });

  describe("Data Source → Job Creation Flow", () => {
    test("should auto-create jobs from data sources", async () => {
      // Step 1: JobFactory creates jobs from data sources
      const jobs = await jobFactory.createJobsFromDataSources("test-project");

      expect(jobs.length).toBeGreaterThan(0);

      // Step 2: JobScheduler can schedule these jobs
      for (const jobData of jobs) {
        const scheduledJob = await jobScheduler.createJob({
          ...jobData,
          projectId: "test-project",
        });

        expect(scheduledJob.id).toBeDefined();
        expect(scheduledJob.schedule).toBeDefined();
      }
    });
  });

  describe("Pipeline → Job → Execution Flow", () => {
    test("should create and execute pipeline job", async () => {
      // Step 1: Create a pipeline job
      const job = await jobScheduler.createJob({
        name: "Test Pipeline Job",
        type: "pipeline",
        pipelineId: "test-pipeline",
        schedule: "0 * * * *",
        enabled: true,
        projectId: "test-project",
      });

      expect(job.type).toBe("pipeline");
      expect(job.pipelineId).toBe("test-pipeline");

      // Step 2: Execute the job
      const executionId = await jobScheduler.executeJob(job.id);

      expect(executionId).toBeDefined();

      // Step 3: Check execution history
      const history = await jobScheduler.getJobExecutions(job.id);

      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe("Full ETL Flow: Source → Pipeline → Lake", () => {
    test("should complete full ETL workflow", async () => {
      const projectId = "test-project";

      // Step 1: Data sources exist (mocked)
      // Step 2: Create pipeline job to transform data
      const pipelineJob = await jobScheduler.createJob({
        name: "ETL Pipeline",
        type: "pipeline",
        pipelineId: "etl-pipeline-1",
        schedule: "0 2 * * *",
        enabled: true,
        projectId,
      });

      expect(pipelineJob).toBeDefined();

      // Step 3: Create data lake to consolidate results
      const lake = await dataLakeService.createDataLake({
        projectId,
        name: "ETL Results Lake",
        config: {
          dataSourceIds: ["source-1"],
          settings: {
            storageType: "sqlite",
            compression: true,
            partitioning: "none",
            deduplication: true,
            deduplicationKey: "id",
            dataValidation: true,
            schemaEvolution: "auto",
            indexing: true,
            caching: true,
            autoRefresh: false,
          },
        },
      });

      // Step 4: Build the lake
      const buildResult = await dataLakeService.buildDataLake(lake.id);

      expect(buildResult.success).toBe(true);

      // Step 5: Query results
      const queryResult = await dataLakeService.queryDataLake(lake.id);

      expect(queryResult.totalCount).toBeGreaterThan(0);
    });
  });

  describe("Job Scheduler Consolidation Verification", () => {
    test("should handle all job types in single scheduler", async () => {
      const jobTypes: Array<"pipeline" | "data_sync" | "backup" | "api_poll"> =
        ["pipeline", "data_sync", "backup", "api_poll"];

      const createdJobs = [];

      for (const type of jobTypes) {
        const job = await jobScheduler.createJob({
          name: `${type} job`,
          type,
          schedule: "0 * * * *",
          enabled: true,
          projectId: "test-project",
        });

        createdJobs.push(job);
      }

      // Verify all jobs created by same scheduler
      expect(createdJobs.length).toBe(jobTypes.length);
      expect(createdJobs.every((j) => j.id)).toBe(true);

      // Verify we can retrieve all jobs
      const allJobs = await jobScheduler.getJobs("test-project");
      expect(allJobs.length).toBeGreaterThanOrEqual(jobTypes.length);
    });
  });

  describe("Error Handling Across Systems", () => {
    test("should handle missing data source gracefully in data lake build", async () => {
      const lake = await dataLakeService.createDataLake({
        projectId: "test-project",
        name: "Error Test Lake",
        config: {
          dataSourceIds: ["non-existent-source"],
          settings: {
            storageType: "sqlite",
            compression: true,
            partitioning: "none",
            deduplication: false,
            dataValidation: true,
            schemaEvolution: "auto",
            indexing: false,
            caching: false,
            autoRefresh: false,
          },
        },
      });

      // Mock MongoDB to return empty snapshots
      const {
        MongoDatabase,
      } = require("../../lib/server/database/MongoDatabase");
      const mockDb = MongoDatabase.getInstance();
      mockDb.getSnapshots.mockResolvedValue([]);

      // Should not throw, but should handle gracefully
      const result = await dataLakeService.buildDataLake(lake.id);

      expect(result.success).toBe(true); // Success with 0 records
      expect(result.recordsStored).toBe(0);
    });

    test("should handle job execution failure gracefully", async () => {
      const job = await jobScheduler.createJob({
        name: "Failing Job",
        type: "pipeline",
        pipelineId: "non-existent-pipeline",
        schedule: "0 * * * *",
        enabled: true,
        projectId: "test-project",
      });

      // Should not throw
      await expect(jobScheduler.executeJob(job.id)).resolves.toBeDefined();
    });
  });

  describe("Performance and Scalability", () => {
    test("should handle multiple concurrent data lake builds", async () => {
      const lakes = await Promise.all([
        dataLakeService.createDataLake({
          projectId: "test-project",
          name: "Lake 1",
          config: {
            dataSourceIds: ["source-1"],
            settings: {
              storageType: "sqlite",
              compression: true,
              partitioning: "none",
              deduplication: false,
              dataValidation: true,
              schemaEvolution: "auto",
              indexing: false,
              caching: false,
              autoRefresh: false,
            },
          },
        }),
        dataLakeService.createDataLake({
          projectId: "test-project",
          name: "Lake 2",
          config: {
            dataSourceIds: ["source-2"],
            settings: {
              storageType: "sqlite",
              compression: true,
              partitioning: "none",
              deduplication: false,
              dataValidation: true,
              schemaEvolution: "auto",
              indexing: false,
              caching: false,
              autoRefresh: false,
            },
          },
        }),
      ]);

      // Build both lakes concurrently
      const results = await Promise.all(
        lakes.map((lake) => dataLakeService.buildDataLake(lake.id))
      );

      expect(results.every((r) => r.success)).toBe(true);
    });

    test("should handle multiple concurrent job executions", async () => {
      const jobs = await Promise.all([
        jobScheduler.createJob({
          name: "Job 1",
          type: "data_sync",
          schedule: "0 * * * *",
          enabled: true,
          projectId: "test-project",
        }),
        jobScheduler.createJob({
          name: "Job 2",
          type: "backup",
          schedule: "0 * * * *",
          enabled: true,
          projectId: "test-project",
        }),
      ]);

      // Execute both jobs concurrently
      const executions = await Promise.all(
        jobs.map((job) => jobScheduler.executeJob(job.id))
      );

      expect(executions.every((id) => typeof id === "string")).toBe(true);
    });
  });

  describe("Data Consistency", () => {
    test("should maintain referential integrity across systems", async () => {
      // Create data lake
      const lake = await dataLakeService.createDataLake({
        projectId: "test-project",
        name: "Integrity Test",
        config: {
          dataSourceIds: ["source-1"],
          settings: {
            storageType: "sqlite",
            compression: true,
            partitioning: "none",
            deduplication: false,
            dataValidation: true,
            schemaEvolution: "auto",
            indexing: false,
            caching: false,
            autoRefresh: false,
          },
        },
      });

      // Build lake
      await dataLakeService.buildDataLake(lake.id);

      // Verify lake references are maintained
      const retrieved = await dataLakeService.getDataLake(lake.id);
      expect(retrieved!.config.dataSourceIds).toEqual(["source-1"]);
      expect(retrieved!.status).toBe("ready");
    });
  });
});
