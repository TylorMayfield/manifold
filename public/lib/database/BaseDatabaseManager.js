const { app } = require("electron");
const path = require("path");
const fs = require("fs");

class BaseDatabaseManager {
  constructor() {
    // Get app data path, fallback to temp directory if not in Electron
    try {
      this.appDataPath = app.getPath("userData");
    } catch (error) {
      this.appDataPath = require("os").tmpdir();
    }

    this.db = null;
    this.isInitialized = false;
    this.memoryStore = {
      projects: [],
      dataSources: [],
      snapshots: [],
      relationships: [],
      consolidatedModels: [],
    };

    try {
      const Database = require("better-sqlite3");
      this.initializeHubDatabase(Database);
    } catch (error) {
      console.warn(
        "Failed to initialize SQLite database, using memory store:",
        error.message
      );
      this.loadMemoryStore();
      this.isInitialized = true;
    }
  }

  static getInstance() {
    if (!BaseDatabaseManager.instance) {
      BaseDatabaseManager.instance = new BaseDatabaseManager();
    }
    return BaseDatabaseManager.instance;
  }

  // Memory store operations
  getMemoryStorePath() {
    return path.join(this.appDataPath, "manifold-memory-store.json");
  }

  saveMemoryStore() {
    if (this.db) return; // Don't save if using SQLite

    try {
      const storePath = this.getMemoryStorePath();
      fs.writeFileSync(storePath, JSON.stringify(this.memoryStore, null, 2));
      console.log("Memory store saved to:", storePath);
    } catch (error) {
      console.error("Failed to save memory store:", error);
    }
  }

  loadMemoryStore() {
    if (this.db) return; // Don't load if using SQLite

    try {
      const storePath = this.getMemoryStorePath();
      if (fs.existsSync(storePath)) {
        const data = fs.readFileSync(storePath, "utf8");
        this.memoryStore = JSON.parse(data);
        console.log("Memory store loaded from:", storePath);
        console.log("Loaded projects:", this.memoryStore.projects.length);
      } else {
        console.log("No existing memory store found, starting fresh");
      }
    } catch (error) {
      console.error("Failed to load memory store:", error);
      this.memoryStore = {
        projects: [],
        dataSources: [],
        snapshots: [],
        relationships: [],
        consolidatedModels: [],
      };
    }
  }

  // Hub database initialization
  initializeHubDatabase(Database) {
    // Ensure the app data directory exists
    if (!fs.existsSync(this.appDataPath)) {
      fs.mkdirSync(this.appDataPath, { recursive: true });
      console.log(`Created app data directory: ${this.appDataPath}`);
    }

    const hubDbPath = path.join(this.appDataPath, "manifold-hub.db");
    this.db = new Database(hubDbPath);
    this.createHubTables();
    this.isInitialized = true;
  }

  createHubTables() {
    if (!this.db) return;

    // Projects table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_path TEXT NOT NULL
      )
    `);
  }

  // Project database operations (spokes)
  getProjectDatabase(projectId) {
    if (!this.db) {
      throw new Error("Hub database not initialized");
    }

    const projectsDir = path.join(this.appDataPath, "projects");
    const projectDbPath = path.join(projectsDir, `${projectId}.db`);

    // Ensure the projects directory exists
    if (!fs.existsSync(projectsDir)) {
      fs.mkdirSync(projectsDir, { recursive: true });
      console.log(`Created projects directory: ${projectsDir}`);
    }

    const Database = require("better-sqlite3");
    return new Database(projectDbPath);
  }

  initializeProjectDatabase(projectId) {
    try {
      console.log(
        `[DEBUG] Initializing project database for project: ${projectId}`
      );

      // Check if we have a valid hub database
      if (!this.db) {
        throw new Error(
          "Hub database not initialized - cannot create project database"
        );
      }

      const projectDb = this.getProjectDatabase(projectId);
      console.log(
        `[DEBUG] Project database connection established for: ${projectId}`
      );

      // Create project-specific tables
      console.log(`[DEBUG] Creating tables for project: ${projectId}`);

      // Execute table creation with individual error handling
      try {
        projectDb.exec(`
          CREATE TABLE IF NOT EXISTS data_sources (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            config TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            last_sync_at TEXT
          );
        `);
        console.log(
          `[DEBUG] data_sources table created for project: ${projectId}`
        );
      } catch (tableError) {
        console.error(
          `[ERROR] Failed to create data_sources table for project ${projectId}:`,
          tableError
        );
        throw tableError;
      }

      try {
        projectDb.exec(`
          CREATE TABLE IF NOT EXISTS snapshots (
            id TEXT PRIMARY KEY,
            data_source_id TEXT NOT NULL,
            data TEXT NOT NULL,
            metadata TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (data_source_id) REFERENCES data_sources (id)
          );
        `);
        console.log(
          `[DEBUG] snapshots table created for project: ${projectId}`
        );
      } catch (tableError) {
        console.error(
          `[ERROR] Failed to create snapshots table for project ${projectId}:`,
          tableError
        );
        throw tableError;
      }

      try {
        projectDb.exec(`
          CREATE TABLE IF NOT EXISTS relationships (
            id TEXT PRIMARY KEY,
            source_id TEXT NOT NULL,
            target_id TEXT NOT NULL,
            relationship_type TEXT NOT NULL,
            metadata TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (source_id) REFERENCES data_sources (id),
            FOREIGN KEY (target_id) REFERENCES data_sources (id)
          );
        `);
        console.log(
          `[DEBUG] relationships table created for project: ${projectId}`
        );
      } catch (tableError) {
        console.error(
          `[ERROR] Failed to create relationships table for project ${projectId}:`,
          tableError
        );
        throw tableError;
      }

      try {
        projectDb.exec(`
          CREATE TABLE IF NOT EXISTS consolidated_models (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            model_data TEXT NOT NULL,
            metadata TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
        console.log(
          `[DEBUG] consolidated_models table created for project: ${projectId}`
        );
      } catch (tableError) {
        console.error(
          `[ERROR] Failed to create consolidated_models table for project ${projectId}:`,
          tableError
        );
        throw tableError;
      }

      // Verify tables were created
      const tables = projectDb
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all();
      console.log(
        `[DEBUG] Tables created for project ${projectId}:`,
        tables.map((t) => t.name)
      );

      // Specifically check for data_sources table
      const dataSourcesTable = projectDb
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='data_sources'"
        )
        .all();
      console.log(
        `[DEBUG] data_sources table verification for project ${projectId}:`,
        dataSourcesTable.length > 0 ? "EXISTS" : "NOT FOUND"
      );

      projectDb.close();
      console.log(
        `[SUCCESS] Project database initialized successfully for project: ${projectId}`
      );
    } catch (error) {
      console.error(
        `[ERROR] Failed to initialize project database for ${projectId}:`,
        error
      );
      console.error(`[ERROR] Error stack:`, error.stack);
      throw error;
    }
  }

  // Project operations for repositories
  getProjects() {
    if (this.db) {
      const stmt = this.db.prepare(
        "SELECT * FROM projects ORDER BY created_at DESC"
      );
      return stmt.all();
    } else {
      return this.memoryStore.projects;
    }
  }

  getProject(id) {
    if (this.db) {
      const stmt = this.db.prepare("SELECT * FROM projects WHERE id = ?");
      const result = stmt.get(id);
      return result;
    } else {
      return this.memoryStore.projects.find((p) => p.id === id);
    }
  }

  // Utility methods
  close() {
    if (this.db) {
      this.db.close();
    } else {
      this.saveMemoryStore();
    }
  }
}

module.exports = { BaseDatabaseManager };
