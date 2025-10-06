/**
 * Pipeline Executor Unit Tests
 * 
 * Tests for the pipeline execution engine including all transformation types
 */

import { PipelineExecutor, ExecutionContext } from '../../lib/services/PipelineExecutor';
import { Pipeline, TransformStep } from '../../types';

describe('PipelineExecutor', () => {
  let executor: PipelineExecutor;

  beforeEach(() => {
    executor = PipelineExecutor.getInstance();
  });

  afterEach(() => {
    executor.clearExecutions();
  });

  describe('Filter Transformation', () => {
    it('should filter rows based on expression', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Test Filter',
        steps: [
          {
            id: 'step-1',
            type: 'filter',
            name: 'Filter Adults',
            order: 1,
            config: {
              filterExpression: 'row.age >= 18',
            },
          },
        ],
        inputSourceIds: ['test-source'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const inputData = {
        'test-source': [
          { id: 1, name: 'John', age: 25 },
          { id: 2, name: 'Jane', age: 17 },
          { id: 3, name: 'Bob', age: 30 },
        ],
      };

      const context: ExecutionContext = {
        executionId: 'test-exec-1',
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        projectId: 'test',
        startTime: new Date(),
      };

      const result = await executor.executePipeline(pipeline, inputData, context);

      expect(result.status).toBe('completed');
      expect(result.outputRecords).toBe(2);
      expect(result.outputData).toHaveLength(2);
      expect(result.outputData?.[0].age).toBeGreaterThanOrEqual(18);
    });

    it('should handle complex filter expressions', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Complex Filter',
        steps: [
          {
            id: 'step-1',
            type: 'filter',
            name: 'Complex Filter',
            order: 1,
            config: {
              filterExpression: 'row.age >= 18 && row.active === true && row.balance > 0',
            },
          },
        ],
        inputSourceIds: ['test-source'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const inputData = {
        'test-source': [
          { id: 1, age: 25, active: true, balance: 100 },
          { id: 2, age: 30, active: false, balance: 200 },
          { id: 3, age: 17, active: true, balance: 50 },
          { id: 4, age: 40, active: true, balance: 0 },
        ],
      };

      const result = await executor.executePipeline(pipeline, inputData, {
        executionId: 'test-exec-2',
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        projectId: 'test',
        startTime: new Date(),
      });

      expect(result.outputRecords).toBe(1);
      expect(result.outputData?.[0].id).toBe(1);
    });
  });

  describe('Map Transformation', () => {
    it('should rename and transform columns', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Test Map',
        steps: [
          {
            id: 'step-1',
            type: 'map',
            name: 'Rename Columns',
            order: 1,
            config: {
              fieldMappings: [
                { from: 'firstName', to: 'first_name' },
                { from: 'lastName', to: 'last_name' },
                { from: 'age', to: 'years_old', transform: 'value * 1' },
              ],
            },
          },
        ],
        inputSourceIds: ['test-source'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const inputData = {
        'test-source': [
          { firstName: 'John', lastName: 'Doe', age: 25 },
        ],
      };

      const result = await executor.executePipeline(pipeline, inputData, {
        executionId: 'test-exec-3',
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        projectId: 'test',
        startTime: new Date(),
      });

      expect(result.outputData?.[0]).toEqual({
        first_name: 'John',
        last_name: 'Doe',
        years_old: 25,
      });
    });

    it('should apply transformation functions', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Test Transform',
        steps: [
          {
            id: 'step-1',
            type: 'map',
            name: 'Transform Values',
            order: 1,
            config: {
              fieldMappings: [
                { from: 'salary', to: 'annual_salary', transform: 'value * 12' },
                { from: 'name', to: 'upper_name', transform: 'value.toUpperCase()' },
              ],
            },
          },
        ],
        inputSourceIds: ['test-source'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const inputData = {
        'test-source': [
          { salary: 5000, name: 'john' },
        ],
      };

      const result = await executor.executePipeline(pipeline, inputData, {
        executionId: 'test-exec-4',
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        projectId: 'test',
        startTime: new Date(),
      });

      expect(result.outputData?.[0].annual_salary).toBe(60000);
      expect(result.outputData?.[0].upper_name).toBe('JOHN');
    });
  });

  describe('Aggregate Transformation', () => {
    it('should aggregate with group by', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Test Aggregate',
        steps: [
          {
            id: 'step-1',
            type: 'aggregate',
            name: 'Group By Department',
            order: 1,
            config: {
              groupBy: ['department'],
              aggregations: [
                { field: 'salary', operation: 'sum' },
                { field: 'salary', operation: 'avg' },
                { field: 'id', operation: 'count' },
              ],
            },
          },
        ],
        inputSourceIds: ['test-source'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const inputData = {
        'test-source': [
          { id: 1, department: 'Sales', salary: 5000 },
          { id: 2, department: 'Sales', salary: 6000 },
          { id: 3, department: 'Engineering', salary: 7000 },
        ],
      };

      const result = await executor.executePipeline(pipeline, inputData, {
        executionId: 'test-exec-5',
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        projectId: 'test',
        startTime: new Date(),
      });

      expect(result.outputRecords).toBe(2);
      
      const salesGroup = result.outputData?.find(r => r.department === 'Sales');
      expect(salesGroup?.salary_sum).toBe(11000);
      expect(salesGroup?.salary_avg).toBe(5500);
      expect(salesGroup?.id_count).toBe(2);
    });

    it('should handle min/max aggregations', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Test Min Max',
        steps: [
          {
            id: 'step-1',
            type: 'aggregate',
            name: 'Min Max',
            order: 1,
            config: {
              groupBy: [],
              aggregations: [
                { field: 'value', operation: 'min' },
                { field: 'value', operation: 'max' },
              ],
            },
          },
        ],
        inputSourceIds: ['test-source'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const inputData = {
        'test-source': [
          { value: 10 },
          { value: 50 },
          { value: 30 },
        ],
      };

      const result = await executor.executePipeline(pipeline, inputData, {
        executionId: 'test-exec-6',
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        projectId: 'test',
        startTime: new Date(),
      });

      expect(result.outputData?.[0].value_min).toBe(10);
      expect(result.outputData?.[0].value_max).toBe(50);
    });
  });

  describe('Join Transformation', () => {
    it('should perform inner join', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Test Join',
        steps: [
          {
            id: 'step-1',
            type: 'join',
            name: 'Join Orders',
            order: 1,
            config: {
              targetSourceId: 'orders',
              joinKey: 'customer_id',
              joinType: 'inner',
            },
          },
        ],
        inputSourceIds: ['customers', 'orders'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const inputData = {
        customers: [
          { customer_id: 1, name: 'John' },
          { customer_id: 2, name: 'Jane' },
          { customer_id: 3, name: 'Bob' },
        ],
        orders: [
          { customer_id: 1, order_id: 101, amount: 100 },
          { customer_id: 1, order_id: 102, amount: 200 },
          { customer_id: 2, order_id: 103, amount: 150 },
        ],
      };

      const result = await executor.executePipeline(pipeline, inputData, {
        executionId: 'test-exec-7',
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        projectId: 'test',
        startTime: new Date(),
      });

      // Inner join creates one record for each matching pair
      // Customer 1 has 2 orders, Customer 2 has 1 order = 3 joined records
      expect(result.outputRecords).toBeGreaterThanOrEqual(3);
      expect(result.outputData?.some(r => r.name === 'John' && r.order_id === 101)).toBe(true);
    });

    it('should perform left join', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Test Left Join',
        steps: [
          {
            id: 'step-1',
            type: 'join',
            name: 'Left Join',
            order: 1,
            config: {
              targetSourceId: 'orders',
              joinKey: 'customer_id',
              joinType: 'left',
            },
          },
        ],
        inputSourceIds: ['customers', 'orders'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const inputData = {
        customers: [
          { customer_id: 1, name: 'John' },
          { customer_id: 2, name: 'Jane' },
          { customer_id: 3, name: 'Bob' },
        ],
        orders: [
          { customer_id: 1, order_id: 101 },
        ],
      };

      const result = await executor.executePipeline(pipeline, inputData, {
        executionId: 'test-exec-8',
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        projectId: 'test',
        startTime: new Date(),
      });

      // Left join should keep all customers even without orders
      expect(result.outputRecords).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Sort Transformation', () => {
    it('should sort by single field ascending', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Test Sort',
        steps: [
          {
            id: 'step-1',
            type: 'sort',
            name: 'Sort by Age',
            order: 1,
            config: {
              sortFields: [
                { field: 'age', direction: 'asc' },
              ],
            },
          },
        ],
        inputSourceIds: ['test-source'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const inputData = {
        'test-source': [
          { id: 1, age: 30 },
          { id: 2, age: 20 },
          { id: 3, age: 25 },
        ],
      };

      const result = await executor.executePipeline(pipeline, inputData, {
        executionId: 'test-exec-9',
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        projectId: 'test',
        startTime: new Date(),
      });

      expect(result.outputData?.[0].age).toBe(20);
      expect(result.outputData?.[1].age).toBe(25);
      expect(result.outputData?.[2].age).toBe(30);
    });

    it('should sort by multiple fields', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Multi Sort',
        steps: [
          {
            id: 'step-1',
            type: 'sort',
            name: 'Sort Multi',
            order: 1,
            config: {
              sortFields: [
                { field: 'department', direction: 'asc' },
                { field: 'salary', direction: 'desc' },
              ],
            },
          },
        ],
        inputSourceIds: ['test-source'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const inputData = {
        'test-source': [
          { id: 1, department: 'Sales', salary: 5000 },
          { id: 2, department: 'Sales', salary: 6000 },
          { id: 3, department: 'Engineering', salary: 7000 },
        ],
      };

      const result = await executor.executePipeline(pipeline, inputData, {
        executionId: 'test-exec-10',
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        projectId: 'test',
        startTime: new Date(),
      });

      // Engineering comes first (alphabetically)
      expect(result.outputData?.[0].department).toBe('Engineering');
      // Within Sales, higher salary first
      expect(result.outputData?.[1].salary).toBe(6000);
      expect(result.outputData?.[2].salary).toBe(5000);
    });
  });

  describe('Deduplicate Transformation', () => {
    it('should remove exact duplicate rows', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Test Dedupe',
        steps: [
          {
            id: 'step-1',
            type: 'deduplicate',
            name: 'Remove Duplicates',
            order: 1,
            config: {},
          },
        ],
        inputSourceIds: ['test-source'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const inputData = {
        'test-source': [
          { id: 1, name: 'John' },
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
          { id: 1, name: 'John' },
        ],
      };

      const result = await executor.executePipeline(pipeline, inputData, {
        executionId: 'test-exec-11',
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        projectId: 'test',
        startTime: new Date(),
      });

      expect(result.outputRecords).toBe(2);
    });
  });

  describe('Custom Script Transformation', () => {
    it('should execute custom JavaScript', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Test Custom',
        steps: [
          {
            id: 'step-1',
            type: 'custom_script',
            name: 'Custom Transform',
            order: 1,
            config: {
              scriptContent: `
                function transform(data) {
                  return data.map(row => ({
                    ...row,
                    full_name: row.first_name + ' ' + row.last_name
                  }));
                }
              `,
            },
          },
        ],
        inputSourceIds: ['test-source'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const inputData = {
        'test-source': [
          { first_name: 'John', last_name: 'Doe' },
        ],
      };

      const result = await executor.executePipeline(pipeline, inputData, {
        executionId: 'test-exec-12',
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        projectId: 'test',
        startTime: new Date(),
      });

      expect(result.outputData?.[0].full_name).toBe('John Doe');
    });
  });

  describe('Multi-step Pipelines', () => {
    it('should execute multiple steps in order', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Multi-step',
        steps: [
          {
            id: 'step-1',
            type: 'filter',
            name: 'Filter',
            order: 1,
            config: { filterExpression: 'row.age >= 18' },
          },
          {
            id: 'step-2',
            type: 'map',
            name: 'Map',
            order: 2,
            config: {
              fieldMappings: [{ from: 'age', to: 'years', transform: 'value * 1' }],
            },
          },
          {
            id: 'step-3',
            type: 'sort',
            name: 'Sort',
            order: 3,
            config: {
              sortFields: [{ field: 'years', direction: 'desc' }],
            },
          },
        ],
        inputSourceIds: ['test-source'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const inputData = {
        'test-source': [
          { id: 1, age: 25 },
          { id: 2, age: 17 },
          { id: 3, age: 30 },
        ],
      };

      const result = await executor.executePipeline(pipeline, inputData, {
        executionId: 'test-exec-13',
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        projectId: 'test',
        startTime: new Date(),
      });

      expect(result.status).toBe('completed');
      expect(result.steps).toHaveLength(3);
      expect(result.outputRecords).toBe(2);
      expect(result.outputData?.[0].years).toBe(30);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid filter expression', async () => {
      const pipeline: Pipeline = {
        id: 'test-pipeline',
        name: 'Bad Filter',
        steps: [
          {
            id: 'step-1',
            type: 'filter',
            name: 'Invalid Filter',
            order: 1,
            config: {
              filterExpression: 'invalid syntax (',
            },
          },
        ],
        inputSourceIds: ['test-source'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const inputData = {
        'test-source': [{ id: 1 }],
      };

      const result = await executor.executePipeline(pipeline, inputData, {
        executionId: 'test-exec-14',
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        projectId: 'test',
        startTime: new Date(),
      });

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });
  });
});

