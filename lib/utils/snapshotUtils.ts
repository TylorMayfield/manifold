import { Snapshot, DataSource } from "../../types";
import { clientDatabaseService } from "../database/ClientDatabaseService";
import { clientLogger } from "./ClientLogger";

export class SnapshotUtils {
  private static dbService = clientDatabaseService;

  static async createSnapshotFromDataSource(
    dataSource: DataSource,
    data: any[],
    projectId: string
  ): Promise<Snapshot> {
    try {
      const snapshot: Snapshot = {
        id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId,
        dataSourceId: dataSource.id,
        data,
        schema: dataSource.config.mockConfig?.schema,
        metadata: {
          dataSourceName: dataSource.name,
          dataSourceType: dataSource.type,
          recordCount: Array.isArray(data) ? data.length : 0,
          columns:
            Array.isArray(data) && data.length > 0
              ? Object.keys(data[0]).length
              : 0,
          importTimestamp: new Date().toISOString(),
          config: dataSource.config,
        },
        createdAt: new Date(),
        recordCount: Array.isArray(data) ? data.length : 0,
      };

      await this.dbService.createSnapshot(projectId, snapshot);

      clientLogger.info(
        "Snapshot created successfully",
        "data-processing",
        {
          snapshotId: snapshot.id,
          dataSourceId: dataSource.id,
          recordCount: snapshot.recordCount,
          projectId,
        },
        "SnapshotUtils"
      );

      return snapshot;
    } catch (error) {
      clientLogger.error(
        "Failed to create snapshot",
        "data-processing",
        {
          error,
          dataSourceId: dataSource.id,
          recordCount: Array.isArray(data) ? data.length : 0,
          projectId,
        },
        "SnapshotUtils"
      );
      throw error;
    }
  }

  static async createSnapshotFromMockData(
    dataSource: DataSource,
    projectId: string
  ): Promise<Snapshot> {
    try {
      console.log("SnapshotUtils: Creating snapshot from mock data", {
        dataSourceId: dataSource.id,
        projectId,
        mockConfig: dataSource.config.mockConfig,
      });

      // Generate mock data based on the data source configuration
      const mockConfig = dataSource.config.mockConfig;
      if (!mockConfig) {
        throw new Error("No mock configuration found");
      }

      const data = this.generateMockData(
        mockConfig.recordCount,
        mockConfig.schema
      );

      console.log("SnapshotUtils: Generated mock data", {
        recordCount: data.length,
        sampleRecord: data[0],
      });

      return await this.createSnapshotFromDataSource(
        dataSource,
        data,
        projectId
      );
    } catch (error) {
      clientLogger.error(
        "Failed to create snapshot from mock data",
        "data-processing",
        {
          error,
          dataSourceId: dataSource.id,
          projectId,
        },
        "SnapshotUtils"
      );
      throw error;
    }
  }

  private static generateMockData(recordCount: number, schema: any): any[] {
    const data: any[] = [];
    const columns = schema?.columns || [];

    for (let i = 0; i < recordCount; i++) {
      const record: any = {};

      columns.forEach((column: any) => {
        switch (column.type.toLowerCase()) {
          case "string":
          case "varchar":
          case "text":
            record[column.name] = `Sample ${column.name} ${i + 1}`;
            break;
          case "integer":
          case "int":
          case "number":
            record[column.name] = Math.floor(Math.random() * 1000) + i;
            break;
          case "float":
          case "double":
          case "decimal":
            record[column.name] = parseFloat((Math.random() * 100).toFixed(2));
            break;
          case "boolean":
            record[column.name] = Math.random() > 0.5;
            break;
          case "date":
            record[column.name] = new Date(
              Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
            )
              .toISOString()
              .split("T")[0];
            break;
          case "datetime":
          case "timestamp":
            record[column.name] = new Date(
              Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
            ).toISOString();
            break;
          default:
            record[column.name] = `Value ${i + 1}`;
        }
      });

      data.push(record);
    }

    return data;
  }

  static async getImportHistory(projectId: string): Promise<Snapshot[]> {
    try {
      return await this.dbService.getSnapshots(projectId);
    } catch (error) {
      clientLogger.error(
        "Failed to get import history",
        "data-processing",
        { error, projectId },
        "SnapshotUtils"
      );
      return [];
    }
  }

  static async getLatestSnapshot(
    dataSourceId: string,
    projectId: string
  ): Promise<Snapshot | null> {
    try {
      const snapshots = await this.dbService.getSnapshots(projectId);
      const latestSnapshot = snapshots
        .filter((s: any) => s.dataSourceId === dataSourceId)
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
      return latestSnapshot || null;
    } catch (error) {
      clientLogger.error(
        "Failed to get latest snapshot",
        "data-processing",
        { error, dataSourceId, projectId },
        "SnapshotUtils"
      );
      return null;
    }
  }
}
