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

export interface MockDataField {
  name: string;
  type: 'id' | 'name' | 'email' | 'phone' | 'address' | 'company' | 'date' | 'datetime' | 'number' | 'decimal' | 'boolean' | 'text' | 'uuid' | 'url' | 'currency' | 'percentage' | 'enum';
  options?: {
    min?: number;
    max?: number;
    decimals?: number;
    enumValues?: string[];
    prefix?: string;
    suffix?: string;
    format?: string; // For dates: 'YYYY-MM-DD', 'MM/DD/YYYY', etc.
    length?: number; // For text fields
    nullable?: boolean;
    nullProbability?: number; // 0-1, probability of null values
  };
}

export interface MockProviderConfig extends ProviderConfig {
  type: 'mock';
  connection: {
    recordCount: number;
    batchSize?: number;
    seed?: number; // For reproducible data
  };
  options: {
    fields: MockDataField[];
    locale?: 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh';
    relationships?: {
      // Define relationships between fields (e.g., city should match country)
      field: string;
      dependsOn: string;
      mapping?: Record<string, string[]>;
    }[];
    customGenerators?: {
      [fieldName: string]: string; // JavaScript function as string
    };
    outputFormat?: 'objects' | 'csv' | 'json';
  };
}

export class MockProvider extends BaseProvider {
  private config: MockProviderConfig;
  private rng: () => number;

  // Mock data generators
  private readonly generators = {
    names: {
      first: ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Chris', 'Lisa', 'Robert', 'Maria', 'James', 'Anna', 'William', 'Jennifer', 'Richard', 'Jessica', 'Thomas', 'Ashley', 'Daniel', 'Amanda'],
      last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin']
    },
    companies: ['Acme Corp', 'Global Tech', 'Innovative Solutions', 'Digital Systems', 'Smart Industries', 'Future Enterprises', 'Alpha Technologies', 'Beta Dynamics', 'Gamma Solutions', 'Delta Corp', 'Epsilon Ltd', 'Zeta Systems', 'Theta Innovations', 'Kappa Group', 'Lambda Solutions'],
    domains: ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'example.org', 'test.net', 'demo.co', 'sample.io'],
    streets: ['Main St', 'Oak Ave', 'Park Rd', 'First St', 'Second Ave', 'Third St', 'Elm St', 'Maple Ave', 'Pine Rd', 'Cedar St', 'Washington Ave', 'Lincoln Blvd', 'Jefferson St', 'Adams Ave'],
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte'],
    states: ['NY', 'CA', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA'],
    countries: ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia', 'Japan', 'South Korea', 'Brazil', 'Mexico'],
    words: ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua']
  };

  constructor(config: ProviderConfig) {
    super(config);
    this.config = config as MockProviderConfig;
    this.rng = this.createSeededRNG(this.config.connection.seed || Date.now());
  }

  get type(): string {
    return 'mock';
  }

  get displayName(): string {
    return 'Mock Data Generator';
  }

  get description(): string {
    return 'Generate realistic fake data for testing and development purposes';
  }

  async validateConfig(config?: Partial<MockProviderConfig>): Promise<ValidationResult> {
    const configToValidate = config ? { ...this.config, ...config } : this.config;
    const errors: ValidationError[] = [];

    // Validate record count
    if (!configToValidate.connection.recordCount || configToValidate.connection.recordCount <= 0) {
      errors.push({
        field: 'connection.recordCount',
        code: 'INVALID_RECORD_COUNT',
        message: 'Record count must be a positive number'
      });
    }

    // Validate batch size
    if (configToValidate.connection.batchSize && configToValidate.connection.batchSize <= 0) {
      errors.push({
        field: 'connection.batchSize',
        code: 'INVALID_BATCH_SIZE',
        message: 'Batch size must be a positive number'
      });
    }

    // Validate fields
    if (!configToValidate.options.fields || configToValidate.options.fields.length === 0) {
      errors.push({
        field: 'options.fields',
        code: 'NO_FIELDS_DEFINED',
        message: 'At least one field must be defined'
      });
    } else {
      // Validate each field
      for (let i = 0; i < configToValidate.options.fields.length; i++) {
        const field = configToValidate.options.fields[i];
        
        if (!field.name) {
          errors.push({
            field: `options.fields[${i}].name`,
            code: 'MISSING_FIELD_NAME',
            message: 'Field name is required'
          });
        }

        if (!field.type) {
          errors.push({
            field: `options.fields[${i}].type`,
            code: 'MISSING_FIELD_TYPE',
            message: 'Field type is required'
          });
        }

        // Validate enum fields have values
        if (field.type === 'enum' && (!field.options?.enumValues || field.options.enumValues.length === 0)) {
          errors.push({
            field: `options.fields[${i}].options.enumValues`,
            code: 'MISSING_ENUM_VALUES',
            message: 'Enum fields must have enumValues defined'
          });
        }

        // Validate numeric constraints
        if (['number', 'decimal'].includes(field.type) && field.options) {
          if (field.options.min !== undefined && field.options.max !== undefined && field.options.min > field.options.max) {
            errors.push({
              field: `options.fields[${i}].options`,
              code: 'INVALID_RANGE',
              message: 'Min value must be less than or equal to max value'
            });
          }
        }
      }
    }

    // Validate custom generators
    if (configToValidate.options.customGenerators) {
      for (const [fieldName, generatorCode] of Object.entries(configToValidate.options.customGenerators)) {
        try {
          new Function('record', 'index', 'generators', generatorCode);
        } catch (err) {
          errors.push({
            field: `options.customGenerators.${fieldName}`,
            code: 'INVALID_GENERATOR',
            message: 'Invalid JavaScript generator function'
          });
        }
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
      // Generate a small sample to test the configuration
      const sampleSize = Math.min(5, this.config.connection.recordCount);
      const sampleData = this.generateRecords(sampleSize);

      const latency = Date.now() - startTime;

      return {
        success: true,
        message: `Generated ${sampleData.length} sample records successfully`,
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
      this.emitLog('info', 'Starting mock data generation');
      
      const totalRecords = this.config.connection.recordCount;
      const batchSize = this.config.connection.batchSize || Math.min(1000, totalRecords);
      
      let recordsProcessed = 0;
      const columns = this.config.options.fields.map(field => field.name);
      
      // Process in batches
      for (let i = 0; i < totalRecords; i += batchSize) {
        this.checkAborted();
        
        const batchRecordCount = Math.min(batchSize, totalRecords - i);
        const batchData = this.generateRecords(batchRecordCount, recordsProcessed);
        
        recordsProcessed += batchData.length;
        
        // Here you would typically insert the batch into a database
        // For now, we'll just emit progress
        
        const progress: ProgressInfo = {
          percent: (recordsProcessed / totalRecords) * 100,
          recordsProcessed,
          totalRecords,
          currentStep: `Generated ${recordsProcessed.toLocaleString()} of ${totalRecords.toLocaleString()} records`,
          bytesProcessed: recordsProcessed * this.estimateRecordSize(),
          totalBytes: totalRecords * this.estimateRecordSize()
        };
        
        this.emitProgress(progress);
      }

      const duration = Date.now() - startTime;
      this.updateScheduleMetadata(new Date(), true);

      this.emitLog('info', `Mock data generation completed: ${recordsProcessed} records in ${this.formatDuration(duration)}`);

      return {
        success: true,
        recordsProcessed,
        bytesProcessed: recordsProcessed * this.estimateRecordSize(),
        duration,
        metadata: {
          recordCount: recordsProcessed,
          columns,
          seed: this.config.connection.seed,
          fields: this.config.options.fields.length
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateScheduleMetadata(new Date(), false);
      
      this.emitLog('error', 'Mock data generation failed', error);
      
      return this.createExecutionError(
        'MOCK_GENERATION_FAILED',
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
    return this.generateRecords(Math.min(limit, this.config.connection.recordCount));
  }

  private generateRecords(count: number, startIndex = 0): any[] {
    const records: any[] = [];
    
    for (let i = 0; i < count; i++) {
      const record: any = {};
      const recordIndex = startIndex + i;
      
      for (const field of this.config.options.fields) {
        // Check if field should be null
        if (field.options?.nullable && field.options?.nullProbability) {
          if (this.rng() < field.options.nullProbability) {
            record[field.name] = null;
            continue;
          }
        }
        
        // Use custom generator if available
        if (this.config.options.customGenerators?.[field.name]) {
          try {
            const generatorFn = new Function('record', 'index', 'generators', this.config.options.customGenerators[field.name]);
            record[field.name] = generatorFn(record, recordIndex, this.generators);
            continue;
          } catch (err) {
            this.emitLog('warn', `Custom generator failed for field ${field.name}, using default`, err);
          }
        }
        
        // Generate value based on field type
        record[field.name] = this.generateFieldValue(field, recordIndex, record);
      }
      
      records.push(record);
    }
    
    return records;
  }

  private generateFieldValue(field: MockDataField, index: number, record: any): any {
    const options = field.options || {};
    
    switch (field.type) {
      case 'id':
        return (options.prefix || '') + (index + 1) + (options.suffix || '');
        
      case 'name':
        const firstName = this.randomFromArray(this.generators.names.first);
        const lastName = this.randomFromArray(this.generators.names.last);
        return `${firstName} ${lastName}`;
        
      case 'email':
        const emailName = this.randomFromArray(this.generators.names.first).toLowerCase();
        const emailLast = this.randomFromArray(this.generators.names.last).toLowerCase();
        const domain = this.randomFromArray(this.generators.domains);
        return `${emailName}.${emailLast}@${domain}`;
        
      case 'phone':
        const areaCode = this.randomInt(200, 999);
        const exchange = this.randomInt(200, 999);
        const number = this.randomInt(1000, 9999);
        return `(${areaCode}) ${exchange}-${number}`;
        
      case 'address':
        const streetNumber = this.randomInt(1, 9999);
        const street = this.randomFromArray(this.generators.streets);
        const city = this.randomFromArray(this.generators.cities);
        const state = this.randomFromArray(this.generators.states);
        const zip = this.randomInt(10000, 99999);
        return `${streetNumber} ${street}, ${city}, ${state} ${zip}`;
        
      case 'company':
        return this.randomFromArray(this.generators.companies);
        
      case 'date':
        const startDate = new Date(2020, 0, 1);
        const endDate = new Date();
        const randomTime = startDate.getTime() + this.rng() * (endDate.getTime() - startDate.getTime());
        const randomDate = new Date(randomTime);
        return options.format ? this.formatDate(randomDate, options.format) : randomDate.toISOString().split('T')[0];
        
      case 'datetime':
        const startDateTime = new Date(2020, 0, 1);
        const endDateTime = new Date();
        const randomDateTime = startDateTime.getTime() + this.rng() * (endDateTime.getTime() - startDateTime.getTime());
        return new Date(randomDateTime).toISOString();
        
      case 'number':
        const min = options.min ?? 0;
        const max = options.max ?? 100;
        return this.randomInt(min, max);
        
      case 'decimal':
        const decMin = options.min ?? 0;
        const decMax = options.max ?? 100;
        const decimals = options.decimals ?? 2;
        return parseFloat((decMin + this.rng() * (decMax - decMin)).toFixed(decimals));
        
      case 'boolean':
        return this.rng() < 0.5;
        
      case 'text':
        const wordCount = options.length || this.randomInt(3, 12);
        const words = [];
        for (let i = 0; i < wordCount; i++) {
          words.push(this.randomFromArray(this.generators.words));
        }
        return words.join(' ');
        
      case 'uuid':
        return this.generateUUID();
        
      case 'url':
        const protocol = this.rng() < 0.8 ? 'https' : 'http';
        const subdomain = this.rng() < 0.3 ? 'www.' : '';
        const domain = this.randomFromArray(this.generators.companies).toLowerCase().replace(/\s+/g, '');
        const tld = this.randomFromArray(['com', 'org', 'net', 'io', 'co']);
        return `${protocol}://${subdomain}${domain}.${tld}`;
        
      case 'currency':
        const amount = this.randomInt(options.min ?? 100, options.max ?? 10000) / 100;
        return `$${amount.toFixed(2)}`;
        
      case 'percentage':
        const percentage = this.randomInt(0, 100);
        return `${percentage}%`;
        
      case 'enum':
        if (!options.enumValues || options.enumValues.length === 0) {
          throw new Error(`Enum field ${field.name} has no enum values defined`);
        }
        return this.randomFromArray(options.enumValues);
        
      default:
        throw new Error(`Unsupported field type: ${field.type}`);
    }
  }

  private randomFromArray<T>(array: T[]): T {
    return array[Math.floor(this.rng() * array.length)];
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(this.rng() * (max - min + 1)) + min;
  }

  private generateUUID(): string {
    // Simple UUID v4 generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.floor(this.rng() * 16);
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('M', String(date.getMonth() + 1))
      .replace('D', String(date.getDate()));
  }

  private estimateRecordSize(): number {
    // Rough estimate of bytes per record
    let size = 0;
    for (const field of this.config.options.fields) {
      switch (field.type) {
        case 'id': size += 20; break;
        case 'name': size += 30; break;
        case 'email': size += 40; break;
        case 'phone': size += 15; break;
        case 'address': size += 80; break;
        case 'company': size += 30; break;
        case 'date': size += 10; break;
        case 'datetime': size += 25; break;
        case 'number': size += 8; break;
        case 'decimal': size += 12; break;
        case 'boolean': size += 5; break;
        case 'text': size += (field.options?.length || 8) * 6; break;
        case 'uuid': size += 36; break;
        case 'url': size += 50; break;
        case 'currency': size += 10; break;
        case 'percentage': size += 5; break;
        case 'enum': size += 15; break;
        default: size += 20;
      }
    }
    return size;
  }

  private createSeededRNG(seed: number): () => number {
    let x = seed;
    return () => {
      x = Math.sin(x) * 10000;
      return x - Math.floor(x);
    };
  }
}