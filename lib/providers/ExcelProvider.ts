import * as XLSX from 'xlsx';
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

export interface ExcelProviderConfig extends ProviderConfig {
  type: 'excel';
  connection: {
    filePath?: string;
    url?: string;
  };
  options: {
    sheetName?: string; // Specific sheet to import, if not specified use first sheet
    headerRow?: number; // Row number for headers (default: 1)
    range?: string; // Excel range (e.g., 'A1:D10')
    dateColumns?: string[]; // Columns to parse as dates
    numberColumns?: string[]; // Columns to parse as numbers
    booleanColumns?: string[]; // Columns to parse as booleans
    skipEmptyRows?: boolean; // Skip empty rows (default: true)
    raw?: boolean; // Read raw cell values (default: false)
    transform?: string; // JavaScript function to transform each row
  };
}

export class ExcelProvider extends BaseProvider {
  protected config: ExcelProviderConfig;

  constructor(config: ProviderConfig) {
    super(config);
    this.config = config as ExcelProviderConfig;
  }

  get type(): string {
    return 'excel';
  }

  get displayName(): string {
    return 'Excel Files';
  }

  get description(): string {
    return 'Import data from Excel files (XLS, XLSX) with automatic type detection and sheet selection';
  }

  async validateConfig(config?: Partial<ExcelProviderConfig>): Promise<ValidationResult> {
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
      if (!ext.endsWith('.xls') && !ext.endsWith('.xlsx') && !ext.endsWith('.xlsm')) {
        errors.push({
          field: 'connection.filePath',
          code: 'INVALID_FILE_TYPE',
          message: 'File must have .xls, .xlsx, or .xlsm extension'
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

      let buffer: Buffer;
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
        
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        size = buffer.length;
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
        buffer = fs.readFileSync(this.config.connection.filePath!);
      }

      // Test parsing
      const testResult = await this.testParsing(buffer);
      const latency = Date.now() - startTime;

      if (!testResult.success) {
        return testResult;
      }

      return {
        success: true,
        message: `Successfully connected to Excel file (${this.formatBytes(size)})${testResult.message ? ' - ' + testResult.message : ''}`,
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
      this.emitLog('info', 'Starting Excel import');
      
      const source = this.config.connection.filePath || this.config.connection.url;
      if (!source) {
        throw new Error('No file path or URL configured');
      }

      // Get input buffer
      const { buffer, totalSize } = await this.getInputBuffer();
      
      // Parse Excel file
      const result = await this.parseExcel(buffer, totalSize, ctx);

      const duration = Date.now() - startTime;
      this.updateScheduleMetadata(new Date(), true);

      this.emitLog('info', `Excel import completed: ${result.recordsProcessed} records in ${this.formatDuration(duration)}`);

      return {
        success: true,
        recordsProcessed: result.recordsProcessed,
        bytesProcessed: totalSize,
        duration,
        metadata: {
          source,
          columns: result.columns,
          fileSize: totalSize,
          sheetName: result.sheetName,
          totalSheets: result.totalSheets,
          estimatedRows: result.recordsProcessed
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateScheduleMetadata(new Date(), false);
      
      this.emitLog('error', 'Excel import failed', error);
      
      return this.createExecutionError(
        'EXCEL_IMPORT_FAILED',
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
      const { buffer } = await this.getInputBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      const sheetName = this.config.options.sheetName || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        throw new Error(`Sheet "${sheetName}" not found`);
      }

      // Convert to JSON with options
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        range: this.config.options.range,
        header: this.config.options.headerRow ? this.config.options.headerRow - 1 : undefined,
        defval: null,
        raw: this.config.options.raw || false
      });

      // Apply transformations and limit
      const rows = jsonData.slice(0, limit).map((row, index) => {
        return this.transformRow(row, index);
      });

      return rows;
    } catch (error) {
      throw error;
    }
  }

  private async testParsing(buffer: Buffer): Promise<TestConnectionResult> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer', sheetRows: 5 });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return {
          success: false,
          error: 'No sheets found in Excel file'
        };
      }

      const sheetName = this.config.options.sheetName || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        return {
          success: false,
          error: `Sheet "${sheetName}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`
        };
      }

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
      const rowCount = jsonData.length;

      return {
        success: true,
        message: `Found ${workbook.SheetNames.length} sheet(s), using "${sheetName}" with ${rowCount} sample rows`
      };
    } catch (error) {
      return {
        success: false,
        error: `Parse error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async getInputBuffer(): Promise<{ buffer: Buffer; totalSize: number }> {
    if (this.config.connection.url) {
      const response = await fetch(this.config.connection.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      return {
        buffer,
        totalSize: buffer.length
      };
    } else {
      const filePath = this.config.connection.filePath!;
      const stats = fs.statSync(filePath);
      const buffer = fs.readFileSync(filePath);
      
      return {
        buffer,
        totalSize: stats.size
      };
    }
  }

  private async parseExcel(
    buffer: Buffer,
    totalSize: number,
    ctx: ExecutionContext
  ): Promise<{
    recordsProcessed: number;
    columns: string[];
    sheetName: string;
    totalSheets: number;
  }> {
    this.checkAborted();

    // Read workbook
    this.emitLog('info', 'Reading Excel workbook...');
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('No sheets found in Excel file');
    }

    const sheetName = this.config.options.sheetName || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      throw new Error(`Sheet "${sheetName}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
    }

    this.emitLog('info', `Processing sheet "${sheetName}"...`);

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      range: this.config.options.range,
      header: this.config.options.headerRow ? this.config.options.headerRow - 1 : undefined,
      defval: null,
      raw: this.config.options.raw || false
    }) as any[];

    // Get column names
    const columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

    // Process rows
    let recordsProcessed = 0;
    const totalRecords = jsonData.length;

    for (let i = 0; i < jsonData.length; i++) {
      this.checkAborted();

      const row = jsonData[i];

      // Skip empty rows if configured
      if (this.config.options.skipEmptyRows !== false) {
        const isEmpty = Object.values(row).every(val => val === null || val === undefined || val === '');
        if (isEmpty) continue;
      }

      // Transform row
      const transformedRow = this.transformRow(row, i);

      // Here you would typically insert into database
      // For now, we'll just count the records
      recordsProcessed++;

      // Emit progress
      if (recordsProcessed % 1000 === 0 || recordsProcessed === totalRecords) {
        const progress: ProgressInfo = {
          percent: (recordsProcessed / totalRecords) * 100,
          recordsProcessed,
          currentStep: `Processed ${recordsProcessed.toLocaleString()} of ${totalRecords.toLocaleString()} records`,
          bytesProcessed: totalSize,
          totalBytes: totalSize
        };
        
        this.emitProgress(progress);
      }
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
      columns,
      sheetName,
      totalSheets: workbook.SheetNames.length
    };
  }

  private transformRow(row: any, index: number): any {
    let transformed = { ...row };

    // Apply type conversions
    transformed = this.applyTypeConversions(transformed);

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
        if (converted[column] !== null && converted[column] !== undefined) {
          // Excel stores dates as numbers (days since 1900-01-01)
          if (typeof converted[column] === 'number') {
            converted[column] = XLSX.SSF.parse_date_code(converted[column]);
          } else if (typeof converted[column] === 'string') {
            const date = new Date(converted[column]);
            if (!isNaN(date.getTime())) {
              converted[column] = date;
            }
          }
        }
      }
    }

    // Convert number columns
    if (this.config.options.numberColumns) {
      for (const column of this.config.options.numberColumns) {
        if (converted[column] !== null && converted[column] !== undefined) {
          if (typeof converted[column] === 'string') {
            const num = parseFloat(converted[column]);
            if (!isNaN(num)) {
              converted[column] = num;
            }
          }
        }
      }
    }

    // Convert boolean columns
    if (this.config.options.booleanColumns) {
      for (const column of this.config.options.booleanColumns) {
        if (converted[column] !== undefined && converted[column] !== null) {
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
    if (sample.every(val => typeof val === 'number' || !isNaN(Number(val)))) {
      return sample.some(val => String(val).includes('.')) ? 'decimal' : 'integer';
    }
    
    // Check if all values are booleans
    if (sample.every(val => typeof val === 'boolean' || ['true', 'false', '1', '0'].includes(String(val).toLowerCase()))) {
      return 'boolean';
    }
    
    // Check if all values are dates
    if (sample.every(val => {
      if (val instanceof Date) return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    })) {
      return 'datetime';
    }
    
    return 'string';
  }
}

