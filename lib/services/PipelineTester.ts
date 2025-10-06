/**
 * Pipeline Testing Framework
 * 
 * Allows users to test pipelines with sample data before production runs.
 * 
 * Features:
 * - Test with sample data (first N records)
 * - Test with custom test data
 * - Test with mock data
 * - Validation and assertions
 * - Step-by-step preview
 * - Test result comparison
 * - Performance testing
 */

import { Pipeline } from '../../types';
import { pipelineExecutor, ExecutionResult } from './PipelineExecutor';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// ==================== TYPES ====================

export interface PipelineTest {
  id: string;
  pipelineId: string;
  name: string;
  description?: string;
  testData: TestDataConfig;
  assertions?: TestAssertion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TestDataConfig {
  mode: 'sample' | 'custom' | 'mock';
  
  // Sample mode: use first N records from actual sources
  sampleSize?: number;
  sourceIds?: string[];
  
  // Custom mode: user-provided test data
  customData?: Record<string, any[]>;
  
  // Mock mode: generate test data
  mockConfig?: {
    recordCount: number;
    schema?: Record<string, any>;
  };
}

export interface TestAssertion {
  id: string;
  type: 'record_count' | 'field_exists' | 'value_match' | 'no_nulls' | 'unique' | 'custom';
  description: string;
  config: AssertionConfig;
}

export interface AssertionConfig {
  // Record count assertion
  expectedCount?: number;
  minCount?: number;
  maxCount?: number;
  
  // Field assertions
  field?: string;
  expectedValue?: any;
  operator?: 'equals' | 'not_equals' | 'gt' | 'lt' | 'contains' | 'matches';
  
  // Custom assertion
  customCode?: string;
}

export interface TestResult {
  testId: string;
  pipelineId: string;
  status: 'passed' | 'failed' | 'error';
  executionResult: ExecutionResult;
  assertionResults: AssertionResult[];
  stepPreviews: StepPreview[];
  duration: number;
  timestamp: Date;
  error?: string;
}

export interface AssertionResult {
  assertionId: string;
  description: string;
  passed: boolean;
  expected: any;
  actual: any;
  message: string;
}

export interface StepPreview {
  stepId: string;
  stepName: string;
  stepType: string;
  inputSample: any[];
  outputSample: any[];
  inputCount: number;
  outputCount: number;
}

// ==================== PIPELINE TESTER ====================

export class PipelineTester {
  private static instance: PipelineTester;
  private tests: Map<string, PipelineTest> = new Map();
  private testResults: Map<string, TestResult[]> = new Map();

  static getInstance(): PipelineTester {
    if (!PipelineTester.instance) {
      PipelineTester.instance = new PipelineTester();
    }
    return PipelineTester.instance;
  }

  /**
   * Create a new test for a pipeline
   */
  createTest(test: Omit<PipelineTest, 'id' | 'createdAt' | 'updatedAt'>): PipelineTest {
    const newTest: PipelineTest = {
      ...test,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tests.set(newTest.id, newTest);
    
    logger.info(`Pipeline test created: ${newTest.name}`, 'pipeline-tester', {
      testId: newTest.id,
      pipelineId: newTest.pipelineId,
    });

    return newTest;
  }

  /**
   * Run a test against a pipeline
   */
  async runTest(
    testId: string,
    pipeline: Pipeline,
    productionData?: Record<string, any[]>
  ): Promise<TestResult> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test not found: ${testId}`);
    }

    const startTime = Date.now();

    logger.info(`Running pipeline test: ${test.name}`, 'pipeline-tester', {
      testId,
      pipelineId: pipeline.id,
    });

    try {
      // Prepare test data
      const testData = await this.prepareTestData(test.testData, productionData);

      // Execute pipeline with test data
      const executionResult = await pipelineExecutor.executePipeline(
        pipeline,
        testData,
        {
          executionId: `test-${uuidv4()}`,
          pipelineId: pipeline.id,
          pipelineName: pipeline.name,
          projectId: 'test',
          startTime: new Date(),
        }
      );

      // Generate step previews
      const stepPreviews = this.generateStepPreviews(executionResult, testData);

      // Run assertions
      const assertionResults = await this.runAssertions(
        test.assertions || [],
        executionResult,
        testData
      );

      // Determine overall status
      const allPassed = assertionResults.length === 0 || assertionResults.every(a => a.passed);
      const status = executionResult.status === 'completed' && allPassed ? 'passed' : 'failed';

      const testResult: TestResult = {
        testId,
        pipelineId: pipeline.id,
        status,
        executionResult,
        assertionResults,
        stepPreviews,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

      // Store test result
      const results = this.testResults.get(testId) || [];
      results.unshift(testResult);
      this.testResults.set(testId, results);

      logger.success(`Pipeline test completed: ${test.name}`, 'pipeline-tester', {
        testId,
        status,
        duration: testResult.duration,
        assertionsPassed: assertionResults.filter(a => a.passed).length,
        assertionsTotal: assertionResults.length,
      });

      return testResult;

    } catch (error) {
      const testResult: TestResult = {
        testId,
        pipelineId: pipeline.id,
        status: 'error',
        executionResult: {
          executionId: `test-error-${uuidv4()}`,
          pipelineId: pipeline.id,
          status: 'failed',
          startTime: new Date(),
          inputRecords: 0,
          outputRecords: 0,
          recordsProcessed: 0,
          steps: [],
          error: error instanceof Error ? error.message : String(error),
        },
        assertionResults: [],
        stepPreviews: [],
        duration: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
      };

      logger.error(`Pipeline test failed: ${test.name}`, 'pipeline-tester', {
        testId,
        error: testResult.error,
      });

      return testResult;
    }
  }

  /**
   * Prepare test data based on configuration
   */
  private async prepareTestData(
    config: TestDataConfig,
    productionData?: Record<string, any[]>
  ): Promise<Record<string, any[]>> {
    switch (config.mode) {
      case 'sample':
        return this.prepareSampleData(config, productionData);
      
      case 'custom':
        return this.prepareCustomData(config);
      
      case 'mock':
        return this.prepareMockData(config);
      
      default:
        throw new Error(`Unknown test data mode: ${config.mode}`);
    }
  }

  /**
   * Use sample from production data
   */
  private async prepareSampleData(
    config: TestDataConfig,
    productionData?: Record<string, any[]>
  ): Promise<Record<string, any[]>> {
    if (!productionData) {
      throw new Error('Production data required for sample mode');
    }

    const sampleSize = config.sampleSize || 100;
    const sampleData: Record<string, any[]> = {};

    for (const [sourceId, data] of Object.entries(productionData)) {
      sampleData[sourceId] = data.slice(0, sampleSize);
    }

    return sampleData;
  }

  /**
   * Use custom test data
   */
  private async prepareCustomData(config: TestDataConfig): Promise<Record<string, any[]>> {
    if (!config.customData) {
      throw new Error('Custom data required for custom mode');
    }

    return config.customData;
  }

  /**
   * Generate mock test data
   */
  private async prepareMockData(config: TestDataConfig): Promise<Record<string, any[]>> {
    if (!config.mockConfig) {
      throw new Error('Mock config required for mock mode');
    }

    const mockData: any[] = [];
    const recordCount = config.mockConfig.recordCount || 100;

    // Generate mock records based on schema
    for (let i = 0; i < recordCount; i++) {
      const record: any = { id: i + 1 };

      if (config.mockConfig.schema) {
        for (const [field, type] of Object.entries(config.mockConfig.schema)) {
          record[field] = this.generateMockValue(type, i);
        }
      }

      mockData.push(record);
    }

    return { mock: mockData };
  }

  /**
   * Generate mock value based on type
   */
  private generateMockValue(type: any, index: number): any {
    if (typeof type === 'string') {
      switch (type) {
        case 'string':
          return `Value ${index}`;
        case 'number':
          return Math.floor(Math.random() * 1000);
        case 'boolean':
          return Math.random() > 0.5;
        case 'email':
          return `user${index}@example.com`;
        case 'phone':
          return `(555) ${String(index).padStart(3, '0')}-${String(index * 2).padStart(4, '0')}`;
        case 'date':
          return new Date(2025, 0, 1 + index).toISOString();
        default:
          return `Mock ${index}`;
      }
    }

    return type;
  }

  /**
   * Run assertions on test results
   */
  private async runAssertions(
    assertions: TestAssertion[],
    executionResult: ExecutionResult,
    testData: Record<string, any[]>
  ): Promise<AssertionResult[]> {
    const results: AssertionResult[] = [];

    for (const assertion of assertions) {
      const result = await this.runAssertion(assertion, executionResult, testData);
      results.push(result);
    }

    return results;
  }

  /**
   * Run a single assertion
   */
  private async runAssertion(
    assertion: TestAssertion,
    executionResult: ExecutionResult,
    testData: Record<string, any[]>
  ): Promise<AssertionResult> {
    const outputData = executionResult.outputData || [];

    try {
      switch (assertion.type) {
        case 'record_count':
          return this.assertRecordCount(assertion, outputData);
        
        case 'field_exists':
          return this.assertFieldExists(assertion, outputData);
        
        case 'value_match':
          return this.assertValueMatch(assertion, outputData);
        
        case 'no_nulls':
          return this.assertNoNulls(assertion, outputData);
        
        case 'unique':
          return this.assertUnique(assertion, outputData);
        
        case 'custom':
          return this.assertCustom(assertion, outputData);
        
        default:
          throw new Error(`Unknown assertion type: ${assertion.type}`);
      }
    } catch (error) {
      return {
        assertionId: assertion.id,
        description: assertion.description,
        passed: false,
        expected: null,
        actual: null,
        message: `Assertion error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Assert record count
   */
  private assertRecordCount(assertion: TestAssertion, data: any[]): AssertionResult {
    const actual = data.length;
    let passed = false;
    let expected: any = null;

    if (assertion.config.expectedCount !== undefined) {
      expected = assertion.config.expectedCount;
      passed = actual === expected;
    } else if (assertion.config.minCount !== undefined && assertion.config.maxCount !== undefined) {
      expected = `${assertion.config.minCount}-${assertion.config.maxCount}`;
      passed = actual >= assertion.config.minCount && actual <= assertion.config.maxCount;
    } else if (assertion.config.minCount !== undefined) {
      expected = `>= ${assertion.config.minCount}`;
      passed = actual >= assertion.config.minCount;
    } else if (assertion.config.maxCount !== undefined) {
      expected = `<= ${assertion.config.maxCount}`;
      passed = actual <= assertion.config.maxCount;
    }

    return {
      assertionId: assertion.id,
      description: assertion.description,
      passed,
      expected,
      actual,
      message: passed 
        ? `Record count matches expectation (${actual})`
        : `Expected ${expected} records, got ${actual}`,
    };
  }

  /**
   * Assert field exists in all records
   */
  private assertFieldExists(assertion: TestAssertion, data: any[]): AssertionResult {
    const field = assertion.config.field!;
    const recordsWithField = data.filter(r => field in r).length;
    const passed = recordsWithField === data.length;

    return {
      assertionId: assertion.id,
      description: assertion.description,
      passed,
      expected: data.length,
      actual: recordsWithField,
      message: passed
        ? `Field '${field}' exists in all records`
        : `Field '${field}' missing in ${data.length - recordsWithField} records`,
    };
  }

  /**
   * Assert field value matches
   */
  private assertValueMatch(assertion: TestAssertion, data: any[]): AssertionResult {
    const field = assertion.config.field!;
    const expectedValue = assertion.config.expectedValue;
    const operator = assertion.config.operator || 'equals';

    let matchCount = 0;

    for (const record of data) {
      const actualValue = record[field];
      let matches = false;

      switch (operator) {
        case 'equals':
          matches = actualValue === expectedValue;
          break;
        case 'not_equals':
          matches = actualValue !== expectedValue;
          break;
        case 'gt':
          matches = actualValue > expectedValue;
          break;
        case 'lt':
          matches = actualValue < expectedValue;
          break;
        case 'contains':
          matches = String(actualValue).includes(String(expectedValue));
          break;
        case 'matches':
          matches = new RegExp(expectedValue).test(String(actualValue));
          break;
      }

      if (matches) matchCount++;
    }

    const passed = matchCount === data.length;

    return {
      assertionId: assertion.id,
      description: assertion.description,
      passed,
      expected: `All records ${operator} ${expectedValue}`,
      actual: `${matchCount}/${data.length} records match`,
      message: passed
        ? `All records match condition`
        : `${data.length - matchCount} records don't match`,
    };
  }

  /**
   * Assert no null values in field
   */
  private assertNoNulls(assertion: TestAssertion, data: any[]): AssertionResult {
    const field = assertion.config.field!;
    const nullCount = data.filter(r => 
      r[field] === null || r[field] === undefined || r[field] === ''
    ).length;

    const passed = nullCount === 0;

    return {
      assertionId: assertion.id,
      description: assertion.description,
      passed,
      expected: 0,
      actual: nullCount,
      message: passed
        ? `No null values in '${field}'`
        : `${nullCount} null values found in '${field}'`,
    };
  }

  /**
   * Assert field values are unique
   */
  private assertUnique(assertion: TestAssertion, data: any[]): AssertionResult {
    const field = assertion.config.field!;
    const values = data.map(r => r[field]);
    const uniqueValues = new Set(values);
    const duplicates = values.length - uniqueValues.size;

    const passed = duplicates === 0;

    return {
      assertionId: assertion.id,
      description: assertion.description,
      passed,
      expected: values.length,
      actual: uniqueValues.size,
      message: passed
        ? `All values in '${field}' are unique`
        : `${duplicates} duplicate values in '${field}'`,
    };
  }

  /**
   * Run custom assertion
   */
  private assertCustom(assertion: TestAssertion, data: any[]): AssertionResult {
    if (!assertion.config.customCode) {
      throw new Error('Custom code required for custom assertion');
    }

    try {
      const assertFn = new Function('data', `
        ${assertion.config.customCode}
        
        if (typeof check === 'function') {
          return check(data);
        }
        return false;
      `);

      const result = assertFn(data);
      const passed = Boolean(result);

      return {
        assertionId: assertion.id,
        description: assertion.description,
        passed,
        expected: true,
        actual: result,
        message: passed ? 'Custom assertion passed' : 'Custom assertion failed',
      };
    } catch (error) {
      return {
        assertionId: assertion.id,
        description: assertion.description,
        passed: false,
        expected: true,
        actual: false,
        message: `Custom assertion error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Generate previews for each step
   */
  private generateStepPreviews(
    executionResult: ExecutionResult,
    inputData: Record<string, any[]>
  ): StepPreview[] {
    const previews: StepPreview[] = [];
    
    // This would require modifying the executor to capture intermediate data
    // For now, return empty array
    // TODO: Enhance PipelineExecutor to capture step outputs

    return previews;
  }

  /**
   * Get test by ID
   */
  getTest(testId: string): PipelineTest | undefined {
    return this.tests.get(testId);
  }

  /**
   * Get all tests for a pipeline
   */
  getPipelineTests(pipelineId: string): PipelineTest[] {
    return Array.from(this.tests.values())
      .filter(t => t.pipelineId === pipelineId);
  }

  /**
   * Get test results
   */
  getTestResults(testId: string): TestResult[] {
    return this.testResults.get(testId) || [];
  }

  /**
   * Delete test
   */
  deleteTest(testId: string): boolean {
    const deleted = this.tests.delete(testId);
    this.testResults.delete(testId);
    return deleted;
  }

  /**
   * Compare test results to detect regressions
   */
  compareTestResults(
    currentResult: TestResult,
    previousResult: TestResult
  ): {
    hasRegression: boolean;
    differences: string[];
  } {
    const differences: string[] = [];

    // Compare record counts
    if (currentResult.executionResult.outputRecords !== previousResult.executionResult.outputRecords) {
      differences.push(
        `Output record count changed: ${previousResult.executionResult.outputRecords} → ${currentResult.executionResult.outputRecords}`
      );
    }

    // Compare assertion results
    const prevPassed = previousResult.assertionResults.filter(a => a.passed).length;
    const currPassed = currentResult.assertionResults.filter(a => a.passed).length;

    if (currPassed < prevPassed) {
      differences.push(`Assertions passed: ${prevPassed} → ${currPassed} (regression!)`);
    }

    // Compare performance
    const perfChange = ((currentResult.duration - previousResult.duration) / previousResult.duration) * 100;
    if (Math.abs(perfChange) > 20) {
      differences.push(
        `Performance changed by ${perfChange.toFixed(1)}%: ${previousResult.duration}ms → ${currentResult.duration}ms`
      );
    }

    const hasRegression = differences.some(d => d.includes('regression'));

    return { hasRegression, differences };
  }
}

// Export singleton instance
export const pipelineTester = PipelineTester.getInstance();

