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
  steps: [Schema.Types.Mixed],
  inputSourceIds: [String],
  outputConfig: Schema.Types.Mixed,
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

const PipelineExecutionSchema = new Schema({
  _id: { type: String, required: true },
  pipelineId: { type: String, required: true, index: true },
  projectId: { type: String, required: true, index: true },
  status: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: Date,
  duration: Number,
  inputRecords: { type: Number, default: 0 },
  outputRecords: { type: Number, default: 0 },
  recordsProcessed: { type: Number, default: 0 },
  steps: [Schema.Types.Mixed],
  error: String,
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

// Schema for Data Dictionary entries
const DataDictionarySchema = new Schema({
  _id: { type: String, required: true },
  projectId: { type: String, required: true, index: true },
  dataSourceId: { type: String, required: true, index: true },
  businessName: { type: String, required: true },
  technicalName: { type: String, required: true },
  description: String,
  category: String,
  domain: String,
  tags: [String],
  fields: [Schema.Types.Mixed],
  relationships: [Schema.Types.Mixed],
  dataQuality: Schema.Types.Mixed,
  lineage: Schema.Types.Mixed,
  owner: String,
  steward: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

DataDictionarySchema.index({ projectId: 1, dataSourceId: 1 });
DataDictionarySchema.index({ businessName: 'text', technicalName: 'text', description: 'text' });

// ==================== MODELS ====================

let Project: Model<any>;
let DataSource: Model<any>;
let Pipeline: Model<any>;
let Job: Model<any>;
let Log: Model<any>;
let Webhook: Model<any>;
let Snapshot: Model<any>;
let ImportedData: Model<any>;
let PipelineExecution: Model<any>;
let DataDictionary: Model<any>;

// ==================== DATABASE CLASS ====================

export class MongoDatabase {
  private static instance: MongoDatabase;
  private connectionString: string;
  private isConnected: boolean = false;

  private constructor() {
    // Default to local MongoDB instance using IPv4 (127.0.0.1 instead of localhost)
    // This prevents IPv6 connection issues on Windows
    this.connectionString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lorsync';
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
      PipelineExecution = mongoose.models.PipelineExecution || mongoose.model('PipelineExecution', PipelineExecutionSchema);
      DataDictionary = mongoose.models.DataDictionary || mongoose.model('DataDictionary', DataDictionarySchema);

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

  async getProjects() {
    if (!this.isConnected) throw new Error("Database not connected");
    return await Project.find().sort({ createdAt: -1 }).lean();
  }

  async getProject(id: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    return await Project.findById(id).lean();
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

  async getDataSources(projectId?: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    const query = projectId ? { projectId } : {};
    const docs = await DataSource.find(query).sort({ createdAt: -1 }).lean();
    // Map MongoDB's _id to id for frontend compatibility
    return docs.map(doc => ({
      ...doc,
      id: doc._id,
      _id: undefined
    }));
  }

  async getDataSource(id: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    const doc: any = await DataSource.findById(id).lean();
    if (!doc) return null;
    // Map MongoDB's _id to id for frontend compatibility
    return {
      ...doc,
      id: doc._id,
      _id: undefined
    };
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
    const obj = doc.toObject();
    // Map MongoDB's _id to id for frontend compatibility
    return {
      ...obj,
      id: obj._id,
      _id: undefined
    };
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

  async getPipelines(projectId?: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    const query = projectId ? { projectId } : {};
    const docs = await Pipeline.find(query).sort({ createdAt: -1 }).lean();
    // Map _id to id for frontend
    return docs.map(doc => ({
      ...doc,
      id: doc._id,
      _id: undefined
    }));
  }

  async getPipeline(id: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    const doc: any = await Pipeline.findById(id).lean();
    if (!doc) return null;
    
    console.log('[MongoDB] getPipeline raw result:', doc);
    
    // Ensure arrays exist even if null/undefined in database
    const result = {
      ...doc,
      id: doc._id,
      _id: undefined,
      inputSourceIds: doc.inputSourceIds || [],
      steps: doc.steps || []
    };
    
    console.log('[MongoDB] getPipeline processed result:', {
      id: result.id,
      name: result.name,
      inputSourceIds: result.inputSourceIds,
      stepsCount: result.steps.length
    });
    
    return result;
  }

  async createPipeline(projectId: string, pipelineData: any) {
    if (!this.isConnected) throw new Error("Database not connected");
    const id = pipelineData.id || `pipeline_${Date.now()}`;
    const doc = new Pipeline({
      _id: id,
      projectId,
      name: pipelineData.name,
      description: pipelineData.description || '',
      steps: pipelineData.steps || [],
      inputSourceIds: pipelineData.inputSourceIds || [],
      config: pipelineData.config || {},
      enabled: pipelineData.enabled !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await doc.save();
    const obj = doc.toObject();
    // Ensure id is mapped from _id for frontend
    return {
      ...obj,
      id: obj._id,
      _id: obj._id
    };
  }

  async updatePipeline(id: string, updates: any) {
    if (!this.isConnected) throw new Error("Database not connected");
    
    console.log('[MongoDB] Updating pipeline:', id);
    console.log('[MongoDB] Updates:', updates);
    console.log('[MongoDB] Updates inputSourceIds:', updates.inputSourceIds);
    
    const result = await Pipeline.findByIdAndUpdate(
      id,
      { 
        ...updates, 
        _id: id, // Preserve ID
        updatedAt: new Date() 
      },
      { new: true, runValidators: false }
    ).lean();
    
    console.log('[MongoDB] Updated pipeline raw result:', result);
    
    if (!result) return null;
    
    const processedResult = {
      ...result,
      id: result._id,
      _id: undefined,
      inputSourceIds: result.inputSourceIds || [],
      steps: result.steps || []
    };
    
    console.log('[MongoDB] Updated pipeline processed result:', {
      id: processedResult.id,
      name: processedResult.name,
      inputSourceIds: processedResult.inputSourceIds,
      stepsCount: processedResult.steps.length
    });
    
    return processedResult;
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

  async getSnapshots(dataSourceId: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    const docs = await Snapshot.find({ dataSourceId }).sort({ version: -1 }).lean();
    // Map MongoDB's _id to id for frontend compatibility
    return docs.map(doc => ({
      ...doc,
      id: doc._id,
      _id: undefined
    }));
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
    const obj = doc.toObject();
    // Map MongoDB's _id to id for frontend compatibility
    return {
      ...obj,
      id: obj._id,
      _id: undefined
    };
  }

  async getSnapshot(id: string): Promise<any | null> {
    if (!this.isConnected) throw new Error("Database not connected");
    
    const snapshot = await Snapshot.findById(id).lean();
    if (!snapshot) return null;
    
    return {
      ...snapshot,
      id: snapshot._id,
    };
  }

  async deleteSnapshot(id: string) {
    if (!this.isConnected) throw new Error("Database not connected");
    const result = await Snapshot.findByIdAndDelete(id);
    // Also delete associated imported data
    await ImportedData.deleteMany({ snapshotId: id });
    return result !== null;
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
    const version = ((latestSnapshot as any)?.version || 0) + 1;

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

  // ==================== PIPELINE EXECUTION METHODS ====================

  async storePipelineExecution(execution: any): Promise<void> {
    try {
      await PipelineExecution.create({
        _id: execution.id,
        pipelineId: execution.pipelineId,
        projectId: execution.projectId,
        status: execution.status,
        startTime: execution.startTime,
        endTime: execution.endTime,
        duration: execution.duration,
        inputRecords: execution.inputRecords,
        outputRecords: execution.outputRecords,
        recordsProcessed: execution.recordsProcessed,
        steps: execution.steps,
        error: execution.error,
      });
      
      logger.info('Pipeline execution stored', 'database', { executionId: execution.id });
    } catch (error) {
      logger.error('Failed to store pipeline execution', 'database', { error, executionId: execution.id });
      throw error;
    }
  }

  async getPipelineExecutions(projectId: string, pipelineId?: string): Promise<any[]> {
    try {
      const query: any = { projectId };
      if (pipelineId) {
        query.pipelineId = pipelineId;
      }

      const executions = await PipelineExecution.find(query)
        .sort({ startTime: -1 })
        .lean();

      return executions.map((exec: any) => ({
        id: exec._id,
        pipelineId: exec.pipelineId,
        projectId: exec.projectId,
        status: exec.status,
        startTime: exec.startTime,
        endTime: exec.endTime,
        duration: exec.duration,
        inputRecords: exec.inputRecords,
        outputRecords: exec.outputRecords,
        recordsProcessed: exec.recordsProcessed,
        steps: exec.steps,
        error: exec.error,
        createdAt: exec.createdAt,
      }));
    } catch (error) {
      logger.error('Failed to get pipeline executions', 'database', { error, projectId });
      throw error;
    }
  }

  async getPipelineExecution(executionId: string): Promise<any | null> {
    try {
      const execution: any = await PipelineExecution.findById(executionId).lean();
      
      if (!execution) {
        return null;
      }

      return {
        id: execution._id,
        pipelineId: execution.pipelineId,
        projectId: execution.projectId,
        status: execution.status,
        startTime: execution.startTime,
        endTime: execution.endTime,
        duration: execution.duration,
        inputRecords: execution.inputRecords,
        outputRecords: execution.outputRecords,
        recordsProcessed: execution.recordsProcessed,
        steps: execution.steps,
        error: execution.error,
        createdAt: execution.createdAt,
      };
    } catch (error) {
      logger.error('Failed to get pipeline execution', 'database', { error, executionId });
      throw error;
    }
  }

  // ==================== DATA DICTIONARY ====================

  async createDictionaryEntry(entry: any): Promise<any> {
    if (!this.isConnected) throw new Error("Database not connected");
    
    const doc = new DataDictionary({
      _id: entry.id,
      ...entry
    });
    
    await doc.save();
    const saved = doc.toObject();
    return {
      ...saved,
      id: saved._id
    };
  }

  async getDictionaryEntries(projectId?: string): Promise<any[]> {
    if (!this.isConnected) throw new Error("Database not connected");
    
    const query = projectId ? { projectId } : {};
    const entries = await DataDictionary.find(query)
      .sort({ updatedAt: -1 })
      .lean();
    
    return entries.map((entry: any) => ({
      ...entry,
      id: entry._id,
    }));
  }

  async getDictionaryEntry(id: string): Promise<any> {
    if (!this.isConnected) throw new Error("Database not connected");
    
    const entry = await DataDictionary.findOne({ _id: id }).lean();
    if (!entry) return null;
    
    return {
      ...entry,
      id: entry._id,
    };
  }

  async updateDictionaryEntry(id: string, updates: any): Promise<any> {
    if (!this.isConnected) throw new Error("Database not connected");
    
    const updated = await DataDictionary.findOneAndUpdate(
      { _id: id },
      { ...updates, _id: id, updatedAt: new Date() },
      { new: true, upsert: false }
    ).lean();
    
    if (!updated) return null;
    
    return {
      ...updated,
      id: updated._id,
    };
  }

  async deleteDictionaryEntry(id: string): Promise<boolean> {
    if (!this.isConnected) throw new Error("Database not connected");
    
    const result = await DataDictionary.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}

