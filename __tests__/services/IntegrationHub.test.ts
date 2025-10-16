/**
 * Integration Hub Unit Tests
 */

import { IntegrationHub } from '../../lib/services/IntegrationHub';

// Mock dependencies
jest.mock('../../lib/services/DataCatalog', () => ({
  dataCatalog: {
    registerAsset: jest.fn(() => ({ id: 'catalog-123' })),
    updateAsset: jest.fn(),
  }
}));

jest.mock('../../lib/services/DataLineage', () => ({
  dataLineage: {
    registerNode: jest.fn(),
    trackPipelineExecution: jest.fn(),
  }
}));

jest.mock('../../lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    success: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('IntegrationHub', () => {
  let hub: IntegrationHub;

  beforeEach(() => {
    hub = IntegrationHub.getInstance();
    jest.clearAllMocks();
  });

  describe('onPipelineExecuted', () => {
    it('should track pipeline execution successfully', async () => {
      const pipelineId = 'pipeline-123';
      const executionId = 'exec-456';
      const success = true;

      await hub.onPipelineExecuted(pipelineId, executionId, success);

      const { logger } = require('../../lib/utils/logger');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Pipeline execution completed'),
        'integration-hub',
        expect.objectContaining({
          pipelineId,
          executionId,
          success
        })
      );
      expect(logger.success).toHaveBeenCalled();
    });

    it('should update catalog with execution metadata', async () => {
      // First onboard a pipeline
      await hub.onboardPipeline({
        id: 'pipeline-123',
        name: 'Test Pipeline',
        projectId: 'proj-1',
        steps: [{ id: 'step1', type: 'filter', config: {} }],
        inputSourceIds: [],
        config: {},
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const { dataCatalog } = require('../../lib/services/DataCatalog');
      jest.clearAllMocks();

      await hub.onPipelineExecuted('pipeline-123', 'exec-456', true);

      expect(dataCatalog.updateAsset).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          technicalMetadata: expect.objectContaining({
            lastExecutionId: 'exec-456',
            lastExecutionStatus: 'completed'
          })
        })
      );
    });

    it('should handle execution tracking errors gracefully', async () => {
      const { dataCatalog } = require('../../lib/services/DataCatalog');
      dataCatalog.updateAsset.mockImplementationOnce(() => {
        throw new Error('Catalog error');
      });

      // Should not throw - just log the error
      await expect(hub.onPipelineExecuted('pipeline-123', 'exec-456', true))
        .resolves.not.toThrow();

      const { logger } = require('../../lib/utils/logger');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to track pipeline execution',
        'integration-hub',
        expect.objectContaining({
          error: expect.any(Error)
        })
      );
    });

    it('should track both successful and failed executions', async () => {
      // First onboard the pipelines to create catalog entries
      await hub.onboardPipeline({
        id: 'pipeline-123',
        name: 'Success Pipeline',
        projectId: 'proj-1',
        steps: [],
        inputSourceIds: [],
        config: {},
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await hub.onboardPipeline({
        id: 'pipeline-456',
        name: 'Fail Pipeline',
        projectId: 'proj-1',
        steps: [],
        inputSourceIds: [],
        config: {},
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const { dataCatalog } = require('../../lib/services/DataCatalog');
      jest.clearAllMocks();

      await hub.onPipelineExecuted('pipeline-123', 'exec-success', true);
      await hub.onPipelineExecuted('pipeline-456', 'exec-failed', false);
      
      // Check that both executions were tracked
      expect(dataCatalog.updateAsset).toHaveBeenCalledTimes(2);
      
      // Verify successful execution was tracked
      const calls = (dataCatalog.updateAsset as jest.Mock).mock.calls;
      expect(calls.some(call => 
        call[1]?.technicalMetadata?.lastExecutionStatus === 'completed'
      )).toBe(true);
      
      // Verify failed execution was tracked
      expect(calls.some(call => 
        call[1]?.technicalMetadata?.lastExecutionStatus === 'failed'
      )).toBe(true);
    });
  });

  describe('onboardPipeline', () => {
    it('should register pipeline in catalog', async () => {
      const pipeline = {
        id: 'pipeline-123',
        name: 'Test Pipeline',
        projectId: 'proj-1',
        steps: [
          { id: 'step1', type: 'filter', config: {} },
          { id: 'step2', type: 'transform', config: {} }
        ],
        inputSourceIds: [],
        config: {},
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const integration = await hub.onboardPipeline(pipeline);

      expect(integration.pipelineId).toBe('pipeline-123');
      expect(integration.catalogEntryId).toBeDefined();
      
      const { dataCatalog } = require('../../lib/services/DataCatalog');
      expect(dataCatalog.registerAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          assetType: 'pipeline',
          assetId: 'pipeline-123',
          name: 'Test Pipeline'
        })
      );
    });
  });
});

