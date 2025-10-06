import { rollbackManager } from '../../lib/services/RollbackManager';

describe('RollbackManager', () => {
  beforeEach(() => {
    // Reset state before each test
    jest.clearAllMocks();
  });

  describe('Rollback Point Creation', () => {
    it('should create a manual rollback point', async () => {
      const point = await rollbackManager.createRollbackPoint({
        name: 'Test Rollback Point',
        description: 'Test description',
        type: 'manual',
        scope: {
          projectId: 'test-project',
          dataSourceIds: ['ds1', 'ds2'],
        },
        expiresInDays: 30,
        createdBy: 'test-user',
      });

      expect(point).toBeDefined();
      expect(point.id).toMatch(/^rbp_/);
      expect(point.name).toBe('Test Rollback Point');
      expect(point.type).toBe('manual');
      expect(point.status).toBe('active');
      expect(point.state.snapshots.length).toBeGreaterThan(0);
    });

    it('should create a pre-pipeline rollback point', async () => {
      const point = await rollbackManager.createPrePipelineRollback({
        pipelineId: 'pipeline-1',
        pipelineName: 'Test Pipeline',
        projectId: 'test-project',
        dataSourceIds: ['ds1'],
        createdBy: 'test-user',
      });

      expect(point).toBeDefined();
      expect(point?.type).toBe('pre-pipeline');
      expect(point?.name).toContain('Pre-Pipeline');
    });

    it('should include metadata in rollback point', async () => {
      const point = await rollbackManager.createRollbackPoint({
        name: 'Test Point',
        type: 'manual',
        scope: {
          projectId: 'test-project',
          dataSourceIds: ['ds1'],
        },
      });

      expect(point.metadata).toBeDefined();
      expect(point.metadata.dataSize).toBeGreaterThan(0);
      expect(point.metadata.itemsCaptured).toBeGreaterThan(0);
      expect(point.metadata.captureTime).toBeGreaterThan(0);
    });
  });

  describe('Rollback Operations', () => {
    it('should restore from rollback point', async () => {
      // Create a rollback point
      const point = await rollbackManager.createRollbackPoint({
        name: 'Test Point',
        type: 'manual',
        scope: {
          projectId: 'test-project',
          dataSourceIds: ['ds1'],
        },
      });

      // Restore from it
      const operation = await rollbackManager.restoreFromRollbackPoint({
        rollbackPointId: point.id,
        reason: 'Test restore',
        initiatedBy: 'test-user',
      });

      expect(operation).toBeDefined();
      expect(operation.id).toMatch(/^rbo_/);
      expect(operation.status).toBe('completed');
      expect(operation.restored.dataSources.length).toBeGreaterThan(0);
    });

    it('should perform dry run without modifying data', async () => {
      const point = await rollbackManager.createRollbackPoint({
        name: 'Test Point',
        type: 'manual',
        scope: {
          projectId: 'test-project',
          dataSourceIds: ['ds1'],
        },
      });

      const operation = await rollbackManager.restoreFromRollbackPoint({
        rollbackPointId: point.id,
        dryRun: true,
      });

      expect(operation.status).toBe('completed');
      // Point should still be active after dry run
      const retrievedPoint = rollbackManager.getRollbackPoint(point.id);
      expect(retrievedPoint?.status).toBe('active');
    });

    it('should mark rollback point as used after successful restore', async () => {
      const point = await rollbackManager.createRollbackPoint({
        name: 'Test Point',
        type: 'manual',
        scope: {
          projectId: 'test-project',
          dataSourceIds: ['ds1'],
        },
      });

      await rollbackManager.restoreFromRollbackPoint({
        rollbackPointId: point.id,
        dryRun: false,
      });

      const retrievedPoint = rollbackManager.getRollbackPoint(point.id);
      expect(retrievedPoint?.status).toBe('used');
    });

    it('should handle restore errors gracefully', async () => {
      await expect(
        rollbackManager.restoreFromRollbackPoint({
          rollbackPointId: 'non-existent',
        })
      ).rejects.toThrow('Rollback point not found');
    });
  });

  describe('Pipeline Rollback', () => {
    it('should rollback failed pipeline execution', async () => {
      // Create pre-pipeline rollback
      const point = await rollbackManager.createPrePipelineRollback({
        pipelineId: 'pipeline-1',
        pipelineName: 'Test Pipeline',
        projectId: 'test-project',
        dataSourceIds: ['ds1'],
      });

      expect(point).toBeDefined();

      // Rollback the pipeline
      const operation = await rollbackManager.rollbackFailedPipeline({
        executionId: 'exec-1',
        pipelineId: 'pipeline-1',
        projectId: 'test-project',
        reason: 'Pipeline failed',
      });

      expect(operation.status).toBe('completed');
      expect(operation.reason).toBe('Pipeline failed');
    });

    it('should throw error if no pre-pipeline rollback exists', async () => {
      await expect(
        rollbackManager.rollbackFailedPipeline({
          executionId: 'exec-1',
          pipelineId: 'non-existent-pipeline',
          projectId: 'test-project',
          reason: 'Pipeline failed',
        })
      ).rejects.toThrow('No rollback point found');
    });
  });

  describe('Rollback Point Management', () => {
    it('should get all rollback points', async () => {
      await rollbackManager.createRollbackPoint({
        name: 'Point 1',
        type: 'manual',
        scope: { projectId: 'proj1', dataSourceIds: ['ds1'] },
      });

      await rollbackManager.createRollbackPoint({
        name: 'Point 2',
        type: 'manual',
        scope: { projectId: 'proj2', dataSourceIds: ['ds2'] },
      });

      const points = rollbackManager.getRollbackPoints();
      expect(points.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter rollback points by project', async () => {
      await rollbackManager.createRollbackPoint({
        name: 'Point 1',
        type: 'manual',
        scope: { projectId: 'proj1', dataSourceIds: ['ds1'] },
      });

      const points = rollbackManager.getRollbackPoints({ projectId: 'proj1' });
      expect(points.length).toBeGreaterThan(0);
      expect(points.every(p => p.scope.projectId === 'proj1')).toBe(true);
    });

    it('should filter rollback points by type', async () => {
      await rollbackManager.createPrePipelineRollback({
        pipelineId: 'pipeline-1',
        pipelineName: 'Test',
        projectId: 'proj1',
        dataSourceIds: ['ds1'],
      });

      const points = rollbackManager.getRollbackPoints({ type: 'pre-pipeline' });
      expect(points.every(p => p.type === 'pre-pipeline')).toBe(true);
    });

    it('should delete rollback point', async () => {
      const point = await rollbackManager.createRollbackPoint({
        name: 'To Delete',
        type: 'manual',
        scope: { projectId: 'proj1', dataSourceIds: ['ds1'] },
      });

      const deleted = rollbackManager.deleteRollbackPoint(point.id);
      expect(deleted).toBe(true);

      const retrievedPoint = rollbackManager.getRollbackPoint(point.id);
      expect(retrievedPoint).toBeNull();
    });
  });

  describe('Rollback History', () => {
    it('should track rollback history', async () => {
      const point = await rollbackManager.createRollbackPoint({
        name: 'Test Point',
        type: 'manual',
        scope: { projectId: 'proj1', dataSourceIds: ['ds1'] },
      });

      await rollbackManager.restoreFromRollbackPoint({
        rollbackPointId: point.id,
      });

      const history = rollbackManager.getRollbackHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].rollbackPointId).toBe(point.id);
    });

    it('should filter history by rollback point', async () => {
      const point = await rollbackManager.createRollbackPoint({
        name: 'Test Point',
        type: 'manual',
        scope: { projectId: 'proj1', dataSourceIds: ['ds1'] },
      });

      await rollbackManager.restoreFromRollbackPoint({
        rollbackPointId: point.id,
      });

      const history = rollbackManager.getRollbackHistory({
        rollbackPointId: point.id,
      });

      expect(history.every(h => h.rollbackPointId === point.id)).toBe(true);
    });

    it('should limit history results', async () => {
      const history = rollbackManager.getRollbackHistory({ limit: 5 });
      expect(history.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        autoCreateBeforePipeline: false,
        retentionDays: 60,
      };

      rollbackManager.updateConfig(newConfig);
      const config = rollbackManager.getConfig();

      expect(config.autoCreateBeforePipeline).toBe(false);
      expect(config.retentionDays).toBe(60);
    });

    it('should get current configuration', () => {
      const config = rollbackManager.getConfig();
      
      expect(config).toBeDefined();
      expect(config.autoCreateBeforePipeline).toBeDefined();
      expect(config.retentionDays).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should get rollback statistics', async () => {
      await rollbackManager.createRollbackPoint({
        name: 'Test Point',
        type: 'manual',
        scope: { projectId: 'proj1', dataSourceIds: ['ds1'] },
      });

      const stats = rollbackManager.getStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalRollbackPoints).toBeGreaterThan(0);
      expect(stats.activeRollbackPoints).toBeGreaterThan(0);
      expect(stats.totalDataSizeCaptured).toBeGreaterThanOrEqual(0);
    });

    it('should track successful and failed restores', async () => {
      const point = await rollbackManager.createRollbackPoint({
        name: 'Test Point',
        type: 'manual',
        scope: { projectId: 'proj1', dataSourceIds: ['ds1'] },
      });

      await rollbackManager.restoreFromRollbackPoint({
        rollbackPointId: point.id,
      });

      const stats = rollbackManager.getStatistics();
      expect(stats.successfulRestores).toBeGreaterThan(0);
    });
  });
});

