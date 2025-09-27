// Client-side database service that uses Electron IPC or API calls
// This runs in the browser/renderer process

export interface ClientDatabaseService {
  // Project operations
  getProjects(): Promise<any[]>;
  getProject(id: string): Promise<any | null>;
  createProject(project: any): Promise<any>;
  updateProject(id: string, updates: any): Promise<any>;
  deleteProject(id: string): Promise<void>;

  // Data source operations
  getDataSources(projectId: string): Promise<any[]>;
  getDataSource(projectId: string, id: string): Promise<any | null>;
  createDataSource(projectId: string, dataSource: any): Promise<any>;
  updateDataSource(projectId: string, id: string, updates: any): Promise<any>;
  deleteDataSource(projectId: string, id: string): Promise<void>;

  // Snapshot operations
  getSnapshots(projectId: string): Promise<any[]>;
  getSnapshot(projectId: string, id: string): Promise<any | null>;
  createSnapshot(projectId: string, snapshot: any): Promise<any>;
  deleteSnapshot(projectId: string, id: string): Promise<void>;

  // Job operations
  getJobs(projectId?: string): Promise<any[]>;
  getJob(id: string): Promise<any | null>;
  createJob(job: any): Promise<any>;
  updateJob(id: string, updates: any): Promise<any>;
  deleteJob(id: string): Promise<void>;

  // Backup operations
  getBackups(projectId: string): Promise<any[]>;
  getBackup(projectId: string, id: string): Promise<any | null>;
  createBackup(projectId: string, backup: any): Promise<any>;
  updateBackup(id: string, updates: any): Promise<any>;
  deleteBackup(id: string): Promise<void>;
}

class ClientDatabaseServiceImpl implements ClientDatabaseService {
  private isElectron: boolean;

  constructor() {
    this.isElectron =
      typeof window !== "undefined" && (window as any).electronAPI;
  }

  // Project operations
  async getProjects(): Promise<any[]> {
    if (this.isElectron && (window as any).electronAPI?.getProjects) {
      return await (window as any).electronAPI.getProjects();
    }

    // Fallback to localStorage for browser testing
    const projects = localStorage.getItem("manifold_projects");
    return projects ? JSON.parse(projects) : [];
  }

  async getProject(id: string): Promise<any | null> {
    if (this.isElectron && (window as any).electronAPI?.getProject) {
      return await (window as any).electronAPI.getProject(id);
    }

    // Fallback to localStorage
    const projects = await this.getProjects();
    return projects.find((p) => p.id === id) || null;
  }

  async createProject(project: any): Promise<any> {
    if (this.isElectron && (window as any).electronAPI?.createProject) {
      return await (window as any).electronAPI.createProject(project);
    }

    // Fallback to localStorage
    const projects = await this.getProjects();
    const newProject = {
      ...project,
      id: `proj_${Date.now()}`,
      createdAt: new Date(),
    };
    projects.push(newProject);
    localStorage.setItem("manifold_projects", JSON.stringify(projects));
    return newProject;
  }

  async updateProject(id: string, updates: any): Promise<any> {
    if (this.isElectron && (window as any).electronAPI?.updateProject) {
      return await (window as any).electronAPI.updateProject(id, updates);
    }

    // Fallback to localStorage
    const projects = await this.getProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index !== -1) {
      projects[index] = {
        ...projects[index],
        ...updates,
        updatedAt: new Date(),
      };
      localStorage.setItem("manifold_projects", JSON.stringify(projects));
      return projects[index];
    }
    throw new Error(`Project ${id} not found`);
  }

  async deleteProject(id: string): Promise<void> {
    if (this.isElectron && (window as any).electronAPI?.deleteProject) {
      return await (window as any).electronAPI.deleteProject(id);
    }

    // Fallback to localStorage
    const projects = await this.getProjects();
    const filtered = projects.filter((p) => p.id !== id);
    localStorage.setItem("manifold_projects", JSON.stringify(filtered));
  }

  // Data source operations
  async getDataSources(projectId: string): Promise<any[]> {
    if (this.isElectron && (window as any).electronAPI?.getDataSources) {
      return await (window as any).electronAPI.getDataSources(projectId);
    }

    // Fallback to localStorage
    const key = `manifold_data_sources_${projectId}`;
    const dataSources = localStorage.getItem(key);
    return dataSources ? JSON.parse(dataSources) : [];
  }

  async getDataSource(projectId: string, id: string): Promise<any | null> {
    const dataSources = await this.getDataSources(projectId);
    return dataSources.find((ds) => ds.id === id) || null;
  }

  async createDataSource(projectId: string, dataSource: any): Promise<any> {
    if (this.isElectron && (window as any).electronAPI?.createDataSource) {
      return await (window as any).electronAPI.createDataSource(
        projectId,
        dataSource
      );
    }

    // Fallback to localStorage
    const dataSources = await this.getDataSources(projectId);
    const newDataSource = {
      ...dataSource,
      id: `ds_${Date.now()}`,
      createdAt: new Date(),
    };
    dataSources.push(newDataSource);
    const key = `manifold_data_sources_${projectId}`;
    localStorage.setItem(key, JSON.stringify(dataSources));
    return newDataSource;
  }

  async updateDataSource(
    projectId: string,
    id: string,
    updates: any
  ): Promise<any> {
    if (this.isElectron && (window as any).electronAPI?.updateDataSource) {
      return await (window as any).electronAPI.updateDataSource(
        projectId,
        id,
        updates
      );
    }

    // Fallback to localStorage
    const dataSources = await this.getDataSources(projectId);
    const index = dataSources.findIndex((ds) => ds.id === id);
    if (index !== -1) {
      dataSources[index] = {
        ...dataSources[index],
        ...updates,
        updatedAt: new Date(),
      };
      const key = `manifold_data_sources_${projectId}`;
      localStorage.setItem(key, JSON.stringify(dataSources));
      return dataSources[index];
    }
    throw new Error(`DataSource ${id} not found`);
  }

  async deleteDataSource(projectId: string, id: string): Promise<void> {
    if (this.isElectron && (window as any).electronAPI?.deleteDataSource) {
      return await (window as any).electronAPI.deleteDataSource(projectId, id);
    }

    // Fallback to localStorage
    const dataSources = await this.getDataSources(projectId);
    const filtered = dataSources.filter((ds) => ds.id !== id);
    const key = `manifold_data_sources_${projectId}`;
    localStorage.setItem(key, JSON.stringify(filtered));
  }

  // Snapshot operations
  async getSnapshots(projectId: string): Promise<any[]> {
    if (this.isElectron && (window as any).electronAPI?.getSnapshots) {
      return await (window as any).electronAPI.getSnapshots(projectId);
    }

    // Fallback to localStorage
    const key = `manifold_snapshots_${projectId}`;
    const snapshots = localStorage.getItem(key);
    return snapshots ? JSON.parse(snapshots) : [];
  }

  async getSnapshot(projectId: string, id: string): Promise<any | null> {
    const snapshots = await this.getSnapshots(projectId);
    return snapshots.find((s) => s.id === id) || null;
  }

  async createSnapshot(projectId: string, snapshot: any): Promise<any> {
    if (this.isElectron && (window as any).electronAPI?.createSnapshot) {
      return await (window as any).electronAPI.createSnapshot(
        projectId,
        snapshot
      );
    }

    // Fallback to localStorage
    const snapshots = await this.getSnapshots(projectId);
    const newSnapshot = {
      ...snapshot,
      id: `snap_${Date.now()}`,
      createdAt: new Date(),
    };
    snapshots.push(newSnapshot);
    const key = `manifold_snapshots_${projectId}`;
    localStorage.setItem(key, JSON.stringify(snapshots));
    return newSnapshot;
  }

  async deleteSnapshot(projectId: string, id: string): Promise<void> {
    if (this.isElectron && (window as any).electronAPI?.deleteSnapshot) {
      return await (window as any).electronAPI.deleteSnapshot(projectId, id);
    }

    // Fallback to localStorage
    const snapshots = await this.getSnapshots(projectId);
    const filtered = snapshots.filter((s) => s.id !== id);
    const key = `manifold_snapshots_${projectId}`;
    localStorage.setItem(key, JSON.stringify(filtered));
  }

  // Job operations
  async getJobs(projectId?: string): Promise<any[]> {
    if (this.isElectron && (window as any).electronAPI?.getJobs) {
      return await (window as any).electronAPI.getJobs(projectId);
    }

    // Fallback to localStorage
    const key = projectId ? `manifold_jobs_${projectId}` : "manifold_jobs";
    const jobs = localStorage.getItem(key);
    return jobs ? JSON.parse(jobs) : [];
  }

  async getJob(id: string): Promise<any | null> {
    if (this.isElectron && (window as any).electronAPI?.getJob) {
      return await (window as any).electronAPI.getJob(id);
    }

    // Fallback to localStorage - search all job keys
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith("manifold_jobs")
    );
    for (const key of keys) {
      const jobs = JSON.parse(localStorage.getItem(key) || "[]");
      const job = jobs.find((j: any) => j.id === id);
      if (job) return job;
    }
    return null;
  }

  async createJob(job: any): Promise<any> {
    if (this.isElectron && (window as any).electronAPI?.createJob) {
      return await (window as any).electronAPI.createJob(job);
    }

    // Fallback to localStorage
    const key = job.projectId
      ? `manifold_jobs_${job.projectId}`
      : "manifold_jobs";
    const jobs = JSON.parse(localStorage.getItem(key) || "[]");
    const newJob = { ...job, id: `job_${Date.now()}`, createdAt: new Date() };
    jobs.push(newJob);
    localStorage.setItem(key, JSON.stringify(jobs));
    return newJob;
  }

  async updateJob(id: string, updates: any): Promise<any> {
    if (this.isElectron && (window as any).electronAPI?.updateJob) {
      return await (window as any).electronAPI.updateJob(id, updates);
    }

    // Fallback to localStorage
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith("manifold_jobs")
    );
    for (const key of keys) {
      const jobs = JSON.parse(localStorage.getItem(key) || "[]");
      const index = jobs.findIndex((j: any) => j.id === id);
      if (index !== -1) {
        jobs[index] = { ...jobs[index], ...updates, updatedAt: new Date() };
        localStorage.setItem(key, JSON.stringify(jobs));
        return jobs[index];
      }
    }
    throw new Error(`Job ${id} not found`);
  }

  async deleteJob(id: string): Promise<void> {
    if (this.isElectron && (window as any).electronAPI?.deleteJob) {
      return await (window as any).electronAPI.deleteJob(id);
    }

    // Fallback to localStorage
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith("manifold_jobs")
    );
    for (const key of keys) {
      const jobs = JSON.parse(localStorage.getItem(key) || "[]");
      const filtered = jobs.filter((j: any) => j.id !== id);
      if (filtered.length !== jobs.length) {
        localStorage.setItem(key, JSON.stringify(filtered));
        return;
      }
    }
  }

  // Backup operations
  async getBackups(projectId: string): Promise<any[]> {
    if (this.isElectron && (window as any).electronAPI?.getBackups) {
      return await (window as any).electronAPI.getBackups(projectId);
    }

    // Fallback to localStorage
    const key = `manifold_backups_${projectId}`;
    const backups = localStorage.getItem(key);
    return backups ? JSON.parse(backups) : [];
  }

  async getBackup(projectId: string, id: string): Promise<any | null> {
    const backups = await this.getBackups(projectId);
    return backups.find((b) => b.id === id) || null;
  }

  async createBackup(projectId: string, backup: any): Promise<any> {
    if (this.isElectron && (window as any).electronAPI?.createBackup) {
      return await (window as any).electronAPI.createBackup(projectId, backup);
    }

    // Fallback to localStorage
    const backups = await this.getBackups(projectId);
    const newBackup = {
      ...backup,
      id: `backup_${Date.now()}`,
      createdAt: new Date(),
    };
    backups.push(newBackup);
    const key = `manifold_backups_${projectId}`;
    localStorage.setItem(key, JSON.stringify(backups));
    return newBackup;
  }

  async updateBackup(id: string, updates: any): Promise<any> {
    if (this.isElectron && (window as any).electronAPI?.updateBackup) {
      return await (window as any).electronAPI.updateBackup(id, updates);
    }

    // Fallback to localStorage
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith("manifold_backups_")
    );
    for (const key of keys) {
      const backups = JSON.parse(localStorage.getItem(key) || "[]");
      const index = backups.findIndex((b: any) => b.id === id);
      if (index !== -1) {
        backups[index] = {
          ...backups[index],
          ...updates,
          updatedAt: new Date(),
        };
        localStorage.setItem(key, JSON.stringify(backups));
        return backups[index];
      }
    }
    throw new Error(`Backup ${id} not found`);
  }

  async deleteBackup(id: string): Promise<void> {
    if (this.isElectron && (window as any).electronAPI?.deleteBackup) {
      return await (window as any).electronAPI.deleteBackup(id);
    }

    // Fallback to localStorage
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith("manifold_backups_")
    );
    for (const key of keys) {
      const backups = JSON.parse(localStorage.getItem(key) || "[]");
      const filtered = backups.filter((b: any) => b.id !== id);
      if (filtered.length !== backups.length) {
        localStorage.setItem(key, JSON.stringify(filtered));
        return;
      }
    }
  }
}

export const clientDatabaseService = new ClientDatabaseServiceImpl();
export default clientDatabaseService;
