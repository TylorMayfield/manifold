import { logger } from "../utils/logger";

export interface ExecutionCallbacks {
  onNodeStart?: (nodeId: string) => void;
  onNodeComplete?: (nodeId: string, result: ExecutionResult) => void;
  onEdgeUpdate?: (edgeId: string, data: any) => void;
  onProgress?: (progress: number, message: string) => void;
}

export interface ExecutionResult {
  success: boolean;
  data?: any[];
  error?: string;
  executionTime: number;
  rowsProcessed: number;
  outputSchema?: any;
  warnings?: string[];
}

export interface WorkflowExecutionResult {
  success: boolean;
  executionTime: number;
  totalRows: number;
  completedNodes: number;
  failedNodes: number;
  results: Map<string, ExecutionResult>;
}

export class WorkflowExecutor {
  private isRunning: boolean = false;
  private shouldStop: boolean = false;

  async executeWorkflow(
    nodes: any[],
    edges: any[],
    callbacks?: ExecutionCallbacks
  ): Promise<WorkflowExecutionResult> {
    this.isRunning = true;
    this.shouldStop = false;

    const startTime = Date.now();
    const results = new Map<string, ExecutionResult>();
    let totalRows = 0;
    let completedNodes = 0;
    let failedNodes = 0;

    try {
      // Get execution order using topological sort
      const executionOrder = this.getExecutionOrder(nodes, edges);
      logger.info("Workflow execution started", "system", {
        nodeCount: nodes.length,
        executionOrder,
      });

      // Execute nodes in order
      for (const nodeId of executionOrder) {
        if (this.shouldStop) {
          logger.info("Workflow execution stopped by user", "system");
          break;
        }

        const node = nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        callbacks?.onNodeStart?.(nodeId);

        try {
          const nodeResult = await this.executeNode(
            node,
            nodes,
            edges,
            results
          );
          results.set(nodeId, nodeResult);

          totalRows += nodeResult.rowsProcessed;

          if (nodeResult.success) {
            completedNodes++;
          } else {
            failedNodes++;
          }

          callbacks?.onNodeComplete?.(nodeId, nodeResult);

          // Update outgoing edges
          const outgoingEdges = edges.filter((edge) => edge.source === nodeId);
          for (const edge of outgoingEdges) {
            callbacks?.onEdgeUpdate?.(edge.id, {
              rowCount: nodeResult.rowsProcessed,
              schema: nodeResult.outputSchema,
              isActive: true,
              bandwidth: this.calculateBandwidth(nodeResult.rowsProcessed),
            });
          }

          // Brief delay to show animation
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          const errorResult: ExecutionResult = {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            executionTime: 0,
            rowsProcessed: 0,
          };

          results.set(nodeId, errorResult);
          failedNodes++;

          callbacks?.onNodeComplete?.(nodeId, errorResult);

          logger.error("Node execution failed", "system", {
            nodeId,
            error: error instanceof Error ? error.message : error,
          });
        }
      }

      const executionTime = Date.now() - startTime;

      logger.success("Workflow execution completed", "system", {
        executionTime,
        totalRows,
        completedNodes,
        failedNodes,
      });

      return {
        success: failedNodes === 0,
        executionTime,
        totalRows,
        completedNodes,
        failedNodes,
        results,
      };
    } catch (error) {
      logger.error("Workflow execution failed", "system", { error });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  stopExecution(): void {
    if (this.isRunning) {
      this.shouldStop = true;
      logger.info("Workflow execution stop requested", "system");
    }
  }

  private async executeNode(
    node: any,
    allNodes: any[],
    edges: any[],
    previousResults: Map<string, ExecutionResult>
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      switch (node.data.type) {
        case "dataSource":
          return await this.executeDataSourceNode(node);
        case "transform":
          return await this.executeTransformNode(
            node,
            allNodes,
            edges,
            previousResults
          );
        case "merge":
          return await this.executeMergeNode(
            node,
            allNodes,
            edges,
            previousResults
          );
        case "diff":
          return await this.executeDiffNode(
            node,
            allNodes,
            edges,
            previousResults
          );
        case "output":
          return await this.executeOutputNode(
            node,
            allNodes,
            edges,
            previousResults
          );
        default:
          throw new Error(`Unsupported node type: ${node.data.type}`);
      }
    } catch (error) {
      throw error;
    }
  }

  private async executeDataSourceNode(node: any): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Simulate data source execution
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 1000 + 500)
    );

    const sampleData = this.generateSampleData(
      node.data.config?.sourceType || "csv"
    );
    const executionTime = Date.now() - startTime;

    return {
      success: Math.random() > 0.05, // 95% success rate
      data: sampleData,
      executionTime,
      rowsProcessed: sampleData.length,
      outputSchema: this.inferSchema(sampleData),
    };
  }

  private async executeTransformNode(
    node: any,
    allNodes: any[],
    edges: any[],
    previousResults: Map<string, ExecutionResult>
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Get input data from connected nodes
    const inputEdges = edges.filter((edge) => edge.target === node.id);
    let inputData: any[] = [];

    for (const edge of inputEdges) {
      const sourceResult = previousResults.get(edge.source);
      if (sourceResult?.data) {
        inputData = inputData.concat(sourceResult.data);
      }
    }

    // Simulate transformation
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 800 + 300)
    );

    // Apply transformations based on node config
    let transformedData = [...inputData];

    const config = node.data.config || {};

    // Apply filters
    if (config.filters && config.filters.length > 0) {
      for (const filter of config.filters) {
        transformedData = this.applyFilter(transformedData, filter);
      }
    }

    // Apply field mappings
    if (config.fieldMappings && config.fieldMappings.length > 0) {
      transformedData = this.applyFieldMappings(
        transformedData,
        config.fieldMappings
      );
    }

    // Apply sorting
    if (config.sortBy) {
      transformedData = this.applySorting(transformedData, config.sortBy);
    }

    const executionTime = Date.now() - startTime;

    return {
      success: Math.random() > 0.02, // 98% success rate
      data: transformedData,
      executionTime,
      rowsProcessed: transformedData.length,
      outputSchema: this.inferSchema(transformedData),
    };
  }

  private async executeMergeNode(
    node: any,
    allNodes: any[],
    edges: any[],
    previousResults: Map<string, ExecutionResult>
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Get input data from all connected nodes
    const inputEdges = edges.filter((edge) => edge.target === node.id);
    const datasets: any[][] = [];

    for (const edge of inputEdges) {
      const sourceResult = previousResults.get(edge.source);
      if (sourceResult?.data) {
        datasets.push(sourceResult.data);
      }
    }

    if (datasets.length < 2) {
      throw new Error("Merge node requires at least 2 input datasets");
    }

    // Simulate merge operation
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 1200 + 600)
    );

    const config = node.data.config || {};
    const mergeType = config.mergeType || "inner";
    const joinKey = config.joinKey || "id";

    const mergedData = this.mergeDatasets(datasets, joinKey, mergeType);
    const executionTime = Date.now() - startTime;

    return {
      success: Math.random() > 0.03, // 97% success rate
      data: mergedData,
      executionTime,
      rowsProcessed: mergedData.length,
      outputSchema: this.inferSchema(mergedData),
    };
  }

  private async executeDiffNode(
    node: any,
    allNodes: any[],
    edges: any[],
    previousResults: Map<string, ExecutionResult>
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Get input data from connected nodes (should be exactly 2)
    const inputEdges = edges.filter((edge) => edge.target === node.id);
    if (inputEdges.length !== 2) {
      throw new Error("Diff node requires exactly 2 input datasets");
    }

    const dataset1 = previousResults.get(inputEdges[0].source)?.data || [];
    const dataset2 = previousResults.get(inputEdges[1].source)?.data || [];

    // Simulate diff operation
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 1000 + 400)
    );

    const config = node.data.config || {};
    const compareKey = config.compareKey || "id";

    const diffResult = this.compareDatasets(dataset1, dataset2, compareKey);
    const executionTime = Date.now() - startTime;

    return {
      success: Math.random() > 0.01, // 99% success rate
      data: diffResult,
      executionTime,
      rowsProcessed: diffResult.length,
      outputSchema: this.inferDiffSchema(),
      warnings: diffResult.length === 0 ? ["No differences found"] : undefined,
    };
  }

  private async executeOutputNode(
    node: any,
    allNodes: any[],
    edges: any[],
    previousResults: Map<string, ExecutionResult>
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Get input data from connected nodes
    const inputEdges = edges.filter((edge) => edge.target === node.id);
    let inputData: any[] = [];

    for (const edge of inputEdges) {
      const sourceResult = previousResults.get(edge.source);
      if (sourceResult?.data) {
        inputData = inputData.concat(sourceResult.data);
      }
    }

    // Simulate output operation
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 600 + 200)
    );

    const config = node.data.config || {};
    const outputType = config.outputType || "table";

    // In a real implementation, this would actually write to the destination
    logger.info(`Writing ${inputData.length} rows to ${outputType}`, "system");

    const executionTime = Date.now() - startTime;

    return {
      success: Math.random() > 0.01, // 99% success rate
      data: inputData,
      executionTime,
      rowsProcessed: inputData.length,
      outputSchema: this.inferSchema(inputData),
    };
  }

  private getExecutionOrder(nodes: any[], edges: any[]): string[] {
    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();

    // Initialize
    nodes.forEach((node) => {
      inDegree.set(node.id, 0);
      graph.set(node.id, []);
    });

    // Build graph and calculate in-degrees
    edges.forEach((edge) => {
      const source = edge.source;
      const target = edge.target;
      inDegree.set(target, (inDegree.get(target) || 0) + 1);
      graph.get(source)?.push(target);
    });

    // Topological sort using Kahn's algorithm
    const queue: string[] = [];
    const result: string[] = [];

    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      graph.get(current)?.forEach((neighbor) => {
        inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      });
    }

    if (result.length !== nodes.length) {
      throw new Error("Circular dependency detected in workflow");
    }

    return result;
  }

  private generateSampleData(sourceType: string): any[] {
    const baseData = [
      {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        age: 30,
        department: "Engineering",
        salary: 75000,
        created_at: "2024-01-15",
      },
      {
        id: 2,
        name: "Jane Smith",
        email: "jane@example.com",
        age: 25,
        department: "Marketing",
        salary: 65000,
        created_at: "2024-02-20",
      },
      {
        id: 3,
        name: "Bob Johnson",
        email: "bob@example.com",
        age: 35,
        department: "Sales",
        salary: 70000,
        created_at: "2024-03-10",
      },
      {
        id: 4,
        name: "Alice Brown",
        email: "alice@example.com",
        age: 28,
        department: "Engineering",
        salary: 80000,
        created_at: "2024-04-05",
      },
      {
        id: 5,
        name: "Charlie Davis",
        email: "charlie@example.com",
        age: 32,
        department: "Finance",
        salary: 72000,
        created_at: "2024-05-12",
      },
    ];

    switch (sourceType) {
      case "api":
        return baseData.map((item) => ({
          ...item,
          source: "api",
          timestamp: new Date().toISOString(),
        }));
      case "database":
        return baseData.map((item) => ({
          ...item,
          table: "users",
          updated_at: new Date().toISOString(),
        }));
      default:
        return baseData;
    }
  }

  private applyFilter(data: any[], filter: any): any[] {
    if (!filter.field || !filter.operator || filter.value === undefined) {
      return data;
    }

    return data.filter((row) => {
      const fieldValue = row[filter.field];

      switch (filter.operator) {
        case "equals":
          return fieldValue === filter.value;
        case "not_equals":
          return fieldValue !== filter.value;
        case "greater_than":
          return fieldValue > filter.value;
        case "less_than":
          return fieldValue < filter.value;
        case "contains":
          return String(fieldValue)
            .toLowerCase()
            .includes(String(filter.value).toLowerCase());
        default:
          return true;
      }
    });
  }

  private applyFieldMappings(data: any[], mappings: any[]): any[] {
    return data.map((row) => {
      const newRow = { ...row };

      mappings.forEach((mapping) => {
        if (mapping.sourceField && mapping.targetField) {
          newRow[mapping.targetField] = row[mapping.sourceField];
          if (mapping.transform) {
            newRow[mapping.targetField] = this.applyTransform(
              newRow[mapping.targetField],
              mapping.transform
            );
          }
        }
      });

      return newRow;
    });
  }

  private applySorting(data: any[], sortConfig: any): any[] {
    if (!sortConfig.field) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.field];
      const bVal = b[sortConfig.field];

      if (aVal < bVal) return sortConfig.direction === "desc" ? 1 : -1;
      if (aVal > bVal) return sortConfig.direction === "desc" ? -1 : 1;
      return 0;
    });
  }

  private applyTransform(value: any, transform: string): any {
    switch (transform) {
      case "uppercase":
        return String(value).toUpperCase();
      case "lowercase":
        return String(value).toLowerCase();
      case "trim":
        return String(value).trim();
      case "round":
        return Math.round(Number(value));
      default:
        return value;
    }
  }

  private mergeDatasets(
    datasets: any[][],
    joinKey: string,
    mergeType: string
  ): any[] {
    if (datasets.length < 2) return [];

    let result = datasets[0];

    for (let i = 1; i < datasets.length; i++) {
      result = this.joinTwoDatasets(result, datasets[i], joinKey, mergeType);
    }

    return result;
  }

  private joinTwoDatasets(
    left: any[],
    right: any[],
    joinKey: string,
    joinType: string
  ): any[] {
    const result: any[] = [];

    switch (joinType) {
      case "inner":
        left.forEach((leftRow) => {
          const rightRow = right.find((r) => r[joinKey] === leftRow[joinKey]);
          if (rightRow) {
            result.push({ ...leftRow, ...rightRow });
          }
        });
        break;

      case "left":
        left.forEach((leftRow) => {
          const rightRow = right.find((r) => r[joinKey] === leftRow[joinKey]);
          result.push({ ...leftRow, ...(rightRow || {}) });
        });
        break;

      case "outer":
        const processedRightIds = new Set();

        left.forEach((leftRow) => {
          const rightRow = right.find((r) => r[joinKey] === leftRow[joinKey]);
          if (rightRow) {
            processedRightIds.add(rightRow[joinKey]);
            result.push({ ...leftRow, ...rightRow });
          } else {
            result.push(leftRow);
          }
        });

        right.forEach((rightRow) => {
          if (!processedRightIds.has(rightRow[joinKey])) {
            result.push(rightRow);
          }
        });
        break;

      default:
        return [...left, ...right];
    }

    return result;
  }

  private compareDatasets(
    dataset1: any[],
    dataset2: any[],
    compareKey: string
  ): any[] {
    const differences: any[] = [];

    // Find records in dataset1 but not in dataset2
    dataset1.forEach((record1) => {
      const record2 = dataset2.find(
        (r) => r[compareKey] === record1[compareKey]
      );
      if (!record2) {
        differences.push({
          type: "deleted",
          key: record1[compareKey],
          old_record: record1,
          new_record: null,
        });
      } else {
        // Compare field values
        const fieldDifferences = this.compareRecords(record1, record2);
        if (fieldDifferences.length > 0) {
          differences.push({
            type: "modified",
            key: record1[compareKey],
            old_record: record1,
            new_record: record2,
            field_changes: fieldDifferences,
          });
        }
      }
    });

    // Find records in dataset2 but not in dataset1
    dataset2.forEach((record2) => {
      const record1 = dataset1.find(
        (r) => r[compareKey] === record2[compareKey]
      );
      if (!record1) {
        differences.push({
          type: "added",
          key: record2[compareKey],
          old_record: null,
          new_record: record2,
        });
      }
    });

    return differences;
  }

  private compareRecords(record1: any, record2: any): any[] {
    const differences: any[] = [];
    const allKeys = new Set([...Object.keys(record1), ...Object.keys(record2)]);

    allKeys.forEach((key) => {
      if (record1[key] !== record2[key]) {
        differences.push({
          field: key,
          old_value: record1[key],
          new_value: record2[key],
        });
      }
    });

    return differences;
  }

  private inferSchema(data: any[]): any {
    if (data.length === 0) return null;

    const sample = data[0];
    const schema: any = {};

    Object.keys(sample).forEach((key) => {
      const value = sample[key];
      if (typeof value === "number") {
        schema[key] = Number.isInteger(value) ? "integer" : "float";
      } else if (typeof value === "boolean") {
        schema[key] = "boolean";
      } else if (
        value instanceof Date ||
        (typeof value === "string" && !isNaN(Date.parse(value)))
      ) {
        schema[key] = "datetime";
      } else {
        schema[key] = "string";
      }
    });

    return schema;
  }

  private inferDiffSchema(): any {
    return {
      type: "string",
      key: "string",
      old_record: "object",
      new_record: "object",
      field_changes: "array",
    };
  }

  private calculateBandwidth(rowCount: number): "low" | "medium" | "high" {
    if (rowCount < 100) return "low";
    if (rowCount < 1000) return "medium";
    return "high";
  }
}
