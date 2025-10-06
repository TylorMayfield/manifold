/**
 * Pipeline Preview Service
 * 
 * Provides live data preview at each transformation step:
 * - Sample data execution (no full data load)
 * - Step-by-step preview
 * - Real-time updates as user edits
 * - Data profiling at each step
 * - Performance estimation
 * - Error detection before full run
 */

import { logger } from '../utils/logger';
import { pipelineExecutor } from './PipelineExecutor';
import { Pipeline, TransformStep } from '../../types';

// ==================== TYPES ====================

export interface PreviewRequest {
  pipeline: Pipeline;
  stepIndex?: number; // Preview up to this step (default: all)
  sampleSize?: number; // Number of records to preview (default: 100)
  inputData?: Record<string, any[]>; // Optional input data override
}

export interface StepPreview {
  stepId: string;
  stepName: string;
  stepType: string;
  stepOrder: number;
  
  // Input/Output
  inputRecords: number;
  outputRecords: number;
  sampleInput: any[];
  sampleOutput: any[];
  
  // Analysis
  dataProfile: DataProfile;
  estimatedPerformance: PerformanceEstimate;
  
  // Issues
  warnings: string[];
  errors: string[];
  
  // Execution
  executionTime: number;
  status: 'success' | 'error' | 'warning';
}

export interface DataProfile {
  recordCount: number;
  fieldCount: number;
  fields: FieldProfile[];
  sampleRows: any[];
}

export interface FieldProfile {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'null';
  nullable: boolean;
  uniqueValues: number;
  sampleValues: any[];
  statistics?: {
    min?: number;
    max?: number;
    avg?: number;
    median?: number;
    nullCount?: number;
    uniqueCount?: number;
  };
}

export interface PerformanceEstimate {
  estimatedDuration: number; // Milliseconds
  estimatedMemory: number; // MB
  scalability: 'excellent' | 'good' | 'fair' | 'poor';
  recommendation?: string;
}

export interface PipelinePreviewResult {
  pipelineId: string;
  pipelineName: string;
  totalSteps: number;
  previewSteps: StepPreview[];
  overallStatus: 'success' | 'error' | 'warning';
  totalExecutionTime: number;
  finalDataProfile: DataProfile;
}

// ==================== PIPELINE PREVIEW SERVICE ====================

export class PipelinePreviewService {
  private static instance: PipelinePreviewService;
  
  private previewCache: Map<string, PipelinePreviewResult> = new Map();
  private maxCacheSize = 50;

  static getInstance(): PipelinePreviewService {
    if (!PipelinePreviewService.instance) {
      PipelinePreviewService.instance = new PipelinePreviewService();
    }
    return PipelinePreviewService.instance;
  }

  constructor() {}

  // ==================== PREVIEW GENERATION ====================

  /**
   * Generate preview for entire pipeline or up to specific step
   */
  async generatePreview(request: PreviewRequest): Promise<PipelinePreviewResult> {
    const startTime = Date.now();
    const sampleSize = request.sampleSize || 100;
    const stepIndex = request.stepIndex ?? request.pipeline.steps.length - 1;

    logger.info(`Generating pipeline preview: ${request.pipeline.name}`, 'pipeline-preview', {
      pipelineId: request.pipeline.id,
      sampleSize,
      stepsToPreview: stepIndex + 1,
    });

    // Check cache
    const cacheKey = this.getCacheKey(request);
    if (this.previewCache.has(cacheKey)) {
      logger.info('Returning cached preview', 'pipeline-preview');
      return this.previewCache.get(cacheKey)!;
    }

    const result: PipelinePreviewResult = {
      pipelineId: request.pipeline.id,
      pipelineName: request.pipeline.name,
      totalSteps: request.pipeline.steps.length,
      previewSteps: [],
      overallStatus: 'success',
      totalExecutionTime: 0,
      finalDataProfile: {
        recordCount: 0,
        fieldCount: 0,
        fields: [],
        sampleRows: [],
      },
    };

    try {
      // Get sample input data
      let currentData = await this.getSampleInputData(
        request.pipeline,
        request.inputData,
        sampleSize
      );

      // Sort steps by order
      const sortedSteps = [...request.pipeline.steps]
        .sort((a, b) => a.order - b.order)
        .slice(0, stepIndex + 1);

      // Execute each step and capture preview
      for (let i = 0; i < sortedSteps.length; i++) {
        const step = sortedSteps[i];
        const stepPreview = await this.previewStep(step, currentData, i);

        result.previewSteps.push(stepPreview);
        result.totalExecutionTime += stepPreview.executionTime;

        // Check for errors
        if (stepPreview.status === 'error') {
          result.overallStatus = 'error';
          break;
        } else if (stepPreview.status === 'warning' && result.overallStatus !== 'error') {
          result.overallStatus = 'warning';
        }

        // Use output as input for next step
        currentData = stepPreview.sampleOutput;
      }

      // Generate final data profile
      result.finalDataProfile = this.profileData(currentData);

      // Cache result
      this.cachePreview(cacheKey, result);

      logger.success(`Pipeline preview generated: ${request.pipeline.name}`, 'pipeline-preview', {
        steps: result.previewSteps.length,
        finalRecords: result.finalDataProfile.recordCount,
        duration: Date.now() - startTime,
      });

    } catch (error) {
      logger.error(`Pipeline preview failed: ${request.pipeline.name}`, 'pipeline-preview', {
        error,
      });

      result.overallStatus = 'error';
    }

    return result;
  }

  /**
   * Preview a single transformation step
   */
  private async previewStep(
    step: TransformStep,
    inputData: any[],
    stepIndex: number
  ): Promise<StepPreview> {
    const startTime = Date.now();

    logger.info(`Previewing step ${stepIndex + 1}: ${step.name}`, 'pipeline-preview', {
      stepType: step.type,
      inputRecords: inputData.length,
    });

    const preview: StepPreview = {
      stepId: step.id,
      stepName: step.name,
      stepType: step.type,
      stepOrder: step.order,
      inputRecords: inputData.length,
      outputRecords: 0,
      sampleInput: inputData.slice(0, 10), // Show first 10 records
      sampleOutput: [],
      dataProfile: this.profileData(inputData),
      estimatedPerformance: this.estimatePerformance(step, inputData.length),
      warnings: [],
      errors: [],
      executionTime: 0,
      status: 'success',
    };

    try {
      // Execute step using pipeline executor
      const outputData = await this.executeStep(step, inputData);

      preview.outputRecords = outputData.length;
      preview.sampleOutput = outputData.slice(0, 10);
      preview.executionTime = Date.now() - startTime;

      // Analyze output
      preview.dataProfile = this.profileData(outputData);

      // Generate warnings
      preview.warnings = this.generateWarnings(step, inputData, outputData);

      // Determine status
      if (preview.warnings.length > 0) {
        preview.status = 'warning';
      }

      logger.success(`Step preview completed: ${step.name}`, 'pipeline-preview', {
        inputRecords: preview.inputRecords,
        outputRecords: preview.outputRecords,
        duration: preview.executionTime,
      });

    } catch (error) {
      preview.status = 'error';
      preview.errors.push(error instanceof Error ? error.message : String(error));

      logger.error(`Step preview failed: ${step.name}`, 'pipeline-preview', {
        error,
      });
    }

    return preview;
  }

  /**
   * Execute a single step (uses PipelineExecutor logic)
   */
  private async executeStep(step: TransformStep, inputData: any[]): Promise<any[]> {
    // Create a temporary pipeline with just this step
    const tempPipeline: Pipeline = {
      id: 'preview-temp',
      name: 'Preview',
      steps: [step],
      inputSourceIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await pipelineExecutor.executePipeline(
      tempPipeline,
      { temp: inputData },
      {
        executionId: `preview-${Date.now()}`,
        pipelineId: 'preview-temp',
        pipelineName: 'Preview',
        projectId: 'preview',
        startTime: new Date(),
      }
    );

    return result.outputData || [];
  }

  // ==================== DATA PROFILING ====================

  /**
   * Profile data to show structure and statistics
   */
  private profileData(data: any[]): DataProfile {
    if (data.length === 0) {
      return {
        recordCount: 0,
        fieldCount: 0,
        fields: [],
        sampleRows: [],
      };
    }

    const fields = Object.keys(data[0]);
    const fieldProfiles: FieldProfile[] = [];

    for (const fieldName of fields) {
      const values = data.map(row => row[fieldName]);
      const nonNullValues = values.filter(v => v != null);
      const uniqueValues = new Set(nonNullValues);

      const fieldProfile: FieldProfile = {
        name: fieldName,
        type: this.inferType(nonNullValues[0]),
        nullable: nonNullValues.length < values.length,
        uniqueValues: uniqueValues.size,
        sampleValues: Array.from(uniqueValues).slice(0, 5),
      };

      // Calculate statistics for numeric fields
      if (fieldProfile.type === 'number') {
        const numbers = nonNullValues.filter(v => typeof v === 'number') as number[];
        if (numbers.length > 0) {
          fieldProfile.statistics = {
            min: Math.min(...numbers),
            max: Math.max(...numbers),
            avg: numbers.reduce((sum, n) => sum + n, 0) / numbers.length,
            nullCount: values.length - nonNullValues.length,
            uniqueCount: uniqueValues.size,
          };
        }
      }

      fieldProfiles.push(fieldProfile);
    }

    return {
      recordCount: data.length,
      fieldCount: fields.length,
      fields: fieldProfiles,
      sampleRows: data.slice(0, 5),
    };
  }

  /**
   * Infer data type from value
   */
  private inferType(value: any): FieldProfile['type'] {
    if (value == null) return 'null';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return 'string';
  }

  // ==================== PERFORMANCE ESTIMATION ====================

  /**
   * Estimate performance for a step
   */
  private estimatePerformance(step: TransformStep, recordCount: number): PerformanceEstimate {
    const complexityFactors: Record<string, number> = {
      filter: 1,
      map: 1.2,
      sort: 2,
      deduplicate: 2.5,
      join: 3,
      aggregate: 2,
      custom_script: 1.5,
    };

    const complexity = complexityFactors[step.type] || 1;
    const baseTime = 0.001; // 1ms per record base
    
    const estimatedDuration = Math.round(recordCount * baseTime * complexity);
    const estimatedMemory = Math.round((recordCount * 0.001) * complexity); // MB

    let scalability: PerformanceEstimate['scalability'] = 'excellent';
    let recommendation: string | undefined;

    if (step.type === 'join' && recordCount > 10000) {
      scalability = 'fair';
      recommendation = 'Consider adding filters before join to reduce data size';
    } else if (step.type === 'sort' && recordCount > 50000) {
      scalability = 'good';
      recommendation = 'Sorting large datasets may be slow - consider indexing';
    } else if (step.type === 'deduplicate' && recordCount > 100000) {
      scalability = 'fair';
      recommendation = 'Deduplication is memory intensive - consider partitioning';
    }

    return {
      estimatedDuration,
      estimatedMemory,
      scalability,
      recommendation,
    };
  }

  // ==================== WARNINGS & VALIDATION ====================

  /**
   * Generate warnings for a step
   */
  private generateWarnings(step: TransformStep, inputData: any[], outputData: any[]): string[] {
    const warnings: string[] = [];

    // Check for data loss
    const dataLossPercentage = ((inputData.length - outputData.length) / inputData.length) * 100;
    if (dataLossPercentage > 50) {
      warnings.push(`High data loss: ${Math.round(dataLossPercentage)}% of records filtered out`);
    }

    // Check for empty output
    if (outputData.length === 0) {
      warnings.push('Step produces no output records');
    }

    // Check for field loss (map step)
    if (step.type === 'map' && inputData.length > 0 && outputData.length > 0) {
      const inputFields = Object.keys(inputData[0]);
      const outputFields = Object.keys(outputData[0]);
      const lostFields = inputFields.filter(f => !outputFields.includes(f));
      
      if (lostFields.length > 0) {
        warnings.push(`Fields removed: ${lostFields.join(', ')}`);
      }
    }

    // Check for aggregation (significant reduction)
    if (step.type === 'aggregate' && outputData.length < inputData.length * 0.1) {
      warnings.push(`Significant aggregation: ${inputData.length} → ${outputData.length} records`);
    }

    return warnings;
  }

  // ==================== SAMPLE DATA ====================

  /**
   * Get sample input data for preview
   */
  private async getSampleInputData(
    pipeline: Pipeline,
    inputDataOverride?: Record<string, any[]>,
    sampleSize: number = 100
  ): Promise<any[]> {
    // If override provided, use it
    if (inputDataOverride) {
      const combined = Object.values(inputDataOverride).flat();
      return combined.slice(0, sampleSize);
    }

    // Generate mock sample data
    return this.generateMockData(sampleSize);
  }

  /**
   * Generate mock sample data
   */
  private generateMockData(count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Sample ${i + 1}`,
      value: Math.floor(Math.random() * 1000),
      category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
      active: Math.random() > 0.5,
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  }

  // ==================== CACHING ====================

  /**
   * Generate cache key for preview
   */
  private getCacheKey(request: PreviewRequest): string {
    return `${request.pipeline.id}-${request.stepIndex || 'all'}-${request.sampleSize || 100}-${JSON.stringify(request.pipeline.steps.map(s => s.id))}`;
  }

  /**
   * Cache preview result
   */
  private cachePreview(key: string, result: PipelinePreviewResult): void {
    this.previewCache.set(key, result);

    // Trim cache if too large
    if (this.previewCache.size > this.maxCacheSize) {
      const firstKey = this.previewCache.keys().next().value;
      this.previewCache.delete(firstKey);
    }
  }

  /**
   * Clear preview cache
   */
  clearCache(): void {
    this.previewCache.clear();
    logger.info('Preview cache cleared', 'pipeline-preview');
  }

  /**
   * Invalidate cache for a pipeline
   */
  invalidateCache(pipelineId: string): void {
    for (const key of this.previewCache.keys()) {
      if (key.startsWith(pipelineId)) {
        this.previewCache.delete(key);
      }
    }
    logger.info('Preview cache invalidated for pipeline', 'pipeline-preview', { pipelineId });
  }
}

// Export singleton instance
export const pipelinePreview = PipelinePreviewService.getInstance();

