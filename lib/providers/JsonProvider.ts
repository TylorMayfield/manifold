import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import {
  BaseProvider,
  ProviderConfig,
  ExecutionContext,
  ExecutionResult,
  ValidationResult,
  ValidationError,
  TestConnectionResult,
  ColumnInfo,
  ProgressInfo
} from './BaseProvider';

export interface JsonProviderConfig extends ProviderConfig {
  type: 'json';
  connection: {
    filePath?: string;
    url?: string;
  };
  options: {
    encoding?: string;
    rootPath?: string; // JSONPath to extract array of objects (e.g., "$.data", "$.results")
    flattenNested?: boolean; // Flatten nested objects using dot notation
    maxDepth?: number; // Maximum nesting depth to flatten (default: 3)
    arrayHandling?: 'stringify' | 'first' | 'count' | 'ignore'; // How to handle array values
    transform?: string; // JavaScript function to transform each record
    dateFields?: string[]; // Fields to parse as dates
    numberFields?: string[]; // Fields to parse as numbers
    booleanFields?: string[]; // Fields to parse as booleans
    skipInvalidRecords?: boolean; // Skip records that can't be processed
    streaming?: boolean; // Use streaming parser for large JSON files (newline-delimited JSON)
  };
}

export class JsonProvider extends BaseProvider {
  private config: JsonProviderConfig;

  constructor(config: ProviderConfig) {
    super(config);
    this.config = config as JsonProviderConfig;
  }

  get type(): string {
    return 'json';
  }

  get displayName(): string {
    return 'JSON Files';
  }

  get description(): string {
    return 'Import data from JSON files with nested object flattening and streaming support';
  }

  async validateConfig(config?: Partial<JsonProviderConfig>): Promise<ValidationResult> {
    const configToValidate = config ? { ...this.config, ...config } : this.config;
    const errors: ValidationError[] = [];

    // Must have either filePath or url
    if (!configToValidate.connection.filePath && !configToValidate.connection.url) {
      errors.push({
        field: 'connection',
        code: 'MISSING_SOURCE',
        message: 'Either file path or URL is required'
      });
    }

    // Validate file path if provided
    if (configToValidate.connection.filePath) {
      const ext = configToValidate.connection.filePath.toLowerCase();
      if (!ext.endsWith('.json') && !ext.endsWith('.jsonl') && !ext.endsWith('.ndjson')) {
        errors.push({
          field: 'connection.filePath',
          code: 'INVALID_FILE_TYPE',
          message: 'File must have .json, .jsonl, or .ndjson extension'
        });
      }

      // Check if file exists (for local files)
      if (!configToValidate.connection.filePath.startsWith('http')) {
        try {
          if (!fs.existsSync(configToValidate.connection.filePath)) {
            errors.push({
              field: 'connection.filePath',
              code: 'FILE_NOT_FOUND',
              message: 'File not found at specified path'
            });
          }
        } catch (err) {
          errors.push({
            field: 'connection.filePath',
            code: 'ACCESS_ERROR',
            message: 'Unable to access file'
          });
        }
      }
    }

    // Validate URL if provided
    if (configToValidate.connection.url) {
      try {
        new URL(configToValidate.connection.url);
      } catch {
        errors.push({
          field: 'connection.url',
          code: 'INVALID_URL',
          message: 'Invalid URL format'
        });
      }
    }

    // Validate JSONPath if provided
    if (configToValidate.options.rootPath) {
      if (!configToValidate.options.rootPath.startsWith('$')) {
        errors.push({
          field: 'options.rootPath',
          code: 'INVALID_JSONPATH',
          message: 'Root path must be a valid JSONPath starting with $'
        });
      }
    }

    // Validate transform function if provided
    if (configToValidate.options.transform) {
      try {
        new Function('record', 'index', configToValidate.options.transform);
      } catch (err) {
        errors.push({
          field: 'options.transform',
          code: 'INVALID_TRANSFORM',
          message: 'Invalid JavaScript transform function'
        });
      }
    }

    // Validate array handling option
    if (configToValidate.options.arrayHandling) {
      const validOptions = ['stringify', 'first', 'count', 'ignore'];
      if (!validOptions.includes(configToValidate.options.arrayHandling)) {
        errors.push({
          field: 'options.arrayHandling',
          code: 'INVALID_ARRAY_HANDLING',
          message: `Array handling must be one of: ${validOptions.join(', ')}`
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async testConnection(): Promise<TestConnectionResult> {
    const startTime = Date.now();

    try {
      const source = this.config.connection.filePath || this.config.connection.url;
      if (!source) {
        return {
          success: false,
          error: 'No file path or URL configured'
        };
      }

      let size = 0;
      let content: string;

      if (this.config.connection.url) {
        // Test HTTP(S) URL
        const response = await fetch(this.config.connection.url);
        if (!response.ok) {
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
          };
        }
        
        size = parseInt(response.headers.get('content-length') || '0');
        content = await response.text();
      } else {
        // Test local file
        if (!fs.existsSync(this.config.connection.filePath!)) {
          return {
            success: false,
            error: 'File not found'
          };
        }

        const stats = fs.statSync(this.config.connection.filePath!);
        size = stats.size;
        content = fs.readFileSync(this.config.connection.filePath!, 
          { encoding: this.config.options.encoding as BufferEncoding || 'utf8' }
        );
      }

      // Test parsing
      const testResult = await this.testParsing(content);
      const latency = Date.now() - startTime;

      if (!testResult.success) {
        return testResult;
      }

      return {
        success: true,
        message: `Successfully connected to JSON file (${this.formatBytes(size)})`,
        latency
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        latency: Date.now() - startTime
      };
    }
  }

  async run(ctx: ExecutionContext): Promise<ExecutionResult> {
    this.isRunning = true;
    this.currentContext = ctx;
    const startTime = Date.now();

    try {
      this.emitLog('info', 'Starting JSON import');
      
      const source = this.config.connection.filePath || this.config.connection.url;
      if (!source) {
        throw new Error('No file path or URL configured');
      }

      // Get content
      const { content, totalSize } = await this.getContent();
      
      // Parse JSON
      const result = await this.parseJson(content, totalSize, ctx);

      const duration = Date.now() - startTime;
      this.updateScheduleMetadata(new Date(), true);

      this.emitLog('info', `JSON import completed: ${result.recordsProcessed} records in ${this.formatDuration(duration)}`);

      return {
        success: true,
        recordsProcessed: result.recordsProcessed,
        bytesProcessed: result.bytesProcessed,
        duration,
        metadata: {
          source,
          columns: result.columns,
          fileSize: totalSize,
          estimatedRows: result.recordsProcessed,
          isStreamingFormat: result.isStreamingFormat
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateScheduleMetadata(new Date(), false);
      
      this.emitLog('error', 'JSON import failed', error);
      
      return this.createExecutionError(
        'JSON_IMPORT_FAILED',
        error instanceof Error ? error.message : String(error),
        error
      );
    } finally {
      this.isRunning = false;
      this.currentContext = undefined;
    }
  }

  async previewData(options: { limit?: number } = {}): Promise<any[]> {
    const limit = options.limit || 10;
    
    try {
      const { content } = await this.getContent();
      const records = await this.extractRecords(content);
      
      return records.slice(0, limit).map((record, index) => 
        this.transformRecord(record, index)
      );
    } catch (error) {
      throw error;
    }
  }

  private async testParsing(content: string): Promise<TestConnectionResult> {
    try {
      const records = await this.extractRecords(content);
      
      if (records.length === 0) {
        return {
          success: false,
          error: 'No records found in JSON file'
        };
      }

      const sampleCount = Math.min(5, records.length);
      return {
        success: true,
        message: `Successfully parsed ${records.length} records (tested ${sampleCount})`
      };

    } catch (error) {
      return {
        success: false,
        error: `Parse error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async getContent(): Promise<{ content: string; totalSize: number }> {
    if (this.config.connection.url) {
      const response = await fetch(this.config.connection.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const content = await response.text();
      const totalSize = parseInt(response.headers.get('content-length') || content.length.toString());
      return { content, totalSize };
    } else {
      const filePath = this.config.connection.filePath!;
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 
        { encoding: this.config.options.encoding as BufferEncoding || 'utf8' }
      );
      
      return { content, totalSize: stats.size };
    }
  }

  private async parseJson(
    content: string, 
    totalSize: number, 
    ctx: ExecutionContext
  ): Promise<{
    recordsProcessed: number;
    bytesProcessed: number;
    columns: string[];
    isStreamingFormat: boolean;
  }> {
    this.emitProgress({
      percent: 10,
      recordsProcessed: 0,
      currentStep: 'Parsing JSON structure',
      bytesProcessed: 0,
      totalBytes: totalSize
    });

    const records = await this.extractRecords(content);
    const isStreamingFormat = this.isStreamingJsonFormat(content);
    
    this.emitProgress({
      percent: 30,
      recordsProcessed: 0,
      currentStep: `Found ${records.length} records`,
      bytesProcessed: Math.floor(totalSize * 0.3),
      totalBytes: totalSize
    });

    let recordsProcessed = 0;
    let bytesProcessed = Math.floor(totalSize * 0.3);
    let columns: string[] = [];

    // Process records in batches
    const batchSize = 1000;
    const totalBatches = Math.ceil(records.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      this.checkAborted();

      const startIdx = batchIndex * batchSize;
      const endIdx = Math.min(startIdx + batchSize, records.length);
      const batch = records.slice(startIdx, endIdx);

      // Process batch
      for (const record of batch) {
        const transformedRecord = this.transformRecord(record, recordsProcessed);
        
        // Collect column names from first record
        if (recordsProcessed === 0 && typeof transformedRecord === 'object') {
          columns = Object.keys(transformedRecord);
        }

        // Here you would typically insert into database
        // For now, we'll just count the records
        recordsProcessed++;
      }

      // Update progress
      const progressPercent = 30 + ((batchIndex + 1) / totalBatches) * 65;
      bytesProcessed = Math.floor((progressPercent / 100) * totalSize);

      this.emitProgress({
        percent: Math.min(progressPercent, 99),
        recordsProcessed,
        currentStep: `Processed ${recordsProcessed.toLocaleString()} records`,
        bytesProcessed,
        totalBytes: totalSize
      });
    }

    // Final progress
    this.emitProgress({
      percent: 100,
      recordsProcessed,
      currentStep: 'Import completed',
      bytesProcessed: totalSize,
      totalBytes: totalSize
    });

    return {
      recordsProcessed,
      bytesProcessed: totalSize,
      columns,
      isStreamingFormat
    };
  }

  private async extractRecords(content: string): Promise<any[]> {
    const trimmedContent = content.trim();
    
    // Check if it's newline-delimited JSON (NDJSON/JSONL)
    if (this.isStreamingJsonFormat(trimmedContent)) {
      return this.parseStreamingJson(trimmedContent);
    }

    // Parse as regular JSON
    let jsonData: any;
    try {
      jsonData = JSON.parse(trimmedContent);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Extract records using root path or default logic
    return this.extractRecordsFromData(jsonData);
  }

  private isStreamingJsonFormat(content: string): boolean {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return false;

    // Check if first few lines are valid JSON objects
    try {
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const line = lines[i].trim();
        if (line) {
          const parsed = JSON.parse(line);
          if (typeof parsed !== 'object' || Array.isArray(parsed)) {
            return false;
          }
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  private parseStreamingJson(content: string): any[] {
    const lines = content.trim().split('\n');
    const records: any[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        try {
          const record = JSON.parse(trimmedLine);
          if (typeof record === 'object' && record !== null && !Array.isArray(record)) {
            records.push(record);
          }
        } catch (error) {
          if (!this.config.options.skipInvalidRecords) {
            throw new Error(`Invalid JSON line: ${trimmedLine}`);
          }
          this.emitLog('warn', `Skipping invalid JSON line: ${trimmedLine}`, { error });
        }
      }
    }

    return records;
  }

  private extractRecordsFromData(data: any): any[] {
    // Use root path if specified
    if (this.config.options.rootPath) {
      const extracted = this.extractByPath(data, this.config.options.rootPath);
      if (Array.isArray(extracted)) {
        return extracted;
      } else if (extracted !== undefined) {
        return [extracted];
      } else {
        throw new Error(`Root path ${this.config.options.rootPath} not found in JSON`);
      }
    }

    // Auto-detect array of records
    if (Array.isArray(data)) {
      return data;
    }

    // Look for common array properties
    const commonArrayKeys = ['data', 'results', 'items', 'records', 'rows', 'list'];
    for (const key of commonArrayKeys) {
      if (data[key] && Array.isArray(data[key])) {
        return data[key];
      }
    }

    // If it's an object, treat it as a single record
    if (typeof data === 'object' && data !== null) {
      return [data];
    }

    throw new Error('Unable to extract records from JSON structure');
  }

  private extractByPath(data: any, path: string): any {
    // Simple JSONPath implementation (supports basic dot notation)
    const parts = path.replace('$', '').split('.');
    let current = data;

    for (const part of parts) {
      if (part === '') continue;
      
      if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  private transformRecord(record: any, index: number): any {
    let transformed = record;

    // Flatten nested objects if requested
    if (this.config.options.flattenNested) {
      transformed = this.flattenObject(transformed);
    }

    // Apply type conversions
    if (typeof transformed === 'object' && transformed !== null) {
      transformed = this.applyTypeConversions(transformed);
    }

    // Apply custom transform function
    if (this.config.options.transform) {
      try {
        const transformFunction = new Function('record', 'index', `return (${this.config.options.transform})(record, index);`);
        transformed = transformFunction(transformed, index);
      } catch (error) {
        this.emitLog('warn', `Transform error on record ${index + 1}: ${error}`, { record, error });
        if (!this.config.options.skipInvalidRecords) {
          throw error;
        }
      }
    }

    return transformed;
  }

  private flattenObject(obj: any, prefix = '', depth = 0): any {
    const maxDepth = this.config.options.maxDepth || 3;
    if (depth >= maxDepth || typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const flattened: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (Array.isArray(value)) {
        // Handle arrays based on configuration
        switch (this.config.options.arrayHandling) {
          case 'first':
            flattened[newKey] = value.length > 0 ? value[0] : null;
            break;
          case 'count':
            flattened[newKey] = value.length;
            break;
          case 'stringify':
            flattened[newKey] = JSON.stringify(value);
            break;
          case 'ignore':
            // Skip array properties
            break;
          default:
            flattened[newKey] = JSON.stringify(value);
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively flatten nested objects
        const nested = this.flattenObject(value, newKey, depth + 1);
        Object.assign(flattened, nested);
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }

  private applyTypeConversions(record: any): any {
    const converted = { ...record };

    // Convert date fields
    if (this.config.options.dateFields) {
      for (const field of this.config.options.dateFields) {
        if (converted[field] && typeof converted[field] === 'string') {
          const date = new Date(converted[field]);
          if (!isNaN(date.getTime())) {
            converted[field] = date;
          }
        }
      }
    }

    // Convert number fields
    if (this.config.options.numberFields) {
      for (const field of this.config.options.numberFields) {
        if (converted[field] && typeof converted[field] === 'string') {
          const num = parseFloat(converted[field]);
          if (!isNaN(num)) {
            converted[field] = num;
          }
        }
      }
    }

    // Convert boolean fields
    if (this.config.options.booleanFields) {
      for (const field of this.config.options.booleanFields) {
        if (converted[field] !== undefined) {
          const value = String(converted[field]).toLowerCase();
          converted[field] = value === 'true' || value === '1' || value === 'yes' || value === 'y';
        }
      }
    }

    return converted;
  }

  private inferColumnTypes(records: any[]): ColumnInfo[] {
    if (records.length === 0) return [];
    
    const columns: ColumnInfo[] = [];
    const firstRecord = records[0];
    
    if (typeof firstRecord === 'object' && firstRecord !== null) {
      Object.keys(firstRecord).forEach(key => {
        const values = records.map(record => record[key]).filter(val => val != null);
        const type = this.inferColumnType(values);
        
        columns.push({
          name: key,
          type,
          nullable: values.length < records.length,
          primaryKey: false
        });
      });
    }
    
    return columns;
  }

  private inferColumnType(values: any[]): string {
    if (values.length === 0) return 'string';
    
    const sample = values.slice(0, Math.min(100, values.length));
    
    // Check native types first
    if (sample.every(val => typeof val === 'number')) {
      return sample.some(val => val % 1 !== 0) ? 'decimal' : 'integer';
    }
    
    if (sample.every(val => typeof val === 'boolean')) {
      return 'boolean';
    }
    
    if (sample.every(val => val instanceof Date)) {
      return 'datetime';
    }
    
    // Check string-based types
    if (sample.every(val => typeof val === 'string')) {
      // Check if all values are numbers
      if (sample.every(val => !isNaN(Number(val)))) {
        return sample.some(val => val.includes('.')) ? 'decimal' : 'integer';
      }
      
      // Check if all values are dates
      if (sample.every(val => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && val.match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/);
      })) {
        return 'datetime';
      }
    }
    
    return 'string';
  }
}