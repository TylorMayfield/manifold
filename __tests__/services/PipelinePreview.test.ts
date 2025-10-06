/**
 * Pipeline Preview Unit Tests
 */

import { PipelinePreviewService } from '../../lib/services/PipelinePreview';
import { Pipeline } from '../../types';

describe('PipelinePreviewService', () => {
  let service: PipelinePreviewService;

  beforeEach(() => {
    service = PipelinePreviewService.getInstance();
    service.clearCache();
  });

  describe('Preview Generation', () => {
    it('should generate preview for single step', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Test Pipeline',
        steps: [
          {
            id: 'step-1',
            type: 'filter',
            name: 'Filter Adults',
            order: 1,
            config: {
              filterExpression: 'row.value > 50',
            },
          },
        ],
        inputSourceIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.generatePreview({
        pipeline,
        sampleSize: 100,
      });

      expect(result.pipelineId).toBe('test-pipeline');
      expect(result.previewSteps).toHaveLength(1);
      expect(result.previewSteps[0].stepName).toBe('Filter Adults');
      expect(result.overallStatus).toBe('success');
    });

    it('should generate preview for multi-step pipeline', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Multi-Step',
        steps: [
          {
            id: 'step-1',
            type: 'filter',
            name: 'Filter',
            order: 1,
            config: { filterExpression: 'row.value > 50' },
          },
          {
            id: 'step-2',
            type: 'sort',
            name: 'Sort',
            order: 2,
            config: { sortFields: [{ field: 'value', direction: 'desc' }] },
          },
        ],
        inputSourceIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.generatePreview({
        pipeline,
        sampleSize: 100,
      });

      expect(result.previewSteps).toHaveLength(2);
      expect(result.previewSteps[0].stepType).toBe('filter');
      expect(result.previewSteps[1].stepType).toBe('sort');
    });

    it('should preview up to specific step', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Test',
        steps: [
          {
            id: 'step-1',
            type: 'filter',
            name: 'Step 1',
            order: 1,
            config: { filterExpression: 'row.value > 50' },
          },
          {
            id: 'step-2',
            type: 'map',
            name: 'Step 2',
            order: 2,
            config: { fieldMappings: [] },
          },
          {
            id: 'step-3',
            type: 'sort',
            name: 'Step 3',
            order: 3,
            config: { sortFields: [] },
          },
        ],
        inputSourceIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.generatePreview({
        pipeline,
        stepIndex: 1, // Only preview first 2 steps
        sampleSize: 100,
      });

      expect(result.previewSteps).toHaveLength(2);
    });
  });

  describe('Data Profiling', () => {
    it('should profile output data', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Test',
        steps: [
          {
            id: 'step-1',
            type: 'filter',
            name: 'Filter',
            order: 1,
            config: { filterExpression: 'row.value > 50' },
          },
        ],
        inputSourceIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.generatePreview({
        pipeline,
        sampleSize: 100,
      });

      const profile = result.previewSteps[0].dataProfile;
      
      expect(profile.recordCount).toBeGreaterThan(0);
      expect(profile.fieldCount).toBeGreaterThan(0);
      expect(profile.fields).toBeDefined();
      expect(profile.fields.length).toBeGreaterThan(0);
    });

    it('should include field statistics', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Test',
        steps: [
          {
            id: 'step-1',
            type: 'map',
            name: 'Map',
            order: 1,
            config: { fieldMappings: [] },
          },
        ],
        inputSourceIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.generatePreview({
        pipeline,
        sampleSize: 100,
      });

      const fields = result.previewSteps[0].dataProfile.fields;
      
      fields.forEach(field => {
        expect(field.name).toBeDefined();
        expect(field.type).toBeDefined();
        expect(typeof field.nullable).toBe('boolean');
        expect(typeof field.uniqueValues).toBe('number');
      });
    });
  });

  describe('Warnings', () => {
    it('should warn on high data loss', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Test',
        steps: [
          {
            id: 'step-1',
            type: 'filter',
            name: 'Aggressive Filter',
            order: 1,
            config: { filterExpression: 'row.value > 950' }, // Will filter most records
          },
        ],
        inputSourceIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.generatePreview({
        pipeline,
        sampleSize: 100,
      });

      const step = result.previewSteps[0];
      
      // Should have warning about data loss
      expect(step.warnings.length).toBeGreaterThan(0);
      expect(step.warnings.some(w => w.includes('data loss'))).toBe(true);
    });
  });

  describe('Caching', () => {
    it('should cache preview results', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Test',
        steps: [
          {
            id: 'step-1',
            type: 'filter',
            name: 'Filter',
            order: 1,
            config: { filterExpression: 'row.value > 50' },
          },
        ],
        inputSourceIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // First call
      const result1 = await service.generatePreview({ pipeline, sampleSize: 100 });
      
      // Second call (should be from cache)
      const result2 = await service.generatePreview({ pipeline, sampleSize: 100 });

      // Should be same result
      expect(result1.totalExecutionTime).toBe(result2.totalExecutionTime);
    });

    it('should clear cache', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Test',
        steps: [
          {
            id: 'step-1',
            type: 'filter',
            name: 'Filter',
            order: 1,
            config: { filterExpression: 'row.value > 50' },
          },
        ],
        inputSourceIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await service.generatePreview({ pipeline, sampleSize: 100 });
      service.clearCache();
      
      // Should regenerate after cache clear
      const result = await service.generatePreview({ pipeline, sampleSize: 100 });
      expect(result).toBeDefined();
    });
  });
});

