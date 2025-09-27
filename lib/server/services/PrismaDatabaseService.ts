import { DatabaseManager } from "../database/DatabaseManager";
import {
  Project,
  DataSource,
  ConsolidatedModel,
  Snapshot,
  DataProviderType,
} from "../../../types";
import { logger } from "../utils/logger";

export class PrismaDatabaseService {
  private static instance: PrismaDatabaseService;
  private dbManager: DatabaseManager;

  private constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  static getInstance(): PrismaDatabaseService {
    if (!PrismaDatabaseService.instance) {
      PrismaDatabaseService.instance = new PrismaDatabaseService();
    }
    return PrismaDatabaseService.instance;
  }

  async initialize(): Promise<void> {
    await this.dbManager.initialize();
  }

  async close(): Promise<void> {
    await this.dbManager.close();
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    try {
      const projects = await this.dbManager.getProjects();
      return projects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description || "",
        dataPath: project.dataPath || "",
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }));
    } catch (error) {
      logger.error(
        "Failed to get projects",
        "database",
        { error },
        "PrismaDatabaseService"
      );
      return [];
    }
  }

  async getProject(id: string): Promise<Project | null> {
    try {
      const project = await this.dbManager.getProject(id);
      if (!project) return null;

      return {
        id: project.id,
        name: project.name,
        description: project.description || "",
        dataPath: project.dataPath || "",
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    } catch (error) {
      logger.error(
        "Failed to get project",
        "database",
        { error, projectId: id },
        "PrismaDatabaseService"
      );
      return null;
    }
  }

  async createProject(project: Project): Promise<void> {
    try {
      await this.dbManager.createProject({
        name: project.name,
        description: project.description,
      });
      logger.success(
        "Project created",
        "database",
        { projectId: project.id, name: project.name },
        "PrismaDatabaseService"
      );
    } catch (error) {
      logger.error(
        "Failed to create project",
        "database",
        { error, project },
        "PrismaDatabaseService"
      );
      throw error;
    }
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    try {
      await this.dbManager.updateProject(id, {
        name: updates.name,
        description: updates.description,
      });
      logger.success(
        "Project updated",
        "database",
        { projectId: id, updates },
        "PrismaDatabaseService"
      );
    } catch (error) {
      logger.error(
        "Failed to update project",
        "database",
        { error, projectId: id, updates },
        "PrismaDatabaseService"
      );
      throw error;
    }
  }

  async updateProjectObject(project: Project): Promise<void> {
    try {
      await this.dbManager.updateProject(project.id, {
        name: project.name,
        description: project.description,
      });
      logger.success(
        "Project object updated",
        "database",
        { projectId: project.id },
        "PrismaDatabaseService"
      );
    } catch (error) {
      logger.error(
        "Failed to update project object",
        "database",
        { error, project },
        "PrismaDatabaseService"
      );
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      await this.dbManager.deleteProject(id);
      logger.success(
        "Project deleted",
        "database",
        { projectId: id },
        "PrismaDatabaseService"
      );
    } catch (error) {
      logger.error(
        "Failed to delete project",
        "database",
        { error, projectId: id },
        "PrismaDatabaseService"
      );
      throw error;
    }
  }

  // Data source operations
  async getDataSources(projectId: string): Promise<DataSource[]> {
    try {
      const dataSources = await this.dbManager.getDataSources(projectId);
      return dataSources.map((ds) => ({
        id: ds.id,
        projectId: ds.projectId,
        name: ds.name,
        type: ds.type as DataProviderType,
        config: JSON.parse(ds.config),
        status: ds.status as
          | "error"
          | "idle"
          | "running"
          | "completed"
          | undefined,
        createdAt: ds.createdAt,
        updatedAt: ds.updatedAt,
        lastSyncAt: ds.lastSyncAt || undefined,
      }));
    } catch (error) {
      logger.error(
        "Failed to get data sources",
        "database",
        { error, projectId },
        "PrismaDatabaseService"
      );
      return [];
    }
  }

  async getDataSource(dataSourceId: string): Promise<DataSource | null> {
    try {
      // We need to find which project this data source belongs to
      const projects = await this.dbManager.getProjects();
      for (const project of projects) {
        const dataSources = await this.dbManager.getDataSources(project.id);
        const dataSource = dataSources.find((ds) => ds.id === dataSourceId);
        if (dataSource) {
          return {
            id: dataSource.id,
            projectId: dataSource.projectId,
            name: dataSource.name,
            type: dataSource.type as DataProviderType,
            config: JSON.parse(dataSource.config),
            status: dataSource.status as
              | "error"
              | "idle"
              | "running"
              | "completed"
              | undefined,
            createdAt: dataSource.createdAt,
            updatedAt: dataSource.updatedAt,
            lastSyncAt: dataSource.lastSyncAt || undefined,
          };
        }
      }
      return null;
    } catch (error) {
      logger.error(
        "Failed to get data source",
        "database",
        { error, dataSourceId },
        "PrismaDatabaseService"
      );
      return null;
    }
  }

  async createDataSource(dataSource: DataSource): Promise<void> {
    try {
      await this.dbManager.createDataSource(dataSource.projectId, {
        name: dataSource.name,
        type: dataSource.type,
        config: dataSource.config,
      });
      logger.success(
        "Data source created",
        "database",
        { dataSourceId: dataSource.id, projectId: dataSource.projectId },
        "PrismaDatabaseService"
      );
    } catch (error) {
      logger.error(
        "Failed to create data source",
        "database",
        { error, dataSource },
        "PrismaDatabaseService"
      );
      throw error;
    }
  }

  async updateDataSource(
    id: string,
    updates: Partial<DataSource>
  ): Promise<void> {
    try {
      // Find the project ID for this data source
      const dataSource = await this.getDataSource(id);
      if (!dataSource) {
        throw new Error(`Data source ${id} not found`);
      }

      await this.dbManager.updateDataSource(dataSource.projectId, id, {
        name: updates.name,
        type: updates.type,
        config: updates.config,
        status: updates.status,
      });
      logger.success(
        "Data source updated",
        "database",
        { dataSourceId: id, updates },
        "PrismaDatabaseService"
      );
    } catch (error) {
      logger.error(
        "Failed to update data source",
        "database",
        { error, dataSourceId: id, updates },
        "PrismaDatabaseService"
      );
      throw error;
    }
  }

  async deleteDataSource(id: string, projectId: string): Promise<void> {
    try {
      await this.dbManager.deleteDataSource(projectId, id);
      logger.success(
        "Data source deleted",
        "database",
        { dataSourceId: id, projectId },
        "PrismaDatabaseService"
      );
    } catch (error) {
      logger.error(
        "Failed to delete data source",
        "database",
        { error, dataSourceId: id, projectId },
        "PrismaDatabaseService"
      );
      throw error;
    }
  }

  // Consolidated model operations
  async getConsolidatedModels(projectId: string): Promise<ConsolidatedModel[]> {
    try {
      const models = await this.dbManager.getConsolidatedModels(projectId);
      return models.map((model) => ({
        id: model.id,
        projectId: projectId,
        name: model.name,
        modelData: JSON.parse(model.modelData),
        metadata: model.metadata ? JSON.parse(model.metadata) : undefined,
        dataSourceIds: [],
        relationshipIds: [],
        recordCount: 0,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      }));
    } catch (error) {
      logger.error(
        "Failed to get consolidated models",
        "database",
        { error, projectId },
        "PrismaDatabaseService"
      );
      return [];
    }
  }

  async createConsolidatedModel(model: ConsolidatedModel): Promise<void> {
    try {
      await this.dbManager.createConsolidatedModel(model.projectId, {
        name: model.name,
        modelData: model.modelData,
        metadata: model.metadata,
      });
      logger.success(
        "Consolidated model created",
        "database",
        { modelId: model.id, projectId: model.projectId },
        "PrismaDatabaseService"
      );
    } catch (error) {
      logger.error(
        "Failed to create consolidated model",
        "database",
        { error, model },
        "PrismaDatabaseService"
      );
      throw error;
    }
  }

  async updateConsolidatedModel(
    id: string,
    updates: Partial<ConsolidatedModel>
  ): Promise<void> {
    try {
      // Find the project ID for this model
      const projects = await this.dbManager.getProjects();
      for (const project of projects) {
        const models = await this.dbManager.getConsolidatedModels(project.id);
        const model = models.find((m) => m.id === id);
        if (model) {
          await this.dbManager.updateConsolidatedModel(project.id, id, {
            name: updates.name,
            modelData: updates.modelData,
            metadata: updates.metadata,
          });
          logger.success(
            "Consolidated model updated",
            "database",
            { modelId: id, updates },
            "PrismaDatabaseService"
          );
          return;
        }
      }
      throw new Error(`Consolidated model ${id} not found`);
    } catch (error) {
      logger.error(
        "Failed to update consolidated model",
        "database",
        { error, modelId: id, updates },
        "PrismaDatabaseService"
      );
      throw error;
    }
  }

  async deleteConsolidatedModel(id: string, projectId: string): Promise<void> {
    try {
      await this.dbManager.deleteConsolidatedModel(projectId, id);
      logger.success(
        "Consolidated model deleted",
        "database",
        { modelId: id, projectId },
        "PrismaDatabaseService"
      );
    } catch (error) {
      logger.error(
        "Failed to delete consolidated model",
        "database",
        { error, modelId: id, projectId },
        "PrismaDatabaseService"
      );
      throw error;
    }
  }

  // Snapshot operations
  async getSnapshots(projectId: string): Promise<Snapshot[]> {
    try {
      const snapshots = await this.dbManager.getSnapshots(projectId);
      return snapshots.map((snapshot) => ({
        id: snapshot.id,
        dataSourceId: snapshot.dataSourceId,
        projectId: projectId,
        data: JSON.parse(snapshot.data),
        metadata: snapshot.metadata ? JSON.parse(snapshot.metadata) : undefined,
        recordCount: snapshot.recordCount,
        createdAt: snapshot.createdAt,
      }));
    } catch (error) {
      logger.error(
        "Failed to get snapshots",
        "database",
        { error, projectId },
        "PrismaDatabaseService"
      );
      return [];
    }
  }

  async createSnapshot(snapshot: Snapshot): Promise<void> {
    try {
      if (!snapshot.projectId) {
        throw new Error("Project ID is required for snapshot creation");
      }
      await this.dbManager.createSnapshot(snapshot.projectId, {
        dataSourceId: snapshot.dataSourceId,
        data: snapshot.data,
        metadata: snapshot.metadata,
        recordCount: snapshot.recordCount,
      });
      logger.success(
        "Snapshot created",
        "database",
        { snapshotId: snapshot.id, projectId: snapshot.projectId },
        "PrismaDatabaseService"
      );
    } catch (error) {
      logger.error(
        "Failed to create snapshot",
        "database",
        { error, snapshot },
        "PrismaDatabaseService"
      );
      throw error;
    }
  }

  async getLatestSnapshot(
    dataSourceId: string,
    projectId: string
  ): Promise<Snapshot | null> {
    try {
      const snapshot = await this.dbManager.getLatestSnapshot(
        projectId,
        dataSourceId
      );
      if (!snapshot) return null;

      return {
        id: snapshot.id,
        dataSourceId: snapshot.dataSourceId,
        projectId: projectId,
        data: JSON.parse(snapshot.data),
        metadata: snapshot.metadata ? JSON.parse(snapshot.metadata) : undefined,
        recordCount: snapshot.recordCount,
        createdAt: snapshot.createdAt,
      };
    } catch (error) {
      logger.error(
        "Failed to get latest snapshot",
        "database",
        { error, dataSourceId, projectId },
        "PrismaDatabaseService"
      );
      return null;
    }
  }

  async deleteSnapshot(id: string, projectId: string): Promise<void> {
    try {
      await this.dbManager.deleteSnapshot(projectId, id);
      logger.success(
        "Snapshot deleted",
        "database",
        { snapshotId: id, projectId },
        "PrismaDatabaseService"
      );
    } catch (error) {
      logger.error(
        "Failed to delete snapshot",
        "database",
        { error, snapshotId: id, projectId },
        "PrismaDatabaseService"
      );
      throw error;
    }
  }

  // Generic SQL execution (for compatibility)
  async execute(sql: string, params?: any[]): Promise<any> {
    // This would need to be implemented based on specific needs
    // For now, we'll log a warning
    logger.warn(
      "Generic SQL execution not implemented in Prisma service",
      "database",
      { sql },
      "PrismaDatabaseService"
    );
    return { success: true };
  }

  async query(sql: string, params?: any[]): Promise<any[]> {
    // This would need to be implemented based on specific needs
    // For now, we'll log a warning
    logger.warn(
      "Generic SQL query not implemented in Prisma service",
      "database",
      { sql },
      "PrismaDatabaseService"
    );
    return [];
  }
}
