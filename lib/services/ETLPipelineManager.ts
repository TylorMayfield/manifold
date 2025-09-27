import { clientLogger } from "../utils/ClientLogger";

export interface ETLPipeline {
  id: string;
  name: string;
  description?: string;
  status: "active" | "paused" | "failed" | "draft";
  schedule?: string; // Cron expression
  source: ETLSource;
  transformations: ETLTransformation[];
  destination: ETLDestination;
  metadata: ETLMetadata;
  createdAt: Date;
  updatedAt: Date;
  lastRun?: Date;
  nextRun?: Date;
  version?: string;
  versionHistory?: string[];
}

export interface ETLSource {
  type: "data_source" | "api" | "file" | "database" | "stream";
  config: {
    dataSourceId?: string;
    apiUrl?: string;
    filePath?: string;
    connectionString?: string;
    query?: string;
    [key: string]: any;
  };
  schema?: ETLSchema;
  filters?: ETLFilter[];
}

export interface ETLTransformation {
  id: string;
  name: string;
  type: "filter" | "map" | "aggregate" | "join" | "custom";
  config: {
    conditions?: any[];
    mappings?: Record<string, string>;
    aggregations?: AggregationConfig[];
    joins?: JoinConfig[];
    script?: string;
    [key: string]: any;
  };
  order: number;
  enabled: boolean;
}

export interface ETLDestination {
  type: "data_source" | "file" | "database" | "api";
  config: {
    dataSourceId?: string;
    filePath?: string;
    connectionString?: string;
    endpoint?: string;
    [key: string]: any;
  };
  schema?: ETLSchema;
  mode: "append" | "replace" | "upsert";
}

export interface ETLSchema {
  columns: SchemaColumn[];
  primaryKeys?: string[];
  constraints?: SchemaConstraint[];
}

export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  description?: string;
}

export interface SchemaConstraint {
  name: string;
  type: "primary_key" | "foreign_key" | "unique" | "check";
  columns: string[];
  expression?: string;
}

export interface ETLFilter {
  column: string;
  operator:
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "not_in"
    | "like"
    | "not_like";
  value: any;
  logicalOperator?: "and" | "or";
}

export interface AggregationConfig {
  column: string;
  function: "sum" | "avg" | "min" | "max" | "count" | "distinct";
  alias?: string;
  groupBy?: string[];
}

export interface JoinConfig {
  type: "inner" | "left" | "right" | "full";
  table: string;
  on: {
    leftColumn: string;
    rightColumn: string;
  };
}

export interface ETLMetadata {
  version: string;
  author: string;
  tags: string[];
  documentation?: string;
  dependencies: string[];
  environment: "development" | "staging" | "production";
  monitoring: ETLMonitoring;
}

export interface ETLMonitoring {
  enabled: boolean;
  alerts: ETLAlert[];
  metrics: ETLMetric[];
  thresholds: ETLThreshold[];
}

export interface ETLAlert {
  id: string;
  name: string;
  type: "error" | "warning" | "info";
  condition: string;
  enabled: boolean;
  recipients: string[];
}

export interface ETLMetric {
  name: string;
  type: "counter" | "gauge" | "histogram";
  description: string;
  unit?: string;
}

export interface ETLThreshold {
  metric: string;
  operator: "gt" | "gte" | "lt" | "lte" | "eq" | "ne";
  value: number;
  severity: "warning" | "error";
}

export interface ETLExecution {
  id: string;
  pipelineId: string;
  status: "running" | "completed" | "failed" | "cancelled";
  startTime: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  recordsProcessed: number;
  recordsFailed: number;
  errors: ETLExecutionError[];
  metrics: Record<string, any>;
  logs: ETLExecutionLog[];
}

export interface ETLExecutionError {
  id: string;
  type: "validation" | "transformation" | "destination" | "system";
  message: string;
  details: any;
  timestamp: Date;
  record?: any;
}

export interface ETLExecutionLog {
  timestamp: Date;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  context?: any;
}

export interface ETLPipelineTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: Partial<ETLPipeline>;
  parameters: ETLTemplateParameter[];
}

export interface ETLTemplateParameter {
  name: string;
  type: "string" | "number" | "boolean" | "select";
  required: boolean;
  defaultValue?: any;
  options?: any[];
  description: string;
}

export class ETLPipelineManager {
  private static instance: ETLPipelineManager;
  private pipelines: Map<string, ETLPipeline> = new Map();
  private executions: Map<string, ETLExecution> = new Map();
  private templates: Map<string, ETLPipelineTemplate> = new Map();

  static getInstance(): ETLPipelineManager {
    if (!ETLPipelineManager.instance) {
      ETLPipelineManager.instance = new ETLPipelineManager();
    }
    return ETLPipelineManager.instance;
  }

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: ETLPipelineTemplate[] = [
      {
        id: "simple_copy",
        name: "Simple Data Copy",
        description:
          "Copy data from one source to another with basic filtering",
        category: "basic",
        template: {
          source: {
            type: "data_source",
            config: {},
          },
          transformations: [
            {
              id: "filter_1",
              name: "Basic Filter",
              type: "filter",
              config: {
                conditions: [],
              },
              order: 1,
              enabled: true,
            },
          ],
          destination: {
            type: "data_source",
            config: {},
            mode: "append",
          },
          metadata: {
            version: "1.0.0",
            author: "system",
            tags: ["basic", "copy"],
            dependencies: [],
            environment: "development",
            monitoring: {
              enabled: true,
              alerts: [],
              metrics: [],
              thresholds: [],
            },
          },
        },
        parameters: [
          {
            name: "sourceDataSourceId",
            type: "select",
            required: true,
            description: "Source data source",
          },
          {
            name: "destinationDataSourceId",
            type: "select",
            required: true,
            description: "Destination data source",
          },
        ],
      },
      {
        id: "data_aggregation",
        name: "Data Aggregation Pipeline",
        description: "Aggregate data with grouping and calculations",
        category: "analytics",
        template: {
          source: {
            type: "data_source",
            config: {},
          },
          transformations: [
            {
              id: "aggregate_1",
              name: "Data Aggregation",
              type: "aggregate",
              config: {
                aggregations: [],
              },
              order: 1,
              enabled: true,
            },
          ],
          destination: {
            type: "data_source",
            config: {},
            mode: "replace",
          },
          metadata: {
            version: "1.0.0",
            author: "system",
            tags: ["analytics", "aggregation"],
            dependencies: [],
            environment: "development",
            monitoring: {
              enabled: true,
              alerts: [],
              metrics: [],
              thresholds: [],
            },
          },
        },
        parameters: [
          {
            name: "sourceDataSourceId",
            type: "select",
            required: true,
            description: "Source data source",
          },
          {
            name: "destinationDataSourceId",
            type: "select",
            required: true,
            description: "Destination data source",
          },
          {
            name: "groupByColumns",
            type: "string",
            required: true,
            description: "Comma-separated list of columns to group by",
          },
        ],
      },
    ];

    defaultTemplates.forEach((template) => {
      this.templates.set(template.id, template);
    });
  }

  // Pipeline Management
  async createPipeline(
    pipeline: Omit<ETLPipeline, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const id = `pipeline_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const now = new Date();

    const newPipeline: ETLPipeline = {
      ...pipeline,
      id,
      createdAt: now,
      updatedAt: now,
      version: "1.0.0",
      versionHistory: ["1.0.0"],
    };

    this.pipelines.set(id, newPipeline);

    clientLogger.info("ETL pipeline created", "data-processing", {
      pipelineId: id,
      name: pipeline.name,
      status: pipeline.status,
      version: newPipeline.version,
    });

    return id;
  }

  async updatePipeline(
    pipelineId: string,
    updates: Partial<ETLPipeline>
  ): Promise<boolean> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return false;

    // Handle versioning for significant updates
    let newVersion = pipeline.version;
    if (updates.transformations || updates.source || updates.destination) {
      newVersion = this.generateNextVersion(pipeline.version || "1.0.0");
    }

    const updatedPipeline = {
      ...pipeline,
      ...updates,
      updatedAt: new Date(),
      version: newVersion,
      versionHistory: [...(pipeline.versionHistory || []), newVersion].filter(
        (version): version is string => version !== undefined
      ),
    };

    this.pipelines.set(pipelineId, updatedPipeline);

    clientLogger.info("ETL pipeline updated", "data-processing", {
      pipelineId,
      updates: Object.keys(updates),
      version: newVersion,
    });

    return true;
  }

  async deletePipeline(pipelineId: string): Promise<boolean> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return false;

    this.pipelines.delete(pipelineId);

    // Remove related executions
    const relatedExecutions = Array.from(this.executions.values()).filter(
      (execution) => execution.pipelineId === pipelineId
    );

    relatedExecutions.forEach((execution) => {
      this.executions.delete(execution.id);
    });

    clientLogger.info("ETL pipeline deleted", "data-processing", {
      pipelineId,
      name: pipeline.name,
      removedExecutions: relatedExecutions.length,
    });

    return true;
  }

  // Pipeline Execution
  async executePipeline(
    pipelineId: string,
    options?: { dryRun?: boolean }
  ): Promise<string> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    const executionId = `execution_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const startTime = new Date();

    const execution: ETLExecution = {
      id: executionId,
      pipelineId,
      status: "running",
      startTime,
      recordsProcessed: 0,
      recordsFailed: 0,
      errors: [],
      metrics: {},
      logs: [],
    };

    this.executions.set(executionId, execution);

    // Update pipeline last run
    await this.updatePipeline(pipelineId, { lastRun: startTime });

    clientLogger.info("ETL pipeline execution started", "data-processing", {
      executionId,
      pipelineId,
      pipelineName: pipeline.name,
      dryRun: options?.dryRun || false,
    });

    // Execute pipeline asynchronously
    this.runPipelineExecution(executionId, options).catch((error) => {
      clientLogger.error("ETL pipeline execution failed", "data-processing", {
        executionId,
        pipelineId,
        error,
      });
    });

    return executionId;
  }

  private async runPipelineExecution(
    executionId: string,
    options?: { dryRun?: boolean }
  ): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    const pipeline = this.pipelines.get(execution.pipelineId);
    if (!pipeline) {
      await this.updateExecution(executionId, {
        status: "failed",
        endTime: new Date(),
        errors: [
          {
            id: `error_${Date.now()}`,
            type: "system",
            message: "Pipeline not found",
            details: { pipelineId: execution.pipelineId },
            timestamp: new Date(),
          },
        ],
      });
      return;
    }

    try {
      // Add execution log
      this.addExecutionLog(executionId, "info", "Pipeline execution started");

      // Step 1: Extract data from source
      this.addExecutionLog(executionId, "info", "Extracting data from source");
      const sourceData = await this.extractData(pipeline.source, executionId);

      execution.recordsProcessed = sourceData.length;
      this.addExecutionLog(
        executionId,
        "info",
        `Extracted ${sourceData.length} records from source`
      );

      // Step 2: Apply transformations
      let transformedData = sourceData;
      for (const transformation of pipeline.transformations
        .filter((t) => t.enabled)
        .sort((a, b) => a.order - b.order)) {
        this.addExecutionLog(
          executionId,
          "info",
          `Applying transformation: ${transformation.name}`
        );
        transformedData = await this.applyTransformation(
          transformation,
          transformedData,
          executionId
        );
        this.addExecutionLog(
          executionId,
          "info",
          `Transformation completed: ${transformedData.length} records`
        );
      }

      // Step 3: Load data to destination
      if (!options?.dryRun) {
        this.addExecutionLog(
          executionId,
          "info",
          "Loading data to destination"
        );
        await this.loadData(pipeline.destination, transformedData, executionId);
        this.addExecutionLog(
          executionId,
          "info",
          `Loaded ${transformedData.length} records to destination`
        );
      } else {
        this.addExecutionLog(
          executionId,
          "info",
          "Dry run mode - skipping data load"
        );
      }

      // Update execution status
      const endTime = new Date();
      await this.updateExecution(executionId, {
        status: "completed",
        endTime,
        duration: endTime.getTime() - execution.startTime.getTime(),
        recordsProcessed: transformedData.length,
      });

      this.addExecutionLog(
        executionId,
        "info",
        "Pipeline execution completed successfully"
      );

      clientLogger.success(
        "ETL pipeline execution completed",
        "data-processing",
        {
          executionId,
          pipelineId: pipeline.id,
          recordsProcessed: transformedData.length,
          duration: endTime.getTime() - execution.startTime.getTime(),
        }
      );
    } catch (error) {
      const endTime = new Date();
      await this.updateExecution(executionId, {
        status: "failed",
        endTime,
        duration: endTime.getTime() - execution.startTime.getTime(),
        errors: [
          {
            id: `error_${Date.now()}`,
            type: "system",
            message: error instanceof Error ? error.message : "Unknown error",
            details: { error },
            timestamp: new Date(),
          },
        ],
      });

      this.addExecutionLog(
        executionId,
        "error",
        `Pipeline execution failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      clientLogger.error("ETL pipeline execution failed", "data-processing", {
        executionId,
        pipelineId: pipeline.id,
        error,
      });
    }
  }

  private async extractData(
    source: ETLSource,
    executionId: string
  ): Promise<any[]> {
    // Mock implementation - in real scenario, this would connect to actual data sources
    switch (source.type) {
      case "data_source":
        // Simulate data extraction from data source
        return [
          { id: 1, name: "Record 1", value: 100, date: new Date() },
          { id: 2, name: "Record 2", value: 200, date: new Date() },
          { id: 3, name: "Record 3", value: 300, date: new Date() },
        ];
      case "api":
        // Simulate API data extraction
        return [
          { id: 4, name: "API Record 1", value: 400, date: new Date() },
          { id: 5, name: "API Record 2", value: 500, date: new Date() },
        ];
      case "file":
        // Simulate file data extraction
        return [
          { id: 6, name: "File Record 1", value: 600, date: new Date() },
          { id: 7, name: "File Record 2", value: 700, date: new Date() },
        ];
      default:
        throw new Error(`Unsupported source type: ${source.type}`);
    }
  }

  private async applyTransformation(
    transformation: ETLTransformation,
    data: any[],
    executionId: string
  ): Promise<any[]> {
    switch (transformation.type) {
      case "filter":
        return this.applyFilterTransformation(
          transformation,
          data,
          executionId
        );
      case "map":
        return this.applyMapTransformation(transformation, data, executionId);
      case "aggregate":
        return this.applyAggregateTransformation(
          transformation,
          data,
          executionId
        );
      case "join":
        return this.applyJoinTransformation(transformation, data, executionId);
      case "custom":
        return this.applyCustomTransformation(
          transformation,
          data,
          executionId
        );
      default:
        throw new Error(
          `Unsupported transformation type: ${transformation.type}`
        );
    }
  }

  private async applyFilterTransformation(
    transformation: ETLTransformation,
    data: any[],
    executionId: string
  ): Promise<any[]> {
    const { conditions } = transformation.config;
    if (!conditions || conditions.length === 0) return data;

    let filteredData = data;
    for (const condition of conditions) {
      filteredData = filteredData.filter((record) => {
        const value = record[condition.column];
        switch (condition.operator) {
          case "eq":
            return value === condition.value;
          case "ne":
            return value !== condition.value;
          case "gt":
            return value > condition.value;
          case "gte":
            return value >= condition.value;
          case "lt":
            return value < condition.value;
          case "lte":
            return value <= condition.value;
          case "in":
            return (
              Array.isArray(condition.value) && condition.value.includes(value)
            );
          case "not_in":
            return (
              Array.isArray(condition.value) && !condition.value.includes(value)
            );
          case "like":
            return String(value).includes(String(condition.value));
          case "not_like":
            return !String(value).includes(String(condition.value));
          default:
            return true;
        }
      });
    }

    return filteredData;
  }

  private async applyMapTransformation(
    transformation: ETLTransformation,
    data: any[],
    executionId: string
  ): Promise<any[]> {
    const { mappings } = transformation.config;
    if (!mappings) return data;

    return data.map((record) => {
      const mappedRecord = { ...record };
      for (const [sourceField, targetField] of Object.entries(mappings)) {
        if (record[sourceField] !== undefined) {
          mappedRecord[targetField] = record[sourceField];
          if (sourceField !== targetField) {
            delete mappedRecord[sourceField];
          }
        }
      }
      return mappedRecord;
    });
  }

  private async applyAggregateTransformation(
    transformation: ETLTransformation,
    data: any[],
    executionId: string
  ): Promise<any[]> {
    const { aggregations } = transformation.config;
    if (!aggregations || aggregations.length === 0) return data;

    // Simple aggregation implementation
    const result: any[] = [];
    const groups = new Map<string, any[]>();

    // Group data
    for (const record of data) {
      const groupKey = aggregations
        .filter((agg) => agg.groupBy)
        .map((agg) => record[agg.groupBy![0]])
        .join("|");

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(record);
    }

    // Apply aggregations
    for (const [groupKey, groupData] of groups) {
      const aggregatedRecord: any = {};

      // Add group by values
      const groupByColumns = aggregations
        .filter((agg) => agg.groupBy)
        .map((agg) => agg.groupBy![0]);

      for (const column of groupByColumns) {
        aggregatedRecord[column] = groupData[0][column];
      }

      // Apply aggregation functions
      for (const aggregation of aggregations) {
        const values = groupData
          .map((record) => record[aggregation.column])
          .filter((v) => v !== null && v !== undefined);
        const alias =
          aggregation.alias || `${aggregation.function}_${aggregation.column}`;

        switch (aggregation.function) {
          case "sum":
            aggregatedRecord[alias] = values.reduce(
              (sum, val) => sum + Number(val),
              0
            );
            break;
          case "avg":
            aggregatedRecord[alias] =
              values.length > 0
                ? values.reduce((sum, val) => sum + Number(val), 0) /
                  values.length
                : 0;
            break;
          case "min":
            aggregatedRecord[alias] = Math.min(...values.map(Number));
            break;
          case "max":
            aggregatedRecord[alias] = Math.max(...values.map(Number));
            break;
          case "count":
            aggregatedRecord[alias] = values.length;
            break;
          case "distinct":
            aggregatedRecord[alias] = new Set(values).size;
            break;
        }
      }

      result.push(aggregatedRecord);
    }

    return result;
  }

  private async applyJoinTransformation(
    transformation: ETLTransformation,
    data: any[],
    executionId: string
  ): Promise<any[]> {
    // Placeholder implementation for join transformation
    // In a real implementation, this would join with another data source
    return data;
  }

  private async applyCustomTransformation(
    transformation: ETLTransformation,
    data: any[],
    executionId: string
  ): Promise<any[]> {
    const { script } = transformation.config;
    if (!script) return data;

    // Placeholder implementation for custom script transformation
    // In a real implementation, this would execute the custom script
    this.addExecutionLog(
      executionId,
      "warn",
      "Custom script transformation not implemented"
    );
    return data;
  }

  private async loadData(
    destination: ETLDestination,
    data: any[],
    executionId: string
  ): Promise<void> {
    // Mock implementation - in real scenario, this would load data to actual destinations
    switch (destination.type) {
      case "data_source":
        this.addExecutionLog(
          executionId,
          "info",
          `Loading ${data.length} records to data source`
        );
        break;
      case "file":
        this.addExecutionLog(
          executionId,
          "info",
          `Writing ${data.length} records to file`
        );
        break;
      case "database":
        this.addExecutionLog(
          executionId,
          "info",
          `Inserting ${data.length} records to database`
        );
        break;
      case "api":
        this.addExecutionLog(
          executionId,
          "info",
          `Sending ${data.length} records to API endpoint`
        );
        break;
    }
  }

  // Execution Management
  async updateExecution(
    executionId: string,
    updates: Partial<ETLExecution>
  ): Promise<boolean> {
    const execution = this.executions.get(executionId);
    if (!execution) return false;

    const updatedExecution = {
      ...execution,
      ...updates,
    };

    this.executions.set(executionId, updatedExecution);
    return true;
  }

  private addExecutionLog(
    executionId: string,
    level: ETLExecutionLog["level"],
    message: string,
    context?: any
  ): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    const log: ETLExecutionLog = {
      timestamp: new Date(),
      level,
      message,
      context,
    };

    execution.logs.push(log);
    this.executions.set(executionId, execution);
  }

  // Template Management
  async createPipelineFromTemplate(
    templateId: string,
    parameters: Record<string, any>
  ): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Apply parameters to template
    const pipeline = JSON.parse(JSON.stringify(template.template));
    this.applyTemplateParameters(pipeline, template.parameters, parameters);

    return this.createPipeline({
      ...pipeline,
      name: `${template.name} - ${new Date().toISOString()}`,
      status: "draft",
    } as Omit<ETLPipeline, "id" | "createdAt" | "updatedAt">);
  }

  private applyTemplateParameters(
    pipeline: any,
    parameters: ETLTemplateParameter[],
    values: Record<string, any>
  ): void {
    for (const param of parameters) {
      if (param.required && !(param.name in values)) {
        throw new Error(`Required parameter ${param.name} not provided`);
      }

      const value = values[param.name] || param.defaultValue;
      if (value !== undefined) {
        // Simple parameter replacement - in real implementation, this would be more sophisticated
        const jsonString = JSON.stringify(pipeline);
        const updatedString = jsonString.replace(
          new RegExp(`\\{\\{${param.name}\\}\\}`, "g"),
          JSON.stringify(value)
        );
        Object.assign(pipeline, JSON.parse(updatedString));
      }
    }
  }

  // Query Methods
  getPipeline(pipelineId: string): ETLPipeline | undefined {
    return this.pipelines.get(pipelineId);
  }

  getAllPipelines(): ETLPipeline[] {
    return Array.from(this.pipelines.values());
  }

  getExecution(executionId: string): ETLExecution | undefined {
    return this.executions.get(executionId);
  }

  getExecutionsByPipeline(pipelineId: string): ETLExecution[] {
    return Array.from(this.executions.values()).filter(
      (execution) => execution.pipelineId === pipelineId
    );
  }

  getTemplate(templateId: string): ETLPipelineTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): ETLPipelineTemplate[] {
    return Array.from(this.templates.values());
  }

  // Version Management
  private generateNextVersion(currentVersion: string): string {
    const [major, minor, patch] = currentVersion.split(".").map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  async getPipelineVersion(pipelineId: string): Promise<string | undefined> {
    const pipeline = this.pipelines.get(pipelineId);
    return pipeline?.version;
  }

  async getPipelineVersionHistory(pipelineId: string): Promise<string[]> {
    const pipeline = this.pipelines.get(pipelineId);
    return pipeline?.versionHistory || [];
  }

  async rollbackPipeline(
    pipelineId: string,
    targetVersion: string
  ): Promise<boolean> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return false;

    // In a real implementation, this would restore the pipeline to the target version
    // For now, we'll just update the version
    const updatedPipeline = {
      ...pipeline,
      version: targetVersion,
      updatedAt: new Date(),
    };

    this.pipelines.set(pipelineId, updatedPipeline);

    clientLogger.info("ETL pipeline rolled back", "data-processing", {
      pipelineId,
      targetVersion,
    });

    return true;
  }

  // Monitoring and Alerting
  async getPipelineHealth(
    pipelineId: string
  ): Promise<{ status: string; score: number; issues: string[] }> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      return { status: "unknown", score: 0, issues: ["Pipeline not found"] };
    }

    const recentExecutions = this.getExecutionsByPipeline(pipelineId)
      .filter(
        (execution) =>
          execution.startTime > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ) // Last 24 hours
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    if (recentExecutions.length === 0) {
      return {
        status: "no_executions",
        score: 50,
        issues: ["No recent executions"],
      };
    }

    const failedExecutions = recentExecutions.filter(
      (execution) => execution.status === "failed"
    );
    const successRate =
      (recentExecutions.length - failedExecutions.length) /
      recentExecutions.length;
    const score = Math.round(successRate * 100);

    const issues: string[] = [];
    if (successRate < 0.8) {
      issues.push("Low success rate");
    }
    if (failedExecutions.length > 0) {
      issues.push(`${failedExecutions.length} failed executions`);
    }

    let status = "healthy";
    if (score < 50) status = "critical";
    else if (score < 80) status = "warning";
    else if (score < 95) status = "degraded";

    return { status, score, issues };
  }
}
