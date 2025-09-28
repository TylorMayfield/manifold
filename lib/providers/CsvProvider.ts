import * as Papa from 'papaparse';
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

export interface CsvProviderConfig extends ProviderConfig {
  type: 'csv';
  connection: {
    filePath?: string;
    url?: string;
  };
  options: {
    delimiter?: string;
    header?: boolean;
    encoding?: string;
    skipEmptyLines?: boolean;
    skipLinesWithError?: boolean;
    transform?: string; // JavaScript function to transform each row
    columns?: string[]; // Override column names
    dateColumns?: string[]; // Columns to parse as dates
    numberColumns?: string[]; // Columns to parse as numbers
    booleanColumns?: string[]; // Columns to parse as booleans
  };
}

export class CsvProvider extends BaseProvider {
  private config: CsvProviderConfig;

  constructor(config: ProviderConfig) {
    super(config);
    this.config = config as CsvProviderConfig;
  }

  get type(): string {
    return 'csv';
  }

  get displayName(): string {
    return 'CSV Files';
  }

  get description(): string {
    return 'Import data from CSV files with automatic type detection and streaming support';
  }

  async validateConfig(config?: Partial<CsvProviderConfig>): Promise<ValidationResult> {
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
      if (!configToValidate.connection.filePath.toLowerCase().endsWith('.csv')) {
        errors.push({
          field: 'connection.filePath',
          code: 'INVALID_FILE_TYPE',
          message: 'File must have .csv extension'
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

    // Validate transform function if provided
    if (configToValidate.options.transform) {
      try {
        new Function('row', 'index', configToValidate.options.transform);
      } catch (err) {
        errors.push({
          field: 'options.transform',
          code: 'INVALID_TRANSFORM',
          message: 'Invalid JavaScript transform function'
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

      let stream: Readable;
      let size = 0;

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
        stream = response.body as any;
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
        stream = fs.createReadStream(this.config.connection.filePath!);
      }

      // Test parsing first few lines
      const testResult = await this.testParsing(stream);
      const latency = Date.now() - startTime;

      if (!testResult.success) {
        return testResult;
      }

      return {
        success: true,
        message: `Successfully connected to CSV file (${this.formatBytes(size)})`,
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
      this.emitLog('info', 'Starting CSV import');
      
      const source = this.config.connection.filePath || this.config.connection.url;
      if (!source) {
        throw new Error('No file path or URL configured');
      }

      // Get input stream
      const { stream, totalSize } = await this.getInputStream();
      
      // Parse CSV with streaming
      const result = await this.parseStream(stream, totalSize, ctx);

      const duration = Date.now() - startTime;
      this.updateScheduleMetadata(new Date(), true);

      this.emitLog('info', `CSV import completed: ${result.recordsProcessed} records in ${this.formatDuration(duration)}`);

      return {
        success: true,
        recordsProcessed: result.recordsProcessed,
        bytesProcessed: result.bytesProcessed,
        duration,
        metadata: {
          source,
          columns: result.columns,
          fileSize: totalSize,
          estimatedRows: result.recordsProcessed
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateScheduleMetadata(new Date(), false);
      
      this.emitLog('error', 'CSV import failed', error);
      
      return this.createExecutionError(
        'CSV_IMPORT_FAILED',
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
      const { stream } = await this.getInputStream();
      
      return new Promise((resolve, reject) => {
        const rows: any[] = [];
        
        Papa.parse(stream as any, {
          header: this.config.options.header !== false,
          delimiter: this.config.options.delimiter,
          skipEmptyLines: this.config.options.skipEmptyLines !== false,
          step: (result) => {
            if (result.errors.length > 0 && !this.config.options.skipLinesWithError) {
              reject(new Error(`Parse error: ${result.errors[0].message}`));
              return;
            }
            
            if (result.data && rows.length < limit) {
              rows.push(this.transformRow(result.data, rows.length));
            }
            
            if (rows.length >= limit) {
              resolve(rows);
            }
          },
          complete: () => {
            resolve(rows);
          },
          error: (error) => {
            reject(error);
          }
        });
      });
    } catch (error) {
      throw error;
    }
  }

  private async testParsing(stream: Readable): Promise<TestConnectionResult> {
    return new Promise((resolve) => {
      let lineCount = 0;
      let hasHeaders = false;

      Papa.parse(stream as any, {
        header: false,
        step: (result) => {
          lineCount++;
          
          if (lineCount === 1 && result.data && Array.isArray(result.data)) {
            // Check if first row looks like headers
            const firstRow = result.data as string[];
            hasHeaders = firstRow.every(cell => 
              typeof cell === 'string' && 
              cell.trim().length > 0 && 
              !cell.match(/^\d+$/)
            );
          }
          
          if (lineCount >= 5) {
            resolve({
              success: true,
              message: `Successfully parsed ${lineCount} sample rows${hasHeaders ? ' with headers' : ''}`
            });
          }
        },
        error: (error) => {
          resolve({
            success: false,
            error: `Parse error: ${error.message}`
          });
        },
        complete: () => {
          resolve({
            success: true,
            message: `Successfully parsed ${lineCount} rows`
          });
        }
      });
    });
  }

  private async getInputStream(): Promise<{ stream: Readable; totalSize: number }> {
    if (this.config.connection.url) {
      const response = await fetch(this.config.connection.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const totalSize = parseInt(response.headers.get('content-length') || '0');
      return {
        stream: response.body as any,
        totalSize
      };
    } else {
      const filePath = this.config.connection.filePath!;
      const stats = fs.statSync(filePath);
      
      return {
        stream: fs.createReadStream(filePath, { 
          encoding: this.config.options.encoding as BufferEncoding || 'utf8' 
        }),
        totalSize: stats.size
      };
    }
  }

  private async parseStream(
    stream: Readable, 
    totalSize: number, 
    ctx: ExecutionContext
  ): Promise<{
    recordsProcessed: number;
    bytesProcessed: number;
    columns: string[];
  }> {
    return new Promise((resolve, reject) => {
      let recordsProcessed = 0;
      let bytesProcessed = 0;
      let columns: string[] = [];
      let headersParsed = false;

      Papa.parse(stream as any, {
        header: this.config.options.header !== false,
        delimiter: this.config.options.delimiter,
        skipEmptyLines: this.config.options.skipEmptyLines !== false,
        
        step: (result) => {
          this.checkAborted();
          
          if (result.errors.length > 0 && !this.config.options.skipLinesWithError) {
            reject(new Error(`Parse error on line ${recordsProcessed + 1}: ${result.errors[0].message}`));
            return;
          }

          if (result.data) {
            // Capture column names
            if (!headersParsed) {
              if (this.config.options.header !== false && result.meta.fields) {
                columns = this.config.options.columns || result.meta.fields;
              } else if (Array.isArray(result.data)) {
                columns = this.config.options.columns || 
                  Array.from({ length: result.data.length }, (_, i) => `Column${i + 1}`);
              }
              headersParsed = true;
            }

            // Transform and process row
            const transformedRow = this.transformRow(result.data, recordsProcessed);
            
            // Here you would typically insert into database
            // For now, we'll just count the records
            recordsProcessed++;
            
            // Estimate bytes processed (rough approximation)
            const rowSize = JSON.stringify(result.data).length;
            bytesProcessed += rowSize;

            // Emit progress
            if (recordsProcessed % 1000 === 0) {
              const progress: ProgressInfo = {
                percent: totalSize > 0 ? Math.min((bytesProcessed / totalSize) * 100, 99) : 0,
                recordsProcessed,
                currentStep: `Processed ${recordsProcessed.toLocaleString()} records`,
                bytesProcessed,
                totalBytes: totalSize
              };
              
              this.emitProgress(progress);
            }
          }
        },

        complete: () => {
          // Final progress
          this.emitProgress({
            percent: 100,
            recordsProcessed,
            currentStep: 'Import completed',
            bytesProcessed,
            totalBytes: totalSize
          });
          
          resolve({
            recordsProcessed,
            bytesProcessed,
            columns
          });
        },

        error: (error) => {
          reject(error);
        }
      });
    });
  }

  private transformRow(row: any, index: number): any {
    let transformed = row;

    // Apply type conversions
    if (typeof transformed === 'object' && transformed !== null) {
      transformed = this.applyTypeConversions(transformed);
    }

    // Apply custom transform function
    if (this.config.options.transform) {
      try {
        const transformFunction = new Function('row', 'index', `return (${this.config.options.transform})(row, index);`);
        transformed = transformFunction(transformed, index);
      } catch (error) {
        this.emitLog('warn', `Transform error on row ${index + 1}: ${error}`, { row, error });
      }
    }

    return transformed;
  }

  private applyTypeConversions(row: any): any {
    const converted = { ...row };

    // Convert date columns
    if (this.config.options.dateColumns) {
      for (const column of this.config.options.dateColumns) {
        if (converted[column] && typeof converted[column] === 'string') {
          const date = new Date(converted[column]);
          if (!isNaN(date.getTime())) {
            converted[column] = date;
          }
        }
      }
    }

    // Convert number columns
    if (this.config.options.numberColumns) {
      for (const column of this.config.options.numberColumns) {
        if (converted[column] && typeof converted[column] === 'string') {
          const num = parseFloat(converted[column]);
          if (!isNaN(num)) {
            converted[column] = num;
          }
        }
      }
    }

    // Convert boolean columns
    if (this.config.options.booleanColumns) {
      for (const column of this.config.options.booleanColumns) {
        if (converted[column] !== undefined) {
          const value = String(converted[column]).toLowerCase();
          converted[column] = value === 'true' || value === '1' || value === 'yes' || value === 'y';
        }
      }
    }

    return converted;
  }

  private inferColumnTypes(rows: any[]): ColumnInfo[] {
    if (rows.length === 0) return [];
    
    const columns: ColumnInfo[] = [];
    const firstRow = rows[0];
    
    if (typeof firstRow === 'object' && firstRow !== null) {
      Object.keys(firstRow).forEach(key => {
        const values = rows.map(row => row[key]).filter(val => val != null);
        const type = this.inferColumnType(values);
        
        columns.push({
          name: key,
          type,
          nullable: values.length < rows.length,
          primaryKey: false
        });
      });
    }
    
    return columns;
  }

  private inferColumnType(values: any[]): string {
    if (values.length === 0) return 'string';
    
    const sample = values.slice(0, Math.min(100, values.length));
    
    // Check if all values are numbers
    if (sample.every(val => !isNaN(Number(val)))) {
      return sample.some(val => String(val).includes('.')) ? 'decimal' : 'integer';
    }
    
    // Check if all values are booleans
    if (sample.every(val => {
      const str = String(val).toLowerCase();
      return ['true', 'false', '1', '0', 'yes', 'no', 'y', 'n'].includes(str);
    })) {
      return 'boolean';
    }
    
    // Check if all values are dates
    if (sample.every(val => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && String(val).match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/);
    })) {
      return 'datetime';
    }
    
    return 'string';
  }
}