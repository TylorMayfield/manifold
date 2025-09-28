const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Database path
const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "manifold.db");

if (!fs.existsSync(dbPath)) {
  console.error("Database not found. Please run `node scripts/init-db.js` first.");
  process.exit(1);
}

console.log("Running migration v2 on database:", dbPath);

const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Check current version
const migration = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'")
  .get();

if (!migration) {
  // Create migrations table
  db.exec(`
    CREATE TABLE migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      description TEXT
    );
  `);
  console.log("Created migrations table");
}

// Check if v2 already applied
const existingV2 = db
  .prepare("SELECT * FROM migrations WHERE version = 'v2'")
  .get();

if (existingV2) {
  console.log("Migration v2 already applied. Skipping...");
  db.close();
  process.exit(0);
}

console.log("Applying migration v2...");

// Begin transaction
db.exec("BEGIN TRANSACTION");

try {
  // Helper function to check if table exists
  const tableExists = (tableName) => {
    const result = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
      .get(tableName);
    return !!result;
  };

  // Helper function to check if column exists
  const columnExists = (tableName, columnName) => {
    try {
      const result = db.prepare(`PRAGMA table_info(${tableName})`).all();
      return result.some(col => col.name === columnName);
    } catch {
      return false;
    }
  };

  // 1. Add webhook_configs table
  if (!tableExists('webhook_configs')) {
    db.exec(`
      CREATE TABLE webhook_configs (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        pipeline_id TEXT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('slack', 'discord', 'webhook')),
        url TEXT NOT NULL,
        secret TEXT,
        headers TEXT DEFAULT '{}',
        template_config TEXT DEFAULT '{}',
        events TEXT NOT NULL DEFAULT '["start","success","failure","complete"]',
        is_enabled BOOLEAN DEFAULT true,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      );
    `);
    console.log('Created webhook_configs table');
  }

  // 2. Add webhook_deliveries table for tracking delivery history
  if (!tableExists('webhook_deliveries')) {
    db.exec(`
      CREATE TABLE webhook_deliveries (
        id TEXT PRIMARY KEY,
        webhook_config_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending', 'success', 'failed', 'retry')),
        http_status INTEGER,
        response_body TEXT,
        error_message TEXT,
        attempt_count INTEGER DEFAULT 1,
        delivered_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (webhook_config_id) REFERENCES webhook_configs (id) ON DELETE CASCADE
      );
    `);
    console.log('Created webhook_deliveries table');
  }

  // 3. Add datasource_schedules table for enhanced scheduling
  if (!tableExists('datasource_schedules')) {
    db.exec(`
      CREATE TABLE datasource_schedules (
        id TEXT PRIMARY KEY,
        data_source_id TEXT NOT NULL UNIQUE,
        cron_expression TEXT,
        timezone TEXT DEFAULT 'UTC',
        is_one_time BOOLEAN DEFAULT false,
        is_enabled BOOLEAN DEFAULT true,
        next_run_at DATETIME,
        last_run_at DATETIME,
        last_run_status TEXT,
        failure_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (data_source_id) REFERENCES data_sources (id) ON DELETE CASCADE
      );
    `);
    console.log('Created datasource_schedules table');
  }

  // 4. Enhanced job_logs table (replace existing logs table functionality)
  if (!tableExists('job_logs')) {
    db.exec(`
      CREATE TABLE job_logs (
        id TEXT PRIMARY KEY,
        job_id TEXT,
        job_execution_id TEXT,
        data_source_id TEXT,
        pipeline_id TEXT,
        level TEXT NOT NULL CHECK(level IN ('debug', 'info', 'warn', 'error')),
        category TEXT NOT NULL,
        message TEXT NOT NULL,
        details TEXT,
        progress_percent INTEGER DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE,
        FOREIGN KEY (job_execution_id) REFERENCES job_executions (id) ON DELETE CASCADE,
        FOREIGN KEY (data_source_id) REFERENCES data_sources (id) ON DELETE CASCADE
      );
    `);
    console.log('Created job_logs table');
  }

  // 5. Add pipeline_executions table (pipelines table already exists with different schema)
  if (!tableExists('pipeline_executions')) {
    db.exec(`
      CREATE TABLE pipeline_executions (
        id TEXT PRIMARY KEY,
        pipeline_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('running', 'completed', 'failed', 'cancelled')),
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        error_message TEXT,
        stats TEXT DEFAULT '{}',
        FOREIGN KEY (pipeline_id) REFERENCES pipelines (id) ON DELETE CASCADE
      );
    `);
    console.log('Created pipeline_executions table');
  }

  // 7. Add new columns to existing tables
  
  // Add webhook notification settings to jobs table
  if (!columnExists('jobs', 'webhook_enabled')) {
    db.exec(`ALTER TABLE jobs ADD COLUMN webhook_enabled BOOLEAN DEFAULT false;`);
    console.log('Added webhook_enabled column to jobs table');
  }
  
  if (!columnExists('jobs', 'webhook_events')) {
    db.exec(`ALTER TABLE jobs ADD COLUMN webhook_events TEXT DEFAULT '["start","success","failure"]';`);
    console.log('Added webhook_events column to jobs table');
  }

  // Add schedule reference to data_sources
  if (!columnExists('data_sources', 'last_sync_at')) {
    db.exec(`ALTER TABLE data_sources ADD COLUMN last_sync_at DATETIME;`);
    console.log('Added last_sync_at column to data_sources table');
  }
  
  if (!columnExists('data_sources', 'sync_status')) {
    db.exec(`ALTER TABLE data_sources ADD COLUMN sync_status TEXT DEFAULT 'never';`);
    console.log('Added sync_status column to data_sources table');
  }

  // 8. Create indices for performance
  db.exec(`
    CREATE INDEX idx_webhook_configs_project ON webhook_configs(project_id);
    CREATE INDEX idx_webhook_configs_type ON webhook_configs(type);
    CREATE INDEX idx_webhook_deliveries_config ON webhook_deliveries(webhook_config_id);
    CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
    CREATE INDEX idx_datasource_schedules_next_run ON datasource_schedules(next_run_at);
    CREATE INDEX idx_job_logs_job ON job_logs(job_id);
    CREATE INDEX idx_job_logs_timestamp ON job_logs(timestamp DESC);
    CREATE INDEX idx_pipelines_project ON pipelines(project_id);
    CREATE INDEX idx_pipeline_executions_pipeline ON pipeline_executions(pipeline_id);
  `);

  // 9. Record migration
  db.prepare(
    "INSERT INTO migrations (version, description) VALUES (?, ?)"
  ).run(
    "v2", 
    "Added webhook support, enhanced scheduling, pipeline management, and improved logging"
  );

  // Commit transaction
  db.exec("COMMIT");
  console.log("✅ Migration v2 applied successfully!");

  // Display summary
  console.log("\nNew tables created:");
  console.log("- webhook_configs: Store webhook configurations");
  console.log("- webhook_deliveries: Track webhook delivery attempts");
  console.log("- datasource_schedules: Enhanced scheduling for data sources");
  console.log("- job_logs: Comprehensive logging with progress tracking");
  console.log("- pipelines: Proper pipeline management");
  console.log("- pipeline_executions: Track pipeline execution history");
  console.log("\nNew columns added:");
  console.log("- jobs.webhook_enabled, jobs.webhook_events");
  console.log("- data_sources.last_sync_at, data_sources.sync_status");

} catch (error) {
  // Rollback on error
  db.exec("ROLLBACK");
  console.error("❌ Migration failed:", error.message);
  throw error;
} finally {
  db.close();
}