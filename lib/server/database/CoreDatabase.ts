import { PrismaClient } from "@prisma/client";
import { app } from "electron";
import path from "path";
import fs from "fs";

export class CoreDatabase {
  private static instance: CoreDatabase;
  private prisma: PrismaClient;
  private dbPath: string;

  private constructor() {
    // Get app data path
    const appDataPath = app.getPath("userData");
    this.dbPath = path.join(appDataPath, "core.db");

    // Ensure directory exists
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Initialize Prisma client
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${this.dbPath}`,
        },
      },
    });
  }

  static getInstance(): CoreDatabase {
    if (!CoreDatabase.instance) {
      CoreDatabase.instance = new CoreDatabase();
    }
    return CoreDatabase.instance;
  }

  get client(): PrismaClient {
    return this.prisma;
  }

  getDbPath(): string {
    return this.dbPath;
  }

  async initialize(): Promise<void> {
    try {
      // Test connection
      await this.prisma.$connect();
      console.log("Core database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize core database:", error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }

  // Project management
  async createProject(projectData: { name: string; description?: string }) {
    const projectId = `proj_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const dataPath = path.join(
      app.getPath("userData"),
      "projects",
      `${projectId}.db`
    );

    // Ensure projects directory exists
    const projectsDir = path.dirname(dataPath);
    if (!fs.existsSync(projectsDir)) {
      fs.mkdirSync(projectsDir, { recursive: true });
    }

    return await this.prisma.project.create({
      data: {
        id: projectId,
        name: projectData.name,
        description: projectData.description,
        dataPath,
      },
    });
  }

  async getProjects() {
    return await this.prisma.project.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getProject(id: string) {
    return await this.prisma.project.findUnique({
      where: { id },
      include: {
        dataSources: true,
        backups: true,
        jobs: true,
        consolidatedModels: true,
      },
    });
  }

  async updateProject(
    id: string,
    data: {
      name?: string;
      description?: string;
    }
  ) {
    return await this.prisma.project.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async deleteProject(id: string) {
    // Get project to access dataPath
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (project) {
      // Delete project database file
      try {
        if (fs.existsSync(project.dataPath)) {
          fs.unlinkSync(project.dataPath);
        }
      } catch (error) {
        console.warn("Failed to delete project database file:", error);
      }
    }

    return await this.prisma.project.delete({
      where: { id },
    });
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
    return await this.prisma.dataSource.create({
      data: {
        projectId,
        name: dataSourceData.name,
        type: dataSourceData.type,
        config: JSON.stringify(dataSourceData.config),
      },
    });
  }

  async getDataSources(projectId: string) {
    return await this.prisma.dataSource.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
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
    return await this.prisma.backup.create({
      data: {
        projectId,
        ...backupData,
      },
    });
  }

  async getBackups(projectId: string) {
    return await this.prisma.backup.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateBackup(
    id: string,
    data: {
      status?: string;
      filePath?: string;
      size?: number;
      error?: string;
    }
  ) {
    const updateData: any = { ...data };
    if (data.status === "completed") {
      updateData.completedAt = new Date();
    }

    return await this.prisma.backup.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteBackup(id: string) {
    return await this.prisma.backup.delete({
      where: { id },
    });
  }

  // Job management
  async createJob(jobData: {
    projectId?: string;
    type: string;
    description?: string;
    config?: any;
  }) {
    return await this.prisma.job.create({
      data: {
        ...jobData,
        config: jobData.config ? JSON.stringify(jobData.config) : null,
      },
    });
  }

  async getJobs(projectId?: string) {
    return await this.prisma.job.findMany({
      where: projectId ? { projectId } : {},
      orderBy: { createdAt: "desc" },
    });
  }

  async updateJob(
    id: string,
    data: {
      status?: string;
      progress?: number;
      result?: any;
      error?: string;
    }
  ) {
    const updateData: any = { ...data };
    if (data.result) {
      updateData.result = JSON.stringify(data.result);
    }
    if (data.status === "running" && !updateData.startedAt) {
      updateData.startedAt = new Date();
    }
    if (data.status === "completed" || data.status === "failed") {
      updateData.completedAt = new Date();
    }

    return await this.prisma.job.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteJob(id: string) {
    return await this.prisma.job.delete({
      where: { id },
    });
  }

  // App settings
  async getSetting(key: string) {
    const setting = await this.prisma.appSetting.findUnique({
      where: { key },
    });
    return setting?.value;
  }

  async setSetting(key: string, value: string) {
    return await this.prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}
