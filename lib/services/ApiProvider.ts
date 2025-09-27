import { DataProvider, DataProviderConfig } from "../../types";
import { clientLogger } from "../utils/ClientLogger";

export interface ApiResponse {
  success: boolean;
  data: any[];
  status: number;
  headers: Record<string, string>;
  error?: string;
}

export interface ApiConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers: Record<string, string>;
  params: Record<string, string>;
  body?: string;
  authType: "none" | "bearer" | "basic" | "api_key";
  authConfig: {
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
}

export class ApiProvider {
  private static instance: ApiProvider;

  static getInstance(): ApiProvider {
    if (!ApiProvider.instance) {
      ApiProvider.instance = new ApiProvider();
    }
    return ApiProvider.instance;
  }

  /**
   * Fetch data from an API endpoint
   */
  async fetchData(config: ApiConfig): Promise<ApiResponse> {
    try {
      clientLogger.info(
        "Fetching data from API",
        "data-processing",
        {
          url: config.url,
          method: config.method,
          hasAuth: config.authType !== "none",
        },
        "ApiProvider"
      );

      // Build the request URL with query parameters
      const url = new URL(config.url);
      Object.entries(config.params).forEach(([key, value]) => {
        if (key.trim() && value.trim()) {
          url.searchParams.append(key, value);
        }
      });

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "Manifold-Data-Importer/1.0",
        ...config.headers,
      };

      // Add authentication headers
      if (config.authType === "bearer" && config.authConfig.token) {
        headers.Authorization = `Bearer ${config.authConfig.token}`;
      } else if (
        config.authType === "basic" &&
        config.authConfig.username &&
        config.authConfig.password
      ) {
        const credentials = btoa(
          `${config.authConfig.username}:${config.authConfig.password}`
        );
        headers.Authorization = `Basic ${credentials}`;
      } else if (
        config.authType === "api_key" &&
        config.authConfig.apiKey &&
        config.authConfig.apiKeyHeader
      ) {
        headers[config.authConfig.apiKeyHeader] = config.authConfig.apiKey;
      }

      // Prepare request options
      const requestOptions: RequestInit = {
        method: config.method,
        headers,
        // Add timeout
        signal: AbortSignal.timeout(30000), // 30 second timeout
      };

      // Add body for POST/PUT requests
      if (config.method === "POST" || config.method === "PUT") {
        if (config.body?.trim()) {
          try {
            // Validate JSON if provided
            JSON.parse(config.body);
            requestOptions.body = config.body;
          } catch (error) {
            clientLogger.warn(
              "Invalid JSON body provided, sending as text",
              "data-processing",
              { body: config.body, error },
              "ApiProvider"
            );
            requestOptions.body = config.body;
            headers["Content-Type"] = "text/plain";
          }
        }
      }

      // Make the request
      const response = await fetch(url.toString(), requestOptions);
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Handle different response types
      let data: any;
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else if (contentType.includes("text/")) {
        data = await response.text();
      } else {
        // For other content types, try to parse as JSON first, then fallback to text
        const textData = await response.text();
        try {
          data = JSON.parse(textData);
        } catch {
          data = textData;
        }
      }

      if (!response.ok) {
        clientLogger.error(
          "API request failed",
          "data-processing",
          {
            url: config.url,
            status: response.status,
            statusText: response.statusText,
            response: data,
          },
          "ApiProvider"
        );

        return {
          success: false,
          data: [],
          status: response.status,
          headers: responseHeaders,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Normalize the response data to an array format
      const normalizedData = this.normalizeResponseData(data);

      clientLogger.success(
        "API data fetched successfully",
        "data-processing",
        {
          url: config.url,
          status: response.status,
          recordCount: normalizedData.length,
          contentType,
        },
        "ApiProvider"
      );

      return {
        success: true,
        data: normalizedData,
        status: response.status,
        headers: responseHeaders,
      };
    } catch (error) {
      clientLogger.error(
        "Failed to fetch API data",
        "data-processing",
        {
          url: config.url,
          error: error instanceof Error ? error.message : String(error),
        },
        "ApiProvider"
      );

      return {
        success: false,
        data: [],
        status: 0,
        headers: {},
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Normalize API response data to a consistent array format
   */
  private normalizeResponseData(data: any): any[] {
    if (Array.isArray(data)) {
      return data;
    }

    if (typeof data === "object" && data !== null) {
      // Common API response patterns
      if (data.data && Array.isArray(data.data)) {
        return data.data;
      }
      if (data.results && Array.isArray(data.results)) {
        return data.results;
      }
      if (data.items && Array.isArray(data.items)) {
        return data.items;
      }
      if (data.records && Array.isArray(data.records)) {
        return data.records;
      }
      if (data.response && Array.isArray(data.response)) {
        return data.response;
      }

      // If it's a single object, wrap it in an array
      if (typeof data === "object") {
        return [data];
      }
    }

    // If it's a primitive value, wrap it in an object
    if (data !== null && data !== undefined) {
      return [{ value: data }];
    }

    return [];
  }

  /**
   * Test API connection without processing data
   */
  async testConnection(config: ApiConfig): Promise<{
    success: boolean;
    message: string;
    status?: number;
    data?: any;
  }> {
    try {
      const response = await this.fetchData(config);
      return {
        success: response.success,
        message: response.success
          ? `Connection successful! Status: ${response.status}`
          : `Connection failed: ${response.error}`,
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Extract schema information from API response data
   */
  extractSchema(data: any[]): {
    columns: Array<{ name: string; type: string }>;
    sampleData: any;
  } {
    if (!data || data.length === 0) {
      return {
        columns: [],
        sampleData: null,
      };
    }

    // Use the first record to determine column structure
    const sampleRecord = data[0];
    const columns: Array<{ name: string; type: string }> = [];

    if (typeof sampleRecord === "object" && sampleRecord !== null) {
      Object.entries(sampleRecord).forEach(([key, value]) => {
        const type = this.inferDataType(value);
        columns.push({ name: key, type });
      });
    }

    return {
      columns,
      sampleData: sampleRecord,
    };
  }

  /**
   * Infer data type from a value
   */
  private inferDataType(value: any): string {
    if (value === null || value === undefined) {
      return "string";
    }

    if (typeof value === "number") {
      return Number.isInteger(value) ? "number" : "number";
    }

    if (typeof value === "boolean") {
      return "boolean";
    }

    if (typeof value === "string") {
      // Check if it's a date string
      if (this.isDateString(value)) {
        return "date";
      }
      return "string";
    }

    if (Array.isArray(value)) {
      return "array";
    }

    if (typeof value === "object") {
      return "object";
    }

    return "string";
  }

  /**
   * Check if a string looks like a date
   */
  private isDateString(value: string): boolean {
    // Common date patterns
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO datetime
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    ];

    return datePatterns.some((pattern) => pattern.test(value));
  }

  /**
   * Create a snapshot from API data
   */
  async createSnapshotFromApi(
    dataSource: DataProvider,
    projectId: string
  ): Promise<any> {
    try {
      const apiConfig = this.buildApiConfigFromDataSource(dataSource);
      const response = await this.fetchData(apiConfig);

      if (!response.success) {
        throw new Error(`API fetch failed: ${response.error}`);
      }

      const schema = this.extractSchema(response.data);

      const snapshot = {
        id: `api_snapshot_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        projectId,
        dataSourceId: dataSource.id,
        data: response.data,
        schema: {
          columns: schema.columns.map((col) => ({
            name: col.name,
            type: col.type,
            nullable: true,
            unique: false,
          })),
        },
        metadata: {
          source: "api",
          url: dataSource.config.apiUrl,
          method: dataSource.config.apiMethod,
          status: response.status,
          headers: response.headers,
          fetchedAt: new Date().toISOString(),
          recordCount: response.data.length,
        },
        createdAt: new Date(),
        recordCount: response.data.length,
      };

      clientLogger.success(
        "API snapshot created successfully",
        "data-processing",
        {
          snapshotId: snapshot.id,
          dataSourceId: dataSource.id,
          recordCount: response.data.length,
          url: dataSource.config.apiUrl,
        },
        "ApiProvider"
      );

      return snapshot;
    } catch (error) {
      clientLogger.error(
        "Failed to create API snapshot",
        "data-processing",
        {
          error: error instanceof Error ? error.message : String(error),
          dataSourceId: dataSource.id,
        },
        "ApiProvider"
      );
      throw error;
    }
  }

  /**
   * Build API config from data source configuration
   */
  private buildApiConfigFromDataSource(dataSource: DataProvider): ApiConfig {
    return {
      url: dataSource.config.apiUrl || "",
      method: dataSource.config.apiMethod || "GET",
      headers: dataSource.config.apiHeaders || {},
      params: dataSource.config.apiParams || {},
      body: dataSource.config.apiBody,
      authType: dataSource.config.apiAuthType || "none",
      authConfig: dataSource.config.apiAuthConfig || {},
    };
  }
}
