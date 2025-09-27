import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { logger } from "../utils/logger";

export class SimpleSQLiteDB {
  private static instance: SimpleSQLiteDB;
  private db: Database.Database;
  private dbPath: string;

  private constructor() {
    // Create database in project root data directory
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.dbPath = path.join(dataDir, "manifold.db");
    this.db = new Database(this.dbPath);

    // Enable foreign keys
    this.db.pragma("foreign_keys = ON");
  }

  static getInstance(): SimpleSQLiteDB {
    if (!SimpleSQLiteDB.instance) {
      SimpleSQLiteDB.instance = new SimpleSQLiteDB();
    }
    return SimpleSQLiteDB.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Create tables
      this.createTables();
      logger.success(
        "Database initialized successfully",
        "database",
        { path: this.dbPath },
        "SimpleSQLiteDB"
      );
    } catch (error) {
      logger.error(
        "Failed to initialize database",
        "database",
        { error },
        "SimpleSQLiteDB"
      );
      throw error;
    }
  }

  private createTables(): void {
    // Projects table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        data_path TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Data sources table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS data_sources (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        config TEXT, -- JSON string
        status TEXT DEFAULT 'idle',
        enabled BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_sync_at DATETIME,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Snapshots table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS snapshots (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        data_source_id TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        data TEXT, -- JSON string
        schema TEXT, -- JSON string
        metadata TEXT, -- JSON string
        record_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE CASCADE
      )
    `);

    // Pipelines table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pipelines (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        steps TEXT, -- JSON string for TransformStep[]
        input_source_ids TEXT, -- JSON string for string[]
        output_config TEXT, -- JSON string for ExportConfig
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Jobs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        name TEXT NOT NULL,
        pipeline_id TEXT,
        schedule TEXT, -- cron expression
        enabled BOOLEAN DEFAULT 1,
        status TEXT DEFAULT 'idle',
        last_run DATETIME,
        next_run DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE
      )
    `);

    // Create default project if it doesn't exist
    const defaultProject = this.getProject("default");
    if (!defaultProject) {
      this.createProject({
        id: "default",
        name: "Default Project",
        description: "Default ETL workspace",
      });
    }
  }

  close(): void {
    this.db.close();
  }

  // Project methods
  createProject(projectData: {
    id?: string;
    name: string;
    description?: string;
  }) {
    const id =
      projectData.id ||
      `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const dataPath = path.join(process.cwd(), "data", "projects", `${id}.db`);

    // Ensure projects directory exists
    const projectsDir = path.dirname(dataPath);
    if (!fs.existsSync(projectsDir)) {
      fs.mkdirSync(projectsDir, { recursive: true });
    }

    const stmt = this.db.prepare(`
      INSERT INTO projects (id, name, description, data_path)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(id, projectData.name, projectData.description || null, dataPath);

    return this.getProject(id);
  }

  getProjects() {
    const stmt = this.db.prepare(
      "SELECT * FROM projects ORDER BY created_at DESC"
    );
    return stmt.all();
  }

  getProject(id: string) {
    const stmt = this.db.prepare("SELECT * FROM projects WHERE id = ?");
    return stmt.get(id);
  }

  updateProject(id: string, data: { name?: string; description?: string }) {
    const stmt = this.db.prepare(`
      UPDATE projects 
      SET name = COALESCE(?, name), 
          description = COALESCE(?, description),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(data.name || null, data.description || null, id);
    return this.getProject(id);
  }

  deleteProject(id: string) {
    const stmt = this.db.prepare("DELETE FROM projects WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Data source methods
  createDataSource(
    projectId: string,
    dataSourceData: { name: string; type: string; config: any }
  ) {
    const id = `ds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stmt = this.db.prepare(`
      INSERT INTO data_sources (id, project_id, name, type, config)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      projectId,
      dataSourceData.name,
      dataSourceData.type,
      JSON.stringify(dataSourceData.config)
    );

    return this.getDataSource(id);
  }

  getDataSources(projectId: string) {
    const stmt = this.db.prepare(`
      SELECT *, 
             json(config) as config
      FROM data_sources 
      WHERE project_id = ? 
      ORDER BY created_at DESC
    `);

    const results = stmt.all(projectId) as any[];
    return results.map((row: any) => ({
      ...row,
      config: row.config ? JSON.parse(row.config) : {},
      enabled: Boolean(row.enabled),
    }));
  }

  getDataSource(id: string) {
    const stmt = this.db.prepare(`
      SELECT *, 
             json(config) as config
      FROM data_sources 
      WHERE id = ?
    `);

    const result = stmt.get(id) as any;
    if (result) {
      return {
        ...result,
        config: result.config ? JSON.parse(result.config) : {},
        enabled: Boolean(result.enabled),
      };
    }
    return null;
  }

  updateDataSource(
    id: string,
    data: { name?: string; type?: string; config?: any; status?: string }
  ) {
    const stmt = this.db.prepare(`
      UPDATE data_sources 
      SET name = COALESCE(?, name),
          type = COALESCE(?, type),
          config = COALESCE(?, config),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      data.name || null,
      data.type || null,
      data.config ? JSON.stringify(data.config) : null,
      data.status || null,
      id
    );

    return this.getDataSource(id);
  }

  deleteDataSource(id: string) {
    const stmt = this.db.prepare("DELETE FROM data_sources WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Snapshot methods
  createSnapshot(
    projectId: string,
    snapshotData: {
      dataSourceId: string;
      data: any;
      schema?: any;
      metadata?: any;
      recordCount?: number;
      version?: number;
    }
  ) {
    const id = `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stmt = this.db.prepare(`
      INSERT INTO snapshots (id, project_id, data_source_id, version, data, schema, metadata, record_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      projectId,
      snapshotData.dataSourceId,
      snapshotData.version || 1,
      JSON.stringify(snapshotData.data),
      snapshotData.schema ? JSON.stringify(snapshotData.schema) : null,
      snapshotData.metadata ? JSON.stringify(snapshotData.metadata) : null,
      snapshotData.recordCount || 0
    );

    return this.getSnapshot(id);
  }

  getSnapshots(projectId: string, dataSourceId?: string) {
    let query = `
      SELECT *,
             json(data) as data,
             json(schema) as schema,
             json(metadata) as metadata
      FROM snapshots 
      WHERE project_id = ?
    `;

    const params = [projectId];

    if (dataSourceId) {
      query += " AND data_source_id = ?";
      params.push(dataSourceId);
    }

    query += " ORDER BY created_at DESC";

    const stmt = this.db.prepare(query);
    const results = stmt.all(...params) as any[];

    return results.map((row: any) => ({
      ...row,
      data: row.data ? JSON.parse(row.data) : null,
      schema: row.schema ? JSON.parse(row.schema) : null,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
  }

  getSnapshot(id: string) {
    const stmt = this.db.prepare(`
      SELECT *,
             json(data) as data,
             json(schema) as schema, 
             json(metadata) as metadata
      FROM snapshots 
      WHERE id = ?
    `);

    const result = stmt.get(id) as any;
    if (result) {
      return {
        ...result,
        data: result.data ? JSON.parse(result.data) : null,
        schema: result.schema ? JSON.parse(result.schema) : null,
        metadata: result.metadata ? JSON.parse(result.metadata) : null,
      };
    }
    return null;
  }

  deleteSnapshot(id: string) {
    const stmt = this.db.prepare("DELETE FROM snapshots WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Job methods
  createJob(jobData: {
    projectId?: string;
    name: string;
    pipelineId: string;
    schedule: string;
    enabled?: boolean;
  }) {
    const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stmt = this.db.prepare(`
      INSERT INTO jobs (id, project_id, name, pipeline_id, schedule, enabled)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      jobData.projectId || null,
      jobData.name,
      jobData.pipelineId,
      jobData.schedule,
      jobData.enabled !== false ? 1 : 0
    );

    return this.getJob(id);
  }

  getJobs(projectId?: string) {
    let query = `
      SELECT *
      FROM jobs
    `;

    const params = [];

    if (projectId) {
      query += " WHERE project_id = ?";
      params.push(projectId);
    }

    query += " ORDER BY created_at DESC";

    const stmt = this.db.prepare(query);
    const results = stmt.all(...params) as any[];

    return results.map((row: any) => ({
      ...row,
      enabled: Boolean(row.enabled),
      lastRun: row.last_run ? new Date(row.last_run) : undefined,
      nextRun: row.next_run ? new Date(row.next_run) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  getJob(id: string) {
    const stmt = this.db.prepare(`
      SELECT *
      FROM jobs 
      WHERE id = ?
    `);

    const result = stmt.get(id) as any;
    if (result) {
      return {
        ...result,
        enabled: Boolean(result.enabled),
        lastRun: result.last_run ? new Date(result.last_run) : undefined,
        nextRun: result.next_run ? new Date(result.next_run) : undefined,
        createdAt: new Date(result.created_at),
        updatedAt: new Date(result.updated_at),
      };
    }
    return null;
  }

  updateJob(
    id: string,
    data: {
      name?: string;
      schedule?: string;
      enabled?: boolean;
      status?: string;
      lastRun?: Date;
      nextRun?: Date;
    }
  ) {
    const stmt = this.db.prepare(`
      UPDATE jobs 
      SET name = COALESCE(?, name),
          schedule = COALESCE(?, schedule),
          enabled = COALESCE(?, enabled),
          status = COALESCE(?, status),
          last_run = COALESCE(?, last_run),
          next_run = COALESCE(?, next_run),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      data.name || null,
      data.schedule || null,
      data.enabled !== undefined ? (data.enabled ? 1 : 0) : null,
      data.status || null,
      data.lastRun ? data.lastRun.toISOString() : null,
      data.nextRun ? data.nextRun.toISOString() : null,
      id
    );

    return this.getJob(id);
  }

  deleteJob(id: string) {
    const stmt = this.db.prepare("DELETE FROM jobs WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Pipeline methods
  createPipeline(
    projectId: string,
    pipelineData: {
      name: string;
      description?: string;
      steps?: any[];
      inputSourceIds?: string[];
      outputConfig?: any;
    }
  ) {
    const id = `pipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stmt = this.db.prepare(`
      INSERT INTO pipelines (id, project_id, name, description, steps, input_source_ids, output_config)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      projectId,
      pipelineData.name,
      pipelineData.description || null,
      pipelineData.steps ? JSON.stringify(pipelineData.steps) : null,
      pipelineData.inputSourceIds
        ? JSON.stringify(pipelineData.inputSourceIds)
        : null,
      pipelineData.outputConfig
        ? JSON.stringify(pipelineData.outputConfig)
        : null
    );

    return this.getPipeline(id);
  }

  getPipelines(projectId: string) {
    const stmt = this.db.prepare(`
      SELECT *,
             json(steps) as steps,
             json(input_source_ids) as input_source_ids,
             json(output_config) as output_config
      FROM pipelines 
      WHERE project_id = ?
      ORDER BY created_at DESC
    `);

    const results = stmt.all(projectId) as any[];
    return results.map((row: any) => ({
      ...row,
      steps: row.steps ? JSON.parse(row.steps) : [],
      inputSourceIds: row.input_source_ids
        ? JSON.parse(row.input_source_ids)
        : [],
      outputConfig: row.output_config ? JSON.parse(row.output_config) : null,
    }));
  }

  getPipeline(id: string) {
    const stmt = this.db.prepare(`
      SELECT *,
             json(steps) as steps,
             json(input_source_ids) as input_source_ids,
             json(output_config) as output_config
      FROM pipelines 
      WHERE id = ?
    `);

    const result = stmt.get(id) as any;
    if (result) {
      return {
        ...result,
        steps: result.steps ? JSON.parse(result.steps) : [],
        inputSourceIds: result.input_source_ids
          ? JSON.parse(result.input_source_ids)
          : [],
        outputConfig: result.output_config
          ? JSON.parse(result.output_config)
          : null,
      };
    }
    return null;
  }

  updatePipeline(
    id: string,
    data: {
      name?: string;
      description?: string;
      steps?: any[];
      inputSourceIds?: string[];
      outputConfig?: any;
    }
  ) {
    const stmt = this.db.prepare(`
      UPDATE pipelines 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          steps = COALESCE(?, steps),
          input_source_ids = COALESCE(?, input_source_ids),
          output_config = COALESCE(?, output_config),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      data.name || null,
      data.description || null,
      data.steps ? JSON.stringify(data.steps) : null,
      data.inputSourceIds ? JSON.stringify(data.inputSourceIds) : null,
      data.outputConfig ? JSON.stringify(data.outputConfig) : null,
      id
    );

    return this.getPipeline(id);
  }

  deletePipeline(id: string) {
    const stmt = this.db.prepare("DELETE FROM pipelines WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
