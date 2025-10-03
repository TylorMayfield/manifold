import mongoose, { Schema, Model } from 'mongoose';
import { logger } from '../utils/logger';

// ==================== SCHEMAS ====================

const ProjectSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  dataPath: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const DataSourceSchema = new Schema({
  _id: { type: String, required: true },
  projectId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  config: Schema.Types.Mixed,
  status: { type: String, default: 'idle' },
  enabled: { type: Boolean, default: true },
  lastSyncAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PipelineSchema = new Schema({
  _id: { type: String, required: true },
  projectId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: String,
  config: Schema.Types.Mixed,
  enabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const JobSchema = new Schema({
  _id: { type: String, required: true },
  projectId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  schedule: String,
  pipelineId: String,
  dataSourceId: String,
  status: { type: String, default: 'idle' },
  enabled: { type: Boolean, default: true },
  lastRun: Date,
  nextRun: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const LogSchema = new Schema({
  _id: { type: String, required: true },
  projectId: String,
  level: { type: String, required: true },
  message: { type: String, required: true },
  context: String,
  metadata: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

const WebhookSchema = new Schema({
  _id: { type: String, required: true },
  projectId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  events: [String],
  enabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SnapshotSchema = new Schema({
  _id: { type: String, required: true },
  projectId: { type: String, required: true, index: true },
  dataSourceId: { type: String, required: true, index: true },
  version: { type: Number, default: 1 },
  schema: Schema.Types.Mixed,
  metadata: Schema.Types.Mixed,
  recordCount: { type: Number, default: 0 },
  status: { type: String, default: 'active', enum: ['active', 'archived', 'deleted'] },
  createdAt: { type: Date, default: Date.now }
});

// Add compound index for efficient queries
SnapshotSchema.index({ projectId: 1, dataSourceId: 1, version: -1 });
SnapshotSchema.index({ dataSourceId: 1, version: -1 });
SnapshotSchema.index({ status: 1, createdAt: -1 });

// Schema for storing actual imported data records
// Each record stores a single row of data for a given snapshot version
const ImportedDataSchema = new Schema({
  snapshotId: { type: String, required: true, index: true },
  dataSourceId: { type: String, required: true, index: true },
  projectId: { type: String, required: true, index: true },
  version: { type: Number, required: true, index: true },
  data: Schema.Types.Mixed,  // The actual record data
  rowIndex: { type: Number, required: true },  // Original row position
  importedAt: { type: Date, default: Date.now, index: true }
});

// Add compound indexes for efficient querying
ImportedDataSchema.index({ snapshotId: 1, rowIndex: 1 });
ImportedDataSchema.index({ dataSourceId: 1, version: -1, rowIndex: 1 });
ImportedDataSchema.index({ projectId: 1, dataSourceId: 1, version: -1 });

// ==================== MODELS ====================

let Project: Model<any>;
let DataSource: Model<any>;
let Pipeline: Model<any>;
let Job: Model<any>;
let Log: Model<any>;
let Webhook: Model<any>;
let Snapshot: Model<any>;
let ImportedData: Model<any>;

// ==================== DATABASE CLASS ====================

export class MongoDatabase {
  private static instance: MongoDatabase;
  private connectionString: string;
  private isConnected: boolean = false;

  private constructor() {
    // Default to local MongoDB instance using IPv4 (127.0.0.1 instead of localhost)
    // This prevents IPv6 connection issues on Windows
    this.connectionString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/manifold';
  }

  static getInstance(): MongoDatabase {
    if (!MongoDatabase.instance) {
      MongoDatabase.instance = new MongoDatabase();
    }
    return MongoDatabase.instance;
  }

  async initialize(connectionString?: string): Promise<void> {
    try {
      // Skip initialization during build phase
      if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.CI) {
        console.log("Skipping database initialization during build phase");
        return;
      }

      // If already connected with the same connection string, just return
      if (this.isConnected && mongoose.connection.readyState === 1) {
        if (!connectionString || connectionString === this.connectionString) {
          console.log('[MongoDB] Already connected, reusing connection');
          return;
        }
      }

      if (connectionString) {
        this.connectionString = connectionString;
      }

      // If mongoose is already connected but to a different string, disconnect first
      if (mongoose.connection.readyState !== 0) {
        console.log('[MongoDB] Disconnecting existing connection...');
        await mongoose.disconnect();
      }

      console.log('[MongoDB] Connecting to:', this.connectionString.replace(/\/\/.*@/, '//***@'));

      await mongoose.connect(this.connectionString, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        family: 4, // Force IPv4
      });

      this.isConnected = true;

      // Initialize models
      Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
      DataSource = mongoose.models.DataSource || mongoose.model('DataSource', DataSourceSchema);
      Pipeline = mongoose.models.Pipeline || mongoose.model('Pipeline', PipelineSchema);
      Job = mongoose.models.Job || mongoose.model('Job', JobSchema);
      Log = mongoose.models.Log || mongoose.model('Log', LogSchema);
      Webhook = mongoose.models.Webhook || mongoose.model('Webhook', WebhookSchema);
      Snapshot = mongoose.models.Snapshot || mongoose.model('Snapshot', SnapshotSchema);
      ImportedData = mongoose.models.ImportedData || mongoose.model('ImportedData', ImportedDataSchema);

      logger.success(
        "MongoDB connected successfully",
        "database",
        { connectionString: this.connectionString.replace(/\/\/.*@/, '//***@') },
        "MongoDatabase"
      );

      // Create indexes
      await this.createIndexes();

    } catch (error) {
      this.isConnected = false;
      logger.error(
        "Failed to connect to MongoDB",
        "database",
        { error, connectionString: this.connectionString.replace(/\/\/.*@/, '//***@') },
        "MongoDatabase"
      );
      throw error;
    }
  }

  private async createIndexes(): Promise<void> {
    try {
      await DataSource.createIndexes();
      await Pipeline.createIndexes();
      await Job.createIndexes();
      await Webhook.createIndexes();
      await Snapshot.createIndexes();
      console.log('[MongoDB] Indexes created successfully');
    } catch (error) {
      console.error('[MongoDB] Error creating indexes:', error);
    }
  }

  async updateConnectionString(newConnectionString: string): Promise<void> {
    if (this.isConnected) {
      await this.close();
    }
    await this.initialize(newConnectionString);
  }

  getConnectionString(): string {
    return this.connectionString.replace(/\/\/.*@/, '//***@');
  }

  isHealthy(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  async close(): Promise<void> {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('[MongoDB] Disconnected successfully');
    }
  }

  // ==================== PROJECTS ====================

  getProjects() {
    if (!this.isConnected) throw new Error("Database not connected");
    return Project.find().sort({ createdAt: -1 }).lean();
  }

  getProject(id: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    return Project.findById(id).lean();
  }

  async createProject(project: any) {
    if (!this.isConnected) throw new Error("Database not connected");
    const id = project.id || `proj_${Date.now()}`;
    const doc = new Project({
      _id: id,
      name: project.name,
      description: project.description || '',
      dataPath: project.dataPath || `./data/projects/${id}`,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await doc.save();
    return doc.toObject();
  }

  async updateProject(id: string, updates: any) {
    if (!this.isConnected) throw new Error("Database not connected");
    const result = await Project.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).lean();
    return result;
  }

  async deleteProject(id: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    await Project.findByIdAndDelete(id);
    // Also delete related data
    await DataSource.deleteMany({ projectId: id });
    await Pipeline.deleteMany({ projectId: id });
    await Job.deleteMany({ projectId: id });
    await Webhook.deleteMany({ projectId: id });
    await Snapshot.deleteMany({ projectId: id });
    return true;
  }

  // ==================== DATA SOURCES ====================

  getDataSources(projectId?: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    const query = projectId ? { projectId } : {};
    return DataSource.find(query).sort({ createdAt: -1 }).lean();
  }

  getDataSource(id: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    return DataSource.findById(id).lean();
  }

  async createDataSource(projectId: string, dataSource: any) {
    if (!this.isConnected) throw new Error("Database not connected");
    const id = dataSource.id || `ds_${Date.now()}`;
    const doc = new DataSource({
      _id: id,
      projectId,
      name: dataSource.name,
      type: dataSource.type,
      config: dataSource.config || {},
      status: dataSource.status || 'idle',
      enabled: dataSource.enabled !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await doc.save();
    return doc.toObject();
  }

  async updateDataSource(id: string, updates: any) {
    if (!this.isConnected) throw new Error("Database not connected");
    const result = await DataSource.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).lean();
    return result;
  }

  async deleteDataSource(id: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    await DataSource.findByIdAndDelete(id);
    // Delete related snapshots
    await Snapshot.deleteMany({ dataSourceId: id });
    return true;
  }

  // ==================== PIPELINES ====================

  getPipelines(projectId?: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    const query = projectId ? { projectId } : {};
    return Pipeline.find(query).sort({ createdAt: -1 }).lean();
  }

  getPipeline(id: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    return Pipeline.findById(id).lean();
  }

  async createPipeline(projectId: string, pipelineData: any) {
    if (!this.isConnected) throw new Error("Database not connected");
    const id = pipelineData.id || `pipeline_${Date.now()}`;
    const doc = new Pipeline({
      _id: id,
      projectId,
      name: pipelineData.name,
      description: pipelineData.description || '',
      config: pipelineData.config || {},
      enabled: pipelineData.enabled !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await doc.save();
    return doc.toObject();
  }

  async updatePipeline(id: string, updates: any) {
    if (!this.isConnected) throw new Error("Database not connected");
    const result = await Pipeline.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).lean();
    return result;
  }

  async deletePipeline(id: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    await Pipeline.findByIdAndDelete(id);
    return true;
  }

  // ==================== JOBS ====================

  getJobs(projectId?: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    const query = projectId ? { projectId } : {};
    return Job.find(query).sort({ createdAt: -1 }).lean();
  }

  getJob(id: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    return Job.findById(id).lean();
  }

  async createJob(job: any) {
    if (!this.isConnected) throw new Error("Database not connected");
    const id = job.id || `job_${Date.now()}`;
    const doc = new Job({
      _id: id,
      projectId: job.projectId || 'default',
      name: job.name,
      type: job.type || 'manual',
      schedule: job.schedule,
      pipelineId: job.pipelineId,
      dataSourceId: job.dataSourceId,
      status: job.status || 'idle',
      enabled: job.enabled !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await doc.save();
    return doc.toObject();
  }

  async updateJob(id: string, updates: any) {
    if (!this.isConnected) throw new Error("Database not connected");
    const result = await Job.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).lean();
    return result;
  }

  async deleteJob(id: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    await Job.findByIdAndDelete(id);
    return true;
  }

  // ==================== LOGS ====================

  getLogs(projectId?: string, limit: number = 100) {
    if (!this.isConnected) throw new Error("Database not connected");
    const query = projectId ? { projectId } : {};
    return Log.find(query).sort({ createdAt: -1 }).limit(limit).lean();
  }

  async createLog(log: any) {
    if (!this.isConnected) throw new Error("Database not connected");
    const id = log.id || `log_${Date.now()}`;
    const doc = new Log({
      _id: id,
      projectId: log.projectId,
      level: log.level,
      message: log.message,
      context: log.context,
      metadata: log.metadata,
      createdAt: new Date()
    });
    await doc.save();
    return { id };
  }

  // ==================== WEBHOOKS ====================

  getWebhooks(projectId?: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    const query = projectId ? { projectId } : {};
    return Webhook.find(query).sort({ createdAt: -1 }).lean();
  }

  getWebhook(id: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    return Webhook.findById(id).lean();
  }

  async createWebhook(projectId: string, webhookData: any) {
    if (!this.isConnected) throw new Error("Database not connected");
    const id = webhookData.id || `webhook_${Date.now()}`;
    const doc = new Webhook({
      _id: id,
      projectId,
      name: webhookData.name,
      url: webhookData.url,
      events: webhookData.events || [],
      enabled: webhookData.enabled !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await doc.save();
    return doc.toObject();
  }

  async updateWebhook(id: string, updates: any) {
    if (!this.isConnected) throw new Error("Database not connected");
    const result = await Webhook.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).lean();
    return result;
  }

  async deleteWebhook(id: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    await Webhook.findByIdAndDelete(id);
    return true;
  }

  // ==================== SNAPSHOTS ====================

  getSnapshots(dataSourceId: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    return Snapshot.find({ dataSourceId }).sort({ version: -1 }).lean();
  }

  async createSnapshot(snapshot: any) {
    if (!this.isConnected) throw new Error("Database not connected");
    const id = snapshot.id || `snap_${Date.now()}`;
    const doc = new Snapshot({
      _id: id,
      projectId: snapshot.projectId,
      dataSourceId: snapshot.dataSourceId,
      version: snapshot.version || 1,
      schema: snapshot.schema,
      metadata: snapshot.metadata,
      recordCount: snapshot.recordCount || 0,
      status: 'active',
      createdAt: new Date()
    });
    await doc.save();
    return doc.toObject();
  }

  async deleteSnapshot(id: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    await Snapshot.findByIdAndDelete(id);
    // Also delete associated imported data
    await ImportedData.deleteMany({ snapshotId: id });
    return true;
  }

  // ==================== DATA IMPORT/RETRIEVAL ====================

  /**
   * Import data for a data source with versioning
   */
  async importData(params: {
    projectId: string;
    dataSourceId: string;
    data: any[];
    schema?: any;
    metadata?: any;
  }): Promise<{ snapshotId: string; version: number; recordCount: number }> {
    if (!this.isConnected) throw new Error("Database not connected");

    const { projectId, dataSourceId, data, schema, metadata } = params;

    // Get next version number
    const latestSnapshot = await Snapshot.findOne({ projectId, dataSourceId })
      .sort({ version: -1 })
      .lean();
    const version = (latestSnapshot?.version || 0) + 1;

    // Infer schema if not provided
    const inferredSchema = schema || this.inferSchema(data);

    // Create snapshot
    const snapshotId = `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.createSnapshot({
      id: snapshotId,
      projectId,
      dataSourceId,
      version,
      schema: inferredSchema,
      metadata: { ...metadata, importedAt: new Date().toISOString() },
      recordCount: data.length
    });

    // Import data in batches for better performance
    const BATCH_SIZE = 1000;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      const documents = batch.map((record, idx) => ({
        snapshotId,
        dataSourceId,
        projectId,
        version,
        data: record,
        rowIndex: i + idx,
        importedAt: new Date()
      }));
      
      await ImportedData.insertMany(documents, { ordered: false });
    }

    logger.info(`Imported ${data.length} records for data source ${dataSourceId}, version ${version}`, 'database');

    return { snapshotId, version, recordCount: data.length };
  }

  /**
   * Retrieve data for a specific snapshot or latest version
   */
  async getImportedData(params: {
    dataSourceId: string;
    version?: number;
    snapshotId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; totalCount: number; snapshot: any }> {
    if (!this.isConnected) throw new Error("Database not connected");

    const { dataSourceId, version, snapshotId, limit = 50, offset = 0 } = params;

    // Find the snapshot
    let snapshot;
    if (snapshotId) {
      snapshot = await Snapshot.findOne({ _id: snapshotId }).lean();
    } else if (version) {
      snapshot = await Snapshot.findOne({ dataSourceId, version }).lean();
    } else {
      // Get latest version
      snapshot = await Snapshot.findOne({ dataSourceId, status: 'active' })
        .sort({ version: -1 })
        .lean();
    }

    if (!snapshot) {
      return { data: [], totalCount: 0, snapshot: null };
    }

    // Get data records
    const records = await ImportedData.find({ snapshotId: snapshot._id })
      .sort({ rowIndex: 1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const data = records.map(r => r.data);
    const totalCount = snapshot.recordCount || 0;

    return { data, totalCount, snapshot };
  }

  /**
   * Get all versions for a data source
   */
  async getDataVersions(dataSourceId: string): Promise<any[]> {
    if (!this.isConnected) throw new Error("Database not connected");
    
    return Snapshot.find({ dataSourceId, status: 'active' })
      .sort({ version: -1 })
      .select('-_id id version recordCount schema metadata createdAt')
      .lean();
  }

  /**
   * Infer schema from data sample
   */
  private inferSchema(data: any[]): any {
    if (!data || data.length === 0) return { columns: [] };

    const sample = data[0];
    const columns = Object.keys(sample).map(key => {
      const value = sample[key];
      let type = 'string';

      if (typeof value === 'number') {
        type = Number.isInteger(value) ? 'integer' : 'number';
      } else if (typeof value === 'boolean') {
        type = 'boolean';
      } else if (value instanceof Date) {
        type = 'date';
      } else if (value === null) {
        type = 'null';
      }

      return {
        name: key,
        type,
        nullable: true
      };
    });

    return { columns };
  }

  /**
   * Archive old versions based on retention policy
   */
  async archiveOldVersions(dataSourceId: string, keepVersions: number = 5): Promise<number> {
    if (!this.isConnected) throw new Error("Database not connected");

    const snapshots = await Snapshot.find({ dataSourceId, status: 'active' })
      .sort({ version: -1 })
      .lean();

    if (snapshots.length <= keepVersions) {
      return 0; // Nothing to archive
    }

    const toArchive = snapshots.slice(keepVersions);
    const idsToArchive = toArchive.map(s => s._id);

    // Mark as archived
    await Snapshot.updateMany(
      { _id: { $in: idsToArchive } },
      { $set: { status: 'archived' } }
    );

    // Optionally delete the imported data to save space
    // await ImportedData.deleteMany({ snapshotId: { $in: idsToArchive } });

    logger.info(`Archived ${idsToArchive.length} old versions for data source ${dataSourceId}`, 'database');

    return idsToArchive.length;
  }
}

