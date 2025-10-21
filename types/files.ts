// File Management Types for ETL

export interface FileMetadata {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  checksum: string; // MD5 or SHA-256 hash for delta detection
  width?: number; // For images
  height?: number; // For images
  dimensions?: string; // e.g., "1920x1080"
  createdAt: Date;
  modifiedAt: Date;
  accessedAt?: Date;
  tags?: string[];
  metadata?: Record<string, any>; // Additional metadata (EXIF for images, etc.)
}

export interface FileIndex {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  basePath: string;
  filePattern?: string; // e.g., "*.jpg", "profile_*.png"
  fileCount: number;
  totalSize: number;
  files: FileMetadata[];
  createdAt: Date;
  updatedAt: Date;
  lastScannedAt?: Date;
}

export interface FileDelta {
  id: string;
  indexId: string;
  previousSnapshotId?: string;
  currentSnapshotId: string;
  added: FileMetadata[]; // New files
  removed: FileMetadata[]; // Deleted files
  modified: FileMetadata[]; // Changed files (based on checksum)
  unchanged: FileMetadata[]; // Files that haven't changed
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  unchangedCount: number;
  createdAt: Date;
}

export interface FileSnapshot {
  id: string;
  indexId: string;
  version: number;
  fileCount: number;
  totalSize: number;
  files: FileMetadata[];
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface FileCollectionConfig {
  type: 'file_collection';
  basePath: string;
  fileTypes?: string[]; // e.g., ['jpg', 'png', 'gif']
  recursive?: boolean;
  filePattern?: string;
  includeHidden?: boolean;
  followSymlinks?: boolean;
  maxFileSize?: number; // in bytes
  extractMetadata?: boolean;
  calculateChecksum?: boolean;
  checksumAlgorithm?: 'md5' | 'sha256';
}

export type FileOperationType = 'add' | 'remove' | 'modify' | 'move' | 'copy';

export interface FileOperation {
  id: string;
  type: FileOperationType;
  sourceFile?: FileMetadata;
  targetFile?: FileMetadata;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

export interface FileCollectionStats {
  totalFiles: number;
  totalSize: number;
  fileTypeBreakdown: Record<string, number>; // e.g., { jpg: 150, png: 75 }
  averageFileSize: number;
  largestFile?: FileMetadata;
  smallestFile?: FileMetadata;
  oldestFile?: FileMetadata;
  newestFile?: FileMetadata;
}

// Image-specific types
export interface ImageMetadata extends FileMetadata {
  width: number;
  height: number;
  format: string; // jpg, png, gif, webp, etc.
  colorSpace?: string;
  hasAlpha?: boolean;
  exif?: Record<string, any>;
  thumbnail?: string; // Base64 thumbnail or path
}

export interface ImageComparisonResult {
  file1: ImageMetadata;
  file2: ImageMetadata;
  similarity: number; // 0-1 score
  differences: {
    dimensionChange: boolean;
    sizeChange: boolean;
    contentChange: boolean;
    visualDifference?: string; // Base64 diff image
  };
}

// Profile picture use case
export interface ProfilePictureCollection {
  id: string;
  userId?: string;
  userName?: string;
  images: ImageMetadata[];
  currentImage?: ImageMetadata;
  previousImages: ImageMetadata[];
  uploadHistory: {
    imageId: string;
    uploadedAt: Date;
    uploadedBy?: string;
    reason?: string;
  }[];
}

