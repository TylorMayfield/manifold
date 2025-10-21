import { DataProvider, DataProviderConfig, ExecutionResult } from '../types';

export interface FTPProviderConfig extends DataProviderConfig {
  type: 'ftp';
  host: string;
  port: number;
  username: string;
  password: string;
  secure?: boolean; // SFTP vs FTP
  filePath: string;
  fileType: 'csv' | 'json' | 'xml' | 'txt';
  hasHeaders?: boolean;
  delimiter?: string;
  encoding?: string;
}

export class FTPProvider implements DataProvider {
  private config: FTPProviderConfig;

  constructor(config: FTPProviderConfig) {
    this.config = config;
  }

  async validate(): Promise<{ valid: boolean; error?: string }> {
    try {
      const required = ['host', 'port', 'username', 'password', 'filePath'];
      for (const field of required) {
        if (!this.config[field as keyof FTPProviderConfig]) {
          return { valid: false, error: `${field} is required` };
        }
      }

      if (!this.config.fileType) {
        return { valid: false, error: 'File type is required' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Validation failed: ${error}` };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const validation = await this.validate();
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      if (this.config.secure) {
        return await this.testSFTP();
      } else {
        return await this.testFTP();
      }
    } catch (error) {
      return { success: false, error: `Connection test failed: ${error}` };
    }
  }

  private async testSFTP(): Promise<{ success: boolean; error?: string }> {
    try {
      const Client = require('ssh2-sftp-client');
      const sftp = new Client();
      
      await sftp.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password
      });
      
      await sftp.end();
      return { success: true };
    } catch (error) {
      return { success: false, error: `SFTP connection failed: ${error}` };
    }
  }

  private async testFTP(): Promise<{ success: boolean; error?: string }> {
    try {
      const ftp = require('basic-ftp');
      const client = new ftp.Client();
      
      await client.access({
        host: this.config.host,
        port: this.config.port,
        user: this.config.username,
        password: this.config.password
      });
      
      client.close();
      return { success: true };
    } catch (error) {
      return { success: false, error: `FTP connection failed: ${error}` };
    }
  }

  async execute(): Promise<ExecutionResult> {
    try {
      // Download file from FTP/SFTP
      const fileContent = await this.downloadFile();
      
      // Parse content based on file type
      const parsedData = this.parseFileContent(fileContent);
      
      return {
        data: parsedData,
        metadata: {
          filePath: this.config.filePath,
          fileType: this.config.fileType,
          secure: this.config.secure,
          rowCount: parsedData.length,
          columns: parsedData.length > 0 ? Object.keys(parsedData[0]) : [],
          executionTime: Date.now()
        }
      };
    } catch (error) {
      throw new Error(`FTP execution failed: ${error}`);
    }
  }

  private async downloadFile(): Promise<string> {
    if (this.config.secure) {
      return await this.downloadSFTP();
    } else {
      return await this.downloadFTP();
    }
  }

  private async downloadSFTP(): Promise<string> {
    const Client = require('ssh2-sftp-client');
    const sftp = new Client();
    
    try {
      await sftp.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password
      });
      
      const buffer = await sftp.get(this.config.filePath);
      return buffer.toString(this.config.encoding || 'utf8');
    } finally {
      await sftp.end();
    }
  }

  private async downloadFTP(): Promise<string> {
    const ftp = require('basic-ftp');
    const client = new ftp.Client();
    
    try {
      await client.access({
        host: this.config.host,
        port: this.config.port,
        user: this.config.username,
        password: this.config.password
      });
      
      const buffer = await client.downloadToBuffer(this.config.filePath);
      return buffer.toString(this.config.encoding || 'utf8');
    } finally {
      client.close();
    }
  }

  private parseFileContent(content: string): any[] {
    if (this.config.fileType === 'csv') {
      return this.parseCSV(content);
    } else if (this.config.fileType === 'json') {
      return this.parseJSON(content);
    } else {
      return this.parseText(content);
    }
  }

  private parseCSV(content: string): any[] {
    const Papa = require('papaparse');
    const delimiter = this.config.delimiter || ',';
    
    const result = Papa.parse(content, {
      header: this.config.hasHeaders,
      delimiter: delimiter,
      skipEmptyLines: true
    });
    
    if (result.errors.length > 0) {
      throw new Error(`CSV parsing error: ${result.errors[0].message}`);
    }
    
    return result.data;
  }

  private parseJSON(content: string): any[] {
    try {
      const data = JSON.parse(content);
      
      if (Array.isArray(data)) {
        return data;
      } else {
        // If it's an object, wrap it in an array
        return [data];
      }
    } catch (error) {
      throw new Error(`JSON parsing error: ${error}`);
    }
  }

  private parseText(content: string): any[] {
    const lines = content.split('\n').filter(line => line.trim());
    
    return lines.map((line, index) => ({
      content: line.trim(),
      line_number: index + 1
    }));
  }

  async preview(limit: number = 10): Promise<ExecutionResult> {
    // For FTP, preview is the same as execute but with a note about limit
    const result = await this.execute();
    
    if (result.data.length > limit) {
      result.data = result.data.slice(0, limit);
      result.metadata!.previewLimit = limit;
    }
    
    return result;
  }

  async getSchema(): Promise<any> {
    try {
      // Execute to get sample data for schema inference
      const result = await this.execute();
      const sampleData = result.data.slice(0, 5);
      
      if (sampleData.length === 0) {
        return { columns: [], fileType: this.config.fileType };
      }

      // Infer schema from sample data
      const columns = Object.keys(sampleData[0]).map(key => {
        const values = sampleData.map(row => row[key]);
        const types = values.map(v => typeof v);
        const uniqueTypes = [...new Set(types)];
        
        return {
          name: key,
          type: uniqueTypes.includes('number') ? 'number' : 
                uniqueTypes.includes('boolean') ? 'boolean' : 'string',
          nullable: values.some(v => v === null || v === undefined)
        };
      });

      return {
        columns,
        fileType: this.config.fileType,
        filePath: this.config.filePath
      };
    } catch (error) {
      throw new Error(`Schema introspection failed: ${error}`);
    }
  }

  getConfig(): FTPProviderConfig {
    return this.config;
  }
}
