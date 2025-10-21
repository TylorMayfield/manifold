import { DataProvider, ExecutionResult } from '../../types';
import { FileCollectionConfig, FileMetadata, FileIndex } from '../../types/files';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface FileCollectionProviderConfig extends FileCollectionConfig {
  type: 'file_collection';
}

export class FileCollectionProvider implements DataProvider {
  private config: FileCollectionProviderConfig;

  constructor(config: FileCollectionProviderConfig) {
    this.config = config;
  }

  async validate(): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!this.config.basePath) {
        return { valid: false, error: 'Base path is required' };
      }

      // Check if path exists
      if (!fs.existsSync(this.config.basePath)) {
        return { valid: false, error: `Path does not exist: ${this.config.basePath}` };
      }

      // Check if it's a directory
      const stats = fs.statSync(this.config.basePath);
      if (!stats.isDirectory()) {
        return { valid: false, error: 'Base path must be a directory' };
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

      // Try to read the directory
      fs.readdirSync(this.config.basePath);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: `Connection test failed: ${error}` };
    }
  }

  async execute(): Promise<ExecutionResult> {
    try {
      const files = await this.scanDirectory(this.config.basePath);
      
      return {
        data: files,
        metadata: {
          basePath: this.config.basePath,
          fileCount: files.length,
          totalSize: files.reduce((sum, f) => sum + f.fileSize, 0),
          fileTypes: [...new Set(files.map(f => f.fileType))],
          scannedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`File collection execution failed: ${error}`);
    }
  }

  async preview(limit: number = 10): Promise<ExecutionResult> {
    const result = await this.execute();
    
    return {
      ...result,
      data: result.data.slice(0, limit)
    };
  }

  async getSchema(): Promise<any> {
    return {
      fields: [
        { name: 'id', type: 'string', description: 'Unique file identifier' },
        { name: 'fileName', type: 'string', description: 'File name' },
        { name: 'filePath', type: 'string', description: 'Full file path' },
        { name: 'fileType', type: 'string', description: 'File extension' },
        { name: 'mimeType', type: 'string', description: 'MIME type' },
        { name: 'fileSize', type: 'number', description: 'File size in bytes' },
        { name: 'checksum', type: 'string', description: 'File checksum (MD5/SHA256)' },
        { name: 'createdAt', type: 'date', description: 'File creation date' },
        { name: 'modifiedAt', type: 'date', description: 'File modification date' },
        { name: 'width', type: 'number', description: 'Image width (if applicable)' },
        { name: 'height', type: 'number', description: 'Image height (if applicable)' }
      ]
    };
  }

  getConfig(): FileCollectionProviderConfig {
    return this.config;
  }

  private async scanDirectory(dirPath: string, recursive: boolean = true): Promise<FileMetadata[]> {
    const files: FileMetadata[] = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // Skip hidden files unless configured to include them
      if (!this.config.includeHidden && entry.name.startsWith('.')) {
        continue;
      }

      if (entry.isDirectory() && recursive && this.config.recursive !== false) {
        const subFiles = await this.scanDirectory(fullPath, recursive);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        // Check file type filter
        const ext = path.extname(entry.name).toLowerCase().substring(1);
        if (this.config.fileTypes && this.config.fileTypes.length > 0) {
          if (!this.config.fileTypes.includes(ext)) {
            continue;
          }
        }

        // Check file pattern
        if (this.config.filePattern) {
          const pattern = new RegExp(this.config.filePattern.replace('*', '.*'));
          if (!pattern.test(entry.name)) {
            continue;
          }
        }

        const fileMetadata = await this.getFileMetadata(fullPath);
        
        // Check file size limit
        if (this.config.maxFileSize && fileMetadata.fileSize > this.config.maxFileSize) {
          continue;
        }

        files.push(fileMetadata);
      }
    }

    return files;
  }

  private async getFileMetadata(filePath: string): Promise<FileMetadata> {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase().substring(1);
    const fileName = path.basename(filePath);
    
    // Calculate checksum if enabled
    let checksum = '';
    if (this.config.calculateChecksum !== false) {
      checksum = await this.calculateChecksum(filePath, this.config.checksumAlgorithm || 'md5');
    }

    // Get MIME type
    const mimeType = this.getMimeType(ext);

    // Basic metadata
    const metadata: FileMetadata = {
      id: checksum || `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileName,
      filePath,
      fileType: ext,
      mimeType,
      fileSize: stats.size,
      checksum,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      accessedAt: stats.atime
    };

    // Extract image metadata if it's an image
    if (this.isImageFile(ext) && this.config.extractMetadata !== false) {
      try {
        const imageMetadata = await this.getImageMetadata(filePath);
        Object.assign(metadata, imageMetadata);
      } catch (error) {
        console.warn(`Failed to extract image metadata for ${filePath}:`, error);
      }
    }

    return metadata;
  }

  private async calculateChecksum(filePath: string, algorithm: 'md5' | 'sha256' = 'md5'): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash(algorithm);
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private async getImageMetadata(filePath: string): Promise<Partial<FileMetadata>> {
    try {
      // Use sharp library if available for better image metadata
      const sharp = require('sharp');
      const metadata = await sharp(filePath).metadata();

      return {
        width: metadata.width,
        height: metadata.height,
        dimensions: `${metadata.width}x${metadata.height}`,
        metadata: {
          format: metadata.format,
          space: metadata.space,
          channels: metadata.channels,
          depth: metadata.depth,
          hasAlpha: metadata.hasAlpha,
          exif: metadata.exif
        }
      };
    } catch (error) {
      // Fallback to basic detection without sharp
      return {};
    }
  }

  private isImageFile(ext: string): boolean {
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico'];
    return imageExts.includes(ext.toLowerCase());
  }

  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      bmp: 'image/bmp',
      ico: 'image/x-icon',
      tiff: 'image/tiff',
      
      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      
      // Text
      txt: 'text/plain',
      csv: 'text/csv',
      json: 'application/json',
      xml: 'application/xml',
      
      // Archives
      zip: 'application/zip',
      tar: 'application/x-tar',
      gz: 'application/gzip',
      
      // Video
      mp4: 'video/mp4',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      
      // Audio
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg'
    };

    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }
}

