import { PrismaClient as ProjectPrismaClient } from "../database/generated/project-client";
import path from "path";
import fs from "fs";

export class ProjectDatabase {
  private static instances: Map<string, ProjectDatabase> = new Map();
  private prisma: ProjectPrismaClient;
  private projectId: string;
  private dbPath: string;

  private constructor(projectId: string, dbPath: string) {
    this.projectId = projectId;
    this.dbPath = dbPath;

    // Initialize Prisma client for project database
    this.prisma = new ProjectPrismaClient({
      datasources: {
        db: {
          url: `file:${dbPath}`,
        },
      },
    });
  }

  static getInstance(projectId: string, dbPath: string): ProjectDatabase {
    if (!ProjectDatabase.instances.has(projectId)) {
      ProjectDatabase.instances.set(
        projectId,
        new ProjectDatabase(projectId, dbPath)
      );
    }
    return ProjectDatabase.instances.get(projectId)!;
  }

  get client(): ProjectPrismaClient {
    return this.prisma;
  }

  getProjectId(): string {
    return this.projectId;
  }

  getDbPath(): string {
    return this.dbPath;
  }

  async initialize(): Promise<void> {
    try {
      // Ensure database file exists
      if (!fs.existsSync(this.dbPath)) {
        // Create directory if it doesn't exist
        const dbDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }
      }

      // Test connection
      await this.prisma.$connect();
      console.log(`Project database initialized for project ${this.projectId}`);
    } catch (error) {
      console.error(
        `Failed to initialize project database for ${this.projectId}:`,
        error
      );
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
    ProjectDatabase.instances.delete(this.projectId);
  }

  // Data source management
  async createDataSource(dataSourceData: {
    name: string;
    type: string;
    config: any;
  }) {
    return await this.prisma.dataSource.create({
      data: {
        name: dataSourceData.name,
        type: dataSourceData.type,
        config: JSON.stringify(dataSourceData.config),
      },
    });
  }

  async getDataSources() {
    return await this.prisma.dataSource.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getDataSource(id: string) {
    return await this.prisma.dataSource.findUnique({
      where: { id },
      include: {
        snapshots: true,
        relationships: true,
        targetRelationships: true,
      },
    });
  }

  async updateDataSource(
    id: string,
    data: {
      name?: string;
      type?: string;
      config?: any;
      status?: string;
    }
  ) {
    const updateData: any = { ...data };
    if (data.config) {
      updateData.config = JSON.stringify(data.config);
    }
    updateData.updatedAt = new Date();

    return await this.prisma.dataSource.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteDataSource(id: string) {
    return await this.prisma.dataSource.delete({
      where: { id },
    });
  }

  // Snapshot management
  async createSnapshot(snapshotData: {
    dataSourceId: string;
    data: any;
    metadata?: any;
    recordCount?: number;
  }) {
    return await this.prisma.snapshot.create({
      data: {
        dataSourceId: snapshotData.dataSourceId,
        data: JSON.stringify(snapshotData.data),
        metadata: snapshotData.metadata
          ? JSON.stringify(snapshotData.metadata)
          : null,
        recordCount: snapshotData.recordCount || 0,
      },
    });
  }

  async getSnapshots(dataSourceId?: string) {
    return await this.prisma.snapshot.findMany({
      where: dataSourceId ? { dataSourceId } : {},
      orderBy: { createdAt: "desc" },
      include: {
        dataSource: true,
      },
    });
  }

  async getLatestSnapshot(dataSourceId: string) {
    return await this.prisma.snapshot.findFirst({
      where: { dataSourceId },
      orderBy: { createdAt: "desc" },
      include: {
        dataSource: true,
      },
    });
  }

  async deleteSnapshot(id: string) {
    return await this.prisma.snapshot.delete({
      where: { id },
    });
  }

  // Relationship management
  async createRelationship(relationshipData: {
    sourceId: string;
    targetId: string;
    relationshipType: string;
    metadata?: any;
  }) {
    return await this.prisma.relationship.create({
      data: {
        sourceId: relationshipData.sourceId,
        targetId: relationshipData.targetId,
        relationshipType: relationshipData.relationshipType,
        metadata: relationshipData.metadata
          ? JSON.stringify(relationshipData.metadata)
          : null,
      },
    });
  }

  async getRelationships() {
    return await this.prisma.relationship.findMany({
      include: {
        source: true,
        target: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async deleteRelationship(id: string) {
    return await this.prisma.relationship.delete({
      where: { id },
    });
  }

  // Consolidated model management
  async createConsolidatedModel(modelData: {
    name: string;
    modelData: any;
    metadata?: any;
  }) {
    return await this.prisma.consolidatedModel.create({
      data: {
        name: modelData.name,
        modelData: JSON.stringify(modelData.modelData),
        metadata: modelData.metadata
          ? JSON.stringify(modelData.metadata)
          : null,
      },
    });
  }

  async getConsolidatedModels() {
    return await this.prisma.consolidatedModel.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async updateConsolidatedModel(
    id: string,
    data: {
      name?: string;
      modelData?: any;
      metadata?: any;
    }
  ) {
    const updateData: any = { ...data };
    if (data.modelData) {
      updateData.modelData = JSON.stringify(data.modelData);
    }
    if (data.metadata) {
      updateData.metadata = JSON.stringify(data.metadata);
    }
    updateData.updatedAt = new Date();

    return await this.prisma.consolidatedModel.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteConsolidatedModel(id: string) {
    return await this.prisma.consolidatedModel.delete({
      where: { id },
    });
  }

  // Import history management
  async createImportHistory(importData: {
    dataSourceId: string;
    fileName?: string;
    recordCount?: number;
    status?: string;
    error?: string;
  }) {
    return await this.prisma.importHistory.create({
      data: {
        dataSourceId: importData.dataSourceId,
        fileName: importData.fileName,
        recordCount: importData.recordCount || 0,
        status: importData.status || "pending",
        error: importData.error,
      },
    });
  }

  async getImportHistory(dataSourceId?: string) {
    return await this.prisma.importHistory.findMany({
      where: dataSourceId ? { dataSourceId } : {},
      orderBy: { createdAt: "desc" },
    });
  }

  async updateImportHistory(
    id: string,
    data: {
      status?: string;
      recordCount?: number;
      error?: string;
    }
  ) {
    const updateData: any = { ...data };
    if (data.status === "completed") {
      updateData.completedAt = new Date();
    }

    return await this.prisma.importHistory.update({
      where: { id },
      data: updateData,
    });
  }

  // Utility methods
  async getDatabaseStats() {
    const [dataSourceCount, snapshotCount, relationshipCount, modelCount] =
      await Promise.all([
        this.prisma.dataSource.count(),
        this.prisma.snapshot.count(),
        this.prisma.relationship.count(),
        this.prisma.consolidatedModel.count(),
      ]);

    const totalRecords = await this.prisma.snapshot.aggregate({
      _sum: {
        recordCount: true,
      },
    });

    return {
      dataSourceCount,
      snapshotCount,
      relationshipCount,
      modelCount,
      totalRecords: totalRecords._sum.recordCount || 0,
    };
  }

  async exportToCSV(tableName: string, filePath: string): Promise<void> {
    // This would be implemented to export specific tables to CSV
    // For now, we'll create a placeholder
    throw new Error("CSV export not yet implemented");
  }

  async exportToSQLite(filePath: string): Promise<void> {
    // This would be implemented to export the entire project database
    // For now, we'll create a placeholder
    throw new Error("SQLite export not yet implemented");
  }
}
