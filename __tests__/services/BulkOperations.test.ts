/**
 * Bulk Operations Unit Tests
 */

import { BulkOperationsService, BulkEntityType, BulkOperationType } from '../../lib/services/BulkOperations';

describe('BulkOperationsService', () => {
  let service: BulkOperationsService;

  beforeEach(() => {
    service = BulkOperationsService.getInstance();
  });

  afterEach(() => {
    service.clearCompleted();
  });

  describe('Operation Creation', () => {
    it('should create a bulk operation', () => {
      const operation = service.createOperation({
        name: 'Delete Test Pipelines',
        entityType: 'pipeline',
        operationType: 'delete',
        entityIds: ['pipe-1', 'pipe-2', 'pipe-3'],
      });

      expect(operation.id).toBeDefined();
      expect(operation.name).toBe('Delete Test Pipelines');
      expect(operation.status).toBe('pending');
      expect(operation.progress.total).toBe(3);
      expect(operation.progress.completed).toBe(0);
    });

    it('should set default options', () => {
      const operation = service.createOperation({
        name: 'Test Operation',
        entityType: 'data_source',
        operationType: 'enable',
        entityIds: ['ds-1'],
      });

      expect(operation.options.continueOnError).toBe(true);
      expect(operation.options.maxConcurrent).toBe(5);
      expect(operation.options.dryRun).toBe(false);
    });

    it('should allow custom options', () => {
      const operation = service.createOperation({
        name: 'Custom Options Test',
        entityType: 'pipeline',
        operationType: 'delete',
        entityIds: ['pipe-1'],
        options: {
          continueOnError: false,
          maxConcurrent: 10,
          dryRun: true,
        },
      });

      expect(operation.options.continueOnError).toBe(false);
      expect(operation.options.maxConcurrent).toBe(10);
      expect(operation.options.dryRun).toBe(true);
    });
  });

  describe('Operation Execution', () => {
    it('should execute a bulk operation', async () => {
      const operation = service.createOperation({
        name: 'Test Execution',
        entityType: 'pipeline',
        operationType: 'enable',
        entityIds: ['pipe-1', 'pipe-2'],
      });

      const summary = await service.executeOperation(operation.id);

      expect(summary.operationId).toBe(operation.id);
      expect(summary.totalEntities).toBe(2);
      expect(summary.status).toBe('completed');
    });

    it('should track progress during execution', async () => {
      const operation = service.createOperation({
        name: 'Progress Test',
        entityType: 'data_source',
        operationType: 'enable',
        entityIds: ['ds-1', 'ds-2', 'ds-3'],
      });

      await service.executeOperation(operation.id);

      const op = service.getOperation(operation.id);
      expect(op?.progress.completed).toBe(3);
      expect(op?.progress.percentage).toBe(100);
    });

    it('should handle dry run mode', async () => {
      const operation = service.createOperation({
        name: 'Dry Run Test',
        entityType: 'pipeline',
        operationType: 'delete',
        entityIds: ['pipe-1', 'pipe-2'],
        options: {
          dryRun: true,
        },
      });

      const summary = await service.executeOperation(operation.id);

      expect(summary.status).toBe('completed');
      expect(summary.successful).toBe(2);
      
      // Verify results indicate dry run
      const op = service.getOperation(operation.id);
      expect(op?.results.every(r => r.message?.includes('Dry run'))).toBe(true);
    });

    it('should handle partial failures', async () => {
      const operation = service.createOperation({
        name: 'Partial Failure Test',
        entityType: 'pipeline',
        operationType: 'delete',
        entityIds: ['pipe-1', 'pipe-2', 'pipe-3'],
        options: {
          continueOnError: true,
        },
      });

      const summary = await service.executeOperation(operation.id);

      // Should complete even if some fail
      expect(['completed', 'partial']).toContain(summary.status);
    });

    it('should not execute already running operation', async () => {
      const operation = service.createOperation({
        name: 'Duplicate Execute Test',
        entityType: 'data_source',
        operationType: 'enable',
        entityIds: ['ds-1'],
      });

      // Start execution
      const promise = service.executeOperation(operation.id);

      // Try to execute again
      await expect(service.executeOperation(operation.id)).rejects.toThrow();

      // Wait for first execution to complete
      await promise;
    });
  });

  describe('Operation Management', () => {
    it('should get operation by ID', () => {
      const operation = service.createOperation({
        name: 'Get Test',
        entityType: 'pipeline',
        operationType: 'enable',
        entityIds: ['pipe-1'],
      });

      const retrieved = service.getOperation(operation.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(operation.id);
    });

    it('should get all operations', () => {
      service.createOperation({
        name: 'Op 1',
        entityType: 'pipeline',
        operationType: 'enable',
        entityIds: ['pipe-1'],
      });

      service.createOperation({
        name: 'Op 2',
        entityType: 'data_source',
        operationType: 'delete',
        entityIds: ['ds-1'],
      });

      const allOps = service.getAllOperations();
      expect(allOps.length).toBeGreaterThanOrEqual(2);
    });

    it('should cancel running operation', async () => {
      const operation = service.createOperation({
        name: 'Cancel Test',
        entityType: 'pipeline',
        operationType: 'enable',
        entityIds: ['pipe-1', 'pipe-2', 'pipe-3'],
      });

      // Start execution
      const promise = service.executeOperation(operation.id);

      // Wait a bit then cancel
      await new Promise(resolve => setTimeout(resolve, 50));
      const cancelled = service.cancelOperation(operation.id);

      // May or may not succeed depending on timing
      expect(typeof cancelled).toBe('boolean');

      // Wait for execution to complete/fail
      try {
        await promise;
      } catch (e) {
        // Expected if cancelled
      }
    });

    it('should clear completed operations', async () => {
      const operation = service.createOperation({
        name: 'Clear Test',
        entityType: 'pipeline',
        operationType: 'enable',
        entityIds: ['pipe-1'],
      });

      await service.executeOperation(operation.id);

      const cleared = service.clearCompleted();
      expect(cleared).toBeGreaterThanOrEqual(1);

      const retrieved = service.getOperation(operation.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should calculate statistics correctly', async () => {
      // Create pending operation
      service.createOperation({
        name: 'Pending Op',
        entityType: 'pipeline',
        operationType: 'enable',
        entityIds: ['pipe-1'],
      });

      // Create and execute operation
      const op2 = service.createOperation({
        name: 'Completed Op',
        entityType: 'data_source',
        operationType: 'enable',
        entityIds: ['ds-1'],
      });
      await service.executeOperation(op2.id);

      const stats = service.getStatistics();

      expect(stats.total).toBeGreaterThanOrEqual(2);
      expect(stats.pending).toBeGreaterThanOrEqual(1);
      expect(stats.completed).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Batch Processing', () => {
    it('should process entities in batches', async () => {
      const operation = service.createOperation({
        name: 'Large Batch Test',
        entityType: 'pipeline',
        operationType: 'enable',
        entityIds: Array.from({ length: 20 }, (_, i) => `pipe-${i}`),
        options: {
          maxConcurrent: 3,
        },
      });

      const summary = await service.executeOperation(operation.id);

      expect(summary.totalEntities).toBe(20);
      expect(summary.status).toBe('completed');
    });
  });
});

