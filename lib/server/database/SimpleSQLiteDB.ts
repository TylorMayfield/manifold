import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { logger } from "../utils/logger";

export class SimpleSQLiteDB {
  private static instance: SimpleSQLiteDB;
  private db: Database.Database | null = null;
  private dbPath: string;

  private constructor() {
    // Create database in project root data directory
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.dbPath = path.join(dataDir, "manifold.db");
  }

  static getInstance(): SimpleSQLiteDB {
    if (!SimpleSQLiteDB.instance) {
      SimpleSQLiteDB.instance = new SimpleSQLiteDB();
    }
    return SimpleSQLiteDB.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Skip initialization during build phase
      if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.CI) {
        console.log("Skipping database initialization during build phase");
        return;
      }

      // Initialize better-sqlite3 (synchronous, no WASM issues!)
      if (!this.db) {
        console.log("Initializing better-sqlite3...");
        
        try {
          this.db = new Database(this.dbPath, {
            verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
          });
          
          logger.info("Database opened", "database", { path: this.dbPath }, "SimpleSQLiteDB");

          // Enable foreign keys
          this.db.pragma("foreign_keys = ON");
          
          // Enable WAL mode for better concurrency
          this.db.pragma("journal_mode = WAL");

          // Create tables
          this.createTables();

          console.log("better-sqlite3 initialized successfully");
          
          logger.success(
            "Database initialized successfully",
            "database",
            { path: this.dbPath },
            "SimpleSQLiteDB"
          );
        } catch (initError) {
          console.error("Failed to initialize better-sqlite3:", initError);
          throw initError;
        }
      }
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

  // Helper to run queries and return results
  private query(sql: string, params: any[] = []): any[] {
    if (!this.db) {
      if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.CI) {
        return []; // Return empty during build
      }
      throw new Error("Database not initialized - call initialize() first");
    }
    
    try {
      const stmt = this.db.prepare(sql);
      const results = stmt.all(...params);
      return results as any[];
    } catch (error) {
      console.error("Query error:", error, "SQL:", sql, "Params:", params);
      throw error;
    }
  }

  // Helper to run statements without results
  private run(sql: string, params: any[] = []): void {
    if (!this.db) {
      if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.CI) {
        return; // Skip during build
      }
      throw new Error("Database not initialized - call initialize() first");
    }
    
    try {
      const stmt = this.db.prepare(sql);
      stmt.run(...params);
    } catch (error) {
      console.error("Run error:", error, "SQL:", sql, "Params:", params);
      throw error;
    }
  }

  private createTables(): void {
    if (!this.db) return;

    // Use exec for multi-statement SQL
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        data_path TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS data_sources (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        config TEXT,
        status TEXT DEFAULT 'idle',
        enabled BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_sync_at DATETIME,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS snapshots (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        data_source_id TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        data TEXT,
        schema TEXT,
        metadata TEXT,
        record_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS pipelines (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        config TEXT,
        enabled BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        schedule TEXT,
        pipeline_id TEXT,
        data_source_id TEXT,
        status TEXT DEFAULT 'idle',
        enabled BOOLEAN DEFAULT 1,
        last_run DATETIME,
        next_run DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        context TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS webhooks (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        events TEXT,
        enabled BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);
  }

  // Projects
  getProjects() {
    return this.query(`SELECT * FROM projects ORDER BY created_at DESC`);
  }

  getProject(id: string) {
    const results = this.query(`SELECT * FROM projects WHERE id = ?`, [id]);
    return results[0] || null;
  }

  createProject(project: any) {
    const id = project.id || `proj_${Date.now()}`;
    this.run(
      `INSERT INTO projects (id, name, description, data_path, created_at, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, project.name, project.description || '', project.dataPath || `./data/projects/${id}`]
    );
    return this.getProject(id);
  }

  updateProject(id: string, updates: any) {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = datetime(\'now\')');
    values.push(id);

    this.run(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return true;
  }

  deleteProject(id: string) {
    this.run(`DELETE FROM projects WHERE id = ?`, [id]);
    return true;
  }

  // Data Sources
  getDataSources(projectId?: string) {
    if (projectId) {
      return this.query(`SELECT * FROM data_sources WHERE project_id = ? ORDER BY created_at DESC`, [projectId]);
    }
    return this.query(`SELECT * FROM data_sources ORDER BY created_at DESC`);
  }

  getDataSource(id: string) {
    const results = this.query(`SELECT * FROM data_sources WHERE id = ?`, [id]);
    if (results.length === 0) return null;
    
    const ds = results[0];
    return {
      ...ds,
      config: ds.config ? JSON.parse(ds.config) : {},
      enabled: Boolean(ds.enabled),
      lastSyncAt: ds.last_sync_at ? new Date(ds.last_sync_at) : undefined,
      createdAt: new Date(ds.created_at),
      updatedAt: new Date(ds.updated_at)
    };
  }

  createDataSource(projectId: string, dataSource: any) {
    const id = dataSource.id || `ds_${Date.now()}`;
    this.run(
      `INSERT INTO data_sources (id, project_id, name, type, config, status, enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        id,
        projectId,
        dataSource.name,
        dataSource.type,
        JSON.stringify(dataSource.config || {}),
        dataSource.status || 'idle',
        dataSource.enabled !== false ? 1 : 0
      ]
    );
    return this.getDataSource(id);
  }

  updateDataSource(id: string, updates: any) {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.config !== undefined) {
      fields.push('config = ?');
      values.push(JSON.stringify(updates.config));
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.enabled !== undefined) {
      fields.push('enabled = ?');
      values.push(updates.enabled ? 1 : 0);
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = datetime(\'now\')');
    values.push(id);

    this.run(
      `UPDATE data_sources SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return true;
  }

  deleteDataSource(id: string) {
    this.run(`DELETE FROM data_sources WHERE id = ?`, [id]);
    return true;
  }

  // Jobs
  getJobs(projectId?: string) {
    let query = `SELECT * FROM jobs`;
    const params = [];

    if (projectId) {
      query += " WHERE project_id = ?";
      params.push(projectId);
    }

    query += " ORDER BY created_at DESC";

    const results = this.query(query, params);
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
    const results = this.query(`SELECT * FROM jobs WHERE id = ?`, [id]);
    if (results.length === 0) return null;
    
    const job = results[0];
    return {
      ...job,
      enabled: Boolean(job.enabled),
      lastRun: job.last_run ? new Date(job.last_run) : undefined,
      nextRun: job.next_run ? new Date(job.next_run) : undefined,
      createdAt: new Date(job.created_at),
      updatedAt: new Date(job.updated_at)
    };
  }

  createJob(job: any) {
    const id = job.id || `job_${Date.now()}`;
    this.run(
      `INSERT INTO jobs (id, project_id, name, type, schedule, pipeline_id, data_source_id, status, enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        id,
        job.projectId || 'default',
        job.name,
        job.type || 'manual',
        job.schedule || null,
        job.pipelineId || null,
        job.dataSourceId || null,
        job.status || 'idle',
        job.enabled !== false ? 1 : 0
      ]
    );
    return this.getJob(id);
  }

  updateJob(id: string, updates: any) {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.schedule !== undefined) {
      fields.push('schedule = ?');
      values.push(updates.schedule);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.enabled !== undefined) {
      fields.push('enabled = ?');
      values.push(updates.enabled ? 1 : 0);
    }
    if (updates.lastRun !== undefined) {
      fields.push('last_run = ?');
      values.push(updates.lastRun);
    }
    if (updates.nextRun !== undefined) {
      fields.push('next_run = ?');
      values.push(updates.nextRun);
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = datetime(\'now\')');
    values.push(id);

    this.run(
      `UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return true;
  }

  deleteJob(id: string) {
    this.run(`DELETE FROM jobs WHERE id = ?`, [id]);
    return true;
  }

  // Pipelines
  getPipelines(projectId?: string) {
    if (projectId) {
      return this.query(`SELECT * FROM pipelines WHERE project_id = ? ORDER BY created_at DESC`, [projectId]);
    }
    return this.query(`SELECT * FROM pipelines ORDER BY created_at DESC`);
  }

  getPipeline(id: string) {
    const results = this.query(`SELECT * FROM pipelines WHERE id = ?`, [id]);
    if (results.length === 0) return null;
    
    const pipeline = results[0];
    return {
      ...pipeline,
      config: pipeline.config ? JSON.parse(pipeline.config) : {},
      enabled: Boolean(pipeline.enabled),
      createdAt: new Date(pipeline.created_at),
      updatedAt: new Date(pipeline.updated_at)
    };
  }

  createPipeline(projectId: string, pipelineData: any) {
    const id = pipelineData.id || `pipeline_${Date.now()}`;
    this.run(
      `INSERT INTO pipelines (id, project_id, name, description, config, enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        id,
        projectId,
        pipelineData.name,
        pipelineData.description || '',
        JSON.stringify(pipelineData.config || {}),
        pipelineData.enabled !== false ? 1 : 0
      ]
    );
    return this.getPipeline(id);
  }

  updatePipeline(id: string, updates: any) {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.config !== undefined) {
      fields.push('config = ?');
      values.push(JSON.stringify(updates.config));
    }
    if (updates.enabled !== undefined) {
      fields.push('enabled = ?');
      values.push(updates.enabled ? 1 : 0);
    }

    if (fields.length === 0) return null;

    fields.push('updated_at = datetime(\'now\')');
    values.push(id);

    this.run(
      `UPDATE pipelines SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return this.getPipeline(id);
  }

  deletePipeline(id: string) {
    this.run(`DELETE FROM pipelines WHERE id = ?`, [id]);
    return true;
  }

  // Logs
  getLogs(projectId?: string, limit: number = 100) {
    if (projectId) {
      return this.query(
        `SELECT * FROM logs WHERE project_id = ? ORDER BY created_at DESC LIMIT ?`,
        [projectId, limit]
      );
    }
    return this.query(
      `SELECT * FROM logs ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
  }

  createLog(log: any) {
    const id = log.id || `log_${Date.now()}`;
    this.run(
      `INSERT INTO logs (id, project_id, level, message, context, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        id,
        log.projectId || null,
        log.level,
        log.message,
        log.context || null,
        log.metadata ? JSON.stringify(log.metadata) : null
      ]
    );
    return { id };
  }

  close() {
    if (this.db) {
      try {
        this.db.close();
        this.db = null;
        console.log("Database closed successfully");
      } catch (error) {
        console.error("Error closing database:", error);
      }
    }
  }
}
