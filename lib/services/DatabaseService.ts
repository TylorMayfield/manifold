import { Project, DataSource, ConsolidatedModel, Snapshot } from "../../types";
// import { PrismaDatabaseService } from "./PrismaDatabaseService"; // Moved to server-side

export class DatabaseService {
  private static instance: DatabaseService;
  private prismaService: any = null; // PrismaDatabaseService | null = null; // Server-side only

  private constructor() {
    // Prisma service initialization disabled for client-side
    // Server-side services are not available in client components
    this.prismaService = null;
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Generic SQL execution method
  async execute(sql: string, params?: any[]): Promise<any> {
    try {
      if ((window as any).electronAPI?.executeSQL) {
        return await (window as any).electronAPI.executeSQL(sql, params);
      }
      // Fallback for browser testing - limited functionality
      console.warn("SQL execution not supported in browser mode:", sql);
      return { success: true };
    } catch (error) {
      console.error("Failed to execute SQL:", error);
      throw error;
    }
  }

  // Generic SQL query method
  async query(sql: string, params?: any[]): Promise<any[]> {
    try {
      if ((window as any).electronAPI?.querySQL) {
        return await (window as any).electronAPI.querySQL(sql, params);
      }
      // Fallback for browser testing - limited functionality
      console.warn("SQL query not supported in browser mode:", sql);
      return [];
    } catch (error) {
      console.error("Failed to query SQL:", error);
      throw error;
    }
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    try {
      // Try Prisma service first
      if (this.prismaService) {
        return await this.prismaService.getProjects();
      }

      // Fallback to Electron API
      if ((window as any).electronAPI?.getProjects) {
        return await (window as any).electronAPI.getProjects();
      }

      // Fallback to localStorage for browser testing
      const projects = localStorage.getItem("manifold_projects");
      return projects ? JSON.parse(projects) : [];
    } catch (error) {
      console.error("Failed to get projects:", error);
      return [];
    }
  }

  async getProject(id: string): Promise<Project | null> {
    try {
      // Try Prisma service first
      if (this.prismaService) {
        return await this.prismaService.getProject(id);
      }

      // Fallback to Electron API
      if ((window as any).electronAPI?.getProject) {
        return await (window as any).electronAPI.getProject(id);
      }

      // Fallback to localStorage for browser testing
      const projects = await this.getProjects();
      return projects.find((p) => p.id === id) || null;
    } catch (error) {
      console.error("Failed to get project:", error);
      return null;
    }
  }

  async createProject(project: Project): Promise<void> {
    try {
      // Try Prisma service first
      if (this.prismaService) {
        return await this.prismaService.createProject(project);
      }

      // Fallback to Electron API
      if ((window as any).electronAPI?.createProject) {
        console.log("Creating project via Electron API:", project);
        const result = await (window as any).electronAPI.createProject(project);
        console.log("Project creation result:", result);
      } else {
        // Fallback to localStorage for browser testing
        console.log("Creating project via localStorage fallback:", project);
        const projects = await this.getProjects();
        projects.push(project);
        localStorage.setItem("manifold_projects", JSON.stringify(projects));
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      });
      throw error;
    }
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    try {
      if ((window as any).electronAPI?.updateProject) {
        await (window as any).electronAPI.updateProject(id, updates);
      } else {
        // Fallback to localStorage for browser testing
        const projects = await this.getProjects();
        const index = projects.findIndex((p) => p.id === id);
        if (index !== -1) {
          projects[index] = { ...projects[index], ...updates };
          localStorage.setItem("manifold_projects", JSON.stringify(projects));
        }
      }
    } catch (error) {
      console.error("Failed to update project:", error);
      throw error;
    }
  }

  async updateProjectObject(project: Project): Promise<void> {
    try {
      console.log("DatabaseService.updateProjectObject called with:", project);

      if ((window as any).electronAPI?.updateProject) {
        console.log("Using electron API for project update");
        await (window as any).electronAPI.updateProject(project.id, {
          name: project.name,
          description: project.description,
          updatedAt: project.updatedAt,
        });
        console.log("Project updated successfully via electron API");
      } else {
        console.log("Using localStorage fallback for project update");
        // Fallback to localStorage for browser testing
        const projects = await this.getProjects();
        const index = projects.findIndex((p) => p.id === project.id);
        if (index !== -1) {
          projects[index] = project;
          localStorage.setItem("manifold_projects", JSON.stringify(projects));
          console.log("Project updated successfully via localStorage");
        } else {
          throw new Error(`Project with id ${project.id} not found`);
        }
      }
    } catch (error) {
      console.error("Failed to update project:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        project: project,
      });
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      if ((window as any).electronAPI?.deleteProject) {
        await (window as any).electronAPI.deleteProject(id);
      } else {
        // Fallback to localStorage for browser testing
        const projects = await this.getProjects();
        const filtered = projects.filter((p) => p.id !== id);
        localStorage.setItem("manifold_projects", JSON.stringify(filtered));
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      throw error;
    }
  }

  // Data source operations
  async getDataSources(projectId: string): Promise<DataSource[]> {
    try {
      if ((window as any).electronAPI?.getDataSources) {
        return await (window as any).electronAPI.getDataSources(projectId);
      }
      // Fallback to localStorage for browser testing
      const dataSources = localStorage.getItem(
        `manifold_data_sources_${projectId}`
      );
      return dataSources ? JSON.parse(dataSources) : [];
    } catch (error) {
      console.error("Failed to get data sources:", error);
      return [];
    }
  }

  async getDataSource(dataSourceId: string): Promise<DataSource | null> {
    try {
      if ((window as any).electronAPI?.getDataSource) {
        return await (window as any).electronAPI.getDataSource(dataSourceId);
      }
      // Fallback: search through all projects' data sources
      const projects = await this.getProjects();
      for (const project of projects) {
        const dataSources = await this.getDataSources(project.id);
        const dataSource = dataSources.find((ds) => ds.id === dataSourceId);
        if (dataSource) {
          return dataSource;
        }
      }
      return null;
    } catch (error) {
      console.error("Failed to get data source:", error);
      return null;
    }
  }

  async createDataSource(dataSource: DataSource): Promise<void> {
    try {
      console.log("DatabaseService.createDataSource called with:", dataSource);
      console.log("Project ID:", dataSource.projectId);
      console.log(
        "Electron API available:",
        !!(window as any).electronAPI?.createDataSource
      );

      if ((window as any).electronAPI?.createDataSource) {
        console.log("Using electron API for data source creation");
        console.log("About to call electronAPI.createDataSource with:", {
          id: dataSource.id,
          name: dataSource.name,
          type: dataSource.type,
          projectId: dataSource.projectId,
          config: dataSource.config,
        });

        await (window as any).electronAPI.createDataSource(dataSource);
        console.log("Data source created successfully via electron API");
      } else {
        console.log("Using localStorage fallback for data source creation");
        // Fallback to localStorage for browser testing
        const dataSources = await this.getDataSources(dataSource.projectId);
        dataSources.push(dataSource);
        localStorage.setItem(
          `manifold_data_sources_${dataSource.projectId}`,
          JSON.stringify(dataSources)
        );
        console.log("Data source created successfully via localStorage");
      }
    } catch (error) {
      console.error("Failed to create data source:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        dataSource: dataSource,
      });
      throw error;
    }
  }

  async updateDataSource(
    id: string,
    updates: Partial<DataSource>
  ): Promise<void> {
    try {
      if ((window as any).electronAPI?.updateDataSource) {
        await (window as any).electronAPI.updateDataSource(id, updates);
      } else {
        // Fallback to localStorage for browser testing
        const dataSources = await this.getDataSources(updates.projectId || "");
        const index = dataSources.findIndex((ds) => ds.id === id);
        if (index !== -1) {
          dataSources[index] = { ...dataSources[index], ...updates };
          localStorage.setItem(
            `manifold_data_sources_${updates.projectId}`,
            JSON.stringify(dataSources)
          );
        }
      }
    } catch (error) {
      console.error("Failed to update data source:", error);
      throw error;
    }
  }

  async deleteDataSource(id: string, projectId: string): Promise<void> {
    try {
      if ((window as any).electronAPI?.deleteDataSource) {
        await (window as any).electronAPI.deleteDataSource(id);
      } else {
        // Fallback to localStorage for browser testing
        const dataSources = await this.getDataSources(projectId);
        const filtered = dataSources.filter((ds) => ds.id !== id);
        localStorage.setItem(
          `manifold_data_sources_${projectId}`,
          JSON.stringify(filtered)
        );
      }
    } catch (error) {
      console.error("Failed to delete data source:", error);
      throw error;
    }
  }

  // Consolidated model operations
  async getConsolidatedModels(projectId: string): Promise<ConsolidatedModel[]> {
    try {
      if ((window as any).electronAPI?.getConsolidatedModels) {
        return await (window as any).electronAPI.getConsolidatedModels(
          projectId
        );
      }
      // Fallback to localStorage for browser testing
      const models = localStorage.getItem(
        `manifold_consolidated_models_${projectId}`
      );
      return models ? JSON.parse(models) : [];
    } catch (error) {
      console.error("Failed to get consolidated models:", error);
      return [];
    }
  }

  async createConsolidatedModel(model: ConsolidatedModel): Promise<void> {
    try {
      console.log(
        "DatabaseService.createConsolidatedModel called with:",
        model
      );

      if ((window as any).electronAPI?.createConsolidatedModel) {
        console.log("Using electron API for consolidated model creation");
        await (window as any).electronAPI.createConsolidatedModel(model);
        console.log("Consolidated model created successfully via electron API");
      } else {
        console.log(
          "Using localStorage fallback for consolidated model creation"
        );
        // Fallback to localStorage for browser testing
        const models = await this.getConsolidatedModels(model.projectId);
        models.push(model);
        localStorage.setItem(
          `manifold_consolidated_models_${model.projectId}`,
          JSON.stringify(models)
        );
        console.log("Consolidated model created successfully via localStorage");
      }
    } catch (error) {
      console.error("Failed to create consolidated model:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        model: model,
      });
      throw error;
    }
  }

  async updateConsolidatedModel(
    id: string,
    updates: Partial<ConsolidatedModel>
  ): Promise<void> {
    try {
      if ((window as any).electronAPI?.updateConsolidatedModel) {
        await (window as any).electronAPI.updateConsolidatedModel(id, updates);
      } else {
        // Fallback to localStorage for browser testing
        const models = await this.getConsolidatedModels(
          updates.projectId || ""
        );
        const index = models.findIndex((m) => m.id === id);
        if (index !== -1) {
          models[index] = { ...models[index], ...updates };
          localStorage.setItem(
            `manifold_consolidated_models_${updates.projectId}`,
            JSON.stringify(models)
          );
        }
      }
    } catch (error) {
      console.error("Failed to update consolidated model:", error);
      throw error;
    }
  }

  async deleteConsolidatedModel(id: string, projectId: string): Promise<void> {
    try {
      if ((window as any).electronAPI?.deleteConsolidatedModel) {
        await (window as any).electronAPI.deleteConsolidatedModel(id);
      } else {
        // Fallback to localStorage for browser testing
        const models = await this.getConsolidatedModels(projectId);
        const filtered = models.filter((m) => m.id !== id);
        localStorage.setItem(
          `manifold_consolidated_models_${projectId}`,
          JSON.stringify(filtered)
        );
      }
    } catch (error) {
      console.error("Failed to delete consolidated model:", error);
      throw error;
    }
  }

  // Snapshot operations
  async getSnapshots(projectId: string): Promise<Snapshot[]> {
    try {
      console.log(
        "DatabaseService.getSnapshots called with projectId:",
        projectId
      );

      if ((window as any).electronAPI?.getSnapshots) {
        console.log("Using electron API for getSnapshots");
        return await (window as any).electronAPI.getSnapshots(projectId);
      }

      // Fallback to localStorage for browser testing
      const key = `manifold_snapshots_${projectId}`;
      console.log("Using localStorage for getSnapshots with key:", key);

      const snapshots = localStorage.getItem(key);
      console.log("Raw snapshots from localStorage:", snapshots);

      const parsed = snapshots ? JSON.parse(snapshots) : [];
      console.log("Parsed snapshots:", parsed);

      return parsed;
    } catch (error) {
      console.error("Failed to get snapshots:", error);
      return [];
    }
  }

  async createSnapshot(snapshot: Snapshot): Promise<void> {
    try {
      console.log("DatabaseService.createSnapshot called with:", snapshot);

      if ((window as any).electronAPI?.createSnapshot) {
        console.log("Using electron API for snapshot creation");
        await (window as any).electronAPI.createSnapshot(snapshot);
        console.log("Snapshot created successfully via electron API");
      } else {
        console.log("Using localStorage fallback for snapshot creation");
        // Fallback to localStorage for browser testing
        const snapshots = await this.getSnapshots(snapshot.projectId || "");
        console.log("Existing snapshots before adding new one:", snapshots);

        snapshots.push(snapshot);
        console.log("Snapshots after adding new one:", snapshots);

        const key = `manifold_snapshots_${snapshot.projectId}`;
        localStorage.setItem(key, JSON.stringify(snapshots));
        console.log(
          "Snapshot created successfully via localStorage with key:",
          key
        );

        // Verify it was saved
        const verify = localStorage.getItem(key);
        console.log("Verification - snapshots in localStorage:", verify);
      }
    } catch (error) {
      console.error("Failed to create snapshot:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        snapshot: snapshot,
      });
      throw error;
    }
  }

  async getLatestSnapshot(
    dataSourceId: string,
    projectId: string
  ): Promise<Snapshot | null> {
    try {
      if ((window as any).electronAPI?.getLatestSnapshot) {
        return await (window as any).electronAPI.getLatestSnapshot(
          dataSourceId
        );
      }
      // Fallback to localStorage for browser testing
      const snapshots = await this.getSnapshots(projectId);
      const dataSourceSnapshots = snapshots.filter(
        (s) => s.dataSourceId === dataSourceId
      );
      return dataSourceSnapshots.length > 0
        ? dataSourceSnapshots.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0]
        : null;
    } catch (error) {
      console.error("Failed to get latest snapshot:", error);
      return null;
    }
  }

  async deleteSnapshot(id: string, projectId: string): Promise<void> {
    try {
      if ((window as any).electronAPI?.deleteSnapshot) {
        await (window as any).electronAPI.deleteSnapshot(id);
      } else {
        // Fallback to localStorage for browser testing
        const snapshots = await this.getSnapshots(projectId);
        const filtered = snapshots.filter((s) => s.id !== id);
        localStorage.setItem(
          `manifold_snapshots_${projectId}`,
          JSON.stringify(filtered)
        );
      }
    } catch (error) {
      console.error("Failed to delete snapshot:", error);
      throw error;
    }
  }
}
