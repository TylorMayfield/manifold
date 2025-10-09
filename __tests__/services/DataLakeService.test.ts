/**
 * Unit Tests for DataLakeService
 *
 * Tests the newly implemented Data Lake functionality including:
 * - CRUD operations
 * - Building data lakes from multiple sources
 * - Querying consolidated data
 * - Deduplication and filtering
 */

import { DataLakeService } from "../../lib/services/DataLakeService";
import { DataLake, DataLakeConfig } from "../../types/dataLake";

// Mock MongoDB
jest.mock("../../lib/server/database/MongoDatabase", () => ({
  MongoDatabase: {
    getInstance: jest.fn(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      getSnapshots: jest.fn(),
      getImportedData: jest.fn(),
    })),
  },
}));

// Mock client logger
jest.mock("../../lib/utils/ClientLogger", () => ({
  clientLogger: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("DataLakeService", () => {
  let service: DataLakeService;
  const mockProjectId = "test-project";

  beforeEach(() => {
    service = DataLakeService.getInstance();
    jest.clearAllMocks();
  });

  describe("CRUD Operations", () => {
    test("should create a data lake", async () => {
      const config: DataLakeConfig = {
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
      };

      const lake = await service.createDataLake({
        projectId: mockProjectId,
        name: "Test Lake",
        description: "A test data lake",
        config,
      });

      expect(lake).toBeDefined();
      expect(lake.name).toBe("Test Lake");
      expect(lake.projectId).toBe(mockProjectId);
      expect(lake.status).toBe("draft");
      expect(lake.config.dataSourceIds).toEqual(["source-1", "source-2"]);
    });

    test("should get data lakes by project", async () => {
      const config: DataLakeConfig = {
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
      };

      await service.createDataLake({
        projectId: mockProjectId,
        name: "Lake 1",
        config,
      });

      await service.createDataLake({
        projectId: mockProjectId,
        name: "Lake 2",
        config,
      });

      const lakes = await service.getDataLakes(mockProjectId);

      expect(lakes.length).toBeGreaterThanOrEqual(2);
      expect(lakes.every((l) => l.projectId === mockProjectId)).toBe(true);
    });

    test("should update a data lake", async () => {
      const config: DataLakeConfig = {
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
      };

      const lake = await service.createDataLake({
        projectId: mockProjectId,
        name: "Original Name",
        config,
      });

      const updated = await service.updateDataLake(lake.id, {
        name: "Updated Name",
        description: "New description",
      });

      expect(updated).toBeDefined();
      expect(updated!.name).toBe("Updated Name");
      expect(updated!.description).toBe("New description");
    });

    test("should delete a data lake", async () => {
      const config: DataLakeConfig = {
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
      };

      const lake = await service.createDataLake({
        projectId: mockProjectId,
        name: "To Delete",
        config,
      });

      const success = await service.deleteDataLake(lake.id);
      expect(success).toBe(true);

      const retrieved = await service.getDataLake(lake.id);
      expect(retrieved).toBeNull();
    });
  });

  describe("Build Operations", () => {
    test("should build data lake with deduplication", async () => {
      const config: DataLakeConfig = {
        dataSourceIds: ["source-1"],
        settings: {
          storageType: "sqlite",
          compression: true,
          partitioning: "none",
          deduplication: true,
          deduplicationKey: "id",
          dataValidation: true,
          schemaEvolution: "auto",
          indexing: false,
          caching: false,
          autoRefresh: false,
        },
      };

      const lake = await service.createDataLake({
        projectId: mockProjectId,
        name: "Dedup Lake",
        config,
      });

      // Mock MongoDB responses
      const {
        MongoDatabase,
      } = require("../../lib/server/database/MongoDatabase");
      const mockDb = MongoDatabase.getInstance();

      mockDb.getSnapshots.mockResolvedValue([{ id: "snap-1", version: 1 }]);

      mockDb.getImportedData.mockResolvedValue({
        data: [
          { data: { id: 1, name: "Alice" } },
          { data: { id: 2, name: "Bob" } },
          { data: { id: 1, name: "Alice Duplicate" } }, // Duplicate
        ],
      });

      const result = await service.buildDataLake(lake.id);

      expect(result.success).toBe(true);
      expect(result.status).toBe("ready");
      expect(result.recordsProcessed).toBe(3);
      expect(result.recordsDuplicated).toBe(1); // One duplicate removed
      expect(result.recordsStored).toBe(2); // Only 2 unique records
    });

    test("should handle build errors gracefully", async () => {
      const config: DataLakeConfig = {
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
      };

      const lake = await service.createDataLake({
        projectId: mockProjectId,
        name: "Error Lake",
        config,
      });

      // Mock MongoDB to return empty snapshots
      const {
        MongoDatabase,
      } = require("../../lib/server/database/MongoDatabase");
      const mockDb = MongoDatabase.getInstance();
      mockDb.getSnapshots.mockResolvedValue([]);

      const result = await service.buildDataLake(lake.id);

      expect(result.success).toBe(true); // Success even with no data
      expect(result.recordsStored).toBe(0);
    });

    test("should update lake status during build", async () => {
      const config: DataLakeConfig = {
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
      };

      const lake = await service.createDataLake({
        projectId: mockProjectId,
        name: "Status Lake",
        config,
      });

      expect(lake.status).toBe("draft");

      // Mock successful build
      const {
        MongoDatabase,
      } = require("../../lib/server/database/MongoDatabase");
      const mockDb = MongoDatabase.getInstance();
      mockDb.getSnapshots.mockResolvedValue([{ id: "snap-1", version: 1 }]);
      mockDb.getImportedData.mockResolvedValue({
        data: [{ data: { id: 1, name: "Test" } }],
      });

      await service.buildDataLake(lake.id);

      const updated = await service.getDataLake(lake.id);
      expect(updated!.status).toBe("ready");
    });
  });

  describe("Query Operations", () => {
    test("should query data lake with filters", async () => {
      const config: DataLakeConfig = {
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
      };

      const lake = await service.createDataLake({
        projectId: mockProjectId,
        name: "Query Lake",
        config,
      });

      // Build with mock data
      const {
        MongoDatabase,
      } = require("../../lib/server/database/MongoDatabase");
      const mockDb = MongoDatabase.getInstance();
      mockDb.getSnapshots.mockResolvedValue([{ id: "snap-1", version: 1 }]);
      mockDb.getImportedData.mockResolvedValue({
        data: [
          { data: { id: 1, name: "Alice", age: 30 } },
          { data: { id: 2, name: "Bob", age: 25 } },
          { data: { id: 3, name: "Charlie", age: 35 } },
        ],
      });

      await service.buildDataLake(lake.id);

      // Query with filter
      const result = await service.queryDataLake(lake.id, {
        filters: [{ field: "age", operator: "gt", value: 26 }],
      });

      expect(result.totalCount).toBe(2); // Alice and Charlie
      expect(result.rows.length).toBe(2);
    });

    test("should support pagination", async () => {
      const config: DataLakeConfig = {
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
      };

      const lake = await service.createDataLake({
        projectId: mockProjectId,
        name: "Pagination Lake",
        config,
      });

      // Build with mock data
      const {
        MongoDatabase,
      } = require("../../lib/server/database/MongoDatabase");
      const mockDb = MongoDatabase.getInstance();
      mockDb.getSnapshots.mockResolvedValue([{ id: "snap-1", version: 1 }]);

      const mockData = Array.from({ length: 50 }, (_, i) => ({
        data: { id: i + 1, name: `User ${i + 1}` },
      }));

      mockDb.getImportedData.mockResolvedValue({ data: mockData });

      await service.buildDataLake(lake.id);

      // Query first page
      const page1 = await service.queryDataLake(lake.id, {
        limit: 20,
        offset: 0,
      });

      expect(page1.rows.length).toBe(20);
      expect(page1.totalCount).toBe(50);
      expect(page1.hasMore).toBe(true);

      // Query second page
      const page2 = await service.queryDataLake(lake.id, {
        limit: 20,
        offset: 20,
      });

      expect(page2.rows.length).toBe(20);
      expect(page2.hasMore).toBe(true);

      // Query last page
      const page3 = await service.queryDataLake(lake.id, {
        limit: 20,
        offset: 40,
      });

      expect(page3.rows.length).toBe(10);
      expect(page3.hasMore).toBe(false);
    });

    test("should support sorting", async () => {
      const config: DataLakeConfig = {
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
      };

      const lake = await service.createDataLake({
        projectId: mockProjectId,
        name: "Sort Lake",
        config,
      });

      // Build with mock data
      const {
        MongoDatabase,
      } = require("../../lib/server/database/MongoDatabase");
      const mockDb = MongoDatabase.getInstance();
      mockDb.getSnapshots.mockResolvedValue([{ id: "snap-1", version: 1 }]);
      mockDb.getImportedData.mockResolvedValue({
        data: [
          { data: { id: 3, name: "Charlie" } },
          { data: { id: 1, name: "Alice" } },
          { data: { id: 2, name: "Bob" } },
        ],
      });

      await service.buildDataLake(lake.id);

      // Query with ascending sort
      const resultAsc = await service.queryDataLake(lake.id, {
        sort: { field: "id", direction: "asc" },
      });

      const firstIdAsc = resultAsc.rows[0][resultAsc.columns.indexOf("id")];
      expect(firstIdAsc).toBe(1);

      // Query with descending sort
      const resultDesc = await service.queryDataLake(lake.id, {
        sort: { field: "id", direction: "desc" },
      });

      const firstIdDesc = resultDesc.rows[0][resultDesc.columns.indexOf("id")];
      expect(firstIdDesc).toBe(3);
    });

    test("should throw error when querying non-ready lake", async () => {
      const config: DataLakeConfig = {
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
      };

      const lake = await service.createDataLake({
        projectId: mockProjectId,
        name: "Not Ready Lake",
        config,
      });

      // Try to query without building
      await expect(service.queryDataLake(lake.id)).rejects.toThrow("not ready");
    });
  });

  describe("Data Processing", () => {
    test("should deduplicate based on custom key", async () => {
      const config: DataLakeConfig = {
        dataSourceIds: ["source-1"],
        settings: {
          storageType: "sqlite",
          compression: true,
          partitioning: "none",
          deduplication: true,
          deduplicationKey: "email",
          dataValidation: true,
          schemaEvolution: "auto",
          indexing: false,
          caching: false,
          autoRefresh: false,
        },
      };

      const lake = await service.createDataLake({
        projectId: mockProjectId,
        name: "Email Dedup Lake",
        config,
      });

      // Mock data with duplicate emails
      const {
        MongoDatabase,
      } = require("../../lib/server/database/MongoDatabase");
      const mockDb = MongoDatabase.getInstance();
      mockDb.getSnapshots.mockResolvedValue([{ id: "snap-1", version: 1 }]);
      mockDb.getImportedData.mockResolvedValue({
        data: [
          { data: { id: 1, email: "alice@test.com", name: "Alice" } },
          { data: { id: 2, email: "bob@test.com", name: "Bob" } },
          { data: { id: 3, email: "alice@test.com", name: "Alice Smith" } }, // Duplicate email
        ],
      });

      const result = await service.buildDataLake(lake.id);

      expect(result.recordsDuplicated).toBe(1);
      expect(result.recordsStored).toBe(2);
    });

    test("should consolidate data from multiple sources", async () => {
      const config: DataLakeConfig = {
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
      };

      const lake = await service.createDataLake({
        projectId: mockProjectId,
        name: "Multi Source Lake",
        config,
      });

      // Mock data from 3 sources
      const {
        MongoDatabase,
      } = require("../../lib/server/database/MongoDatabase");
      const mockDb = MongoDatabase.getInstance();

      mockDb.getSnapshots.mockImplementation((sourceId: string) => {
        return Promise.resolve([{ id: `snap-${sourceId}`, version: 1 }]);
      });

      mockDb.getImportedData.mockImplementation(({ dataSourceId }: any) => {
        return Promise.resolve({
          data: [
            { data: { id: `${dataSourceId}-1`, source: dataSourceId } },
            { data: { id: `${dataSourceId}-2`, source: dataSourceId } },
          ],
        });
      });

      const result = await service.buildDataLake(lake.id);

      expect(result.success).toBe(true);
      expect(result.recordsStored).toBe(6); // 2 records per source * 3 sources
      expect(result.metadata.sources.length).toBe(3);
    });
  });
});
