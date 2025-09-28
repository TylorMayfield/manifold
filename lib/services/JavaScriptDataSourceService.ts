import { SeparatedDatabaseManager } from "../database/SeparatedDatabaseManager";
import { DataProvider, DataProviderConfig } from "../../types";
import { logger } from "../utils/logger";
import { ImportResult } from "../database/SeparatedDatabaseManager";

export interface JavaScriptExecutionResult {
  data: any[];
  metadata?: any;
  errors?: string[];
  executionTime: number;
}

export class JavaScriptDataSourceService {
  private dbManager: SeparatedDatabaseManager;

  constructor() {
    this.dbManager = SeparatedDatabaseManager.getInstance();
  }

  async executeJavaScriptScript(
    projectId: string,
    dataSourceId: string,
    script: string,
    variables: Record<string, any> = {}
  ): Promise<JavaScriptExecutionResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Create a safe execution environment
      const executionContext = this.createExecutionContext(variables);
      
      // Execute the JavaScript code
      const result = await this.executeScript(script, executionContext);
      
      // Validate result
      if (!result) {
        errors.push("Script did not return any data");
        return {
          data: [],
          errors,
          executionTime: Date.now() - startTime
        };
      }

      // Normalize result to array format
      let data: any[];
      if (Array.isArray(result)) {
        data = result;
      } else if (typeof result === 'object' && result !== null) {
        data = [result];
      } else {
        errors.push("Script must return an array of objects or a single object");
        return {
          data: [],
          errors,
          executionTime: Date.now() - startTime
        };
      }

      // Validate data structure
      const validationErrors = this.validateDataStructure(data);
      if (validationErrors.length > 0) {
        errors.push(...validationErrors);
      }

      const executionTime = Date.now() - startTime;

      logger.success(
        "JavaScript script executed successfully",
        "data-source",
        {
          projectId,
          dataSourceId,
          recordCount: data.length,
          executionTime
        },
        "JavaScriptDataSourceService"
      );

      return {
        data,
        metadata: {
          scriptLength: script.length,
          variableCount: Object.keys(variables).length,
          executionTime
        },
        errors: errors.length > 0 ? errors : undefined,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error(
        "JavaScript script execution failed",
        "data-source",
        {
          projectId,
          dataSourceId,
          error: errorMessage,
          executionTime
        },
        "JavaScriptDataSourceService"
      );

      return {
        data: [],
        errors: [errorMessage],
        executionTime
      };
    }
  }

  async importJavaScriptData(
    projectId: string,
    dataSourceId: string,
    script: string,
    variables: Record<string, any> = {},
    options: {
      schema?: any;
      enableDiff?: boolean;
      diffKey?: string;
    } = {}
  ): Promise<ImportResult> {
    // Execute the JavaScript script
    const result = await this.executeJavaScriptScript(
      projectId,
      dataSourceId,
      script,
      variables
    );

    if (result.errors && result.errors.length > 0) {
      throw new Error(`Script execution failed: ${result.errors.join(", ")}`);
    }

    // Import the data using the separated database manager
    return await this.dbManager.importData(
      projectId,
      dataSourceId,
      result.data,
      {
        schema: options.schema,
        metadata: {
          ...result.metadata,
          scriptSource: "javascript",
          variableKeys: Object.keys(variables)
        },
        enableDiff: options.enableDiff,
        diffKey: options.diffKey
      }
    );
  }

  async scheduleJavaScriptExecution(
    projectId: string,
    dataSourceId: string,
    config: {
      script: string;
      variables: Record<string, any>;
      interval: number; // minutes
      schedule?: string; // cron expression
      enableDiff?: boolean;
      diffKey?: string;
    }
  ): Promise<void> {
    // This would integrate with a job scheduler
    // For now, we'll create a simple interval-based execution
    
    const executeScript = async () => {
      try {
        await this.importJavaScriptData(
          projectId,
          dataSourceId,
          config.script,
          config.variables,
          {
            enableDiff: config.enableDiff,
            diffKey: config.diffKey
          }
        );
        
        logger.info(
          "Scheduled JavaScript execution completed",
          "data-source",
          { projectId, dataSourceId },
          "JavaScriptDataSourceService"
        );
      } catch (error) {
        logger.error(
          "Scheduled JavaScript execution failed",
          "data-source",
          { projectId, dataSourceId, error },
          "JavaScriptDataSourceService"
        );
      }
    };

    // Execute immediately
    await executeScript();

    // Schedule recurring execution
    const intervalMs = config.interval * 60 * 1000; // Convert minutes to milliseconds
    setInterval(executeScript, intervalMs);

    logger.info(
      "JavaScript execution scheduled",
      "data-source",
      {
        projectId,
        dataSourceId,
        interval: config.interval,
        schedule: config.schedule
      },
      "JavaScriptDataSourceService"
    );
  }

  private createExecutionContext(variables: Record<string, any>): any {
    // Create a safe execution context with limited globals
    return {
      // Safe globals
      console: {
        log: (...args: any[]) => logger.info(args.join(" "), "javascript", {}, "JavaScriptDataSourceService"),
        error: (...args: any[]) => logger.error(args.join(" "), "javascript", {}, "JavaScriptDataSourceService"),
        warn: (...args: any[]) => logger.warn(args.join(" "), "javascript", {}, "JavaScriptDataSourceService")
      },
      JSON: JSON,
      Date: Date,
      Math: Math,
      setTimeout: (fn: Function, delay: number) => {
        // Limited setTimeout implementation
        return setTimeout(fn, Math.min(delay, 5000)); // Max 5 seconds
      },
      
      // User variables
      ...variables,
      
      // Helper functions
      fetch: this.createSafeFetch(),
      
      // Utility functions
      utils: {
        generateId: () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        formatDate: (date: Date = new Date()) => date.toISOString(),
        parseJSON: (str: string) => {
          try {
            return JSON.parse(str);
          } catch {
            return null;
          }
        },
        stringifyJSON: (obj: any) => JSON.stringify(obj)
      }
    };
  }

  private createSafeFetch(): Function {
    return async (url: string, options: any = {}) => {
      try {
        // In a real implementation, this would use node-fetch or similar
        // For now, we'll create a mock implementation
        logger.info(
          "Mock fetch request",
          "javascript",
          { url, method: options.method || "GET" },
          "JavaScriptDataSourceService"
        );
        
        // Return a mock response
        return {
          ok: true,
          status: 200,
          json: async () => ({
            message: "This is a mock response. In production, this would make a real HTTP request.",
            url,
            timestamp: new Date().toISOString()
          }),
          text: async () => "Mock response",
          headers: new Map()
        };
      } catch (error) {
        throw new Error(`Fetch failed: ${error}`);
      }
    };
  }

  private async executeScript(script: string, context: any): Promise<any> {
    // Create a function that executes the script in the provided context
    const func = new Function(
      ...Object.keys(context),
      `
      try {
        ${script}
      } catch (error) {
        throw new Error("Script execution error: " + error.message);
      }
      `
    );

    // Execute with the context
    return func(...Object.values(context));
  }

  private validateDataStructure(data: any[]): string[] {
    const errors: string[] = [];

    if (!Array.isArray(data)) {
      errors.push("Data must be an array");
      return errors;
    }

    if (data.length === 0) {
      errors.push("Data array is empty");
      return errors;
    }

    // Check if all items are objects
    const nonObjectItems = data.filter(item => typeof item !== 'object' || item === null);
    if (nonObjectItems.length > 0) {
      errors.push(`Found ${nonObjectItems.length} non-object items in data array`);
    }

    // Check for consistent structure (all objects should have similar keys)
    if (data.length > 1) {
      const firstKeys = Object.keys(data[0] || {});
      const inconsistentItems = data.slice(1).filter((item, index) => {
        const itemKeys = Object.keys(item || {});
        return !this.arraysEqual(firstKeys.sort(), itemKeys.sort());
      });

      if (inconsistentItems.length > 0) {
        errors.push(`Found ${inconsistentItems.length} items with inconsistent structure`);
      }
    }

    return errors;
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((val, index) => val === b[index]);
  }

  // Test script execution without importing
  async testScript(
    script: string,
    variables: Record<string, any> = {}
  ): Promise<JavaScriptExecutionResult> {
    return await this.executeJavaScriptScript("test", "test", script, variables);
  }
}
