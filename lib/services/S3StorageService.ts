/**
 * S3 Storage Service
 * 
 * Provides integration with S3-compatible storage services including:
 * - Amazon S3
 * - MinIO
 * - DigitalOcean Spaces
 * - Wasabi
 * - Backblaze B2
 * - Any S3-compatible storage
 * 
 * Features:
 * - Upload/download files
 * - List objects and buckets
 * - Stream large files
 * - Presigned URLs
 * - Batch operations
 */

import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  ListObjectsV2Command,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  ListBucketsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger';
import { Readable } from 'stream';

// ==================== TYPES ====================

export interface S3Config {
  provider: 's3' | 'minio' | 'digitalocean' | 'wasabi' | 'backblaze' | 'custom';
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  forcePathStyle?: boolean;
}

export interface S3Object {
  key: string;
  size: number;
  lastModified: Date;
  etag?: string;
  storageClass?: string;
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read' | 'public-read-write';
  serverSideEncryption?: 'AES256' | 'aws:kms';
}

export interface DownloadOptions {
  range?: string;
  versionId?: string;
}

export interface ListOptions {
  prefix?: string;
  maxKeys?: number;
  continuationToken?: string;
}

// ==================== S3 STORAGE SERVICE ====================

export class S3StorageService {
  private clients: Map<string, S3Client> = new Map();

  /**
   * Get or create S3 client for a configuration
   */
  private getClient(config: S3Config): S3Client {
    const configKey = JSON.stringify(config);
    
    if (this.clients.has(configKey)) {
      return this.clients.get(configKey)!;
    }

    // Determine endpoint based on provider
    let endpoint = config.endpoint;
    
    if (!endpoint) {
      switch (config.provider) {
        case 's3':
          endpoint = `https://s3.${config.region}.amazonaws.com`;
          break;
        case 'digitalocean':
          endpoint = `https://${config.region}.digitaloceanspaces.com`;
          break;
        case 'wasabi':
          endpoint = `https://s3.${config.region}.wasabisys.com`;
          break;
        case 'backblaze':
          endpoint = `https://s3.${config.region}.backblazeb2.com`;
          break;
        case 'minio':
          // MinIO requires explicit endpoint
          if (!config.endpoint) {
            throw new Error('Endpoint required for MinIO');
          }
          endpoint = config.endpoint;
          break;
        case 'custom':
          if (!config.endpoint) {
            throw new Error('Endpoint required for custom S3 provider');
          }
          endpoint = config.endpoint;
          break;
      }
    }

    const client = new S3Client({
      endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle ?? (config.provider === 'minio'),
    });

    this.clients.set(configKey, client);
    
    logger.info('S3 client created', 's3-storage', {
      provider: config.provider,
      region: config.region,
      bucket: config.bucket,
    });

    return client;
  }

  /**
   * Upload data to S3
   */
  async uploadData(
    config: S3Config,
    key: string,
    data: string | Buffer | Readable,
    options: UploadOptions = {}
  ): Promise<{ success: boolean; etag?: string; location: string }> {
    const client = this.getClient(config);

    try {
      logger.info(`Uploading to S3: ${key}`, 's3-storage', {
        bucket: config.bucket,
        size: typeof data === 'string' ? data.length : 'stream',
      });

      const command = new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: data,
        ContentType: options.contentType || 'application/octet-stream',
        Metadata: options.metadata,
        ACL: options.acl,
        ServerSideEncryption: options.serverSideEncryption,
      });

      const result = await client.send(command);

      const location = `s3://${config.bucket}/${key}`;

      logger.success(`Upload successful: ${key}`, 's3-storage', {
        bucket: config.bucket,
        etag: result.ETag,
      });

      return {
        success: true,
        etag: result.ETag,
        location,
      };

    } catch (error) {
      logger.error(`Upload failed: ${key}`, 's3-storage', {
        bucket: config.bucket,
        error,
      });
      throw error;
    }
  }

  /**
   * Download data from S3
   */
  async downloadData(
    config: S3Config,
    key: string,
    options: DownloadOptions = {}
  ): Promise<{ data: Readable; metadata: any }> {
    const client = this.getClient(config);

    try {
      logger.info(`Downloading from S3: ${key}`, 's3-storage', {
        bucket: config.bucket,
      });

      const command = new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Range: options.range,
        VersionId: options.versionId,
      });

      const result = await client.send(command);

      if (!result.Body) {
        throw new Error('No data received from S3');
      }

      logger.success(`Download successful: ${key}`, 's3-storage', {
        bucket: config.bucket,
        size: result.ContentLength,
      });

      return {
        data: result.Body as Readable,
        metadata: {
          contentType: result.ContentType,
          contentLength: result.ContentLength,
          lastModified: result.LastModified,
          etag: result.ETag,
          metadata: result.Metadata,
        },
      };

    } catch (error) {
      logger.error(`Download failed: ${key}`, 's3-storage', {
        bucket: config.bucket,
        error,
      });
      throw error;
    }
  }

  /**
   * List objects in bucket
   */
  async listObjects(
    config: S3Config,
    options: ListOptions = {}
  ): Promise<{ objects: S3Object[]; hasMore: boolean; continuationToken?: string }> {
    const client = this.getClient(config);

    try {
      const command = new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: options.prefix,
        MaxKeys: options.maxKeys || 1000,
        ContinuationToken: options.continuationToken,
      });

      const result = await client.send(command);

      const objects: S3Object[] = (result.Contents || []).map(obj => ({
        key: obj.Key!,
        size: obj.Size || 0,
        lastModified: obj.LastModified!,
        etag: obj.ETag,
        storageClass: obj.StorageClass,
      }));

      logger.info(`Listed ${objects.length} objects in S3`, 's3-storage', {
        bucket: config.bucket,
        prefix: options.prefix,
      });

      return {
        objects,
        hasMore: result.IsTruncated || false,
        continuationToken: result.NextContinuationToken,
      };

    } catch (error) {
      logger.error('Failed to list S3 objects', 's3-storage', {
        bucket: config.bucket,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete object from S3
   */
  async deleteObject(config: S3Config, key: string): Promise<boolean> {
    const client = this.getClient(config);

    try {
      const command = new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      });

      await client.send(command);

      logger.info(`Deleted from S3: ${key}`, 's3-storage', {
        bucket: config.bucket,
      });

      return true;

    } catch (error) {
      logger.error(`Delete failed: ${key}`, 's3-storage', {
        bucket: config.bucket,
        error,
      });
      throw error;
    }
  }

  /**
   * Get object metadata
   */
  async getObjectMetadata(
    config: S3Config,
    key: string
  ): Promise<{
    size: number;
    lastModified: Date;
    contentType?: string;
    metadata?: Record<string, string>;
  }> {
    const client = this.getClient(config);

    try {
      const command = new HeadObjectCommand({
        Bucket: config.bucket,
        Key: key,
      });

      const result = await client.send(command);

      return {
        size: result.ContentLength || 0,
        lastModified: result.LastModified!,
        contentType: result.ContentType,
        metadata: result.Metadata,
      };

    } catch (error) {
      logger.error(`Get metadata failed: ${key}`, 's3-storage', {
        bucket: config.bucket,
        error,
      });
      throw error;
    }
  }

  /**
   * Generate presigned URL for temporary access
   */
  async generatePresignedUrl(
    config: S3Config,
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const client = this.getClient(config);

    try {
      const command = new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
      });

      const url = await getSignedUrl(client, command, { expiresIn });

      logger.info(`Generated presigned URL: ${key}`, 's3-storage', {
        bucket: config.bucket,
        expiresIn,
      });

      return url;

    } catch (error) {
      logger.error(`Presigned URL generation failed: ${key}`, 's3-storage', {
        bucket: config.bucket,
        error,
      });
      throw error;
    }
  }

  /**
   * Test S3 connection
   */
  async testConnection(config: S3Config): Promise<{
    success: boolean;
    message: string;
    bucketsAccessible?: string[];
  }> {
    const client = this.getClient(config);

    try {
      // Try to list buckets
      const command = new ListBucketsCommand({});
      const result = await client.send(command);

      const buckets = (result.Buckets || []).map(b => b.Name!);

      logger.success('S3 connection successful', 's3-storage', {
        provider: config.provider,
        bucketsFound: buckets.length,
      });

      return {
        success: true,
        message: `Successfully connected to ${config.provider}`,
        bucketsAccessible: buckets,
      };

    } catch (error) {
      logger.error('S3 connection failed', 's3-storage', {
        provider: config.provider,
        error,
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * Upload JSON data
   */
  async uploadJSON(
    config: S3Config,
    key: string,
    data: any,
    options: UploadOptions = {}
  ): Promise<{ success: boolean; location: string }> {
    const jsonString = JSON.stringify(data, null, 2);
    
    return this.uploadData(config, key, jsonString, {
      ...options,
      contentType: 'application/json',
    });
  }

  /**
   * Upload CSV data
   */
  async uploadCSV(
    config: S3Config,
    key: string,
    data: any[],
    options: UploadOptions = {}
  ): Promise<{ success: boolean; location: string }> {
    if (data.length === 0) {
      throw new Error('No data to upload');
    }

    // Generate CSV
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Escape values with commas or quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');

    return this.uploadData(config, key, csv, {
      ...options,
      contentType: 'text/csv',
    });
  }

  /**
   * Download and parse JSON
   */
  async downloadJSON(config: S3Config, key: string): Promise<any> {
    const { data } = await this.downloadData(config, key);
    
    // Convert stream to string
    const chunks: Buffer[] = [];
    for await (const chunk of data) {
      chunks.push(chunk);
    }
    
    const jsonString = Buffer.concat(chunks).toString('utf-8');
    return JSON.parse(jsonString);
  }

  /**
   * Download and parse CSV
   */
  async downloadCSV(config: S3Config, key: string): Promise<any[]> {
    const { data } = await this.downloadData(config, key);
    
    // Convert stream to string
    const chunks: Buffer[] = [];
    for await (const chunk of data) {
      chunks.push(chunk);
    }
    
    const csvString = Buffer.concat(chunks).toString('utf-8');
    
    // Simple CSV parser
    const lines = csvString.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const records: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });
        records.push(record);
      }
    }

    return records;
  }

  /**
   * Parse CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  /**
   * Batch upload multiple files
   */
  async batchUpload(
    config: S3Config,
    files: Array<{ key: string; data: any; options?: UploadOptions }>
  ): Promise<Array<{ key: string; success: boolean; error?: string }>> {
    const results = await Promise.allSettled(
      files.map(file => 
        this.uploadData(config, file.key, file.data, file.options)
      )
    );

    return results.map((result, index) => ({
      key: files[index].key,
      success: result.status === 'fulfilled',
      error: result.status === 'rejected' ? String(result.reason) : undefined,
    }));
  }

  /**
   * Copy object within S3
   */
  async copyObject(
    config: S3Config,
    sourceKey: string,
    destinationKey: string
  ): Promise<boolean> {
    const client = this.getClient(config);

    try {
      const command = new CopyObjectCommand({
        Bucket: config.bucket,
        CopySource: `${config.bucket}/${sourceKey}`,
        Key: destinationKey,
      });

      await client.send(command);

      logger.info(`Copied S3 object: ${sourceKey} → ${destinationKey}`, 's3-storage');

      return true;

    } catch (error) {
      logger.error('S3 copy failed', 's3-storage', { error });
      throw error;
    }
  }

  /**
   * Get bucket size and object count
   */
  async getBucketStats(config: S3Config, prefix?: string): Promise<{
    objectCount: number;
    totalSize: number;
  }> {
    let objectCount = 0;
    let totalSize = 0;
    let continuationToken: string | undefined;

    do {
      const result = await this.listObjects(config, {
        prefix,
        maxKeys: 1000,
        continuationToken,
      });

      objectCount += result.objects.length;
      totalSize += result.objects.reduce((sum, obj) => sum + obj.size, 0);

      continuationToken = result.continuationToken;

    } while (continuationToken);

    return { objectCount, totalSize };
  }
}

// Export singleton instance
export const s3StorageService = new S3StorageService();

