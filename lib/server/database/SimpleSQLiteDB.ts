import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import path from "path";
import fs from "fs";
import { logger } from "../utils/logger";

export class SimpleSQLiteDB {
  private static instance: SimpleSQLiteDB;
  private db: SqlJsDatabase | null = null;
  private dbPath: string;
  private SQL: any = null;

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
      // Initialize sql.js
      if (!this.SQL) {
        this.SQL = await initSqlJs();
      }

      // Load existing database or create new one
      if (fs.existsSync(this.dbPath)) {
        const buffer = fs.readFileSync(this.dbPath);
        this.db = new this.SQL.Database(buffer);
        logger.info("Loaded existing database", "database", { path: this.dbPath }, "SimpleSQLiteDB");
      } else {
        this.db = new this.SQL.Database();
        logger.info("Created new database", "database", { path: this.dbPath }, "SimpleSQLiteDB");
      }

      // Enable foreign keys
      this.db.run("PRAGMA foreign_keys = ON");

      // Create tables
      this.createTables();
      
      // Save to disk
      this.save();

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

  private save(): void {
    if (!this.db) return;
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
  }

  // Helper to run queries and return results
  private query(sql: string, params: any[] = []): any[] {
    if (!this.db) throw new Error("Database not initialized");
    
    const results = this.db.exec(sql, params);
    if (results.length === 0) return [];
    
    const { columns, values } = results[0];
    return values.map(row => {
      const obj: any = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  }

  // Helper to run statements without results
  private run(sql: string, params: any[] = []): void {
    if (!this.db) throw new Error("Database not initialized");
    this.db.run(sql, params);
    this.save();
  }

  private createTables(): void {
    if (!this.db) return;

    // Projects table
    this.db.run(`
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
    this.db.run(`
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
      )
    `);

    // Snapshots table
    this.db.run(`
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
      )
    `);

    // Pipelines table
    this.db.run(`
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
      )
    `);

    // Jobs table
    this.db.run(`
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
      )
    `);

    // Logs table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        context TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Webhooks table
    this.db.run(`
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
      )
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
      this.save();
      this.db.close();
      this.db = null;
    }
  }
}
