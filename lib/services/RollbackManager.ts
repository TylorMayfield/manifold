/**
 * RollbackManager - Rollback and Recovery System
 * 
 * Provides comprehensive rollback and recovery functionality for:
 * - Failed pipeline executions
 * - Data corruption scenarios
 * - Accidental data modifications
 * - Disaster recovery
 */

import { logger } from '../utils/logger';

export interface RollbackPoint {
  id: string;
  name: string;
  description?: string;
  type: 'manual' | 'auto' | 'pre-pipeline' | 'scheduled';
  createdAt: Date;
  createdBy?: string;
  
  // What this rollback point captures
  scope: {
    dataSourceIds?: string[];
    pipelineIds?: string[];
    snapshotIds?: string[];
    projectId: string;
  };
  
  // State captured at this point
  state: {
    snapshots: Array<{
      dataSourceId: string;
      snapshotId: string;
      version: number;
      recordCount: number;
    }>;
    pipelines?: Array<{
      pipelineId: string;
      lastExecutionId?: string;
      status: string;
    }>;
  };
  
  // Metadata
  metadata: {
    dataSize: number;
    itemsCaptured: number;
    captureTime: number; // milliseconds
  };
  
  // Expiry
  expiresAt?: Date;
  status: 'active' | 'expired' | 'used' | 'deleted';
}

export interface RollbackOperation {
  id: string;
  rollbackPointId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'partial';
  
  // What was restored
  restored: {
    dataSources: string[];
    snapshots: string[];
    recordsRestored: number;
  };
  
  // Results
  duration?: number;
  errors?: Array<{
    dataSourceId: string;
    error: string;
  }>;
  
  initiatedBy?: string;
  reason?: string;
}

export interface RollbackConfig {
  autoCreateBeforePipeline: boolean;
  autoCreateBeforeImport: boolean;
  retentionDays: number;
  maxRollbackPoints: number;
  enableScheduledBackups: boolean;
  scheduledBackupInterval: number; // hours
}

class RollbackManagerService {
  private rollbackPoints: Map<string, RollbackPoint> = new Map();
  private rollbackHistory: RollbackOperation[] = [];
  private config: RollbackConfig = {
    autoCreateBeforePipeline: true,
    autoCreateBeforeImport: true,
    retentionDays: 30,
    maxRollbackPoints: 50,
    enableScheduledBackups: false,
    scheduledBackupInterval: 24,
  };

  constructor() {
    this.startCleanupScheduler();
  }

  /**
   * Create a new rollback point
   */
  async createRollbackPoint(params: {
    name: string;
    description?: string;
    type: RollbackPoint['type'];
    scope: RollbackPoint['scope'];
    expiresInDays?: number;
    createdBy?: string;
  }): Promise<RollbackPoint> {
    const startTime = Date.now();

    logger.info('Creating rollback point', 'rollback-manager', { name: params.name });

    // Generate unique ID
    const id = `rbp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Capture current state (would integrate with actual database)
    const state = await this.captureCurrentState(params.scope);

    // Calculate expiry
    const expiresAt = params.expiresInDays
      ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + this.config.retentionDays * 24 * 60 * 60 * 1000);

    const rollbackPoint: RollbackPoint = {
      id,
      name: params.name,
      description: params.description,
      type: params.type,
      createdAt: new Date(),
      createdBy: params.createdBy,
      scope: params.scope,
      state,
      metadata: {
        dataSize: this.calculateDataSize(state),
        itemsCaptured: state.snapshots.length,
        captureTime: Date.now() - startTime,
      },
      expiresAt,
      status: 'active',
    };

    this.rollbackPoints.set(id, rollbackPoint);

    // Cleanup old points if we exceed max
    this.enforceMaxRollbackPoints();

    logger.success('Rollback point created', 'rollback-manager', {
      id,
      itemsCaptured: rollbackPoint.metadata.itemsCaptured,
      captureTime: `${rollbackPoint.metadata.captureTime}ms`,
    });

    return rollbackPoint;
  }

  /**
   * Restore data to a previous rollback point
   */
  async restoreFromRollbackPoint(params: {
    rollbackPointId: string;
    reason?: string;
    initiatedBy?: string;
    dryRun?: boolean;
  }): Promise<RollbackOperation> {
    const { rollbackPointId, reason, initiatedBy, dryRun = false } = params;

    logger.info('Starting rollback operation', 'rollback-manager', {
      rollbackPointId,
      dryRun,
    });

    const rollbackPoint = this.rollbackPoints.get(rollbackPointId);
    if (!rollbackPoint) {
      throw new Error(`Rollback point not found: ${rollbackPointId}`);
    }

    if (rollbackPoint.status !== 'active') {
      throw new Error(`Rollback point is not active: ${rollbackPoint.status}`);
    }

    // Create operation record
    const operation: RollbackOperation = {
      id: `rbo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      rollbackPointId,
      startedAt: new Date(),
      status: 'in-progress',
      restored: {
        dataSources: [],
        snapshots: [],
        recordsRestored: 0,
      },
      initiatedBy,
      reason,
    };

    this.rollbackHistory.push(operation);

    try {
      const startTime = Date.now();

      // Perform restoration for each data source
      for (const snapshot of rollbackPoint.state.snapshots) {
        try {
          if (!dryRun) {
            await this.restoreDataSource(snapshot);
          }
          
          operation.restored.dataSources.push(snapshot.dataSourceId);
          operation.restored.snapshots.push(snapshot.snapshotId);
          operation.restored.recordsRestored += snapshot.recordCount;

          logger.info('Data source restored', 'rollback-manager', {
            dataSourceId: snapshot.dataSourceId,
            version: snapshot.version,
            records: snapshot.recordCount,
          });
        } catch (error) {
          operation.errors = operation.errors || [];
          operation.errors.push({
            dataSourceId: snapshot.dataSourceId,
            error: error instanceof Error ? error.message : String(error),
          });

          logger.error('Failed to restore data source', 'rollback-manager', {
            dataSourceId: snapshot.dataSourceId,
            error,
          });
        }
      }

      // Determine final status
      if (operation.errors && operation.errors.length > 0) {
        operation.status = operation.errors.length === rollbackPoint.state.snapshots.length
          ? 'failed'
          : 'partial';
      } else {
        operation.status = 'completed';
      }

      operation.completedAt = new Date();
      operation.duration = Date.now() - startTime;

      // Mark rollback point as used (if not dry run)
      if (!dryRun && operation.status === 'completed') {
        rollbackPoint.status = 'used';
      }

      logger.success('Rollback operation completed', 'rollback-manager', {
        operationId: operation.id,
        status: operation.status,
        dataSourcesRestored: operation.restored.dataSources.length,
        recordsRestored: operation.restored.recordsRestored,
        duration: `${operation.duration}ms`,
        dryRun,
      });

      return operation;
    } catch (error) {
      operation.status = 'failed';
      operation.completedAt = new Date();
      operation.duration = Date.now() - operation.startedAt.getTime();

      logger.error('Rollback operation failed', 'rollback-manager', { error });
      throw error;
    }
  }

  /**
   * Auto-create rollback point before pipeline execution
   */
  async createPrePipelineRollback(params: {
    pipelineId: string;
    pipelineName: string;
    projectId: string;
    dataSourceIds: string[];
    createdBy?: string;
  }): Promise<RollbackPoint | null> {
    if (!this.config.autoCreateBeforePipeline) {
      return null;
    }

    return this.createRollbackPoint({
      name: `Pre-Pipeline: ${params.pipelineName}`,
      description: `Automatic backup before executing pipeline`,
      type: 'pre-pipeline',
      scope: {
        projectId: params.projectId,
        dataSourceIds: params.dataSourceIds,
        pipelineIds: [params.pipelineId],
      },
      expiresInDays: 7, // Pipeline rollbacks expire faster
      createdBy: params.createdBy,
    });
  }

  /**
   * Rollback a failed pipeline execution
   */
  async rollbackFailedPipeline(params: {
    executionId: string;
    pipelineId: string;
    projectId: string;
    reason: string;
    initiatedBy?: string;
  }): Promise<RollbackOperation> {
    logger.info('Rolling back failed pipeline', 'rollback-manager', {
      executionId: params.executionId,
      pipelineId: params.pipelineId,
    });

    // Find the most recent pre-pipeline rollback point
    const rollbackPoint = this.findPrePipelineRollbackPoint(params.pipelineId);

    if (!rollbackPoint) {
      throw new Error(`No rollback point found for pipeline: ${params.pipelineId}`);
    }

    return this.restoreFromRollbackPoint({
      rollbackPointId: rollbackPoint.id,
      reason: params.reason,
      initiatedBy: params.initiatedBy,
    });
  }

  /**
   * Get all rollback points
   */
  getRollbackPoints(filters?: {
    projectId?: string;
    type?: RollbackPoint['type'];
    status?: RollbackPoint['status'];
    dataSourceId?: string;
  }): RollbackPoint[] {
    let points = Array.from(this.rollbackPoints.values());

    if (filters?.projectId) {
      points = points.filter(p => p.scope.projectId === filters.projectId);
    }

    if (filters?.type) {
      points = points.filter(p => p.type === filters.type);
    }

    if (filters?.status) {
      points = points.filter(p => p.status === filters.status);
    }

    if (filters?.dataSourceId) {
      points = points.filter(p =>
        p.scope.dataSourceIds?.includes(filters.dataSourceId!)
      );
    }

    return points.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get rollback history
   */
  getRollbackHistory(filters?: {
    rollbackPointId?: string;
    status?: RollbackOperation['status'];
    limit?: number;
  }): RollbackOperation[] {
    let history = [...this.rollbackHistory];

    if (filters?.rollbackPointId) {
      history = history.filter(h => h.rollbackPointId === filters.rollbackPointId);
    }

    if (filters?.status) {
      history = history.filter(h => h.status === filters.status);
    }

    history.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

    if (filters?.limit) {
      history = history.slice(0, filters.limit);
    }

    return history;
  }

  /**
   * Delete a rollback point
   */
  deleteRollbackPoint(rollbackPointId: string): boolean {
    const point = this.rollbackPoints.get(rollbackPointId);
    if (!point) {
      return false;
    }

    point.status = 'deleted';
    this.rollbackPoints.delete(rollbackPointId);

    logger.info('Rollback point deleted', 'rollback-manager', { rollbackPointId });
    return true;
  }

  /**
   * Get rollback point details
   */
  getRollbackPoint(rollbackPointId: string): RollbackPoint | null {
    return this.rollbackPoints.get(rollbackPointId) || null;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RollbackConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Rollback configuration updated', 'rollback-manager', { config: this.config });
  }

  /**
   * Get configuration
   */
  getConfig(): RollbackConfig {
    return { ...this.config };
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalRollbackPoints: number;
    activeRollbackPoints: number;
    totalRestoreOperations: number;
    successfulRestores: number;
    failedRestores: number;
    totalDataSizeCaptured: number;
  } {
    const points = Array.from(this.rollbackPoints.values());
    
    return {
      totalRollbackPoints: points.length,
      activeRollbackPoints: points.filter(p => p.status === 'active').length,
      totalRestoreOperations: this.rollbackHistory.length,
      successfulRestores: this.rollbackHistory.filter(h => h.status === 'completed').length,
      failedRestores: this.rollbackHistory.filter(h => h.status === 'failed').length,
      totalDataSizeCaptured: points.reduce((sum, p) => sum + p.metadata.dataSize, 0),
    };
  }

  // Private helper methods

  private async captureCurrentState(scope: RollbackPoint['scope']): Promise<RollbackPoint['state']> {
    try {
      // Import MongoDB database
      const { MongoDatabase } = await import('../server/database/MongoDatabase');
      const db = MongoDatabase.getInstance();
      await db.initialize();

      const snapshots: RollbackPoint['state']['snapshots'] = [];

      // Capture current snapshots for each data source
      if (scope.dataSourceIds && scope.dataSourceIds.length > 0) {
        for (const dsId of scope.dataSourceIds) {
          const dsSnapshots = await db.getSnapshots(dsId);
          if (dsSnapshots.length > 0) {
            const latest: any = dsSnapshots[0]; // Already sorted by version desc
            snapshots.push({
              dataSourceId: dsId,
              snapshotId: latest.id as string,
              version: latest.version || 1,
              recordCount: latest.recordCount || 0,
            });
          }
        }
      }

      // Capture pipeline states
      const pipelines: RollbackPoint['state']['pipelines'] = [];
      if (scope.pipelineIds && scope.pipelineIds.length > 0) {
        for (const pId of scope.pipelineIds) {
          const pipeline: any = await db.getPipeline(pId);
          if (pipeline) {
            pipelines.push({
              pipelineId: pId,
              lastExecutionId: pipeline.lastExecutionId,
              status: pipeline.status || 'idle',
            });
          }
        }
      }

      return {
        snapshots,
        pipelines,
      };
    } catch (error) {
      logger.error('Failed to capture current state', 'rollback-manager', { error });
      // Fallback to empty state
      return { snapshots: [], pipelines: [] };
    }
  }

  private async restoreDataSource(snapshot: {
    dataSourceId: string;
    snapshotId: string;
    version: number;
    recordCount: number;
  }): Promise<void> {
    try {
      // Import MongoDB database
      const { MongoDatabase } = await import('../server/database/MongoDatabase');
      const db = MongoDatabase.getInstance();
      await db.initialize();

      logger.info('Restoring data source from snapshot', 'rollback-manager', {
        dataSourceId: snapshot.dataSourceId,
        snapshotId: snapshot.snapshotId,
        version: snapshot.version,
      });

      // 1. Load the snapshot data from database
      const snapshotData = await db.getImportedData({
        dataSourceId: snapshot.dataSourceId,
        snapshotId: snapshot.snapshotId,
        limit: 1000000, // Large limit for full restore
      });

      const dataToRestore = snapshotData.data.map(d => d.data);

      logger.info('Loaded snapshot data for restore', 'rollback-manager', {
        recordCount: dataToRestore.length,
      });

      // 2. Create a new snapshot with the restored data (this becomes the current version)
      const { v4: uuidv4 } = await import('uuid');
      const newSnapshotId = uuidv4();

      await db.createSnapshot({
        id: newSnapshotId,
        projectId: 'default', // Would get from scope
        dataSourceId: snapshot.dataSourceId,
        version: snapshot.version + 1000, // High version number to indicate it's a rollback
        data: dataToRestore,
        schema: null,
        metadata: {
          rolledBackFrom: snapshot.snapshotId,
          rollbackVersion: snapshot.version,
          restoredAt: new Date().toISOString(),
        },
        recordCount: dataToRestore.length,
        createdAt: new Date(),
      });

      logger.success('Data source restored successfully', 'rollback-manager', {
        dataSourceId: snapshot.dataSourceId,
        newSnapshotId,
        recordsRestored: dataToRestore.length,
      });
    } catch (error) {
      logger.error('Failed to restore data source', 'rollback-manager', {
        error,
        dataSourceId: snapshot.dataSourceId,
      });
      throw error;
    }
  }

  private calculateDataSize(state: RollbackPoint['state']): number {
    // Estimate data size in bytes
    return state.snapshots.reduce((sum, s) => sum + (s.recordCount * 1024), 0);
  }

  private findPrePipelineRollbackPoint(pipelineId: string): RollbackPoint | null {
    const points = Array.from(this.rollbackPoints.values())
      .filter(p => 
        p.type === 'pre-pipeline' &&
        p.status === 'active' &&
        p.scope.pipelineIds?.includes(pipelineId)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return points[0] || null;
  }

  private enforceMaxRollbackPoints(): void {
    const points = Array.from(this.rollbackPoints.values())
      .filter(p => p.status === 'active')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (points.length > this.config.maxRollbackPoints) {
      const toDelete = points.slice(this.config.maxRollbackPoints);
      toDelete.forEach(p => {
        p.status = 'expired';
        this.rollbackPoints.delete(p.id);
      });

      logger.info('Old rollback points cleaned up', 'rollback-manager', {
        deleted: toDelete.length,
      });
    }
  }

  private startCleanupScheduler(): void {
    // Clean up expired rollback points every hour
    setInterval(() => {
      const now = Date.now();
      const expired: string[] = [];

      for (const [id, point] of this.rollbackPoints.entries()) {
        if (point.expiresAt && point.expiresAt.getTime() < now) {
          point.status = 'expired';
          this.rollbackPoints.delete(id);
          expired.push(id);
        }
      }

      if (expired.length > 0) {
        logger.info('Expired rollback points cleaned up', 'rollback-manager', {
          count: expired.length,
        });
      }
    }, 60 * 60 * 1000); // 1 hour
  }
}

// Export singleton instance
export const rollbackManager = new RollbackManagerService();

