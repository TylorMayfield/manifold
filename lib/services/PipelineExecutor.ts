/**
 * Pipeline Execution Engine
 * 
 * Executes ETL pipelines with transformation steps including:
 * - Filter: Filter rows based on expressions
 * - Map: Transform and rename columns
 * - Aggregate: Group and aggregate data
 * - Join: Join with other data sources
 * - Sort: Sort data
 * - Deduplicate: Remove duplicate rows
 * - Custom Script: Execute custom JavaScript
 */

import { Pipeline, TransformStep, TransformConfig, TransformType } from '../../types';
import { logger } from '../utils/logger';

// ==================== TYPES ====================

export interface ExecutionContext {
  executionId: string;
  pipelineId: string;
  pipelineName: string;
  projectId: string;
  startTime: Date;
  userId?: string;
}

export interface ExecutionResult {
  executionId: string;
  pipelineId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  inputRecords: number;
  outputRecords: number;
  recordsProcessed: number;
  steps: StepResult[];
  error?: string;
  outputData?: any[];
}

export interface StepResult {
  stepId: string;
  stepName: string;
  stepType: TransformType;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  inputRecords: number;
  outputRecords: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ExecutionProgress {
  executionId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep: number;
  totalSteps: number;
  currentStepName: string;
  progress: number; // 0-100
  recordsProcessed: number;
  message: string;
}

// ==================== PIPELINE EXECUTOR ====================

export class PipelineExecutor {
  private static instance: PipelineExecutor;
  private executions: Map<string, ExecutionResult> = new Map();
  private progressCallbacks: Map<string, ((progress: ExecutionProgress) => void)[]> = new Map();

  static getInstance(): PipelineExecutor {
    if (!PipelineExecutor.instance) {
      PipelineExecutor.instance = new PipelineExecutor();
    }
    return PipelineExecutor.instance;
  }

  /**
   * Execute a pipeline with data from specified sources
   */
  async executePipeline(
    pipeline: Pipeline,
    inputData: Record<string, any[]>, // Map of sourceId -> data
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const executionId = context.executionId;
    
    logger.info(`Starting pipeline execution: ${pipeline.name}`, 'pipeline-executor', {
      executionId,
      pipelineId: pipeline.id,
      stepCount: pipeline.steps.length,
      inputSources: Object.keys(inputData).length,
    });

    // Initialize execution result
    const result: ExecutionResult = {
      executionId,
      pipelineId: pipeline.id,
      status: 'running',
      startTime: context.startTime,
      inputRecords: this.countTotalRecords(inputData),
      outputRecords: 0,
      recordsProcessed: 0,
      steps: [],
    };

    this.executions.set(executionId, result);

    try {
      // Combine input data from all sources
      let currentData = this.combineInputData(inputData, pipeline.inputSourceIds);
      result.inputRecords = currentData.length;
      
      this.updateProgress(executionId, {
        executionId,
        status: 'running',
        currentStep: 0,
        totalSteps: pipeline.steps.length,
        currentStepName: 'Loading data',
        progress: 0,
        recordsProcessed: 0,
        message: `Loaded ${currentData.length} records from ${Object.keys(inputData).length} source(s)`,
      });

      // Execute each transformation step in order
      const sortedSteps = [...pipeline.steps].sort((a, b) => a.order - b.order);
      
      for (let i = 0; i < sortedSteps.length; i++) {
        const step = sortedSteps[i];
        const stepIndex = i + 1;
        
        logger.info(`Executing step ${stepIndex}/${sortedSteps.length}: ${step.name}`, 'pipeline-executor', {
          executionId,
          stepId: step.id,
          stepType: step.type,
          inputRecords: currentData.length,
        });

        const stepResult: StepResult = {
          stepId: step.id,
          stepName: step.name,
          stepType: step.type,
          status: 'running',
          startTime: new Date(),
          inputRecords: currentData.length,
          outputRecords: 0,
        };

        result.steps.push(stepResult);

        this.updateProgress(executionId, {
          executionId,
          status: 'running',
          currentStep: stepIndex,
          totalSteps: sortedSteps.length,
          currentStepName: step.name,
          progress: Math.round((stepIndex / sortedSteps.length) * 100),
          recordsProcessed: currentData.length,
          message: `Executing ${step.type}: ${step.name}`,
        });

        try {
          // Execute the transformation
          currentData = await this.executeStep(step, currentData, inputData);
          
          stepResult.status = 'completed';
          stepResult.endTime = new Date();
          stepResult.duration = stepResult.endTime.getTime() - stepResult.startTime!.getTime();
          stepResult.outputRecords = currentData.length;

          result.recordsProcessed += currentData.length;

          logger.info(`Step completed: ${step.name}`, 'pipeline-executor', {
            executionId,
            stepId: step.id,
            inputRecords: stepResult.inputRecords,
            outputRecords: stepResult.outputRecords,
            duration: stepResult.duration,
          });

        } catch (error) {
          stepResult.status = 'failed';
          stepResult.endTime = new Date();
          stepResult.error = error instanceof Error ? error.message : String(error);
          
          logger.error(`Step failed: ${step.name}`, 'pipeline-executor', {
            executionId,
            stepId: step.id,
            error: stepResult.error,
          });

          throw new Error(`Step "${step.name}" failed: ${stepResult.error}`);
        }
      }

      // Execution completed successfully
      result.status = 'completed';
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      result.outputRecords = currentData.length;
      result.outputData = currentData;

      this.updateProgress(executionId, {
        executionId,
        status: 'completed',
        currentStep: sortedSteps.length,
        totalSteps: sortedSteps.length,
        currentStepName: 'Completed',
        progress: 100,
        recordsProcessed: currentData.length,
        message: `Pipeline completed successfully. ${currentData.length} records processed.`,
      });

      logger.success(`Pipeline execution completed: ${pipeline.name}`, 'pipeline-executor', {
        executionId,
        duration: result.duration,
        inputRecords: result.inputRecords,
        outputRecords: result.outputRecords,
      });

      return result;

    } catch (error) {
      result.status = 'failed';
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      result.error = error instanceof Error ? error.message : String(error);

      this.updateProgress(executionId, {
        executionId,
        status: 'failed',
        currentStep: result.steps.length,
        totalSteps: pipeline.steps.length,
        currentStepName: 'Failed',
        progress: 0,
        recordsProcessed: result.recordsProcessed,
        message: `Pipeline execution failed: ${result.error}`,
      });

      logger.error(`Pipeline execution failed: ${pipeline.name}`, 'pipeline-executor', {
        executionId,
        error: result.error,
      });

      return result;
    }
  }

  /**
   * Execute a single transformation step
   */
  private async executeStep(
    step: TransformStep,
    data: any[],
    allInputData: Record<string, any[]>
  ): Promise<any[]> {
    switch (step.type) {
      case 'filter':
        return this.executeFilter(data, step.config);
      
      case 'map':
        return this.executeMap(data, step.config);
      
      case 'aggregate':
        return this.executeAggregate(data, step.config);
      
      case 'join':
        return this.executeJoin(data, step.config, allInputData);
      
      case 'sort':
        return this.executeSort(data, step.config);
      
      case 'deduplicate':
        return this.executeDeduplicate(data, step.config);
      
      case 'custom_script':
        return this.executeCustomScript(data, step.config);
      
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  // ==================== TRANSFORMATION IMPLEMENTATIONS ====================

  /**
   * Filter transformation: Filter rows based on expression
   */
  private executeFilter(data: any[], config: TransformConfig): any[] {
    if (!config.filterExpression) {
      throw new Error('Filter expression is required');
    }

    try {
      // Create a safe evaluation function
      const filterFn = new Function('row', `
        try {
          return ${config.filterExpression};
        } catch (error) {
          console.error('Filter evaluation error:', error);
          return false;
        }
      `);

      return data.filter(row => {
        try {
          return filterFn(row);
        } catch (error) {
          logger.warn('Filter evaluation error', 'pipeline-executor', { error, row });
          return false;
        }
      });
    } catch (error) {
      throw new Error(`Invalid filter expression: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Map transformation: Transform and rename columns
   */
  private executeMap(data: any[], config: TransformConfig): any[] {
    if (!config.fieldMappings || config.fieldMappings.length === 0) {
      return data;
    }

    return data.map(row => {
      const newRow: any = {};

      for (const mapping of config.fieldMappings!) {
        const sourceValue = row[mapping.from];
        
        if (mapping.transform) {
          // Apply transformation
          try {
            const transformFn = new Function('value', 'row', `return ${mapping.transform}`);
            newRow[mapping.to] = transformFn(sourceValue, row);
          } catch (error) {
            logger.warn('Transform function error', 'pipeline-executor', { error, mapping });
            newRow[mapping.to] = sourceValue;
          }
        } else {
          // Simple rename
          newRow[mapping.to] = sourceValue;
        }
      }

      return newRow;
    });
  }

  /**
   * Aggregate transformation: Group and aggregate data
   */
  private executeAggregate(data: any[], config: TransformConfig): any[] {
    if (!config.groupBy || config.groupBy.length === 0) {
      // No grouping - aggregate all rows
      return [this.aggregateRows(data, config.aggregations || [])];
    }

    // Group by specified fields
    const groups: Map<string, any[]> = new Map();

    for (const row of data) {
      const key = config.groupBy.map(field => String(row[field])).join('|');
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(row);
    }

    // Aggregate each group
    const results: any[] = [];
    
    for (const [key, groupRows] of groups) {
      const groupValues = key.split('|');
      const result: any = {};
      
      // Add group by fields
      config.groupBy.forEach((field, index) => {
        result[field] = groupRows[0][field]; // Use original value from first row
      });
      
      // Add aggregations
      const aggregated = this.aggregateRows(groupRows, config.aggregations || []);
      Object.assign(result, aggregated);
      
      results.push(result);
    }

    return results;
  }

  /**
   * Aggregate a set of rows
   */
  private aggregateRows(rows: any[], aggregations: { field: string; operation: string }[]): any {
    const result: any = {};

    for (const agg of aggregations) {
      const values = rows.map(row => row[agg.field]).filter(v => v !== null && v !== undefined);
      const outputField = `${agg.field}_${agg.operation}`;

      switch (agg.operation) {
        case 'sum':
          result[outputField] = values.reduce((sum, val) => sum + Number(val), 0);
          break;
        
        case 'avg':
          result[outputField] = values.length > 0 
            ? values.reduce((sum, val) => sum + Number(val), 0) / values.length 
            : 0;
          break;
        
        case 'count':
          result[outputField] = values.length;
          break;
        
        case 'min':
          result[outputField] = values.length > 0 ? Math.min(...values.map(Number)) : null;
          break;
        
        case 'max':
          result[outputField] = values.length > 0 ? Math.max(...values.map(Number)) : null;
          break;
        
        default:
          throw new Error(`Unknown aggregation operation: ${agg.operation}`);
      }
    }

    return result;
  }

  /**
   * Join transformation: Join with another data source
   */
  private executeJoin(
    leftData: any[],
    config: TransformConfig,
    allInputData: Record<string, any[]>
  ): any[] {
    if (!config.targetSourceId || !config.joinKey) {
      throw new Error('Join requires targetSourceId and joinKey');
    }

    const rightData = allInputData[config.targetSourceId];
    if (!rightData) {
      throw new Error(`Target data source not found: ${config.targetSourceId}`);
    }

    const joinType = config.joinType || 'inner';
    const joinKey = config.joinKey;

    // Create lookup map for right data
    const rightMap: Map<any, any[]> = new Map();
    for (const row of rightData) {
      const key = row[joinKey];
      if (!rightMap.has(key)) {
        rightMap.set(key, []);
      }
      rightMap.get(key)!.push(row);
    }

    const results: any[] = [];

    // Perform join
    for (const leftRow of leftData) {
      const key = leftRow[joinKey];
      const matchingRightRows = rightMap.get(key) || [];

      if (matchingRightRows.length > 0) {
        // Inner/Left join with matches
        for (const rightRow of matchingRightRows) {
          results.push({ ...leftRow, ...rightRow });
        }
      } else if (joinType === 'left' || joinType === 'outer') {
        // Left join without match
        results.push(leftRow);
      }
    }

    // Handle right/outer join - add unmatched right rows
    if (joinType === 'right' || joinType === 'outer') {
      const leftKeys = new Set(leftData.map(row => row[joinKey]));
      
      for (const rightRow of rightData) {
        if (!leftKeys.has(rightRow[joinKey])) {
          results.push(rightRow);
        }
      }
    }

    return results;
  }

  /**
   * Sort transformation: Sort data by specified fields
   */
  private executeSort(data: any[], config: TransformConfig): any[] {
    if (!config.sortFields || config.sortFields.length === 0) {
      return data;
    }

    const sorted = [...data];
    
    sorted.sort((a, b) => {
      for (const sortField of config.sortFields!) {
        const aVal = a[sortField.field];
        const bVal = b[sortField.field];
        
        let comparison = 0;
        
        if (aVal < bVal) comparison = -1;
        else if (aVal > bVal) comparison = 1;
        
        if (comparison !== 0) {
          return sortField.direction === 'desc' ? -comparison : comparison;
        }
      }
      
      return 0;
    });

    return sorted;
  }

  /**
   * Deduplicate transformation: Remove duplicate rows
   */
  private executeDeduplicate(data: any[], config: TransformConfig): any[] {
    const seen = new Set<string>();
    const results: any[] = [];

    for (const row of data) {
      // Create a key from all fields
      const key = JSON.stringify(row);
      
      if (!seen.has(key)) {
        seen.add(key);
        results.push(row);
      }
    }

    return results;
  }

  /**
   * Custom Script transformation: Execute custom JavaScript
   */
  private async executeCustomScript(data: any[], config: TransformConfig): Promise<any[]> {
    if (!config.scriptContent) {
      throw new Error('Custom script requires scriptContent');
    }

    try {
      // Create a safe execution context
      const scriptFn = new Function('data', `
        ${config.scriptContent}
        
        // If the script doesn't return anything, return the data unchanged
        if (typeof transform === 'function') {
          return transform(data);
        }
        return data;
      `);

      const result = scriptFn(data);
      
      if (!Array.isArray(result)) {
        throw new Error('Custom script must return an array');
      }

      return result;
    } catch (error) {
      throw new Error(`Custom script execution error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Combine input data from multiple sources
   */
  private combineInputData(
    inputData: Record<string, any[]>,
    sourceIds: string[]
  ): any[] {
    if (sourceIds.length === 0) {
      // No specific sources - combine all
      return Object.values(inputData).flat();
    }

    // Combine only specified sources
    const combined: any[] = [];
    for (const sourceId of sourceIds) {
      if (inputData[sourceId]) {
        combined.push(...inputData[sourceId]);
      }
    }

    return combined;
  }

  /**
   * Count total records in input data
   */
  private countTotalRecords(inputData: Record<string, any[]>): number {
    return Object.values(inputData).reduce((sum, data) => sum + data.length, 0);
  }

  /**
   * Update execution progress
   */
  private updateProgress(executionId: string, progress: ExecutionProgress): void {
    const callbacks = this.progressCallbacks.get(executionId) || [];
    callbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        logger.error('Progress callback error', 'pipeline-executor', { error });
      }
    });
  }

  /**
   * Subscribe to execution progress updates
   */
  onProgress(executionId: string, callback: (progress: ExecutionProgress) => void): () => void {
    if (!this.progressCallbacks.has(executionId)) {
      this.progressCallbacks.set(executionId, []);
    }
    
    this.progressCallbacks.get(executionId)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.progressCallbacks.get(executionId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Get execution result
   */
  getExecution(executionId: string): ExecutionResult | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get all executions
   */
  getAllExecutions(): ExecutionResult[] {
    return Array.from(this.executions.values());
  }

  /**
   * Cancel a running execution
   */
  cancelExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    
    if (execution && execution.status === 'running') {
      execution.status = 'cancelled';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
      
      this.updateProgress(executionId, {
        executionId,
        status: 'cancelled',
        currentStep: execution.steps.length,
        totalSteps: execution.steps.length,
        currentStepName: 'Cancelled',
        progress: 0,
        recordsProcessed: execution.recordsProcessed,
        message: 'Execution cancelled by user',
      });

      logger.warn('Pipeline execution cancelled', 'pipeline-executor', { executionId });
      
      return true;
    }

    return false;
  }

  /**
   * Clear execution history
   */
  clearExecutions(olderThan?: Date): void {
    if (olderThan) {
      // Clear old executions
      for (const [id, execution] of this.executions) {
        if (execution.endTime && execution.endTime < olderThan) {
          this.executions.delete(id);
          this.progressCallbacks.delete(id);
        }
      }
    } else {
      // Clear all completed/failed executions
      for (const [id, execution] of this.executions) {
        if (execution.status !== 'running') {
          this.executions.delete(id);
          this.progressCallbacks.delete(id);
        }
      }
    }
  }
}

// Export singleton instance
export const pipelineExecutor = PipelineExecutor.getInstance();

