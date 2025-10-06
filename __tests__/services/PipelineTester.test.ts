/**
 * Pipeline Tester Unit Tests
 */

import { PipelineTester } from '../../lib/services/PipelineTester';
import { Pipeline } from '../../types';

describe('PipelineTester', () => {
  let tester: PipelineTester;

  beforeEach(() => {
    tester = PipelineTester.getInstance();
  });

  describe('Test Creation', () => {
    it('should create a test', () => {
      const test = tester.createTest({
        pipelineId: 'pipeline-1',
        name: 'Test 1',
        testData: {
          mode: 'sample',
          sampleSize: 100,
        },
      });

      expect(test.id).toBeDefined();
      expect(test.name).toBe('Test 1');
      expect(test.pipelineId).toBe('pipeline-1');
    });
  });

  describe('Assertions', () => {
    it('should validate record count assertions', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Test',
        steps: [
          {
            id: 'step-1',
            type: 'filter',
            name: 'Filter',
            order: 1,
            config: { filterExpression: 'row.age >= 18' },
          },
        ],
        inputSourceIds: ['test-source'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const test = tester.createTest({
        pipelineId: pipeline.id,
        name: 'Count Test',
        testData: {
          mode: 'custom',
          customData: {
            'test-source': [
              { id: 1, age: 25 },
              { id: 2, age: 17 },
              { id: 3, age: 30 },
            ],
          },
        },
        assertions: [
          {
            id: 'assert-1',
            type: 'record_count',
            description: 'Should have 2 adults',
            config: {
              expectedCount: 2,
            },
          },
        ],
      });

      const result = await tester.runTest(test.id, pipeline);

      expect(result.status).toBe('passed');
      expect(result.assertionResults).toHaveLength(1);
      expect(result.assertionResults[0].passed).toBe(true);
    });

    it('should validate field exists assertions', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Test',
        steps: [
          {
            id: 'step-1',
            type: 'map',
            name: 'Add Field',
            order: 1,
            config: {
              fieldMappings: [
                { from: 'first', to: 'first_name' },
              ],
            },
          },
        ],
        inputSourceIds: ['test-source'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const test = tester.createTest({
        pipelineId: pipeline.id,
        name: 'Field Test',
        testData: {
          mode: 'custom',
          customData: {
            'test-source': [
              { first: 'John' },
            ],
          },
        },
        assertions: [
          {
            id: 'assert-1',
            type: 'field_exists',
            description: 'first_name should exist',
            config: {
              field: 'first_name',
            },
          },
        ],
      });

      const result = await tester.runTest(test.id, pipeline);

      expect(result.assertionResults[0].passed).toBe(true);
    });
  });

  describe('Test Data Modes', () => {
    it('should generate mock data', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Test',
        steps: [],
        inputSourceIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const test = tester.createTest({
        pipelineId: pipeline.id,
        name: 'Mock Test',
        testData: {
          mode: 'mock',
          mockConfig: {
            recordCount: 50,
            schema: {
              id: 'number',
              name: 'string',
              email: 'email',
            },
          },
        },
      });

      const result = await tester.runTest(test.id, pipeline);

      expect(result.executionResult.inputRecords).toBe(50);
    });
  });
});

