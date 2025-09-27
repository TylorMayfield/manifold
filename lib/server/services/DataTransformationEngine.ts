import { logger } from "../utils/logger";

export interface TransformationStep {
  id: string;
  type: "filter" | "map" | "group" | "sort" | "aggregate" | "join" | "custom";
  name: string;
  config: any;
  enabled: boolean;
  order: number;
}

export interface TransformationPipeline {
  id: string;
  name: string;
  description?: string;
  steps: TransformationStep[];
  inputSource: string;
  outputDestination?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataField {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "object" | "array";
  nullable: boolean;
  sampleValues?: any[];
}

export interface TransformationResult {
  success: boolean;
  data?: any[];
  error?: string;
  metadata?: {
    rowCount: number;
    fieldCount: number;
    processingTime: number;
    fields: DataField[];
  };
}

export class DataTransformationEngine {
  private pipelines: Map<string, TransformationPipeline> = new Map();
  private sampleData: Map<string, any[]> = new Map();

  constructor() {
    this.loadDefaultPipelines();
  }

  // Pipeline Management
  createPipeline(
    pipeline: Omit<TransformationPipeline, "id" | "createdAt" | "updatedAt">
  ): TransformationPipeline {
    const id = this.generateId();
    const newPipeline: TransformationPipeline = {
      ...pipeline,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.pipelines.set(id, newPipeline);

    logger.info("Transformation pipeline created", "system", {
      pipelineId: id,
      pipelineName: pipeline.name,
    });

    return newPipeline;
  }

  updatePipeline(
    id: string,
    updates: Partial<TransformationPipeline>
  ): TransformationPipeline | null {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) {
      return null;
    }

    const updatedPipeline = {
      ...pipeline,
      ...updates,
      updatedAt: new Date(),
    };

    this.pipelines.set(id, updatedPipeline);

    logger.info("Transformation pipeline updated", "system", {
      pipelineId: id,
      updates,
    });

    return updatedPipeline;
  }

  deletePipeline(id: string): boolean {
    const deleted = this.pipelines.delete(id);

    if (deleted) {
      logger.info("Transformation pipeline deleted", "system", {
        pipelineId: id,
      });
    }

    return deleted;
  }

  getPipeline(id: string): TransformationPipeline | null {
    return this.pipelines.get(id) || null;
  }

  getAllPipelines(): TransformationPipeline[] {
    return Array.from(this.pipelines.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  // Step Management
  addStep(
    pipelineId: string,
    step: Omit<TransformationStep, "id" | "order">
  ): TransformationStep | null {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      return null;
    }

    const newStep: TransformationStep = {
      ...step,
      id: this.generateId(),
      order: pipeline.steps.length,
    };

    pipeline.steps.push(newStep);
    pipeline.updatedAt = new Date();

    logger.info("Transformation step added", "system", {
      pipelineId,
      stepId: newStep.id,
      stepType: step.type,
    });

    return newStep;
  }

  updateStep(
    pipelineId: string,
    stepId: string,
    updates: Partial<TransformationStep>
  ): TransformationStep | null {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      return null;
    }

    const stepIndex = pipeline.steps.findIndex((s) => s.id === stepId);
    if (stepIndex === -1) {
      return null;
    }

    const updatedStep = {
      ...pipeline.steps[stepIndex],
      ...updates,
    };

    pipeline.steps[stepIndex] = updatedStep;
    pipeline.updatedAt = new Date();

    logger.info("Transformation step updated", "system", {
      pipelineId,
      stepId,
      updates,
    });

    return updatedStep;
  }

  removeStep(pipelineId: string, stepId: string): boolean {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      return false;
    }

    const initialLength = pipeline.steps.length;
    pipeline.steps = pipeline.steps.filter((s) => s.id !== stepId);

    // Reorder remaining steps
    pipeline.steps.forEach((step, index) => {
      step.order = index;
    });

    pipeline.updatedAt = new Date();

    const deleted = pipeline.steps.length < initialLength;

    if (deleted) {
      logger.info("Transformation step removed", "system", {
        pipelineId,
        stepId,
      });
    }

    return deleted;
  }

  reorderSteps(pipelineId: string, stepIds: string[]): boolean {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      return false;
    }

    // Create a map of step IDs to steps
    const stepMap = new Map(pipeline.steps.map((step) => [step.id, step]));

    // Reorder steps based on provided order
    const reorderedSteps = stepIds
      .map((id) => stepMap.get(id))
      .filter((step): step is TransformationStep => step !== undefined);

    if (reorderedSteps.length !== pipeline.steps.length) {
      return false; // Invalid reorder
    }

    pipeline.steps = reorderedSteps.map((step, index) => ({
      ...step,
      order: index,
    }));

    pipeline.updatedAt = new Date();

    logger.info("Transformation steps reordered", "system", {
      pipelineId,
      newOrder: stepIds,
    });

    return true;
  }

  // Data Processing
  async executePipeline(
    pipelineId: string,
    inputData?: any[]
  ): Promise<TransformationResult> {
    const startTime = Date.now();
    const pipeline = this.pipelines.get(pipelineId);

    if (!pipeline) {
      return {
        success: false,
        error: "Pipeline not found",
      };
    }

    if (!pipeline.enabled) {
      return {
        success: false,
        error: "Pipeline is disabled",
      };
    }

    try {
      // Get input data
      const data = inputData || this.sampleData.get(pipeline.inputSource) || [];

      if (data.length === 0) {
        return {
          success: true,
          data: [],
          metadata: {
            rowCount: 0,
            fieldCount: 0,
            processingTime: Date.now() - startTime,
            fields: [],
          },
        };
      }

      // Sort steps by order
      const sortedSteps = [...pipeline.steps]
        .filter((step) => step.enabled)
        .sort((a, b) => a.order - b.order);

      let processedData = [...data];

      // Execute each step
      for (const step of sortedSteps) {
        processedData = await this.executeStep(step, processedData);
      }

      const processingTime = Date.now() - startTime;
      const fields = this.analyzeFields(processedData);

      logger.info("Pipeline executed successfully", "system", {
        pipelineId,
        inputRows: data.length,
        outputRows: processedData.length,
        processingTime,
        stepsExecuted: sortedSteps.length,
      });

      return {
        success: true,
        data: processedData,
        metadata: {
          rowCount: processedData.length,
          fieldCount: fields.length,
          processingTime,
          fields,
        },
      };
    } catch (error) {
      logger.error("Pipeline execution failed", "system", {
        pipelineId,
        error: (error as Error).message,
      });

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  private async executeStep(
    step: TransformationStep,
    data: any[]
  ): Promise<any[]> {
    switch (step.type) {
      case "filter":
        return this.applyFilter(step, data);
      case "map":
        return this.applyMap(step, data);
      case "group":
        return this.applyGroup(step, data);
      case "sort":
        return this.applySort(step, data);
      case "aggregate":
        return this.applyAggregate(step, data);
      case "join":
        return this.applyJoin(step, data);
      case "custom":
        return this.applyCustom(step, data);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private applyFilter(step: TransformationStep, data: any[]): any[] {
    const { field, operator, value } = step.config;

    return data.filter((row) => {
      const fieldValue = row[field];

      switch (operator) {
        case "equals":
          return fieldValue === value;
        case "not_equals":
          return fieldValue !== value;
        case "greater_than":
          return fieldValue > value;
        case "less_than":
          return fieldValue < value;
        case "contains":
          return String(fieldValue).includes(String(value));
        case "starts_with":
          return String(fieldValue).startsWith(String(value));
        case "ends_with":
          return String(fieldValue).endsWith(String(value));
        case "is_null":
          return fieldValue === null || fieldValue === undefined;
        case "is_not_null":
          return fieldValue !== null && fieldValue !== undefined;
        default:
          return true;
      }
    });
  }

  private applyMap(step: TransformationStep, data: any[]): any[] {
    const { mappings } = step.config;

    return data.map((row) => {
      const newRow = { ...row };

      for (const mapping of mappings) {
        if (mapping.sourceField && mapping.targetField) {
          if (mapping.transform) {
            newRow[mapping.targetField] = this.applyFieldTransform(
              mapping.transform,
              row[mapping.sourceField]
            );
          } else {
            newRow[mapping.targetField] = row[mapping.sourceField];
          }
        }
      }

      return newRow;
    });
  }

  private applyGroup(step: TransformationStep, data: any[]): any[] {
    const { groupBy, aggregations } = step.config;
    const groups = new Map();

    for (const row of data) {
      const groupKey = groupBy.map((field: string) => row[field]).join("|");

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          ...Object.fromEntries(
            groupBy.map((field: string) => [field, row[field]])
          ),
          _count: 0,
        });
      }

      const group = groups.get(groupKey);
      group._count++;

      for (const agg of aggregations) {
        const fieldValue = row[agg.field];
        const aggKey = `${agg.type}_${agg.field}`;

        if (!group[aggKey]) {
          group[aggKey] =
            agg.type === "count"
              ? 0
              : agg.type === "sum"
              ? 0
              : agg.type === "avg"
              ? { sum: 0, count: 0 }
              : agg.type === "min"
              ? Infinity
              : agg.type === "max"
              ? -Infinity
              : fieldValue;
        }

        switch (agg.type) {
          case "count":
            group[aggKey]++;
            break;
          case "sum":
            group[aggKey] += Number(fieldValue) || 0;
            break;
          case "avg":
            group[aggKey].sum += Number(fieldValue) || 0;
            group[aggKey].count++;
            break;
          case "min":
            group[aggKey] = Math.min(
              group[aggKey],
              Number(fieldValue) || Infinity
            );
            break;
          case "max":
            group[aggKey] = Math.max(
              group[aggKey],
              Number(fieldValue) || -Infinity
            );
            break;
        }
      }
    }

    // Finalize averages
    const result = Array.from(groups.values());
    for (const row of result) {
      for (const agg of aggregations) {
        if (agg.type === "avg") {
          const aggKey = `${agg.type}_${agg.field}`;
          row[aggKey] =
            row[aggKey].count > 0 ? row[aggKey].sum / row[aggKey].count : 0;
        }
      }
    }

    return result;
  }

  private applySort(step: TransformationStep, data: any[]): any[] {
    const { sortBy } = step.config;

    return [...data].sort((a, b) => {
      for (const sort of sortBy) {
        const aVal = a[sort.field];
        const bVal = b[sort.field];

        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        else if (aVal > bVal) comparison = 1;

        if (comparison !== 0) {
          return sort.direction === "desc" ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  private applyAggregate(step: TransformationStep, data: any[]): any[] {
    const { aggregations } = step.config;
    const result: any = {};

    for (const agg of aggregations) {
      const fieldValues = data
        .map((row) => row[agg.field])
        .filter((val) => val !== null && val !== undefined);
      const aggKey = `${agg.type}_${agg.field}`;

      switch (agg.type) {
        case "count":
          result[aggKey] = fieldValues.length;
          break;
        case "sum":
          result[aggKey] = fieldValues.reduce(
            (sum, val) => sum + (Number(val) || 0),
            0
          );
          break;
        case "avg":
          result[aggKey] =
            fieldValues.length > 0
              ? fieldValues.reduce((sum, val) => sum + (Number(val) || 0), 0) /
                fieldValues.length
              : 0;
          break;
        case "min":
          result[aggKey] =
            fieldValues.length > 0
              ? Math.min(...fieldValues.map((val) => Number(val) || Infinity))
              : null;
          break;
        case "max":
          result[aggKey] =
            fieldValues.length > 0
              ? Math.max(...fieldValues.map((val) => Number(val) || -Infinity))
              : null;
          break;
      }
    }

    return [result];
  }

  private applyJoin(step: TransformationStep, data: any[]): any[] {
    const { joinType, joinField, otherData } = step.config;

    if (joinType === "inner") {
      return data.filter((row) =>
        otherData.some(
          (otherRow: any) => row[joinField] === otherRow[joinField]
        )
      );
    } else if (joinType === "left") {
      return data.map((row) => {
        const match = otherData.find(
          (otherRow: any) => row[joinField] === otherRow[joinField]
        );
        return match ? { ...row, ...match } : row;
      });
    }

    return data;
  }

  private applyCustom(step: TransformationStep, data: any[]): any[] {
    try {
      // In a real implementation, this would execute user-defined JavaScript
      // For now, we'll just return the data unchanged
      return data;
    } catch (error) {
      logger.error("Custom transformation failed", "system", {
        stepId: step.id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private applyFieldTransform(transform: string, value: any): any {
    switch (transform) {
      case "to_uppercase":
        return String(value).toUpperCase();
      case "to_lowercase":
        return String(value).toLowerCase();
      case "trim":
        return String(value).trim();
      case "to_number":
        return Number(value) || 0;
      case "to_string":
        return String(value);
      case "to_date":
        return new Date(value);
      default:
        return value;
    }
  }

  private analyzeFields(data: any[]): DataField[] {
    if (data.length === 0) {
      return [];
    }

    const fieldMap = new Map<
      string,
      { values: Set<any>; types: Set<string> }
    >();

    for (const row of data) {
      for (const [key, value] of Object.entries(row)) {
        if (!fieldMap.has(key)) {
          fieldMap.set(key, { values: new Set(), types: new Set() });
        }

        const field = fieldMap.get(key)!;
        field.values.add(value);
        field.types.add(typeof value);
      }
    }

    return Array.from(fieldMap.entries()).map(([name, info]) => ({
      name,
      type: this.inferFieldType(info.types, Array.from(info.values)),
      nullable: info.values.has(null) || info.values.has(undefined),
      sampleValues: Array.from(info.values).slice(0, 3),
    }));
  }

  private inferFieldType(types: Set<string>, values: any[]): DataField["type"] {
    if (types.has("boolean")) return "boolean";
    if (types.has("number")) return "number";
    if (types.has("object") && values.some((v) => v instanceof Date))
      return "date";
    if (types.has("object")) return "object";
    if (values.some((v) => Array.isArray(v))) return "array";
    return "string";
  }

  // Sample Data Management
  setSampleData(sourceId: string, data: any[]): void {
    this.sampleData.set(sourceId, data);

    logger.info("Sample data set", "system", {
      sourceId,
      rowCount: data.length,
    });
  }

  getSampleData(sourceId: string): any[] {
    return this.sampleData.get(sourceId) || [];
  }

  // Utility Methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private loadDefaultPipelines(): void {
    // Load some default transformation pipelines
    const defaultPipelines: Omit<
      TransformationPipeline,
      "id" | "createdAt" | "updatedAt"
    >[] = [
      {
        name: "Data Cleanup",
        description: "Standard data cleaning pipeline",
        steps: [
          {
            id: "1",
            type: "filter",
            name: "Remove Nulls",
            config: { field: "id", operator: "is_not_null" },
            enabled: true,
            order: 0,
          },
          {
            id: "2",
            type: "map",
            name: "Trim Strings",
            config: {
              mappings: [
                { sourceField: "name", targetField: "name", transform: "trim" },
                {
                  sourceField: "email",
                  targetField: "email",
                  transform: "to_lowercase",
                },
              ],
            },
            enabled: true,
            order: 1,
          },
        ],
        inputSource: "sample-data",
        enabled: true,
      },
    ];

    for (const pipeline of defaultPipelines) {
      this.createPipeline(pipeline);
    }
  }
}
