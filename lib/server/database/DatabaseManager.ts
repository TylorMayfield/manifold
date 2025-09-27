import { CoreDatabase } from "./CoreDatabase";
import { ProjectDatabase } from "./ProjectDatabase";
import { logger } from "../utils/logger";

export class DatabaseManager {
  private static instance: DatabaseManager;
  private coreDb: CoreDatabase;
  private projectDbs: Map<string, ProjectDatabase> = new Map();

  private constructor() {
    this.coreDb = CoreDatabase.getInstance();
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.coreDb.initialize();
      logger.success(
        "Database manager initialized",
        "database",
        {},
        "DatabaseManager"
      );
    } catch (error) {
      logger.error(
        "Failed to initialize database manager",
        "database",
        { error },
        "DatabaseManager"
      );
      throw error;
    }
  }

  async close(): Promise<void> {
    // Close all project databases
    for (const [projectId, projectDb] of this.projectDbs) {
      try {
        await projectDb.close();
      } catch (error) {
        logger.error(
          "Failed to close project database",
          "database",
          { projectId, error },
          "DatabaseManager"
        );
      }
    }
    this.projectDbs.clear();

    // Close core database
    await this.coreDb.close();
  }

  // Core database operations
  getCoreDatabase(): CoreDatabase {
    return this.coreDb;
  }

  // Project database operations
  async getProjectDatabase(projectId: string): Promise<ProjectDatabase> {
    if (this.projectDbs.has(projectId)) {
      return this.projectDbs.get(projectId)!;
    }

    // Get project info from core database
    const project = await this.coreDb.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Create project database instance
    const projectDb = ProjectDatabase.getInstance(projectId, project.dataPath);
    await projectDb.initialize();

    this.projectDbs.set(projectId, projectDb);
    return projectDb;
  }

  async closeProjectDatabase(projectId: string): Promise<void> {
    const projectDb = this.projectDbs.get(projectId);
    if (projectDb) {
      await projectDb.close();
      this.projectDbs.delete(projectId);
    }
  }

  // Project management
  async createProject(projectData: { name: string; description?: string }) {
    const project = await this.coreDb.createProject(projectData);

    // Initialize project database
    const projectDb = await this.getProjectDatabase(project.id);

    logger.success(
      "Project created",
      "database",
      { projectId: project.id, name: project.name },
      "DatabaseManager"
    );
    return project;
  }

  async getProjects() {
    return await this.coreDb.getProjects();
  }

  async getProject(id: string) {
    return await this.coreDb.getProject(id);
  }

  async updateProject(
    id: string,
    data: {
      name?: string;
      description?: string;
    }
  ) {
    return await this.coreDb.updateProject(id, data);
  }

  async deleteProject(id: string) {
    // Close project database if open
    await this.closeProjectDatabase(id);

    // Delete from core database (this will also delete the project database file)
    const result = await this.coreDb.deleteProject(id);

    logger.success(
      "Project deleted",
      "database",
      { projectId: id },
      "DatabaseManager"
    );
    return result;
  }

  // Data source management
  async createDataSource(
    projectId: string,
    dataSourceData: {
      name: string;
      type: string;
      config: any;
    }
  ) {
    // Create in core database for indexing
    const coreDataSource = await this.coreDb.createDataSource(
      projectId,
      dataSourceData
    );

    // Create in project database for data storage
    const projectDb = await this.getProjectDatabase(projectId);
    const projectDataSource = await projectDb.createDataSource(dataSourceData);

    logger.success(
      "Data source created",
      "database",
      {
        projectId,
        dataSourceId: coreDataSource.id,
        name: dataSourceData.name,
      },
      "DatabaseManager"
    );

    return coreDataSource;
  }

  async getDataSources(projectId: string) {
    return await this.coreDb.getDataSources(projectId);
  }

  async getDataSource(projectId: string, dataSourceId: string) {
    const projectDb = await this.getProjectDatabase(projectId);
    return await projectDb.getDataSource(dataSourceId);
  }

  async updateDataSource(
    projectId: string,
    dataSourceId: string,
    data: {
      name?: string;
      type?: string;
      config?: any;
      status?: string;
    }
  ) {
    // Update in core database
    await this.coreDb.updateDataSource(dataSourceId, data);

    // Update in project database
    const projectDb = await this.getProjectDatabase(projectId);
    await projectDb.updateDataSource(dataSourceId, data);

    return true;
  }

  async deleteDataSource(projectId: string, dataSourceId: string) {
    // Delete from core database
    await this.coreDb.deleteDataSource(dataSourceId);

    // Delete from project database
    const projectDb = await this.getProjectDatabase(projectId);
    await projectDb.deleteDataSource(dataSourceId);

    return true;
  }

  // Snapshot management
  async createSnapshot(
    projectId: string,
    snapshotData: {
      dataSourceId: string;
      data: any;
      metadata?: any;
      recordCount?: number;
    }
  ) {
    const projectDb = await this.getProjectDatabase(projectId);
    return await projectDb.createSnapshot(snapshotData);
  }

  async getSnapshots(projectId: string, dataSourceId?: string) {
    const projectDb = await this.getProjectDatabase(projectId);
    return await projectDb.getSnapshots(dataSourceId);
  }

  async getLatestSnapshot(projectId: string, dataSourceId: string) {
    const projectDb = await this.getProjectDatabase(projectId);
    return await projectDb.getLatestSnapshot(dataSourceId);
  }

  async deleteSnapshot(projectId: string, snapshotId: string) {
    const projectDb = await this.getProjectDatabase(projectId);
    return await projectDb.deleteSnapshot(snapshotId);
  }

  // Relationship management
  async createRelationship(
    projectId: string,
    relationshipData: {
      sourceId: string;
      targetId: string;
      relationshipType: string;
      metadata?: any;
    }
  ) {
    const projectDb = await this.getProjectDatabase(projectId);
    return await projectDb.createRelationship(relationshipData);
  }

  async getRelationships(projectId: string) {
    const projectDb = await this.getProjectDatabase(projectId);
    return await projectDb.getRelationships();
  }

  async deleteRelationship(projectId: string, relationshipId: string) {
    const projectDb = await this.getProjectDatabase(projectId);
    return await projectDb.deleteRelationship(relationshipId);
  }

  // Consolidated model management
  async createConsolidatedModel(
    projectId: string,
    modelData: {
      name: string;
      modelData: any;
      metadata?: any;
    }
  ) {
    const projectDb = await this.getProjectDatabase(projectId);
    return await projectDb.createConsolidatedModel(modelData);
  }

  async getConsolidatedModels(projectId: string) {
    const projectDb = await this.getProjectDatabase(projectId);
    return await projectDb.getConsolidatedModels();
  }

  async updateConsolidatedModel(
    projectId: string,
    modelId: string,
    data: {
      name?: string;
      modelData?: any;
      metadata?: any;
    }
  ) {
    const projectDb = await this.getProjectDatabase(projectId);
    return await projectDb.updateConsolidatedModel(modelId, data);
  }

  async deleteConsolidatedModel(projectId: string, modelId: string) {
    const projectDb = await this.getProjectDatabase(projectId);
    return await projectDb.deleteConsolidatedModel(modelId);
  }

  // Backup management
  async createBackup(
    projectId: string,
    backupData: {
      type: string;
      description?: string;
      filePath?: string;
      size?: number;
      dataSourceCount?: number;
      snapshotCount?: number;
      totalRecords?: number;
    }
  ) {
    return await this.coreDb.createBackup(projectId, backupData);
  }

  async getBackups(projectId: string) {
    return await this.coreDb.getBackups(projectId);
  }

  async updateBackup(
    backupId: string,
    data: {
      status?: string;
      filePath?: string;
      size?: number;
      error?: string;
    }
  ) {
    return await this.coreDb.updateBackup(backupId, data);
  }

  async deleteBackup(backupId: string) {
    return await this.coreDb.deleteBackup(backupId);
  }

  // Job management
  async createJob(jobData: {
    projectId?: string;
    type: string;
    description?: string;
    config?: any;
  }) {
    return await this.coreDb.createJob(jobData);
  }

  async getJobs(projectId?: string) {
    return await this.coreDb.getJobs(projectId);
  }

  async updateJob(
    jobId: string,
    data: {
      status?: string;
      progress?: number;
      result?: any;
      error?: string;
    }
  ) {
    return await this.coreDb.updateJob(jobId, data);
  }

  async deleteJob(jobId: string) {
    return await this.coreDb.deleteJob(jobId);
  }

  // Import history management
  async createImportHistory(
    projectId: string,
    importData: {
      dataSourceId: string;
      fileName?: string;
      recordCount?: number;
      status?: string;
      error?: string;
    }
  ) {
    const projectDb = await this.getProjectDatabase(projectId);
    return await projectDb.createImportHistory(importData);
  }

  async getImportHistory(projectId: string, dataSourceId?: string) {
    const projectDb = await this.getProjectDatabase(projectId);
    return await projectDb.getImportHistory(dataSourceId);
  }

  async updateImportHistory(
    projectId: string,
    importId: string,
    data: {
      status?: string;
      recordCount?: number;
      error?: string;
    }
  ) {
    const projectDb = await this.getProjectDatabase(projectId);
    return await projectDb.updateImportHistory(importId, data);
  }

  // Utility methods
  async getProjectStats(projectId: string) {
    const projectDb = await this.getProjectDatabase(projectId);
    return await projectDb.getDatabaseStats();
  }

  async exportProjectToCSV(
    projectId: string,
    tableName: string,
    filePath: string
  ) {
    const projectDb = await this.getProjectDatabase(projectId);
    return await projectDb.exportToCSV(tableName, filePath);
  }

  async exportProjectToSQLite(projectId: string, filePath: string) {
    const projectDb = await this.getProjectDatabase(projectId);
    return await projectDb.exportToSQLite(filePath);
  }
}
